# VS Code Codex Prompt: Good Code Website Services Pricing Page

Use this prompt inside VS Code Codex to turn the Good Code website pricing proposal into a polished, creative, brand-aligned website pricing experience.

---

## Prompt

You are working inside the existing Good Code website codebase. Your task is to design and implement a polished, creative, production-ready **Website Services Pricing** page or section using the pricing proposal content below, while preserving the existing Good Code design language, brand principles, component patterns, responsiveness, and technical quality.

## Primary objective

Create a beautiful, modern, high-converting pricing experience for Good Code’s website services. It must feel native to the existing Good Code website, not like a generic pricing template.

## Before coding

1. Inspect the existing project structure, framework, routing, styling system, components, typography, spacing, colors, buttons, cards, layout containers, nav/footer, and animation patterns.
2. Reuse existing design tokens, components, utility classes, and patterns wherever possible.
3. Do not introduce a new visual language, random colors, unrelated fonts, or unnecessary dependencies.
4. If the site already has a Services page, integrate this pricing experience either as a new route such as `/website-pricing`, `/pricing`, or as a strong section within the Services flow, depending on the existing architecture.
5. Keep the existing navigation and “Get a Quote” journey intact.

## Design principles to preserve

- Clean, professional, calm, modern interface.
- Strong whitespace and editorial hierarchy.
- Trustworthy small-business tone.
- Accessible, responsive layouts.
- Performance-conscious implementation.
- Clear conversion path to “Get a Quote”.
- Technical SEO and semantic HTML.
- No clutter, no over-decoration, no gimmicks.
- Creative details are welcome, but they must be subtle, premium, and brand-aligned.

## Content rules

- Publish only client-facing information.
- Do not expose internal costing, margin calculations, overhead assumptions, or management-review language.
- The public page should show packages, add-ons, hourly rates, care plans, payment terms, process, FAQ, and CTAs.
- Use **“from R…”** pricing.
- Highlight **Business** as **“Most Popular”**.
- Each tier must start with who it is for, then show the feature checklist.
- Every package must have one clear CTA: **“Get a quote”**.
- CTAs should link to the existing contact/quote form. If easy and appropriate, pass the selected package as a query parameter or prefilled message value.

---

# Page structure to build

## 1. Hero section

Create a strong hero for website services pricing.

**Suggested copy**

**Eyebrow:** Website Services  
**Heading:** Clear website packages for growing businesses  
**Subheading:** Choose a scoped website package, add the extras you need, and get a professional Good Code build with clear pricing from the start.  
**Primary CTA:** Get a quote  
**Secondary CTA:** Compare packages  

**Design direction**

- Use the existing Good Code hero style if one exists.
- Add a subtle code/grid/blueprint-inspired visual treatment if it fits the brand.
- Keep it clean and premium.
- Do not use stock-looking visuals.

---

## 2. Pricing tiers section

Show all three packages side by side on desktop, stacked on mobile.

### Package 1: Starter

**Price:** from R3,950  
**Who it is for:** A single-page site for a new business that needs a credible presence, fast.

**Features**

- 1 page, custom layout
- Mobile responsive
- Contact form
- WhatsApp + Google Maps
- Basic SEO & SSL
- 1 revision round
- 2 weeks support

**CTA:** Get a quote

---

### Package 2: Business

**Badge:** Most Popular  
**Price:** from R7,950  
**Who it is for:** A complete small-business site — the right starting point for most clients.

**Features**

- Up to 5 pages, custom
- Everything in Starter, plus:
- Enquiry form
- Basic content loading
- 2 revision rounds
- Handover training
- 4 weeks support

**CTA:** Get a quote

---

### Package 3: Business Plus

**Price:** from R12,950  
**Who it is for:** A larger brochure site for an established business with more to say.

**Features**

- Up to 8 pages, custom
- Everything in Business, plus:
- Blog / news section
- Image & video gallery
- POPIA compliance pack
- 3 revision rounds
- 6 weeks support

**CTA:** Get a quote

---

## Pricing card design requirements

- Desktop: 3-column comparison.
- Mobile: stacked cards with strong spacing.
- Business card should be visually emphasized, but not aggressively.
- Use a **“Most Popular”** badge.
- Use check icons only if they match the existing icon style.
- Avoid dense tables for the main packages.
- Make prices highly readable.
- Keep **“from”** visually secondary.
- Include subtle hover/focus states.
- Ensure keyboard focus is visible.

---

