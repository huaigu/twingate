# TwinGate (Bouncer Protocol) 🚪⚡

> **A2A Intelligent Attention Firewall & Value-Aligned Inbound Network on Monad**  
> Built for the **Monad Metropolis Global Hackathon 2026**  
> Tracks: **Social, Attention & Culture** (Primary) | **Trust, Identity & AI Infrastructure** (Secondary)

---

## 📖 Overview

**TwinGate** is a decentralized, agent-to-agent (A2A) attention firewall and value-aligned messaging network built on **Monad**.

### The Core Problem
In traditional social networks and existing Web3 "pay-to-DM" protocols:
1. **Wealthy spammers still harass you**: Paying $10 to pitch an exit scam or irrelevant project is cheap for bad actors, but costly for the recipient's finite human attention.
2. **The Compute Inversion Paradox**: If a recipient uses an AI filter to reject spam, the *recipient* bears the LLM inference cost for screening incoming harassment.
3. **High barriers for genuine connections**: Fixed paywalls block junior developers, researchers, or authentic peers from connecting.

### The TwinGate Solution
1. **Sender-Pays-Inference (发起人承担算力成本)**: When Alice wants to reach Bob, Alice deposits a micro-fee ($0.005) to cover the LLM inference cost of Bob's AI Gatekeeper, plus a refundable attention bond ($MON).
2. **AI Gatekeeper / Bouncer (智能守门人)**: Bob's AI agent evaluates Alice's pitch against Bob's dynamic interests, semantic alignment, and onchain credibility.
3. **Dynamic Game-Theoretic Outcomes**:
   - **Passed (High Signal)**: Alice's bond is **fully refunded** (authentic peer connection is zero-cost). Bob receives a structured 3-bullet summary in his VIP inbox.
   - **Rejected (Spam / Low Signal)**: Alice's bond is **forfeited** — 80% goes to Bob's treasury as compensation for attention pollution, and 20% goes to the protocol treasury.
4. **Enabled Exclusively by Monad**:
   - **800ms finality** for instant escrow and challenge response.
   - **10,000 TPS & Parallel EVM** for concurrent multi-agent micro-settlements.
   - **Micro-gas (< $0.0001)** making sub-cent escrow viable.

---

## 📚 Project Documentation

- [📘 Hackathon Comprehensive Guide (`MONAD_METROPOLIS_HACKATHON_GUIDE.md`)](./MONAD_METROPOLIS_HACKATHON_GUIDE.md): Detailed breakdown of rules, 4 tracks, $250k+ prize pool, rubrics, and sponsor bounties.
- [📕 TwinGate System & Architecture Specification (`TWINGATE_A2A_ATTENTION_FIREWALL_SPEC.md`)](./TWINGATE_A2A_ATTENTION_FIREWALL_SPEC.md): Full technical architecture, sequence diagrams, economic surge-pricing formulas, and the winning 3-minute demo script.
- [📙 AI + Social + Monad Innovation Research (`AI_SOCIAL_MONAD_INNOVATION_IDEAS.md`)](./AI_SOCIAL_MONAD_INNOVATION_IDEAS.md): Comparison of Web3 AI social paradigms and the 4 frontier concepts.
- [📗 Social Track Deep Dive (`SOCIAL_TRACK_DEEP_DIVE_AND_IDEAS.md`)](./SOCIAL_TRACK_DEEP_DIVE_AND_IDEAS.md): Official 12 suggested starting points analysis.

---

## 🏗️ Architecture Stack

- **L1 Blockchain**: Monad Testnet / Mainnet (Parallel EVM, 800ms finality)
- **Smart Contracts**: Solidity 0.8.24+ (Foundry)
  - `BouncerRegistry.sol`: User agent profile, interest tags, and threshold configuration.
  - `AttentionEscrow.sol`: Micro-escrow for inference fees and attention bonds.
  - `DynamicPricing.sol`: Inbox congestion curve.
- **Account Abstraction & Authentication**: Privy / Dynamic (Passkey, P256, WebAuthn)
- **Inference Engine**: Qwen 3.8 Max / Kimi / Tencent Hunyuan APIs
- **Indexing & Events**: Envio HyperIndex
- **Frontend**: Next.js 14 App Router, Tailwind CSS, Framer Motion

---

## 📄 License
MIT License
