import { BroadcastMode, SecretNetworkClient, Wallet } from "secretjs";
import * as fs from "fs";
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/config.js';
import { loadDeployed } from "./loadDeployed.js";
import { writeDeployed } from "./writeDeployed.js";

async function main () {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  console.log('__dirname: ', __dirname);
  
  const walletOptions = {
    hdAccountIndex: 0,
    coinType: 529,
    bech32Prefix: 'secret',
  }
  
  let isLocalEvm: boolean;
  let deployed = await loadDeployed();
  let varsDeployedEvm;
  if (deployed.data.evm.network == "sepolia") {
    isLocalEvm = false;
    varsDeployedEvm = deployed.data.evm.sepolia;
  } else if (deployed.data.evm.network == "localhost") {
    isLocalEvm = true;
    varsDeployedEvm = deployed.data.evm.localhost;
  } else {
    throw new Error(`Unsupported network.`)
  }
  const { nunyaBusinessContractAddress } = varsDeployedEvm;
  
  let isLocalSecretDeployed: boolean;
  let varsDeployedSecret;
  if (deployed.data.secret.network == "testnet") {
    isLocalSecretDeployed = false;
    varsDeployedSecret = deployed.data.secret.testnet;
  } else if (deployed.data.secret.network == "localhost") {
    isLocalSecretDeployed = true;
    varsDeployedSecret = deployed.data.secret.localhost;
  } else {
    throw new Error(`Unsupported network.`)
  }
  const { secretGateway: { gatewayContractAddress, gatewayContractCodeHash, gatewayContractPublicKey } } = varsDeployedSecret;
  
  let isLocalSecretInit: boolean;
  let varsSecret;
  if (config.networkSettings.secret.network == "testnet") {
    isLocalSecretInit = false;
    varsSecret = config.networkSettings.secret.testnet;
  } else if (config.networkSettings.secret.network == "localhost") {
    isLocalSecretInit = true;
    varsSecret = config.networkSettings.secret.localhost;
  } else {
    throw new Error(`Unsupported Secret network.`)
  }
  const { walletMnemonic, isOptimizedContractWasm, secretNunya: { nunyaContractWasmPath, nunyaContractWasmPathOptimized }, chainId: secretChainId, endpoint: secretEndpoint } = varsSecret;
  
  // must be all true or all false other
  const arrIsLocal = [isLocalSecretInit, isLocalSecretDeployed, isLocalEvm];
  if (!(arrIsLocal.includes(true) || !arrIsLocal.includes(false))) {
    throw Error("Must choose either local, testnet, or mainnet consistently across networks");
  }
  
  if (walletMnemonic == "") {
    throw Error("Unable to obtain mnemonic phrase");
  }
  
  if (gatewayContractAddress == "" || gatewayContractCodeHash == "" || gatewayContractPublicKey == "") {
    throw Error("Unable to obtain Secret Network Gateway information");
  }
  
  if (nunyaBusinessContractAddress == "" ) {
    throw Error("Unable to obtain Nunya.business EVM contract address");
  }
  
  const wallet = new Wallet(walletMnemonic, walletOptions);
  console.log('wallet address: ', wallet.address);
  
  const rootPath = path.join(__dirname, '../../../'); // relative to ./dist
  console.log('rootPath', rootPath)
  const contractWasmPath = `${rootPath}packages/secret-contracts/nunya-contract/${isOptimizedContractWasm ? "optimized-wasm/" + nunyaContractWasmPathOptimized : nunyaContractWasmPath}`;
  console.log('contractWasmPath: ', contractWasmPath);
  const contract_wasm: any = fs.readFileSync(contractWasmPath);
  // console.log('contract_wasm: ', contract_wasm);
  // Convert from Bytes (Uint8Array) to Base64
  const gatewayContractPublicKeyBase64 = Buffer.from(gatewayContractPublicKey.substring(2), "hex").toString("base64");
  console.log('gatewayContractPublicKeyBase64: ', gatewayContractPublicKeyBase64);
  const secretjs = new SecretNetworkClient({
    chainId: secretChainId,
    url: secretEndpoint || "",
    wallet: wallet,
    walletAddress: wallet.address,
  });
  console.log('secretEndpoint: ', secretEndpoint);
  // console.log('secretjs: ', secretjs);

  const { balance } = await secretjs.query.bank.balance({
    address: wallet.address,
    denom: "uscrt",
  });
  console.log('balance: ', balance);

  type Binary = string;

  type INIT_MSG = {
    gateway_address: string,
    gateway_hash: string,
    gateway_key: Binary,
    nunya_business_contract_address: string,
  };

  type CODE_PARAMS = {
    codeId: string,
    contractCodeHash: string,
  };

  type CONTRACT_PARAMS = {
    contractAddress: string,
    contractCodeHash: string,
  };

  let uploadContract = async () => {
    console.log("Starting deployment...");

    let codeId: string;
    let contractCodeHash: string;
    let tx: any;
    let txParams = {
      sender: wallet.address,
      wasm_byte_code: contract_wasm,
      source: "",
      builder: "",
    };
    // console.log('txParams: ', txParams);
    // ../../packages/secret-contracts-scripts/node_modules/secretjs/src/secret_network_client.ts
    let txOptions = {
      gasLimit: 10_000_000, // default 25_000
      gasPriceInFeeDenom: 1, // default 0.1
      feeDenom: "uscrt",
      feeGranter: wallet.address,
      waitForCommit: true, // default true
      broadcastTimeoutMs: 240_000, // default 60_000
      broadcastCheckIntervalMs: 24_000, // default 6_000 for 6 second block
      broadcastMode: BroadcastMode.Async,
    };
    // console.log('txOptions: ', txOptions);
    try {
      tx = await secretjs.tx.compute.storeCode(txParams, txOptions);
    } catch (e) {
      console.log('error uploading Secret Nunya contract: ', e);
    }
    console.log('tx: ', tx);

    if (typeof tx == undefined) {
      throw Error("Unable to obtain codeId");
    }

    // View tx in block explorer - https://docs.scrt.network/secret-network-documentation/overview-ecosystem-and-technology/ecosystem-overview/explorers-and-tools

    codeId = tx?.arrayLog?.find((log: any) => log?.type === "message" && log?.key === "code_id")?.value;
    console.log('codeId: ', codeId);

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

  let instantiateContract = async (params: CODE_PARAMS) => {
    console.log("Instantiating contract...");
    console.log('params: ', params)
    if (typeof params.codeId == undefined || typeof params.contractCodeHash == undefined) {
      throw Error("Unable to instantiate without codeId and contractCodeHash");
    }

    let contractAddress: string;

    if (!params.codeId || !params.contractCodeHash) {
      throw new Error("codeId or contractCodeHash is not set.");
    }

    let initMsg: INIT_MSG = {
      gateway_address: gatewayContractAddress,
      gateway_hash: gatewayContractCodeHash,
      gateway_key: gatewayContractPublicKeyBase64,
      nunya_business_contract_address: nunyaBusinessContractAddress,
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

  // Chain the execution using promises
  await uploadContract()
    .then(async (res: CODE_PARAMS) => {
      console.log(`CODE_ID: ${res.codeId}`);
      console.log(`CODE_HASH: ${res.contractCodeHash}`);

      let deployed = await loadDeployed();
      // TODO: Add Secret mainnet support
      if (isLocalSecretDeployed) {
        deployed.data.secret.localhost.secretNunya.nunyaContractCodeId = res.codeId;
        deployed.data.secret.localhost.secretNunya.nunyaContractCodeHash = res.contractCodeHash;
      } else {
        deployed.data.secret.testnet.secretNunya.nunyaContractCodeId = res.codeId;
        deployed.data.secret.testnet.secretNunya.nunyaContractCodeHash = res.contractCodeHash;
      }
      await writeDeployed(deployed);

      const codeParams = {
        codeId: res.codeId,
        contractCodeHash: res.contractCodeHash,
      };

      await instantiateContract(codeParams)
        .then(async (contractParams: CONTRACT_PARAMS) => {
          console.log("SECRET_ADDRESS: ", contractParams.contractAddress);

          deployed = await loadDeployed();
          if (isLocalSecretDeployed) {
            deployed.data.secret.localhost.secretNunya.nunyaContractAddress = contractParams.contractAddress;
          } else {
            deployed.data.secret.testnet.secretNunya.nunyaContractAddress = contractParams.contractAddress;
          }
          await writeDeployed(deployed);
        })
        .catch((error: any) => {
          console.error("Error:", error);
        });

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
