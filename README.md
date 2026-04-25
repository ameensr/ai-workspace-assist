# Qaly AI

Qaly AI is a QA assistant web app with Supabase authentication, persistent test suite storage, and server-side AI provider orchestration (Gemini/OpenAI/Claude/DeepSeek/Grok/Perplexity).

## Tech Stack

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js, Express
- Database/Auth: Supabase (Postgres + Auth + RLS + RPC)
- AI Integrations: Gemini, OpenAI, Claude, DeepSeek, Grok, Perplexity (server-side)
- Utility libraries (browser CDN): Tailwind, SheetJS, html2pdf, pdf.js, mammoth

## Core Features

- Requirement Intelligence
- Test Suite Architect (with editable rows, filtering, export/copy)
- Professional Case Architect
- Bug Report Generator
- Sentence Correction (corrected/casual/formal tone)
- Master Prompt management (draft/approve/activate lifecycle)
- User auth flow (signup/login/reset password/profile)
- User role model (`admin`, `user`)
- Per-user cloud test-suite persistence with local fallback cache
- Runtime AI provider priority and fallback support

## Initial Setup (One-Time)

1. Create a Supabase project.
2. Run the SQL files in Supabase SQL Editor (in this order):
   - `supabase-schema.sql`
   - `supabase-roles.sql`
   - `supabase-master-prompts.sql`
3. Install dependencies:
   - `npm install`
4. Create `.env` from `.env.example`.

## Run With Real AI (Live Providers)

1. In `.env`, configure Supabase:
   - `SUPABASE_URL=...`
   - `SUPABASE_ANON_KEY=...`
2. Add at least one AI provider key:
   - `GEMINI_API_KEY=...` or `OPENAI_API_KEY=...` or `CLAUDE_API_KEY=...` (others optional)
3. Disable mock mode:
   - `APP_TEST_MODE=false`
   - `APP_AI_MOCK_MODE=false`
4. Disable silent mock fallback (recommended for true live behavior):
   - `APP_FALLBACK_TO_MOCK_ON_API_ERROR=false`
5. (Optional) set provider failover order:
   - `AI_PROVIDER_PRIORITY=gemini,openai,claude,deepseek,grok,perplexity`
6. Start app:
   - `npm run dev`
7. Open:
   - `http://localhost:8000`
8. Verify live mode:
   - Visit `http://localhost:8000/api/health`
   - Confirm `aiServiceEnabled: true` and configured providers are listed.

## Run With Mock AI (No Provider Charges)

1. In `.env`, configure:
   - `APP_TEST_MODE=true`
   - `APP_AI_MOCK_MODE=true`
2. Optional fallback:
   - `APP_FALLBACK_TO_MOCK_ON_API_ERROR=true`
3. Start app:
   - `npm run dev`
4. Open:
   - `http://localhost:8000`
5. The app will return mock responses from test-mode logic.

## Authentication & Access Flow

1. Open `signup.html` to create an account.
2. Login via `login.html`.
3. Main dashboard is available at `index.html`.
4. Admin-only prompt actions are enforced by Supabase policies/RPC permissions.

## Environment Variables Reference

- Supabase:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
- AI Providers:
  - `GEMINI_API_KEY`
  - `OPENAI_API_KEY`
  - `CLAUDE_API_KEY`
  - `DEEPSEEK_API_KEY`
  - `GROK_API_KEY`
  - `PERPLEXITY_API_KEY`
- Runtime behavior:
  - `APP_TEST_MODE`
  - `APP_AI_MOCK_MODE`
  - `APP_FALLBACK_TO_MOCK_ON_API_ERROR`
  - `AI_PROVIDER_PRIORITY`
  - `PORT`
