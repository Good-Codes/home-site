# Project Blueprint — Operations Guide

Operational setup for local development, staging, and production. Complements [`specification.md`](./specification.md).

---

## 1. Environment variables

Copy `.env.example` → `.env.local` (never commit secrets).

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Browser/server anon key (RLS-enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only admin DAL; never expose to client |
| `RESEND_API_KEY` | Yes (email) | Transactional email |
| `RESEND_FROM_EMAIL` | Yes (email) | Verified sender, e.g. `estimates@goodcode.co.za` |
| `DOCRAPTOR_API_KEY` | Yes (PDF) | PDF/UA generation |
| `ATTACHMENT_SCANNER_API_TOKEN` | Yes (uploads) | Malware scan API |
| `ATTACHMENT_SCANNER_WEBHOOK_SECRET` | Yes (uploads) | Verify scan callbacks |
| `PROJECT_BLUEPRINT_SESSION_SECRET` | Yes | Hash resume tokens (rotate carefully) |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical origin for links/CSRF checks |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | Optional | Idea classifier enrichment only |

**Vercel:** Set the same keys per environment. Restrict service role and scanner secrets to server-only.

---

## 2. Supabase

### Local

```bash
npx supabase start
npx supabase db reset   # applies migrations + seed.sql
```

- Studio typically at `http://127.0.0.1:54323`
- API at `http://127.0.0.1:54321`
- Copy local anon/service keys into `.env.local`

### Remote

1. Create a Supabase project (region close to Vercel).
2. `npx supabase link --project-ref <ref>`
3. `npx supabase db push` (or CI migration pipeline).
4. Confirm seed **not** applied blindly to production—use controlled publish of pricing instead.

### Auth (admin)

- Enable email magic link or SSO for internal users only.
- Restrict signup; invite admins manually.
- After first user signs up, bootstrap `admin_profiles` (see §6).

### Storage

Create a **private** bucket, e.g. `project-blueprint-briefs`:

- No public policies
- Path convention: `{session_id}/{uuid}-{safe_name}`
- Server issues short-lived signed upload URLs only after consent
- Downloads only when `uploaded_briefs.scan_status = 'clean'`

---

## 3. Resend

1. Verify sending domain (SPF/DKIM/DMARC).
2. Set `RESEND_FROM_EMAIL` to a verified address.
3. Use idempotency keys: `estimate-email:{result_id}`, `quote-email:{quote_version_id}`.
4. Store consent timestamp on `leads` before first send.
5. Monitor bounces; do not retry indefinitely on hard bounces.

---

## 4. DocRaptor

1. Create account; copy API key to `DOCRAPTOR_API_KEY`.
2. Generate PDF/UA-1 from the canonical HTML document URL or HTML payload (same frozen snapshot as web).
3. On failure: log `PDF_UNAVAILABLE`, offer HTML fallback, allow retry.
4. Do not embed rates or private traces in the HTML source fed to DocRaptor.

---

## 5. Malware scanner (attachments)

1. Configure provider token + webhook secret.
2. Upload flow: sign URL → client PUT → enqueue scan → webhook updates `scan_status` (`pending` → `clean` | `infected` | `error`).
3. Verify webhook HMAC with `ATTACHMENT_SCANNER_WEBHOOK_SECRET`.
4. **Fail closed:** if scanner is down, reject new uploads; estimator remains usable.
5. Infected objects: delete or retain quarantined per policy; never expose download.

---

## 6. Retention and privacy (POPIA-minded)

| Data | Suggested retention |
|------|---------------------|
| Active estimate sessions | Until `expires_at` (default 30 days) + short grace |
| Expired sessions / answers | Soft-delete or hard-delete via scheduled job |
| Leads | Keep while commercial relationship active; purge on request |
| Uploaded briefs | Align with session/lead retention; delete blobs + rows |
| Analytics events | Aggregate; no PII; retain ~13 months |
| Audit events | Longer retention (e.g. 24–36 months) for admin accountability |
| Quote versions | Retain for contract history; do not rewrite |

Implement a cron/Edge Function (or Vercel cron calling a secured route) to:

- Expire sessions
- Delete orphaned quarantine objects
- Redact or purge aged PII on request

Document a data-subject request process (export/delete) for leads and uploads.

---

## 7. Admin bootstrap

1. Create the user in Supabase Auth (invite).
2. Insert profile (service role / SQL editor):

```sql
insert into public.admin_profiles (user_id, role, display_name)
values ('<auth-user-uuid>', 'admin', 'Your Name');
```

3. Roles:
   - `reviewer` — inbox, drafts, notes
   - `admin` — pricing drafts/publish, assignment, config
   - `approver` — threshold override approvals + issue rights as configured
4. Verify RLS: anon cannot read `admin_profiles` or private traces.
5. Sign in at `/admin/project-blueprint` and confirm inbox loads.

Rotate: demote by updating `role` or deleting the profile row (auth user can remain disabled).

---

## 8. Backup and recovery

- Enable Supabase automated backups (Pro+) or nightly `pg_dump` for critical schemas.
- Storage: versioning or cross-region backup for issued PDFs if stored.
- Pricing: published `pricing_versions` are immutable—backups protect against accidental project deletion, not in-place edits.
- Document RPO/RTO for commercial quotes.
- Test restore on a staging project at least once before go-live.

---

## 9. Placeholder rates and calibration

### Shipping placeholders

`supabase/seed.sql` and engine placeholder config ship with **`is_placeholder = true`**.

- Admins must see a persistent warning until a calibrated version is published.
- Do not market placeholder numbers as “our rates.”

### Replacing placeholders

1. Copy current draft in admin pricing editor (or update `pricing_drafts.config`).
2. Adjust role sell rates, package hours, modifiers, discovery fees, rounding, tax placeholder.
3. Run internal dry-runs against known past projects.
4. Publish → new `pricing_versions` row, checksum, `is_placeholder = false`, `published_by` set.
5. Old estimates remain pinned to their original version id.

### Calibration loop

1. After delivery, enter actuals into `calibration_records`.
2. Review variance by work package and override reasons.
3. Propose draft changes; **human publish only**—never auto-write production rules from calibration.

---

## 10. Local seed / reset checklist

```bash
npx supabase db reset
# Confirm:
# - migration 20260721000000_project_blueprint applied
# - one pricing_versions row with is_placeholder = true
# - seed packages/roles present in snapshot JSON
npm run dev
```

Point `.env.local` at local Supabase URLs/keys.

---

## 11. Go-live checklist

- [ ] Production Supabase migrations applied; RLS verified with anon key probes
- [ ] Service role only on server; not in client bundles
- [ ] `NEXT_PUBLIC_SITE_URL` matches production HTTPS origin
- [ ] `PROJECT_BLUEPRINT_SESSION_SECRET` set to a long random value (not the example)
- [ ] Resend domain verified; test estimate email
- [ ] DocRaptor test PDF/UA; HTML fallback tested
- [ ] Scanner webhook reachable over HTTPS; fail-closed upload tested
- [ ] Private storage bucket; infected file cannot be downloaded
- [ ] At least one `admin` and one `approver` bootstrapped
- [ ] Placeholder warning visible in admin; decision made to ship placeholder or publish calibrated rates first
- [ ] Sitemap/metadata for `/custom-software-estimator`
- [ ] Rate limits enabled on calculate/lead/upload/email
- [ ] Retention job scheduled
- [ ] Backup/restore smoke tested
- [ ] E2E + axe smoke on production build
- [ ] Legal/disclaimer copy reviewed (indicative estimate, not a quote)
- [ ] Analytics events verified free of PII

---

## 12. Incident notes

| Symptom | First checks |
|---------|----------------|
| Resume fails | Cookie domain/Secure flags; secret rotation invalidating hashes; expiry |
| Calculate mismatch | Pricing version id; answer canonicalization; checksum |
| Emails missing | Resend domain/DNS; consent row; idempotency replay |
| PDF fails | DocRaptor quota/key; HTML size; UA flags |
| Uploads stuck pending | Webhook URL/secret; scanner status; fail-closed policy |
