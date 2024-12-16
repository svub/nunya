// // reference: https://github.com/writersblockchain/secretpath-ballz
import * as dotenv from "dotenv";
dotenv.config();
import { ethers, Wallet } from "ethers";
import { NonceManager } from "@ethersproject/experimental";
import config from './config/deploy.js';
import { chacha20_poly1305_seal } from "@solar-republic/neutrino";
import { bytes, concat, text_to_bytes, json_to_bytes } from "@blake.regalia/belt";
import gatewayAbi from "../../hardhat/artifacts/contracts/Gateway.sol/Gateway.json" assert { type: "json" };
import nunyaAbi from "../../hardhat/artifacts/contracts/NunyaBusiness.sol/NunyaBusiness.json" assert { type: "json" };
import { generateKeys } from "./functions/secretpath/generateKeys.js";
import getPublicClientAddress from "./functions/secretpath/getPublicClientAddress.js";
import { constructPayload } from "./functions/secretpath/constructPayload.js";
import { encryptPayload } from "./functions/secretpath/encryptPayload.js";
import { queryPubkey } from "./functions/query/queryPubkey.js";
import { arrayify, hexlify, keccak256, recoverPublicKey } from "ethers/lib/utils.js";
import { assert } from "console";

if (config.evm.network != "sepolia") {
  console.error("Unsupported network");
}

const { contractCodeHash, secretContractAddress } =
  config.secret.network == "testnet"
  ? config.secret.testnet
  : config.secret.localhost;

const { chainId, endpoint, nunyaBusinessContractAddress, gatewayContractAddress, privateKey } =
  config.evm.sepolia;

const SECRET_ADDRESS = secretContractAddress;
const CONTRACT_CODE_HASH = contractCodeHash;

// https://stackoverflow.com/questions/72476017/how-to-convert-a-javascript-number-to-a-uint8array#72476502
function numToUint8Array(num: any) {
  let arr = new Uint8Array(12);

  for (let i = 11; i >= 0; i--) {
    arr[i] = num % 256;
    num = Math.floor(num / 256);
  }

  return arr;
}

function uint8ArrayToNumV2(arr: any) {
  let num = 0;

  for (let i = 0; i <= 11; i++) {
    num = num * 256 + arr[i];
  }

  return num;
}

