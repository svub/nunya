// reference: https://github.com/writersblockchain/secretpath-ballz
import * as dotenv from "dotenv";
dotenv.config();
import { ethers, Contract, Wallet, utils } from "ethers";
import gatewayAbi from "../../../hardhat/artifacts/contracts/Gateway.sol/Gateway.json" assert { type: "json" };
import nunyaAbi from "../../../hardhat/artifacts/contracts/NunyaBusiness.sol/NunyaBusiness.json" assert { type: "json" };
import config from '../config/config.js';
import { loadDeployed } from "../loadDeployed.js";

// Sets the deployed Gateway address storage value for the NunyaBusiness contract
async function setGatewayAddress() {
  let varsEvm;
  if (config.networkSettings.evm.network == "sepolia") {
    varsEvm = config.networkSettings.evm.sepolia;
  } else if (config.networkSettings.evm.network == "localhost") {
    varsEvm = config.networkSettings.evm.localhost;
  } else {
    throw new Error(`Unsupported network.`)
  }
  const { endpoint: evmEndpoint, privateKey } = varsEvm;  

  let deployed = await loadDeployed();
  let varsDeployedEvm;
  if (deployed.data.evm.network == "sepolia") {
    varsDeployedEvm = deployed.data.evm.sepolia;
  } else if (deployed.data.evm.network == "localhost") {
    varsDeployedEvm = deployed.data.evm.localhost;
  } else {
    throw new Error(`Unsupported network.`)
  }
  const { nunyaBusinessContractAddress, gatewayContractAddress } = varsDeployedEvm;

  if (nunyaBusinessContractAddress == "") {
    console.error("Please deploy Nunya.business contract first");
  }

  if (!privateKey) {
    console.error("🚫️ You don't have a deployer account");
    return;
  }
  
  let provider;
  provider = new ethers.providers.JsonRpcProvider(evmEndpoint);
  // console.log(provider);
  await provider.detectNetwork();
  const signer = new Wallet(privateKey, provider);
  const address = signer.address;
  console.log("Public address:", address, "\n");
  signer.connect(provider);
  // console.log("signer is: ", provider.getSigner());
  const balance = await provider.getBalance(address);
  console.log("balance:", +ethers.utils.formatEther(balance));
  console.log("nonce:", +(await provider.getTransactionCount(address)));

  const blockNumber = await provider.getBlockNumber();
  console.log("Current block number: ", blockNumber);

  const ifaceGateway = new ethers.utils.Interface(gatewayAbi.abi);
  const ifaceNunya = new ethers.utils.Interface(nunyaAbi.abi);

  console.log("Setting the Gateway address in the Nunya contract to: ", gatewayContractAddress);
  // Set the gateway address now that the Nunya contract and Gateway contract have been deployed and funded
  const nunyaContractInstance = new Contract(nunyaBusinessContractAddress, ifaceNunya, signer);
  // console.log('nunyaContractInstance', nunyaContractInstance);
  
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
