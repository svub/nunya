import dotenv from "dotenv";
dotenv.config();
import { BroadcastMode, SecretNetworkClient, Wallet } from "secretjs";
import * as fs from "fs";
import path from 'path';

const walletOptions = {
  hdAccountIndex: 0,
  coinType: 529,
  bech32Prefix: 'secret',
}
console.log('process.env.WALLET_MNEMONIC_TESTNET loaded?', process.env.WALLET_MNEMONIC_TESTNET !== "")
// const wallet = new Wallet(process.env.WALLET_MNEMONIC_LOCAL, walletOptions);
const wallet = new Wallet(process.env.WALLET_MNEMONIC_TESTNET, walletOptions);
console.log('wallet address: ', wallet.address);

const rootPath = path.resolve(__dirname, '../../../'); // relative to ./dist
console.log('rootPath', rootPath)
// const contract_wasm: any = fs.readFileSync(`${rootPath}/packages/secret-contracts/nunya-contract/contract.wasm.gz`);
// // Optimised my-counter-contract
// const contract_wasm: any = fs.readFileSync(`${rootPath}/packages/secret-contracts/my-counter-contract/optimized-wasm/secret_contract_example.wasm.gz`);
// Optimised nunya-contract
const contract_wasm: any = fs.readFileSync(`${rootPath}/packages/secret-contracts/nunya-contract/optimized-wasm/secret_evm_storage.wasm.gz`);

// Secret Testnet
// reference: https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/supported-networks/secret-gateway/secretpath-testnet-pulsar-3-contracts

// Code ID 3375
const gatewayAddress = "secret10ex7r7c4y704xyu086lf74ymhrqhypayfk7fkj";
const gatewayHash =
  "ad8ca07ffba1cb26ebf952c29bc4eced8319c171430993e5b5089887f27b3f70";
const gatewayPublicKey =
  "0x046d0aac3ef10e69055e934ca899f508ba516832dc74aa4ed4d741052ed5a568774d99d3bfed641a7935ae73aac8e34938db747c2f0e8b2aa95c25d069a575cc8b";
const nunyaBusinessContractAddress = "";

// Secret Mainnet
// reference: https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/supported-networks/secret-gateway/secretpath-mainnet-secret-4-contracts

// Code ID 1533
// const gatewayAddress = "secret1qzk574v8lckjmqdg3r3qf3337pk45m7qd8x02a";
// const gatewayHash =
//   "012dd8efab9526dec294b6898c812ef6f6ad853e32172788f54ef3c305c1ecc5";
// // TODO: is it correct that the Gateway public key is the same for both Mainnet and Testnet as shown in the docs here, even though they have a different Gateway address? https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/supported-networks/secret-gateway
// const gatewayPublicKey =
//   "0x04a0d632acd0d2f5da02fc385ea30a8deab4d5639d1a821a3a552625ad0f1759d0d2e80ca3adb236d90caf1b12e0ddf3a351c5729b5e00505472dca6fed5c31e2a";

const gatewayPublicKeyBytes = Buffer.from(
  gatewayPublicKey.substring(2),
  "hex"
).toString("base64");

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

  type CODE_PARAMS = {
    codeId: String,
    contractCodeHash: String,
  };

  type CONTRACT_PARAMS = {
    contractAddress: String,
    contractCodeHash: String,
  };

  let upload_contract = async () => {
    console.log("Starting deployment...");

    let codeId: String;
    let contractCodeHash: String;
    let tx: any;
    let txParams = {
      sender: wallet.address,
      wasm_byte_code: contract_wasm,
      source: "",
      builder: "",
    };
    // ../../packages/secret-contracts-scripts/node_modules/secretjs/src/secret_network_client.ts
    let txOptions = {
      gasLimit: 5_000_000, // default 25_000
      gasPriceInFeeDenom: 1, // default 0.1
      feeDenom: "uscrt",
      feeGranter: wallet.address,
      waitForCommit: true, // default true
      broadcastTimeoutMs: 240_000, // default 60_000
      broadcastCheckIntervalMs: 24_000, // default 6_000 for 6 second block
      broadcastMode: BroadcastMode.Async,
    };
    try {
      tx = await secretjs.tx.compute.storeCode(txParams, txOptions);
    } catch (e) {
      console.log('error: ', e);
    }

    if (typeof tx == undefined) {
      throw Error("Unable to obtain codeId");
    }

    // View tx in block explorer - https://docs.scrt.network/secret-network-documentation/overview-ecosystem-and-technology/ecosystem-overview/explorers-and-tools

    codeId = String(
      tx?.arrayLog?.find((log: any) => log?.type === "message" && log?.key === "code_id")?.value
    );

    if (tx?.rawLog) {
      console.log("tx.rawLog: ", tx?.rawLog);
    } else {
      console.log("tx: ", tx);
    }

    if (codeId == "") {
      throw Error("Unable to obtain codeId");
    }

    contractCodeHash = (
      await secretjs.query.compute.codeHashByCodeId({ code_id: codeId.toString() })
    ).code_hash || "";
  
    if (contractCodeHash == "") {
      throw Error("Unable to obtain contractCodeHash");
    }

    return {
      codeId,
      contractCodeHash
    }
  };
  
  // Chain the execution using promises
  await upload_contract()
    .then(async (res: CODE_PARAMS) => {
      console.log(`CODE_ID: ${res.codeId}`);
      console.log(`CODE_HASH: ${res.contractCodeHash}`);
    })
    .catch((error) => {
      console.error("Error:", error);
    });

  process.exit()
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
