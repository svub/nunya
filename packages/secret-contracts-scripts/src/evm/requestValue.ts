import * as dotenv from "dotenv";
dotenv.config();
import { ethers, Wallet } from "ethers";
import { hexlify } from "ethers/lib/utils.js";

import { NonceManager } from "@ethersproject/experimental";
import config from '../config/deploy.js';
import gatewayAbi from "../../../hardhat/artifacts/contracts/Gateway.sol/Gateway.json" assert { type: "json" };
import nunyaAbi from "../../../hardhat/artifacts/contracts/NunyaBusiness.sol/NunyaBusiness.json" assert { type: "json" };

const { secretNunya: { nunyaContractCodeId, nunyaContractAddress, nunyaContractCodeHash } } =
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
const { chainId, endpoint, nunyaBusinessContractAddress, gatewayContractAddress, privateKey } = vars;

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

  const nunyaContract = new ethers.Contract(nunyaBusinessContractAddress, ifaceNunya, managedSigner);
  const CustomGateway = await nunyaContract.CustomGateway();
  console.log("CustomGateway: ", CustomGateway);

  const gatewayContract = new ethers.Contract(gatewayContractAddress, ifaceGateway, managedSigner);
  const taskDestinationNetwork = await gatewayContract.task_destination_network();
  console.log("taskDestinationNetwork: ", taskDestinationNetwork);

  // Previously in the gateway evm contract onlyOwner was set to be whoever created the contract in its
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
  const txResponseSetUnsafeSetSecretContractInfo =
    await nunyaContract.unsafeSetSecretContractInfo(routing_contract, routing_code_hash, txParams);
  console.log("responseSetUnsafeSetSecretContractInfo", txResponseSetUnsafeSetSecretContractInfo);
  // wait() has the logic to return receipt once the transaction is mined
  let receipt = await txResponseSetUnsafeSetSecretContractInfo.wait();
  console.log("Receipt: ", receipt);

  const callbackSelector = ifaceNunya.getSighash(
    // requestValue - 0xb6c2b131
    ifaceNunya.getFunction("fulfilledValueCallback")
  );
  
  console.log("callbackSelector: ", callbackSelector);
  const callbackGasLimit = 30000000; // 30000000 is the block gas limit
  txParams = {
    value: ethers.utils.parseEther("2.5000"), // 0.0001 ETH = 100000 Gwei
    gasLimit: callbackGasLimit,
    gasPrice: hexlify(8000000000),
  }
  const txResponseUnsafeRequestValue =
    await nunyaContract.unsafeRequestValue(callbackSelector, callbackGasLimit, txParams);
  console.log("txResponseUnsafeRequestValue", txResponseUnsafeRequestValue);
  receipt = await txResponseUnsafeRequestValue.wait();
  console.log("Receipt: ", receipt);
}

async function main() {
  await unsafeRequestValue();
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
