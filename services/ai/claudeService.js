import { normalizeProviderError } from './providerUtils.js';

function parseAnthropicErrorMessage(bodyText = '') {
  const text = String(bodyText || '').trim();
  if (!text) return '';
  try {
    const parsed = JSON.parse(text);
    return String(
      parsed?.error?.message
      || parsed?.message
      || parsed?.error
      || text
    ).trim();
  } catch {
    return text;
  }
}

function isModelUnavailable(statusCode, bodyText = '') {
  const message = parseAnthropicErrorMessage(bodyText).toLowerCase();
  if (statusCode !== 400) return false;
  return message.includes('model')
    && (
      message.includes('not found')
      || message.includes('does not exist')
      || message.includes('invalid')
      || message.includes('unsupported')
      || message.includes('available')
    );
}

async function fetchClaudeModelIds(apiKey, signal) {
  const response = await fetch('https://api.anthropic.com/v1/models', {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    signal
  });
  if (!response.ok) return [];

  const body = await response.json().catch(() => ({}));
  const items = Array.isArray(body?.data) ? body.data : [];
  return items
    .map(item => String(item?.id || '').trim())
    .filter(Boolean);
}

export async function claudeService({ apiKey, prompt, options = {} }) {
  const timeoutMs = Number(options.timeoutMs || 20000);
  const preferredModel = String(options.model || 'claude-3-5-sonnet-latest').trim();
  let modelCandidates = [
    preferredModel,
    'claude-3-5-haiku-latest',
    'claude-3-5-sonnet-latest',
    'claude-3-haiku-20240307'
  ].filter((value, index, array) => Boolean(value) && array.indexOf(value) === index);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    let lastError = null;

    for (const model of modelCandidates) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }]
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        const modelUnavailable = isModelUnavailable(response.status, body);

        if (modelUnavailable) {
          lastError = { statusCode: response.status, message: parseAnthropicErrorMessage(body) || 'Claude model unavailable.' };
          continue;
        }

        const providerMessage = parseAnthropicErrorMessage(body) || body;
        const error = new Error(normalizeProviderError('claude', response.status, providerMessage));
        error.statusCode = response.status;
        throw error;
      }

      const data = await response.json();
      const content = String((data?.content || []).find(item => item?.type === 'text')?.text || '').trim();
      const usage = data?.usage || {};
      const tokens = Number(usage.input_tokens ?? 0) + Number(usage.output_tokens ?? 0);

      if (!content) {
        const emptyError = new Error('claude: Provider request failed.');
        emptyError.statusCode = 502;
        throw emptyError;
      }

      return {
        success: true,
        content,
        tokens: Number.isFinite(tokens) ? Math.max(0, Math.floor(tokens)) : 0,
        provider: 'claude',
        latencyMs: Date.now() - startedAt
      };
    }

    // If none of the known aliases worked, fetch model IDs available for this API key and retry.
    const discoveredModelIds = await fetchClaudeModelIds(apiKey, controller.signal);
    if (discoveredModelIds.length) {
      modelCandidates = [...modelCandidates, ...discoveredModelIds]
        .filter((value, index, array) => Boolean(value) && array.indexOf(value) === index);

      for (const model of modelCandidates.slice(4)) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model,
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }]
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          const body = await response.text().catch(() => '');
          const modelUnavailable = isModelUnavailable(response.status, body);
          if (modelUnavailable) {
            lastError = { statusCode: response.status, message: parseAnthropicErrorMessage(body) || 'Claude model unavailable.' };
            continue;
          }
          const providerMessage = parseAnthropicErrorMessage(body) || body;
          const error = new Error(normalizeProviderError('claude', response.status, providerMessage));
          error.statusCode = response.status;
          throw error;
        }

        const data = await response.json();
        const content = String((data?.content || []).find(item => item?.type === 'text')?.text || '').trim();
        const usage = data?.usage || {};
        const tokens = Number(usage.input_tokens ?? 0) + Number(usage.output_tokens ?? 0);
        if (!content) {
          const emptyError = new Error('claude: Provider request failed.');
          emptyError.statusCode = 502;
          throw emptyError;
        }
        return {
          success: true,
          content,
          tokens: Number.isFinite(tokens) ? Math.max(0, Math.floor(tokens)) : 0,
          provider: 'claude',
          latencyMs: Date.now() - startedAt
        };
      }
    }

    const modelError = new Error(normalizeProviderError('claude', lastError?.statusCode || 400, lastError?.message || 'Claude model unavailable.'));
    modelError.statusCode = lastError?.statusCode || 400;
    throw modelError;
  } finally {
    clearTimeout(timer);
  }
}
