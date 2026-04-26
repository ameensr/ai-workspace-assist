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

## Run With Real AI (Strict BYOK)

1. In `.env`, configure Supabase:
   - `SUPABASE_URL=...`
   - `SUPABASE_ANON_KEY=...`
2. Disable mock mode:
   - `APP_TEST_MODE=false`
   - `APP_AI_MOCK_MODE=false`
3. Disable silent mock fallback:
   - `APP_FALLBACK_TO_MOCK_ON_API_ERROR=false`
4. Start app:
   - `npm run dev`
5. Open:
   - `http://localhost:8000`
6. In app `Profile -> AI Settings`, set provider + API key and click Save.
7. Verify live mode:
   - Visit `http://localhost:8000/api/health`
   - Confirm `aiServiceEnabled: true` and `byokOnly: true`.

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
  - User-specific keys are configured via UI (`Profile -> AI Settings`) and stored encrypted server-side.
- Runtime behavior:
  - `APP_TEST_MODE`
  - `APP_AI_MOCK_MODE`
  - `APP_FALLBACK_TO_MOCK_ON_API_ERROR`
  - `PORT`
