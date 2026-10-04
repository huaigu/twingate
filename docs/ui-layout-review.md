# UI layout review

Preserve SignalPass's compact paper-and-illustration composition. A typography or accessibility change must be checked in the complete page, including the controls below it.

## Before merging a layout change

1. Capture before and after at the same viewport, using the same sample profile and introduction. Review the full page as well as the first screen.
2. Check all ten views: home, profile editor, assistant, profile/privacy settings, Discover, introduction composer, inbox, receipt, widget editor, and widget preview.
3. Open affected dialogs: profile draft review, public profile preview, person details, shared context, and introduction review. Check their close and primary actions remain reachable.
4. Compare card heights, text wrapping, empty space, action placement, footer position, and horizontal overflow. Investigate any extra row or substantial height increase before release.
5. Check long names, an 80-character interest, a long unbroken interest, short/long bios, and empty/populated lists. Text must wrap inside its container without clipping or pushing controls out of view.
6. Check 320, 390, 700, 701, 768, 1180, 1181, and 1363px widths. The 700/701 and 1180/1181 boundaries switch layouts. Record whether each check was rendered in a browser or reviewed from source; do not treat the latter as a device test.
7. Use visible UI controls and sample mode for review. Do not send real introductions or initiate wallet transactions merely to test layout.

## Layout constraints

- Some legacy views use a scaled illustration canvas. Increasing text with inverse scale inside fixed columns can create excessive wrapping and tall cards. Preserve the original proportions; use narrowly scoped rules when a control needs a larger target.
- Keep long labels bounded with `max-width: 100%`, normal white-space, and a wrapping rule where necessary. `overflow-wrap` alone does not override `white-space: nowrap`.
- Use fluid grid tracks for controls in narrow columns. A row of fixed-width choices must fit its actual column, including gaps and padding.
- Do not conceal a regression with clipped overflow or a fixed card height. Keep text and actions available.
- Version changed shared stylesheets in every entry HTML file, so an existing browser receives the corrected layout.

## Reference review: 4 October 2026

After the compact layout correction, the 1363 × 936 desktop sample showed a profile draft card of approximately 539px and an inbox list/detail of approximately 593/639px. Both pages fit a 936px document height. These are comparison points for the same sample content, not fixed heights to impose on other content.

The subsequent all-page review covered the remaining eight views and five dialogs using full-page desktop screenshots. No additional desktop height regression was observed. Focused source review found narrow-column persona choices and long interest labels requiring containment. Phone/tablet geometry was reviewed from source; a rendered device check remains part of the release checklist.

Existing offline behavior regressions can be run with:

```sh
node --test scripts/agent-refinement-test.mjs scripts/v4-flow-test.mjs scripts/wallet-quote-test.mjs
```

These tests cover application behavior, not visual layout. Keep screenshot review as a separate release check.
