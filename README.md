# Qaly AI

This app now uses Supabase for authentication and testcase persistence.

## Setup

1. Create a Supabase project.
2. Run `supabase-schema.sql` in Supabase SQL Editor.
3. Run `supabase-roles.sql` in Supabase SQL Editor.
4. Run `supabase-master-prompts.sql` in Supabase SQL Editor.
5. Copy `.env.example` to `.env` and set:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY` (optional; server-only)
6. Install server deps: `npm install`
7. Start the app: `npm run dev` then open `http://localhost:8000`
8. Open `signup.html` to create an account, then sign in via `login.html`.

## Notes

- Hardcoded credentials were removed.
- Auth now uses Supabase Auth sessions.
- Test suites are stored in `public.user_test_suites` (per-user row, JSONB payload).
- Local storage is still used as a temporary fallback cache when cloud sync fails.
- User type is stored in `public.user_roles` with supported values: `admin`, `user`.
- Shared admin-created prompts are stored in `public.master_prompts`.
 - Gemini API key is never sent to the browser; the frontend calls `POST /api/gemini`.
