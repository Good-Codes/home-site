# Project Blueprint — Product & Technical Specification

**Working name:** Project Blueprint  
**Page title:** Custom Software Cost Estimator  
**Public route:** `/custom-software-estimator`  
**Currency:** ZAR (South African Rand)  
**Stack:** Next.js 16 App Router · Vercel · Supabase · Resend · DocRaptor (PDF/UA)

This document is the implementation source of truth. Question IDs, answer shapes, and public result types live in `lib/project-blueprint/` and must stay aligned with this spec.

---

## 1. Product strategy and key assumptions

**Promise:** Help prospects understand indicative custom-software investment ranges before speaking to Good Code, without pretending the tool issues a binding quote.

**Rules**

| Rule | Requirement |
|------|-------------|
| Value before lead | Full indicative result (ranges, scenarios, drivers, assumptions) before any contact capture |
| Indicative only | Copy and UI state this is a planning estimate, not a fixed or binding quotation |
| Deterministic pricing | Same answers + same published pricing version → identical result |
| Server-side rates | Role rates, margins, tax internals, and private traces never reach the browser |
| Budget isolation | Optional budget is commercial-fit context only; it never changes calculated ranges |
| Unknowns widen | “Not sure” / advice-needed answers increase uncertainty bands, never invent precision |
| Discovery-first | Low confidence, heavy unknowns, legacy/integration risk, or regulated ambiguity → recommend discovery before full build |

**Assumptions**

- Website packages remain on `/website-pricing`; custom products use this estimator.
- Primary audience: South African SMEs and product owners exploring custom builds.
- Placeholder rates ship until calibrated; admins see an explicit placeholder warning.
- Formal quotes are human-reviewed; the estimator only starts that workflow.

---

## 2. Integration with existing pricing page

Preserve all existing website package content and `/contact-us` behaviour on `/website-pricing`.

**Additions**

1. **Top route decision** (above packages): “Website package” vs “Custom software / product”  
   - Website → scroll/stay on packages or contact as today  
   - Custom → `/custom-software-estimator`
2. **Callout below packages:** short pitch for Project Blueprint + CTA to the estimator
3. **Nav/footer/sitemap:** optional secondary link labelled for SEO as “Custom Software Cost Estimator”

Do not replace website “from R…” package pricing with the estimator.

---

## 3. Complete user journey

```text
Pricing page decision
  → Website packages / contact (existing)
  → /custom-software-estimator
      → Hero (Project Blueprint brand + promise)
      → Describe the idea (one textarea)
      → Optional: 0–3 high-impact follow-ups if something important is missing (max two rounds)
      → Concept preview (“what we understood”)
      → Calculate (server engine) → Results (value first)
      → Optional: save/email/PDF, upload brief, book next step (lead)
      → Admin inbox → review → quotation versions → approve → issue
```

Website-shaped descriptions hand off to `/website-pricing` instead of calculating a custom estimate.

**Resume:** Opaque token (hash stored server-side) + HTTP-only cookie for same device; optional expiring share link. No account required for estimate or resume.

**Optional scope edits on results:** Recalculate creates a new `estimate_results` row; never mutate historical snapshots.

---

## 4. Screen-by-screen UX specification

| Screen | Purpose | Primary UI | Exit |
|--------|---------|------------|------|
| **Hero** | Brand + trust | “Project Blueprint” hero-level; title “Custom Software Cost Estimator”; describe-the-idea promise; CTA group | Start estimate |
| **Describe** | Free-text intake | One textarea. Server OpenAI intake maps the idea onto the catalogue. Never prices from text. | Website handoff, follow-ups, or preview |
| **Clarifications** | Fill high-impact gaps only | At most 3 whitelist questions, at most 2 rounds | Preview |
| **Concept preview** | Confirm inferred scope | Headline, who it is for, capabilities, assumptions, unknowns | Calculate or edit description |
| **Results** | Value delivery | Scenarios, timeline, drivers, assumptions, concept brief | Lead actions |
| **Lead** | Capture after value | Name, email, company, phone optional, consent, preferred next step | Confirmation |

