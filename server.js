import express from 'express';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 8000;
const DEFAULT_PROVIDER_PRIORITY = ['gemini', 'openai', 'claude', 'deepseek', 'grok', 'perplexity'];

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
  const providerKeys = {
    gemini: process.env.GEMINI_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    claude: process.env.CLAUDE_API_KEY,
    deepseek: process.env.DEEPSEEK_API_KEY,
    grok: process.env.GROK_API_KEY,
    perplexity: process.env.PERPLEXITY_API_KEY
  };
  const aiServiceEnabled = Object.values(providerKeys).some(Boolean);

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
  const configuredProviders = getConfiguredProviders().map(provider => provider.name);
  res.json({
    ok: true,
    aiServiceEnabled: configuredProviders.length > 0,
    configuredProviders
  });
});

const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

function parseProviderPriority() {
  const fromEnv = String(process.env.AI_PROVIDER_PRIORITY || '')
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);

  const ordered = fromEnv.length ? fromEnv : DEFAULT_PROVIDER_PRIORITY;
  return [...new Set(ordered)];
}

function getConfiguredProviders() {
  const providers = [
    {
      name: 'gemini',
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS || 20000),
      endpoint: (apiKey, model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    },
    {
      name: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      timeoutMs: Number(process.env.OPENAI_TIMEOUT_MS || 20000),
      endpoint: () => 'https://api.openai.com/v1/chat/completions'
    },
    {
      name: 'claude',
      apiKey: process.env.CLAUDE_API_KEY,
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-latest',
      timeoutMs: Number(process.env.CLAUDE_TIMEOUT_MS || 20000),
      endpoint: () => 'https://api.anthropic.com/v1/messages'
    },
    {
      name: 'deepseek',
      apiKey: process.env.DEEPSEEK_API_KEY,
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      timeoutMs: Number(process.env.DEEPSEEK_TIMEOUT_MS || 20000),
      endpoint: () => 'https://api.deepseek.com/v1/chat/completions'
    },
    {
      name: 'grok',
      apiKey: process.env.GROK_API_KEY,
      model: process.env.GROK_MODEL || 'grok-2-latest',
      timeoutMs: Number(process.env.GROK_TIMEOUT_MS || 20000),
      endpoint: () => 'https://api.x.ai/v1/chat/completions'
    },
    {
      name: 'perplexity',
      apiKey: process.env.PERPLEXITY_API_KEY,
      model: process.env.PERPLEXITY_MODEL || 'sonar',
      timeoutMs: Number(process.env.PERPLEXITY_TIMEOUT_MS || 20000),
      endpoint: () => 'https://api.perplexity.ai/chat/completions'
    }
  ];

  const priority = parseProviderPriority();
  const configuredMap = new Map(
    providers
      .filter(provider => Boolean(provider.apiKey))
      .map(provider => [provider.name, provider])
  );

  return priority
    .map(name => configuredMap.get(name))
    .filter(Boolean);
}

function withTimeout(fetchPromise, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return {
    controller,
    promise: fetchPromise(controller.signal).finally(() => clearTimeout(timer))
  };
}

function parseTextFromProvider(provider, data) {
  if (provider.name === 'gemini') {
    const candidate = data?.candidates?.[0];
    const parts = candidate?.content?.parts;
    return Array.isArray(parts) ? parts?.[0]?.text : '';
  }
  if (provider.name === 'claude') {
    const blocks = data?.content;
    if (Array.isArray(blocks)) {
      const textBlock = blocks.find(block => block?.type === 'text');
      return textBlock?.text || '';
    }
    return '';
  }
  const choices = data?.choices;
  if (Array.isArray(choices) && choices[0]?.message?.content) {
    return choices[0].message.content;
  }
  return '';
}

function buildProviderRequest(provider, combinedPrompt) {
  if (provider.name === 'gemini') {
    return {
      url: provider.endpoint(provider.apiKey, provider.model),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: combinedPrompt }] }]
      })
    };
  }

  if (provider.name === 'claude') {
    return {
      url: provider.endpoint(),
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': provider.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: provider.model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: combinedPrompt }]
      })
    };
  }

  return {
    url: provider.endpoint(),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [{ role: 'user', content: combinedPrompt }]
    })
  };
}

function getMockResponse({ prompt, featureType }) {
  return `MOCK_RESPONSE [${featureType || 'generic'}]: ${String(prompt || '').slice(0, 180)}`;
}

async function callProvider(provider, combinedPrompt) {
  const request = buildProviderRequest(provider, combinedPrompt);
  const { promise } = withTimeout(
    (signal) =>
      fetch(request.url, {
        method: 'POST',
        headers: request.headers,
        body: request.body,
        signal
      }),
    provider.timeoutMs
  );

  const response = await promise;
  if (!response.ok) {
    let message = `${provider.name} API error (${response.status}).`;
    try {
      const err = await response.json();
      message = err?.error?.message || err?.message || JSON.stringify(err) || message;
    } catch {
      const errText = await response.text().catch(() => '');
      if (errText) message = errText;
    }
    const error = new Error(message);
    error.statusCode = response.status;
    throw error;
  }

  const data = await response.json();
  const text = String(parseTextFromProvider(provider, data) || '').trim();
  if (!text) {
    throw new Error(`${provider.name} returned empty response.`);
  }
  return text;
}

async function handleAIGenerate(req, res, forcedProvider = '') {
  const { prompt, systemPrompt, featureType, provider } = req.body || {};
  const textPrompt = String(prompt || '').trim();
  const textSystem = String(systemPrompt || '').trim();
  const providerFromBody = String(provider || '').trim().toLowerCase();
  const providerToUse = String(forcedProvider || providerFromBody).trim().toLowerCase();
  const mockMode = String(process.env.APP_AI_MOCK_MODE || process.env.APP_TEST_MODE || 'false').toLowerCase() === 'true';

  if (!textPrompt) {
    return res.status(400).json({ error: 'Prompt is empty.' });
  }

  const combinedPrompt = `${textSystem}\n\nUser Input: ${textPrompt}`.trim();
  if (mockMode) {
    return res.json({ text: getMockResponse({ prompt: combinedPrompt, featureType }), provider: 'mock', source: 'mock' });
  }

  let providers = getConfiguredProviders();
  if (providerToUse) {
    providers = providers.filter(item => item.name === providerToUse);
  }
  if (providers.length === 0) {
    return res.status(400).json({ error: 'No AI provider configured on server.' });
  }

  const errors = [];
  try {
    for (const currentProvider of providers) {
      try {
        const text = await callProvider(currentProvider, combinedPrompt);
        return res.json({ text, provider: currentProvider.name, source: 'live' });
      } catch (providerError) {
        errors.push({
          provider: currentProvider.name,
          message: providerError.message
        });
      }
    }

    const fallbackToMock = String(process.env.APP_FALLBACK_TO_MOCK_ON_API_ERROR || 'true').toLowerCase() === 'true';
    if (fallbackToMock) {
      return res.status(200).json({
        text: getMockResponse({ prompt: combinedPrompt, featureType }),
        provider: 'mock',
        source: 'mock_fallback',
        errors
      });
    }

    return res.status(502).json({
      error: 'All configured AI providers failed.',
      errors
    });
  } catch (error) {
    console.error('AI orchestrator error:', error);
    return res.status(502).json({ error: 'AI request failed.' });
  }
}

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

