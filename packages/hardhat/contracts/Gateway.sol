// SPDX-License-Identifier: Apache-2.0
// Version: 0.2.5
pragma solidity ^0.8.26;

// TODO remove in production
import "hardhat/console.sol";

// TODO: remove since do not need this in the file it is an interface of
import "./IGateway.sol";

// We need JSON parsing to introspect on the `pay` function
import "./JsmnSolLib.sol";

import "./Utils.sol";

import "./Ownable.sol";

contract Gateway is Ownable, Utils {
    /*//////////////////////////////////////////////////////////////
                              Constants
    //////////////////////////////////////////////////////////////*/

    // Owner of this contract in Ownable.sol

    //Use hard coded constant values instead of storage variables for Secret VRF, saves around 10,000+ in gas per TX. 
    //Since contract is upgradeable, we can update these values as well with it.

    //Core Routing
    bytes32 immutable chain_id_1; bytes32 immutable chain_id_2; 
    bytes32 immutable chain_id_3; uint256 immutable chain_id_length; 

    // CONFIGURE

    //string constant public task_destination_network = "secret-4";
    //address constant public secret_gateway_signer_address = 0x88e43F4016f8282Ea6235aC069D02BA1cE5417aB;
    string constant public task_destination_network = "pulsar-3";
    uint256 immutable public secret_gateway_signer_pubkey;
    // TODO: change this to be the same as the DEPLOYER_ADDRESS in the .env file
    // FIXME: Is this actually a derived Ethereum Address from a Public Key of the Gateway contract on the Secret network rather than my EVM address as discussed with Tom 16 Nov 2024??
    address immutable public secret_gateway_signer_address = 0x83De04f1aad8ABF1883166B14A29c084b7B8AB59;
    // TODO: Add deployed custom Secret contract address to be same as `SECRET_ADDRESS` and codehash `CODE_HASH` used in scripts
    string constant public routing_info = "secret1uwqdjnzrttepn86p2sjmnugfph7tz97hmcwjs3";
    string constant public routing_code_hash = "1af180cc6506af23fb3ee2c0f6ece37ab3ad32db82e061b6b30679fb8a3f1323";

    /*//////////////////////////////////////////////////////////////
                              Structs
    //////////////////////////////////////////////////////////////*/

    struct Task {
        bytes31 payload_hash_reduced;
        bool completed;
    }

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

    /*//////////////////////////////////////////////////////////////
                            State Variables
    //////////////////////////////////////////////////////////////*/

    uint256 public taskId;
    uint256 public nonce;

    /// @dev Task ID => Task
    mapping(uint256 => Task) public tasks;

    /*//////////////////////////////////////////////////////////////
                            Modifiers
    //////////////////////////////////////////////////////////////*/

    // Modifier onlyOwner() in Owned.sol

    /*//////////////////////////////////////////////////////////////
                              Helpers
    //////////////////////////////////////////////////////////////*/

   function ethSignedPayloadHash(bytes memory payload) public pure returns (bytes32 payloadHash) {
        assembly {
            // Take scratch memory for the data to hash
            let data := mload(0x40)
            mstore(data,"\x19Ethereum Signed Message:\n32")
            mstore(add(data, 28), keccak256(add(payload, 32), mload(payload)))
            payloadHash := keccak256(data, 60)
            mstore(0x40, add(data, 64))
        }
    }

    /// @notice Recovers the signer address from a message hash and a signature
    /// @param _signedMessageHash The hash of the signed message
    /// @param _signature The signature
    /// @return signerAddress The address of the signer

    function recoverSigner(bytes32 _signedMessageHash, bytes calldata _signature) public view returns (address signerAddress) {
        require(_signature.length == 65, "Invalid Signature Length");
        
        assembly {
            //Loading in v,s,r from _signature calldata is like this:
            //calldataload (4 bytes function selector + 32 bytes signed message hash + 32 bytes bytes _signature length 
            //+ 32 bytes per v (reads 32 bytes in)
            let m := mload(0x40) // Load free memory pointer
            mstore(m, _signedMessageHash) // Store _signedMessageHash at memory location m
            mstore(add(m, 32), byte(0, calldataload(add(_signature.offset, 64)))) // Load v from _signature and store at m + 32
            mstore(add(m, 64), calldataload(add(_signature.offset, 0))) // Load r from _signature and store at m + 64
            mstore(add(m, 96), calldataload(add(_signature.offset, 32))) // Load s from _signature and store at m + 96
            // Call ecrecover: returns 0 on error, address on success, 0 for failure
            if iszero(staticcall(gas(), 0x01, m, 128, m, 32)) {
                revert(0, 0)
            }
            //load result into result
            signerAddress := mload(m) 
            mstore(0x40, add(m, 128)) // Update free memory pointer
        }
    }

    /// @notice Encodes a bytes memory array into a Base64 string
    /// @param data The address data to encode
    /// @return result The bytes28 encoded string

    function encodeAddressToBase64(address data) public pure returns (bytes28 result) {
        bytes memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        assembly {
            let resultPtr := mload(0x00) // Load scratch memory pointer
            table := add(table, 1)
            mstore8(resultPtr, mload(add(table, shr(154, data))))
            mstore8(add(resultPtr, 1), mload(add(table, and(shr(148, data), 0x3F))))
            mstore8(add(resultPtr, 2), mload(add(table, and(shr(142, data), 0x3F))))
            mstore8(add(resultPtr, 3), mload(add(table, and(shr(136, data), 0x3F))))
            mstore8(add(resultPtr, 4), mload(add(table, and(shr(130, data), 0x3F))))
            mstore8(add(resultPtr, 5), mload(add(table, and(shr(124, data), 0x3F))))
            mstore8(add(resultPtr, 6), mload(add(table, and(shr(118, data), 0x3F))))
            mstore8(add(resultPtr, 7), mload(add(table, and(shr(112, data), 0x3F))))
            mstore8(add(resultPtr, 8), mload(add(table, and(shr(106, data), 0x3F))))
            mstore8(add(resultPtr, 9), mload(add(table, and(shr(100, data), 0x3F))))
            mstore8(add(resultPtr, 10), mload(add(table, and(shr(94, data), 0x3F))))
            mstore8(add(resultPtr, 11), mload(add(table, and(shr(88, data), 0x3F))))
            mstore8(add(resultPtr, 12), mload(add(table, and(shr(82, data), 0x3F))))
            mstore8(add(resultPtr, 13), mload(add(table, and(shr(76, data), 0x3F))))
            mstore8(add(resultPtr, 14), mload(add(table, and(shr(70, data), 0x3F))))
            mstore8(add(resultPtr, 15), mload(add(table, and(shr(64, data), 0x3F))))
            mstore8(add(resultPtr, 16), mload(add(table, and(shr(58, data), 0x3F))))
            mstore8(add(resultPtr, 17), mload(add(table, and(shr(52, data), 0x3F))))
            mstore8(add(resultPtr, 18), mload(add(table, and(shr(46, data), 0x3F))))
            mstore8(add(resultPtr, 19), mload(add(table, and(shr(40, data), 0x3F))))
            mstore8(add(resultPtr, 20), mload(add(table, and(shr(34, data), 0x3F)))) 
            mstore8(add(resultPtr, 21), mload(add(table, and(shr(28, data), 0x3F))))
            mstore8(add(resultPtr, 22), mload(add(table, and(shr(22, data), 0x3F))))
            mstore8(add(resultPtr, 23), mload(add(table, and(shr(16, data), 0x3F))))
            mstore8(add(resultPtr, 24), mload(add(table, and(shr(10, data), 0x3F))))
            mstore8(add(resultPtr, 25), mload(add(table, and(shr(4, data), 0x3F))))
            mstore8(add(resultPtr, 26), mload(add(table, and(shl(2, data), 0x3F))))
            mstore8(add(resultPtr, 27), 0x3d)
            result := mload(resultPtr)
        }
    }

    function getChainId(bytes32 chain_id_1_tmp, bytes32 chain_id_2_tmp, bytes32 chain_id_3_tmp, uint256 chain_id_length_tmp) public pure returns (string memory result) {
        assembly {
            result := mload(0x40)
            mstore(result, chain_id_length_tmp)
            mstore(add(result, 32), chain_id_1_tmp)
            mstore(add(result, 64), chain_id_2_tmp)
            mstore(add(result, 96), chain_id_3_tmp)
            mstore(0x40, add(result, 128))
        }
    }
    
    /// @notice Converts a bytes memory array to an array of uint256
    /// @param data The bytes memory data to convert
    /// @return result The calldata for the returned Randomness
    
    function prepareRandomnessBytesToCallbackData(bytes4 callback_selector, uint256 requestId, bytes calldata data) public pure returns (bytes memory result) {
        require(data.length % 32 == 0, "Invalid Bytes Length");

        assembly {
            result := mload(0x40) 
            mstore(result, add(100, data.length))
            mstore(add(result, 32), callback_selector)
            mstore(add(result, 36), requestId)
            mstore(add(result, 68), 0x40)
            mstore(add(result, 100), div(data.length, 32)) 
            calldatacopy(add(result, 132), data.offset, data.length)
            mstore(0x40, add(add(result, 132), data.length))
        }
    }

    /// @notice Converts a bytes memory array into a callback data array
    /// @param data The bytes memory data to convert
    /// @return result The calldata for the returned data

    function prepareResultBytesToCallbackData(bytes4 callback_selector, uint256 _taskId, bytes calldata data) public pure returns (bytes memory result) {
        assembly {
            result := mload(0x40) 
            mstore(result, add(100, data.length))
            mstore(add(result, 32), callback_selector)
            mstore(add(result, 36), _taskId)
            mstore(add(result, 68), 0x40)
            mstore(add(result, 100), data.length) 
            calldatacopy(add(result, 132), data.offset, data.length)
            mstore(0x40, add(add(result, 132), data.length))
        }
    }

    /// @notice Converts a uint256 into bytes
    // https://ethereum.stackexchange.com/a/78487/9680

    function toBytes(uint256 a) public pure returns (bytes32) {
        uint i;
        for (i = 0; i < 33; i++) {
            if (a / 256**i == 0) break;
        }
        return bytes32(a) << (32-i)*8;
    }

    /*//////////////////////////////////////////////////////////////
                              Events
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a new request comes into the gateway; to be picked up by the relayer
    event logNewTask(
        uint256 indexed task_id,
        string source_network,
        address user_address,
        string routing_info,
        bytes32 payload_hash,
        ExecutionInfo info
    );

    /// @notice Emitted when the callback was completed
    event TaskCompleted(uint256 indexed taskId, bool callbackSuccessful);

    /// @notice Emitted when the VRF callback was fulfilled
    event FulfilledRandomWords(uint256 indexed requestId);

    // Constructor
    // FIXME - consider removing _senderPubkey as discussed with Tom 16 Nov 2024
    constructor(uint256 _senderPubkey, address secretGatewaySignerAddr) {
        require (_senderPubkey == address(0x0), "Invalid public key provided cannot be 0x0");
        // FIXME - the msg.sender is the Nunya.Contract not a user, but does it have a different public key
        require ( checkPubKey(bytes uint256toBytesString(_senderPubkey), msg.sender), "Message sender public key does not match the provided public key");

        // Initializer
        // Set owner to be the deployed NunyaBusiness.sol contract
        owner = msg.sender;
        // Store public key of the creator of the Gateway.sol contract.
        secret_gateway_signer_pubkey = _senderPubkey;

        taskId = 1;
        nonce = 0;

        // Used as an override for testing. 
        // If not specified otherwise for testing, this just defaults to the signing address defined at the top.
        if (secretGatewaySignerAddr != address(0x0)) {
            secret_gateway_signer_address = secretGatewaySignerAddr;
        }

        //Burn in the Chain-ID into the byte code into chain_id_1, chain_id_2 and chain_id_3 and chain_id_length. 
        bytes memory chain_id = uint256toBytesString(block.chainid);
        bytes32 chain_id_1_tmp; bytes32 chain_id_2_tmp; bytes32 chain_id_3_tmp; 
        uint256 chain_id_length_tmp = chain_id.length;

        assembly {
            chain_id_1_tmp := mload(add(chain_id, 32))
            if gt(chain_id_length_tmp, 32) {
                chain_id_2_tmp := mload(add(chain_id, 64))
                if gt(chain_id_length_tmp, 64) {
                    chain_id_3_tmp := mload(add(chain_id, 96))
                }  
            }
        }

        chain_id_1 = chain_id_1_tmp; 
        chain_id_2 = chain_id_2_tmp;
        chain_id_3 = chain_id_3_tmp;
        chain_id_length = chain_id.length;
    }

    /*//////////////////////////////////////////////////////////////
                        Maintainance Functions
    //////////////////////////////////////////////////////////////*/

    /// @notice Increase the task_id if needed
    /// @param _newTaskId the new task_id

    function increaseTaskId(uint256 _newTaskId) external onlyOwner {
        require (_newTaskId > taskId, "New task id must be higher than the old task_id");
        taskId = _newTaskId;
    }

    /// @notice Increase the nonce if needed
    /// @param _newNonce the new nonce

    function increaseNonce(uint256 _newNonce) external onlyOwner {
        require (_newNonce > nonce, "New nonce must be higher than the old nonce");
        nonce = _newNonce;
    }

    /// @notice Payout the paid balance to the owner

    function payoutBalance() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    /*//////////////////////////////////////////////////////////////
                    Gas Price Payment Functions
    //////////////////////////////////////////////////////////////*/

    /// @notice Increase the task_id to check for problems 
    /// @param _callbackGasLimit the Callback Gas Limit

    function estimateRequestPrice(uint32 _callbackGasLimit) public view returns (uint256 baseFee) {
        baseFee = _callbackGasLimit*tx.gasprice;
    }

    /*//////////////////////////////////////////////////////////////
                             Pre Execution
    //////////////////////////////////////////////////////////////*/

    /// @notice Creates a new task with provided execution info
    /// @param _payloadHash Hash of the payload
    /// @param _userAddress Address of the user .. WARNING - does not perform same purpose in this modified version
    // where the NunyaBusiness.sol contract address is being sent instead 
    /// @param _routingInfo Routing information
    /// @param _info Execution information

    function send(
        bytes32 _payloadHash,
        address _nunyaBusinessContractAddress,
        string calldata _routingInfo,
        ExecutionInfo calldata _info) 
        external payable onlyOwner returns (uint256 _taskId) {

        _taskId = taskId;

        uint256 estimatedPrice = estimateRequestPrice(_info.callback_gas_limit);

        // Refund any excess gas paid beyond the estimated price
        if (msg.value > estimatedPrice) {
            payable(tx.origin).transfer(msg.value - estimatedPrice);
        } else {
            // If not enough gas was paid, revert the transaction
            require(msg.value >= estimatedPrice, "Paid Callback Fee Too Low");
        }

        // Payload hash verification
        require(ethSignedPayloadHash(_info.payload) == _payloadHash, "Invalid Payload Hash");
        
        // persisting the task
        tasks[_taskId] = Task(bytes31(_payloadHash), false);

        //emit the task to be picked up by the relayer
        emit logNewTask(
            _taskId,
            getChainId(chain_id_1, chain_id_2, chain_id_3, chain_id_length),
            // Note: previously _userAddress but customized for Nunya to be NunyaBusiness.sol
            owner,
            _routingInfo,
            _payloadHash,
            _info
        );

        //Increase the taskId to be used in the next gateway call. 
	    taskId = _taskId + 1;
    }

    /*//////////////////////////////////////////////////////////////
                             Post Execution
    //////////////////////////////////////////////////////////////*/

    /// @notice Handles the post-execution logic of a task
    /// @param _taskId The ID of the task
    /// @param _sourceNetwork The source network of the task
    /// @param _info Post execution information

    function postExecution(uint256 _taskId, string calldata _sourceNetwork, PostExecutionInfo calldata _info) external {
        
        Task memory task = tasks[_taskId];

        // Check if the task is already completed
        require(!task.completed, "Task Already Completed");

        // Check if the payload hashes match
        require(bytes31(_info.payload_hash) == task.payload_hash_reduced, "Invalid Payload Hash");

        // Concatenate packet data elements
        bytes memory data = bytes.concat(
            bytes(_sourceNetwork),
            bytes(getChainId(chain_id_1, chain_id_2, chain_id_3, chain_id_length)),
            uint256toBytesString(_taskId),
            _info.payload_hash,
            _info.result,
            _info.callback_address,
            _info.callback_selector
        );
        
        // Perform Keccak256 + sha256 hash
        bytes32 packetHash = sha256(bytes.concat(keccak256(data)));

        //For EVM Chains that don't support the sha256 precompile
        //bytes32 packetHash = hashSHA256(keccak256(data));

        // Packet hash verification
        require(packetHash == _info.packet_hash, "Invalid Packet Hash");

        // Packet signature verification
        require(recoverSigner(packetHash, _info.packet_signature) == secret_gateway_signer_address, "Invalid Packet Signature");
        
        //Mark the task as completed
        tasks[_taskId].completed = true;

        // Continue with the function execution

        // Additional conversion if callback_selector matches
        bool callbackSuccessful;

        // case where callback_selector is the fulfillRandomWords function
        if (_info.callback_selector == 0x38ba4614) {
            (callbackSuccessful, ) = address(_info.callback_address).call(
                prepareRandomnessBytesToCallbackData(0x38ba4614, _taskId, _info.result));
            emit FulfilledRandomWords(_taskId);
        }
        else {
            (callbackSuccessful, ) = address(_info.callback_address).call(
                prepareResultBytesToCallbackData(_info.callback_selector, _taskId, _info.result));
        }
        // TODO: Add case where callback_selector is the requestValue function
        emit TaskCompleted(_taskId, callbackSuccessful);
    }

    /*//////////////////////////////////////////////////////////////
                     New Functions for Upgradeability
    //////////////////////////////////////////////////////////////*/
    function upgradeHandler() public {
    }

    /// @notice Request value from the deployed secret contract
    /// @param _callbackSelector callback function to call in Secret contract as argument
    /// @param _callbackGasLimit The gas limit for the callback
    /// @return requestId The request ID

    function requestValue(uint256 _callbackSelector, uint32 _callbackGasLimit) external payable onlyOwner returns (uint256 requestId) {
        // console.log("------ Gateway.requestValue");

        requestId = taskId;

        // TODO: optionally add guard to verify value of _callbackSelector if necessary

        uint256 estimatedPrice = estimateRequestPrice(_callbackGasLimit);

        // Refund any excess gas paid beyond the estimated price
        if (msg.value > estimatedPrice) {
            payable(tx.origin).transfer(msg.value - estimatedPrice);
        } else {
            // If not enough gas was paid, revert the transaction
            require(msg.value >= estimatedPrice, "Paid Callback Fee Too Low");
        }

        // Note: Since contracts only have an address, but not public keys, where the
        // addresses are derived from the address of the user (or other contract) that
        // created them, which are in turn are derived from the public key of a normal
        // user's keypair. So we will use the public key of the `owner` that created the
        // Gateway contract.
        //
        // TODO: We will use the base64 value for both the value of the `user_key` and
        // the `user_pubkey`, but they should be different and `user_key` suggested to
        // be base64 (e.g. `AAA=`)
        bytes payload_info = abi.encodePacked(
            '}","routing_info":"',routing_info,
            '","routing_code_hash":"',routing_code_hash,
            // FIXME: Should be msg.sender not the owner as discussed with Tom since we are forwarding to Secret network
            '","user_address":"',address(msg.sender),
            '","user_key":"',encodeAddressToBase64(address(msg.sender)),
            '","callback_address":"',address(msg.sender),
            '"'
        );

        //construct the payload that is sent into the Secret Gateway
        bytes memory payload = bytes.concat(
            '{"data":"{\\"callbackSelector\\":',
            uint256toBytesString(_callbackSelector),
            payload_info,
            encodeAddressToBase64(address(msg.sender)), //callback_address
            // callback selector should be a hex value already converted into base64 to be used
            // as callback_selector of the request_value function in the Secret contract 
            '","callback_selector":"',_callbackSelector,
            '","callback_gas_limit":',uint256toBytesString(_callbackGasLimit),
            '}' 
        );

        uint256 _newNonce = nonce + 1;
        increaseNonce(_newNonce);

        //generate the payload hash using the ethereum hash format for messages
        bytes32 payloadHash = ethSignedPayloadHash(payload);

        bytes memory emptyBytes = hex"0000";

        // ExecutionInfo struct
        ExecutionInfo memory executionInfo = ExecutionInfo({
            // TODO - make `user_key` a unique key different from `user_pubkey`
            user_key: encodeAddressToBase64(address(msg.sender)), // equals AAA= in base64
            user_pubkey: uint256toBytesString(secret_gateway_signer_pubkey), // Fill with 0 bytes
            routing_code_hash: routing_code_hash, // custom contract codehash on Secret 
            task_destination_network: task_destination_network,
            handle: "request_value",
            nonce: bytes12(toBytes(_newNonce)),
            callback_gas_limit: _callbackGasLimit,
            payload: payload,
            // TODO: add a payload signature
            // Signature of hash of encrypted input values
            payload_signature: payloadHash // empty signature, fill with 0 bytes
        });

        // persisting the task
        tasks[requestId] = Task(bytes31(payloadHash), false);

        //emit the task to be picked up by the relayer
        emit logNewTask(
            requestId,
            getChainId(chain_id_1, chain_id_2, chain_id_3, chain_id_length),
            tx.origin,
            routing_info, // custom contract address on Secret 
            payloadHash,
            executionInfo
        );

        //Output the current task_id / request_id to the user and increase the taskId to be used in the next gateway call. 
        taskId = requestId + 1;
    }

    /// @notice Retrieves public key of the deployed secret contract
    /// @param _callbackSelector callback function to call in Secret contract as argument
    /// @param _callbackGasLimit The gas limit for the callback
    /// @return requestId The request ID for the random words

    function retrievePubkey(uint256 _callbackSelector, uint32 _callbackGasLimit) external payable returns (uint256 requestId) {
        // console.log("------ Gateway.retrievePubkey");

        requestId = taskId;

        // TODO: optionally add guard to verify value of _callbackSelector if necessary

        uint256 estimatedPrice = estimateRequestPrice(_callbackGasLimit);

        // Refund any excess gas paid beyond the estimated price
        if (msg.value > estimatedPrice) {
            payable(tx.origin).transfer(msg.value - estimatedPrice);
        } else {
            // If not enough gas was paid, revert the transaction
            require(msg.value >= estimatedPrice, "Paid Callback Fee Too Low");
        }

        // TODO - modify below to be similar to request_value with custom `payload_info`

        //construct the payload that is sent into the Secret Gateway
        bytes memory payload = bytes.concat(
            '{"data":"{\\"callbackSelector\\":',
            uint256toBytesString(_callbackSelector),
            payload_info,
            encodeAddressToBase64(msg.sender), //callback_address
            '","callback_selector":"OLpGFA==","callback_gas_limit":', // 0x38ba4614 hex value already converted into base64, callback_selector of the fulfillRandomWords function
            uint256toBytesString(_callbackGasLimit),
            '}' 
        );

        uint256 _newNonce = nonce + 1;
        increaseNonce(_newNonce);

        //generate the payload hash using the ethereum hash format for messages
        bytes32 payloadHash = ethSignedPayloadHash(payload);

        bytes memory emptyBytes = hex"0000";

        // ExecutionInfo struct
        ExecutionInfo memory executionInfo = ExecutionInfo({
            user_key: emptyBytes, // equals AAA= in base64
            user_pubkey: emptyBytes, // Fill with 0 bytes
            routing_code_hash: routing_code_hash, // custom contract codehash on Secret 
            task_destination_network: task_destination_network,
            handle: "retrieve_pubkey",
            nonce: bytes12(toBytes(_newNonce)),
            callback_gas_limit: _callbackGasLimit,
            payload: payload,
            payload_signature: emptyBytes // empty signature, fill with 0 bytes
        });

        // persisting the task
        tasks[requestId] = Task(bytes31(payloadHash), false);

        //emit the task to be picked up by the relayer
        emit logNewTask(
            requestId,
            getChainId(chain_id_1, chain_id_2, chain_id_3, chain_id_length),
            tx.origin,
            routing_info, // custom contract address on Secret 
            payloadHash,
            executionInfo
        );

        //Output the current task_id / request_id to the user and increase the taskId to be used in the next gateway call. 
        taskId = requestId + 1;
    }

    function newSecretUser(string calldata secret) public pure returns (uint256) {
        // console.log("------ DummyGateway.newSecretUser", secret);
        return 6;
    }
    function createPaymentReference(string calldata secret, string calldata ref) public pure returns (uint256) {
        // console.log("------ DummyGateway.createPaymentReference", secret, ref);
        return 5;
    }
    // TODO: `string calldata secret` or `uint256 secret`
    function pay(string calldata secret, string calldata ref, uint256 amount, string calldata denomination) public pure returns (uint256) {
        // console.log("------ DummyGateway.pay", secret, ref, amount, denomination);
        return 4;
    }
    // TODO: `string calldata secret` or `uint256 secret`
    function payWithReceipt(string calldata secret, string calldata ref, uint256 amount, string calldata denomination, uint256 userPubkey) public pure returns (uint256) {
        // console.log("------ DummyGateway.payWithReceipt", secret, ref, amount, denomination, userPubkey);
        return 3;
    }
    // TODO: `string calldata secret` or `uint256 secret`
    function withdrawTo(string calldata secret, uint256 amount, string calldata denomination, address withdrawalAddress) public pure returns (uint256) {
        // console.log("------ DummyGateway.withdraw", secret, amount, denomination, withdrawalAddress);
        return 2;
    }

    fallback() external payable {
        console.log("----- DummyGateway.sol fallback() msg.value:", msg.value);
    }

    receive() external payable {
        console.log("----- DummyGateway.sol receive() msg.value:", msg.value);
    }
}
