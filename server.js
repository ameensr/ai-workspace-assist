import express from 'express';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { generateResponse } from './services/ai/aiService.js';
import {
  normalizeProviderName as normalizeProviderExternal,
  detectProvidersFromApiKey as detectProvidersFromApiKeyExternal,
  ALL_SUPPORTED_PROVIDERS
} from './services/ai/providerUtils.js';

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 8000;
const USER_SETTINGS_TABLE = 'user_settings';
const USAGE_LOGS_TABLE = 'usage_logs';
const SUPPORTED_USER_PROVIDERS = ALL_SUPPORTED_PROVIDERS;

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.use((_, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

app.get('/runtime-config.js', (req, res) => {
  res.type('application/javascript; charset=utf-8');

  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
  const testMode = String(process.env.APP_TEST_MODE || 'true').toLowerCase() === 'true';
  const fallbackToMockOnApiError = String(process.env.APP_FALLBACK_TO_MOCK_ON_API_ERROR || 'true').toLowerCase() === 'true';
  const aiServiceEnabled = true;

  // NOTE: This config is visible to the browser. Do NOT include service-role keys here.
  const runtime = {
    supabaseUrl,
    supabaseAnonKey,
    testMode,
    fallbackToMockOnApiError,
    aiServiceEnabled,
  };

  res.send(`window.RUNTIME_APP_CONFIG = ${JSON.stringify(runtime)};`);
});

app.get('/api/health', (_, res) => {
  res.json({
    ok: true,
    aiServiceEnabled: true,
    byokOnly: true
  });
});

function getSupabaseRestConfig() {
  return {
    url: String(process.env.SUPABASE_URL || '').replace(/\/$/, ''),
    anonKey: process.env.SUPABASE_ANON_KEY || ''
  };
}

function getBearerToken(req) {
  const header = String(req.headers.authorization || '');
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || '';
}

function getSupabaseRequestContext(req, res) {
  const token = getBearerToken(req);
  return getSupabaseRequestContextFromToken(token, res);
}

function getSupabaseRequestContextFromToken(token, res = null) {
  const { url, anonKey } = getSupabaseRestConfig();

  if (!url || !anonKey) {
    if (res) res.status(500).json({ error: 'Supabase is not configured on server.' });
    return null;
  }
  if (!token) {
    if (res) res.status(401).json({ error: 'Missing Supabase session token.' });
    return null;
  }

  return { token, url, anonKey };
}

async function getAuthenticatedUser(ctx) {
  const response = await fetch(`${ctx.url}/auth/v1/user`, {
    headers: {
      apikey: ctx.anonKey,
      Authorization: `Bearer ${ctx.token}`
    }
  });

  if (!response.ok) {
    const error = new Error('Could not resolve authenticated user.');
    error.statusCode = response.status;
    throw error;
  }

  const data = await response.json();
  if (!data?.id) {
    const error = new Error('Could not resolve authenticated user.');
    error.statusCode = 401;
    throw error;
  }
  return data;
}

async function supabaseRest(ctx, path, options = {}) {
  const response = await fetch(`${ctx.url}${path}`, {
    ...options,
    headers: {
      apikey: ctx.anonKey,
      Authorization: `Bearer ${ctx.token}`,
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    let parsedMessage = message;
    try {
      const parsed = JSON.parse(message);
      parsedMessage = parsed?.message || parsed?.error || parsed?.hint || parsedMessage;
    } catch (_) { }
    const error = new Error(parsedMessage || `Supabase request failed (${response.status}).`);
    error.statusCode = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

async function supabaseRpc(ctx, functionName, payload = {}) {
  return supabaseRest(ctx, `/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

function normalizeProviderName(value) {
  return normalizeProviderExternal(value);
}

function detectProvidersFromApiKey(apiKey) {
  return detectProvidersFromApiKeyExternal(apiKey);
}

function getKeyCipherSecret() {
  const secret = String(process.env.API_KEY_ENCRYPTION_SECRET || '').trim();
  if (!secret) {
    throw new Error('API key encryption secret is not configured.');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

function encryptApiKey(plainText) {
  const text = String(plainText || '').trim();
  if (!text) return '';
  const key = getKeyCipherSecret();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${encrypted.toString('base64')}:${tag.toString('base64')}`;
}

function decryptApiKey(cipherText) {
  const value = String(cipherText || '').trim();
  if (!value) return '';
  const parts = value.split(':');
  if (parts.length !== 3) return '';
  const [ivPart, encryptedPart, tagPart] = parts;
  const key = getKeyCipherSecret();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivPart, 'base64'));
  decipher.setAuthTag(Buffer.from(tagPart, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, 'base64')),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
}

function maskApiKey(apiKey) {
  const key = String(apiKey || '').trim();
  if (!key) return '';
  if (key.length <= 6) return '*'.repeat(key.length);
  return `${key.slice(0, 4)}${'*'.repeat(Math.max(4, key.length - 6))}${key.slice(-2)}`;
}

function sanitizeApiKeyMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([name, key]) => SUPPORTED_USER_PROVIDERS.includes(name) && name !== 'auto' && typeof key === 'string')
      .map(([name, key]) => [name, key.trim()])
      .filter(([, key]) => Boolean(key))
  );
}

function parseStoredApiKeys(rawDecryptedText = '') {
  const text = String(rawDecryptedText || '').trim();
  if (!text) return {};
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return sanitizeApiKeyMap(parsed);
    }
  } catch { }
  const detected = detectProvidersFromApiKey(text);
  if (!detected.length) return {};
  const first = detected[0];
  return { [first]: text };
}

