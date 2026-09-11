// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title IntroductionReceipt
/// @notice Anchors the hash of an evaluation receipt so a recipient can later
///         prove which policy version and model version produced the summary
///         they were shown. Receipt bodies never go onchain.
contract IntroductionReceipt {
    struct Receipt {
        bytes32 introductionId;
        bytes32 receiptHash;
        uint32 policyVersion;
        uint8 recommendation;
        uint64 issuedAt;
        address issuer;
        string modelVersion;
    }

    address public evaluator;

    mapping(bytes32 => Receipt) private _receipts;
    mapping(bytes32 => bool) public hasReceipt;

    uint256 public receiptCount;

    event ReceiptAnchor(
        bytes32 indexed introductionId,
        bytes32 receiptHash,
        uint32 policyVersion,
        uint8 recommendation,
        string modelVersion
    );
    event EvaluatorChanged(address indexed evaluator);

    error NotEvaluator();
    error AlreadyAnchored();
    error EmptyHash();

    constructor(address evaluator_) {
        evaluator = evaluator_;
    }

    modifier onlyEvaluator() {
        if (msg.sender != evaluator) revert NotEvaluator();
        _;
    }

    function setEvaluator(address evaluator_) external onlyEvaluator {
        evaluator = evaluator_;
        emit EvaluatorChanged(evaluator_);
    }

    /// @notice Anchor an evaluation receipt. One receipt per introduction.
    function anchor(
        bytes32 introductionId,
        bytes32 receiptHash,
        uint32 policyVersion,
        uint8 recommendation,
        string calldata modelVersion
    ) external onlyEvaluator {
        if (receiptHash == bytes32(0)) revert EmptyHash();
        if (hasReceipt[introductionId]) revert AlreadyAnchored();

        _receipts[introductionId] = Receipt({
            introductionId: introductionId,
            receiptHash: receiptHash,
            policyVersion: policyVersion,
            recommendation: recommendation,
            issuedAt: uint64(block.timestamp),
            issuer: msg.sender,
            modelVersion: modelVersion
        });
        hasReceipt[introductionId] = true;
        receiptCount += 1;

        emit ReceiptAnchor(introductionId, receiptHash, policyVersion, recommendation, modelVersion);
    }

    function getReceipt(bytes32 introductionId) external view returns (Receipt memory) {
        return _receipts[introductionId];
    }
}
