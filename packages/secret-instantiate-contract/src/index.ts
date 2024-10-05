import dotenv from "dotenv";
dotenv.config();
import { SecretNetworkClient, Wallet } from "secretjs";
import * as fs from "fs";
import path from 'path';

// const wallet = new Wallet(process.env.WALLET_MNEMONIC_LOCAL);
const wallet = new Wallet(process.env.WALLET_MNEMONIC_TESTNET);
const rootPath = path.resolve(__dirname, '../../../'); // relative to ./dist
const contract_wasm = fs.readFileSync(`${rootPath}/packages/secret-contracts/my-counter-contract/contract.wasm`);

async function main () {
  const secretjs = new SecretNetworkClient({
    // chainId: "secretdev-1",
    // url: process.env.ENDPOINT_LOCAL || "",
    chainId: "pulsar-3",
    url: process.env.ENDPOINT_TESTNET || "",
    wallet: wallet,
    walletAddress: wallet.address
  });

  // Add your contract codeId here
  let codeId = ""

  // Add your contractCodeHash here
  let contractCodeHash = ""

  let instantiate_contract = async () => {
  //instantiate message is empty in this example. If your contract needs to be instantiated with additional variables, be sure to include them.

    const initMsg = {};
    let tx = await secretjs.tx.compute.instantiateContract(
      {
        code_id: codeId,
        sender: wallet.address,
        code_hash: contractCodeHash,
        init_msg: initMsg,
        label: "Demo" + Math.ceil(Math.random() * 10000),
      },
      {
        gasLimit: 400_000,
      }
    );

    //Find the contract_address in the logs
    const contractAddress = tx.arrayLog.find(
      (log) => log.type === "message" && log.key === "contract_address"
    ).value;

    console.log(contractAddress);
  };

  instantiate_contract();

  process.exit()
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