async function getUserSettings(ctx, userId) {
  const rows = await supabaseRest(
    ctx,
    `/rest/v1/${USER_SETTINGS_TABLE}?select=user_id,provider,api_key,theme,updated_at&user_id=eq.${encodeURIComponent(userId)}&limit=1`
  );
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return null;

  let decryptedApiKey = '';
  try {
    decryptedApiKey = decryptApiKey(row.api_key);
  } catch {
    decryptedApiKey = '';
  }
  const providerApiKeys = parseStoredApiKeys(decryptedApiKey);
  const mergedProviderApiKeys = {
    deepseek: providerApiKeys.deepseek || '',
    openai: providerApiKeys.openai || '',
    gemini: providerApiKeys.gemini || '',
    claude: providerApiKeys.claude || '',
    grok: providerApiKeys.grok || '',
    perplexity: providerApiKeys.perplexity || ''
  };

  return {
    ...row,
    provider: normalizeProviderName(row.provider || 'auto'),
    theme: row.theme === 'dark' ? 'dark' : 'light',
    decryptedApiKey,
    providerApiKeys: mergedProviderApiKeys
  };
}

async function insertUsageLog(ctx, payload) {
  try {
    await supabaseRest(ctx, `/rest/v1/${USAGE_LOGS_TABLE}`, {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Usage log insert failed:', error.message);
  }
}

const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/api/module-prompt-status', apiLimiter, async (req, res) => {
  const moduleKeys = String(req.query.modules || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
  const ctx = getSupabaseRequestContext(req, res);

  if (!ctx) return;
  if (moduleKeys.length === 0) {
    return res.json({ modules: [] });
  }

  try {
    const inList = moduleKeys.map(encodeURIComponent).join(',');
    const rows = await supabaseRest(ctx, `/rest/v1/master_prompts?select=id,module_key,title,prompt_content,status,updated_at,activated_at&status=eq.ACTIVE&module_key=in.(${inList})&order=activated_at.desc.nullslast,updated_at.desc`);
    const activeByModule = new Map();
    (Array.isArray(rows) ? rows : []).forEach(row => {
      if (!activeByModule.has(row.module_key)) {
        activeByModule.set(row.module_key, row);
      }
    });

    res.json({
      modules: moduleKeys.map(moduleKey => ({
        moduleKey,
        configured: activeByModule.has(moduleKey),
        prompt: activeByModule.get(moduleKey) || null
      }))
    });
  } catch (error) {
    console.error('Prompt status fetch failed:', error);
    res.status(502).json({ error: 'Prompt status request failed.' });
  }
});

app.get('/api/modules/:moduleKey/prompts', apiLimiter, async (req, res) => {
  const ctx = getSupabaseRequestContext(req, res);
  if (!ctx) return;

  try {
    const moduleKey = encodeURIComponent(req.params.moduleKey);
    const rows = await supabaseRest(ctx, `/rest/v1/master_prompts?select=id,module_key,title,prompt_content,status,updated_at,created_at,released_at,activated_at&module_key=eq.${moduleKey}&order=updated_at.desc`);
    res.json({ prompts: rows || [] });
  } catch (error) {
    res.status(error.statusCode || 502).json({ error: error.message || 'Could not load prompts.' });
  }
});

app.get('/api/modules/:moduleKey/prompts/active', apiLimiter, async (req, res) => {
  const ctx = getSupabaseRequestContext(req, res);
  if (!ctx) return;

  try {
    const moduleKey = encodeURIComponent(req.params.moduleKey);
    const rows = await supabaseRest(ctx, `/rest/v1/master_prompts?select=id,module_key,title,prompt_content,status,updated_at,activated_at&module_key=eq.${moduleKey}&status=eq.ACTIVE&limit=1`);
    res.json({ prompt: Array.isArray(rows) ? rows[0] || null : null });
  } catch (error) {
    res.status(error.statusCode || 502).json({ error: error.message || 'Could not load active prompt.' });
  }
});

app.post('/api/modules/:moduleKey/prompts/draft', apiLimiter, async (req, res) => {
  const ctx = getSupabaseRequestContext(req, res);
  if (!ctx) return;

  try {
    const prompt = await supabaseRpc(ctx, 'save_module_prompt_draft', {
      p_module_key: req.params.moduleKey,
      p_title: String(req.body?.title || '').trim(),
      p_prompt_content: String(req.body?.promptContent || '').trim()
    });
    res.json({ prompt });
  } catch (error) {
    res.status(error.statusCode || 502).json({ error: error.message || 'Could not save draft.' });
  }
});

app.put('/api/prompts/:promptId', apiLimiter, async (req, res) => {
  const ctx = getSupabaseRequestContext(req, res);
  if (!ctx) return;

  try {
    const prompt = await supabaseRpc(ctx, 'update_prompt_draft', {
      p_prompt_id: req.params.promptId,
      p_title: String(req.body?.title || '').trim(),
      p_prompt_content: String(req.body?.promptContent || '').trim()
    });
    res.json({ prompt });
  } catch (error) {
    res.status(error.statusCode || 502).json({ error: error.message || 'Could not update prompt.' });
  }
});

app.post('/api/prompts/:promptId/release', apiLimiter, async (req, res) => {
  const ctx = getSupabaseRequestContext(req, res);
  if (!ctx) return;

  try {
    const prompt = await supabaseRpc(ctx, 'approve_module_prompt', { p_prompt_id: req.params.promptId });
    res.json({ prompt });
  } catch (error) {
    res.status(error.statusCode || 502).json({ error: error.message || 'Could not approve prompt.' });
  }
});

app.post('/api/prompts/:promptId/approve', apiLimiter, async (req, res) => {
  const ctx = getSupabaseRequestContext(req, res);
  if (!ctx) return;

  try {
    const prompt = await supabaseRpc(ctx, 'approve_module_prompt', { p_prompt_id: req.params.promptId });
    res.json({ prompt });
  } catch (error) {
    res.status(error.statusCode || 502).json({ error: error.message || 'Could not approve prompt.' });
  }
});

app.post('/api/prompts/:promptId/activate', apiLimiter, async (req, res) => {
  const ctx = getSupabaseRequestContext(req, res);
  if (!ctx) return;

  try {
    const prompt = await supabaseRpc(ctx, 'activate_module_prompt', { p_prompt_id: req.params.promptId });
    res.json({ prompt });
  } catch (error) {
    res.status(error.statusCode || 502).json({ error: error.message || 'Could not activate prompt.' });
  }
});

app.post('/api/prompts/:promptId/deactivate', apiLimiter, async (req, res) => {
  const ctx = getSupabaseRequestContext(req, res);
  if (!ctx) return;

  try {
    const prompt = await supabaseRpc(ctx, 'deactivate_module_prompt', { p_prompt_id: req.params.promptId });
    res.json({ prompt });
  } catch (error) {
    res.status(error.statusCode || 502).json({ error: error.message || 'Could not deactivate prompt.' });
  }
});

function getMockResponse({ prompt, featureType }) {
  return `MOCK_RESPONSE [${featureType || 'generic'}]: ${String(prompt || '').slice(0, 180)}`;
}

async function validateProviderApiKey(providerName, apiKey) {
  const provider = normalizeProviderName(providerName);
  const key = String(apiKey || '').trim();
  if (!key || provider === 'auto') {
    return { valid: false, statusCode: 400, message: 'Missing provider or API key.' };
  }

  const defaultTimeoutMs = 15000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), defaultTimeoutMs);

  const requestByProvider = {
    openai: {
      url: 'https://api.openai.com/v1/models',
      options: {
        method: 'GET',
        headers: { Authorization: `Bearer ${key}` }
      }
    },
    deepseek: {
      url: 'https://api.deepseek.com/v1/models',
      options: {
        method: 'GET',
        headers: { Authorization: `Bearer ${key}` }
      }
    },
    gemini: {
      url: `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
      options: {
        method: 'GET'
      }
    },
    claude: {
      url: 'https://api.anthropic.com/v1/models',
      options: {
        method: 'GET',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01'
        }
      }
    },
    grok: {
      url: 'https://api.x.ai/v1/models',
      options: {
        method: 'GET',
        headers: { Authorization: `Bearer ${key}` }
      }
    },
    perplexity: {
      url: 'https://api.perplexity.ai/chat/completions',
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`
        },
        body: JSON.stringify({
          model: process.env.PERPLEXITY_MODEL || 'sonar',
          messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
          max_tokens: 8
        })
      }
    }
  };

  const request = requestByProvider[provider];
  if (!request) {
    clearTimeout(timer);
    return { valid: false, statusCode: 400, message: 'Unsupported provider.' };
  }

  try {
    const response = await fetch(request.url, {
      ...request.options,
      signal: controller.signal
    });
    const body = await response.text().catch(() => '');
    if (response.ok) {
      return { valid: true };
    }
    return {
      valid: false,
      statusCode: response.status,
      message: body || `${provider}: Provider request failed.`
    };
  } catch (error) {
    const isAbort = error?.name === 'AbortError';
    return {
      valid: false,
      statusCode: isAbort ? 408 : 502,
      message: isAbort ? `${provider}: Request timeout.` : (error.message || `${provider}: Provider request failed.`)
    };
  } finally {
    clearTimeout(timer);
  }
}

