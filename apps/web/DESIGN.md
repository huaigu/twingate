---
name: SignalPass homepage
description: A bright designer-toy studio for meaningful personal introductions.
colors:
  home-blue: "#264be6"
  home-blue-hover: "#1738ba"
  home-paper: "#fbfaf7"
  home-ink: "#192727"
  home-muted: "#52615f"
  home-line: "#dedfd8"
  stage-sky: "#dfeaf7"
  card-paper: "#fffefb"
  leaf-wash: "#e8eddc"
  leaf-ink: "#32442f"
  apricot-wash: "#f3e3d4"
  apricot-ink: "#624129"
  terms-cobalt: "#253ecc"
  terms-paper: "#f5f4ec"
  lime-signal: "#d2ef75"
  blue-ceramic: "#244bea"
  apricot-ceramic: "#f4a267"
typography:
  display: {fontFamily: "'Manrope Variable', sans-serif", fontSize: "clamp(60px, 6.08vw, 88px)", fontWeight: 620, lineHeight: 1.04, letterSpacing: "-0.04em"}
  headline: {fontFamily: "'Manrope Variable', sans-serif", fontSize: "clamp(33px, 3.5vw, 48px)", fontWeight: 650, lineHeight: 1.12, letterSpacing: "-0.04em"}
  body: {fontFamily: "'Manrope Variable', sans-serif", fontSize: "15px", lineHeight: 1.8}
  label: {fontFamily: "'Manrope Variable', sans-serif", fontSize: "13px", fontWeight: 570, lineHeight: 1.6}
rounded:
  tag: "5px"
  tab: "6px"
  nav-action: "7px"
  button: "8px"
  mobile-nav: "10px"
  card: "12px"
  stage: "14px"
spacing:
  tight: "8px"
  compact: "12px"
  related: "16px"
  grid: "24px"
  navigation: "32px"
  steps: "45px"
components:
  button-primary: {backgroundColor: "{colors.home-blue}", textColor: "#fff", rounded: "{rounded.button}", padding: "16px 23px"}
  button-primary-hover: {backgroundColor: "{colors.home-blue-hover}"}
  button-navigation: {textColor: "{colors.home-ink}", rounded: "{rounded.nav-action}", padding: "11px 17px"}
  text-link: {textColor: "{colors.home-ink}"}
  navigation: {textColor: "{colors.home-ink}", typography: "{typography.label}"}
  interest-tag: {textColor: "{colors.leaf-ink}", rounded: "{rounded.tag}", padding: "4px 8px"}
  profile-leaf: {backgroundColor: "{colors.leaf-wash}", textColor: "{colors.leaf-ink}", rounded: "{rounded.card}", padding: "28px 33px 23px"}
  profile-apricot: {backgroundColor: "{colors.apricot-wash}", textColor: "{colors.apricot-ink}", rounded: "{rounded.card}", padding: "28px 33px 23px"}
  introduction-summary: {backgroundColor: "{colors.card-paper}", textColor: "{colors.home-ink}", rounded: "{rounded.card}", padding: "17px 21px 10px"}
  preview-tab-selected: {backgroundColor: "{colors.card-paper}", textColor: "{colors.home-ink}", rounded: "{rounded.tab}", padding: "10px 12px"}
---

# Design System: SignalPass homepage

## Overview

**Canonical visual reference:** `/Users/bojack/.codex/generated_images/01a09418-72f0-7e51-8ae4-6594147e69b7/exec-3c753038-4cb0-4e93-ad15-66720b233e3e.png`. Any homepage visual comparison or follow-up polish must use this image as the source of truth.

The hero is implemented as a Figma-like layer stack: paper background and collage accents, header, left copy, two isolated character assets, a central introduction-card layer, signal nodes, and the right-side process notes. The full reference image is retained only as a comparison artifact and is not rendered as the page.

**Creative North Star: "Designer-toy studio"**

Bright, tactile personal characters make introductions feel approachable. Generous chalk space, direct Manrope typography, saturated cobalt and quiet pastel surfaces support a friendly, deliberate visual world.

This document remains the source of truth for the shipped homepage at `/`, using `app/home.module.css`, `app/page.tsx` and `components/PersonaScene.tsx`. The related product routes now use the v2 paper-and-agent system in `app/globals.css`: Builders, Profile, Composer and Inbox separate public Profile, private Personal Agent suggestions and explicit human confirmation. V2 reference images live in `../design-explorations/signalpass-v2/`; product strategy and limitations live in `HOMEPAGE_REDESIGN.md` and `PRODUCT.md`.

**Key Characteristics:**

- Imagegen-extracted left and right Builder Personas, plus a reference-derived central Introduction Card layer. Hunyuan/Blender GLBs remain optional runtime assets for future animation work.
- Open typography and flat pastel panels, with selective ambient shadows.
- Short introduction summaries and explicit human choice.

## Colors

Primary: **Home cobalt** marks actions, the wordmark symbol, headline emphasis and focus. **Deep cobalt** is the primary hover state; **Terms cobalt** anchors the cost and consent panel.

