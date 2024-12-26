// SPDX-License-Identifier: Apache-2.0
// Version: 0.2.5
pragma solidity ^0.8.26;

// TODO remove in production
import "hardhat/console.sol";

// We need JSON parsing to introspect on the `pay` function
import "./JsmnSolLib.sol";

import "./Utils.sol";

import "./Base64.sol";

import "./Ownable.sol";

contract Gateway is Ownable, Utils, Base64 {
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

    // SecretPath mainnet (secret-4) contracts
    // https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/supported-networks/secret-gateway/secretpath-mainnet-secret-4-contracts
    //string constant public task_destination_network = "secret-4";
    // This is the Derived Ethereum Address from the Public Key of the deployed Gateway contract on the Secret Network Mainnet
    //uint256 immutable public secret_gateway_signer_pubkey = 0x04a0d632acd0d2f5da02fc385ea30a8deab4d5639d1a821a3a552625ad0f1759d0d2e80ca3adb236d90caf1b12e0ddf3a351c5729b5e00505472dca6fed5c31e2a;
    //address constant public secret_gateway_signer_address = 0x88e43F4016f8282Ea6235aC069D02BA1cE5417aB;

    // SecretPath testnet (pulsar-3) contracts
    // https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/supported-networks/secret-gateway/secretpath-testnet-pulsar-3-contracts
    //string constant public task_destination_network = "pulsar-3";
    // This is the Derived Ethereum Address from the Public Key of the deployed Gateway contract on the Secret Network Testnet
    // uint256 immutable public secret_gateway_signer_pubkey = 0x046d0aac3ef10e69055e934ca899f508ba516832dc74aa4ed4d741052ed5a568774d99d3bfed641a7935ae73aac8e34938db747c2f0e8b2aa95c25d069a575cc8b;
    //address immutable public secret_gateway_signer_address = 0x2821E794B01ABF0cE2DA0ca171A1fAc68FaDCa06;

    // SecretPath localhost () contracts
    // Note: Match the value shown in ../../../packages/secret-contracts-scripts/src/config/deploy.ts
    string constant public task_destination_network = "secretdev-1";
    // TODO: Create a function to set these values? Or is it generated randomly each time the Secret Gateway contract is deployed?
    // This is the Derived Ethereum Address from the Public Key of the deployed Gateway contract on the Secret Network Testnet
    // uint256 immutable public secret_gateway_signer_pubkey = 0x041d515b717dfd0389615e2368e7ca2aee86f4b3f325a10ef4f3e6edf87d099b8b88d7f01a8b38dbc722a6d899033b5bb059bc3431543e4821ad0e8034a923ab18;
    // address immutable public secret_gateway_signer_address = ???;

    // TODO: Add deployed custom Secret contract address to be same as `SECRET_ADDRESS` and codehash `CONTRACT_CODE_HASH` used in scripts
    string public routing_info = "";
    string public routing_code_hash = "";

    // Note: Since contracts only have an address, but not public keys, where the addresses are
    // derived from the address of the user (or other contract) that created them, which are in
    // turn are derived from the public key of a normal user's keypair. So we will use the public
    // key of the `owner` that created the Gateway contract.
    bytes public owner_public_key;

    bytes28 public nunyaAddressBase64 = encodeAddressToBase64(address(owner));

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

    // Note: Why isn't a random nonce used to generate this, similar to how that
    // is done in encryptPayload.ts to generate the payloadHash there?
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

    // Reference: https://docs.ethers.org/v6/cookbook/signing/
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

    // Note - It may be only possible to call this function `encodeAddressToBase64` a few times
    // in some functions, otherwise it generates error `Error: Transaction reverted without a reason`.
    function encodeAddressToBase64(address data) public pure returns (bytes28 result) {
        console.log("------ Gateway.encodeAddressToBase64");
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
        console.log("------ Gateway.prepareResultBytesToCallbackData - _taskId: ", _taskId);
        console.log("------ Gateway.prepareResultBytesToCallbackData - data.length: ", data.length);
        assembly {
            result := mload(0x40) // Set `result` to point to the free memory pointer
            mstore(result, add(100, data.length)) // Update the free memory pointer
            mstore(add(result, 32), callback_selector) // Load `callback_selector` and store at `result` + 32
            mstore(add(result, 36), _taskId) // Load `_taskId` and store at `result` + 36
            mstore(add(result, 68), 0x40) // Load `0x40` (free memory pointer) and store at `result` + 68
            mstore(add(result, 100), data.length) // Load `data.length` and store at `result` + 100
            // Directly copy data from the transaction's call data (read only)
            // that was the input data sent with the call into memory
            calldatacopy(add(result, 132), data.offset, data.length)
            // Update the free memory pointer with that
            // loaded from `data.length` and stored at `result` + 132 bytes
            mstore(0x40, add(add(result, 132), data.length))
        }
    }

    /// @notice Converts a uint256 into bytes
    // https://ethereum.stackexchange.com/a/78487/9680
    // TODO: Is this a duplicate of `uint256toBytesString` function?
    // TODO: Consider renaming to more descriptive function name like `uint256ToBytes32` to avoid conflicts
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

    /// @notice Emitted when the requestValue callback was fulfilled
    event FulfilledRequestValue(uint256 indexed requestId);

    // Note: In this custom Gateway.sol, the NunyaBusiness contract address is provided as an argument in its
    // constructor and set to be the `owner` in storage. Furthermore, we apply `onlyOwner` modifier to this
    // function that restricts calls to only be allowed to come from a `msg.sender` that is the same as the `owner`.
    // If it is `msg.sender` then it would allow a call to be made from anyone, even a "fake" NunyaBusiness contract
    // if `onlyOwner` was removed.
    // If the Gateway contract by the Secret team was used instead then we would need a way to upgrade that contract
    // to allow us to set an `owner`-like value that could be used to restrict calls to functions like this.

    // Constructor
    constructor(address nunyaContractAddress, bytes memory deployerPublicKeyBytes) {
        // Initializer
        // Set owner to be the deployed NunyaBusiness.sol contract
        owner = nunyaContractAddress;
        owner_public_key = deployerPublicKeyBytes;

        taskId = 1;
        nonce = 0;

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

    function increaseTaskId(uint256 _newTaskId) public onlyOwner {
        require (_newTaskId > taskId, "New task id must be higher than the old task_id");
        taskId = _newTaskId;
    }

    /// @notice Increase the nonce if needed
    /// @param _newNonce the new nonce

    function increaseNonce(uint256 _newNonce) public onlyOwner {
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
        address _userAddress,
        string calldata _routingInfo,
        ExecutionInfo calldata _info) 
        external payable returns (uint256 _taskId) {
        // FIXME: Temporary: Allow anyone to call via `send` otherwise we can't test submitRequestValue.ts
        // external payable onlyOwner returns (uint256 _taskId) {
    
        console.log("------ Gateway.send");

        // TODO: Add constraints if permanent destination like the following so we can integrate into the public gateway
        // if keccak256(_info.handle) == keccak256("request_value") {
            // require(address(msg.sender) == address(owner), "sender must be the owner of the deployed Gateway contract");

            // Note: previously _userAddress was msg.sender, but customized for Nunya to be
            // the deployed NunyaBusiness.sol contract address to be picked up by the relayer that listens to emitted logs
            // address _userAddress = owner;
        // }

        _taskId = taskId;

        uint256 estimatedPrice = estimateRequestPrice(_info.callback_gas_limit);
        console.log("------ Gateway.send - _info.callback_gas_limit: ", _info.callback_gas_limit);
        console.log("------ Gateway.send - estimatedPrice: ", estimatedPrice);
        console.log("------ Gateway.send - msg.value: ", msg.value);

        // Refund any excess gas paid beyond the estimated price
        if (msg.value > estimatedPrice) {
            payable(tx.origin).transfer(msg.value - estimatedPrice);
        } else {
            // If not enough gas was paid, revert the transaction
            require(msg.value >= estimatedPrice, "Paid Callback Fee Too Low");
        }

        // Payload hash verification
        require(ethSignedPayloadHash(_info.payload) == _payloadHash, "Invalid Payload Hash");

        // TODO: Alternative: `tasks[taskId] = Task(sliceLastByte(payloadHash), false);`
        // Reference: https://github.com/SecretFoundation/Secretpath-tutorials/blob/master/encrypted-payloads/evm-contract/contracts/Gateway.sol#L381C9-L381C65
        //
        // persisting the task
        tasks[_taskId] = Task(bytes31(_payloadHash), false);

        //emit the task to be picked up by the relayer
        emit logNewTask(
            _taskId,
            getChainId(chain_id_1, chain_id_2, chain_id_3, chain_id_length),
            _userAddress,
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
        console.log("------ Gateway.postExecution");
        Task memory task = tasks[_taskId];

        // Check if the task is already completed
        require(!task.completed, "Task Already Completed");

        // TODO: Alternative approach:
        // Reference: https://github.com/SecretFoundation/Secretpath-tutorials/blob/master/encrypted-payloads/evm-contract/contracts/Gateway.sol#L418
        //
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

        console.log("------ Gateway.postExecution - recoverSigner");
        // FIXME: Temporarily disable since do not know how to obtain `secret_gateway_signer_address` when using Secret Localhost
        // // Packet signature verification
        // require(recoverSigner(packetHash, _info.packet_signature) == secret_gateway_signer_address, "Invalid Packet Signature");
        
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
        // fulfilledValueCallback == 0x0f7af612
        else if (_info.callback_selector == 0x0f7af612) {
            (callbackSuccessful, ) = address(_info.callback_address).call(
                prepareResultBytesToCallbackData(_info.callback_selector, _taskId, _info.result));

            emit FulfilledRequestValue(_taskId);
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

    /// @notice Set custom deployed custom Secret contract address to be the same as `SECRET_ADDRESS` and codehash `CONTRACT_CODE_HASH`
    /// @notice Allows deploying the custom Secret contract address after deploying the Gateway and Nunya contracts
    /// @param _routingInfo Deployed custom Secret contract address
    /// @param _routingCodeHash Deployed custom Secret contract code hash
    /// @return isSet Boolean success or failure
    function setSecretContractInfo(string memory _routingInfo, string memory _routingCodeHash) external payable onlyOwner returns (bool isSet) {
        // console.log("------ Gateway.setSecretContractInfo");

        require(compStr(_routingInfo, "") == false, "Invalid Secret contract address");
        require(compStr(_routingCodeHash, "") == false, "Invalid Secret contract code hash");

        routing_info = _routingInfo;
        routing_code_hash = _routingCodeHash;

        return true;
    }

    function newSecretUser(string calldata secret) public pure returns (uint256) {
        // console.log("------ Gateway.newSecretUser", secret);
        return 6;
    }
    function createPaymentReference(string calldata secret, string calldata ref) public pure returns (uint256) {
        // console.log("------ Gateway.createPaymentReference", secret, ref);
        return 5;
    }
    // TODO: `string calldata secret` or `uint256 secret`
    function pay(string calldata secret, string calldata ref, uint256 amount, string calldata denomination) public pure returns (uint256) {
        // console.log("------ Gateway.pay", secret, ref, amount, denomination);
        return 4;
    }
    // TODO: `string calldata secret` or `uint256 secret`
    function payWithReceipt(string calldata secret, string calldata ref, uint256 amount, string calldata denomination, uint256 userPubkey) public pure returns (uint256) {
        // console.log("------ Gateway.payWithReceipt", secret, ref, amount, denomination, userPubkey);
        return 3;
    }
    // TODO: `string calldata secret` or `uint256 secret`
    function withdrawTo(string calldata secret, uint256 amount, string calldata denomination, address withdrawalAddress) public pure returns (uint256) {
        // console.log("------ Gateway.withdraw", secret, amount, denomination, withdrawalAddress);
        return 2;
    }

    fallback() external payable {
        console.log("----- Gateway.sol fallback() msg.value:", msg.value);
    }

    receive() external payable {
        console.log("----- Gateway.sol receive() msg.value:", msg.value);
    }
}
