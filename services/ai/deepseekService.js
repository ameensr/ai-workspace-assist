import { normalizeProviderError } from './providerUtils.js';

export async function deepseekService({ apiKey, prompt, options = {} }) {
  const timeoutMs = Number(options.timeoutMs || 20000);
  const model = options.model || 'deepseek-chat';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
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
      const error = new Error(normalizeProviderError('deepseek', response.status, body));
      error.statusCode = response.status;
      throw error;
    }

    const data = await response.json();
    const content = String(data?.choices?.[0]?.message?.content || '').trim();
    const usage = data?.usage || {};
    const tokens = Number(usage.total_tokens ?? (Number(usage.prompt_tokens || 0) + Number(usage.completion_tokens || 0)) ?? 0);

    if (!content) {
      throw new Error('deepseek: Provider request failed.');
    }

    return {
      success: true,
      content,
      tokens: Number.isFinite(tokens) ? Math.max(0, Math.floor(tokens)) : 0,
      provider: 'deepseek',
      latencyMs: Date.now() - startedAt
    };
  } finally {
    clearTimeout(timer);
  }
}
