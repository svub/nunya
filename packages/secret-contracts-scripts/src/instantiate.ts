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

let CODE_ID: String = "";
let CONTRACT_CODE_HASH: String = "";

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

  type INIT_MSG = {
    gateway_address: String,
    gateway_hash: String,
    gateway_key: String,
    nunya_business_contract_address: any,
    count: Number,
  };

  type CODE_PARAMS = {
    codeId: String,
    contractCodeHash: String,
  };

  let instantiate_contract = async (params: CODE_PARAMS) => {
    console.log("Instantiating contract...");
    console.log('params: ', params)
    if (typeof params.codeId == undefined || typeof params.contractCodeHash == undefined) {
      throw Error("Unable to instantiate without codeId and contractCodeHash");
    }

    let contractAddress: String;

    if (!params.codeId || !params.contractCodeHash) {
      throw new Error("codeId or contractCodeHash is not set.");
    }

    let initMsg: INIT_MSG = {
      gateway_address: gatewayAddress,
      gateway_hash: gatewayHash,
      gateway_key: gatewayPublicKeyBytes,
      nunya_business_contract_address: nunyaBusinessContractAddress,
      count: 1,
    };

    let txParams = {
      code_id: params.codeId.toString(),
      sender: wallet.address,
      code_hash: params.contractCodeHash.toString(),
      init_msg: initMsg,
      label: "SnakePath Encrypt " + Math.ceil(Math.random() * 10000),
    };

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

    let tx = await secretjs.tx.compute.instantiateContract(txParams, txOptions);
    console.log('tx: ', tx)

    // Find the contract_address in the logs
    contractAddress = tx?.arrayLog?.find(
      (log) => log?.type === "message" && log?.key === "contract_address"
    )?.value || "";

    if (contractAddress == "") {
      throw Error("Unable to find the contract_address");
    }

    let contractParams = {
      contractAddress,
      contractCodeHash: params.contractCodeHash,
    };
    return contractParams;
  };

  let codeParams: CODE_PARAMS = {
    codeId: CODE_ID,
    contractCodeHash: CONTRACT_CODE_HASH,
  }; 
  
  // Chain the execution using promises
  await instantiate_contract(codeParams)
    .then(async (contractParams) => {
      console.log("SECRET_ADDRESS: ", contractParams.contractAddress);
      // await query_pubkey(contractParams);
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
