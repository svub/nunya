import { ethers } from "ethers";

import gatewayAbi from "../../../hardhat/artifacts/contracts/Gateway.sol/Gateway.json" assert { type: "json" };
import nunyaAbi from "../../../hardhat/artifacts/contracts/NunyaBusiness.sol/NunyaBusiness.json" assert { type: "json" };

import { generateKeys } from "../functions/secretpath/generateKeys.js";
import { getPublicClientAddress } from "../functions/secretpath/getPublicClientAddress.js";
import { constructPayload } from "../functions/secretpath/constructPayload.js";
import { encryptPayload } from "../functions/secretpath/encryptPayload.js";
import { hexlify } from "ethers/lib/utils.js";
import * as dotenv from "dotenv";
import path from "path";
const envPath = path.join(__dirname, '../../.env').trim();
dotenv.config({ path: envPath });

const { chainId: secretChainId, secretNunya: { nunyaContractAddress, nunyaContractCodeHash } } =
  config.secret.defaultNetwork == "testnet"
  ? config.secret.testnet
  : config.secret.localhost;

let vars;
if (config.evm.network == "sepolia") {
  vars = config.evm.sepolia;
} else if (config.evm.network == "localhost") {
  vars = config.evm.localhost;
} else {
  throw new Error(`Unsupported network.`)
}
const { chainId: evmChainId, endpoint, nunyaBusinessContractAddress, gatewayContractAddress, privateKey } = vars;

const SECRET_ADDRESS = nunyaContractAddress;
const CONTRACT_CODE_HASH = nunyaContractCodeHash;

export async function handleSubmit(e, key, value, viewing_key) {
  e.preventDefault();

  const routing_contract = SECRET_ADDRESS;
  const routing_code_hash = CONTRACT_CODE_HASH;
  const ifaceGateway = new ethers.utils.Interface(gatewayAbi.abi);
  const ifaceNunya = new ethers.utils.Interface(nunyaAbi.abi);
  const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
  const { chainId: browserChainId } = await provider.getNetwork();
  // How does the browser chainID differ from those obtained from config.js
  console.log("browser chainID: ", browserChainId);

  const [myAddress] = await provider.send("eth_requestAccounts", []);
  console.log("Public address:", myAddress);

  const balance = await provider.getBalance(myAddress);
  console.log("balance:", +ethers.utils.formatEther(balance));

  const lastNonce = await provider.getTransactionCount(myAddress);
  console.log("lastNonce:", lastNonce);

  const blockNumber = await provider.getBlockNumber();
  console.log("Current block number: ", blockNumber);

  const { userPrivateKeyBytes, userPublicKeyBytes, sharedKey } =
    await generateKeys();

  const callbackSelector = ifaceNunya.getSighash(
    // fulfilledValueCallback - 0x0f7af612
    ifaceNunya.getFunction("fulfilledValueCallback")
  );

  console.log("callbackSelector: ", callbackSelector);

  const callbackGasLimit = 30000000; // 30000000 is the block gas limit
  // The function name of the function that is called on the private contract
  const handle = "request_value";

  // Data are the calldata/parameters that are passed into the contract
  const data = JSON.stringify({ myArg: "123" });

  const chainId = (await provider.getNetwork()).chainId.toString();

  // EVM Gateway contract address
  // const publicClientAddress = await getPublicClientAddress(evmChainId);
  const publicClientAddress = gatewayContractAddress;

  const callbackAddress = publicClientAddress.toLowerCase();
  console.log("callback address: ", callbackAddress);

  // Payload construction
  const payload = constructPayload(
    data,
    routing_contract,
    routing_code_hash,
    myAddress,
    userPublicKeyBytes,
    callbackAddress,
    callbackSelector,
    callbackGasLimit
  );

  const taskDestinationNetwork = secretChainId;
  const {
    ciphertext,
    payloadHash,
    payloadSignature,
    _info,
  } = await encryptPayload(
    payload,
    sharedKey,
    provider,
    myAddress,
    userPublicKeyBytes,
    routing_code_hash,
    handle,
    callbackGasLimit,
    ifaceGateway,
    callbackSelector,
    taskDestinationNetwork,
    lastNonce
  );

  const functionData = ifaceGateway.encodeFunctionData("send", [
    payloadHash,
    myAddress,
    routing_contract,
    _info,
  ]);

  const feeData = await provider.getFeeData();
  const maxFeePerGas = feeData.maxFeePerGas;
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
  const gasFee =
    maxFeePerGas && maxPriorityFeePerGas
      ? maxFeePerGas.add(maxPriorityFeePerGas)
      : await provider.getGasPrice();

  let amountOfGas; 
  let my_gas = 1500000000;
  
  // Note: Logic from example has been removed that uses different
  // gas depending on the network.
  amountOfGas = gasFee.mul(callbackGasLimit).mul(3).div(2);
  
  const tx_params = {
    gas: hexlify(my_gas),
    to: publicClientAddress,
    from: myAddress,
    value: hexlify(amountOfGas),
    data: functionData,
  };
  
  console.log("tx_params: ", tx_params.value);
  
  const txHash = await provider.send("eth_sendTransaction", [tx_params]);
  console.log(`Transaction Hash: ${txHash}`);
}
