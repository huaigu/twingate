// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ProfileRegistry} from "../src/ProfileRegistry.sol";
import {IntroductionEscrow} from "../src/IntroductionEscrow.sol";
import {IntroductionReceipt} from "../src/IntroductionReceipt.sol";

/// @notice Deploys the three SignalPass contracts and wires them together.
/// @dev Run with:
///      forge script script/Deploy.s.sol --rpc-url monad_testnet --broadcast
contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(pk);

        vm.startBroadcast(pk);

        ProfileRegistry registry = new ProfileRegistry();
        IntroductionReceipt receipt = new IntroductionReceipt(deployer);
        IntroductionEscrow escrow = new IntroductionEscrow(address(registry), deployer, deployer);

        vm.stopBroadcast();

        console.log("ProfileRegistry      ", address(registry));
        console.log("IntroductionEscrow   ", address(escrow));
        console.log("IntroductionReceipt  ", address(receipt));
        console.log("Deployer             ", deployer);
    }
}
