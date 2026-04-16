import express from 'express';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 8000;

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
  const geminiEnabled = Boolean(process.env.GEMINI_API_KEY);

  // NOTE: This config is visible to the browser. Do NOT include service-role keys here.
  const runtime = {
    supabaseUrl,
    supabaseAnonKey,
    testMode,
    fallbackToMockOnApiError,
    geminiEnabled,
  };

  res.send(`window.RUNTIME_APP_CONFIG = ${JSON.stringify(runtime)};`);
});

app.get('/api/health', (_, res) => {
  res.json({
    ok: true,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/gemini', apiLimiter, async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ error: 'Gemini API is not configured on the server.' });
  }

  const { prompt, systemPrompt } = req.body || {};
  const textPrompt = String(prompt || '').trim();
  const textSystem = String(systemPrompt || '').trim();
  if (!textPrompt) {
    return res.status(400).json({ error: 'Prompt is empty.' });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${textSystem}\n\nUser Input: ${textPrompt}`.trim() }]
        }]
      }),
    });

    if (!response.ok) {
      let message = `Gemini API error (${response.status}).`;
      try {
        const errJson = await response.json();
        message = errJson?.error?.message || errJson?.message || message;
      } catch {
        try {
          const errText = await response.text();
          if (errText) message = errText;
        } catch {}
      }
      return res.status(response.status).json({ error: message });
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0];
    const parts = candidate?.content?.parts;
    const output = Array.isArray(parts) ? parts?.[0]?.text : null;
    if (!output || typeof output !== 'string') {
      return res.status(502).json({ error: 'Unexpected Gemini response format.' });
    }

    return res.json({ text: output });
  } catch (error) {
    console.error('Gemini proxy error:', error);
    return res.status(502).json({ error: 'Failed to reach Gemini API.' });
  }
});

app.use(express.static(process.cwd(), { extensions: ['html'] }));

app.listen(port, () => {
  console.log(`Qaly AI server running on http://localhost:${port}`);
});

