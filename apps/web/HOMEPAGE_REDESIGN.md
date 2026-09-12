# SignalPass homepage redesign

## Direction

Canonical visual reference for this homepage: `/Users/bojack/.codex/generated_images/01a09418-72f0-7e51-8ae4-6594147e69b7/exec-3c753038-4cb0-4e93-ad15-66720b233e3e.png`. All visual comparisons should use this exact file.

The shipped homepage now uses a Figma-like composited first impression: paper collage background, imagegen-extracted left and right Builder Personas, a cropped central Introduction Card layer, a short invitation, and an introduction result that the visitor can explore. Palette: paper ivory, ink navy, cobalt, Monad violet, signal mint and a small orange accent. Hunyuan/Blender 3D assets remain optional for a later animated treatment.

## Preserved alternate direction

The second visual direction remains a valid future variant: paper collage, oversized condensed type, Monad violet and acid-lime signal trails, with the Introduction Card held between two builders. It is the more kinetic hackathon treatment; the shipped homepage uses the first direction's quieter editorial world and borrows the signal trail as motion language.

The homepage is a Persuade surface for Monad builders. Its main action opens the existing builder directory; the three preview tabs explain shared context, the agent summary and recipient choice. The example is labeled, and the demo-status route remains visible. Existing application routes retain their current styling and behavior.

## Deliverable review

The existing repository has a working seeded Alice/Bob workflow, in-memory API, mock evaluation and Solidity code/tests. It is not yet a production social network. Dynamic, Nansen, Envio runtime and real Monad settlement are not connected. Accepting an introduction currently changes its state; it does not create a private room. Homepage copy therefore offers the working demo and does not claim live wallet authentication, generated customer personas, active users or deployed sponsor integrations.

Before public operation, the API needs authenticated access and recipient authorization: current read endpoints are public and transition actors are supplied in the request body. The receipt page's onchain wording also needs reconciliation with simulated settlement. These are existing delivery gaps, recorded here for follow-up; this change targets the homepage.

## Visual record

Code-led redesign, grounded direction 5, concept seed f1b06f20. The reference world is a designer-toy studio: personal characters making first contact. Challenger disciplines retained are immediate visual meaning (Fletcher), hierarchy (manual), continuity (dive), spatial mass (cloud), discrete interaction states (arcade), and tangible signal transfer (counter). Product facts and the user's request govern the result.

## Review locations

The Blender source and exported asset live at `scripts/create_signalpass_personas.py` and `public/models/signalpass-personas.glb`. The asset is an illustrative demonstration scene, not an identity credential or a generated customer persona. The self-hosted Manrope font is provided by @fontsource-variable/manrope under its packaged license.

The two Hunyuan character exports are web-optimized 2K GLBs under `public/models/`. The raw 75MB/76MB downloads are kept outside the repository; the optimized assets are about 25MB each after texture resizing and mesh decimation.

## Verification

Production build and web TypeScript checks passed on 2026-09-12. Browser checks covered 1440px desktop and 390px mobile without horizontal overflow, scene rendering after resizing, the three preview tabs (including arrow-key navigation), mobile menu opening/closing, and navigation to the directory with both seeded profiles. Homepage and introduction composer returned HTTP 200. No browser runtime errors were observed in these checks.

An independent screenshot/source review returned **ship** for the scoped homepage. The review covered brief fidelity, visual hierarchy, responsive/accessibility behavior and demo truthfulness; it did not validate production backend security or external sponsor integrations. Source changes passed git diff --check.
