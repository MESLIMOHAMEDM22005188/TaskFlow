# Supabase — TaskFlow

## Project

- Project ref: `ffykzjxnsgdkzxcppvoo`
- Region: `eu-west-3` (Paris)
- Project URL: `https://ffykzjxnsgdkzxcppvoo.supabase.co`
- Dashboard: `https://supabase.com/dashboard/project/ffykzjxnsgdkzxcppvoo`

The existing TaskFlow application keeps MySQL on AlwaysData as its primary application database. Supabase is introduced for Auth email delivery and recovery verification only; task, profile and statistics data are not migrated.

## Environment variables

Copy `.env.supabase.example` into the appropriate local environment files:

- Frontend: `frontend/.env` — only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Backend: configure `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in AlwaysData's private environment settings.

The publishable key is intended for browser use. The secret key is privileged: obtain it from the Supabase Dashboard API Keys page and store it only in the backend environment. Never commit it, paste it into frontend code, or add a `VITE_` prefix.

## Required Supabase Auth configuration

1. Open Authentication → URL Configuration.
2. Set the Site URL to the real TaskFlow frontend origin (currently `https://grindlyy.alwaysdata.net` if that remains the production URL).
3. Add the production recovery redirect URL and local development URL(s), such as `http://localhost:5173`, to the allowed redirect URLs.
4. Open Authentication → Email Templates → Reset Password.
5. Configure the message to include the six-digit OTP variable `{{ .Token }}`, not only `{{ .ConfirmationURL }}`. Example:

   `<p>Ton code de réinitialisation TaskFlow est : <strong>{{ .Token }}</strong></p>`

6. Configure a custom SMTP provider under Project Settings → Authentication → SMTP Settings. Supabase's default mail service is restricted and is not suitable as a reliable production mailer. Keep SMTP credentials private.

## Identity architecture and rollout

TaskFlow's current user records and password hashes live in MySQL. Supabase Auth does not automatically know about those accounts. Before enabling password recovery, the backend must securely provision/link each eligible MySQL account to a Supabase Auth identity, request a recovery OTP, verify the OTP as a recovery token, and only then authorize the MySQL bcrypt password update. Do not use `signInWithOtp` with automatic account creation as a shortcut, and do not update the MySQL password based only on the multiplication challenge.

The implementation branch currently contains the recovery UI and server-side arithmetic challenge, but email delivery and the final Supabase verification/password-update bridge are not active yet. Do not merge or deploy the recovery flow as functional until that bridge and its tests are complete.

## Verification checklist

- [ ] SMTP sender/domain verified with the mail provider.
- [ ] Reset Password template uses `{{ .Token }}`.
- [ ] Site URL and redirect allowlist match the actual frontend domains.
- [ ] Backend secret key stored only in AlwaysData private environment variables.
- [ ] Existing MySQL accounts are safely linked/provisioned in Supabase Auth.
- [ ] OTP verification is server-validated before the MySQL password hash changes.
- [ ] Rate limits, account-enumeration resistance, expiry and single-use behavior tested.