async function handleAIGenerate(req, res, forcedProvider = '') {
  const { prompt, systemPrompt, featureType, provider } = req.body || {};
  const textPrompt = String(prompt || '').trim();
  const textSystem = String(systemPrompt || '').trim();
  const providerFromBody = String(provider || '').trim().toLowerCase();
  const providerToUse = String(forcedProvider || providerFromBody).trim().toLowerCase();
  const mockMode = String(process.env.APP_AI_MOCK_MODE || process.env.APP_TEST_MODE || 'false').toLowerCase() === 'true';
  const requestType = String(featureType || 'generic').trim() || 'generic';

  if (!textPrompt) {
    return res.status(400).json({ error: 'Prompt is empty.' });
  }

  const combinedPrompt = `${textSystem}\n\nUser Input: ${textPrompt}`.trim();
  if (mockMode) {
    return res.json({ text: getMockResponse({ prompt: combinedPrompt, featureType }), provider: 'mock', source: 'mock' });
  }

  const authToken = getBearerToken(req);
  if (!authToken) {
    return res.status(401).json({ error: 'Missing Supabase session token.' });
  }
  const ctx = getSupabaseRequestContextFromToken(authToken);
  if (!ctx) {
    return res.status(401).json({ error: 'Missing Supabase session token.' });
  }

  let userId = '';
  let userSettings = null;
  try {
    const user = await getAuthenticatedUser(ctx);
    userId = user.id;
    userSettings = await getUserSettings(ctx, userId);
  } catch (error) {
    console.error('User settings resolution failed:', error.message);
    return res.status(error.statusCode || 401).json({ error: 'Could not resolve authenticated user.' });
  }

  const providerApiKeys = {
    deepseek: userSettings?.providerApiKeys?.deepseek || '',
    openai: userSettings?.providerApiKeys?.openai || '',
    gemini: userSettings?.providerApiKeys?.gemini || '',
    claude: userSettings?.providerApiKeys?.claude || '',
    grok: userSettings?.providerApiKeys?.grok || '',
    perplexity: userSettings?.providerApiKeys?.perplexity || ''
  };
  const selectedProvider = normalizeProviderName(
    providerToUse ||
    userSettings?.provider ||
    'auto'
  );

  if (!Object.values(providerApiKeys).some(Boolean)) {
    return res.status(400).json({ error: 'API key not configured' });
  }

  const startedAt = Date.now();
  const result = await generateResponse({
    provider: selectedProvider,
    apiKeys: providerApiKeys,
    prompt: combinedPrompt,
    options: {}
  });

  if (result.success) {
    await insertUsageLog(ctx, {
      user_id: userId,
      provider: result.provider,
      tokens: result.tokens || 0,
      module: requestType,
      request_type: requestType
    });
    console.log(JSON.stringify({
      event: 'ai_response',
      provider: result.provider,
      success: true,
      durationMs: Date.now() - startedAt
    }));
    return res.json({
      text: result.content,
      provider: result.provider,
      source: 'live',
      tokens: result.tokens || 0,
      standardized: {
        success: true,
        content: result.content,
        tokens: result.tokens || 0,
        provider: result.provider
      }
    });
  }

  console.log(JSON.stringify({
    event: 'ai_response',
    provider: selectedProvider,
    success: false,
    durationMs: Date.now() - startedAt
  }));
  const fallbackToMock = String(process.env.APP_FALLBACK_TO_MOCK_ON_API_ERROR || 'true').toLowerCase() === 'true';
  if (fallbackToMock) {
    return res.status(200).json({
      text: getMockResponse({ prompt: combinedPrompt, featureType }),
      provider: 'mock',
      source: 'mock_fallback',
      errors: result.errors || [],
      standardized: {
        success: false,
        content: '',
        tokens: 0,
        provider: 'none'
      }
    });
  }

  return res.status(502).json({
    error: result.errors?.[0]?.message || 'All configured AI providers failed.',
    errors: result.errors || []
  });
}

