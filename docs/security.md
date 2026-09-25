# Security Notes

## Authentication
- Auth is handled entirely by Supabase Auth using Google OAuth as the sign-in method.
- Google OAuth Client ID/Secret are configured in the Supabase Dashboard
  (Authentication → Providers → Google) — NOT stored in this app's env vars.
- Redirect/callback handling is owned by Supabase; this app only redirects
  the user into `supabase.auth.signInWithOAuth({ provider: 'google' })`
  and reads the resulting session.

## Credentials GameDrop never asks for or stores
- PlayStation account email/password
- PlayStation NPSSO tokens or any PlayStation auth secret

## Key handling
- `SUPABASE_SERVICE_ROLE_KEY` is server-only, used only by `lib/supabase/admin.ts`
  for trusted background operations that intentionally bypass RLS.
  It is never sent to the browser.