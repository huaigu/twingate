// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {ProfileRegistry} from "../src/ProfileRegistry.sol";
import {IntroductionEscrow} from "../src/IntroductionEscrow.sol";

/// @notice Covers the two rules this contract exists to enforce:
///         the bond is never seized, and only the recipient can open an
///         introduction.
contract IntroductionEscrowTest is Test {
    ProfileRegistry internal registry;
    IntroductionEscrow internal escrow;

    address internal sender = address(0xA11CE);
    address internal otherSender = address(0xCAFE);
    address internal recipient = address(0xB0B);
    uint256 internal constant OPERATOR_PK = 0xE0A;
    address internal evaluator;
    address internal treasury = address(0x7EA);

    uint256 internal constant PROFILE_ID = 1;
    uint32 internal constant POLICY_VERSION = 1;
    uint64 internal constant TTL = 1 days;
    uint128 internal constant FEE = 0.0005 ether;
    uint128 internal constant BOND = 0.002 ether;

    bytes32 internal policyHash;

    function setUp() public {
        evaluator = vm.addr(OPERATOR_PK);
        registry = new ProfileRegistry();
        escrow = new IntroductionEscrow(address(registry), treasury, evaluator);

        policyHash = keccak256("policy-v1");
        vm.prank(recipient);
        registry.registerProfile(keccak256("bob"), keccak256("profile-doc"), policyHash);

        vm.deal(sender, 100 ether);
        vm.deal(otherSender, 100 ether);
    }

    function _quote(address payer, address to, uint256 profileId, bytes32 policy, uint32 version, bytes32 payload, uint64 ttl, uint128 fee, uint256 total)
        internal view returns (IntroductionEscrow.LockQuote memory q, bytes memory signature)
    {
        q = IntroductionEscrow.LockQuote({ sender: payer, recipient: to, recipientProfileId: profileId,
            policyHash: policy, policyVersion: version, payloadHash: payload, evaluationFee: fee,
            attentionBond: total > fee ? total - fee : 0, ttl: ttl, quoteExpiresAt: block.timestamp + 900,
            nonce: escrow.nonces(payer) });
        (uint8 v, bytes32 r, bytes32 sigS) = vm.sign(OPERATOR_PK, escrow.hashQuote(q));
        signature = abi.encodePacked(r, sigS, v);
    }

    function _lock() internal returns (bytes32 id) {
        (IntroductionEscrow.LockQuote memory q0, bytes memory sig0) = _quote(sender, recipient, PROFILE_ID, policyHash, POLICY_VERSION, keccak256("payload"), TTL, FEE, FEE + BOND);
        vm.prank(sender);
        id = escrow.lockIntroduction{value: FEE + BOND}(q0, sig0);
    }

    function _lockAndReview() internal returns (bytes32 id) {
        id = _lock();
        vm.prank(evaluator);
        escrow.markEvaluating(id);
        vm.prank(evaluator);
        escrow.markReadyForReview(id);
    }

    // ------------------------------------------------------------- locking

    function test_LockSplitsFeeAndBond() public {
        bytes32 id = _lock();

        IntroductionEscrow.Introduction memory intro = escrow.getIntroduction(id);
        assertEq(intro.sender, sender);
        assertEq(intro.recipient, recipient);
        assertEq(uint256(intro.evaluationFee), uint256(FEE));
        assertEq(uint256(intro.attentionBond), uint256(BOND));
        assertEq(uint256(intro.state), uint256(IntroductionEscrow.State.Locked));
        assertEq(address(escrow).balance, FEE + BOND);
        assertEq(escrow.unresolvedCount(sender, recipient), 1);
        assertEq(escrow.lockedDepth(), 1);
    }

    function test_RevertWhenPolicyHashMismatch() public {
        (IntroductionEscrow.LockQuote memory q1, bytes memory sig1) = _quote(sender, recipient, PROFILE_ID, keccak256("stale-policy"), POLICY_VERSION, keccak256("payload"), TTL, FEE, FEE + BOND);
        vm.prank(sender);
        vm.expectRevert(IntroductionEscrow.ProfilePolicyMismatch.selector);
        escrow.lockIntroduction{value: FEE + BOND}(q1, sig1);
    }

    function test_RevertWhenRecipientDoesNotOwnProfile() public {
        (IntroductionEscrow.LockQuote memory q2, bytes memory sig2) = _quote(sender, otherSender, PROFILE_ID, policyHash, POLICY_VERSION, keccak256("payload"), TTL, FEE, FEE + BOND);
        vm.prank(sender);
        vm.expectRevert(IntroductionEscrow.NotRecipient.selector);
        escrow.lockIntroduction{value: FEE + BOND}(q2, sig2);
    }

    function test_RevertWhenRecipientClosed() public {
        vm.prank(recipient);
        registry.setAcceptsIntroductions(PROFILE_ID, false);
        (IntroductionEscrow.LockQuote memory q3, bytes memory sig3) = _quote(sender, recipient, PROFILE_ID, policyHash, POLICY_VERSION, keccak256("payload"), TTL, FEE, FEE + BOND);
        vm.prank(sender);
        vm.expectRevert(IntroductionEscrow.RecipientClosed.selector);
        escrow.lockIntroduction{value: FEE + BOND}(q3, sig3);
    }

    function test_RevertWhenPolicyVersionIsStaleEvenWithSameHash() public {
        vm.prank(recipient);
        registry.updatePolicy(PROFILE_ID, policyHash);
        (IntroductionEscrow.LockQuote memory q4, bytes memory sig4) = _quote(sender, recipient, PROFILE_ID, policyHash, POLICY_VERSION, keccak256("payload"), TTL, FEE, FEE + BOND);
        vm.prank(sender);
        vm.expectRevert(IntroductionEscrow.ProfilePolicyMismatch.selector);
        escrow.lockIntroduction{value: FEE + BOND}(q4, sig4);
    }

    function test_ClosingProfileDoesNotBlockExistingSettlement() public {
        bytes32 id = _lockAndReview();
        vm.prank(recipient);
        registry.setAcceptsIntroductions(PROFILE_ID, false);
        uint256 beforeRefund = sender.balance;
        vm.prank(recipient);
        escrow.accept(id);
        assertEq(sender.balance, beforeRefund + BOND);
        assertEq(uint256(escrow.getIntroduction(id).state), uint256(IntroductionEscrow.State.Accepted));
    }

    function test_RevertWhenFeeConsumesWholePayment() public {
        (IntroductionEscrow.LockQuote memory q5, bytes memory sig5) = _quote(sender, recipient, PROFILE_ID, policyHash, POLICY_VERSION, keccak256("payload"), TTL, FEE, FEE);
        vm.prank(sender);
        vm.expectRevert(IntroductionEscrow.IncorrectValue.selector);
        escrow.lockIntroduction{value: FEE}(q5, sig5);
    }

    function test_RevertWhenLockingToSelf() public {
        (IntroductionEscrow.LockQuote memory q6, bytes memory sig6) = _quote(sender, sender, PROFILE_ID, policyHash, POLICY_VERSION, keccak256("payload"), TTL, FEE, FEE + BOND);
        vm.prank(sender);
        vm.expectRevert(IntroductionEscrow.NotRecipient.selector);
        escrow.lockIntroduction{value: FEE + BOND}(q6, sig6);
    }

    function test_RevertWhenTtlTooLong() public {
        (IntroductionEscrow.LockQuote memory q7, bytes memory sig7) = _quote(sender, recipient, PROFILE_ID, policyHash, POLICY_VERSION, keccak256("payload"), 31 days, FEE, FEE + BOND);
        vm.prank(sender);
        vm.expectRevert(IntroductionEscrow.TtlTooLong.selector);
        escrow.lockIntroduction{value: FEE + BOND}(q7, sig7);
    }

    function test_RevertWhenSenderHitsUnresolvedLimit() public {
        _lock();
        _lock();
        _lock();

        assertEq(escrow.unresolvedCount(sender, recipient), 3);

        (IntroductionEscrow.LockQuote memory q8, bytes memory sig8) = _quote(sender, recipient, PROFILE_ID, policyHash, POLICY_VERSION, keccak256("payload-4"), TTL, FEE, FEE + BOND);
        vm.prank(sender);
        vm.expectRevert(IntroductionEscrow.SenderLimitReached.selector);
        escrow.lockIntroduction{value: FEE + BOND}(q8, sig8);
    }

    function test_UnresolvedLimitIsPerSender() public {
        _lock();
        _lock();
        _lock();

        (IntroductionEscrow.LockQuote memory q9, bytes memory sig9) = _quote(otherSender, recipient, PROFILE_ID, policyHash, POLICY_VERSION, keccak256("other"), TTL, FEE, FEE + BOND);
        vm.prank(otherSender);
        bytes32 id = escrow.lockIntroduction{value: FEE + BOND}(q9, sig9);

        assertTrue(id != bytes32(0));
        assertEq(escrow.unresolvedCount(sender, recipient), 3);
        assertEq(escrow.unresolvedCount(otherSender, recipient), 1);
    }

    function test_RecipientCanRaiseItsOwnLimit() public {
        vm.prank(recipient);
        escrow.setUnresolvedLimit(5);
        assertEq(escrow.unresolvedLimitFor(recipient), 5);

        _lock();
        _lock();
        _lock();
        _lock();
        assertEq(escrow.unresolvedCount(sender, recipient), 4);
    }

    // ---------------------------------------------------------- withdraw

    function test_WithdrawBeforeEvaluationRefundsEverything() public {
        bytes32 id = _lock();
        uint256 before = sender.balance;

        vm.prank(sender);
        escrow.withdraw(id);

        assertEq(sender.balance, before + FEE + BOND);
        assertEq(address(escrow).balance, 0);
        assertEq(escrow.unresolvedCount(sender, recipient), 0);
        assertEq(escrow.lockedDepth(), 0);
        assertEq(uint256(escrow.getIntroduction(id).state), uint256(IntroductionEscrow.State.Withdrawn));
    }

    function test_RevertWhenNonSenderWithdraws() public {
        bytes32 id = _lock();
        vm.prank(otherSender);
        vm.expectRevert(IntroductionEscrow.NotSender.selector);
        escrow.withdraw(id);
    }

    function test_RevertWhenWithdrawingAfterEvaluationStarted() public {
        bytes32 id = _lock();
        vm.prank(evaluator);
        escrow.markEvaluating(id);

        vm.prank(sender);
        vm.expectRevert(
            abi.encodeWithSelector(IntroductionEscrow.IllegalState.selector, IntroductionEscrow.State.Evaluating)
        );
        escrow.withdraw(id);
    }

    // ----------------------------------------------------------- consent

    function test_AcceptConsumesFeeAndRefundsBond() public {
        bytes32 id = _lockAndReview();
        uint256 senderBefore = sender.balance;
        uint256 treasuryBefore = treasury.balance;

        vm.prank(recipient);
        escrow.accept(id);

        assertEq(sender.balance, senderBefore + BOND, "sender must get the whole bond back");
        assertEq(treasury.balance, treasuryBefore + FEE, "fee covers evaluation");
        assertEq(address(escrow).balance, 0);
        assertEq(uint256(escrow.getIntroduction(id).state), uint256(IntroductionEscrow.State.Accepted));
    }

    function test_DeclineAlsoRefundsBond() public {
        bytes32 id = _lockAndReview();
        uint256 senderBefore = sender.balance;

        vm.prank(recipient);
        escrow.decline(id);

        assertEq(sender.balance, senderBefore + BOND, "declining is not a penalty");
        assertEq(escrow.unresolvedCount(sender, recipient), 0);
    }

    function test_RevertWhenNonRecipientAccepts() public {
        bytes32 id = _lockAndReview();
        vm.prank(sender);
        vm.expectRevert(IntroductionEscrow.NotRecipient.selector);
        escrow.accept(id);
    }

    function test_RevertWhenRecipientAcceptsBeforeReview() public {
        bytes32 id = _lock();
        vm.prank(recipient);
        vm.expectRevert(
            abi.encodeWithSelector(IntroductionEscrow.IllegalState.selector, IntroductionEscrow.State.Locked)
        );
        escrow.accept(id);
    }

    // ------------------------------------------------------ evaluator role

    function test_RevertWhenNonEvaluatorMarksReady() public {
        bytes32 id = _lock();
        vm.prank(sender);
        vm.expectRevert(IntroductionEscrow.NotEvaluator.selector);
        escrow.markEvaluating(id);

        vm.prank(recipient);
        vm.expectRevert(IntroductionEscrow.NotEvaluator.selector);
        escrow.markReadyForReview(id);
    }

    function test_EvaluatorCannotMoveStatePastReview() public {
        bytes32 id = _lockAndReview();

        // The evaluator holds the only privileged role in the contract, and it
        // still cannot accept on the recipient's behalf.
        vm.prank(evaluator);
        vm.expectRevert(IntroductionEscrow.NotRecipient.selector);
        escrow.accept(id);
    }

    function test_RequestContextKeepsFundsRefundable() public {
        bytes32 id = _lock();
        vm.prank(evaluator);
        escrow.markEvaluating(id);
        vm.prank(evaluator);
        escrow.requestContext(id);

        assertEq(uint256(escrow.getIntroduction(id).state), uint256(IntroductionEscrow.State.NeedsContext));

        uint256 before = sender.balance;
        vm.prank(sender);
        escrow.withdraw(id);
        assertEq(sender.balance, before + FEE + BOND, "asking for context must never cost the sender");
    }

    // ---------------------------------------------------------- expiry

    function test_ExpireBeforeEvaluationRefundsEverything() public {
        bytes32 id = _lock();
        uint256 before = sender.balance;

        vm.warp(block.timestamp + TTL + 1);
        escrow.expire(id);

        assertEq(sender.balance, before + FEE + BOND);
        assertEq(address(escrow).balance, 0);
    }

    function test_ExpireAfterEvaluationConsumesFee() public {
        bytes32 id = _lockAndReview();
        uint256 senderBefore = sender.balance;
        uint256 treasuryBefore = treasury.balance;

        vm.warp(block.timestamp + TTL + 1);
        escrow.expire(id);

        assertEq(sender.balance, senderBefore + BOND);
        assertEq(treasury.balance, treasuryBefore + FEE);
        assertEq(address(escrow).balance, 0);
        assertEq(uint256(escrow.getIntroduction(id).state), uint256(IntroductionEscrow.State.Expired));
    }

    function test_RevertWhenExpiringTooEarly() public {
        bytes32 id = _lock();
        vm.expectRevert(IntroductionEscrow.NotExpired.selector);
        escrow.expire(id);
    }

    function test_AnyoneCanExpireForStuckSender() public {
        bytes32 id = _lockAndReview();
        uint256 before = sender.balance;

        vm.warp(block.timestamp + TTL + 1);
        vm.prank(otherSender);
        escrow.expire(id);

        assertEq(sender.balance, before + BOND, "a silent recipient must not trap funds");
    }

    // ------------------------------------------------------ invariant-ish

    /// @notice Across every terminal path, the escrow ends empty and the sender
    ///         is never worse off than fee + bond. There is no seizing branch.
    /// @notice Across every terminal path the escrow ends empty, the bond always
    ///         comes back, and the fee is consumed only when an evaluation was
    ///         actually delivered. No branch seizes anything.
    function testFuzz_NoPathEverSeizesBond(uint8 terminal) public {
        vm.assume(terminal < 4);

        bytes32 id;
        bool evaluated;
        if (terminal == 3) {
            // Withdraw is only reachable before the introduction reaches review.
            id = _lock();
            evaluated = false;
        } else {
            id = _lockAndReview();
            evaluated = true;
        }

        // Balance after locking, before settlement: 100 ether - fee - bond.
        uint256 beforeSettlement = sender.balance;

        if (terminal == 0) {
            vm.prank(recipient);
            escrow.accept(id);
        } else if (terminal == 1) {
            vm.prank(recipient);
            escrow.decline(id);
        } else if (terminal == 2) {
            vm.warp(block.timestamp + TTL + 1);
            escrow.expire(id);
        } else {
            vm.prank(sender);
            escrow.withdraw(id);
        }

        uint256 refund = evaluated ? BOND : FEE + BOND;
        assertEq(
            sender.balance,
            beforeSettlement + refund,
            "bond always returns; the fee only when no evaluation was delivered"
        );
        assertEq(address(escrow).balance, 0, "escrow must never retain settled funds");
        assertEq(escrow.unresolvedCount(sender, recipient), 0, "unresolved count must clear");
    }

    function test_LockedDepthTracksOpenIntroductions() public {
        bytes32 a = _lock();
        _lock();
        assertEq(escrow.lockedDepth(), 2);

        vm.prank(sender);
        escrow.withdraw(a);
        assertEq(escrow.lockedDepth(), 1);
    }
    function test_QuoteCannotChangeAmount() public {
        (IntroductionEscrow.LockQuote memory q, bytes memory sig) = _quote(sender, recipient, PROFILE_ID, policyHash, POLICY_VERSION, keccak256("payload"), TTL, FEE, FEE + BOND);
        q.evaluationFee += 1;
        vm.prank(sender); vm.expectRevert(IntroductionEscrow.InvalidQuoteSignature.selector);
        escrow.lockIntroduction{value: FEE + BOND}(q, sig);
    }
    function test_QuoteCannotChangePayload() public {
        (IntroductionEscrow.LockQuote memory q, bytes memory sig) = _quote(sender, recipient, PROFILE_ID, policyHash, POLICY_VERSION, keccak256("payload"), TTL, FEE, FEE + BOND);
        q.payloadHash = keccak256("changed after approval");
        vm.prank(sender); vm.expectRevert(IntroductionEscrow.InvalidQuoteSignature.selector);
        escrow.lockIntroduction{value: FEE + BOND}(q, sig);
    }
    function test_ExpiredQuoteCannotLock() public {
        (IntroductionEscrow.LockQuote memory q, bytes memory sig) = _quote(sender, recipient, PROFILE_ID, policyHash, POLICY_VERSION, keccak256("payload"), TTL, FEE, FEE + BOND);
        vm.warp(q.quoteExpiresAt + 1);
        vm.prank(sender); vm.expectRevert(IntroductionEscrow.QuoteExpired.selector);
        escrow.lockIntroduction{value: FEE + BOND}(q, sig);
    }
    function test_QuoteCannotReplay() public {
        (IntroductionEscrow.LockQuote memory q, bytes memory sig) = _quote(sender, recipient, PROFILE_ID, policyHash, POLICY_VERSION, keccak256("payload"), TTL, FEE, FEE + BOND);
        vm.prank(sender); escrow.lockIntroduction{value: FEE + BOND}(q, sig);
        vm.prank(sender); vm.expectRevert(IntroductionEscrow.InvalidNonce.selector);
        escrow.lockIntroduction{value: FEE + BOND}(q, sig);
    }
    function test_QuoteBoundToContract() public {
        IntroductionEscrow other = new IntroductionEscrow(address(registry), treasury, evaluator);
        (IntroductionEscrow.LockQuote memory q, bytes memory sig) = _quote(sender, recipient, PROFILE_ID, policyHash, POLICY_VERSION, keccak256("payload"), TTL, FEE, FEE + BOND);
        vm.prank(sender); vm.expectRevert(IntroductionEscrow.InvalidQuoteSignature.selector);
        other.lockIntroduction{value: FEE + BOND}(q, sig);
    }
    function test_QuoteBoundToChain() public {
        (IntroductionEscrow.LockQuote memory q, bytes memory sig) = _quote(sender, recipient, PROFILE_ID, policyHash, POLICY_VERSION, keccak256("payload"), TTL, FEE, FEE + BOND);
        vm.chainId(block.chainid + 1);
        vm.prank(sender); vm.expectRevert(IntroductionEscrow.InvalidQuoteSignature.selector);
        escrow.lockIntroduction{value: FEE + BOND}(q, sig);
    }
    function test_SignedAmountMustMatchPayment() public {
        (IntroductionEscrow.LockQuote memory q, bytes memory sig) = _quote(sender, recipient, PROFILE_ID, policyHash, POLICY_VERSION, keccak256("payload"), TTL, FEE, FEE + BOND);
        vm.prank(sender); vm.expectRevert(IntroductionEscrow.IncorrectValue.selector);
        escrow.lockIntroduction{value: FEE + BOND + 1}(q, sig);
    }
    function test_ManualReviewHasZeroFeeAndFullBondRefund() public {
        (IntroductionEscrow.LockQuote memory q, bytes memory sig) = _quote(sender, recipient, PROFILE_ID, policyHash, POLICY_VERSION, keccak256("manual"), TTL, 0, BOND);
        uint256 beforeLock = sender.balance;
        vm.prank(sender); bytes32 id = escrow.lockIntroduction{value: BOND}(q, sig);
        assertEq(uint256(escrow.getIntroduction(id).state), uint256(IntroductionEscrow.State.ReadyForReview));
        vm.prank(recipient); escrow.accept(id);
        assertEq(sender.balance, beforeLock);
        assertEq(treasury.balance, 0);
    }
    function test_QuoteSignerCannotBeChangedByStranger() public {
        vm.prank(sender); vm.expectRevert(IntroductionEscrow.NotAuthorized.selector);
        escrow.setQuoteSigner(sender);
    }

}
