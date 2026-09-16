# Project Blueprint — Operations Guide

Operational setup for local development, staging, and production. Complements [`specification.md`](./specification.md).

---

## 1. Environment variables

The supported way to run the site is Docker: `docker compose up --build`. Compose injects `DATABASE_URL` to the `db` service. Optional secrets (OpenAI, Resend, OAuth, a real `AUTH_SECRET`) can live in `.env` or `.env.local` — never commit them.

Host-dev `.env` files often set `AUTH_URL=http://127.0.0.1:3000`. Compose ignores that HTTP origin and binds Auth.js to `http://127.0.0.1:$APP_PORT` (default 3002). Set `SITE_URL=https://…` for a public HTTPS origin. Secrets such as `OPENAI_API_KEY` are read from `env_file`; do not rely on empty `${VAR:-}` interpolations.

Host-only Next.js still works: copy `.env.example` → `.env.local`. Next.js reads `.env.local`; the Prisma CLI only auto-loads `.env`. Use `npm run db:migrate` / `npm run db:seed` so both files are applied.

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string for Prisma |
| `AUTH_SECRET` | Yes (production) | 32+ random bytes used to sign Auth.js JWT cookies. Generate with `openssl rand -base64 32` |
| `AUTH_URL` | Recommended | Canonical origin Auth.js uses for callbacks, e.g. `https://www.goodcode.co.za`. Docker overwrites HTTP host-dev values with the published app port |
| `SITE_URL` | Docker / VPS | Public origin for the Compose stack. Use this for production HTTPS; it becomes `AUTH_URL` at container start |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical origin for links. Docker build uses `SITE_URL` (default `http://127.0.0.1:3002`) |
| `BOOTSTRAP_ADMIN_EMAIL` | Seed only | Staff admin email. Docker seed upserts this user on every boot |
| `BOOTSTRAP_ADMIN_PASSWORD` | Seed only | Min 12 characters; never used by public signup. Docker seed resets this user's password on every boot |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Optional | Google OAuth client; omit to hide Google sign-in |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | Optional | GitHub OAuth app; omit to hide GitHub sign-in |
| `AUTH_MICROSOFT_ENTRA_ID_ID` / `AUTH_MICROSOFT_ENTRA_ID_SECRET` | Optional | Microsoft Entra (Azure) app; omit to hide Microsoft sign-in |
| `AUTH_MICROSOFT_ENTRA_ID_ISSUER` | Optional | Defaults to `https://login.microsoftonline.com/common/v2.0` (work + personal) |
| `OPENAI_API_KEY` | Required for estimates | Intake maps the idea; a second call produces the ZAR planning range. Intake can fall back to keywords; estimate fails honestly if the key is missing |
| `PROJECT_BLUEPRINT_AI_INTAKE_ENABLED` | Optional | Set `false` to force keyword fallback even when a key is present |
| `PROJECT_BLUEPRINT_AI_INTAKE_MODEL` | Optional | Default `gpt-4o-mini` |
| `PROJECT_BLUEPRINT_AI_ESTIMATE_ENABLED` | Optional | Set `false` to disable the pricing model (calculate returns an error) |
| `PROJECT_BLUEPRINT_AI_ESTIMATE_MODEL` | Optional | Default `gpt-4o`. Pin this in production. |
| `RESEND_API_KEY` | Yes (password-reset and contact-form email) | Transactional email via Resend |
| `RESEND_FROM_EMAIL` | Yes (password-reset email) | Verified sender, e.g. `estimates@goodcode.co.za` |
| `CONTACT_EMAIL_FROM` | Yes (contact form) | Verified From address for website leads |
| `CONTACT_EMAIL_TO` | Yes (contact form) | Internal inbox that receives website leads |

**Vercel / production:** `AUTH_SECRET` and `DATABASE_URL` must be set. The app refuses to start in production without `AUTH_SECRET`. Restrict scanner and email secrets to the server.

---

## 2. PostgreSQL and Prisma

Identity, estimates, leads, quotes, calibration, and analytics live in Postgres. Prisma schema: `prisma/schema.prisma`.

### Local (fully containerized)

```bash
docker compose up --build
```

Open `http://127.0.0.1:3002`. The `web` service waits until Postgres is healthy, runs `prisma migrate deploy`, upserts the bootstrap admin when `BOOTSTRAP_ADMIN_PASSWORD` is at least 12 characters, then starts Next.js. Sign in with the `BOOTSTRAP_ADMIN_*` values from `.env`. If those are unset, the Compose defaults are `admin@goodcode.local` / `local-admin-change-me`. Change those before any shared or production deploy.

Postgres stays on the Docker network (`db:5432`). The app container always uses `postgresql://homesite:homesite@db:5432/homesite`.

### Host Next.js (optional)

```bash
docker compose up db -d
```

