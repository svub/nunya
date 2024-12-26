import * as dotenv from "dotenv";
dotenv.config();
import { ethers, Wallet } from "ethers";
import { NonceManager } from "@ethersproject/experimental";
import config from '../config/deploy.js';
import gatewayAbi from "../../../hardhat/artifacts/contracts/Gateway.sol/Gateway.json" assert { type: "json" };
import nunyaAbi from "../../../hardhat/artifacts/contracts/NunyaBusiness.sol/NunyaBusiness.json" assert { type: "json" };
import { generateKeys } from "../functions/secretpath/generateKeys.js";
import { hexlify } from "ethers/lib/utils.js";
import { assert } from "console";

const { chainId: secretChainId, secretNunya: { nunyaContractAddress, nunyaContractCodeHash } } =
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

async function unsafeRequestValue() {
  const ifaceGateway = new ethers.utils.Interface(gatewayAbi.abi);
  const ifaceNunya = new ethers.utils.Interface(nunyaAbi.abi);

  const routing_contract = nunyaContractAddress;
  const routing_code_hash = nunyaContractCodeHash;
  
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
  const { userPublicKey, userPrivateKeyBytes, userPublicKeyBytes, sharedKey }: any = response;

  const nunyaContract = new ethers.Contract(nunyaBusinessContractAddress, ifaceNunya, managedSigner);
  const CustomGateway = await nunyaContract.CustomGateway();
  console.log("CustomGateway: ", CustomGateway);

  const gatewayContract = new ethers.Contract(gatewayContractAddress, ifaceGateway, managedSigner);
  const taskDestinationNetwork = await gatewayContract.task_destination_network();
  console.log("taskDestinationNetwork: ", taskDestinationNetwork);

  // TODO: The Gateway.sol function `requestValue` that this calls via the
  // NunyaBusiness.sol contract currently doesn't require `handle`
  // of `request_value` to be provided since it is obvious you want that by calling that function
  // name.
  // We are already hard-coding the arguments and values to `request_value` in
  // as Gateway.sol `requestValue` function `myArg`.
  // But why do we bother passing a callbackSelector of `fulfilledValueCallback`
  // instead of just hard-coding that in that Gateway.sol `requestValue` function too?

  const callbackSelector = ifaceNunya.getSighash(
    // fulfilledValueCallback - 0x0f7af612
    ifaceNunya.getFunction("fulfilledValueCallback")
  );
  console.log("callbackSelector: ", callbackSelector);

  assert!(evmChainId.toString() == (await provider.getNetwork()).chainId.toString());

  // FIXME: `requestValue` in Gateway.sol hard-codes the value of `user_address`,
  // to be a default value on Ethereum Local Network, but this would be different
  // on different networks. It should be provided as an argument to the function.
  // Perhaps it should even be the NunyaBusiness.sol deployed contract address,
  // but get it working the other way first.

  // FIXME: `userPublicKeyBytes` should be used for the payload `user_key` value as
  // a base64.

  // FIXME: In submitRequestValue.ts, `myAddress` associated with the `privateKey` for the value
  // is used for `encryptPayload`, and then the deployed NunyaBusiness address is used as the
  // address value provided to `functionData`. How should we do similar here? Are those values even
  // correct or cause this `IncorrectSignature` error somehow https://github.com/svub/nunya/issues/48 
  // It might need to be account associated with the `privateKey`, since it might be used
  // in the Gateway.sol for creating the payloadSignature with `ethSignedPayloadHash`, so in turn it 
  // might refer to that address when validating the signature at the Secret Gateway.

  // Note: Previously in the gateway evm contract onlyOwner was set to be whoever created the contract in its
  // constructor (e.g. the `DEPLOYER_ADDRESS`) with `owner = msg.sender` but `setSecretContractInfo`
  // function in the gateway evm contract only allows `onlyOwner` to call it, but the caller is using
  // `nunyaContract.unsafeSetSecretContractInfo` the NunyaBusiness contract instead of that `DEPLOYER_ADDRESS`
  // is calling that function in the gateway evm contract, so it was changed to be
  // `owner = nunyaBusinessAddress`
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

  const callbackGasLimit = 30000000; // 30000000 is the block gas limit
  txParams = {
    value: ethers.utils.parseEther("2.5000"), // 0.0001 ETH = 100000 Gwei
    gasLimit: callbackGasLimit,
    gasPrice: hexlify(8000000000),
  }
  tx = await nunyaContract.unsafeRequestValue(callbackSelector, callbackGasLimit, txParams);
  console.log("txResponseUnsafeRequestValue", tx);
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
