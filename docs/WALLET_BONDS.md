# Wallet bonds without Hunyuan

The bonded path uses manual recipient review and an AI evaluation fee of zero. Hunyuan credentials are neither required nor configured. Sign-in only creates a session; profile registration, bonding and settlement each need a separate wallet approval.

## Run locally

Run **pnpm chain:dev**, then open **http://localhost:3005/**.

- Anvil: loopback port 8547, chain 31337, token label DEV.
- API: port 8791. Web: port 3005. The original 8789/3004 no-payment app remains separate.
- Data and chain state: .data/local-chain/. The directory is mode 0700; quote signing key is mode 0600 and never sent to the browser.
- Stop with Ctrl-C. Restarting reuses saved Anvil state, contract addresses, signer and SQLite data. Startup refuses to reuse a manifest whose contracts or signer do not match.
- For another isolated instance set CHAIN_DATA_DIR and CHAIN_RPC_PORT / CHAIN_API_PORT / CHAIN_WEB_PORT. Do not share one data directory across instances.
- Forge and Anvil must already be installed. Install workspace dependencies with pnpm install --frozen-lockfile.

### Two-wallet walkthrough

1. Sign in as the recipient, approve a profile and choose public or limited visibility.
2. In **My agent**, use **Add local test balance**, then **Review profile sync → Continue in wallet**. The wallet switches to Local EVM and registers only hashes, not profile text.
3. In another browser/wallet, sign in, save a sender profile and add local test balance in My agent.
4. Choose the recipient, review the introduction and select **Refundable wallet bond**. The receipt shows the exact bond, zero AI fee, gas terms, network, deadline and quote expiry.
5. Approve **Lock … DEV in wallet**. Delivery happens only after the API verifies the successful transaction and matching contract event.
6. The recipient can ask for context, accept or decline. Accept and decline require a wallet transaction and return the entire bond to the sender. Network gas is not refunded.
7. If unanswered, either participant can open the receipt after the response deadline and choose **Claim expired bond**. Local expiry is 60 seconds; the testnet path uses the recipient policy timeout.

The no-bond option remains available. Sample mode is explicitly opt-in with ?demo=1 and never moves funds.

## What is verified

Signed EIP-712 quotes bind sender, recipient, profile ID, policy hash/version, original payload hash, fee, bond, TTL, quote expiry, nonce, chain ID and escrow address. The old unsigned lock entrypoint is removed.

Draft bond estimates are recalculated when the first funding signature is issued or an expired signature is replaced. Current queue pressure, prior declines and unresolved limits apply. A still-valid signed quote retains its amount until expiry. The saved receipt and wallet approval display that signed amount consistently; a changed policy requires a newly reviewed introduction.

The API prepares calldata; it does not broadcast participant transactions. The recipient cannot see an unpaid bonded draft. Confirmation checks the transaction sender, destination, exact calldata/value, successful canonical receipt and matching event. One chain lock can only bind to one application introduction. Application IDs are included in payload hashes, so identical text cannot reuse another lock.

The chain determines the settlement state. API transition requests cannot fabricate a lock or recipient decision. Refund receipts include the actual transaction, block and amount. Background reconciliation runs every four seconds and can recover a mined lock even if the browser closes before reporting its hash. Log scans progress in 1,000-block batches. New profile/context data is not overwritten by reconciliation.

Extra questions and replies remain offchain; they do not alter the original signed payload. The receipt contract is deployed for the future evaluation path, but this manual-review flow proves settlement through escrow events. It does not mint an AI evaluation receipt or claim an Envio deployment.

## Verification commands

- **pnpm verify**: strict TypeScript projects, API/indexer/Foundry tests, real HTTP and browser no-payment flow, responsive and explicit sample-mode regression.
- **pnpm chain:test**: deploy fresh real local contracts and verify signing, tamper/replay rejection, identity and recipient permissions, event binding, accept/decline/expiry refunds, callback loss and API restart.
- **pnpm chain:verify**: additionally drive two independent browser wallets through actual EVM transactions, profile sync/network switch, cancellation, context exchange and all three refund paths.
- **pnpm build**: production build.
- **pnpm verify:all**: runs the preceding release checks in sequence.

Browser wallet providers in tests sign with ephemeral test accounts inside the test process; keys are not placed in the page and the production API has no test-login bypass. Screenshots are saved in .run/chain-e2e/. Browser geometry, resources and runtime errors are asserted; screenshots still warrant a human visual review.

## Prepare Monad testnet

No funded deployment key is configured for this revision, so no public testnet deployment is claimed. Do not use local transaction hashes as testnet evidence.

1. Choose an API quote signer locally. Keep its key in a protected server-only file and configure SIGNALPASS_QUOTE_SIGNER_KEY_FILE. Put only its public address in QUOTE_SIGNER_ADDRESS.
2. Set the testnet RPC and a funded deployment wallet locally. Keep private keys out of source control, browser variables, reports and chat. Optionally choose TREASURY_ADDRESS for administration.
3. Simulate the current packages/contracts/script/Deploy.s.sol on chain 10143, then broadcast when the testnet wallet is ready. Deploy the current signed-quote ABI; old unsigned contracts are incompatible.
4. Copy deployments/monad-testnet.example.json into a local deployment manifest and replace all zero addresses with the actual deployment addresses. Confirm the RPC and use a separate public, credential-free walletRpcUrl. Add explorerUrl only when verified.
5. Run **pnpm chain:preflight <manifest-path>** with the API signer key configured. It checks chain ID, code at all three addresses, escrow registry, signer identity, confirmation count and wallet network. This step is read-only.
6. Launch the API with SIGNALPASS_CHAIN_CONFIG, a persistent SIGNALPASS_DB_PATH and the exact APP_ORIGIN. Point the web proxy at this API. Keep EVALUATOR_URL empty. Run the two-wallet walkthrough on the public testnet and retain explorer evidence for registration, lock and refund.

Only local 31337 and testnet 10143 are accepted. A single API process currently owns SQLite and serializes each introduction's chain updates; running multiple writers needs a separate concurrency design. Directory profiles deliberately return unknown onchain registration until checked, rather than claiming verified registration from an application flag.
