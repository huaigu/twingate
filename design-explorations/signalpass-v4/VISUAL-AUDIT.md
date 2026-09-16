# V4 visual and interaction audit

Reference sources: the supplied Hero V3 HTML and Refined V2 inner pages, rendered in Chrome at 1440 × 1000 and 390 × 844, DPR 1, reduced motion. The reference app is preserved under `reference/` for comparison; older V3 PNGs are supporting assets rather than the new visual authority.

## Initial comparison

| Section | Verdict | Evidence / action |
| --- | --- | --- |
| Hero figure, typography and context pills | Preserve | Use the supplied assets, serif family, proportions and fixed node anchors. Keep the natural reveal timings. |
| Header | Revise | Reference-only actions do not navigate. Replace with real product links and a mobile menu. |
| Profile header note | Revise | Its reference position overlaps the added product links at x≈1243–1412 on a 1440px viewport. Remove that decorative note. |
| Inner paper cards | Preserve | DOM inspection found identical source/target positions, font families, sizes and line heights for the main profile panels. |
| Prototype/footer switches | Remove | Reference tooling creates duplicate navigation and consumes significant mobile height. Replace with a quiet product footer. |
| Candidate and introduction identities | Revise | The original sample composer always displayed Alex. Bind portrait, name, topics and draft to the selected candidate. |
| Growing inbox details | Revise | Insert the actual introduction and reply in normal document flow; the existing ResizeObserver expands the desktop scene. |
| Receipts and landing explanation | Add | New functional screens/sections use the same paper, serif, violet and restrained shadows. |

## Measurements retained

At 1440px, profile source workspace x=533.01, y=125.83, width=828.35. Its heading uses Georgia at 30px/36px before the original stage scale. The profile body uses Arial at 13px/19px. These values match the supplied refined HTML. Native mobile cards replace the desktop stage below 1180px.

## Intentional differences

- Product header links, active page indicators and compact mobile navigation replace demo-page navigation.
- Hero action links lead to the website and the explanation below it. Review speed/replay/image-comparison controls are absent.
- Candidate details and recipient labels show the actual selected or persisted data.
- Footer communicates the local demo boundary once, without the old six-page switcher.
- Added local receipt and reply screens complete the flow; these have no original reference image.

## Checks

`pnpm v4:verify` captures every primary screen at desktop/mobile widths and exercises source input, JSON import validation, profile approval, independent visibility/matching persistence, candidate → composer continuity, private-context opt-out, confirmation → receipt → recipient decision, context reply, both terminal outcomes, widget data/export/preview, empty search, mobile navigation, Escape, product-link responses and finite Hero animation.

Additional responsive boundaries: 768, 1180, 1280 and 1920px. Browser errors, failed assets and horizontal document overflow fail the verification script. The script also checks that there is no full-page iframe or prototype review toolbar in the output.

Comparison boards are stored in `qa/`. New navigation/data copy is an intentional difference, so image-diff metrics are not used as a fake percentage of pixel fidelity. The original card layout and artwork remain the baseline.

Final fixed-viewport comparison: the profile source panel and profile draft crops both have zero pixel difference against the extracted reference render. Hero typography mean channel difference is 0.0808/255 and the connection scene is 0.0478/255, with the small residual coming from browser rendering. This only describes those named crops in the tested Chrome environment; it is not a claim that every state, viewport or the newly added sections is pixel-identical.
