// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ProfileRegistry} from "../src/ProfileRegistry.sol";
import {IntroductionEscrow} from "../src/IntroductionEscrow.sol";
import {IntroductionReceipt} from "../src/IntroductionReceipt.sol";

/// @notice Deploys the registry, optional evaluation receipt, and signed-quote escrow.
/// @dev Broadcast for real:
///      forge script script/Deploy.s.sol --rpc-url monad_testnet --broadcast
///      Simulate without a key (no funds or secret needed):
///      forge script script/Deploy.s.sol --rpc-url monad_testnet --sender 0xYourAddress
///      The simulation path is what CI and judges can reproduce.
contract Deploy is Script {
    function run() external {
        bool mainnet = block.chainid == 143;
        require(mainnet || block.chainid == 10143 || block.chainid == 31337, "SignalPass: unsupported network");
        require(!mainnet || vm.envOr("SIGNALPASS_ALLOW_MAINNET", false), "SignalPass: mainnet opt-in required");
        uint256 pk = vm.envOr("DEPLOYER_PRIVATE_KEY", uint256(0));

        if (pk == 0) {
            // No key configured: run as a dry-run against the real RPC. The
            // sender comes from --sender, nothing is signed and nothing lands.
            console.log("DEPLOYER_PRIVATE_KEY not set - simulating only (no broadcast)");
        }

        address deployer = pk == 0 ? msg.sender : vm.addr(pk);
        address treasury = vm.envOr("TREASURY_ADDRESS", deployer);
        address signer = vm.envOr("QUOTE_SIGNER_ADDRESS", deployer);
        require(treasury != address(0) && signer != address(0), "SignalPass: zero role address");
        // Keep the funded deployment key out of the API's quote-signing process.
        require(!mainnet || signer != deployer, "SignalPass: separate mainnet quote signer required");

        if (pk == 0) {
            vm.startBroadcast();
        } else {
            vm.startBroadcast(pk);
        }

        ProfileRegistry registry = new ProfileRegistry();
        IntroductionReceipt receipt = new IntroductionReceipt(deployer);
        IntroductionEscrow escrow = new IntroductionEscrow(address(registry), treasury, signer);

        vm.stopBroadcast();

        console.log("ProfileRegistry      ", address(registry));
        console.log("IntroductionEscrow   ", address(escrow));
        console.log("IntroductionReceipt  ", address(receipt));
        console.log("Deployer             ", deployer);
        console.log("Treasury             ", treasury);
        console.log("Quote signer         ", signer);
    }
}
