# SignalPass image-to-code QA

Reference: `/Users/bojack/.codex/generated_images/01a09418-72f0-7e51-8ae4-6594147e69b7/exec-3c753038-4cb0-4e93-ad15-66720b233e3e.png`
Route: `/`
Viewports checked: 1672x941 desktop and 390x844 mobile.

## Comparison

| Section | Verdict | Notes |
| --- | --- | --- |
| Header | pass | Brand, center message, navigation and CTA follow the reference hierarchy. |
| Hero copy | pass | Three-line display headline, eyebrow, supporting copy and CTA rhythm match the reference. |
| Character stage | pass | Imagegen-derived transparent character layers sit on opposite sides of the card, with the left/right inward-facing composition matching the reference. Characters are explicitly above the card so they only cover the card edge, as in the reference. |
| Introduction Card | pass | The card is now HTML/CSS: paper surface, brand row, title, avatar image layers, Common Ground ellipse, bullet lists, prepared note and action buttons are independently rendered. The prior full-card image is no longer referenced by `page.tsx`. |
| Behind the scenes | pass | Right-side three-step explanation and closing note match the reference structure. |
| Mobile layout | pass | Hero stacks cleanly, characters use a compact camera layout, and the card no longer covers the entire stage or tabs. |
| Asset identity | follow-up | Character identity is intentionally an asset-level follow-up; the layout, framing and inward-facing placement are now independent of the chosen character source. |
| Facial animation | follow-up | Current GLBs are single static meshes; stage motion works, but eye/head rigging is a later Blender pass. |

## Verification

- `pnpm --filter @signalpass/web build`
- `pnpm --filter @signalpass/web typecheck`
- `git diff --check`

final result: pass with asset follow-up
