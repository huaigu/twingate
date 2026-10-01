# SignalPass Submission Copy

> Status: current-state submission copy, reviewed against the repository on 2026-10-01.
> Primary track: **03 Social, Attention & Culture**.
> The description below distinguishes the working prototype from its Personal Agent vision. Update deployment claims only after recording public network evidence.

## Name

SignalPass

## One-Liner

SignalPass helps people turn shared interests into thoughtful introductions, with context, clear consent and optional refundable attention bonds.

## Vision

**People worth knowing, with context.**

We want everyone to have a private Personal Agent that understands who they are, helps them find people worth meeting, and prepares the first conversation. People choose what to share and whether a relationship begins. Monad builders are our first community, not the limit of that vision.

## Description

Good connections often start with a bad introduction: a vague message that gives someone little reason to reply. SignalPass helps people explain who they are, why they want to connect, what they can offer and what they would like to do next.

Our working Web prototype supports wallet sign-in, user-approved profiles, discovery of public profiles, structured Introduction Cards and delivery between independent accounts. The sender reviews the exact message and shared context before sending. The recipient can ask for more context, accept or decline. Both participants can return to their introduction and its status after a refresh or server restart. Discovery currently uses profile filtering; it is not model-driven matchmaking.

The prototype also has an optional wallet-bond flow, verified on a local EVM. A sender approves a signed quote and locks a refundable attention bond. The introduction is delivered after funding is confirmed. Acceptance or rejection returns the bond; an unanswered request can be resolved after its deadline to claim the refund. The receipt records the transaction and settlement status. This flow uses human review, charges zero AI evaluation fee and still requires network gas. Paying never guarantees a response or acceptance.

We are building toward Monad so that attention commitments and refunds can be checked independently of the application. The current signed-quote revision has not yet been verified on public Monad Testnet. Local transactions demonstrate the mechanism; they are not public deployment evidence.

The next step is to connect a real Personal Agent to this consent flow: find a few relevant people, explain the reasons, prepare a draft and wait for the user's approval. The ambition is a better beginning to a relationship, with people retaining control of their attention, context and money.

## Current Capability Boundary

| Capability | What can be claimed today |
| --- | --- |
| Web introductions | Authenticated cross-account delivery, profile approval and visibility, context requests/replies, recipient decisions, participant-only receipts and persistence. |
| Wallet bonds | Signed quotes, funding verification and refunds implemented and tested on a local EVM; public Monad Testnet deployment remains pending. |
| AI evaluation | Evaluation interfaces and mock mode exist. The wallet-bond flow uses human review with zero AI evaluation fee; it does not charge for real model inference. |
| Bring your own agent | A person can import a JSON profile draft and review it. This is not a direct OpenClaw or Hermes integration. |
| Privacy | Private introduction records have participant access controls. The server does not provide application-level encryption at rest or end-to-end encrypted chat. |
| Sponsors | Dynamic, a live Envio index and Nansen verification are not integrated. Hunyuan remains unconfigured. No sponsor integration is claimed as complete. |

## Roadmap — Not Shipped Claims

1. **Public Monad proof:** deploy and verify the current contracts, make the product accessible, and record a two-wallet lock, decision and refund with explorer links.
2. **One real Personal Agent path:** discover people from authorized profiles, explain recommendations, draft an introduction and hand it to the user for confirmation. Prove one working host or model path before adding more adapters; this does not depend on enabling Hunyuan.
3. **Sender-funded evaluation:** connect real evaluation to settlement before charging an evaluation fee. Display the fee separately from the refundable bond and explain when it is earned. Pre-evaluation expiry must refund both the unearned fee and bond; AI must never seize the bond or accept an introduction.
4. **Useful connections in practice:** test with a small, consenting first community of Monad builders and record where context helps, where people hesitate and whether they choose to continue the conversation. No traction or outcome figures are claimed yet.
5. **Optional enhancements:** evaluate embedded wallets, event indexing, consented verified signals and 3D personas when they improve the introduction experience or meet a selected bounty's verified requirements.

## Copy Rules

- Lead with **people**, **context**, **introductions** and **human consent**. Describe Monad builders as the initial community.
- Describe Personal Agents as the vision until a real model and tool flow has been demonstrated. Importing JSON and filtering profiles do not prove that flow.
- Identify **sample mode**, **live no-payment mode**, **local EVM** and **public testnet** accurately in copy and recordings. Local proof must not imply public deployment.
- Keep fees and bonds separate. The current manual-review wallet flow has a zero AI evaluation fee; gas still applies. A refundable bond does not buy acceptance or eliminate every form of spam.
- Do not call SignalPass a chat protocol, public infrastructure layer, or standalone pay-to-DM product.
- Do not claim private chat, automated matching, source verification, installed agent skills or sponsor integrations without implementation and runtime evidence.
- Do not describe wallet context as a wealth score or let it imply automatic access decisions.
- Keep future capabilities in the roadmap, not in present-tense submission claims.
