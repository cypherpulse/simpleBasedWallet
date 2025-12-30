// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/SimpleBaseWallet.sol";

contract DeploySimpleWallet is Script {
    function run() external {
        vm.startBroadcast();

        // Deploy with treasury = deployer (msg.sender)
        address treasury = msg.sender;
        SimpleBaseWallet wallet = new SimpleBaseWallet(treasury);

        vm.stopBroadcast();

        console.log("SimpleBaseWallet deployed at:", address(wallet));
        console.log("Treasury (deployer):", treasury);
    }
}