The 8-screen guided catalogue remains the **taxonomy source of truth** for intake mapping and the estimate engine. It is not the public journey.

**Chrome:** Calm motion; respect `prefers-reduced-motion`. Autosave status when a session exists.

---

## 5. Full question catalogue

**Source of truth:** `lib/project-blueprint/questions/catalogue.ts` (schema in `questions/schema.ts`, answer Zod in `answers.ts`).

Documentation must not invent parallel copy. Catalogue covers:

| ID area | Content |
|---------|---------|
| Screen 0 | Website vs custom product type options |
| Screen 1 | Starting point + outcome |
| Screen 2 | Product surfaces + adaptive mobile follow-ups |
| Screen 3 | Users / roles / scale |
| Screen 4 | Capabilities grouped: access, workflows, payments, data, communication, intelligence |
| Screen 5 | Integrations and migration |
| Screen 6 | Quality / security / delivery risk + regulated follow-ups |
| Screen 7 | Assets, product level, timing, optional budget **after** scope |
| Review | Metadata labels for summary |

**Every question** includes help text and, where relevant, “I’m not sure” / “Help me choose” / “We need advice”.

**ID convention:** `surface.public_web`, `cap.payments.one_time`, etc.

Generate any published catalogue excerpt from the same module to prevent drift.

---

## 6. Adaptive branching map

**Implementation:** `lib/project-blueprint/branching/` (`rules.ts`, `journey.ts`, `dependencies.ts`).

| Trigger | Behaviour |
|---------|-----------|
| Mobile surfaces | Show mobile platform / distribution follow-ups |
| Payments | Include auth, transaction logging, security foundations (non-removable) |
| Multi-tenant | Tenancy / isolation follow-ups + backend/security packages |
| KYC / identity | Identity verification packages + compliance cues |
| Existing product | Brownfield modifiers; integration risk |
| Legacy replacement | Discovery bias; migration packages; widened ranges |
| AI / intelligence caps | AI work packages; data/quality caveats |
| Cloud modernisation | Cloud / DevOps packages |
| Integrations / migration | Integration + data-migration packages; unknown → widen |
| Regulated workflows | Compliance packages; discovery-first gate more likely |
| Deadline conflicts | Compression packages or phased scope—never promise impossible dates |

`getVisibleSteps(answers)` / `getNextStep` / `getPreviousStep` / `canProceed` drive the UI. Dependency foundations cannot be unchecked by the user.

---

## 7. Production-ready microcopy principles

- Calm Good Code voice: clear, specific, no hype or chatbot gimmicks.
- Always distinguish **indicative planning estimate** vs **reviewed quotation**.
- Prefer plain language over jargon; explain terms in help, not in the question stem.
- Unknowns are first-class and blame-free (“That’s fine—we’ll widen the range”).
- Budget copy: “Helps us discuss commercial fit. It does not change your estimate.”
- Errors: what happened + what to do next; never expose stack traces or rates.
- Placeholders in admin: “Placeholder rates—do not treat as calibrated.”

---

## 8. Planning estimate (AI + guards)

**Location:** `lib/project-blueprint/estimate/` (server-only). The old PERT / catalogue pricing engine is retired. There is one price source.

**Pipeline**

1. Intake (`lib/project-blueprint/intake/`) confirms a concept and optional follow-ups. It never invents ZAR.
2. After the customer confirms the concept, `POST /api/project-blueprint/calculate` calls `runAiEstimate` with a versioned context pack (`ai-estimate-v1`).
3. The model returns structured JSON (range, timeline, confidence, drivers). Zod validates; one retry on schema failure.
4. Guards apply floor/ceiling, band order, taxonomy-ID stripping, and drop percentage haircut scenarios.
5. Persist `{ publicResult, calculationTrace }` on `EstimateResult`. Trace stores prompt version, model, input hash, raw JSON, and guard adjustments — never send the prompt or seed table to the browser.

**Invariants**

- Budget fields are not sent to the estimator.
- Public result is ZAR, indicative, not a quotation.
- If OpenAI is down, return an honest error. Do not fall back to a second calculator.

---

