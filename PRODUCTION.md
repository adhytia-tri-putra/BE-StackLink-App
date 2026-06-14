# Production Runbook

## Required services

- PostgreSQL with automated daily backups and point-in-time recovery where available.
- SMTP provider with verified sender; configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM`.
- Public Supabase Storage bucket configured by `SUPABASE_AVATAR_BUCKET`.
- Sentry project configured with `SENTRY_DSN`; start with `SENTRY_TRACES_SAMPLE_RATE=0.1`.

## Deployment checks

1. Run `npm ci`, `npm test`, `npm run build`, and `npm run prisma:migrate:deploy`.
2. Monitor `/api/ready`, not only `/api/health`. A `503` means the database is unavailable.
3. Configure an uptime monitor at a one-minute or five-minute interval and alert on two consecutive failures.
4. Keep frontend `VITE_API_BASE_URL`, backend `FRONTEND_URL`, and `PUBLIC_APP_URL` aligned.

## Custom domains

Point the user's hostname to the deployed frontend with a CNAME or provider-specific apex record. Add the hostname in Publishing settings. TLS must be issued by the frontend hosting provider.
Set `CUSTOM_DOMAIN_TARGET` to the canonical frontend hostname so Publishing diagnostics can verify the CNAME.

## Backup policy

- Retain daily backups for at least 14 days and monthly backups for at least 6 months.
- Perform a restore rehearsal in a non-production database at least quarterly.
- Storage object retention should match database retention; deleted avatars are removed by the application.

## Incident response

- Use the `x-request-id` response header to correlate client reports with JSON request logs.
- Review Sentry events without enabling default PII.
- Rotate JWT, SMTP, database, Supabase, and Sentry credentials after suspected exposure.
