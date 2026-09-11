# SignalPass

> **High-signal introductions for Monad builders**
> Built for the **Monad Metropolis Global Hackathon 2026**  
> Track: **Social, Attention & Culture**

---

## 📖 Overview

**SignalPass** is a high-signal introduction network on **Monad**. It helps builders replace cold DMs with structured, context-rich introductions that only open when both people opt in.

### The Core Problem
1. **Cold DMs lack context**: Builders cannot tell whether a stranger is a future collaborator or another generic pitch.
2. **Compute inversion**: If a recipient uses an AI gatekeeper, the recipient should not pay to assess an unsolicited request.
3. **Blunt paywalls fail socially**: A fixed price can discourage legitimate first-time collaborators without creating a better introduction experience.

### The SignalPass Experience
1. **3D Agent Persona**: Builders can create an optional Hunyuan-powered digital presence that represents their profile and current availability.
2. **Private agent handshake**: The sender's Intro Coach and the recipient's Gatekeeper exchange only permitted structured context. People see clear summaries and next steps, not opaque agent reasoning.
3. **Sender-pays evaluation**: The sender locks a transparent evaluation fee and refundable attention bond on Monad. The fee covers the recipient-side AI evaluation; the bond is governed by public timeout and resolution rules.
4. **Opt-in verified context**: Nansen can contribute concise, explainable onchain signals only when a builder chooses to disclose them.
5. **Human consent opens the introduction**: The recipient accepts, asks for more context, or declines. AI never grants access or unilaterally seizes funds.

---

## 📚 Project Documentation

- [📘 Hackathon Comprehensive Guide (`MONAD_METROPOLIS_HACKATHON_GUIDE.md`)](./MONAD_METROPOLIS_HACKATHON_GUIDE.md): Detailed breakdown of rules, 4 tracks, $250k+ prize pool, rubrics, and sponsor bounties.
- [📕 Original TwinGate System Specification](./TWINGATE_A2A_ATTENTION_FIREWALL_SPEC.md): Historical design record for the initial A2A attention-firewall concept.
- [📙 AI + Social + Monad Innovation Research (`AI_SOCIAL_MONAD_INNOVATION_IDEAS.md`)](./AI_SOCIAL_MONAD_INNOVATION_IDEAS.md): Comparison of Web3 AI social paradigms and the 4 frontier concepts.
- [📗 Social Track Deep Dive (`SOCIAL_TRACK_DEEP_DIVE_AND_IDEAS.md`)](./SOCIAL_TRACK_DEEP_DIVE_AND_IDEAS.md): Official 12 suggested starting points analysis.
- [📒 Product Direction & Architecture](./TWINGATE_PRODUCT_DIRECTION.md): Research-backed product positioning, MVP scope, module plan, and target architecture.
- [📝 Submission Copy](./SIGNALPASS_SUBMISSION_COPY.md): Canonical SignalPass name, one-liner, and Social-track description.
- [🎯 Sponsor Bounty Plan](./TWINGATE_BOUNTY_PLAN.md): Selected Hunyuan, Dynamic, Envio, and Nansen integrations with their demo evidence.
- [🗺️ Interactive Product Architecture](./docs/architecture/twingate-product-architecture.html): Archify diagram with dark/light themes and export controls.

---

## 🏗️ Architecture Stack

- **L1 Blockchain**: Monad Testnet / Mainnet (Parallel EVM, 800ms finality)
- **Smart Contracts**: Solidity 0.8.24+ (Foundry)
  - `ProfileRegistry.sol`: Builder profile, availability, and Gate policy version hashes.
  - `IntroductionEscrow.sol`: Evaluation fees, attention bonds, timeouts, and resolution.
  - `IntroductionReceipt.sol`: Evaluation and introduction outcome hashes.
- **Account Abstraction & Authentication**: Dynamic embedded wallets and signing
- **AI Experience**: Tencent Hunyuan 3D Agent Persona, Intro Coach, and recipient Gatekeeper
- **Verified Context**: Opt-in Nansen onchain signals
- **Indexing & Events**: Envio HyperIndex
- **Frontend**: Next.js 14 App Router, Tailwind CSS, Framer Motion

---

## 📄 License
MIT License

## AI Coding Assistance

AI coding tools are used during development. All generated changes are reviewed, integrated, and tested by the project team.
