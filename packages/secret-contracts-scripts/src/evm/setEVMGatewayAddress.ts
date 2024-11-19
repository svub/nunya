// reference: https://github.com/writersblockchain/secretpath-ballz
import * as dotenv from "dotenv";
dotenv.config();
import { ethers, Contract, Wallet, utils } from "ethers";
import abi from "../config/evm/nunyaBusinessABI.js";
import config from '../config/deploy';

if (config.evm.network != "sepolia") {
  console.error("Unsupported network");
}

const { chainId, endpoint, nunyaBusinessContractAddress, gatewayContractAddress, privateKey } =
  config.evm.sepolia;

// Sets the deployed Gateway address storage value for the NunyaBusiness contract
async function setGatewayAddress() {
  if (nunyaBusinessContractAddress == "") {
    console.error("Please deploy Nunya.business contract first");
  }

  if (!privateKey) {
    console.error("🚫️ You don't have a deployer account");
    return;
  }
  
  let provider;
  provider = new ethers.providers.JsonRpcProvider(endpoint);
  console.log(provider);
  await provider.detectNetwork();
  const signer = new Wallet(privateKey, provider);
  const address = signer.address;
  console.log("Public address:", address, "\n");
  signer.connect(provider);
  console.log("signer is: ", provider.getSigner());
  const balance = await provider.getBalance(address);
  console.log("balance:", +ethers.utils.formatEther(balance));
  console.log("nonce:", +(await provider.getTransactionCount(address)));

  const blockNumber = await provider.getBlockNumber();
  console.log("Current block number: ", blockNumber);

  console.log("Setting the Gateway address in the Nunya contract...");
  // Set the gateway address now that the Nunya contract and Gateway contract have been deployed and funded
  const nunyaContractInstance = new Contract(nunyaBusinessContractAddress, abi, signer);
  console.log('nunyaContractInstance', nunyaContractInstance);
  
  const setGatewayAddressReceipt = await nunyaContractInstance.setGatewayAddress(
    gatewayContractAddress, { value: utils.parseEther("0.0001") }
  );
  console.log("Receipt:", setGatewayAddressReceipt);
  console.log("Tx Hash:", setGatewayAddressReceipt.hash);
}

async function main() {
  await setGatewayAddress();
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
