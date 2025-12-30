// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../src/SimpleBaseWallet.sol";

contract SimpleBaseWalletTest is Test {
    SimpleBaseWallet wallet;
    address owner = address(1);
    address treasury = address(2);
    address user = address(3);
    address recipient = address(4);

    function setUp() public {
        vm.prank(owner);
        wallet = new SimpleBaseWallet(treasury);
    }

    function testDeployment() public view {
        assertEq(wallet.owner(), owner);
        assertEq(wallet.TREASURY(), treasury);
        assertEq(wallet.PROTOCOL_FEE_BPS(), 50);
        assertFalse(wallet.paused());
    }

    function testReceiveETH() public {
        vm.deal(user, 1 ether);
        vm.prank(user);
        (bool success,) = address(wallet).call{value: 0.5 ether}("");
        assertTrue(success);
        assertEq(wallet.getBalance(), 0.5 ether);
    }

    function testDepositedEvent() public {
        vm.deal(user, 1 ether);
        vm.prank(user);
        vm.expectEmit(true, false, false, true);
        emit SimpleBaseWallet.Deposited(user, 0.5 ether);
        (bool success,) = address(wallet).call{value: 0.5 ether}("");
        assertTrue(success);
    }

    function testSendEth() public {
        vm.deal(address(wallet), 1 ether);
        uint256 amount = 0.5 ether;
        uint256 fee = (amount * 50) / 10000; // 0.0025 ether
        uint256 amountAfterFee = amount - fee;

        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit SimpleBaseWallet.Withdrawn(owner, recipient, amountAfterFee, fee);
        wallet.sendEth(recipient, amount);

        assertEq(wallet.getBalance(), 1 ether - amount);
        assertEq(recipient.balance, amountAfterFee);
        assertEq(treasury.balance, fee);
    }

    function testSendEthZeroAddress() public {
        vm.deal(address(wallet), 1 ether);
        vm.prank(owner);
        vm.expectRevert(SimpleBaseWallet.ZeroAddress.selector);
        wallet.sendEth(address(0), 0.5 ether);
    }

    function testSendEthInsufficientBalance() public {
        vm.deal(address(wallet), 0.1 ether);
        vm.prank(owner);
        vm.expectRevert(SimpleBaseWallet.InsufficientBalance.selector);
        wallet.sendEth(recipient, 0.5 ether);
    }

    function testSendEthPaused() public {
        vm.deal(address(wallet), 1 ether);
        vm.prank(owner);
        wallet.pause();
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(Pausable.EnforcedPause.selector));
        wallet.sendEth(recipient, 0.5 ether);
    }

    function testSendEthNotOwner() public {
        vm.deal(address(wallet), 1 ether);
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        wallet.sendEth(recipient, 0.5 ether);
    }

    function testGetBalance() public {
        vm.deal(address(wallet), 1 ether);
        assertEq(wallet.getBalance(), 1 ether);
    }

    function testPause() public {
        vm.prank(owner);
        wallet.pause();
        assertTrue(wallet.paused());
    }

    function testPauseNotOwner() public {
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        wallet.pause();
    }

    function testUnpause() public {
        vm.prank(owner);
        wallet.pause();
        vm.prank(owner);
        wallet.unpause();
        assertFalse(wallet.paused());
    }

    function testUnpauseNotOwner() public {
        vm.prank(owner);
        wallet.pause();
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        wallet.unpause();
    }

    function testEmergencyRecover() public {
        vm.deal(address(wallet), 1 ether);
        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit SimpleBaseWallet.EmergencyRecovered(recipient, 1 ether);
        wallet.emergencyRecover(recipient);
        assertEq(wallet.getBalance(), 0);
        assertEq(recipient.balance, 1 ether);
    }

    function testEmergencyRecoverZeroAddress() public {
        vm.deal(address(wallet), 1 ether);
        vm.prank(owner);
        vm.expectRevert(SimpleBaseWallet.ZeroAddress.selector);
        wallet.emergencyRecover(address(0));
    }

    function testEmergencyRecoverNotOwner() public {
        vm.deal(address(wallet), 1 ether);
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        wallet.emergencyRecover(recipient);
    }

    function testConstructorZeroTreasury() public {
        vm.expectRevert(SimpleBaseWallet.ZeroAddress.selector);
        new SimpleBaseWallet(address(0));
    }
}