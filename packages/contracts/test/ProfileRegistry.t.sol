// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {ProfileRegistry} from "../src/ProfileRegistry.sol";

contract ProfileRegistryTest is Test {
    ProfileRegistry internal registry;

    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);

    bytes32 internal constant HANDLE = keccak256("alice");
    bytes32 internal constant PROFILE_DOC = keccak256("profile-doc");
    bytes32 internal constant POLICY_V1 = keccak256("policy-v1");

    function setUp() public {
        registry = new ProfileRegistry();
    }

    function test_RegisterProfile() public {
        vm.prank(alice);
        uint256 id = registry.registerProfile(HANDLE, PROFILE_DOC, POLICY_V1);

        assertEq(id, 1);
        assertEq(registry.profileIdByOwner(alice), 1);
        assertEq(registry.profileIdByHandle(HANDLE), 1);

        ProfileRegistry.Profile memory profile = registry.getProfile(1);
        assertEq(profile.owner, alice);
        assertEq(profile.profileHash, PROFILE_DOC);
        assertEq(profile.policyHash, POLICY_V1);
        assertEq(profile.policyVersion, 1);
        assertTrue(profile.acceptsIntroductions);
    }

    function test_SecondBuilderGetsNextId() public {
        vm.prank(alice);
        registry.registerProfile(HANDLE, PROFILE_DOC, POLICY_V1);

        vm.prank(bob);
        uint256 id = registry.registerProfile(keccak256("bob"), PROFILE_DOC, POLICY_V1);
        assertEq(id, 2);
        assertEq(registry.nextProfileId(), 3);
    }

    function test_RevertWhenRegisteringTwice() public {
        vm.startPrank(alice);
        registry.registerProfile(HANDLE, PROFILE_DOC, POLICY_V1);
        vm.expectRevert(ProfileRegistry.AlreadyRegistered.selector);
        registry.registerProfile(keccak256("alice-2"), PROFILE_DOC, POLICY_V1);
        vm.stopPrank();
    }

    function test_RevertWhenHandleTaken() public {
        vm.prank(alice);
        registry.registerProfile(HANDLE, PROFILE_DOC, POLICY_V1);

        vm.prank(bob);
        vm.expectRevert(ProfileRegistry.HandleTaken.selector);
        registry.registerProfile(HANDLE, PROFILE_DOC, POLICY_V1);
    }

    function test_RevertOnEmptyHash() public {
        vm.prank(alice);
        vm.expectRevert(ProfileRegistry.EmptyHash.selector);
        registry.registerProfile(HANDLE, bytes32(0), POLICY_V1);
    }

    function test_UpdatePolicyBumpsVersion() public {
        vm.startPrank(alice);
        registry.registerProfile(HANDLE, PROFILE_DOC, POLICY_V1);

        bytes32 policyV2 = keccak256("policy-v2");
        registry.updatePolicy(1, policyV2);

        ProfileRegistry.Profile memory profile = registry.getProfile(1);
        assertEq(profile.policyVersion, 2);
        assertEq(profile.policyHash, policyV2);
        assertEq(registry.currentPolicyHash(1), policyV2);
        vm.stopPrank();
    }

    function test_UpdateProfileDocumentKeepsPolicy() public {
        vm.startPrank(alice);
        registry.registerProfile(HANDLE, PROFILE_DOC, POLICY_V1);

        bytes32 nextDoc = keccak256("profile-doc-v2");
        registry.updateProfileDocument(1, nextDoc);

        ProfileRegistry.Profile memory profile = registry.getProfile(1);
        assertEq(profile.profileHash, nextDoc);
        assertEq(profile.policyHash, POLICY_V1);
        assertEq(profile.policyVersion, 1);
        vm.stopPrank();
    }

    function test_RevertWhenNonOwnerUpdatesPolicy() public {
        vm.prank(alice);
        registry.registerProfile(HANDLE, PROFILE_DOC, POLICY_V1);

        vm.prank(bob);
        vm.expectRevert(ProfileRegistry.NotProfileOwner.selector);
        registry.updatePolicy(1, keccak256("hijack"));
    }

    function test_SetAcceptsIntroductions() public {
        vm.startPrank(alice);
        registry.registerProfile(HANDLE, PROFILE_DOC, POLICY_V1);

        registry.setAcceptsIntroductions(1, false);
        assertFalse(registry.getProfile(1).acceptsIntroductions);

        registry.setAcceptsIntroductions(1, true);
        assertTrue(registry.getProfile(1).acceptsIntroductions);
        vm.stopPrank();
    }

    function test_RevertOnUnknownProfile() public {
        vm.expectRevert(ProfileRegistry.UnknownProfile.selector);
        registry.getProfile(99);
    }
}
