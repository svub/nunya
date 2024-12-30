// reference: https://github.com/writersblockchain/secretpath-ballz
// reference: https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/usecases/vrf/using-encrypted-payloads-for-vrf#define-the-calldata-for-the-secret-contract-and-callback-information
import * as dotenv from "dotenv";
dotenv.config();
import { ethers, Wallet } from "ethers";
import { NonceManager } from "@ethersproject/experimental";
import config from './../../config/config.js';
import { loadDeployed } from "../../loadDeployed.js";
import gatewayAbi from "../../../../hardhat/artifacts/contracts/Gateway.sol/Gateway.json" assert { type: "json" };
import nunyaAbi from "../../../../hardhat/artifacts/contracts/NunyaBusiness.sol/NunyaBusiness.json" assert { type: "json" };
import { generateKeys } from "../../functions/secretpath/generateKeys.js";
// import getPublicClientAddress from "./functions/secretpath/getPublicClientAddress.js";
import { constructPayload } from "../../functions/secretpath/constructPayload.js";
import { encryptPayload } from "../../functions/secretpath/encryptPayload.js";
import { hexlify } from "ethers/lib/utils.js";
import { assert } from "console";
import { RequestParams } from "../../types/index.js";

let varsEvm;
if (config.networkSettings.evm.network == "sepolia") {
  varsEvm = config.networkSettings.evm.sepolia;
} else if (config.networkSettings.evm.network == "localhost") {
  varsEvm = config.networkSettings.evm.localhost;
} else {
  throw new Error(`Unsupported network.`)
}
const { privateKey } = varsEvm;