## 9. Calculation formulas and pseudocode

```text
# Per role effort on a work package
expected_hours = (low + 4 * likely + high) / 6
variance_hours = ((high - low) / 6) ^ 2

# Cost (internal)
expected_cost = Σ (expected_hours_role × sell_rate_role)
# Retain low/likely/high and P50/P80 internally from aggregated distribution

# Uncertainty: widen only affected packages for named factors
# (unknown weight, legacy, undocumented integrations, regulated ambiguity, etc.)

# Public band
public_low, public_high = round_to_bands(internal_low, internal_high, commercial.rounding)

# Timeline
weeks = schedule(dependency_graph, role_capacity, parallel_lanes,
                 review_cycles, external_approvals, testing, migration, stabilisation)
# Deadline compression → add coordination packages OR recommend phasing
# Never return a timeline that contradicts critical-path minimum
```

**Determinism:** `checksum(canonicalAnswers) + pricing_version.checksum` → identical public + private outputs.

**Public shape (approx.):**  
`estimateId`, `pricingVersion`, `currency`, `recommendedScenario`, `alternativeScenarios`, `phaseBreakdown`, `costDrivers`, `confidence`, `assumptions`, `exclusions`, `recommendedNextStep`, `calculationTraceReference`.

---

## 10. Work-package configuration structure

Stored in published `pricing_versions.snapshot` / drafts (and mirrored in `engine/config/placeholder.ts` for local defaults).

```jsonc
{
  "roles": [{ "id": "fe", "label": "Frontend", "sellRateZar": 0 }],
  "workPackages": [{
    "id": "wp.frontend",
    "capabilityIds": ["cap...."],
    "roleEffort": [{ "roleId": "fe", "low": 0, "likely": 0, "high": 0 }],
    "dependsOn": ["wp.discovery"]
  }],
  "foundations": ["wp.security", "wp.qa", "wp.pm"],
  "modifiers": [{ "id": "mod.multi_tenant", "appliesTo": ["wp.backend"], "effortMult": 1.25 }],
  "riskRules": [],
  "discoveryPackages": [],
  "scenarios": {
    "lean": { "include": [], "excludeOptional": [] },
    "recommended": {},
    "scale_ready": {}
  },
  "commercial": {
    "currency": "ZAR",
    "roundingBands": [],
    "taxPlaceholder": 0.15,
    "minimumEngagementZar": 0,
    "marginInternal": 0
  }
}
```

Core package families: discovery, UX, frontend, backend, mobile, integrations, cloud, QA, security, PM, launch.

---

## 11. Risk and uncertainty model

| Factor | Effect |
|--------|--------|
| Explicit “not sure” / advice answers | Increase unknown weight; widen package spreads |
| Legacy + undocumented integrations | Integration/migration variance ↑; discovery bias |
| Regulated / KYC ambiguity | Compliance variance ↑; discovery-first more likely |
| Aggressive deadline vs critical path | Add coordination/capacity packages or phase recommendation—not false certainty |
| Missing assets / immature product level | Discovery and UX packages emphasized |

Risk explanations appear in public `costDrivers` / assumptions as plain language; numeric risk weights stay private.

---

## 12. Scenario-generation logic

Three scenarios from **explicit package sets**, not % of recommended:

| Scenario | Intent |
|----------|--------|
| **Lean** | Must-have capabilities + mandatory safety foundations; defer optional polish |
| **Recommended** | Full selected scope + standard ops packages |
| **Scale-ready** | Recommended + alternate variants, stronger NFR / ops packages |

Mandatory safety dependencies preserved in every scenario. Each scenario returns its own range, timeline band, and capability list for the results UI and documents.

---

## 13. Discovery-first rules

Trigger discovery-first recommendation when configured thresholds are crossed, e.g.:

- Aggregate unknown-weight above threshold  
- Legacy replacement + undocumented integrations  
- Regulated workflow with insufficient clarity  
- Overall confidence below configured floor  

**Behaviour:** Still return a **broad** full-product range for orientation, but set `recommendedNextStep` to a discovery engagement (fixed discovery package from config) and frame the full build as contingent on discovery outcomes.

