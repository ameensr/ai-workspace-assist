/**
 * NVIDIA NIM API Service
 * Supports NVIDIA's AI models via their API
 */

export async function nvidiaService({ apiKey, prompt, options = {} }) {
  const model = options.model || process.env.NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct';
  const timeoutMs = options.timeoutMs || Number(process.env.NVIDIA_TIMEOUT_MS || 30000);
  const endpoint = 'https://integrate.api.nvidia.com/v1/chat/completions';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const startTime = Date.now();

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4096,
        stream: false
      }),
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let errorMessage = `NVIDIA API error (${response.status})`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
      } catch {
        if (errorText) errorMessage = errorText;
      }

      const error = new Error(errorMessage);
      error.statusCode = response.status;
      throw error;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('NVIDIA returned empty response');
    }

    return {
      content: content.trim(),
      tokens: data.usage?.total_tokens || 0,
      provider: 'nvidia',
      latencyMs: Date.now() - startTime
    };
  } catch (error) {
    clearTimeout(timer);

    if (error.name === 'AbortError') {
      const timeoutError = new Error('NVIDIA request timeout');
      timeoutError.statusCode = 408;
      throw timeoutError;
    }

    throw error;
  }
}
