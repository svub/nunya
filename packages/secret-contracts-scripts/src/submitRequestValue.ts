// reference: https://github.com/writersblockchain/secretpath-ballz
// reference: https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/usecases/vrf/using-encrypted-payloads-for-vrf#define-the-calldata-for-the-secret-contract-and-callback-information
import * as dotenv from "dotenv";
dotenv.config();
import { ethers, Wallet } from "ethers";
import { NonceManager } from "@ethersproject/experimental";
import config from './config/deploy.js';
import { ecdh, chacha20_poly1305_seal } from "@solar-republic/neutrino";
import { bytes, bytes_to_base64, json_to_bytes, sha256, concat, text_to_bytes, base64_to_bytes } from "@blake.regalia/belt";
import gatewayAbi from "../../hardhat/artifacts/contracts/Gateway.sol/Gateway.json" assert { type: "json" };
import nunyaAbi from "../../hardhat/artifacts/contracts/NunyaBusiness.sol/NunyaBusiness.json" assert { type: "json" };
import { generateKeys } from "./functions/secretpath/generateKeys.js";
// import getPublicClientAddress from "./functions/secretpath/getPublicClientAddress.js";
import { constructPayload } from "./functions/secretpath/constructPayload.js";
import { encryptPayload } from "./functions/secretpath/encryptPayload.js";
import { arrayify, hexlify, SigningKey, keccak256, recoverPublicKey, computeAddress } from "ethers/lib/utils.js";
import { assert } from "console";

const { chainId: secretChainId, secretNunya: { nunyaContractCodeId, nunyaContractAddress, nunyaContractCodeHash } } =
  config.secret.network == "testnet"
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

async function unsafeRequestValue() {
  const ifaceGateway = new ethers.utils.Interface(gatewayAbi.abi);
  const ifaceNunya = new ethers.utils.Interface(nunyaAbi.abi);

  const routing_contract = SECRET_ADDRESS;
  const routing_code_hash = CONTRACT_CODE_HASH;
  
  if (!privateKey) {
    console.log("🚫️ You don't have a deployer account. Run `yarn hardhat:generate` first");
    return;
  }

  let provider;
  provider = new ethers.providers.JsonRpcProvider(endpoint);
  console.log(provider);
  await provider.detectNetwork();
  const signer = new Wallet(privateKey, provider);
  const managedSigner = new NonceManager(signer);
  const myAddress = signer.address;
  console.log("Public address:", myAddress, "\n");
  managedSigner.connect(provider);
  console.log("signer is: ", provider.getSigner());
  const balance = await provider.getBalance(myAddress);
  console.log("balance:", +ethers.utils.formatEther(balance));
  const lastNonce = await provider.getTransactionCount(myAddress);
  console.log("lastNonce:", lastNonce);

  const blockNumber = await provider.getBlockNumber();
  console.log("Current block number: ", blockNumber);

  const response: any = await generateKeys();
  console.log('response: ', response);
  // // FIXME: Hard-coded values used for Localsecret Gateway public key in ./packages/secret-contracts-scripts/src/config/deploy.ts
  const { userPublicKey, userPrivateKeyBytes, userPublicKeyBytes, sharedKey }: any = response;

  const nunyaContract = new ethers.Contract(nunyaBusinessContractAddress, ifaceNunya, managedSigner);
  const CustomGateway = await nunyaContract.CustomGateway();
  console.log("CustomGateway: ", CustomGateway);

  const gatewayContract = new ethers.Contract(gatewayContractAddress, ifaceGateway, managedSigner);
  const taskDestinationNetwork = await gatewayContract.task_destination_network();
  console.log("taskDestinationNetwork: ", taskDestinationNetwork);

  const callbackSelector = ifaceNunya.getSighash(
    // requestValue - 0xb6c2b131
    // fulfillRandomWords - 0x38ba4614 hex, OLpGFA== base64
    // fulfilledValueCallback - 0x0f7af612
    ifaceNunya.getFunction("fulfilledValueCallback")
  );
  console.log("callbackSelector: ", callbackSelector);

  let callbackGasLimit = 30000000; // 30000000 is the block gas limit
  // The function name of the function that is called on the private contract
  const handle = "request_value";

  // Data are the calldata/parameters that are passed into the contract
  const data = JSON.stringify({ myArg: "123" });

  assert!(evmChainId.toString() == (await provider.getNetwork()).chainId.toString());

  // EVM gateway contract address
  // const publicClientAddress = await getPublicClientAddress(evmChainId);
  const publicClientAddress = gatewayContractAddress;

  const callbackAddress = publicClientAddress.toLowerCase();
  console.log("public client callback: ", callbackAddress);

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
  console.log("payload: ", JSON.stringify(payload, null, 2));

  let nextNonceNum = lastNonce + 1;

  // TODO: temporarily skip the below that encrypts the payload until resolve
  // https://github.com/blake-regalia/belt/issues/1
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
    nextNonceNum,
  );

