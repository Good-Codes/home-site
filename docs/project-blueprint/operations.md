# Project Blueprint — Operations Guide

Operational setup for local development, staging, and production. Complements [`specification.md`](./specification.md).

---

## 1. Environment variables

Copy `.env.example` → `.env.local` (never commit secrets). Next.js reads `.env.local`; the Prisma CLI only auto-loads `.env`. Use `npm run db:migrate` / `npm run db:seed` so both files are applied.

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string for Prisma |
| `AUTH_SECRET` | Yes (production) | 32+ random bytes used to sign Auth.js JWT cookies. Generate with `openssl rand -base64 32` |
| `AUTH_URL` | Recommended | Canonical origin Auth.js uses for callbacks, e.g. `https://www.goodcode.co.za` |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical origin for links |
| `BOOTSTRAP_ADMIN_EMAIL` | Seed only | First staff admin email (`npx prisma db seed`) |
| `BOOTSTRAP_ADMIN_PASSWORD` | Seed only | Min 12 characters; never used by public signup |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Optional | Google OAuth client; omit to hide Google sign-in |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | Optional | GitHub OAuth app; omit to hide GitHub sign-in |
| `AUTH_MICROSOFT_ENTRA_ID_ID` / `AUTH_MICROSOFT_ENTRA_ID_SECRET` | Optional | Microsoft Entra (Azure) app; omit to hide Microsoft sign-in |
| `AUTH_MICROSOFT_ENTRA_ID_ISSUER` | Optional | Defaults to `https://login.microsoftonline.com/common/v2.0` (work + personal) |
| `OPENAI_API_KEY` | Recommended (intake) | Maps idea text onto catalogue answers. Keyword fallback if unset |
| `PROJECT_BLUEPRINT_AI_INTAKE_ENABLED` | Optional | Set `false` to force keyword fallback even when a key is present |
| `PROJECT_BLUEPRINT_AI_INTAKE_MODEL` | Optional | Default `gpt-4o-mini` |
| `RESEND_API_KEY` | Yes (email) | Transactional email |
| `RESEND_FROM_EMAIL` | Yes (email) | Verified sender, e.g. `estimates@goodcode.co.za` |
| `DOCRAPTOR_API_KEY` | Yes (PDF) | PDF/UA generation |
| `ATTACHMENT_SCANNER_API_TOKEN` | Yes (uploads) | Malware scan API |
| `ATTACHMENT_SCANNER_WEBHOOK_SECRET` | Yes (uploads) | Verify scan callbacks |

**Vercel / production:** `AUTH_SECRET` and `DATABASE_URL` must be set. The app refuses to start in production without `AUTH_SECRET`. Restrict scanner and email secrets to the server.

---

## 2. PostgreSQL and Prisma

Identity, estimates, leads, quotes, calibration, and analytics live in Postgres. Prisma schema: `prisma/schema.prisma`.

### Local (Docker)

```bash
docker compose up db -d
# Postgres is published at 127.0.0.1:5433
```

Point `.env.local` at:

```
DATABASE_URL="postgresql://homesite:homesite@127.0.0.1:5433/homesite"
```

Then (from the project root, with `DATABASE_URL` in `.env.local`):

```bash
npm run db:migrate
npm run db:seed      # creates the first ADMIN when BOOTSTRAP_ADMIN_* are set
npm run db:generate
npm run dev
```

Plain `npx prisma migrate deploy` fails with `P1012` if `DATABASE_URL` is only in `.env.local`.

### Local (app + database)

```bash
docker compose up --build
```

The `web` service waits until Postgres is healthy, runs `prisma migrate deploy`, then starts Next.js. Seed the first admin from the host:

```bash
$env:DATABASE_URL="postgresql://homesite:homesite@127.0.0.1:5433/homesite"
$env:BOOTSTRAP_ADMIN_EMAIL="you@goodcode.co.za"
$env:BOOTSTRAP_ADMIN_PASSWORD="choose-a-long-password"
npx prisma db seed
```