function getSecureContext(req, res) {
  const ctx = getSupabaseRequestContext(req, res);
  if (!ctx) return null;
  return ctx;
}

app.get('/api/settings', apiLimiter, async (req, res) => {
  const ctx = getSecureContext(req, res);
  if (!ctx) return;

  try {
    const user = await getAuthenticatedUser(ctx);
    const settings = await getUserSettings(ctx, user.id);
    const providerApiKeys = settings?.providerApiKeys || {};
    const activeProvider = settings?.provider || 'auto';
    const activeKey = activeProvider !== 'auto'
      ? String(providerApiKeys[activeProvider] || '')
      : String(Object.values(providerApiKeys).find(Boolean) || '');
    const detectedProviders = detectProvidersFromApiKey(activeKey);
    const apiKeysMasked = Object.fromEntries(
      Object.entries(providerApiKeys).map(([name, key]) => [name, maskApiKey(key)])
    );
    res.json({
      settings: {
        provider: activeProvider,
        theme: settings?.theme || 'light',
        hasApiKey: Object.values(providerApiKeys).some(Boolean),
        apiKeyMasked: maskApiKey(activeKey),
        apiKeysMasked,
        detectedProvider: detectedProviders[0] || null,
        detectedProviders,
        supportedProviders: SUPPORTED_USER_PROVIDERS
      }
    });
  } catch (error) {
    res.status(error.statusCode || 502).json({ error: error.message || 'Could not load settings.' });
  }
});

