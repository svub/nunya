const abi = [
  {
    "inputs": [],
    "stateMutability": "payable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "code",
        "type": "uint16"
      }
    ],
    "name": "AccountCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "pubkey",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "code",
        "type": "uint16"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "_nunya_business_contract_address",
        "type": "address"
      }
    ],
    "name": "FulfilledPubkey",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "code",
        "type": "uint16"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "_nunya_business_contract_address",
        "type": "address"
      }
    ],
    "name": "FulfilledValue",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "code",
        "type": "uint16"
      }
    ],
    "name": "PaymentProcessed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "code",
        "type": "uint16"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "ref",
        "type": "string"
      }
    ],
    "name": "PaymentReferenceCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "code",
        "type": "uint16"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "paymentRef",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "denomination",
            "type": "uint256"
          },
          {
            "internalType": "bytes32",
            "name": "sig",
            "type": "bytes32"
          }
        ],
        "indexed": false,
        "internalType": "struct NunyaBusiness.Receipt",
        "name": "receipt",
        "type": "tuple"
      }
    ],
    "name": "PaymentWithReceiptProcessed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      }
    ],
    "name": "RequestedValue",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      }
    ],
    "name": "RetrievePubkey",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "code",
        "type": "uint16"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "message",
        "type": "string"
      }
    ],
    "name": "SecretNetworkError",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isSet",
        "type": "bool"
      }
    ],
    "name": "SetSecretContractInfo",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "code",
        "type": "uint16"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "WithdrawalProcessed",
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
        "name": "_secret",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_ref",
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
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_requestId",
        "type": "uint256"
      },
      {
        "internalType": "uint16",
        "name": "_code",
        "type": "uint16"
      },
      {
        "internalType": "string",
        "name": "_reference",
        "type": "string"
      }
    ],
    "name": "createPaymentReferenceCallback",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_requestId",
        "type": "uint256"
      },
      {
        "internalType": "uint16",
        "name": "_code",
        "type": "uint16"
      },
      {
        "internalType": "string",
        "name": "_message",
        "type": "string"
      }
    ],
    "name": "emitSecretNetworkError",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_requestId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_key",
        "type": "uint256"
      },
      {
        "internalType": "uint16",
        "name": "_code",
        "type": "uint16"
      },
      {
        "internalType": "address",
        "name": "_nunya_business_contract_address",
        "type": "address"
      }
    ],
    "name": "fulfilledSecretContractPubkeyCallback",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_requestId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_value",
        "type": "uint256"
      },
      {
        "internalType": "uint16",
        "name": "_code",
        "type": "uint16"
      },
      {
        "internalType": "address",
        "name": "_nunya_business_contract_address",
        "type": "address"
      }
    ],
    "name": "fulfilledValueCallback",
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
        "name": "_secret",
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
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_requestId",
        "type": "uint256"
      },
      {
        "internalType": "uint16",
        "name": "_code",
        "type": "uint16"
      }
    ],
    "name": "newSecretUserCallback",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_valueJson",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_ref",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_value",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_denomination",
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
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_requestId",
        "type": "uint256"
      },
      {
        "internalType": "uint16",
        "name": "_code",
        "type": "uint16"
      }
    ],
    "name": "payCallback",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_secret",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_ref",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_value",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_denomination",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_userPubkey",
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
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_requestId",
        "type": "uint256"
      },
      {
        "internalType": "uint16",
        "name": "_code",
        "type": "uint16"
      },
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "paymentRef",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "denomination",
            "type": "uint256"
          },
          {
            "internalType": "bytes32",
            "name": "sig",
            "type": "bytes32"
          }
        ],
        "internalType": "struct NunyaBusiness.Receipt",
        "name": "_receipt",
        "type": "tuple"
      }
    ],
    "name": "payWithReceiptCallback",
    "outputs": [],
    "stateMutability": "payable",
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
        "internalType": "address payable",
        "name": "_CustomGateway",
        "type": "address"
      }
    ],
    "name": "setGatewayAddress",
    "outputs": [],
    "stateMutability": "payable",
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
    "inputs": [
      {
        "internalType": "uint32",
        "name": "_callbackSelector",
        "type": "uint32"
      },
      {
        "internalType": "uint32",
        "name": "_callbackGasLimit",
        "type": "uint32"
      }
    ],
    "name": "unsafeRequestSecretContractPubkey",
    "outputs": [],
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
    "name": "unsafeRequestValue",
    "outputs": [],
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
    "name": "unsafeSetSecretContractInfo",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_secret",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_denomination",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "_withdrawalAddress",
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
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_requestId",
        "type": "uint256"
      },
      {
        "internalType": "uint16",
        "name": "_code",
        "type": "uint16"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_denomination",
        "type": "string"
      },
      {
        "internalType": "address payable",
        "name": "_withdrawalAddress",
        "type": "address"
      }
    ],
    "name": "withdrawToCallback",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
];

export default abi;