### Deploy

The container entrypoint runs `prisma migrate deploy` before `node server.js`. The `web` image stays stateless; Postgres holds all data.

---

## 3. Auth.js (credentials and social)

- Customers create accounts at `/signup` or by signing in with Google, GitHub, or Microsoft. The first social sign-in **creates** a `CUSTOMER` with no password. Matching a verified email links the provider to the existing user and **does not** change role. `ADMIN` is assigned only by seed or in the database. Public signup and OAuth cannot self-promote.
- Unified login is `/login`. `/admin/login` redirects there with `next=/admin/project-blueprint`. After social login, `/auth/continue` sends staff to the inbox and customers to the estimator.
- Passwords are hashed with bcrypt (cost 12) via `bcryptjs`. Social-only users have no `passwordHash`; they cannot use email/password until an admin sets one. Signed-in users who have a password can change it at `/account`.
- Sessions are JWTs signed with `AUTH_SECRET` (httpOnly, SameSite=lax, Secure in production). The JWT `id` is the Prisma user UUID, not the provider subject.
- `/custom-software-estimator` and customer APIs (`/api/project-blueprint/intake`, `calculate`, …) require a signed-in user.
- `/admin` requires `ADMIN`. Being logged in as a customer is not enough.

### Social provider setup

Register an OAuth app for each provider you want, then set the env vars above. Authorized redirect URIs (replace origin with `AUTH_URL`):

