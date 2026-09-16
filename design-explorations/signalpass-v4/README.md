# SignalPass V4

V4 combines the supplied `SignalPass-hero-natural-v3.html` landing page with the six screens in `SignalPass-refined-v2 (1).html`. The files in `reference/` preserve the extracted source designs. The maintained website lives in `apps/web/public/v4/`.

Base: local `main` at `03db06b`. Integration branch: `codex/signalpass-v4`.

## Run and verify

```sh
pnpm install --frozen-lockfile
pnpm v4:dev
# in another terminal, with Chrome installed:
pnpm v4:verify
pnpm --filter @signalpass/web typecheck
pnpm --filter @signalpass/web build
```

Preview: `http://localhost:3004/`. `V4_BASE_URL` overrides the origin used by the verification script; `V4_QA_DIR` overrides `/tmp/signalpass-v4-qa` for screenshots. The script uses the installed Google Chrome channel, so no separate browser download is needed on this machine.

## What was integrated

- The supplied Hero composition and staggered connection animation, including the static reduced-motion state.
- All six native HTML product screens, their text/controls/SVGs and the supplied WebP decoration/portrait assets.
- A product header and mobile menu with real links. The prototype page switcher, review toolbar, image comparison dialog and explanatory CTA popups have been removed from the public UI.
- Landing sections explaining the profile → discovery → introduction journey and linking to the profile widget.
- A new introduction receipt screen, including the follow-up-context loop.

V4 uses native multi-page HTML. Next.js `beforeFiles` rewrites serve these pages at the public routes below; it does not render a full-site screenshot, iframe wrapper or imported JavaScript string. Page reloads and browser back/forward work normally. Existing React, API and contract code remains in the repository; the new V4 flow currently uses its own local demo state.

## Page and action map

| Route | Source / live file | Actions |
| --- | --- | --- |
| `/` | Hero V3 → `index.html` | Create profile, discover, introductions, how-it-works anchors, widget |
| `/profile/import` | Inner sources → `profile.html` | Add/edit/remove source URLs, import agent JSON, edit profile fields, review/approve |
| `/profile/review` | `profile.html` | Opens the review dialog; approval leads to agent settings |
| `/agent` | `agent.html` | Visibility, independent matching opt-in, source permissions, interests, preview, save/continue |
| `/discover/settings` | `agent.html` | Compatibility alias for privacy/matching settings |
| `/discover` | `discover.html` | Goal selection, local sample search, loading/empty states, candidate detail |
| `/discover/:candidateId` | `discover.html` | Opens the selected candidate; known IDs: maya, rohan, leo |
| `/introductions/new/:candidateId` | `compose.html` | Correct recipient, editable persisted draft, goal, shared-context opt-in, final confirmation |
| `/introductions/new` | `compose.html` | Resumes the current draft or uses Rohan as a sample |
| `/introductions/:id/confirm` | `compose.html` | Opens a matching draft; already submitted IDs lead to their receipt; unknown IDs show a recovery path |
| `/introductions/:id/receipt` | `receipt.html` | Pending / accepted / context requested / declined, exact approved message, recipient preview |
| `/inbox` | `inbox.html` | Five seeded examples plus introductions created on this device, tabs, recipient summary |
| `/inbox/:id` and `/inbox/:id/decision` | `inbox.html` | Selects the matching locally created record; accept / ask / decline |
| `/widget/create` | `widget.html` | Live name, intro, persona, tag and CTA editing; copy embed; preview |
| `/widget/preview` | `widget-preview.html` | Real Shadow DOM widget rendering the selected public fields |

## Interaction contract

`localStorage['signalpass-v4']` stores the profile, selected source URLs, agent preferences, widget fields, current draft, inbox decisions and introduction records. V3 state is not overwritten.

1. A source URL is validated and saved, not crawled. Agent JSON can populate the editable draft; only known text fields are imported, and user text is escaped or inserted with `textContent`.
2. The user approves the profile draft, then chooses visibility. Matching stays independent of public/limited/private visibility. Settings survive refresh.
3. Discovery operates over three sample profiles with transparent keyword/goal matching. Matching off pauses suggestions while browsing stays available. Searching cannot contact anyone.
4. Selecting a candidate carries that person's identity into the composer. Editing saves a local draft. Only the final confirmation creates an introduction record. Choosing “message only” excludes profile interests from that record.
5. The receipt links to a clearly labelled recipient preview. The recipient can accept, request context or decline. Accepted/declined records are terminal; controls prevent a second contradictory decision.
6. A request for context appears on the receipt. The sender can approve a reply; the same record returns to pending and the recipient sees the extra context before deciding.
7. Widget embed code contains only its displayed public fields and an absolute script URL for the current host. External embeds do not read the visitor's private app state. The CTA leads to SignalPass onboarding; the public-profile/contact service is not yet integrated.

This is a functioning frontend demo. Social login, ownership verification, public-source retrieval, real model inference, cross-user delivery, publicly hosted profiles, payments and on-chain receipts are not connected. There is no claim of encrypted server-side matching. The footer and confirmation screens distinguish local demo actions from external operations.

## Visual direction and implementation choices

The audience is anyone wanting a thoughtful introduction: a friend, collaborator or someone to learn from. The visual world stays close to a physical notebook: warm paper, ink navy, violet signal lines, sage interest markers, orange hand-drawn underlines, portrait cutouts and handwritten marginalia. The signature is the connection between a human portrait and a small piece of shared context.

The dominant element changes by task: the profile draft, discovery input, introduction message or recipient decision. The supplied serif headings and Arial body remain; cards retain the approved spacing and layered paper shadows. UI controls are live HTML/SVG with keyboard focus. Figures and collage are local WebP assets. New receipt and landing sections share the same type, materials and palette.

Desktop inner-page composition follows the supplied 1648px design coordinate system with a fluid scale capped at 1800px. At 1180px and below, the source's native responsive grid takes over. The mobile menu replaces the reference-only scrolling page selector. The decorative profile-page note was removed from the header because it overlapped the real navigation.

## Maintenance

- Edit live HTML/CSS/JS in `apps/web/public/v4/`; do not rerun the one-time page importer over refinements.
- `scripts/import-v4-references.mjs` parses the JSON container and decodes its embedded assets without evaluating that container. It is retained for provenance; original source HTML is preserved by the user in Documents.
- `scripts/prepare-v4.mjs` is a guarded one-time conversion, not a build step.
- `styles.css` is the extracted inner-page visual baseline; `hero.css` is the extracted Hero baseline; `v4.css` holds integration/polish rules.
- `app.js` owns local state and inner-page interactions; `hero.js` owns the reveal; `navigation.js` owns mobile navigation; `receipt.js` owns receipt rendering and replies; `embed/widget.js` owns the embeddable card.
- The V4 code does not need Figma, an image model, external fonts or third-party APIs to render.
