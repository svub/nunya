// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

struct ExecutionInfo {
    bytes user_key;
    bytes user_pubkey;
    string routing_code_hash;
    string task_destination_network;
    string handle;
    bytes12 nonce;
    uint32 callback_gas_limit;
    bytes payload;
    bytes payload_signature;
}

struct PostExecutionInfo {
    bytes32 payload_hash;
    bytes32 packet_hash;
    bytes20 callback_address;
    bytes4 callback_selector;
    bytes4 callback_gas_limit;
    bytes packet_signature;
    bytes result;
}

interface IGateway {
    function ethSignedPayloadHash(bytes memory payload) external pure returns (bytes32 payloadHash);
    function recoverSigner(bytes32 _signedMessageHash, bytes calldata _signature) external view returns (address signerAddress);
    function encodeAddressToBase64(address data) external pure returns (bytes28 result);
    function uint256toBytesString(uint256 x) external pure returns (bytes memory s);
    function itoa31 (uint256 x) external pure returns (uint256 y);
    function getChainId(bytes32 chain_id_1_tmp, bytes32 chain_id_2_tmp, bytes32 chain_id_3_tmp, uint256 chain_id_length_tmp) external pure returns (string memory result);
    function prepareRandomnessBytesToCallbackData(bytes4 callback_selector, uint256 requestId, bytes calldata data) external pure returns (bytes memory result);
    function prepareResultBytesToCallbackData(bytes4 callback_selector, uint256 _taskId, bytes calldata data) external pure returns (bytes memory result);
    function increaseTaskId(uint256 _newTaskId) external;
    function increaseNonce(uint256 _newNonce) external;
    function payoutBalance() external;
    function estimateRequestPrice(uint32 _callbackGasLimit) external view returns (uint256 baseFee);
    function send(        
        bytes32 _payloadHash,
        address _userAddress,
        string calldata _routingInfo,
        ExecutionInfo calldata _info
    ) external payable returns (uint256 _taskId);
    function postExecution(uint256 _taskId, string calldata _sourceNetwork, PostExecutionInfo calldata _info) external;
    function upgradeHandler() external;
    function setSecretContractInfo(string _routingInfo, string _routingCodeHash) external payable onlyOwner returns (bool) {
    function requestValue(uint256 _callbackSelector, uint32 _callbackGasLimit) external payable returns (uint256 requestId);
    // TODO: should not need to be payable
    function retrievePubkey(uint256 _callbackSelector, uint32 _callbackGasLimit) external payable returns (uint256 requestId);
    function newSecretUser(string calldata secret) external returns (uint256);
    function createPaymentReference(string calldata secret, string calldata ref) external returns (uint256);
    function pay(string calldata secret, string calldata ref, uint256 amount, string calldata denomination) external returns (uint256);
    function payWithReceipt(string calldata secret, string calldata ref, uint256 amount, string calldata denomination, uint256 userPubkey) external returns (uint256);
    function withdrawTo(string calldata secret, uint256 amount, string calldata _denomination, address withdrawalAddress) external returns (uint256);
    fallback() external payable;
    receive() external payable;
}