- Google: `{AUTH_URL}/api/auth/callback/google` — [Google Cloud credentials](https://console.developers.google.com/apis/credentials)
- GitHub: `{AUTH_URL}/api/auth/callback/github` — [GitHub OAuth apps](https://github.com/settings/developers) (needs `user:email`)
- Microsoft: `{AUTH_URL}/api/auth/callback/microsoft-entra-id` — [App registration](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app)

Leave a provider’s id/secret unset to hide its button. Local and e2e keep working with email/password only.

---

## 4. Resend

1. Verify sending domain (SPF/DKIM/DMARC).
2. Set `RESEND_FROM_EMAIL` to a verified address.
3. Use idempotency keys: `estimate-email:{result_id}`, `quote-email:{quote_version_id}`.
4. Store consent timestamp on `Lead` before first send.
5. Monitor bounces; do not retry indefinitely on hard bounces.

---

## 5. DocRaptor

1. Create account; copy API key to `DOCRAPTOR_API_KEY`.
2. Generate PDF/UA-1 from the canonical HTML document URL or HTML payload (same frozen snapshot as web).
3. On failure: log `PDF_UNAVAILABLE`, offer HTML fallback, allow retry.
4. Do not embed rates or private traces in the HTML source fed to DocRaptor.
5. Estimate documents are available only to the owning user or staff.

---

## 6. Malware scanner (attachments)

1. Configure provider token + webhook secret.
2. Upload flow: sign URL → client PUT → enqueue scan → webhook updates `scanStatus` (`pending` → `clean` | `infected` | `error`).
3. Verify webhook HMAC with `ATTACHMENT_SCANNER_WEBHOOK_SECRET`.
4. **Fail closed:** if scanner is down, reject new uploads; estimator remains usable.
5. Infected objects: delete or retain quarantined per policy; never expose download.

---

## 7. Retention and privacy (POPIA-minded)

| Data | Suggested retention |
|------|---------------------|
| Active estimate drafts | Until abandoned / user deletion request |
| Leads | Keep while commercial relationship active; purge on request |
| Uploaded briefs | Align with estimate/lead retention; delete blobs + rows |
| Analytics events | Aggregate; no PII; retain ~13 months |
| Audit events | Longer retention (e.g. 24–36 months) for admin accountability |
| Quote versions | Retain for contract history; do not rewrite |

Implement a scheduled job to:

- Expire abandoned drafts
- Delete orphaned quarantine objects
- Redact or purge aged PII on request

Document a data-subject request process (export/delete) for leads and uploads.

---

## 8. Admin bootstrap

1. Set `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` (min 12 characters).
2. Run `npm run db:seed`. This creates the first `ADMIN` if none exists. Public signup cannot self-promote.
3. There is one staff role: `ADMIN`. Admins can use the estimate inbox, draft and issue quotations, record calibration, and view pricing metadata.
4. Sign in at `/login` and open `/admin/project-blueprint`.

Promote later admins in the database (or a future admin UI). Never accept `role` from the signup form.

---

## 9. Backup and recovery

- Enable Postgres automated backups or nightly `pg_dump`.
- Pricing: published `PricingVersion` rows are immutable—backups protect against accidental project deletion, not in-place edits.
- Document RPO/RTO for commercial quotes.
- Test restore on staging at least once before go-live.

---

## 10. Placeholder rates and calibration

### Shipping placeholders

Engine placeholder config ships with **`isPlaceholder = true`**.

- Admins must see a persistent warning until a calibrated version is published.
- Do not market placeholder numbers as “our rates.”

### Replacing placeholders

1. Copy the current draft in the admin pricing editor.
2. Adjust role sell rates, package hours, modifiers, discovery fees, rounding, tax placeholder.
3. Run internal dry-runs against known past projects.
4. Publish → new `PricingVersion` row, checksum, `isPlaceholder = false`.
5. Old estimates remain pinned to their original version id.

### Calibration loop

1. After delivery, enter actuals into `CalibrationRecord`.
2. Review variance by work package and override reasons.
3. Propose draft changes; **human publish only**—never auto-write production rules from calibration.

---

## 11. Local seed / reset checklist

```bash
docker compose up db -d
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
# Confirm:
# - users table has one ADMIN when bootstrap env is set
# - /custom-software-estimator redirects to /login when signed out
```

---

## 12. Go-live checklist

- [ ] Production Postgres migrations applied (`prisma migrate deploy`)
- [ ] `AUTH_SECRET` set to a long random value (not the example); app fails closed without it
- [ ] `DATABASE_URL` points at production Postgres; not committed
- [ ] `NEXT_PUBLIC_SITE_URL` / `AUTH_URL` match production HTTPS origin
- [ ] OAuth redirect URIs registered for each enabled provider
- [ ] Bootstrap admin created; public signup cannot create staff
- [ ] Resend domain verified; test estimate email
- [ ] DocRaptor test PDF/UA; HTML fallback tested
- [ ] Scanner webhook reachable over HTTPS; fail-closed upload tested
- [ ] At least one `ADMIN` bootstrapped
- [ ] Placeholder warning visible in admin; decision made to ship placeholder or publish calibrated rates first
- [ ] Sitemap/metadata for `/custom-software-estimator`
- [ ] Rate limits enabled on auth, intake, calculate, lead, upload, email
- [ ] Retention job scheduled
- [ ] Backup/restore smoke tested
- [ ] E2E + axe smoke on production build
- [ ] Legal/disclaimer copy reviewed (indicative estimate, not a quote)
- [ ] Analytics events verified free of PII
- [ ] Passwords never logged

---

## 13. Incident notes

| Symptom | First checks |
|---------|----------------|
| Login loops | `AUTH_SECRET` rotation invalidates cookies; `AUTH_URL` / site URL mismatch; OAuth callback URI mismatch |
| Estimator redirects to login | Session cookie missing or expired; user must sign in |
| Calculate 401 | API gated by Auth.js session — page login is not enough if the cookie is absent |
| Emails missing | Resend domain/DNS; consent row; idempotency replay |
| PDF fails | DocRaptor quota/key; HTML size; UA flags |
| Uploads stuck pending | Webhook URL/secret; scanner status; fail-closed policy |
