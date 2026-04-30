import { normalizeProviderError } from './providerUtils.js';

export async function openaiService({ apiKey, prompt, options = {} }) {
  const timeoutMs = Number(options.timeoutMs || 20000);
  const model = options.model || 'gpt-4o-mini';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      const error = new Error(normalizeProviderError('openai', response.status, body));
      error.statusCode = response.status;
      throw error;
    }

    const data = await response.json();
    const content = String(data?.choices?.[0]?.message?.content || '').trim();
    const usage = data?.usage || {};
    const tokens = Number(usage.total_tokens ?? (Number(usage.prompt_tokens || 0) + Number(usage.completion_tokens || 0)) ?? 0);

    if (!content) {
      throw new Error('openai: Provider request failed.');
    }

    return {
      success: true,
      content,
      tokens: Number.isFinite(tokens) ? Math.max(0, Math.floor(tokens)) : 0,
      provider: 'openai',
      latencyMs: Date.now() - startedAt
    };
  } finally {
    clearTimeout(timer);
  }
}
