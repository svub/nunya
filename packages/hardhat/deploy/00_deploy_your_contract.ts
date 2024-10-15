import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const logging = true;

// on deployment this amount will fund the gateway contract with a donation.
// It's unnecessary so leave it at 0
const value = 0;
// const value = 1337;
// const value = ethers.utils.parseEther("0.0000001337");

/**
 * Deploys a contract named "YourContract" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployYourContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` which will fill DEPLOYER_PRIVATE_KEY
    with a random private key in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  if (logging) {
    console.log({ deployer });

    // console.log("Deploying with account:", deployer.address);

    // const balance = await deployer.getBalance();
    // console.log("Account balance:", hre.ethers.utils.formatEther(balance), "ETH");
  }

  const Gateway = await deploy("SecretContract", {
    contract: "contracts/DummyGateway.sol:SecretContract",
    from: deployer,
    // Contract constructor arguments
    args: [],
    value,
    log: true,
    gasLimit: 3000000,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  await deploy("NunyaBusiness", {
    from: deployer,
    // Contract constructor arguments
    args: [Gateway.address],
    log: true,
    gasLimit: 3000000,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const nunya = await hre.ethers.getContract<Contract>("NunyaBusiness", deployer);
  console.log("👋 Nunya contract:", nunya, await nunya.getAddress());
};

export default deployYourContract;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployYourContract.tags = ["NunyaBusiness", "SecretContract"];
