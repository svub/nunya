// https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/supported-networks/evm/gateway-contract-abi
const abi = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      }
    ],
    "name": "FulfilledRandomWords",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "taskId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "callbackSuccessful",
        "type": "bool"
      }
    ],
    "name": "TaskCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "task_id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "source_network",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "user_address",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "routing_info",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "payload_hash",
        "type": "bytes32"
      },
      {
        "components": [
          {
            "internalType": "bytes",
            "name": "user_key",
            "type": "bytes"
          },
          {
            "internalType": "bytes",
            "name": "user_pubkey",
            "type": "bytes"
          },
          {
            "internalType": "string",
            "name": "routing_code_hash",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "task_destination_network",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "handle",
            "type": "string"
          },
          {
            "internalType": "bytes12",
            "name": "nonce",
            "type": "bytes12"
          },
          {
            "internalType": "uint32",
            "name": "callback_gas_limit",
            "type": "uint32"
          },
          {
            "internalType": "bytes",
            "name": "payload",
            "type": "bytes"
          },
          {
            "internalType": "bytes",
            "name": "payload_signature",
            "type": "bytes"
          }
        ],
        "indexed": false,
        "internalType": "struct Gateway.ExecutionInfo",
        "name": "info",
        "type": "tuple"
      }
    ],
    "name": "logNewTask",
    "type": "event"
  },
  {
    "stateMutability": "payable",
    "type": "fallback"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "data",
        "type": "bytes32"
      }
    ],
    "name": "bytes32ToBytes",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "x",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "y",
        "type": "string"
      }
    ],
    "name": "compStr",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "secret",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "ref",
        "type": "string"
      }
    ],
    "name": "createPaymentReference",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "data",
        "type": "address"
      }
    ],
    "name": "encodeAddressToBase64",
    "outputs": [
      {
        "internalType": "bytes28",
        "name": "result",
        "type": "bytes28"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint32",
        "name": "_callbackGasLimit",
        "type": "uint32"
      }
    ],
    "name": "estimateRequestPrice",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "baseFee",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "payload",
        "type": "bytes"
      }
    ],
    "name": "ethSignedPayloadHash",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "payloadHash",
        "type": "bytes32"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "chain_id_1_tmp",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "chain_id_2_tmp",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "chain_id_3_tmp",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "chain_id_length_tmp",
        "type": "uint256"
      }
    ],
    "name": "getChainId",
    "outputs": [
      {
        "internalType": "string",
        "name": "result",
        "type": "string"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_newNonce",
        "type": "uint256"
      }
    ],
    "name": "increaseNonce",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_newTaskId",
        "type": "uint256"
      }
    ],
    "name": "increaseTaskId",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "x",
        "type": "uint256"
      }
    ],
    "name": "itoa31",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "y",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "secret",
        "type": "string"
      }
    ],
    "name": "newSecretUser",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nonce",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "secret",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "ref",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "denomination",
        "type": "string"
      }
    ],
    "name": "pay",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "secret",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "ref",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "denomination",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "userPubkey",
        "type": "uint256"
      }
    ],
    "name": "payWithReceipt",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "payoutBalance",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_taskId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_sourceNetwork",
        "type": "string"
      },
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "payload_hash",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "packet_hash",
            "type": "bytes32"
          },
          {
            "internalType": "bytes20",
            "name": "callback_address",
            "type": "bytes20"
          },
          {
            "internalType": "bytes4",
            "name": "callback_selector",
            "type": "bytes4"
          },
          {
            "internalType": "bytes4",
            "name": "callback_gas_limit",
            "type": "bytes4"
          },
          {
            "internalType": "bytes",
            "name": "packet_signature",
            "type": "bytes"
          },
          {
            "internalType": "bytes",
            "name": "result",
            "type": "bytes"
          }
        ],
        "internalType": "struct Gateway.PostExecutionInfo",
        "name": "_info",
        "type": "tuple"
      }
    ],
    "name": "postExecution",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes4",
        "name": "callback_selector",
        "type": "bytes4"
      },
      {
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "prepareRandomnessBytesToCallbackData",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "result",
        "type": "bytes"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes4",
        "name": "callback_selector",
        "type": "bytes4"
      },
      {
        "internalType": "uint256",
        "name": "_taskId",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "prepareResultBytesToCallbackData",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "result",
        "type": "bytes"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_signedMessageHash",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "_signature",
        "type": "bytes"
      }
    ],
    "name": "recoverSigner",
    "outputs": [
      {
        "internalType": "address",
        "name": "signerAddress",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_callbackSelector",
        "type": "uint256"
      },
      {
        "internalType": "uint32",
        "name": "_callbackGasLimit",
        "type": "uint32"
      }
    ],
    "name": "requestValue",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_callbackSelector",
        "type": "uint256"
      },
      {
        "internalType": "uint32",
        "name": "_callbackGasLimit",
        "type": "uint32"
      }
    ],
    "name": "retrievePubkey",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "routing_code_hash",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "routing_info",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "secret_gateway_signer_address",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_payloadHash",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "_nunyaBusinessContractAddress",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "_routingInfo",
        "type": "string"
      },
      {
        "components": [
          {
            "internalType": "bytes",
            "name": "user_key",
            "type": "bytes"
          },
          {
            "internalType": "bytes",
            "name": "user_pubkey",
            "type": "bytes"
          },
          {
            "internalType": "string",
            "name": "routing_code_hash",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "task_destination_network",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "handle",
            "type": "string"
          },
          {
            "internalType": "bytes12",
            "name": "nonce",
            "type": "bytes12"
          },
          {
            "internalType": "uint32",
            "name": "callback_gas_limit",
            "type": "uint32"
          },
          {
            "internalType": "bytes",
            "name": "payload",
            "type": "bytes"
          },
          {
            "internalType": "bytes",
            "name": "payload_signature",
            "type": "bytes"
          }
        ],
        "internalType": "struct Gateway.ExecutionInfo",
        "name": "_info",
        "type": "tuple"
      }
    ],
    "name": "send",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "_taskId",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_routingInfo",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_routingCodeHash",
        "type": "string"
      }
    ],
    "name": "setSecretContractInfo",
    "outputs": [
      {
        "internalType": "bool",
        "name": "isSet",
        "type": "bool"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "taskId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "task_destination_network",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "tasks",
    "outputs": [
      {
        "internalType": "bytes31",
        "name": "payload_hash_reduced",
        "type": "bytes31"
      },
      {
        "internalType": "bool",
        "name": "completed",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "a",
        "type": "uint256"
      }
    ],
    "name": "toBytes",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "x",
        "type": "uint256"
      }
    ],
    "name": "uint256toBytesString",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "s",
        "type": "bytes"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "upgradeHandler",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "secret",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "denomination",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "withdrawalAddress",
        "type": "address"
      }
    ],
    "name": "withdrawTo",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
];

export default abi;
