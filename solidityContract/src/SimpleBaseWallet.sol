// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract SimpleBaseWallet is Ownable, ReentrancyGuard, Pausable {
    address public immutable TREASURY;
    uint256 public constant PROTOCOL_FEE_BPS = 50; // 0.5%

    event Deposited(address indexed from, uint256 amount);
    event Withdrawn(address indexed owner, address indexed to, uint256 amountSent, uint256 fee);
    event EmergencyRecovered(address indexed to, uint256 amount);

    error ZeroAddress();
    error InsufficientBalance();
    error FeeFailed();
    error TransferFailed();

    constructor(address _treasury) Ownable(msg.sender) {
        if (_treasury == address(0)) revert ZeroAddress();
        TREASURY = _treasury;
    }

    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }

    function sendEth(address to, uint256 amount) external onlyOwner nonReentrant whenNotPaused {
        if (to == address(0)) revert ZeroAddress();
        if (amount > address(this).balance) revert InsufficientBalance();
        
        uint256 fee = (amount * PROTOCOL_FEE_BPS) / 10000;
        uint256 amountAfterFee = amount - fee;
        
        (bool success1, ) = TREASURY.call{value: fee}("");
        if (!success1) revert FeeFailed();
        
        (bool success2, ) = to.call{value: amountAfterFee}("");
        if (!success2) revert TransferFailed();
        
        emit Withdrawn(msg.sender, to, amountAfterFee, fee);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyRecover(address to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        uint256 balance = address(this).balance;
        payable(to).transfer(balance);
        emit EmergencyRecovered(to, balance);
    }
}