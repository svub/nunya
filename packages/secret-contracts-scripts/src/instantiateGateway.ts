import { BroadcastMode, SecretNetworkClient, Wallet } from "secretjs";
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log('__dirname: ', __dirname);

const walletOptions = {
  hdAccountIndex: 0,
  coinType: 529,
  bech32Prefix: 'secret',
}

const { walletMnemonic, secretGateway: { gatewayContractAdminAddress, gatewayContractCodeId, gatewayContractCodeHash }, chainId, endpoint } =
  config.secret.network == "testnet"
  ? config.secret.testnet
  : config.secret.localhost;

if (walletMnemonic == "") {
  throw Error("Unable to obtain mnemonic phrase");
}

const wallet = new Wallet(walletMnemonic, walletOptions);
console.log('wallet address: ', wallet.address);

const rootPath = path.join(__dirname, '../../../'); // relative to ./dist
console.log('rootPath', rootPath)

let CODE_ID: String = gatewayContractCodeId;
let CONTRACT_CODE_HASH: String = gatewayContractCodeHash;

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

  type INIT_MSG = {
    admin: String,
  };

  type CODE_PARAMS = {
    codeId: String,
    contractCodeHash: String,
  };
  
  type CONTRACT_PARAMS = {
    contractAddress: String,
    contractCodeHash: String,
  };

  let instantiateContract = async (params: CODE_PARAMS) => {
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
      admin: gatewayContractAdminAddress,
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

    let contractParams: CONTRACT_PARAMS = {
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
  await instantiateContract(codeParams)
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
