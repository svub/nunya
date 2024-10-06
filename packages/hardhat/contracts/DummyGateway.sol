// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// TODO in production
import "hardhat/console.sol";

// Dummy Secret Network EVM Gateway contract (so we can use the contracts on devnet)

contract SecretContract {
    function newSecretUser(uint256 secret) external returns (uint256) {
        return 6;
    }
    function linkPaymentRef(uint256 secret, string calldata ref) external returns (uint256) {
        return 5;
    }
    function pay(string calldata ref, uint256 amount) external returns (uint256) {
        return 4;
    }
    function payWithReceipt(string calldata ref, uint256 amount, uint256 userPubkey) external returns (uint256) {
        return 3;
    }
    function withdraw(string calldata secret, address withdrawalAddress) external returns (uint256){
        return 2;
    }

    function retrievePubkey() external returns (uint256){
        return 1;
    }

}