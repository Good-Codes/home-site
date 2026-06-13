# VS Code Codex Prompt: Good Code Homepage Experience Upgrade

Use this prompt inside VS Code Codex to redesign and implement the full Good Code homepage so the entire page feels worthy of the team portrait hero artwork.

---

You are working inside the existing Good Code website codebase. Act as an award-winning product designer and senior frontend engineer. Your goal is to significantly improve the entire homepage experience so it meets the visual and emotional standard set by the Good Code team portrait hero image.

The hero artwork is the creative anchor: a wide, luminous, gallery-like team portrait formed from thousands of tiny people. It communicates human connection, collective intelligence, technical craft, optimism, trust, and scale. The rest of the homepage must feel like it belongs to this image. It should be premium, calm, precise, human, and memorable without becoming decorative or distracting.

Capture the design philosophy associated with Apple: restraint, clarity, confidence, impeccable spacing, strong typography, deliberate motion, high-quality material treatment, and a sense that every element has been placed with care. Do not copy Apple pages or visual assets. Translate those principles into a distinctive Good Code experience.

## Existing context

Read the current code before editing:

- `app/page.tsx`
- `components/hero.tsx`
- `components/services.tsx`
- `components/about-link.tsx`
- `app/globals.css`
- `app/layout.tsx`
- any shared UI components used by the homepage

The homepage currently includes:

- `Hero`
- `Services`
- `AboutLink`

The hero uses:

- `/team_potrait.png`
- `/team_potrait_dark.png`

Keep the portrait as the homepage’s emotional anchor. Build around it rather than competing with it.

## Design direction

Create a homepage that feels like a calm, premium product experience for a serious software studio.

Use the portrait’s qualities as the design system cue:

- Spacious off-white and deep charcoal surfaces.
- Good Code teal as the primary brand accent, used sparingly.
- Warm human neutrals pulled from the portrait, such as soft peach, muted copper, warm grey, and ink.
- Fine detail used with restraint, inspired by the crowd-formed texture in the artwork.
- High contrast where it matters, quiet surfaces everywhere else.
- Rounded corners should be modest and refined, not playful.
- No loud gradients, decorative blobs, gimmicky effects, oversized generic SaaS cards, or busy illustrations.

The page should feel cinematic but useful. It should invite trust, make the services easy to understand, and guide visitors naturally toward contacting Good Code.

## Homepage structure

Redesign the full homepage as a coherent scroll experience:

1. Hero section
   - Preserve the current hero concept and portrait image.
   - Keep the light/dark portrait support.
   - Make the surrounding copy, spacing, CTA row, and transition into the next section feel premium.
   - The hero should remain the visual climax of the first viewport.

2. Services overview
   - Replace any generic service-card feeling with a refined capability overview.
   - Make the section easy to scan.
   - Use restrained iconography from `lucide-react`.
   - Explain what Good Code does in business language, not just technical labels.
   - Avoid making every item visually equal if hierarchy would help.

3. How we work
   - Add or redesign a section that explains Good Code’s working style.
   - Communicate clarity, collaboration, technical judgment, delivery discipline, and ongoing support.
   - Use a minimal timeline, stepped layout, or editorial grid.
   - Avoid decorative process graphics that do not add meaning.

4. Outcomes / proof
   - Add a polished section that shows what clients gain: faster launches, clearer operations, dependable platforms, better customer experiences, maintainable systems.
   - If existing project data is available, use it. If not, create concise outcome-led copy without inventing fake client names, fake metrics, or fake testimonials.

5. About / team bridge
   - Rework the existing `AboutLink` into a stronger bridge from the portrait to the people behind the work.
   - Make it feel intentional rather than like a small generic CTA card.
   - Invite users to meet the team and understand the company’s values.

6. Final CTA
   - End with a clean, confident CTA.
   - Use direct copy: invite the visitor to start a project, request a quote, or talk through an idea.
   - Keep it visually calm and decisive.

## Interaction and motion

Motion should feel refined and purposeful:

- Use subtle entrance animations with `framer-motion` where the project already uses it.
- Keep durations calm and consistent.
- Use small opacity/translate transitions rather than flashy movement.
- Respect reduced motion.
- Add hover states that feel tactile but understated.
- Avoid constant animation, parallax gimmicks, or effects that distract from reading.

## Dark mode

The homepage must be excellent in both light and dark mode.

- Use the dark portrait in dark mode.
- Ensure all sections have intentional dark surfaces.
- Avoid simply inverting colors.
- Maintain legibility and hierarchy.
- Teal accents should remain elegant, not neon.
- Borders and shadows should be subtle and visible on dark backgrounds.

## Copywriting

Rewrite homepage copy where needed. The tone should be:

- Clear.
- Human.
- Confident.
- Specific.
- Calm.
- Professional.

Avoid:

- Generic SaaS claims.
- Empty phrases like "innovative solutions".
- Overexplaining the interface.
- Long paragraphs.
- Fake metrics or testimonials.

Good Code should sound like a thoughtful software partner that builds web, mobile, and cloud products with care.

## Technical requirements

Implement the redesign in the existing Next.js codebase.

- Use existing frameworks and patterns.
- Use Tailwind CSS for styling.
- Use `next/image` for images.
- Use `lucide-react` icons where icons are needed.
- Keep components maintainable and focused.
- Prefer improving existing homepage components over creating unnecessary abstractions.
- Do not introduce a new design library.
- Preserve routing and existing links such as `/contact-us`, `/about-us`, and `#services`.
- Keep accessibility strong: semantic sections, useful headings, visible focus states, sufficient contrast, and meaningful link text.
- Keep mobile layouts polished, especially spacing, text wrapping, and CTA stacking.
- Avoid nested cards and decorative card-heavy page sections.

## Visual quality bar

Before finishing, review the page as if it were a portfolio-defining homepage.

Check:

- The hero still feels like the star.
- The sections after the hero feel worthy of the portrait, not like a template.
- The homepage has a clear narrative arc from identity to capability to trust to action.
- Light and dark mode both feel intentionally designed.
- Spacing is precise on mobile, tablet, and desktop.
- Text does not overflow, collide, or feel cramped.
- The page uses color with restraint and sophistication.
- The experience is premium but not distracting.

## Deliverables

Make the code changes needed to implement the improved homepage.

After implementation, report:

1. What changed.
2. Which files were edited.
3. How the homepage behaves in light and dark mode.
4. Any build, lint, or runtime checks performed.
5. Any limitations or follow-up recommendations.

