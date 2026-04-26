export const AUTO_PROVIDER_ORDER = ['deepseek', 'openai', 'gemini', 'claude'];
export const ALL_SUPPORTED_PROVIDERS = ['auto', 'deepseek', 'openai', 'gemini', 'claude', 'grok', 'perplexity'];

export function normalizeProviderName(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return ALL_SUPPORTED_PROVIDERS.includes(normalized) ? normalized : 'auto';
}

export function detectProvidersFromApiKey(apiKey) {
  const key = String(apiKey || '').trim();
  if (!key) return [];
  if (/^AIza[0-9A-Za-z\-_]{10,}$/.test(key)) return ['gemini'];
  if (/^sk-ant-[A-Za-z0-9\-_]{10,}$/.test(key)) return ['claude'];
  if (/^xai-[A-Za-z0-9\-_]{10,}$/.test(key)) return ['grok'];
  if (/^pplx-[A-Za-z0-9\-_]{10,}$/.test(key)) return ['perplexity'];
  if (/^sk-[A-Za-z0-9\-_]{10,}$/.test(key)) return ['deepseek', 'openai'];
  return [];
}

export function getProviderEnvConfig(providerName) {
  const name = String(providerName || '').toLowerCase();
  if (name === 'deepseek') {
    return {
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      timeoutMs: Number(process.env.DEEPSEEK_TIMEOUT_MS || 20000),
      endpoint: 'https://api.deepseek.com/v1/chat/completions'
    };
  }
  if (name === 'openai') {
    return {
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      timeoutMs: Number(process.env.OPENAI_TIMEOUT_MS || 20000),
      endpoint: 'https://api.openai.com/v1/chat/completions'
    };
  }
  if (name === 'gemini') {
    return {
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS || 20000),
      endpoint: 'https://generativelanguage.googleapis.com'
    };
  }
  if (name === 'claude') {
    return {
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-latest',
      timeoutMs: Number(process.env.CLAUDE_TIMEOUT_MS || 20000),
      endpoint: 'https://api.anthropic.com/v1/messages'
    };
  }
  if (name === 'grok') {
    return {
      model: process.env.GROK_MODEL || 'grok-2-latest',
      timeoutMs: Number(process.env.GROK_TIMEOUT_MS || 20000),
      endpoint: 'https://api.x.ai/v1/chat/completions'
    };
  }
  if (name === 'perplexity') {
    return {
      model: process.env.PERPLEXITY_MODEL || 'sonar',
      timeoutMs: Number(process.env.PERPLEXITY_TIMEOUT_MS || 20000),
      endpoint: 'https://api.perplexity.ai/chat/completions'
    };
  }
  return null;
}

export function toProviderRuntime(providerName, apiKey) {
  const config = getProviderEnvConfig(providerName);
  const key = String(apiKey || '').trim();
  if (!config || !key) return null;
  return {
    name: String(providerName || '').toLowerCase(),
    apiKey: key,
    model: config.model,
    timeoutMs: config.timeoutMs,
    endpoint: config.endpoint
  };
}

export function inferErrorCode(statusCode, message = '') {
  const msg = String(message || '').toLowerCase();
  if (statusCode === 401 || statusCode === 403 || msg.includes('invalid api key')) return 'INVALID_API_KEY';
  if (statusCode === 429 || msg.includes('rate limit')) return 'RATE_LIMIT';
  if (msg.includes('timeout') || msg.includes('aborted')) return 'TIMEOUT';
  return 'PROVIDER_ERROR';
}

export function normalizeProviderError(provider, statusCode, message = '') {
  const code = inferErrorCode(statusCode, message);
  if (code === 'INVALID_API_KEY') return `${provider}: Invalid API key.`;
  if (code === 'RATE_LIMIT') return `${provider}: Rate limit reached.`;
  if (code === 'TIMEOUT') return `${provider}: Request timeout.`;
  return `${provider}: Provider request failed.`;
}