---

## 14. Client results-page design

Route pattern: secure result view keyed by result id + resume auth (cookie/token).

**Above the fold (after calculate):** Recommended scenario range (ZAR), confidence wording, “indicative planning estimate” disclaimer, primary next-step CTA.

**Below:** Alternative scenarios · timeline · workstream allocation · cost drivers · assumptions & exclusions · unknowns · scenario capability lists · contextual portfolio proof (claims already on site only) · Project Blueprint visual.

**Lead actions (after value):** Email me this · Download PDF · Upload brief · Prefer call / workshop. Consent required for contact persistence and email.

Optional scope toggles recalculate into a new result revision.

---

## 15. Project Blueprint visual concept

Semantic CSS/SVG composition—not Three.js, not a dashboard.

- Reads as a **blueprint / plan**: grid, lanes, connected workstreams derived from selected packages.
- Updates with answers/results (desktop sticky summary; mobile drawer).
- Brand mint `#67AFA7` on neutral dark/light surfaces matching the site.
- Decorative only for meaning that is also available in text (a11y).

---

## 16. Client document specification

**Canonical:** Accessible semantic HTML document from the **frozen** public result snapshot (print stylesheet).

**PDF:** DocRaptor PDF/UA-1 from the same HTML/snapshot; branded; tagged for accessibility.

**Must include:** Summary ranges, scenarios, timeline, drivers, assumptions, exclusions, confidence, next step, Good Code contact, generated-at + estimate reference.

**Must never include:** Role rates, hours×rate internals, margins, internal notes, admin overrides, private calculation trace.

**Email (Resend):** Link to secure document + short summary; idempotent send; consent recorded.

---

## 17. Admin quotation workflow

**Area:** `/admin/project-blueprint/` (Supabase Auth + `admin_profiles` roles: `reviewer` | `admin` | `approver`).

| Step | Action |
|------|--------|
| Inbox | Filter by status, assignee, date; open estimate |
| Detail | Answers, AI confirmations, public result, private trace, uploads, risks, activity |
| Quote draft | Select scenario; adjust packages/roles; custom & third-party lines; milestones; commercial terms |
| Overrides | Reason required; threshold may require `approver` |
| Preview | Client-safe preview |
| Freeze / issue | Immutable `quote_versions` snapshot; email client |
| Outcome | Accepted / declined recorded; audit appended |

Pricing editor: edit `pricing_drafts` → publish new immutable `pricing_versions` with checksum + `is_placeholder` flag.

---

## 18. Data model

See `supabase/migrations/20260721000000_project_blueprint.sql`.

| Table | Role |
|-------|------|
| `admin_profiles` | Maps `auth.users` → reviewer/admin/approver |
| `pricing_versions` | Immutable published config snapshots |
| `pricing_drafts` | Editable draft JSON |
| `estimate_sessions` | Token hash, status, answers, expiry, resume fields |
| `answer_revisions` | Append answer history |
| `estimate_results` | Public result + private trace + checksum |
| `leads` | Post-value contact + consent |
| `uploaded_briefs` | Quarantined storage metadata + scan status |
| `reviewed_quotations` | Admin quote header |
| `quote_versions` | Frozen issued snapshots |
| `quote_line_items` / `quote_milestones` | Structured quote content |
| `quote_approvals` | Threshold approvals |
| `analytics_events` | Non-sensitive funnel events |
| `calibration_records` | Estimate vs actual comparisons |
| `audit_events` | Append-only operational audit |

Published pricing versions and issued quote versions are update/delete protected by triggers.

---

## 19. API / server-action contracts

Typed handlers under `app/api/project-blueprint/` (and/or server actions sharing Zod schemas).

