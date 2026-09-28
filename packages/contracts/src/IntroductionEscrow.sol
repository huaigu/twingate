// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ProfileRegistry} from "./ProfileRegistry.sol";

/// @title IntroductionEscrow
/// @notice Holds the sender's evaluation fee and attention bond for the life of
///         an introduction, and settles them on a published rule.
///
///         Two rules are encoded deliberately:
///         1. The evaluation fee is consumed by evaluation and never returns.
///         2. The attention bond is *locked*, not seized. Spam is priced by
///            capital occupation and a per-sender unresolved cap, not by an
///            opaque verdict. Nothing in this contract lets an automated
///            evaluator take a sender's money.
///
///         Only the recipient can open an introduction, and every unresolved
///         introduction expires so a recipient cannot hold a sender's funds
///         indefinitely.
contract IntroductionEscrow {
    enum State {
        None,
        Locked,
        Evaluating,
        NeedsContext,
        ReadyForReview,
        Accepted,
        Declined,
        Expired,
        Withdrawn
    }

    struct LockQuote {
        address sender;
        address recipient;
        uint256 recipientProfileId;
        bytes32 policyHash;
        uint256 policyVersion;
        bytes32 payloadHash;
        uint256 evaluationFee;
        uint256 attentionBond;
        uint256 ttl;
        uint256 quoteExpiresAt;
        uint256 nonce;
    }

    bytes32 public constant LOCK_TYPEHASH = keccak256(
        "LockIntroduction(address sender,address recipient,uint256 recipientProfileId,bytes32 policyHash,uint256 policyVersion,bytes32 payloadHash,uint256 evaluationFee,uint256 attentionBond,uint256 ttl,uint256 quoteExpiresAt,uint256 nonce)"
    );
    bytes32 private constant DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );
    address public quoteSigner;

    struct Introduction {
        address sender;
        address recipient;
        uint256 recipientProfileId;
        bytes32 policyHash;
        uint32 policyVersion;
        bytes32 payloadHash;
        uint128 evaluationFee;
        uint128 attentionBond;
        uint64 lockedAt;
        uint64 expiresAt;
        State state;
    }

    ProfileRegistry public immutable registry;
    address public treasury;
    address public evaluator;

    uint256 public constant DEFAULT_UNRESOLVED_LIMIT = 3;
    uint64 public constant MAX_TTL = 30 days;

    mapping(bytes32 => Introduction) private _introductions;
    mapping(address => mapping(address => uint256)) public unresolvedCount;
    mapping(address => uint256) public unresolvedLimit;
    mapping(address => uint256) public nonces;

    bytes32[] private _openIds;
    uint256 private _lockedDepth;

    uint256 private _reentrancyStatus = 1;

    event IntroductionLocked(
        bytes32 indexed id,
        address indexed sender,
        address indexed recipient,
        uint256 recipientProfileId,
        uint256 evaluationFee,
        uint256 attentionBond,
        uint64 expiresAt
    );
    event IntroductionStateChanged(bytes32 indexed id, State state);
    event AttentionBondRefunded(bytes32 indexed id, address indexed to, uint256 amount);
    event UnresolvedLimitChanged(address indexed recipient, uint256 limit);
    event EvaluatorChanged(address indexed evaluator);
    event TreasuryChanged(address indexed treasury);

    error InvalidQuoteSignature();
    error QuoteExpired();
    error InvalidNonce();
    error ZeroAddress();
    error NotSender();
    error NotRecipient();
    error NotEvaluator();
    error NotAuthorized();
    error UnknownIntroduction();
    error IllegalState(State current);
    error SenderLimitReached();
    error RecipientClosed();
    error ProfilePolicyMismatch();
    error IncorrectValue();
    error TransferFailed();
    error TtlTooLong();
    error NotExpired();
    error Reentrant();

    modifier nonReentrant() {
        if (_reentrancyStatus != 1) revert Reentrant();
        _reentrancyStatus = 2;
        _;
        _reentrancyStatus = 1;
    }

    constructor(address registry_, address treasury_, address evaluator_) {
        if (registry_ == address(0) || treasury_ == address(0) || evaluator_ == address(0)) revert ZeroAddress();
        quoteSigner = evaluator_;
        registry = ProfileRegistry(registry_);
        treasury = treasury_;
        evaluator = evaluator_;
    }

    // ---------------------------------------------------------------- admin

    function setQuoteSigner(address signer_) external {
        if (msg.sender != treasury) revert NotAuthorized();
        if (signer_ == address(0)) revert ZeroAddress();
        quoteSigner = signer_;
    }

    function hashQuote(LockQuote calldata quote) public view returns (bytes32) {
        bytes32 domain = keccak256(abi.encode(
            DOMAIN_TYPEHASH, keccak256("SignalPass"), keccak256("1"), block.chainid, address(this)
        ));
        return keccak256(abi.encodePacked(hex"1901", domain, keccak256(abi.encode(LOCK_TYPEHASH, quote))));
    }

    function _validateSignature(LockQuote calldata quote, bytes calldata signature) private view {
        if (quote.sender != msg.sender) revert NotSender();
        if (block.timestamp > quote.quoteExpiresAt) revert QuoteExpired();
        if (quote.nonce != nonces[msg.sender]) revert InvalidNonce();
        if (signature.length != 65) revert InvalidQuoteSignature();
        bytes32 r;
        bytes32 sigS;
        uint8 v;
        assembly {
            r := calldataload(signature.offset)
            sigS := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        if (uint256(sigS) > 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0 || (v != 27 && v != 28)) {
            revert InvalidQuoteSignature();
        }
        if (ecrecover(hashQuote(quote), v, r, sigS) != quoteSigner) revert InvalidQuoteSignature();
    }

    function setEvaluator(address evaluator_) external {
        if (msg.sender != evaluator && msg.sender != treasury) revert NotAuthorized();
        evaluator = evaluator_;
        emit EvaluatorChanged(evaluator_);
    }

    function setTreasury(address treasury_) external {
        if (msg.sender != treasury) revert NotAuthorized();
        treasury = treasury_;
        emit TreasuryChanged(treasury_);
    }

    /// @notice How many unresolved introductions one sender may hold against a
    ///         recipient. Raising it is a social decision, not a payment.
    function setUnresolvedLimit(uint256 limit) external {
        unresolvedLimit[msg.sender] = limit;
        emit UnresolvedLimitChanged(msg.sender, limit);
    }

    function unresolvedLimitFor(address recipient) public view returns (uint256) {
        uint256 configured = unresolvedLimit[recipient];
        return configured == 0 ? DEFAULT_UNRESOLVED_LIMIT : configured;
    }

    /// @notice Number of introductions currently holding funds. Read by the
    ///         pricing curve as the congestion input.
    function lockedDepth() external view returns (uint256) {
        return _lockedDepth;
    }

    // ------------------------------------------------------------ lifecycle

    /// @notice Lock an evaluation fee and an attention bond against a recipient.
    /// @dev The caller is the sender. `policyHash` must match the recipient's
    ///      current published policy so a receipt can prove what it was judged
    ///      against.
    function lockIntroduction(LockQuote calldata quote, bytes calldata signature)
        external payable nonReentrant returns (bytes32 id)
    {
        _validateSignature(quote, signature);
        if (quote.recipient == address(0) || quote.recipient == msg.sender) revert NotRecipient();
        if (quote.ttl == 0 || quote.ttl > MAX_TTL) revert TtlTooLong();
        ProfileRegistry.Profile memory profile = registry.getProfile(quote.recipientProfileId);
        if (profile.owner != quote.recipient) revert NotRecipient();
        if (!profile.acceptsIntroductions) revert RecipientClosed();
        if (quote.policyHash != profile.policyHash || quote.policyVersion != profile.policyVersion) {
            revert ProfilePolicyMismatch();
        }
        if (unresolvedCount[msg.sender][quote.recipient] >= unresolvedLimitFor(quote.recipient)) revert SenderLimitReached();
        if (quote.attentionBond == 0 || quote.evaluationFee > type(uint128).max || quote.attentionBond > type(uint128).max) revert IncorrectValue();
        if (msg.value != quote.evaluationFee + quote.attentionBond || msg.value > type(uint128).max) revert IncorrectValue();
        uint256 nonce = nonces[msg.sender]++;
        id = keccak256(abi.encodePacked(msg.sender, quote.recipient, quote.recipientProfileId, nonce, block.chainid));
        // No AI service means no evaluation charge: zero-fee quotes enter human review directly.
        State initialState = quote.evaluationFee == 0 ? State.ReadyForReview : State.Locked;
        _introductions[id] = Introduction({
            sender: msg.sender, recipient: quote.recipient, recipientProfileId: quote.recipientProfileId,
            policyHash: quote.policyHash, policyVersion: uint32(quote.policyVersion), payloadHash: quote.payloadHash,
            evaluationFee: uint128(quote.evaluationFee), attentionBond: uint128(quote.attentionBond),
            lockedAt: uint64(block.timestamp), expiresAt: uint64(block.timestamp + quote.ttl), state: initialState
        });
        unresolvedCount[msg.sender][quote.recipient] += 1;
        _openIds.push(id);
        _lockedDepth += 1;
        emit IntroductionLocked(id, msg.sender, quote.recipient, quote.recipientProfileId, quote.evaluationFee, quote.attentionBond, uint64(block.timestamp + quote.ttl));
        emit IntroductionStateChanged(id, initialState);
    }

    /// @notice Sender withdraws before the introduction reaches review. Both the
    ///         fee and the bond return, because no evaluation was delivered.
    ///         `NeedsContext` is included deliberately: being asked for more
    ///         context must never cost the sender anything.
    function withdraw(bytes32 id) external nonReentrant {
        Introduction storage intro = _require(id);
        if (intro.sender != msg.sender) revert NotSender();
        if (intro.state != State.Locked && intro.state != State.NeedsContext) {
            revert IllegalState(intro.state);
        }
        _settleRefund(id, intro, State.Withdrawn);
    }

    /// @notice Evaluator states it has started work. Offchain evaluators are
    ///         replaceable by design, so this is a progress marker, not a trust
    ///         anchor.
    function markEvaluating(bytes32 id) external {
        Introduction storage intro = _require(id);
        if (msg.sender != evaluator) revert NotEvaluator();
        if (intro.state != State.Locked && intro.state != State.NeedsContext) revert IllegalState(intro.state);
        intro.state = State.Evaluating;
        emit IntroductionStateChanged(id, State.Evaluating);
    }

    /// @notice Evaluator asks the sender for more context. Bond stays refundable;
    ///         this path can never forfeit.
    function requestContext(bytes32 id) external {
        Introduction storage intro = _require(id);
        if (msg.sender != evaluator) revert NotEvaluator();
        if (intro.state != State.Evaluating) revert IllegalState(intro.state);
        intro.state = State.NeedsContext;
        emit IntroductionStateChanged(id, State.NeedsContext);
    }

    /// @notice Evaluation finished. The introduction enters the recipient's
    ///         protected queue. No funds move here.
    function markReadyForReview(bytes32 id) external {
        Introduction storage intro = _require(id);
        if (msg.sender != evaluator) revert NotEvaluator();
        if (intro.state != State.Evaluating) revert IllegalState(intro.state);
        intro.state = State.ReadyForReview;
        emit IntroductionStateChanged(id, State.ReadyForReview);
    }

    /// @notice The recipient opens the introduction. Bond refunds in full: being
    ///         let in costs a sender nothing beyond the evaluation fee.
    function accept(bytes32 id) external nonReentrant {
        Introduction storage intro = _require(id);
        if (intro.recipient != msg.sender) revert NotRecipient();
        if (intro.state != State.ReadyForReview) revert IllegalState(intro.state);
        _settleRefund(id, intro, State.Accepted);
    }

    /// @notice The recipient declines. The bond still refunds: declining is a
    ///         judgement about fit, not a penalty.
    function decline(bytes32 id) external nonReentrant {
        Introduction storage intro = _require(id);
        if (intro.recipient != msg.sender) revert NotRecipient();
        if (intro.state != State.ReadyForReview) revert IllegalState(intro.state);
        _settleRefund(id, intro, State.Declined);
    }

    /// @notice Anyone may expire an introduction once its window closes, so a
    ///         silent recipient can never trap a sender's bond.
    function expire(bytes32 id) external nonReentrant {
        Introduction storage intro = _require(id);
        if (intro.state != State.Locked && intro.state != State.Evaluating && intro.state != State.NeedsContext && intro.state != State.ReadyForReview) {
            revert IllegalState(intro.state);
        }
        if (block.timestamp < intro.expiresAt) revert NotExpired();
        _settleRefund(id, intro, State.Expired);
    }

    // ----------------------------------------------------------------- views

    function getIntroduction(bytes32 id) external view returns (Introduction memory) {
        return _require(id);
    }

    function openIntroductionCount() external view returns (uint256) {
        return _openIds.length;
    }

    // --------------------------------------------------------------- internal

    function _require(bytes32 id) private view returns (Introduction storage) {
        Introduction storage intro = _introductions[id];
        if (intro.state == State.None) revert UnknownIntroduction();
        return intro;
    }

    /// @dev Settlement rule, written once so it cannot drift:
    ///      - Evaluation never completed: the sender gets fee and bond back.
    ///      - Evaluation completed: the fee is consumed by the recipient-side
    ///        evaluation, and the bond still returns in full.
    ///
    ///      There is deliberately no branch where a bond is seized. Anti-spam
    ///      pressure comes from capital occupation and the unresolved cap.
    function _settleRefund(bytes32 id, Introduction storage intro, State terminal) private {
        bool evaluated = intro.state == State.ReadyForReview;

        uint256 bond = intro.attentionBond;
        uint256 fee = intro.evaluationFee;

        intro.state = terminal;
        intro.attentionBond = 0;
        intro.evaluationFee = 0;

        unresolvedCount[intro.sender][intro.recipient] -= 1;
        if (_lockedDepth > 0) _lockedDepth -= 1;

        emit IntroductionStateChanged(id, terminal);

        if (evaluated && fee > 0) {
            (bool feeOk, ) = payable(treasury).call{value: fee}('');
            if (!feeOk) revert TransferFailed();
        }

        uint256 refund = evaluated ? bond : bond + fee;
        if (refund > 0) {
            (bool ok, ) = payable(intro.sender).call{value: refund}('');
            if (!ok) revert TransferFailed();
            emit AttentionBondRefunded(id, intro.sender, refund);
        }
    }
}
