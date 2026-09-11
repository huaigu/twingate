// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title ProfileRegistry
/// @notice Stores the minimum onchain facts a builder needs in order to be
///         discoverable and to be evaluated against a versioned gate policy.
///         Profile text, persona assets and policy documents stay offchain; only
///         their hashes are anchored here.
contract ProfileRegistry {
    struct Profile {
        address owner;
        bytes32 profileHash;
        bytes32 policyHash;
        uint32 policyVersion;
        uint64 updatedAt;
        bool acceptsIntroductions;
        bool exists;
    }

    /// @dev handleHash => profileId
    mapping(bytes32 => uint256) public profileIdByHandle;
    mapping(uint256 => Profile) private _profiles;
    mapping(address => uint256) public profileIdByOwner;

    uint256 public nextProfileId = 1;

    event ProfileRegistered(uint256 indexed profileId, address indexed owner, bytes32 handleHash, bytes32 profileHash);
    event PolicyUpdated(uint256 indexed profileId, uint32 policyVersion, bytes32 policyHash);
    event ProfileUpdated(uint256 indexed profileId, bytes32 profileHash);
    event AvailabilityChanged(uint256 indexed profileId, bool acceptsIntroductions);

    error HandleTaken();
    error AlreadyRegistered();
    error NotProfileOwner();
    error UnknownProfile();
    error EmptyHash();

    modifier onlyProfileOwner(uint256 profileId) {
        if (!_profiles[profileId].exists) revert UnknownProfile();
        if (_profiles[profileId].owner != msg.sender) revert NotProfileOwner();
        _;
    }

    /// @notice Register a builder profile. One profile per address.
    /// @param handleHash keccak256 of the lowercase handle, kept offchain.
    /// @param profileHash hash of the offchain profile document.
    /// @param policyHash hash of the initial gate policy document.
    function registerProfile(bytes32 handleHash, bytes32 profileHash, bytes32 policyHash) external returns (uint256 profileId) {
        if (handleHash == bytes32(0) || profileHash == bytes32(0) || policyHash == bytes32(0)) revert EmptyHash();
        if (profileIdByOwner[msg.sender] != 0) revert AlreadyRegistered();
        if (profileIdByHandle[handleHash] != 0) revert HandleTaken();

        profileId = nextProfileId++;
        _profiles[profileId] = Profile({
            owner: msg.sender,
            profileHash: profileHash,
            policyHash: policyHash,
            policyVersion: 1,
            updatedAt: uint64(block.timestamp),
            acceptsIntroductions: true,
            exists: true
        });
        profileIdByHandle[handleHash] = profileId;
        profileIdByOwner[msg.sender] = profileId;

        emit ProfileRegistered(profileId, msg.sender, handleHash, profileHash);
        emit PolicyUpdated(profileId, 1, policyHash);
    }

    /// @notice Publish a new gate policy version. Receipts reference the version
    ///         they were evaluated against, so a recipient can always prove
    ///         which policy produced a verdict.
    function updatePolicy(uint256 profileId, bytes32 policyHash) external onlyProfileOwner(profileId) {
        if (policyHash == bytes32(0)) revert EmptyHash();
        Profile storage p = _profiles[profileId];
        p.policyHash = policyHash;
        p.policyVersion += 1;
        p.updatedAt = uint64(block.timestamp);
        emit PolicyUpdated(profileId, p.policyVersion, policyHash);
    }

    function updateProfileDocument(uint256 profileId, bytes32 profileHash) external onlyProfileOwner(profileId) {
        if (profileHash == bytes32(0)) revert EmptyHash();
        _profiles[profileId].profileHash = profileHash;
        _profiles[profileId].updatedAt = uint64(block.timestamp);
        emit ProfileUpdated(profileId, profileHash);
    }

    /// @notice Toggle whether this builder accepts new introductions. Closing the
    ///         door is a social action here, not a credential change.
    function setAcceptsIntroductions(uint256 profileId, bool accepts) external onlyProfileOwner(profileId) {
        _profiles[profileId].acceptsIntroductions = accepts;
        emit AvailabilityChanged(profileId, accepts);
    }

    function getProfile(uint256 profileId) external view returns (Profile memory) {
        if (!_profiles[profileId].exists) revert UnknownProfile();
        return _profiles[profileId];
    }

    /// @notice Convenience read used by the escrow to bind a lock to the
    ///         recipient's current policy version.
    function currentPolicyHash(uint256 profileId) external view returns (bytes32) {
        if (!_profiles[profileId].exists) revert UnknownProfile();
        return _profiles[profileId].policyHash;
    }
}