| Operation | Auth | Notes |
|-----------|------|-------|
| `POST /session` | Anonymous + CSRF/origin | Create session; set HTTP-only cookie; return public session id |
| `POST /session/resume` | Token or cookie | Validate hash; reject expired |
| `PATCH /session/answers` | Session auth | Debounced autosave; write `answer_revisions` |
| `POST /intake` | Anonymous + rate limit | OpenAI (or keyword fallback) maps idea text onto catalogue answers + concept brief; 0–3 follow-ups; **never prices** |
| `POST /classify` | Session | Keyword classifier; optional AI adapter; Zod-validated suggestions only (legacy) |
| `POST /calculate` | Session | Server engine; persist `estimate_results`; never return private rates |
| `POST /recalculate` | Session | New result row |
| `POST /leads` | Session + consent | Idempotent on session |
| `POST /documents/email` | Session + consent | Resend + idempotency key |
| `POST /documents/pdf` | Session | DocRaptor; fallback to HTML |
| `POST /uploads/sign` | Session + consent | Signed URL; MIME/size limits |
| `POST /uploads/scan-webhook` | Scanner HMAC | Verify secret; update scan_status |
| Admin quote/config routes | Role-gated | Service role in DAL only; re-check roles every mutation |

**Errors:** Stable codes (`VALIDATION`, `EXPIRED_SESSION`, `RATE_LIMITED`, `FORBIDDEN`, `SCAN_FAILED`, `PDF_UNAVAILABLE`). No secrets in bodies. Idempotency keys on email/issue.

---

## 20. Security and privacy design

- Default-deny RLS; browser uses anon key only for permitted session paths if any; mutations prefer service role via server DAL after authz checks.
- Session resume: random opaque token; store **hash only**; `PROJECT_BLUEPRINT_SESSION_SECRET` in HMAC/hash.
- CSRF/origin checks on cookie-authenticated routes; Zod on all inputs; output encoding on documents.
- Rate limits on intake, classify, calculate, lead, upload, email.
- Uploads: private quarantine bucket; deny download until `scan_status = clean`; fail closed if scanner unavailable (estimator still usable without upload).
- POPIA-minded retention (see operations); redacted structured logs (no idea text, emails, or rates in analytics).
- Security headers on Vercel; least-privilege service keys; admin MFA encouraged at IdP.

---

## 21. Analytics plan

`analytics_events.event_name` (enum-like text) + `properties` JSONB **non-sensitive only**.

**Suggested events:** `estimator_view`, `intake_clarification_requested`, `intake_ready`, `intake_website_handoff`, `review_viewed`, `estimate_calculated`, `scenario_viewed`, `lead_submitted`, `document_emailed`, `pdf_downloaded`, `upload_started`, `upload_clean`, `session_resumed`, `session_expired`, `admin_quote_issued`.

**Never send:** idea descriptions, PII, raw answers, filenames, rates, margins, traces.

Admin metrics: abandonment/resume funnel, estimate→quote conversion, override frequency, work-package variance (from calibration).

---

## 22. Accessibility requirements

Target **WCAG 2.2 AA**.

- Keyboard: all controls, summary drawer, scenario tabs; visible focus (existing ring/`#67AFA7`).
- Screen reader: semantic headings, labelled groups, live region for autosave/errors.
- Blueprint visual: decorative with text equivalent.
- Documents/PDF: tagged PDF/UA; HTML canonical remains accessible.
- Contrast on mint/neutral in light and dark themes; no information by colour alone.
- `prefers-reduced-motion` respected; axe checks in E2E.

---

## 23. Error and edge-case handling

| Case | Behaviour |
|------|-----------|
| Network blip on autosave | Retry UI; local draft buffer until ack |
| Expired session | Clear message + start new; optional recover if within grace |
| Validation fail | Inline field errors from Zod messages |
| Calculate fail | Non-destructive; keep answers; retry |
| PDF unavailable | Offer HTML document / retry |
| Scanner down | Block upload only; continue estimator |
| Dependency conflict | Auto-include foundations; explain in UI |
| Impossible deadline | Phase or extend timeline messaging |
| Placeholder pricing in prod | Admin banner; optional soft warning not shown to clients as “calibrated” |

---

## 24. Responsive layouts

| Breakpoint | Layout |
|------------|--------|
| &lt; md | Single column; summary in bottom drawer; sticky progress |
| md+ | Main column + sticky blueprint summary rail |
| lg+ | Comfortable max-width aligned with site containers (`max-w-6xl` patterns) |

