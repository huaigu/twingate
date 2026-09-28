# V4 detail pass — 2026-09-28

## Direction and working brief

The person here is a builder deciding whether to introduce themselves, reveal profile context, or approve a wallet transaction. The product should feel like a carefully prepared letter on a shared studio desk: welcoming before the conversation, precise when consent or money matters.

- Domain: introduction, correspondence, shared context, invitation, reply, consent, refundable pledge.
- Color world: parchment, ivory paper, dark ink, violet ribbon, faded lilac, sage leaf.
- Signature: the existing people-and-paper collage, complemented by a correspondence still life. The interface remains live HTML; illustration never replaces text, inputs, amounts or controls.
- Defaults to avoid: a generic gray dashboard, oversized technical status banners, and illustration used as background noise. Preserve the supplied characters and page compositions.

Shared palette and surfaces are recorded as semantic sp-* variables in polish.css. Parchment is the base; ivory is the reading surface; violet identifies actions; sage identifies an accepted state. Depth uses quiet borders and a restrained shadow. Georgia headings keep the correspondence voice; Arial controls and body copy preserve legibility. Spacing uses a 4px base, 24/32px content padding, and 12/20px control padding.

| Surface | Intent and focal point | Hierarchy, type and density | Depth and surface |
| --- | --- | --- | --- |
| Account strip | Understand identity/network, then sign in | 14px semibold status; 12px secondary line; 44–48px action; 72/80px desktop/mobile rail | Ivory utility surface with quiet bottom rule, outside the scaled art |
| Controls | Confidently approve the next step | One sans-serif family, 14px/600, 48px controls; 12px corners; visible focus and pressed state | Violet primary; subtle bordered secondary |
| Empty views | Understand what is missing and take one next action | 24–28px serif heading; 14px body; a single next-step action; illustration supports the copy | Paper surface and small editorial still life |
| Receipt | Read the introduction and verify financial facts | Letter-like spacing; tabular amounts; bond amount leads metadata; explicit state color | Paper over parchment; quiet lilac before a decision, sage after acceptance |

## Measured baseline

The baseline is functional commit ff340df. The before/after captures use the same routes, viewports and explicit sample state, plus the actual unauthenticated live empty views.

| Area | Baseline | Root cause | Change |
| --- | --- | --- | --- |
| Desktop account rail | y=7px inside the scene, sharing the header area | Header is absolutely positioned; a normal-flow sibling starts at the scene origin | Dedicated layout slot outside the scaled viewport |
| Mobile account rail | 97–118px on app pages | Long status prose and a wrapped action row | Short two-level copy; stable 80px utility rail |
| Agent actions | 11px labels | Page-local font overrides | 14px sans-serif controls with consistent padding |
| Profile actions | Secondary button uses Georgia while primary uses Arial | A legacy page-specific style overrides the control family | Shared native-button font and interaction treatment |
| Mobile home action | 40px height | Landing-specific compact override | 48px primary action |
| Empty inbox | One 13px sentence, no local action | Plain placeholder paragraph | Illustration, explanation and explicit sign-in/discovery action |
| Filtered inbox | Prior detail can remain after a list becomes empty | The filter changes rows without hiding the detail panel | Hide stale details when no matching contact exists |

## Generated art

The user explicitly requested the supertoken-gpt-image-2 skill. The bundled generator produced the correspondence illustration with gpt-image-2.5-sunburst, high quality, 1024×1024. Exact hosted URL, timestamp, processing and SHA-256 are in asset-provenance.json.

The shipped WebP is about 32 KB. It is decorative, has an empty alt attribute and explicit intrinsic dimensions, and contains no interface text. Existing supplied people, diagrams, logo and icon system remain native assets.

## Validation and review boundary

Run the normal V4, live-account and wallet-browser regression suites. Compare the before/after 1440px and 390px captures, check intermediate widths, loaded assets, native focus/keyboard navigation, hit targets and actual computed styles. The comparison gallery lives under .run/ui-polish/.

Image input is disabled in this tool environment. The agent can generate and integrate the asset and inspect browser geometry, CSS, text, runtime errors and interactions, but cannot personally inspect screenshot pixels. The before/after gallery is therefore provided for human visual review; passing automation is not a claim of a completed aesthetic review or exact reference matching.