Secondary: **Stage sky** gives the sculpture breathing room. **Blue ceramic** and **Apricot ceramic** are material colors, not interchangeable UI accents; studio lighting changes their rendered appearance.

Tertiary: **Leaf wash / leaf ink** and **Apricot wash / apricot ink** pair profile backgrounds with readable text. **Lime signal** marks selection and focus against the terms panel.

Neutral: **Chalk** is the page ground, **Card paper** lifts the introduction summary, **Home ink** carries headings, **Home muted** carries supporting copy, **Home line** separates regions, and **Terms paper** carries inverse headings.

## Typography

Self-hosted Manrope Variable, supplied by `@fontsource-variable/manrope`, is the homepage's only font family. Use its variable weights directly; the family falls back to sans-serif. This is a role-based hierarchy, not a fixed modular scale.

Display uses tight tracking and controlled line breaks; cobalt highlights one phrase. Section headlines retain that compact character. Explanatory body copy uses the frontmatter body role; hero copy is larger (18px, line-height 1.8). The summary heading is compact (19px, weight 650), with summary body text at 14px and line-height 1.7. Navigation uses the label role; small example labels and notes are 10–12px.

## Layout

The shared desktop container is `min(1304px, calc(100% - 112px))`. The hero pairs left copy and right artwork on a `0.96fr 1.04fr` grid with a 30px gap; the stage is 578px high. Below it, a ruled belief strip, three open steps, two profile panels and a two-column cobalt explainer vary the composition. Section spacing is generous and contextual, not a uniform stack of cards.

At 1150px and below, outer gutters become 32px and the hero heading is 66px. At 900px, navigation becomes a disclosure, the hero and terms panel stack, and the stage is capped at 620px wide with a 610px height. The heading becomes `clamp(62px, 10vw, 86px)`.

At 540px and below, gutters become 20px, steps and profiles become single columns, and the stage is 532px high. Display becomes `clamp(48px, 12.8vw, 66px)` with line-height 1.08. The summary retains space for changing text, and preview controls remain below it. At 1600px and above, the hero gap grows to 50px.

## Elevation & Depth

The reference hero uses composited raster layers for fidelity: paper stage, isolated imagegen character cutouts and a cropped introduction-card layer. Hunyuan/Blender GLBs remain available for a later animated variant; they are not required to render the reference-faithful first layer.

UI elevation is selective: summary (`0 18px 35px -24px #284b8170`), name labels (`0 6px 12px -8px #293b5670`), mobile navigation (`0 14px 30px -15px #14202a33`) and profile hover (`0 20px 30px -25px #23382e66`). Most sections remain flat.

The optional 3D scene still loads on demand when used by a future variant. The current first layer is intentionally lightweight and deterministic; reduced motion disables CSS transitions.

## Shapes

Small controls have gently rounded corners; large stages use broader curves from the frontmatter scale. Profile tags use a thin current-color border. Initial avatars, numbered tab markers and the play control are circular. Thin rules divide steps and terms; broad backgrounds establish larger regions. The original split SignalPass mark and four-point spark repeat as inline SVG.

## Components

**Primary action:** cobalt link button with a diagonal arrow, weight 650, 14px type and 55px minimum height. Hover deepens the color and lifts 2px; active returns to rest. On phones it becomes 12px type with a 48px minimum height. The outlined navigation action is quieter; text links reveal an underline on hover.

**Navigation:** compact horizontal links beside the wordmark and demo action. Below 900px, a labeled toggle exposes a chalk dropdown with the same destinations and demo status. The skip link appears on keyboard focus. Focus outlines are 3px cobalt with a 5px offset, switching to lime inside the cobalt panel.

**Introduction preview:** a paper summary floats beneath the sculptures and above three numbered tabs. The middle summary state is initially selected. Tabs update the shared context, summary and recipient-choice copy plus the sculpture pose; arrows, Home and End move focus and selection. The text uses a polite live region, and the example label stays visible.

**Profiles and tags:** entire pastel profile panels are links, with an initial avatar, concise role, context and outlined interest tags. Profiles lift 4px on hover. Alice uses the leaf pair; Bob uses the apricot pair. Tags inherit the panel's ink and communicate interests, not interactive filters.

**Terms panel:** a cobalt field pairs a large headline with three numbered, ruled explanations. Preserve separate visual entries for evaluation cost, refundable bond and recipient choice. No inputs, dialogs or form controls are established by this homepage.

## Do's and Don'ts

- Do retain the blue and apricot figures as visibly illustrative personal agents.
- Do give summaries and human decisions clear space beside the character artwork.
- Do preserve the keyboard tab pattern, visible focus and reduced-motion behavior.
- Do keep homepage tokens scoped to this surface until another route is deliberately redesigned.
- Don't present example characters or seeded profiles as generated customer identities or live activity.
- Don't collapse the evaluation fee and refundable bond into one cost label.
- Don't replace the studio's spatial artwork with raw agent dialogue or decorative status dashboards.
