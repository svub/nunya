// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// IDEA Maybe it should be called GatewayContract? Or GatewayInterface
interface IDummyGateway {
    function newSecretUser(string calldata secret) external returns (uint256);
    function createPaymentReference(string calldata secret, string calldata ref) external returns (uint256);
    function pay(string calldata secret, string calldata ref, uint256 amount, string calldata denomination) external returns (uint256);
    function payWithReceipt(string calldata secret, string calldata ref, uint256 amount, string calldata denomination, uint256 userPubkey) external returns (uint256);
    function withdrawTo(string calldata secret, uint256 amount, string calldata _denomination, address withdrawalAddress) external returns (uint256);
    function retrievePubkey() external returns (uint256);
    fallback() external payable;
    receive() external payable;
}
