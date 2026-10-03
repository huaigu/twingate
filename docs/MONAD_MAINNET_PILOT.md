# Monad mainnet pilot

Status: prepared for a small, funded pilot; **no mainnet contracts have been deployed**. The website's existing no-payment mode remains available until actual deployments and a server-only quote signer are configured.

## Cost estimate

Read-only `eth_estimateGas` calls to `https://rpc.monad.xyz` on October 3, 2026 returned the following for the current compiled contract sources, using placeholder constructor addresses:

| Contract | Estimated gas |
| --- | ---: |
| ProfileRegistry | 630,266 |
| IntroductionReceipt | 585,460 |
| IntroductionEscrow | 1,944,863 |
| Total | 3,160,589 |

The RPC reported chain ID 143, a 100 MON-gwei base fee, and a 102 MON-gwei suggested gas price. At that price, deployment is approximately **0.3224 MON**, or **0.3869 MON with a 20% gas-limit buffer**. Budget **0.5 MON** for the three deployments and **1–1.5 MON** for two profile registrations and about 20 manual lock-and-refund introductions. The interaction budget is a conservative range derived from local EVM simulation; it is not a live mainnet quote for every operation.

**Suggested total funding: 5 MON**, distributed between a dedicated deployer and the two participating wallets. Expected gas spending is around **1.5–2 MON**, with the remainder available for retries and fee variation. Bonds are temporarily locked funds, separate from spent gas. Model-provider charges are offchain and are not covered by MON.

Monad charges the transaction's **gas limit**, including unused gas. Re-estimate each actual transaction and avoid oversized fixed limits. Fees vary; the budget is an estimate, not a spending authorization or guarantee. The official [gas-pricing guide](https://docs.monad.xyz/developer-essentials/gas-pricing) and [network facts](https://docs.monad.xyz/ai/current-facts) describe the network behavior.

Reproduce without a private key or transaction broadcast:

```bash
pnpm contracts:build
pnpm chain:estimate
# Optional: node scripts/chain-estimate.mjs <rpc-url> <public-sender-address>
```

The estimator validates compiled source hashes and adds a 20% gas-limit buffer. Different real constructor addresses can slightly change the estimate. It never signs or sends transactions.

## Pilot pricing

Set `SIGNALPASS_PILOT_MODE=true` on the API to apply these defaults to **new profiles**:

- Manual evaluation fee: **0 MON**. Hosted AI assistance remains sponsored when a provider is separately enabled.
- Base refundable bond: **0.0001 MON**. An open profile with an empty queue and no previous declines initially quotes **0.000075 MON**. Queue/repeat adjustments still apply; the reviewed signed quote is authoritative.
- Response deadline: **600 seconds**. Accept/decline returns the bond, and an unanswered introduction can be reclaimed after its deadline. A refund still needs network gas.
- Existing saved profiles keep their pricing and deadlines, including when edited. Use fresh pilot profiles to test the cheaper defaults.

Turning the flag off affects future profile defaults; it does not rewrite existing policies or signed quotes. The UI labels mainnet as real MON, including pilot sessions. `?demo=1` remains a separate sample mode and never moves funds.

## Deploy and connect

1. Use a fresh, standard EOA deployer and two test participants. Keep wallet keys in an encrypted keystore or protected server storage, outside chat and source control. Fund only after the actual sender, gas estimates and spending limit are reviewed.
2. Create a separate server-only quote signer. It signs quotes without sending transactions and needs no MON balance. Set its public address in `QUOTE_SIGNER_ADDRESS`; its protected key file becomes `SIGNALPASS_QUOTE_SIGNER_KEY_FILE` on the API. Mainnet deployment refuses to reuse the deployer as quote signer.
3. Set `SIGNALPASS_ALLOW_MAINNET=true`, choose `TREASURY_ADDRESS`, and simulate `script/Deploy.s.sol` against `monad_mainnet` with the public deployer `--sender`. Only then broadcast with the chosen signer. Use sequential transactions and check receipts rather than sending a burst.
4. Copy `deployments/monad-mainnet.example.json` into a private runtime configuration path and replace every zero address with the actual successful deployment addresses. Do not present placeholder addresses as deployments.
5. Run `pnpm chain:preflight <manifest-path>` with the API quote key configured. It verifies chain identity, bytecode presence, registry wiring, signer identity and the public wallet RPC. The receipt contract's evaluator remains the deployer; the current manual flow does not anchor AI receipts or need evaluator transactions.
6. Deploy the application changes, then configure `SIGNALPASS_CHAIN_CONFIG`, `SIGNALPASS_QUOTE_SIGNER_KEY_FILE`, `SIGNALPASS_PILOT_MODE=true`, the HTTPS `APP_ORIGIN`, and persistent SQLite storage on the VPS. Keep the existing database backup and previous release available. No deployer key belongs in the API environment.
7. Run the read-only public deployment preflight and perform the two-wallet registration, lock, accept/decline and expiry-refund walkthrough. Record actual mainnet transaction links and fees before inviting more testers.

The budget assumes ordinary, undelegated EOA wallets with sequential confirmed transactions. Monad's [reserve-balance rules](https://docs.monad.xyz/developer-essentials/reserve-balance) permit such wallets below 10 MON through the emptying exception; EIP-7702-delegated wallets have different constraints and must not be assumed to work with the same small balance. The API never offers its local development faucet on chain 143.

## Preparation checks, October 3, 2026

48 contract tests, 64 API tests, 12 wallet UI tests, and 12 existing frontend flow tests passed. API TypeScript checks passed. The local Anvil integration verified signed identities, exact-value locks, tamper/replay rejection, acceptance/decline/expiry refunds, lost-callback recovery, and API restart recovery. New RPC regressions cover finalized payment confirmation, recovery without old contract state, 100-block log windows, and bounded refund scanning with persisted progress. The live mainnet gas estimator ran read-only; these checks are not evidence of a funded mainnet deployment.