export const requestNunya = async (params: RequestParams) => {
  const { callbackSelectorName, callbackGasLimitAmount, requestFunctionName, requestEthValue, secretContractRequestHandle, secretContractRequestHandleArgs } = params;
  const ifaceGateway = new ethers.utils.Interface(gatewayAbi.abi);
  const ifaceNunya = new ethers.utils.Interface(nunyaAbi.abi);

  let deployed = await loadDeployed();
  let varsDeployedEvm;
  if (deployed.data.evm.network == "sepolia") {
    varsDeployedEvm = deployed.data.evm.sepolia;
  } else if (deployed.data.evm.network == "localhost") {
    varsDeployedEvm = deployed.data.evm.localhost;
  } else {
    throw new Error(`Unsupported network.`)
  }
  const { chainId: evmChainId, endpoint: evmEndpoint, nunyaBusinessContractAddress, gatewayContractAddress } = varsDeployedEvm;

  let varsDeployedSecret;
  if (deployed.data.secret.network == "testnet") {
    varsDeployedSecret = deployed.data.secret.testnet;
  } else if (deployed.data.secret.network == "localhost") {
    varsDeployedSecret = deployed.data.secret.localhost;
  } else {
    throw new Error(`Unsupported network.`)
  }
  const { secretNunya: { nunyaContractCodeHash, nunyaContractAddress } } = varsDeployedSecret;

  const routing_contract = nunyaContractAddress;
  const routing_code_hash = nunyaContractCodeHash;
  
  if (!privateKey) {
    console.log("🚫️ You don't have a deployer account. Run `yarn hardhat:generate` first");
    return;
  }

  let provider;
  provider = new ethers.providers.JsonRpcProvider(evmEndpoint);
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
    // fulfilledSecretContractPubkeyCallback - 0xf5a66c73 hex, 9aZscw== base64
    ifaceNunya.getFunction(callbackSelectorName)
  );
  console.log("callbackSelector: ", callbackSelector);

  let callbackGasLimit = callbackGasLimitAmount; // 30000000 is the block gas limit
  // The function name of the function that is called on the private contract
  const handle = secretContractRequestHandle;
  // Data are the calldata/parameters that are passed into the contract
  const data = JSON.stringify(secretContractRequestHandleArgs);

  assert!(evmChainId == (await provider.getNetwork()).chainId.toString());

  // EVM gateway contract address
  // const publicClientAddress = await getPublicClientAddress(evmChainId);
  const publicClientAddress = gatewayContractAddress;

  // const callbackAddress = publicClientAddress.toLowerCase();
  // Note: We want the `postExecution` function in the EVM Gateway contract to use this
  // callbackAddress and then call the EVM NunyaBusiness contract's `fulfilledValueCallback` function
  const callbackAddress = nunyaBusinessContractAddress.toLowerCase();
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

  // FIXME: Should we still increment the nonce and use this
  // in the `tx_params`?
  // It shouldn't be passed to `encryptPayload` since
  // that function should generate a random nonce, so consider
  // removing that `encryptPayload` argument and just generate
  // the nonce that is used there with `crypto.getRandomValues(bytes(12))`
  //
  // Similarly, the `_newNonce` used in `requestValue` that is called
  // by requestValue.ts should be random too instead of incremented.
  // The equivalent to `_info` in Gateway.sol is `executionInfo`. 
  let nextNonceNum = lastNonce + 1;

  const {
    ciphertext,
    payloadHash,
    payloadSignature,
    _info,
  } = await encryptPayload(
    payload,
    sharedKey,
    provider,
    // FIXME: Why is this value for `myAddress` that is included
    // for encrypting the payload different from the `myAddress`
    // value that is included in `functionData` later. Could this
    // be the cause of InvalidSignature error?
    // https://github.com/svub/nunya/issues/48
    myAddress,
    userPublicKeyBytes,
    routing_code_hash,
    handle,
    callbackGasLimit,
    ifaceNunya,
    callbackSelector,
    taskDestinationNetwork,
    nextNonceNum,
  );

  const functionName = requestFunctionName;
  const functionData = ifaceNunya.encodeFunctionData(functionName, [
    payloadHash,
    // FIXME: Try changing this to `myAddress` to see if it resolves the
    // `IncorrectSignature` error https://github.com/svub/nunya/issues/48
    // FIXME: In this submitRequestValue.ts, `myAddress` associated with the `privateKey` for the value
    // is used for `encryptPayload`, and then the deployed NunyaBusiness address is used as the
    // address value provided to `functionData`. Are those values even
    // correct or cause this `IncorrectSignature` error somehow https://github.com/svub/nunya/issues/48 
    // It might need to be account associated with the `privateKey`, since it might be used
    // in the Gateway.sol for creating the payloadSignature with `ethSignedPayloadHash`, so in turn it 
    // might refer to that address when validating the signature at the Secret Gateway.
    //
    // Note: In Gateway.sol, check if the `send` function assigns a different value to the
    // `_userAddress` other than the value that we provide here.
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

  // if (evmChainId === "4202") {
  //   amountOfGas = gasFee.mul(callbackGasLimit).mul(100000).div(2);
  // } else if (evmChainId === "128123") {
  //   amountOfGas = gasFee.mul(callbackGasLimit).mul(1000).div(2);
  //   my_gas = 15000000;
  // } else if (evmChainId === "1287") {
  //   amountOfGas = gasFee.mul(callbackGasLimit).mul(1000).div(2);
  //   my_gas = 15000000;
  // } else if (evmChainId === "300") {
  //   amountOfGas = gasFee.mul(callbackGasLimit).mul(100000).div(2);
  //   my_gas = 15000000;
  // } else if (evmChainId === "5003") {
  //   amountOfGas = gasFee.mul(callbackGasLimit).mul(1000000).div(2);
  //   my_gas = 1500000000;
  // } else if (evmChainId === "80002") {
  //   amountOfGas = gasFee.mul(callbackGasLimit).mul(100).div(2);
  //   my_gas = 200000;
  // } else if (evmChainId === "1995") {
  //   amountOfGas = gasFee.mul(callbackGasLimit).mul(100).div(2);
  //   my_gas = 200000;
  // } else if (evmChainId === "713715") {
  //   amountOfGas = gasFee.mul(callbackGasLimit).mul(100).div(2);
  //   my_gas = 200000;
  // } else {
  //   // Note: Sepolia Ethereum has chainId 11155111
  //   amountOfGas = gasFee.mul(callbackGasLimit).mul(3).div(2);
  // }
  // // Note: Only if get error `replacement fee too low` then just increase gasPrice by 10%
  // // to replace the previous nonce in the mempool. If it happens again for the same nonce,
  // // then increase the gasPrice by a further 10% (i.e. 1.1 * 1.1 = 1.21)
  // my_gas = my_gas * 1.21; 
  // console.log("amountOfGas: ", amountOfGas);
  // console.log("my_gas: ", my_gas);

  // TODO: Move calling `unsafeSetSecretContractInfo` into a separate script that gets run first.

  // Note: Previously in the gateway evm contract onlyOwner was set to be whoever created the contract in its
  // constructor (e.g. the `DEPLOYER_ADDRESS`) with `owner = msg.sender` but `setSecretContractInfo`
  // function in the gateway evm contract only allows `onlyOwner` to call it, but the caller is using
  // `nunyaContract.unsafeSetSecretContractInfo` the NunyaBusiness contract instead of that `DEPLOYER_ADDRESS`
  // is calling that function in the gateway evm contract, so it was changed to be
  // `owner = nunyaBusinessAddress`
  let txParams = {
    // FIXME: `value` may not be required
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
  const txParamsSend = {
    from: myAddress,
    to: nunyaBusinessContractAddress,
    value: ethers.utils.parseEther(requestEthValue), // 0.0001 ETH = 100000 Gwei
    gasLimit: callbackGasLimit, // 30000000 is the block gas limit
    gasPrice: hexlify(my_gas),
    nonce: nextNonceNum,
    data: functionData, // function to call and args
    chainId: parseInt(evmChainId),
  }

  tx = await managedSigner.sendTransaction(txParamsSend);
  console.log("txResponseUnsafeRequestValue: ", tx);
  // wait() has the logic to return receipt once the transaction is mined
  receipt = await tx.wait();
  console.log("Receipt: ", receipt);
}
