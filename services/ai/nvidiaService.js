export async function nvidiaService({ apiKey, prompt, options = {} }) {
  const model = options.model || process.env.NVIDIA_MODEL || 'nvidia/llama-3.1-nemotron-70b-instruct'; // Use faster model by default
  const timeoutMs = options.timeoutMs || Number(process.env.NVIDIA_TIMEOUT_MS || 240000); // 240 seconds (4 minutes)
  const endpoint = 'https://integrate.api.nvidia.com/v1/chat/completions';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const startTime = Date.now();

  console.log(`🚀 NVIDIA: Starting request with ${timeoutMs / 1000}s timeout using model: ${model}`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
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

    const latency = Date.now() - startTime;
    console.log(`✅ NVIDIA: Response received in ${latency}ms (${(latency / 1000).toFixed(2)}s)`);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let errorMessage = `NVIDIA API error (${response.status})`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
      } catch {
        if (errorText) errorMessage = errorText;
      }

      console.error(`❌ NVIDIA: ${errorMessage}`);
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
      latencyMs: latency
    };
  } catch (error) {
    clearTimeout(timer);

    if (error.name === 'AbortError') {
      console.error(`⏱️ NVIDIA: Request timeout after ${timeoutMs / 1000}s`);
      const timeoutError = new Error(
        `NVIDIA request timeout after ${timeoutMs / 1000}s. ` +
        `The model (${model}) may be slow or overloaded. ` +
        `Try using a faster model like 'nvidia/llama-3.1-nemotron-70b-instruct' or switch to OpenAI/Gemini.`
      );
      timeoutError.statusCode = 408;
      throw timeoutError;
    }

    console.error(`❌ NVIDIA: ${error.message}`);
    throw error;
  }
}
