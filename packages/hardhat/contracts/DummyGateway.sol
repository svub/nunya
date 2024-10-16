// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

// TODO remove in production
import "hardhat/console.sol";
import "./ISecretContract.sol";

// Dummy Secret Network EVM Gateway contract (so we can use the contracts on devnet)

contract DummyGatewayContract is ISecretContract {
    
    function newSecretUser(string calldata secret) external returns (uint256) {
        // console.log("------ DummyGateway.newSecretUser", secret);
        return 6;
    }
    function createPaymentReference(string calldata secret, string calldata ref) external returns (uint256) {
        // console.log("------ DummyGateway.createPaymentReference", secret, ref);
        return 5;
    }
    // TODO: `string calldata secret` or `uint256 secret`
    function pay(string calldata secret, string calldata ref, uint256 amount, string calldata denomination) external returns (uint256) {
        // console.log("------ DummyGateway.pay", secret, ref, amount, denomination);
        return 4;
    }
    // TODO: `string calldata secret` or `uint256 secret`
    function payWithReceipt(string calldata secret, string calldata ref, uint256 amount, string calldata denomination, uint256 userPubkey) external returns (uint256) {
        // console.log("------ DummyGateway.payWithReceipt", secret, ref, amount, denomination, userPubkey);
        return 3;
    }
    // TODO: `string calldata secret` or `uint256 secret`
    function withdrawTo(string calldata secret, uint256 amount, string calldata denomination, address withdrawalAddress) external returns (uint256) {
        // console.log("------ DummyGateway.withdraw", secret, amount, denomination, withdrawalAddress);
        return 2;
    }

    function retrievePubkey() external returns (uint256){
        // console.log("------ DummyGateway.retrievePubkey");
        return 1;
    }

    fallback() external payable {
        // console.log("----- DummyGateway.sol fallback() msg.value:", msg.value);
    }

    receive() external payable {
        // console.log("----- DummyGateway.sol receive() msg.value:", msg.value);
    }
}