async function unsafeRequestSecretContractPubkey() {
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

  // FIXME - `ReferenceError: crypto is not defined`
  // https://github.com/blake-regalia/belt/issues/1
  // const { userPrivateKeyBytes, userPublicKeyBytes, sharedKey } = await generateKeys();
  
  // FIXME - hardcoded values, should be done using `generateKeys()` above
  const userPrivateKeyBytes = arrayify(privateKey);
  const userPublicKey = signer.publicKey;
  const userPublicKeyBytes = arrayify(userPublicKey);
  const sharedKey: Uint8Array = arrayify(userPublicKey)

  // TODO: should this be `upgradeHandler`
  const callbackSelector = ifaceGateway.getSighash(
    // # upgradeHandler - 0x373d450c
    // ?? # fulfillRandomWords - 0x38ba4614 hex, OLpGFA== base64
    // ifaceGateway.getFunction("fulfillRandomWords")
    // requestValue - 0xb6c2b131
    ifaceGateway.getFunction("requestValue")
  );
  console.log("callbackSelector: ", callbackSelector);

  const callbackGasLimit = 90000;
  // The function name of the function that is called on the private contract
  const handle = "request_value";

  // Data are the calldata/parameters that are passed into the contract
  // TODO: change this depending on function being called
  const data = JSON.stringify({ address: myAddress });

  assert!(chainId.toString() == (await provider.getNetwork()).chainId.toString());

  const publicClientAddress = await getPublicClientAddress(chainId);

  const callbackAddress = publicClientAddress.toLowerCase();
  console.log("public client callback myAddress: ", callbackAddress);

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

  // TODO: temporarily skip the below that encrypts the payload until resolve
  // https://github.com/blake-regalia/belt/issues/1
  // const {
  //   ciphertext,
  //   payloadHash,
  //   payloadSignature,
  //   _info,
  // } = await encryptPayload(
  //   payload,
  //   sharedKey,
  //   provider,
  //   myAddress,
  //   userPublicKeyBytes,
  //   routing_code_hash,
  //   handle,
  //   callbackGasLimit,
  //   ifaceGateway,
  //   callbackSelector
  // );

  // TODO - temporary only but remove after resolve
  // https://github.com/blake-regalia/belt/issues/1
  const payloadJson = JSON.stringify(payload);
  const plaintext = json_to_bytes(payload);
  let nextNonceNum = lastNonce + 1;
  let nextNonceUint8Array = numToUint8Array(nextNonceNum);
  // const nextNonce: Uint8Array = arrayify(bytes(12)); // crypto.getRandomValues(bytes(12));
  // const nextNonce: Uint8Array = arrayify(bytes(lastNonce));
  const nextNonce: Uint8Array = nextNonceUint8Array;
  console.log("nextNonce: ", nextNonce);
  console.log("uint8ArrayToNumV2: ", uint8ArrayToNumV2(nextNonce));
  const [ciphertextClient, tagClient] = chacha20_poly1305_seal(sharedKey, nextNonce, plaintext);
  const ciphertext = concat([ciphertextClient, tagClient]);
  const ciphertextHash = keccak256(ciphertext);
  const message = text_to_bytes("\x19Ethereum Signed Message:\n32");
  const payloadHash = keccak256(concat([message, arrayify(ciphertextHash)]));
  const msgParams = ciphertextHash;

  const signature = await managedSigner.signMessage(message);
  const userAddress = await managedSigner.getAddress();
  console.log("signature: ", signature);
  console.log("userAddress: ", userAddress);
  console.log("userPublicKey: ", userPublicKey);

  const signerAddress = await ethers.utils.verifyMessage(message, signature);
  if (signerAddress !== userAddress) {
    throw("Error: signer address is not equal to user address")
  }
  // Note: Skip this since it may be for if you're using Metamask or similar
  // const params = [myAddress, msgParams];
  // const method = "personal_sign";
  // const payloadSignature = await provider.send(method, params);
  // console.log("payloadSignature: ", payloadSignature);
  // const user_pubkey = recoverPublicKey(payloadHash, payloadSignature);
  // console.log("user_pubkey: ", user_pubkey);

  const _info = {
    user_key: hexlify(userPublicKeyBytes),
    user_pubkey: userPublicKey, // user_pubkey;
    routing_code_hash: routing_code_hash,
    task_destination_network: chainId,
    handle: handle,
    nonce: hexlify(nextNonce),
    payload: hexlify(ciphertext),
    payload_signature: signature, // TODO: Is this the correct signature, or should use `peronal_sign`?
    callback_gas_limit: callbackGasLimit,
  }
  console.log("info: ", _info);

  const functionData = ifaceGateway.encodeFunctionData("send", [
    payloadHash,
    myAddress,
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

  let amountOfGas;
  let my_gas = 150000;

  if (chainId.toString() === "4202") {
    amountOfGas = gasFee.mul(callbackGasLimit).mul(100000).div(2);
  } else if (chainId.toString() === "128123") {
    amountOfGas = gasFee.mul(callbackGasLimit).mul(1000).div(2);
    my_gas = 15000000;
  } else if (chainId.toString() === "1287") {
    amountOfGas = gasFee.mul(callbackGasLimit).mul(1000).div(2);
    my_gas = 15000000;
  } else if (chainId.toString() === "300") {
    amountOfGas = gasFee.mul(callbackGasLimit).mul(100000).div(2);
    my_gas = 15000000;
  } else if (chainId.toString() === "5003") {
    amountOfGas = gasFee.mul(callbackGasLimit).mul(1000000).div(2);
    my_gas = 1500000000;
  } else if (chainId.toString() === "80002") {
    amountOfGas = gasFee.mul(callbackGasLimit).mul(100).div(2);
    my_gas = 200000;
  } else if (chainId.toString() === "1995") {
    amountOfGas = gasFee.mul(callbackGasLimit).mul(100).div(2);
    my_gas = 200000;
  } else if (chainId.toString() === "713715") {
    amountOfGas = gasFee.mul(callbackGasLimit).mul(100).div(2);
    my_gas = 200000;
  } else {
    // Note: Sepolia Ethereum has chainId 11155111
    amountOfGas = gasFee.mul(callbackGasLimit).mul(3).div(2);
  }
  // Note: Only if get error `replacement fee too low` then just increase gasPrice by 10%
  // to replace the previous nonce in the mempool. If it happens again for the same nonce,
  // then increase the gasPrice by a further 10% (i.e. 1.1 * 1.1 = 1.21)
  my_gas = my_gas * 1.21; 
  console.log("amountOfGas: ", amountOfGas);
  console.log("my_gas: ", my_gas);

  // const tx_params = {
  //   gas: hexlify(my_gas),
  //   to: publicClientAddress,
  //   from: myAddress,
  //   value: hexlify(amountOfGas),
  //   data: functionData,
  //   chainId: chainId,
  // };

// TODO: should the `gasLimit` instead be `hexlify(amountOfGas)`?
// TODD: how to provide the `functionData`?
  const tx_params = {
    to: publicClientAddress,
    value: ethers.utils.parseEther("0.0001"),
    gasLimit: 10000000,
    gasPrice: hexlify(my_gas),
    nonce: nextNonce,
    data: functionData,
    chainId: chainId,
  }

  const tx = await managedSigner.sendTransaction(tx_params);
  console.log("tx: ", tx);
  // wait() has the logic to return receipt once the transaction is mined
  const receipt = await tx.wait();
  console.log("receipt: ", receipt);

  // TODO: check if tx is mined

  // FIXME: why doesn't other code run if i uncomment the below
  // let query_params = {
  //   endpoint: endpoint,
  //   chainId: chainId,
  //   contractAddress: SECRET_ADDRESS,
  //   contractCodeHash: CONTRACT_CODE_HASH,
  // };
  // const publicKey = await queryPubkey(query_params);
  // console.log("Public key of private Secret Network contract:", publicKey);
}

async function main() {
  await unsafeRequestSecretContractPubkey();
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
