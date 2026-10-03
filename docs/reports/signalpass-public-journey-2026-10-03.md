# Public browser journey rehearsal — October 3, 2026

The complete public product flow passed in Chromium against https://signalpass.coderbojack.space: live AI recommendation → private draft → edited introduction → separate send confirmation → recipient acceptance → explicitly shared contact options. Both participants were clearly labeled fictional test accounts. This is functional rehearsal evidence, not real community traction.

## Execution

- Public HTTPS application, existing deployed API and production SQLite; no mocked API or model responses.
- Chromium 147.0.7727.15, two isolated browser contexts with independently generated, unfunded EOA identities. The test-only wallet provider signed genuine SIWE logins and refused transaction methods. This does not test a retail wallet extension or mobile wallet app.
- Run: October 3, 2026, 10:01:26–10:01:52 UTC (18:01:26–18:01:52 Asia/Shanghai). Process exited zero after browser/video closure in 30.82 seconds.
- Provider: TokenRhythm `deepseek-v4-flash`; discovery took 2,937 ms and drafting 1,611 ms as measured through the browser HTTP operations.
- Two inference attempts. The provider returned no follow-up question for the concrete goal, so the UI correctly omitted clarification. The separate public [activation acceptance](signalpass-tokenrhythm-2026-10-03.md) already verified clarification and persistence through an actual service restart.
- Exactly one introduction, using the site's **Send without a bond** option. Zero wallet transactions and zero MON spent. The [mainnet settlement report](signalpass-mainnet-deployment-2026-10-03.md) remains separate evidence for bond locking, acceptance/decline and full refunds.

## Verified behavior

1. Both accounts signed in through the public browser interface. The server verified real signatures and issued Secure/HttpOnly sessions. Preparation saved approved fictional profiles through authenticated application routes; the recipient temporarily opted into public matching.
2. The sender entered a goal and explicitly checked profile-use consent. Live discovery returned the known fictional recipient with two source quotes that exactly matched the public profile. The browser selected that recipient before requesting a private draft.
3. No introduction existed before the sender opened the composer. The sender changed the proposed next step to explicitly identify the exchange as a product rehearsal. The review dialog displayed that exact edited text, and the sender explicitly selected delivery without a bond.
4. Only clicking the separate confirmation submitted the introduction. The stored four-part intent exactly matched the edited composer fields. The recipient's actual inbox displayed the same wording; the sender's receipt showed Awaiting a response.
5. The recipient reviewed and accepted through the UI. The sender refreshed and saw Accepted.
6. Neither account initially had a contact option shared. Each chose an illustrative `example.com` contact, previewed its recipient and value, then separately confirmed sharing. The other participant refreshed to see that exact contact. No email was sent or external contact page opened.
7. Acceptance and both contact options survived a browser refresh. The accepted receipt had no horizontal overflow at 390 × 844. Anonymous receipt and contact reads returned HTTP 401. The browser reported no JavaScript runtime errors.
8. Account usage decreased by exactly two attempts, matching the two provider operations.

The accepted introduction ID was `0x774cddfa347c75190eca731ab9cd47e5997bb31b953550018aa2db000f439002`. It is a participant-only application record, not a transaction hash.

## Cleanup and retained evidence

Cleanup completed before the process exited zero: both profiles became private with matching disabled, both shared contact options were removed, AI histories were cleared, both sessions logged out, and the protected recovery journal was deleted. The application retains the private fictional profiles and accepted introduction; it has no profile/receipt deletion endpoint. These records are not counted as community activity.

The operator retained ten screenshots and separate raw browser recordings of the two contexts. The screenshots cover goal/consent, recommendation evidence, private draft, edited send review, sender receipt, recipient review, both contact previews, mutual contact handoff and the mobile receipt. Raw recordings are rehearsal evidence, not a narrated introduction video or a recording of a mainnet bond transaction.

## Reproduce deliberately

`scripts/public-journey-rehearsal.mjs` requires `--live-public`, uses the named public site and creates fresh fictional identities. It allows at most three AI attempts, handles an optional clarification question, and guards delivery to the intended test recipient with no bond. A second introduction POST is blocked. Its protected journal allows `--cleanup` recovery without new inference; contact removal tolerates the specific not-yet-accepted state, and logout follows successful cleanup.

Bundle it with the repository's installed esbuild, resolving `viem` from `services/api/node_modules` and leaving `playwright` external, then run alongside Playwright and its Chromium installation. Set `SIGNALPASS_REHEARSAL_DIR` to a private output directory. Never treat an interrupted or failed run as a passed rehearsal; inspect both the result and cleanup output. Re-running consumes new provider quota and creates new private test records.

This rehearsal verifies the full no-bond product path with synthetic participants. The next product validation is with consenting real people and useful goals. It does not establish recommendation quality across a community, mainnet expiry behavior, wallet-extension compatibility, email delivery or autonomous agent actions.