Touch targets ≥ 44px; no horizontal scroll; results charts/lists stack cleanly.

---

## 25. High-fidelity visual design

Reuse existing site tokens—not a separate brand system.

| Token | Value / source |
|-------|----------------|
| Primary | `#67AFA7` (`--primary`) |
| Primary hover | `#559e97` |
| Eyebrow | `#2f6f69` / `#9ed9d2` (dark) |
| Background | Light white / dark `#0a0a0a` |
| Fonts | Geist Sans / Geist Mono |
| Radius | `--radius` 0.5rem |
| Motion | `lib/motion.ts` conventions |

**Avoid:** purple SaaS gradients, dashboard chrome, inset hero cards, Three.js for this journey, emoji decoration.

Hero: one composition—brand **Project Blueprint**, page title, one supporting sentence, CTA group, blueprint atmosphere.

---

## 26. Functional implementation notes (Next.js 16 App Router)

- Route: `app/custom-software-estimator/page.tsx` (+ result/document subroutes as needed).
- Components: `components/project-blueprint/*` (new only); reuse `Navbar`/`Footer` from root layout.
- Domain: `lib/project-blueprint/*`; engine + placeholder config are `server-only`.
- Supabase: `@supabase/ssr` clients in `lib/supabase/*`; cookie refresh via `proxy.ts`; re-check roles in DAL.
- Email: Resend adapter with idempotency; PDF: DocRaptor adapter.
- Env: see `.env.example`; never prefix secrets with `NEXT_PUBLIC_`.
- Feature flags optional for AI provider and Monte Carlo.

---

## 27. Unit tests scope

Vitest (+ fast-check where useful):

- Branching reachability and `canProceed`
- Dependency foundations non-removable
- Answer Zod normalize + unknown handling
- PERT expected/variance, P50/P80 helpers
- Resolve packages from answers; modifiers; risks
- Scenario sets preserve mandatory deps (no % hacks)
- Discovery gate thresholds
- Rounding bands and ZAR formatting
- Checksum stability; budget ignored by calculate
- Timeline never shorter than critical path
- Quote freeze immutability helpers; permission checks

---

## 28. E2E tests scope

Playwright + `@axe-core/playwright`:

- Website vs custom routing from pricing page
- Describe → optional clarifications → concept preview → calculate
- Website-shaped descriptions hand off to `/website-pricing`
- Value-before-lead on results
- Optional scope → new result revision
- Lead + consent; email/PDF happy path (mocked providers)
- Mobile + keyboard + axe on key screens
- Admin: open estimate, publish pricing, override approval, issue quote

---

## 29. Seed configuration (placeholder rates)

`supabase/seed.sql` loads clearly labelled **PLACEHOLDER** roles (ZAR sell rates), work packages (low/likely/high hours), modifiers, risk rules, discovery packages, commercial settings (ZAR, rounding bands, tax placeholder), and one published `pricing_versions` row with `is_placeholder = true`.

Clients never see the word “placeholder”; admins do until a calibrated version is published.

---

## 30. Calibration guide

1. Export immutable original estimate, reviewed quote, agreed scope, actual effort/duration, change requests.
2. Store comparisons in `calibration_records` with variance reasons.
3. Review recommendations in admin—**no automatic rule mutation**.
4. Human edits `pricing_drafts`, then publishes a **new** `pricing_versions` row (checksum, `is_placeholder = false` when calibrated).
5. Historical estimates remain tied to their original `pricing_version_id`.

See `docs/project-blueprint/operations.md` for operational steps.

---

## 31. Phased delivery

| Phase | Scope |
|-------|--------|
| **MVP** | Spec + schema + domain/engine + public estimator UI + deterministic seeded calculate + results (value before lead) + basic lead capture |
| **Admin** | Auth roles, inbox, quote editor, approvals, documents/email/PDF, quarantined uploads, pricing publish flow |
| **Intelligence** | OpenAI intake (taxonomy mapping, no prices), analytics funnel, calibration records/UI, hardening, full a11y/responsive/error audit |

Ship continuously under one product; these are internal checkpoints, not separate products.