app.post('/api/settings', apiLimiter, async (req, res) => {
  const ctx = getSecureContext(req, res);
  if (!ctx) return;

  try {
    const user = await getAuthenticatedUser(ctx);
    const provider = normalizeProviderName(req.body?.provider);
    const theme = String(req.body?.theme || 'light').toLowerCase() === 'dark' ? 'dark' : 'light';
    const existingSettings = await getUserSettings(ctx, user.id);
    const clearApiKeys = Boolean(req.body?.clearApiKeys);
    const existingProviderKeys = clearApiKeys ? {} : (existingSettings?.providerApiKeys || {});
    const inputApiKeys = sanitizeApiKeyMap(req.body?.apiKeys || {});
    const rawApiKey = String(req.body?.apiKey || '').trim();
    if (rawApiKey && provider && provider !== 'auto') {
      inputApiKeys[provider] = rawApiKey;
    }
    const mergedProviderKeys = {
      ...existingProviderKeys,
      ...inputApiKeys
    };
    const cleanedProviderKeys = sanitizeApiKeyMap(mergedProviderKeys);
    const encryptedKey = Object.keys(cleanedProviderKeys).length
      ? encryptApiKey(JSON.stringify(cleanedProviderKeys))
      : null;
    const shouldWriteApiKeyField = clearApiKeys || Object.keys(inputApiKeys).length > 0;
    const updates = {
      user_id: user.id,
      provider,
      theme,
      ...(shouldWriteApiKeyField ? { api_key: encryptedKey } : {})
    };

    const rows = await supabaseRest(ctx, `/rest/v1/${USER_SETTINGS_TABLE}?on_conflict=user_id`, {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify(updates)
    });
    const saved = Array.isArray(rows) ? rows[0] : null;
    const decrypted = saved?.api_key ? decryptApiKey(saved.api_key) : '';
    const parsedSavedProviderKeys = sanitizeApiKeyMap(parseStoredApiKeys(decrypted));
    const selectedKey = provider !== 'auto'
      ? String(parsedSavedProviderKeys[provider] || '')
      : String(Object.values(parsedSavedProviderKeys).find(Boolean) || '');
    const detectedProviders = detectProvidersFromApiKey(selectedKey);
    const apiKeysMasked = Object.fromEntries(
      Object.entries(parsedSavedProviderKeys).map(([name, key]) => [name, maskApiKey(key)])
    );

    res.json({
      settings: {
        provider: normalizeProviderName(saved?.provider || provider),
        theme: (saved?.theme || theme) === 'dark' ? 'dark' : 'light',
        hasApiKey: Object.values(parsedSavedProviderKeys).some(Boolean),
        apiKeyMasked: maskApiKey(selectedKey),
        apiKeysMasked,
        detectedProvider: detectedProviders[0] || null,
        detectedProviders,
        supportedProviders: SUPPORTED_USER_PROVIDERS
      }
    });
  } catch (error) {
    res.status(error.statusCode || 502).json({ error: error.message || 'Could not save settings.' });
  }
});

