import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract, SigningKey, Wallet, getBytes, ethers, formatEther, parseEther, parseUnits } from "ethers";
import config from "../hardhat.config";
import * as dotenv from "dotenv";
dotenv.config();
import { loadDeployed } from "../helpers/loadDeployed";
import { writeDeployed } from "../helpers/writeDeployed";

const logging = true;

// on deployment this amount will fund the gateway contract with a donation.
// It's unnecessary so leave it at 0
const value = 0;
// const value = 1337;
// const value = ethers.utils.parseEther("0.0000001337");

function getDeployerPublicKeyBytes(deployerPrivateKey: string) {
  const deployerWallet = new Wallet(deployerPrivateKey);
  console.log("Generating keys for deployer public address:", deployerWallet.address, "\n");
  const userPublicKey = new SigningKey(deployerWallet.privateKey).compressedPublicKey;
  console.log('userPublicKey: ', userPublicKey);
  // https://github.com/ethers-io/ethers.js/issues/3795#issue-1589631066
  const userPublicKeyBytes = getBytes(userPublicKey);
  console.log('userPublicKeyBytes: ', userPublicKeyBytes);
  return userPublicKeyBytes;
}

/**
 * Deploys a contract named "YourContract" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployYourContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn hardhat:deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn hardhat:generate` which will fill ETH_TESTNET_PRIVATE_KEY
    with a random private key in the .env file (then used on hardhat.config.ts)
    You can run the `yarn hardhat:account` command to check your balance in every network.
  */
  console.log("network: ", hre.network.name);
  const { deploy } = hre.deployments;
  const chainId = hre.network.config.chainId;
  console.log("chain id: ", chainId);

  let providerRpc;
  let deployerPrivateKey;
  let deployerAddress;
  let deployerPublicKeyBytes;

  if (hre.network.name == "sepolia") {
    console.log("hre.network.name: ", hre.network.name);
    if (process.env.ETH_TESTNET_ADDRESS == "" || process.env.ETH_TESTNET_PRIVATE_KEY == "") {
      throw new Error(`Please add deployer address and private key to the .env file for Sepolia Network.`)
    }
    deployerPrivateKey = process.env.ETH_TESTNET_PRIVATE_KEY || ""; // config.networks?.sepolia?.accounts[0];
    deployerAddress = process.env.ETH_TESTNET_ADDRESS || "";
    deployerPublicKeyBytes = getDeployerPublicKeyBytes(deployerPrivateKey);
    providerRpc = process.env.ETH_SEPOLIA_PROVIDER_RPC;
  } else if (hre.network.name = "localhost") {
    deployerPrivateKey = process.env.ETH_DEVELOPMENT_PRIVATE_KEY || "";
    deployerAddress = process.env.ETH_DEVELOPMENT_ADDRESS || "";
    deployerPublicKeyBytes = getDeployerPublicKeyBytes(deployerPrivateKey);
    providerRpc = process.env.ETH_DEVELOPMENT_PROVIDER_RPC;
  } else {
    console.log("Unsupported network: ", hre.network.name);
    throw Error("Unsupported network");
  }

  if (logging) {
    console.log("deployerAddress: ", deployerAddress);
    const balance = await hre.ethers.provider.getBalance(deployerAddress);
    console.log("Deployer account balance:", hre.ethers.formatEther(balance), "ETH");
  }

  const nunyaContract = await deploy("NunyaBusiness", {
    from: deployerPrivateKey,
    // Contract constructor arguments
    args: [],
    log: true,
    gasLimit: 3000000,
    value: parseUnits("0.0005", "ether").toString(), // to fund the gateway in the constructor, use when setGatewayAddress is called
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });
  console.log("Successfully deployed NunyaBusiness to address: ", nunyaContract.address);

  const gateway = await deploy("Gateway", {
    from: deployerPrivateKey,
    args: [nunyaContract.address, deployerPublicKeyBytes],
    log: true,
    gasLimit: 30000000,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });
  console.log("Successfully deployed Gateway to address: ", gateway.address);

  // Call the set gateway function now that the Nunya contract has been funded
  const nunyaContractDeployedAt = await hre.ethers.getContractAt("NunyaBusiness", nunyaContract.address);
  const setGatewayAddressTx = await nunyaContractDeployedAt.setGatewayAddress(gateway.address, { value: parseEther("0.0001") });
  console.log("setGatewayAddressTx tx hash:", setGatewayAddressTx.hash);

  // Get the deployed contract to interact with it after deploying.
  const nunyaInstance = await hre.ethers.getContract<Contract>("NunyaBusiness");
  console.log("👋 Nunya contract:", await nunyaInstance.getAddress());

  const nunyaBalance = await hre.ethers.provider.getBalance(nunyaContract.address)
  console.log("NunyaBusiness balance: ", formatEther(nunyaBalance));

  const gatewayBalance = await hre.ethers.provider.getBalance(gateway.address)
  console.log("Gateway balance: ", formatEther(gatewayBalance));

  // // Call the gateway function now that the Nunya contract has been funded
  // const nunyaContractDeployedAt = await hre.ethers.getContractAt("NunyaBusiness", nunyaContract.address);
  // const newSecretUserTx = await nunyaContractDeployedAt.newSecretUser(deployerPrivateKey, { value: parseEther("0.0001") });
  // console.log("tx hash:", newSecretUserTx.hash);

  const deployed = await loadDeployed();
  deployed.data.evm.network = hre.network.name;
  if (hre.network.name == "localhost") {
    deployed.data.evm.localhost.chainId = chainId?.toString() || "";
    deployed.data.evm.localhost.endpoint = providerRpc;
    deployed.data.evm.localhost.nunyaBusinessContractAddress = nunyaContract.address;
    deployed.data.evm.localhost.gatewayContractAddress = gateway.address;
  } else if (hre.network.name == "sepolia") {
    deployed.data.evm.sepolia.chainId = chainId?.toString() || "";
    deployed.data.evm.sepolia.endpoint = providerRpc;
    deployed.data.evm.sepolia.nunyaBusinessContractAddress = nunyaContract.address;
    deployed.data.evm.sepolia.gatewayContractAddress = gateway.address;
  } else {
    console.log("Unsupported network: ", hre.network.name);
    throw Error("Unsupported network");
  }
  await writeDeployed(deployed);
};

export default deployYourContract;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn hardhat:deploy --tags YourContract
deployYourContract.tags = ["NunyaBusiness", "SecretContract"];
