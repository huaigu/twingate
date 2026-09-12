---
version: 1
slug: "apps-web-app-page-tsx"
primary_target: "apps/web/app/page.tsx"
related_targets: ["apps/web/app/home.module.css","apps/web/components/PersonaScene.tsx"]
---

# SignalPass homepage redesign

## Direction

Replace the document-like homepage with a social first impression: two authored ceramic 3D personas, a short invitation, and an introduction result that the visitor can explore. Palette: cobalt, sky blue, apricot, leaf green and chalk. Actual React/Three.js artwork; no generated images were used because this session had no image-generation tool or configured image API key.

The homepage is a Persuade surface for Monad builders. Its main action opens the existing builder directory; the three preview tabs explain shared context, the agent summary and recipient choice. The example is labeled, and the demo-status route remains visible. Existing application routes retain their current styling and behavior.

## Deliverable review

The existing repository has a working seeded Alice/Bob workflow, in-memory API, mock evaluation and Solidity code/tests. It is not yet a production social network. Dynamic, Nansen, Envio runtime and real Monad settlement are not connected. Accepting an introduction currently changes its state; it does not create a private room. Homepage copy therefore offers the working demo and does not claim live wallet authentication, generated customer personas, active users or deployed sponsor integrations.

Before public operation, the API needs authenticated access and recipient authorization: current read endpoints are public and transition actors are supplied in the request body. The receipt page's onchain wording also needs reconciliation with simulated settlement. These are existing delivery gaps, recorded here for follow-up; this change targets the homepage.

## Visual record

Code-led redesign, grounded direction 5, concept seed f1b06f20. The reference world is a designer-toy studio: personal characters making first contact. Challenger disciplines retained are immediate visual meaning (Fletcher), hierarchy (manual), continuity (dive), spatial mass (cloud), discrete interaction states (arcade), and tangible signal transfer (counter). Product facts and the user's request govern the result.

## Review locations

Desktop and mobile captures are stored locally under .impeccable/review/. The 3D scene is an illustrative, code-authored asset with no external model or image attribution. The self-hosted Manrope font is provided by @fontsource-variable/manrope under its packaged license.
