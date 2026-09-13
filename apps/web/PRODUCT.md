# SignalPass

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Monad builders seeking collaborators and people with shared interests. The current audience is hackathon participants exploring a seeded demonstration.

## Product Purpose

Let personal agents help people decide whom to meet. A sender pays for evaluating an introduction; the recipient receives a useful summary and chooses whether to accept.

The future product shape is one private Personal Agent per person, one public Builder Profile, and an optional 3D Persona. The Agent may recommend people and prepare an Introduction, but it cannot send, accept, decline, or unlock a private introduction without the owner’s explicit confirmation. OpenClaw, Hermes and the Web app are possible clients of the same SignalPass Agent surface; none of them is the network itself.

## Brand Commitments

SignalPass is the confirmed name. Social, Attention & Culture is the selected track. The user wants 3D personal identities, agent-to-agent interaction behind the scenes, and results presented to owners. The homepage must communicate these ideas visually.

## Capabilities and Constraints

Existing Next.js 15 and React 19 web application. Working routes: /builders, /builders/bob, /introduce/bob, /inbox/bob, /introductions/[id], /status. Seeded Alice/Bob identities, in-memory API and mock evaluation run locally. Wallet login, Hunyuan persona generation, Nansen disclosure fetches and live Monad settlement are not connected. Do not present illustrative personas as generated user assets, live customer profiles, or actual network activity.

The hackathon target adds agent-assisted discovery: a Personal Agent can read public Profiles, return a small explained shortlist, and draft a four-question Introduction after the user chooses a candidate. The MVP still supports manual directory discovery as the reliable fallback. Provider-specific OpenClaw/Hermes packaging is an adapter task; the product contract remains provider-neutral.

## Product Principles

- Lead with people and useful introductions.
- Explain the sender-funded evaluation fee separately from the refundable bond.
- Show owners a concise result, not raw agent dialogue.
- Preserve recipient choice and honest demo status.
- Make Agent recommendations explainable and reversible.
- Keep public Persona separate from private Agent memory and Gate Policy.
- Require human confirmation before relationship or funds state changes.

## Evidence on Hand

README.md and SIGNALPASS_PRODUCT_DIRECTION.md at the repository root describe the implementation and target product. No traction, testimonials, partner endorsement or production deployment may be invented.
