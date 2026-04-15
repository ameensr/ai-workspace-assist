# Qaly AI

This app now uses Supabase for authentication and testcase persistence.

## Setup

1. Create a Supabase project.
2. Run `supabase-schema.sql` in Supabase SQL Editor.
3. Run `supabase-roles.sql` in Supabase SQL Editor.
3. In `config.js`, set:
   - `supabaseUrl`
   - `supabaseAnonKey`
   - `geminiApiKey` (optional for AI features)
4. Open `signup.html` to create an account, then sign in via `login.html`.

## Notes

- Hardcoded credentials were removed.
- Auth now uses Supabase Auth sessions.
- Test suites are stored in `public.user_test_suites` (per-user row, JSONB payload).
- Local storage is still used as a temporary fallback cache when cloud sync fails.
- User type is stored in `public.user_roles` with supported values: `admin`, `user`.
