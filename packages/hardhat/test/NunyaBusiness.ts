import { expect } from "chai";
import { ethers } from "hardhat";
import { Wallet, parseEther } from "ethers";
import { NunyaBusiness } from "../typechain-types";
import * as dotenv from "dotenv";
dotenv.config();

describe("NunyaBusiness", function () {
  // We define a fixture to reuse the same setup in every test.

  let nunyaBusinessContract: NunyaBusiness;
  before(async () => {
    const deployerPrivateKey = process.env.ETH_DEVELOPMENT_PRIVATE_KEY || "";
    const deployerWallet = new Wallet(deployerPrivateKey);
    console.log("Generating keys for deployer public address:", deployerWallet.address, "\n");
    // TODO: How to write the tests only use the "ethers" that is imported through "hardhat"?
    // const [owner] = await ethers.getSigners();
    const nunyaBusinessContractFactory = await ethers.getContractFactory("NunyaBusiness");
    // nunyaBusinessContract = (await nunyaBusinessContractFactory.deploy(owner.address)) as NunyaBusiness;
    nunyaBusinessContract = (await nunyaBusinessContractFactory.deploy({ from: deployerWallet.address })) as NunyaBusiness;

    await nunyaBusinessContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should not allow setting the deployed gateway address to be 0x0", async function () {
      const deployedGatewayAddress = "0x0000000000000000000000000000000000000000";
      // await nunyaBusinessContract.setGatewayAddress(deployedGatewayAddress, { value: parseEther("2.5") });
      // expect(await nunyaBusinessContract.setGatewayAddress(deployedGatewayAddress, { value: parseEther("2.5") })).to.equal("No gateway set");
      await expect(nunyaBusinessContract.setGatewayAddress(deployedGatewayAddress, { value: parseEther("2.5") })).to.be.revertedWith('No gateway set');
    });
  });
});