## 3. Add-ons section

Create a clean **Add-ons** block. It can be a table, card grid, or responsive list depending on the site style.

| Add-on | Price |
|---|---:|
| Extra page | R650 |
| Copywriting per page | R450 |
| Logo design | R1,500 |
| POPIA compliance pack | R1,200 |
| Booking / enquiry calendar | R1,800 |
| Extra revision round | R600 |
| Rush fee | +40% |

**Design direction**

- Keep scannable.
- Use simple rows or compact cards.
- Make it clear these can be added to any package where relevant.

---

## 4. Hourly rate section

Show ad-hoc rates clearly.

| Work type | Rate |
|---|---:|
| Standard changes & edits | R450/hr |
| Development & integrations | R650/hr |

**Supporting copy**

For work outside the original scope, ad-hoc changes are billed at the relevant hourly rate after approval.

---

## 5. Monthly care plans section

Create a care plans section that communicates recurring support.

| Plan | Price | Core |
|---|---:|---|
| Care Lite | R299/mo | Hosting, backups, security, monitoring. |
| Care Standard | R650/mo | Lite + 1 hr edits/mo + monthly check. |
| Care Pro | R1,250/mo | Standard + 3 hrs edits + priority support. |

**Design direction**

- These should feel related to the main packages but visually lighter.
- Consider a horizontal comparison on desktop and stacked cards on mobile.
- Make it clear care plans are monthly.

---

## 6. Process section

Add a simple **How it works** section with five steps.

1. Enquiry
2. Quote
3. 50% deposit
4. Build
5. Go live

**Suggested copy**

A scoped enquiry becomes a clear quote. Once the agreement is signed and the deposit is paid, we build, review, and launch.

**Design direction**

- Use a timeline, step cards, or numbered flow.
- Keep it simple and confidence-building.

---

## 7. Payment terms section

Add a concise trust-building block.

**Copy**

50% deposit to start with the signed agreement; 50% on completion before go-live. Quotes are valid for 30 days.

**Design direction**

- Place near pricing or before final CTA.
- Use a calm highlighted panel, not a warning box.

---

## 8. FAQ section

Create a short FAQ using accessible accordion behavior if the site already has accordions. If not, implement simple semantic disclosure elements or a clean static FAQ.

### Q: What does “from” pricing mean?

A: It is the starting price for a standard build. Your final quote may change if you add extra pages, copywriting, integrations, rush delivery, or other add-ons.

### Q: Which package should I choose?

A: Starter is best for a simple one-page presence. Business is the best fit for most small businesses. Business Plus is for larger brochure sites that need more content, media, or compliance support.

### Q: Are hosting and maintenance included?

A: Project packages cover the website build. Ongoing hosting, backups, security, monitoring, and edits are available through the monthly care plans.

### Q: Can I add features later?

A: Yes. Extra pages, copywriting, logo design, POPIA compliance, booking calendars, revisions, and development work can be added as needed.

### Q: How do payments work?

A: A 50% deposit starts the project after the agreement is signed. The remaining 50% is paid on completion before the website goes live.

### Q: What happens after launch?

A: Each package includes a short support period. For ongoing support, choose a monthly care plan.

---

## 9. Final CTA section

Create a strong final call-to-action.

**Suggested copy**

Ready to price your website properly?  
Tell us what you need and we’ll help you choose the right package.

**CTA:** Get a quote

---

# Implementation requirements

- Match the existing Good Code nav/footer structure.
- Use existing button styles.
- Ensure all sections are responsive.
- Use semantic HTML: proper `h1`, `h2`, `h3` hierarchy.
- Add appropriate metadata/title/description if this is a new page.
- Maintain accessibility: keyboard navigation, focus states, readable contrast, descriptive labels.
- Do not break existing pages.
- Do not add unnecessary packages or dependencies.
- Keep bundle impact low.
- Reuse existing styles/components first.
- If creating new components, keep them small, reusable, and consistent with the codebase.

---

# Quality bar

- The result should look like a premium Good Code page.
- It should be conversion-focused but not salesy.
- It should be visually more polished than a plain pricing table.
- It should clearly communicate value, scope, payment terms, and next step.
- It should be easy for a small-business owner to understand in under 60 seconds.

---

# After implementation

1. Run the project’s formatter, linter, type-check, and build commands if available.
2. Fix any issues.
3. Summarize the files changed.
4. Explain any assumptions made.
5. Mention how the pricing CTAs are connected to the quote/contact flow.
