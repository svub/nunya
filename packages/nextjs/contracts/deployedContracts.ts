/**
 * This file is autogenerated by Scaffold-ETH.
 * You should not edit it manually or your changes might be overwritten.
 */
import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

const deployedContracts = {
  31337: {
    DummyGatewayContract: {
      address: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
      abi: [
        {
          stateMutability: "payable",
          type: "fallback",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "secret",
              type: "uint256",
            },
            {
              internalType: "string",
              name: "ref",
              type: "string",
            },
          ],
          name: "createPaymentReference",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "secret",
              type: "uint256",
            },
          ],
          name: "newSecretUser",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "string",
              name: "ref",
              type: "string",
            },
            {
              internalType: "uint256",
              name: "amount",
              type: "uint256",
            },
          ],
          name: "pay",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "string",
              name: "ref",
              type: "string",
            },
            {
              internalType: "uint256",
              name: "amount",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "userPubkey",
              type: "uint256",
            },
          ],
          name: "payWithReceipt",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [],
          name: "retrievePubkey",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "string",
              name: "secret",
              type: "string",
            },
            {
              internalType: "uint256",
              name: "amount",
              type: "uint256",
            },
            {
              internalType: "address",
              name: "withdrawalAddress",
              type: "address",
            },
          ],
          name: "withdraw",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          stateMutability: "payable",
          type: "receive",
        },
      ],
      inheritedFunctions: {},
    },
    NunyaBusiness: {
      address: "0x59b670e9fA9D0A427751Af201D676719a970857b",
      abi: [
        {
          inputs: [
            {
              internalType: "address payable",
              name: "_gateway",
              type: "address",
            },
          ],
          stateMutability: "payable",
          type: "constructor",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "uint256",
              name: "requestId",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint16",
              name: "_code",
              type: "uint16",
            },
          ],
          name: "AccountCreated",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "uint256",
              name: "requestId",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint16",
              name: "code",
              type: "uint16",
            },
          ],
          name: "PaymentProcessed",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "uint256",
              name: "requestId",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint16",
              name: "code",
              type: "uint16",
            },
            {
              indexed: false,
              internalType: "string",
              name: "ref",
              type: "string",
            },
          ],
          name: "PaymentReferenceCreated",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "uint256",
              name: "requestId",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint16",
              name: "code",
              type: "uint16",
            },
            {
              components: [
                {
                  internalType: "uint256",
                  name: "paymentRef",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "amount",
                  type: "uint256",
                },
                {
                  internalType: "bytes32",
                  name: "sig",
                  type: "bytes32",
                },
              ],
              indexed: false,
              internalType: "struct NunyaBusiness.Receipt",
              name: "receipt",
              type: "tuple",
            },
          ],
          name: "PaymentWithReceiptProcessed",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: false,
              internalType: "uint256",
              name: "requestId",
              type: "uint256",
            },
            {
              indexed: false,
              internalType: "uint16",
              name: "code",
              type: "uint16",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "amount",
              type: "uint256",
            },
          ],
          name: "WithdrawalProcessed",
          type: "event",
        },
        {
          stateMutability: "payable",
          type: "fallback",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "_secret",
              type: "uint256",
            },
            {
              internalType: "string",
              name: "_ref",
              type: "string",
            },
          ],
          name: "createPaymentReference",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "payable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "_requestId",
              type: "uint256",
            },
            {
              internalType: "uint16",
              name: "_code",
              type: "uint16",
            },
            {
              internalType: "string",
              name: "_reference",
              type: "string",
            },
          ],
          name: "createPaymentReferenceCallback",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "_secret",
              type: "uint256",
            },
          ],
          name: "newSecretUser",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "payable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "_requestId",
              type: "uint256",
            },
            {
              internalType: "uint16",
              name: "_code",
              type: "uint16",
            },
          ],
          name: "newSecretUserCallback",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "string",
              name: "_ref",
              type: "string",
            },
            {
              internalType: "uint256",
              name: "_value",
              type: "uint256",
            },
          ],
          name: "pay",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "payable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "_requestId",
              type: "uint256",
            },
            {
              internalType: "uint16",
              name: "_code",
              type: "uint16",
            },
          ],
          name: "payCallback",
          outputs: [],
          stateMutability: "payable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "string",
              name: "_ref",
              type: "string",
            },
            {
              internalType: "uint256",
              name: "_value",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "_userPubkey",
              type: "uint256",
            },
          ],
          name: "payWithReceipt",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "payable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "_requestId",
              type: "uint256",
            },
            {
              internalType: "uint16",
              name: "_code",
              type: "uint16",
            },
            {
              components: [
                {
                  internalType: "uint256",
                  name: "paymentRef",
                  type: "uint256",
                },
                {
                  internalType: "uint256",
                  name: "amount",
                  type: "uint256",
                },
                {
                  internalType: "bytes32",
                  name: "sig",
                  type: "bytes32",
                },
              ],
              internalType: "struct NunyaBusiness.Receipt",
              name: "_receipt",
              type: "tuple",
            },
          ],
          name: "payWithReceiptCallback",
          outputs: [],
          stateMutability: "payable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "_requestId",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "_key",
              type: "uint256",
            },
          ],
          name: "setSecretContractPubkeyCallback",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "string",
              name: "_secret",
              type: "string",
            },
            {
              internalType: "uint256",
              name: "_amount",
              type: "uint256",
            },
            {
              internalType: "address",
              name: "_withdrawalAddress",
              type: "address",
            },
          ],
          name: "withdrawTo",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "payable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "_requestId",
              type: "uint256",
            },
            {
              internalType: "uint16",
              name: "_code",
              type: "uint16",
            },
            {
              internalType: "uint256",
              name: "_amount",
              type: "uint256",
            },
            {
              internalType: "address payable",
              name: "_withdrawalAddress",
              type: "address",
            },
          ],
          name: "withdrawToCallback",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          stateMutability: "payable",
          type: "receive",
        },
      ],
      inheritedFunctions: {},
    },
  },
} as const;

export default deployedContracts satisfies GenericContractsDeclaration;
