# VS Code Codex Prompt: Good Code Homepage White Space + Three.js Refinement

Use this prompt inside VS Code Codex to refine the redesigned Good Code homepage.

---

You are working inside the existing Good Code website codebase. The homepage redesign is directionally strong and the copy should mostly be preserved, but the visual treatment needs refinement.

Act as an award-winning product designer and senior frontend engineer. Keep the Apple-inspired design philosophy: restraint, clarity, precision, generous white space, excellent typography, quiet confidence, and one memorable interactive moment that feels intentional rather than decorative.

## Core feedback to apply

The current redesign introduced warm background colors and warm icon color shifts. Remove that direction.

The Good Code homepage should retain:

- Mostly white space in light mode.
- Mostly deep neutral / black space in dark mode.
- Good Code green / teal as the primary accent.
- Neutral typography and neutral icon colors unless an accent is truly needed.
- Clean section rhythm, premium spacing, and calm hierarchy.

Avoid:

- Beige, cream, tan, peach, copper, brown, orange, or warm editorial backgrounds.
- Changing icon colors section by section.
- Decorative warm color blocks.
- Halfway “wow” effects such as small floating decorations, blobs, fake particles, or generic gradients.
- Busy animation that competes with the team portrait.

The page should feel more like a refined Apple product page: mostly quiet, spacious, and precise, with one high-quality technical visual moment.

## Visual direction

Use this palette discipline:

- Light mode backgrounds: `white`, near-white, and subtle neutral borders only.
- Dark mode backgrounds: `neutral-950`, black, and subtle white borders only.
- Accent: Good Code green / teal, using the existing brand colors such as `#67AFA7`, `#2f6f69`, and suitable dark-mode teal text like `#9ed9d2`.
- Icons: mostly neutral. Use green only for primary affordances or a single coherent accent system.
- Cards/panels: minimal, restrained, border-led, no nested cards.

The team portrait remains the emotional anchor. The rest of the homepage should support it through space, rhythm, and technical elegance, not through more color.

## Three.js wow factor

Add one best-in-class Three.js animation that supports the Good Code design language.

This must not be a gimmick. It should feel like a quiet technical signature: precise, spatial, responsive, and refined.

Recommended concept:

Create an interactive “connection field” or “collective intelligence field” using Three.js:

- A full-width, unframed canvas section or subtle canvas layer integrated between major homepage sections.
- Fine points, thin lines, or flowing paths that suggest people, systems, collaboration, and code coming into alignment.
- Use Good Code green plus neutral white/grey/black tones.
- In light mode, the animation should feel airy on white.
- In dark mode, it should feel crisp and luminous on deep neutral/black.
- It should respond subtly to pointer movement, scroll position, or viewport size.
- It should have graceful idle motion.
- It should respect `prefers-reduced-motion`.
- It should never obscure copy or make text harder to read.
- It should degrade safely if WebGL is unavailable.

Do not use:

- Gradient blobs.
- Floating orbs.
- Bokeh.
- Cartoon particles.
- Loud neon effects.
- Heavy parallax.
- A canvas trapped inside a decorative preview card.

The Three.js work should be genuinely polished. If it cannot be made excellent, keep it simpler and more precise rather than flashy.

## Technical requirements

Read the current homepage implementation before editing:

- `app/page.tsx`
- `components/hero.tsx`
- `components/services.tsx`
- `components/home-process.tsx`
- `components/home-outcomes.tsx`
- `components/about-link.tsx`
- `components/home-final-cta.tsx`
- `app/globals.css`
- `package.json`

Implement the refinement in the existing Next.js codebase.

- Use Tailwind CSS for layout and styling.
- Use `three` for the Three.js animation.
- If `three` is not installed, add it to the project dependency list using the existing package manager.
- Build the Three.js animation as a focused client component, for example `components/home-connection-field.tsx`.
- Clean up WebGL resources on unmount.
- Use `requestAnimationFrame` responsibly.
- Resize correctly on desktop and mobile.
- Avoid memory leaks.
- Respect reduced motion.
- Avoid hydration errors.
- Use stable canvas dimensions and responsive constraints.

## Placement guidance

Place the Three.js moment where it strengthens the homepage narrative without stealing the hero’s role.

Good options:

- Between `Services` and `HomeProcess`, as a quiet transition from capability to process.
- Between `HomeProcess` and `HomeOutcomes`, as a visual metaphor for systems becoming connected.

The hero portrait should remain the strongest visual signal in the first viewport. The Three.js section should be the secondary “wow” moment later in the scroll.

## Section refinement

Update the existing redesigned sections:

1. Services
   - Remove warm backgrounds.
   - Keep the refined capability copy and layout.
   - Use white / neutral surfaces in light mode.
   - Use deep neutral surfaces in dark mode.
   - Make icons consistent and mostly neutral, with green used sparingly.

2. How we work
   - Remove warm icon treatments.
   - Keep the clean process structure.
   - Use neutral icon containers or simple green accent lines.

3. Outcomes
   - Remove warm background surfaces.
   - Keep the outcome-led copy.
   - Use a clean white/neutral grid in light mode and neutral black grid in dark mode.

4. About / team bridge
   - Remove warm icon treatments.
   - Preserve the human copy.
   - Let the portrait concept and green accent carry the brand feeling.

5. Final CTA
   - Keep it strong and minimal.
   - Use black/dark neutral with Good Code green as the action color.

## Quality bar

Before finishing, review the homepage like a portfolio-defining product page.

Check:

- The page is mostly white space and neutral surfaces in light mode.
- Dark mode feels intentionally premium, not simply inverted.
- Good Code green is the only real brand accent.
- Icon colors are consistent and not changing randomly.
- The Three.js animation is crisp, purposeful, and technically polished.
- The animation supports the design instead of distracting from copy.
- The hero portrait remains the primary emotional anchor.
- No warm palette remnants remain.
- No gradients, blobs, or cheap decorative effects were introduced.
- Mobile layouts remain excellent.
- Text does not overlap the canvas or other UI.
- Performance is acceptable.

## Verification

After implementation:

- Run the available build/type/lint checks.
- Start the dev server if possible.
- Inspect desktop and mobile views.
- Test light and dark mode.
- Verify the Three.js canvas is nonblank, correctly framed, and animating.
- Check `prefers-reduced-motion` behavior.
- Confirm WebGL resources are cleaned up on unmount.

If Playwright is available, use screenshots and a canvas pixel check to verify the Three.js scene renders on desktop and mobile.

## Deliverables

Report:

1. Which warm/background/icon treatments were removed.
2. What Three.js animation was added and where it appears.
3. Which files were changed.
4. How light mode and dark mode now behave.
5. What verification was performed.
6. Any limitations or follow-up recommendations.

