# Desktop motion and reading pass

The animated people-and-context hero is the active homepage direction again, following user feedback on 2026-09-28. The three-panel example treatment was removed. The fluid discovery/composer workspaces and integrated account navigation from EXPERIENCE.md remain. motion:verify checks the hero reveal, replay geometry and reduced-motion behavior. MOTION_QA_DIR can select a separate capture directory.

Baseline: 9410b00. Direction: a living correspondence desk, keeping the supplied figures and paper collage.

## Intent and system

The person is a builder reading a potential collaborator's profile, drafting a considered invitation and approving an action. The visual priority is always the current human choice. Motion supports understanding and spatial continuity; it never invents an AI operation, a conversation, delivery or a payment result.

The domain remains correspondence, shared context, invitations, replies, consent and refundable attention. The color world remains parchment, ivory, ink, violet, lilac and sage. Signature details are the connecting thread on the hero, a physical postcard response on people cards, the four-part writing meter and an accepted-only seal. Avoid permanent floating decorations, fake progress and a generic animated dashboard.

Typography and surfaces inherit polish.css: serif names/headings, readable sans-serif body/controls, an ivory surface over parchment, restrained borders, violet for interaction and sage for accepted consent. Desktop card descriptions render at 13px despite the legacy scaled canvas; composer text renders at 14px. Spacing stays on the existing 4px grid, with 18px card gaps following the established composition and 24px-scale reading areas.

| Surface | Focal point and hierarchy | Motion | Reason and boundary |
| --- | --- | --- | --- |
| Hero | The person and the context-to-introduction thread; page CTA remains immediately usable | Shortened existing connection reveal; explicit replay; anchors do not move | Makes the opening readable sooner; no permanent looping |
| Person/widget cards | Name, offer and profile entry; avatar reduced to give desktop text room | At most 1.2° tilt per axis and 4px lift, fine-pointer desktop only | A restrained paper response; keyboard focus has an equivalent cue |
| Reading surfaces | Card content first; decorations stay fixed | One finite 360ms entrance; stagger capped at 135ms | No global hidden state; failure or disabled motion never hides content |
| Composer | Four actual text sections, followed by the review action | Meter follows non-empty fields; focused field number changes tone | Counts drafted sections, not validation, consent, delivery or money |
| Dialog/navigation | Current decision and keyboard focus | 190ms dialog, 160ms menu entry | Native dialog behavior and focus restoration remain authoritative |
| Accepted receipt | Confirmed consent and financial facts | A one-time seal and a 520ms fading ring | Only after the receipt publishes accepted state; no pending-success animation |

## Lifecycle and access

- Uses native Web Animations, CSS and IntersectionObserver. No new dependency or image generation is needed for this pass.
- Reduced-motion preference disables movement and can change at runtime. All content, counters and controls remain usable.
- Touch/coarse-pointer devices do not tilt cards. Keyboard selection is tested independently.
- Owned animation pauses on visibility change; entries run once. Page exit cancels active work. The visibility listener is tested with a controlled hidden-state event; this is not a claim about battery usage on every device.
- Card pointer updates are limited to one animation frame; no idle animation loop is scheduled. No indefinite animation is added.
- DOM observers watch added content and the explicit receipt-state attribute, not every style mutation.
- The implementation does not call mutation APIs. Acceptance/settlement state still comes from the existing authorized application path.

## Reproduce

Start the app with pnpm chain:dev, then run pnpm motion:verify. MOTION_BASE_URL selects another running preview.

Run pnpm motion:record for the same checks plus an explicit-sample-mode 1440px recording at .run/motion-pass/desktop-tour.webm. The clip is UI demonstration, not proof of a public transaction.

Run CHAIN_TEST_MOTION=enabled pnpm chain:verify to drive real local EVM wallet transactions with normal motion enabled. Also run pnpm verify and pnpm build. Desktop checks prioritize 1280/1440/1920px and retain a 390px regression pass.

Image input is unavailable to this agent. Browser state, geometry, animation lifecycle, assets and real interactions are verified automatically; the recording and before/after captures are for human visual review.