//   // TODO - temporary only but remove after resolve
//   // https://github.com/blake-regalia/belt/issues/1

  // // Note: This approach differs from how we do it in encryptPayload.ts and returns
  // const message = text_to_bytes("\x19Ethereum Signed Message:\n32");
  // const signature = await managedSigner.signMessage(message);
  // const userAddress = await managedSigner.getAddress();
  // console.log("signature: ", signature);
  // console.log("userAddress: ", userAddress);
  // console.log("userPublicKey: ", userPublicKey);
  // const signerAddress = await ethers.utils.verifyMessage(message, signature);
  // console.log('signerAddress: ', signerAddress);
  // if (signerAddress !== userAddress) {
  //   throw("Error: signer address is not equal to user address")
  // }

  const functionData = ifaceGateway.encodeFunctionData("send", [
    payloadHash,
    nunyaBusinessContractAddress, // myAddress,
    routing_contract,
    _info,
  ]);
  console.log("functionData: ", functionData);

  const feeData = await provider.getFeeData();
  const maxFeePerGas = feeData.maxFeePerGas;
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
  const gasFee =
    maxFeePerGas && maxPriorityFeePerGas
      ? maxFeePerGas.add(maxPriorityFeePerGas)
      : await provider.getGasPrice();
  console.log('gasFee: ', gasFee);

  // let amountOfGas;
  // let my_gas = 150000;

  // if (evmChainId.toString() === "4202") {
  //   amountOfGas = gasFee.mul(callbackGasLimit).mul(100000).div(2);
  // } else if (evmChainId.toString() === "128123") {
  //   amountOfGas = gasFee.mul(callbackGasLimit).mul(1000).div(2);
  //   my_gas = 15000000;
  // } else if (evmChainId.toString() === "1287") {
  //   amountOfGas = gasFee.mul(callbackGasLimit).mul(1000).div(2);
  //   my_gas = 15000000;
  // } else if (evmChainId.toString() === "300") {
  //   amountOfGas = gasFee.mul(callbackGasLimit).mul(100000).div(2);
  //   my_gas = 15000000;
  // } else if (evmChainId.toString() === "5003") {
  //   amountOfGas = gasFee.mul(callbackGasLimit).mul(1000000).div(2);
  //   my_gas = 1500000000;
  // } else if (evmChainId.toString() === "80002") {
  //   amountOfGas = gasFee.mul(callbackGasLimit).mul(100).div(2);
  //   my_gas = 200000;
  // } else if (evmChainId.toString() === "1995") {
  //   amountOfGas = gasFee.mul(callbackGasLimit).mul(100).div(2);
  //   my_gas = 200000;
  // } else if (evmChainId.toString() === "713715") {
  //   amountOfGas = gasFee.mul(callbackGasLimit).mul(100).div(2);
  //   my_gas = 200000;
  // } else {
  //   // Note: Sepolia Ethereum has evmChainId 11155111
  //   amountOfGas = gasFee.mul(callbackGasLimit).mul(3).div(2);
  // }
  // // Note: Only if get error `replacement fee too low` then just increase gasPrice by 10%
  // // to replace the previous nonce in the mempool. If it happens again for the same nonce,
  // // then increase the gasPrice by a further 10% (i.e. 1.1 * 1.1 = 1.21)
  // my_gas = my_gas * 1.21; 
  // console.log("amountOfGas: ", amountOfGas);
  // console.log("my_gas: ", my_gas);

  let txParams = {
    value: ethers.utils.parseEther("0.0001"),
    gasLimit: 10000000,
    // Error when use value `200000`: Transaction maxFeePerGas (200000) is too low for the next block, which has a baseFeePerGas of 25209935
    gasPrice: hexlify(8000000000), // 8 Gwei is 8000000000
  }
  let tx = await nunyaContract.unsafeSetSecretContractInfo(routing_contract, routing_code_hash, txParams);
  console.log("txResponseSetUnsafeSetSecretContractInfo", tx);
  // wait() has the logic to return receipt once the transaction is mined
  let receipt = await tx.wait();
  console.log("Receipt: ", receipt);

  callbackGasLimit = 30000000; // 30000000 is the block gas limit
  // let amountOfGas = gasFee.mul(callbackGasLimit).mul(3).div(2)
  let my_gas =  8000000000;

  // TODO: should the `gasLimit` and/or `value` instead be `hexlify(amountOfGas)`?
  const tx_params = {
    from: myAddress,
    to: publicClientAddress,
    value: ethers.utils.parseEther("2.5000"), // 0.0001 ETH = 100000 Gwei
    gasLimit: callbackGasLimit, // 30000000 is the block gas limit
    gasPrice: hexlify(my_gas),
    nonce: nextNonceNum,
    data: functionData,
    chainId: evmChainId,
  }

  tx = await managedSigner.sendTransaction(tx_params);
  console.log("txResponseUnsafeRequestValue: ", tx);
  // wait() has the logic to return receipt once the transaction is mined
  receipt = await tx.wait();
  console.log("Receipt: ", receipt);
}

async function main() {
  await unsafeRequestValue();
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
