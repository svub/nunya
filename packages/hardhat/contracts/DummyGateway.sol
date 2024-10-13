// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// TODO remove in production
import "hardhat/console.sol";
import "./ISecretContract.sol";

// Dummy Secret Network EVM Gateway contract (so we can use the contracts on devnet)

contract DummyGatewayContract is ISecretContract {
    
    function newSecretUser(string calldata secret) external returns (uint256) {
        console.log("------ DummyGateway.newSecretUser", secret);
        return 6;
    }
    function createPaymentReference(string calldata secret, string calldata ref) external returns (uint256) {
        console.log("------ DummyGateway.createPaymentReference", secret, ref);
        return 5;
    }
    function pay(string calldata ref, uint256 amount) external returns (uint256) {
        console.log("------ DummyGateway.pay", ref, amount);
        return 4;
    }
    function payWithReceipt(string calldata ref, uint256 amount, uint256 userPubkey) external returns (uint256) {
        console.log("------ DummyGateway.payWithReceipt", ref, amount, userPubkey);
        return 3;
    }
    function withdraw(string calldata secret, uint256 amount, address withdrawalAddress) external returns (uint256) {
        console.log("------ DummyGateway.withdraw", secret, amount, withdrawalAddress);
        return 2;
    }

    function retrievePubkey() external returns (uint256){
        console.log("------ DummyGateway.retrievePubkey");
        return 1;
    }

    fallback() external payable {
        console.log("----- DummyGateway.sol fallback() msg.value:", msg.value);
    }

    receive() external payable {
        console.log("----- DummyGateway.sol receive() msg.value:", msg.value);
    }
}