app.post('/api/settings/test-key', apiLimiter, async (req, res) => {
  const ctx = getSecureContext(req, res);
  if (!ctx) return;
  try {
    await getAuthenticatedUser(ctx);
  } catch (error) {
    return res.status(error.statusCode || 401).json({ valid: false, error: 'Unauthorized request.' });
  }

  const providerInput = normalizeProviderName(req.body?.provider);
  const apiKey = String(req.body?.apiKey || '').trim();
  if (!apiKey) {
    return res.status(400).json({ valid: false, error: 'API key is required.' });
  }

  const detectedProviders = detectProvidersFromApiKey(apiKey);
  const fallbackProviders = SUPPORTED_USER_PROVIDERS.filter(name => name !== 'auto');
  const candidateProviders = [];
  const addCandidate = (name) => {
    const normalized = normalizeProviderName(name);
    if (normalized === 'auto') return;
    if (!candidateProviders.includes(normalized)) {
      candidateProviders.push(normalized);
    }
  };

  if (providerInput !== 'auto') {
    addCandidate(providerInput);
  }
  detectedProviders.forEach(addCandidate);
  if (!candidateProviders.length) {
    fallbackProviders.forEach(addCandidate);
  }

  const errors = [];
  for (const providerName of candidateProviders) {
    const result = await validateProviderApiKey(providerName, apiKey);

    if (result.valid) {
      return res.json({ valid: true, provider: providerName, detectedProviders });
    }

    errors.push({
      provider: providerName,
      statusCode: result.statusCode || 502,
      message: result.message || `${providerName}: Provider request failed.`
    });
  }

  return res.status(400).json({
    valid: false,
    error: errors[0]?.message || 'Invalid API key or provider is unreachable.',
    detectedProviders,
    errors
  });
});

app.get('/api/usage', apiLimiter, async (req, res) => {
  const ctx = getSecureContext(req, res);
  if (!ctx) return;

  try {
    const user = await getAuthenticatedUser(ctx);
    const rows = await supabaseRest(
      ctx,
      `/rest/v1/${USAGE_LOGS_TABLE}?select=provider,tokens,module,request_type,timestamp&user_id=eq.${encodeURIComponent(user.id)}&order=timestamp.desc&limit=2000`
    );
    const records = Array.isArray(rows) ? rows : [];
    const totalRequests = records.length;
    const totalTokens = records.reduce((sum, row) => sum + Number(row.tokens || 0), 0);
    const requestsByModule = records.reduce((acc, row) => {
      const key = String(row.request_type || row.module || 'generic');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const providerBreakdown = records.reduce((acc, row) => {
      const key = String(row.provider || 'unknown');
      if (!acc[key]) acc[key] = { requests: 0, tokens: 0 };
      acc[key].requests += 1;
      acc[key].tokens += Number(row.tokens || 0);
      return acc;
    }, {});

    res.json({
      usage: {
        totalRequests,
        totalTokens,
        requestsByModule,
        providerBreakdown
      }
    });
  } catch (error) {
    res.status(error.statusCode || 502).json({ error: error.message || 'Could not load usage.' });
  }
});

app.post('/api/ai/generate', apiLimiter, async (req, res) => {
  return handleAIGenerate(req, res);
});

// Backward-compat endpoint for existing clients.
app.post('/api/gemini', apiLimiter, async (req, res) => {
  return handleAIGenerate(req, res, 'gemini');
});

app.use(express.static(process.cwd(), { extensions: ['html'] }));

app.listen(port, () => {
  console.log(`Qaly AI server running on http://localhost:${port}`);
});
