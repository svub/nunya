import dotenv from "dotenv";
dotenv.config();
import { SecretNetworkClient, Wallet } from "secretjs";
import * as fs from "fs";
import path from 'path';

const walletOptions = {
  hdAccountIndex: 0,
  coinType: 529,
  bech32Prefix: 'secret',
}
console.log('process.env.WALLET_MNEMONIC_TESTNET', process.env.WALLET_MNEMONIC_TESTNET)
// const wallet = new Wallet(process.env.WALLET_MNEMONIC_LOCAL, walletOptions);
const wallet = new Wallet(process.env.WALLET_MNEMONIC_TESTNET, walletOptions);
console.log('wallet: ', wallet);

const rootPath = path.resolve(__dirname, '../../../'); // relative to ./dist
console.log('rootPath', rootPath)
const contract_wasm = fs.readFileSync(`${rootPath}/packages/secret-contracts/my-counter-contract/contract.wasm`);

async function main () {
  const secretjs = new SecretNetworkClient({
    // chainId: "secretdev-1",
    // url: process.env.ENDPOINT_LOCAL || "",
    chainId: "pulsar-3",
    url: process.env.ENDPOINT_TESTNET || "",
    wallet: wallet,
    walletAddress: wallet.address,
  });

  // console.log('secretjs: ', secretjs);

  const { balance } = await secretjs.query.bank.balance({
    address: wallet.address,
    denom: "uscrt",
  });

  console.log('balance: ', balance);

  // let upload_contract = async () => {
  //   let tx = await secretjs.tx.compute.storeCode(
  //     {
  //       sender: wallet.address,
  //       wasm_byte_code: contract_wasm,
  //       source: "",
  //       builder: "",
  //     },
  //     {
  //       gasLimit: 4_000_000,
  //     }
  //   );

  //   const codeId = Number(
  //     tx.arrayLog.find((log) => log.type === "message" && log.key === "code_id")
  //       .value
  //   );

  //   console.log("codeId: ", codeId);

  //   const contractCodeHash = (
  //     await secretjs.query.compute.codeHashByCodeId({ code_id: codeId })
  //   ).code_hash;
  //   console.log(`Contract hash: ${contractCodeHash}`);
  // };

  // upload_contract();

  process.exit()
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
