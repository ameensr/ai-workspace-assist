import express from 'express';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { authMiddleware } from './server/middleware/authMiddleware.js';
import { creditRoutes } from './server/routes/creditRoutes.js';
import { aiRoutes } from './server/routes/aiRoutes.js';

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

// Runtime config endpoint
app.get('/runtime-config.js', (req, res) => {
  res.type('application/javascript; charset=utf-8');

  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
  const testMode = String(process.env.APP_TEST_MODE || 'false').toLowerCase() === 'true';
  const aiServiceEnabled = true;

  const runtime = {
    supabaseUrl,
    supabaseAnonKey,
    testMode,
    aiServiceEnabled,
    hybridMode: true
  };

  res.send(`window.RUNTIME_APP_CONFIG = ${JSON.stringify(runtime)};`);
});

// Health check
app.get('/api/health', (_, res) => {
  res.json({
    ok: true,
    aiServiceEnabled: true,
    hybridMode: true,
    systemAIConfigured: !!(
      process.env.SYSTEM_OPENAI_API_KEY ||
      process.env.SYSTEM_GEMINI_API_KEY ||
      process.env.SYSTEM_CLAUDE_API_KEY ||
      process.env.SYSTEM_DEEPSEEK_API_KEY
    )
  });
});

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

// Protected routes with authentication
app.use('/api/credits', apiLimiter, authMiddleware, creditRoutes);
app.use('/api/ai', apiLimiter, authMiddleware, aiRoutes);

// Static files
app.use(express.static(process.cwd(), { extensions: ['html'] }));

app.listen(port, () => {
  console.log(`🚀 Qaly AI Hybrid Server running on http://localhost:${port}`);
  console.log(`📊 Mode: Hybrid (BYOK + Built-in AI with Credits)`);
  console.log(`💳 Credit System: Enabled`);
});