Publish Postgres to the host if you need it (`127.0.0.1:5433:5432` on `db`), then point `.env.local` at:

```
DATABASE_URL="postgresql://homesite:homesite@127.0.0.1:5433/homesite"
```

Then:

```bash
npm run db:migrate
npm run db:seed
npm run db:generate
npm run dev
```

Plain `npx prisma migrate deploy` fails with `P1012` if `DATABASE_URL` is only in `.env.local`.

### Deploy

`docker compose up --build -d`. The entrypoint runs migrations and seed before `next start`. The `web` image stays stateless; Postgres holds all data. Set a real `AUTH_SECRET` and `SITE_URL` (https origin). Compose publishes the app on `127.0.0.1:3002` by default so it does not collide with Antler on 3000.

---

## 3. Auth.js (credentials and social)

- Customers create accounts at `/signup` or by signing in with Google, GitHub, or Microsoft. The first social sign-in **creates** a `CUSTOMER` with no password. Matching a verified email links the provider to the existing user and **does not** change role. `ADMIN` is assigned only by seed or in the database. Public signup and OAuth cannot self-promote.
- Unified login is `/login`. `/admin/login` redirects there with `next=/admin/project-blueprint`. After social login, `/auth/continue` sends staff to the inbox and customers to the estimator.
- Passwords are hashed with bcrypt (cost 12) via `bcryptjs`. Social-only users have no `passwordHash` until they set one (forgot-password email) or an admin sets one. Signed-in users who have a password can change it at `/account`. Customers also edit their profile there (name, phone, organisation, and optional context). Email is the login and cannot be changed on that page. Admins keep `/admin/account` as password-only.
- Forgot password is `/forgot-password`. The app always shows the same success copy. If the email matches an **active** account, Resend sends a one-hour, single-use link to `/reset-password`. Tokens are stored as SHA-256 hashes. A successful reset unlocks a locked account. With `RESEND_API_KEY` unset, the send is stubbed so local/e2e still work — add the key for real inbox delivery.
- Customers can save **at most five** calculated estimates to `/account`. Delete removes the estimate from the profile only (`savedToProfileAt = null`); the admin inbox still has the row.
- `GET /api/account/estimates/{id}/pdf` returns an owner-only PDF rendered from HTML (Chromium). The file states clearly that it is not an official quotation.
- Profile PII lives on `User`. `Lead` remains the consent snapshot for one estimate. Submitting a lead copies name / phone / organisation onto the profile **only if that profile field is still empty**. Issued quotes snapshot client details into `QuoteVersion.frozenSnapshot` and do not follow later profile edits.
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

Used for **password-reset** mail and **website contact-form** leads. Estimate-by-email was removed.

1. Verify sending domain (SPF/DKIM/DMARC).
2. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to a verified address.
3. Set `CONTACT_EMAIL_FROM` (verified From) and `CONTACT_EMAIL_TO` (internal inbox) for `/api/contact`.
4. Idempotency keys: `password-reset:{userId}:{tokenHashPrefix}`.
5. Locally, an unset `RESEND_API_KEY` stubs password-reset send and still returns the generic success message. The contact form requires `RESEND_API_KEY`, `CONTACT_EMAIL_FROM`, and `CONTACT_EMAIL_TO` or it returns 503.
6. Monitor bounces; do not retry indefinitely on hard bounces.

---

## 5. Estimate PDFs

Planning-estimate PDFs are generated in-process: frozen `publicResult` HTML → Chromium (`puppeteer`) → PDF. There is no DocRaptor key.

1. Local `npm run dev` uses Puppeteer’s downloaded Chrome unless `PUPPETEER_EXECUTABLE_PATH` is set.
2. The Docker image installs Alpine Chromium and sets `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser`.
3. The download is session-gated: the signed-in customer must own the estimate and it must have a calculated result.
4. The PDF banner and footer state that the document is **not an official quotation**.
5. Never include rates, margins, or `calculationTrace` in the HTML.

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
| Customer profile on `User` | Keep while the account exists; this is the business card (name, phone, organisation, and optional context). Leads are **not** rewritten when the profile changes |
| Leads | Keep while commercial relationship active; purge on request. A lead is a consent snapshot of that enquiry |
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
2. Run `npm run db:seed`, or restart the Compose `web` service. Seed creates that admin or updates their password, role, and lockout if the user already exists. Public signup cannot self-promote.
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
docker compose up --build
# Confirm:
# - http://127.0.0.1:3002 serves the site
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
- [ ] Resend domain verified; test password-reset email
- [ ] Estimate PDF download (signed-in owner) shows the not-a-quote disclaimer
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
| Emails missing | Resend domain/DNS; `RESEND_API_KEY`; spam folder; token expiry |
| PDF fails | Chromium path (`PUPPETEER_EXECUTABLE_PATH`); Docker package; HTML size |
