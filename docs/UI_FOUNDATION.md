# V4 controls: Tailwind + daisyUI

The public product routes are rewritten by Next to native HTML in `apps/web/public/v4`. They do not inherit the React layout's styles. The controls use compiled Tailwind CSS 4.3.3 and daisyUI 5.7.47, with PostCSS 8.5.29 validating the generated CSS. No browser CDN or runtime styling script is required.

## Build and check

Use the repository's Node version and `pnpm@10.32.1`:

```sh
pnpm install --frozen-lockfile
pnpm ui:build
pnpm ui:check
```

`apps/web/ui.css` selects the real daisyUI button, input, textarea, select, checkbox, radio, tab and toggle components and defines the SignalPass paper/purple theme. Edit this source, not generated `apps/web/public/v4/ui.css`. Include regenerated CSS with changes. `ui:check` recompiles into a temporary directory and fails if the committed file differs; the main `verify` gate runs it.

The web `build` script compiles CSS before `next build`, including in the existing Docker build. The web `dev` script builds once, watches the source and V4 HTML/JavaScript, and runs Next. `pnpm --filter @signalpass/web css:watch` watches CSS separately. Stopping development closes its watcher and Next process.

## Cascade and component contract

Tailwind Preflight is omitted so the existing page layout, headings and illustrations retain their established defaults. Only selected daisyUI primitives are included; its modal, page resets, automatic dark theme and scroll-gutter behavior are excluded. The theme's standard `--size-field: 0.25rem` gives daisyUI its normal 40px medium control size.

Legacy page styles belong to `@layer legacy`. The compiled sheet declares the order `legacy, theme, base, components, utilities` and preserves daisyUI's original nested layers. This is important: flattening layers changes how selected, hover and disabled states compete, even if the rules are sorted. The build validates layer order, included primitives and the scoped theme selector. Keep the final `public/v4/ui-compat.css` unlayered and loaded after generated `ui.css`; it owns explicit control dimensions and compatibility with the scaled scenes. Do not add control appearance overrides back to page styles.

Use `.btn` with daisyUI variants, `.input`, `.textarea`, `.select`, `.checkbox`, `.radio`, `.tabs`/`.tab`, and `.toggle`. V4 HTML and JavaScript templates are scanned explicitly, including dynamic controls. The existing `.outline` state hook is explicitly excluded from Tailwind utilities; the visible button variant is `.btn-outline`. Preserve IDs, data attributes, event handlers, native `disabled`/`hidden` states and input labels. Native dialogs retain `showModal()`, focus restoration and close behavior; never style a closed dialog with an unconditional display utility.

The layout adapter uses 40px regular buttons, 32px compact controls (`.btn-sm`), and 48px prominent actions (`.btn-lg`). Text and square icon buttons share the same height at each size. At phone widths compact and regular controls use 44px targets, fields use 16px text, and removable tags have one total 44px row rather than extra padding around a 44px child. Legacy scenes compensate size, spacing, text and SVG dimensions through one scale token; native workspace pages use scale 1. Use `.sp-control-wrap` for intentionally multiline actions. The standalone embed loads the same compiled controls inside its shadow root with the SignalPass theme.

Run the existing flow, refinement and wallet regression suites after changing control markup. Use the browser review for actual keyboard focus, native dialog behavior, responsive sizes and long labels; the Node suites do not measure layout.

References: [Tailwind CLI](https://tailwindcss.com/docs/installation/tailwind-cli), [omitting Preflight](https://tailwindcss.com/docs/preflight#disabling-preflight), [daisyUI configuration](https://daisyui.com/docs/config/), [custom themes](https://daisyui.com/docs/themes/).
