import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract, ethers, formatEther, parseEther, parseUnits } from "ethers";

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
  console.log("network: ", hre.network.name);

  if (logging) {
    console.log({ deployer });

    // console.log("Deploying with account:", deployer.address);

    // const balance = await deployer.getBalance();
    // console.log("Account balance:", hre.ethers.utils.formatEther(balance), "ETH");
  }

  //   const Gateway = await deploy("SecretContract", {
  //     contract: "contracts/DummyGateway.sol:SecretContract",
  const gateway = await deploy("DummyGatewayContract", {
    from: deployer,
    // args: [],
    log: true,
    gasLimit: 3000000,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // TODO - remove the following since don't think we need to fund the gateway contract this way
  // Configuring the connection to an Ethereum node
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545/");
  const owner = await provider.getSigner(deployer);
  // Creating and sending the transaction object
  const tx = await owner.sendTransaction({
    to: gateway.address, // Gateway contract
    value: parseUnits("0.001", "ether"),
  });
  console.log("Mining transaction...");
  console.log("tx.hash: ", tx.hash);
  // Waiting for the transaction to be mined on-chain
  const receipt = await tx.wait();
  console.log(`Mined in block: ${receipt?.blockNumber}`);
  const contractBalance = await provider.getBalance(gateway.address);
  console.log("gateway.address balance: ", formatEther(contractBalance));

  const nunyaContract = await deploy("NunyaBusiness", {
    from: deployer,
    // Contract constructor arguments
    args: [gateway.address],
    log: true,
    gasLimit: 3000000,
    value: parseUnits("0.0005", "ether").toString(), // to fund the gateway in the constructor
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // Call the gateway function now that the Nunya contract has been funded
  const nunyaContractDeployedAt = await hre.ethers.getContractAt("NunyaBusiness", nunyaContract.address);
  const newSecretUserTx = await nunyaContractDeployedAt.newSecretUser(deployer, { value: parseEther("0.1") });
  console.log("tx hash:", newSecretUserTx.hash);

  // Get the deployed contract to interact with it after deploying.
  const nunya = await hre.ethers.getContract<Contract>("NunyaBusiness", deployer);
  console.log("👋 Nunya contract:", nunya, await nunya.getAddress());
};

export default deployYourContract;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags YourContract
deployYourContract.tags = ["NunyaBusiness", "SecretContract"];
