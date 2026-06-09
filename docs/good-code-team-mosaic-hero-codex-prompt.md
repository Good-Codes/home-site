# VS Code Codex Prompt: Good Code Team Mosaic Hero Section

Use this prompt inside VS Code Codex to build a new best-in-class hero section around the generated Good Code team mosaic artwork.

---

## Prompt

You are working inside the existing Good Code website codebase. Build a new best-in-class hero section around the generated surreal team mosaic artwork.

The hero image is a wide conceptual artwork showing the Good Code team as crowd-formed portraits, symbolising collective intelligence, collaboration, human connection, and the people behind the code. Treat this image as the emotional anchor of the section.

## Goal

Create a premium, modern, conversion-focused hero section for Good Code that feels native to the existing website and uses the team mosaic artwork as the main visual storytelling device.

The hero must feel like Good Code: calm, professional, technical, human, creative, and trustworthy. It should not look like a generic SaaS hero.

---

## Before coding

1. Inspect the existing Good Code project structure, framework, routing, styling system, components, typography, spacing, buttons, cards, nav, footer, and animation patterns.
2. Reuse existing components, design tokens, CSS variables, utilities, and layout conventions wherever possible.
3. Do not introduce random fonts, unrelated colors, new dependencies, or a separate design language.
4. Identify where the hero belongs:
   - If this is for the homepage, replace or enhance the existing homepage hero.
   - If this is for the website pricing page, use it as the opening hero for the pricing/service page.
   - If the site has reusable hero components, extend them rather than duplicating patterns.

---

## Hero concept

The hero should communicate:

> Good Code builds digital products through the strength of a connected, multidisciplinary team.

Use the generated image not merely as decoration, but as a visual metaphor for the company: many people, one shared outcome.

---

## Recommended hero copy

**Eyebrow:**  
Human-led digital solutions

**Primary heading:**  
Built by people. Powered by good code.

**Alternative heading options if better for the existing page context:**

- Websites and digital products built by a team that thinks with you.
- Clear digital solutions, shaped by real people.
- Good code starts with good people.

**Subheading:**  
We design and build websites, systems, and digital tools that help businesses move clearly, confidently, and beautifully online.

**Primary CTA:**  
Get a quote

**Secondary CTA:**  
Explore services

**Trust/supporting line:**  
Strategy, design, development, hosting, and ongoing support — all under one roof.

---

## Visual direction

Use the team mosaic artwork as the main hero image.

The image should feel cinematic and premium:

- Wide landscape format.
- Clean white or soft neutral background.
- Plenty of whitespace.
- Elegant image treatment.
- No heavy overlays that hide the artwork.
- No cluttered decorative graphics.
- No fake dashboard mockups unless the existing brand already uses that pattern.

### Preferred desktop layout

- Two-column hero.
- Left side: copy, CTAs, trust line.
- Right side: large artwork in a refined visual container.
- Let the image slightly overlap or break out of the grid if it fits the existing style.
- Use subtle gradients, masks, or soft shadows only if they align with the current design system.

### Preferred mobile layout

- Stack content and image.
- Keep heading above the fold.
- Image should crop safely and remain recognisable.
- Avoid tiny unreadable image placement.
- CTAs should be easy to tap.

---

## Image handling

Place the generated image in an appropriate public asset folder, for example:

```text
/public/images/good-code-team-mosaic-hero.png
```

Then reference it using the project’s standard image pattern.

### If the project uses Next.js

- Use the framework image component if already used elsewhere.
- Set sensible width/height.
- Prioritise/loading strategy should match a hero image.
- Use responsive sizes.
- Avoid layout shift.

### If the project uses regular React/Vite

- Use a semantic `img` tag.
- Set width/height if available.
- Use responsive CSS.
- Use `object-fit: cover` or `contain` depending on the final crop.

### Suggested alt text

> Conceptual artwork of the Good Code team formed from thousands of tiny people, symbolising collaboration and human connection.

If the image is purely decorative in the implementation, set empty alt text, but only do that if the surrounding text already communicates the same meaning. Prefer descriptive alt text.

---

## Interaction and motion

Add subtle, premium motion only if the site already uses animation:

- Gentle fade-up for text.
- Soft reveal for the image.
- Optional slow parallax or floating effect on the image container.
- Respect `prefers-reduced-motion`.
- Do not add distracting or performance-heavy animation.

---

## Section structure

Build the hero with semantic HTML:

- `section`
- clear container wrapper
- eyebrow text
- one `h1`
- paragraph subheading
- CTA group
- optional trust/supporting line
- image figure/container

Use correct heading hierarchy and avoid multiple `h1`s on the page.

---

## CTA behaviour

### Primary CTA

Link to the existing quote/contact flow.

Preferred href examples depending on the existing site:

- `/contact`
- `/contact-us`
- `/get-a-quote`
- existing quote route if present

### Secondary CTA

Link to services or the relevant section:

- `/services`
- `#services`
- `#pricing`
- whichever matches the project structure.

If this hero is for the pricing page, use:

- Primary CTA: `Get a quote`
- Secondary CTA: `Compare packages`
- Secondary CTA should scroll to the pricing cards section.

---

## Design requirements

The final hero should have:

1. Strong visual hierarchy.
2. A memorable, human-centred message.
3. Responsive layout from mobile to large desktop.
4. Excellent spacing and alignment.
5. Accessible color contrast.
6. Visible keyboard focus states.
7. No horizontal overflow.
8. No image distortion.
9. No layout shift.
10. No unnecessary dependencies.

---

## Good Code brand feel

The section should feel:

- polished but not flashy,
- technical but not cold,
- creative but not chaotic,
- human but still premium,
- confident but not arrogant.

Use subtle details such as:

- fine grid lines,
- soft radial gradients,
- restrained borders,
- rounded cards,
- quiet shadows,
- small technical labels,
- clean editorial typography,

but only if these match the existing website.

---

## Optional microcopy ideas

Small stat/trust chips may be added only if they fit the current design and are true or already present elsewhere on the site.

Possible safe chips:

- Strategy
- Design
- Development
- Support

Avoid inventing metrics such as “100+ clients” or “10 years experience” unless already verified in the codebase/content.

---

## Implementation guidance

Create a reusable component if appropriate, for example:

- `HeroSection`
- `HomeHero`
- `PricingHero`
- `TeamMosaicHero`

Keep the component focused and readable.

If adding CSS:

- Prefer the existing styling approach.
- Use existing breakpoints.
- Use existing color variables.
- Keep class names clear.
- Avoid one-off messy styles.
- Do not break existing responsive behaviour.

---

## Acceptance criteria

The work is complete when:

1. The hero image is integrated cleanly and loads correctly.
2. The section looks excellent on mobile, tablet, laptop, and large desktop.
3. The copy is clear and aligned with Good Code’s positioning.
4. The CTA buttons work.
5. The image is not stretched, badly cropped, or visually overwhelming.
6. The page remains accessible and performant.
7. Existing nav/footer/layout remain intact.
8. No unrelated visual system has been introduced.
9. Lint, formatting, type-checking, and build pass where available.

---

## After implementation

Run the project’s available commands, such as:

- formatter
- linter
- type-check
- build

Then report:

1. Files changed.
2. Components created or updated.
3. Where the image asset was placed.
4. How the hero behaves responsively.
5. How the CTAs connect to the existing quote/services flow.
6. Any assumptions made.
