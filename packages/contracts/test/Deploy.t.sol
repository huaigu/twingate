// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {Deploy} from "../script/Deploy.s.sol";
import {ProfileRegistry} from "../src/ProfileRegistry.sol";
import {IntroductionReceipt} from "../src/IntroductionReceipt.sol";
import {IntroductionEscrow} from "../src/IntroductionEscrow.sol";

/// @notice Network and role safeguards are exercised in the local test EVM only.
contract DeployTest is Test {
    Deploy internal deployment;
    // Public fixture value; never used to sign transactions on a public chain.
    uint256 internal constant FIXTURE_KEY = 1;
    address internal deployer;
    address internal constant SIGNER = address(0xA61);
    address internal constant TREASURY = address(0x7EA);

    function setUp() public {
        deployer = vm.addr(FIXTURE_KEY);
        deployment = new Deploy();
    }

    // Foundry's environment is shared across concurrently executed tests. Keep
    // these environment-dependent scenarios sequential in one regression test.
    function test_DeploymentNetworkAndRoleSafeguards() public {
        _rejectsUnsupportedNetworkEvenWithOptIn();
        _mainnetRequiresExplicitOptIn();
        _mainnetRejectsFundedDeployerAsQuoteSigner();
        _mainnetNoKeySimulationStillRequiresSeparateSigner();
        _mainnetOptInDeploysWithSeparateSigner();
        _localDeploymentDoesNotRequireMainnetOptInOrSeparateSigner();
        _testnetDeploymentDoesNotRequireMainnetOptInOrSeparateSigner();
        _rejectsZeroTreasury();
        _rejectsZeroQuoteSigner();
    }

    function _resetEnv() internal {
        vm.setEnv("DEPLOYER_PRIVATE_KEY", "1");
        vm.setEnv("SIGNALPASS_ALLOW_MAINNET", "false");
        vm.setEnv("TREASURY_ADDRESS", vm.toString(TREASURY));
        vm.setEnv("QUOTE_SIGNER_ADDRESS", vm.toString(SIGNER));
    }

    function _rejectsUnsupportedNetworkEvenWithOptIn() internal {
        _resetEnv();
        vm.chainId(1);
        vm.setEnv("SIGNALPASS_ALLOW_MAINNET", "true");
        vm.expectRevert("SignalPass: unsupported network");
        deployment.run();
    }

    function _mainnetRequiresExplicitOptIn() internal {
        _resetEnv();
        vm.chainId(143);
        vm.expectRevert("SignalPass: mainnet opt-in required");
        deployment.run();
    }

    function _mainnetRejectsFundedDeployerAsQuoteSigner() internal {
        _resetEnv();
        vm.chainId(143);
        vm.setEnv("SIGNALPASS_ALLOW_MAINNET", "true");
        vm.setEnv("QUOTE_SIGNER_ADDRESS", vm.toString(deployer));
        vm.expectRevert("SignalPass: separate mainnet quote signer required");
        deployment.run();
    }

    function _mainnetNoKeySimulationStillRequiresSeparateSigner() internal {
        _resetEnv();
        vm.chainId(143);
        vm.setEnv("SIGNALPASS_ALLOW_MAINNET", "true");
        vm.setEnv("DEPLOYER_PRIVATE_KEY", "0");
        vm.setEnv("QUOTE_SIGNER_ADDRESS", vm.toString(address(this)));
        vm.expectRevert("SignalPass: separate mainnet quote signer required");
        deployment.run();
    }

    function _mainnetOptInDeploysWithSeparateSigner() internal {
        _resetEnv();
        vm.chainId(143);
        vm.setEnv("SIGNALPASS_ALLOW_MAINNET", "true");
        _assertDeployment(SIGNER);
    }

    function _localDeploymentDoesNotRequireMainnetOptInOrSeparateSigner() internal {
        _resetEnv();
        vm.chainId(31337);
        vm.setEnv("QUOTE_SIGNER_ADDRESS", vm.toString(deployer));
        _assertDeployment(deployer);
    }

    function _testnetDeploymentDoesNotRequireMainnetOptInOrSeparateSigner() internal {
        _resetEnv();
        vm.chainId(10143);
        vm.setEnv("QUOTE_SIGNER_ADDRESS", vm.toString(deployer));
        _assertDeployment(deployer);
    }

    function _rejectsZeroTreasury() internal {
        _resetEnv();
        vm.chainId(143);
        vm.setEnv("SIGNALPASS_ALLOW_MAINNET", "true");
        vm.setEnv("TREASURY_ADDRESS", vm.toString(address(0)));
        vm.expectRevert("SignalPass: zero role address");
        deployment.run();
    }

    function _rejectsZeroQuoteSigner() internal {
        _resetEnv();
        vm.chainId(143);
        vm.setEnv("SIGNALPASS_ALLOW_MAINNET", "true");
        vm.setEnv("QUOTE_SIGNER_ADDRESS", vm.toString(address(0)));
        vm.expectRevert("SignalPass: zero role address");
        deployment.run();
    }

    function _assertDeployment(address expectedSigner) internal {
        uint256 nonce = vm.getNonce(deployer);
        address registryAddress = vm.computeCreateAddress(deployer, nonce);
        address receiptAddress = vm.computeCreateAddress(deployer, nonce + 1);
        address escrowAddress = vm.computeCreateAddress(deployer, nonce + 2);
        deployment.run();

        assertGt(registryAddress.code.length, 0);
        assertGt(receiptAddress.code.length, 0);
        assertGt(escrowAddress.code.length, 0);
        assertEq(ProfileRegistry(registryAddress).nextProfileId(), 1);
        assertEq(IntroductionReceipt(receiptAddress).evaluator(), deployer);
        assertEq(address(IntroductionEscrow(escrowAddress).registry()), registryAddress);
        assertEq(IntroductionEscrow(escrowAddress).treasury(), TREASURY);
        assertEq(IntroductionEscrow(escrowAddress).quoteSigner(), expectedSigner);
        assertEq(IntroductionEscrow(escrowAddress).evaluator(), expectedSigner);
    }
}
