# SignalPass mainnet deployment — October 3, 2026

SignalPass's wallet-bond pilot is live at https://signalpass.coderbojack.space/ on Monad Mainnet (chain 143). The application release uses source commit `670836d6b4de2ac73167e81f018f52a2d3a069d8`. PR #8 was merged before deployment.

## Deployed contracts

| Contract | Address | Creation transaction | Gas spent (MON) |
| --- | --- | --- | ---: |
| ProfileRegistry | `0x61c02a0b68d00C9537e0fc20c42a7d63CcBf7Cda` | [Transaction](https://monadvision.com/tx/0xb42da5083acddf37124022b1645223684b4c241ac2cda78a606ce7624706a439) | 0.07714464 |
| IntroductionReceipt | `0xd6964883249797e66d038fa1567d7d75529E86bE` | [Transaction](https://monadvision.com/tx/0x683adf1baf2ac6cd773b7b3104a3b52d2ecee31eaec4e021abcff202445ebf94) | 0.071660304 |
| IntroductionEscrow | `0xF0c1BA35CDacC2508CbD8207C8fD2Ab7B735a722` | [Transaction](https://monadvision.com/tx/0x02f0224c1389e483f63f61935f9aa62fb5c444dadc892b7eb83c62e539c91bd9) | 0.238051272 |

The compiled source hashes matched the current repository artifacts (Solidity 0.8.24, optimizer 200 runs, Paris EVM). Successful finalized receipts, deployed runtime bytecode including immutable-field checks, and registry/treasury/signer/evaluator roles were verified. This records our bytecode and role checks; it does not claim explorer source-code verification.

## Public application

- API and website run in the versioned `/opt/signalpass/releases/mainnet-pilot-20261003` release on the VPS, through the existing Cloudflare Tunnel and HTTPS domain.
- The deployer key is protected on the VPS. A separate, unfunded quote signer is supplied to the DynamicUser API service through a systemd credential. The API has no deployer credential.
- Public health/readiness, chain 143 and pilot configuration, anonymous private-history rejection, and byte checksums of all three updated wallet scripts passed. API, web and tunnel services are active; the pre-release SQLite backup succeeded.
- New profiles receive a 0.0001 MON base refundable bond and a 600-second response deadline. An open, empty recipient initially quotes 0.000075 MON. Manual evaluation fee is zero; existing profile terms remain intact.
- Hosted AI is still disabled in this deployment; a model account must be configured separately. This release verifies wallet settlement and manual introductions.

## Mainnet two-wallet evidence

Two project-owned wallets signed into the public HTTPS application, saved limited-visibility profiles with matching disabled, and registered their approved hashes on chain. Both cases used a 0.000075 MON bond and a 600-second deadline.

| Decision | Lock transaction | Refund transaction | Result |
| --- | --- | --- | --- |
| accepted | [Lock](https://monadvision.com/tx/0x3f64e633da6c0bff6880703bf8e228419b39125f3fd14747bd048031c45850f6) | [Refund](https://monadvision.com/tx/0xe7c23bc70532bafe2bc2d9ef14b465a73214358a129626a0a40e1b6bb05ab00a) | Full bond returned and application receipt verified |
| declined | [Lock](https://monadvision.com/tx/0x977ba65dcc77ededf7966c3e1c52b21003dd41e476b2dd8079528cc9e1c64717) | [Refund](https://monadvision.com/tx/0xb4b86d8c62b3611d897fb7908cb50ac06e6ba0617e75b7a17b52d967f6103190) | Full bond returned and application receipt verified |

The sender's finalized balance increased by the entire bond after each recipient decision. The application reported the matching terminal state, refund amount and transaction proof. Unused test-wallet funds were returned to the funding wallet; both test wallets ended at zero MON and their sessions were logged out. Mainnet evidence covers registration, locking, acceptance and decline. Expiry was verified in the local EVM suite; no timed mainnet expiry transaction was sent in this smoke run.

## Fund accounting

| Item | MON |
| --- | ---: |
| User funding | 6 |
| Three contract deployments | 0.386856216 |
| Mainnet smoke gas, including funding and return transfers | 0.153904944 |
| Total gas spent | 0.54076116 |
| Funding wallet remaining | 5.45923884 |
| Test-wallet remaining, combined | 0 |

Funding wallet: `0x07eC693f33876b4De5a9e45d5675fBb9F0FcF0c5`. Bonds were returned in full and are not counted as spent gas. No AI-provider charges were incurred.

## Preparation validation

48 contract tests, 64 API tests, 12 wallet UI tests, 12 frontend flow tests and API TypeScript checks passed before release. The local two-wallet integration covered signed identities, exact-value locks, tamper/replay rejection, acceptance/decline/expiry refunds, lost browser callbacks and restart recovery. Mainnet-specific regressions cover finalized confirmation, recovery without historical contract state, 100-block log windows, bounded persisted refund scans and wallet gas-estimation failures.
