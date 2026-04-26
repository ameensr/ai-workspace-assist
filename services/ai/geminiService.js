import { normalizeProviderError } from './providerUtils.js';

export async function geminiService({ apiKey, prompt, options = {} }) {
  const timeoutMs = Number(options.timeoutMs || 20000);
  const model = options.model || 'gemini-2.0-flash';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      const error = new Error(normalizeProviderError('gemini', response.status, body));
      error.statusCode = response.status;
      throw error;
    }

    const data = await response.json();
    const content = String(data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    const usage = data?.usageMetadata || {};
    const tokens = Number(usage.totalTokenCount ?? (Number(usage.promptTokenCount || 0) + Number(usage.candidatesTokenCount || 0)) ?? 0);

    if (!content) {
      throw new Error('gemini: Provider request failed.');
    }

    return {
      success: true,
      content,
      tokens: Number.isFinite(tokens) ? Math.max(0, Math.floor(tokens)) : 0,
      provider: 'gemini',
      latencyMs: Date.now() - startedAt
    };
  } finally {
    clearTimeout(timer);
  }
}
