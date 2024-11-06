import { BroadcastMode, SecretNetworkClient, Wallet } from "secretjs";
import * as fs from "fs";
import path from 'path';
import config from './config/deploy';

const walletOptions = {
  hdAccountIndex: 0,
  coinType: 529,
  bech32Prefix: 'secret',
}

const { walletMnemonic, isOptimizedContractWasm, wasmContractPath, gatewayAddress, gatewayHash, gatewayPublicKey, nunyaBusinessContractAddress, chainId, endpoint } =
  config.network == "testnet"
  ? config.testnet
  : config.local;

if (walletMnemonic == "") {
  throw Error("Unable to obtain mnemonic phrase");
}

const wallet = new Wallet(walletMnemonic, walletOptions);
console.log('wallet address: ', wallet.address);

const rootPath = path.resolve(__dirname, '../../../'); // relative to ./dist
console.log('rootPath', rootPath)
// const contract_wasm: any = fs.readFileSync(`${rootPath}/packages/secret-contracts/nunya-contract/${wasmContractPath}`);
// Optimised nunya-contract
const contract_wasm: any = fs.readFileSync(`${rootPath}/packages/secret-contracts/nunya-contract/${isOptimizedContractWasm ? "optimized-wasm/" : "/"}${wasmContractPath}`);

const gatewayPublicKeyBytes = Buffer.from(
  gatewayPublicKey.substring(2),
  "hex"
).toString("base64");

async function main () {
  const secretjs = new SecretNetworkClient({
    chainId: chainId,
    url: endpoint || "",
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
