import crypto from 'crypto';

export function getBearerToken(req) {
  const header = String(req.headers.authorization || '');
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || '';
}

export function getSupabaseContext(req) {
  const token = getBearerToken(req);
  const url = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const anonKey = process.env.SUPABASE_ANON_KEY || '';

  if (!url || !anonKey || !token) {
    return null;
  }

  return { token, url, anonKey };
}

export async function getAuthenticatedUser(ctx) {
  const response = await fetch(`${ctx.url}/auth/v1/user`, {
    headers: {
      apikey: ctx.anonKey,
      Authorization: `Bearer ${ctx.token}`
    }
  });

  if (!response.ok) {
    throw new Error('Unauthorized');
  }

  const data = await response.json();
  if (!data?.id) {
    throw new Error('Unauthorized');
  }

  return data;
}

function getKeyCipherSecret() {
  const secret = String(process.env.API_KEY_ENCRYPTION_SECRET || '').trim();
  if (!secret) {
    throw new Error('API key encryption secret is not configured.');
  }
  return crypto.createHash('sha256').update(secret).digest();
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

function parseStoredApiKeys(rawDecryptedText = '') {
  const text = String(rawDecryptedText || '').trim();
  if (!text) return {};
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch { }
  return {};
}

async function getUserSettings(ctx, userId) {
  const response = await fetch(
    `${ctx.url}/rest/v1/user_settings?select=*&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
    {
      headers: {
        apikey: ctx.anonKey,
        Authorization: `Bearer ${ctx.token}`,
        Accept: 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch user settings');
  }

  const rows = await response.json();
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return null;

  let decryptedApiKey = '';
  try {
    decryptedApiKey = decryptApiKey(row.api_key);
  } catch {
    decryptedApiKey = '';
  }

  const providerApiKeys = parseStoredApiKeys(decryptedApiKey);

  return {
    ...row,
    providerApiKeys: {
      deepseek: providerApiKeys.deepseek || '',
      openai: providerApiKeys.openai || '',
      gemini: providerApiKeys.gemini || '',
      claude: providerApiKeys.claude || '',
      grok: providerApiKeys.grok || '',
      perplexity: providerApiKeys.perplexity || ''
    }
  };
}

export async function authMiddleware(req, res, next) {
  try {
    const ctx = getSupabaseContext(req);
    if (!ctx) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await getAuthenticatedUser(ctx);
    const settings = await getUserSettings(ctx, user.id);

    req.supabaseContext = ctx;
    req.userId = user.id;
    req.userEmail = user.email;
    req.userApiKeys = settings?.providerApiKeys || {};
    req.userProvider = settings?.provider || 'auto';

    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
