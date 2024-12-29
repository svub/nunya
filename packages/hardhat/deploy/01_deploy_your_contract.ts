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

function getDeployerPublicKeyBytes(deployer: string) {
  const deployerWallet = new Wallet(deployer);
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

    You can generate a random account with `yarn hardhat:generate` which will fill DEPLOYER_PRIVATE_KEY
    with a random private key in the .env file (then used on hardhat.config.ts)
    You can run the `yarn hardhat:account` command to check your balance in every network.
  */
  console.log("network: ", hre.network.name);
  const { deploy } = hre.deployments;
  const chainId = hre.network.config.chainId;
  console.log("chain id: ", chainId);

  let providerRpc;
  let deployer;
  let deployerAddress;
  let deployerPublicKeyBytes;
  // Ethereum Local Network
  // Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
  // Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
  const deployerPrivateKeyLocalNetwork = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const deployerAddressLocalNetwork = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  let isLocal;
  if (hre.network.name == "sepolia") {
    isLocal = false;
    console.log("hre.network.name: ", hre.network.name);
    if (process.env.DEPLOYER_ADDRESS == "" || process.env.DEPLOYER_PRIVATE_KEY == "") {
      throw new Error(`Please add deployer address and private key to the .env file for Sepolia Network.`)
    }
    deployer = process.env.DEPLOYER_PRIVATE_KEY || "";  // config.networks?.sepolia?.accounts[0];
    deployerAddress = process.env.DEPLOYER_ADDRESS || "";
    deployerPublicKeyBytes = getDeployerPublicKeyBytes(deployer);
    providerRpc = String(config.networks?.sepolia);
  } else {
    isLocal = true;
    deployer = deployerPrivateKeyLocalNetwork;
    deployerAddress = deployerAddressLocalNetwork;
    deployerPublicKeyBytes = getDeployerPublicKeyBytes(deployer);
    providerRpc = "http://127.0.0.1:8545/";
  }

  if (logging) {
    console.log("deployerAddress: ", deployerAddress);

    const balance = await hre.ethers.provider.getBalance(deployerAddress);
    console.log("Deployer account balance:", hre.ethers.formatEther(balance), "ETH");
  }

  const nunyaContract = await deploy("NunyaBusiness", {
    from: deployer,
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
    from: deployer,
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
  // const newSecretUserTx = await nunyaContractDeployedAt.newSecretUser(deployer, { value: parseEther("0.0001") });
  // console.log("tx hash:", newSecretUserTx.hash);

  const deployed = await loadDeployed();
  if (isLocal) {
    deployed.data.evm.localhost.chainId = chainId?.toString() || "";
    deployed.data.evm.localhost.endpoint = providerRpc;
    deployed.data.evm.localhost.nunyaBusinessContractAddress = nunyaContract.address;
    deployed.data.evm.localhost.gatewayContractAddress = gateway.address;
  } else {
    deployed.data.evm.sepolia.chainId = chainId?.toString() || "";
    deployed.data.evm.sepolia.endpoint = providerRpc;
    deployed.data.evm.sepolia.nunyaBusinessContractAddress = nunyaContract.address;
    deployed.data.evm.sepolia.gatewayContractAddress = gateway.address;
  }
  await writeDeployed(deployed);
};

export default deployYourContract;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn hardhat:deploy --tags YourContract
deployYourContract.tags = ["NunyaBusiness", "SecretContract"];
