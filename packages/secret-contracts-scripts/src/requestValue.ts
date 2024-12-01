import * as dotenv from "dotenv";
dotenv.config();
import { ethers, Wallet } from "ethers";

import { NonceManager } from "@ethersproject/experimental";
import config from './config/deploy.js';
import gatewayAbi from "../../hardhat/artifacts/contracts/Gateway.sol/Gateway.json" assert { type: "json" };
import nunyaAbi from "../../hardhat/artifacts/contracts/NunyaBusiness.sol/NunyaBusiness.json" assert { type: "json" };

if (config.evm.network != "sepolia") {
  console.error("Unsupported network");
}

const { contractCodeHash, secretContractAddress } =
  config.secret.network == "testnet"
  ? config.secret.testnet
  : config.secret.local;

const { chainId, endpoint, nunyaBusinessContractAddress, gatewayContractAddress, privateKey } =
  config.evm.sepolia;

const SECRET_ADDRESS = secretContractAddress;
const CONTRACT_CODE_HASH = contractCodeHash;

async function unsafeRequestValue() {
  // TODO: Use the nunya and gateway address stored in deploy.ts
  const gatewayAddressInstance = "0x5Be91fd4b49489bb3aEc8bE2F5Fa1d83FD8C5A1b";
  const nunyaAddressInstance = "0x41E52332e76988AFBc38280583a7A02492177C65";
  const ifaceGateway = new ethers.utils.Interface(gatewayAbi.abi);
  const ifaceNunya = new ethers.utils.Interface(nunyaAbi.abi);

  const routing_contract = SECRET_ADDRESS;
  const routing_code_hash = CONTRACT_CODE_HASH;
  
  if (!privateKey) {
    console.log("🚫️ You don't have a deployer account. Run `yarn generate` first");
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

  // TODO: Redeploy with `CustomGateway` publically accessible
  const nunyaContract = new ethers.Contract(nunyaAddressInstance, ifaceNunya, managedSigner);
  // const CustomGateway = await nunyaContract.CustomGateway();
  // console.log("CustomGateway: ", CustomGateway);

  const gatewayContract = new ethers.Contract(gatewayAddressInstance, ifaceGateway, managedSigner);
  const taskDestinationNetwork = await gatewayContract.task_destination_network();
  console.log("taskDestinationNetwork: ", taskDestinationNetwork);

  const txResponseSetUnsafeSetSecretContractInfo =
    await nunyaContract.unsafeSetSecretContractInfo(routing_contract, routing_code_hash, { value: ethers.utils.parseEther("0.0001") });
  console.log("responseSetUnsafeSetSecretContractInfo", txResponseSetUnsafeSetSecretContractInfo);
  // wait() has the logic to return receipt once the transaction is mined
  const receipt = await txResponseSetUnsafeSetSecretContractInfo.wait();
  console.log("receipt: ", receipt);
}

async function main() {
  await unsafeRequestValue();
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
