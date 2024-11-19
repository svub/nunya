// import { HardhatRuntimeEnvironment } from "hardhat/types";
// import { DeployFunction } from "hardhat-deploy/types";
// import { Contract, SigningKey, Wallet, ethers, formatEther, parseEther, parseUnits } from "ethers";
// import config from "../hardhat.config";
// import * as dotenv from "dotenv";
// dotenv.config();

// const logging = true;

// /**
//  * Sets the deployed Gateway address storage value for the NunyaBusiness contract
//  *
//  * @param hre HardhatRuntimeEnvironment object.
//  */
// const setGatewayAddress: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
//   /*
//     On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

//     The deployer account
//     should have sufficient balance to pay for the gas fees for contract creation.

//   */
//   console.log("network: ", hre.network.name);
//   const { deploy } = hre.deployments;
//   const chainId = hre.network.config.chainId
//   console.log("chain id: ", chainId);

//   let providerRpc;
//   let deployer;
//   let deployerAddress;
//   const fallbackAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

//   if (hre.network.name = "sepolia") {
//     console.log("hre.network.name: ", hre.network.name);
//     deployer = process.env.DEPLOYER_PRIVATE_KEY || "",  // config.networks?.sepolia?.accounts[0];
//     deployerAddress = process.env.DEPLOYER_ADDRESS || fallbackAddress;
//     providerRpc = String(config.networks?.sepolia);
//   } else {
//     const accounts = await hre.getNamedAccounts();
//     deployer = accounts.deployer;
//     deployerAddress = process.env.DEPLOYER_ADDRESS || fallbackAddress;
//     providerRpc = "http://127.0.0.1:8545/"
//   }

async function main() {
  const nunyaContractAddress = ""
  const gatewayContractAddress = ""

  // Get the deployed contract to interact with it after deploying.
  const gatewayDeployedAt = await hre.ethers.getContractAt("Gateway", gatewayContractAddress);
  // const gatwayContractAddress = await gatewayDeployedAt.getAddress();
  console.log("Gateway contract:", gatewayContractAddress);

  const gatewayBalance = await hre.ethers.provider.getBalance(gatewayContractAddress)
  console.log("Gateway balance: ", formatEther(gatewayBalance));

  console.log("Setting the Gateway address in the Nunya contract...");
  // Set the gateway address now that the Nunya contract has been funded and custom Secret contract and Gateway contract have been deployed
  const nunyaContractDeployedAt = await hre.ethers.getContractAt("NunyaBusiness", nunyaContractAddress);

  const nunyaBalance = await hre.ethers.provider.getBalance(nunyaContractAddress)
  console.log("NunyaBusiness balance: ", formatEther(nunyaBalance));

  // TODO: It may not be necessary to provide a value here
  const setGatewayAddressTx = await nunyaContractDeployedAt.setGatewayAddress(gatwayContractAddress, { value: parseEther("0.0001") });
  console.log("tx hash:", setGatewayAddressTx.hash);

  console.log("Creating a new secret user using the Nunya contract that calls the associated Gateway function...");
  // Call the gateway function now that the Nunya contract has been funded
  const newSecretUserTx = await nunyaContractDeployedAt.newSecretUser(deployer, { value: parseEther("0.0001") });
  console.log("tx hash:", newSecretUserTx.hash);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
