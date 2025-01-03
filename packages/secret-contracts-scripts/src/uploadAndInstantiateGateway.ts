import { BroadcastMode, SecretNetworkClient, Wallet } from "secretjs";
import * as fs from "fs";
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/config.js';
import { getSecretGatewayContractKeys } from "./functions/query/getSecretGatewayContractKeys.js";
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
  
  const isLocal = config.networkSettings.secret.network == "localhost";
  const { walletMnemonic, isOptimizedContractWasm, secretNunya: { nunyaContractWasmPath }, secretGateway: { gatewayContractAdminAddress, gatewayContractCodeId, gatewayContractCodeHash, gatewayContractWasmPath, gatewayContractWasmPathOptimized }, chainId: secretChainId, endpoint: secretEndpoint } =
    isLocal == false
    ? config.networkSettings.secret.testnet
    : config.networkSettings.secret.localhost;
  const relayerPath = config.networkSettings.relayer.path;
  
  if (walletMnemonic == "") {
    throw Error("Unable to obtain mnemonic phrase");
  }
  
  const wallet = new Wallet(walletMnemonic, walletOptions);
  console.log('wallet address: ', wallet.address);
  
  const rootPath = path.join(__dirname, '../../../'); // relative to ./dist
  console.log('rootPath', rootPath)
  const secretGatewayContractWASMPath = `${rootPath}packages/secret-contracts/secret-gateway/${isOptimizedContractWasm ? "optimized-wasm/" + gatewayContractWasmPathOptimized : gatewayContractWasmPath}`;
  console.log('secretGatewayContractWASMPath: ', secretGatewayContractWASMPath);
  const secret_gateway_contract_wasm: any = fs.readFileSync(secretGatewayContractWASMPath);
  // console.log('secret_gateway_contract_wasm: ', secret_gateway_contract_wasm);

  const secretjs = new SecretNetworkClient({
    chainId: secretChainId,
    url: secretEndpoint || "",
    wallet: wallet,
    walletAddress: wallet.address,
  });

  console.log('secretEndpoint: ', secretEndpoint);
  // console.log('secretjs: ', secretjs);

  let deployed = await loadDeployed();

  deployed.data.evm.network = config.networkSettings.evm.network;
  deployed.data.secret.network = config.networkSettings.secret.network;

  if (isLocal) {
    console.log("isLocal - relayerPath: ", relayerPath);
    deployed.data.relayer.path = relayerPath;

    deployed.data.secret.localhost.chainId = secretChainId;
    deployed.data.secret.localhost.endpoint = secretEndpoint;
  } else {
    console.log("isLocal - relayerPath: ", relayerPath);
    deployed.data.relayer.path = relayerPath;

    deployed.data.secret.testnet.chainId = secretChainId;
    deployed.data.secret.testnet.endpoint = secretEndpoint;
  }
  await writeDeployed(deployed);

  const { balance } = await secretjs.query.bank.balance({
    address: wallet.address,
    denom: "uscrt",
  });

  console.log('balance: ', balance);

  type INIT_MSG = {
    admin: string,
  };

  type CODE_PARAMS = {
    codeId: string,
    contractCodeHash: string,
  };

  type CONTRACT_PARAMS = {
    contractAddress: string,
    contractCodeHash: string,
  };

  // TODO: Refactor into its own file
  let uploadContract = async () => {
    console.log("Starting deployment...");

    let codeId: string;
    let contractCodeHash: string;
    let tx: any;
    let txParams = {
      sender: wallet.address,
      wasm_byte_code: secret_gateway_contract_wasm,
      source: "",
      builder: "",
    };
    // ../../packages/secret-contracts-scripts/node_modules/secretjs/src/secret_network_client.ts
    let txOptions = {
      // requires gasLimit of 5844449 to deploy locally
      gasLimit: 6_000_000, // default 25_000
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

    codeId = tx?.arrayLog?.find((log: any) => log?.type === "message" && log?.key === "code_id")?.value;

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

  // TODO: Refactor into its own file
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
  
  // Chain the execution using promises
  await uploadContract()
    .then(async (res: CODE_PARAMS) => {
      console.log(`CODE_ID: ${res.codeId}`);
      console.log(`CODE_HASH: ${res.contractCodeHash}`);

      let deployed = await loadDeployed();
      if (isLocal) {
        deployed.data.secret.localhost.secretGateway.gatewayContractAdminAddress = gatewayContractAdminAddress;

        deployed.data.secret.localhost.secretGateway.gatewayContractCodeId = res.codeId;
        deployed.data.secret.localhost.secretGateway.gatewayContractCodeHash = res.contractCodeHash;
      } else {
        deployed.data.secret.testnet.secretGateway.gatewayContractAdminAddress = gatewayContractAdminAddress;

        deployed.data.secret.testnet.secretGateway.gatewayContractCodeId = res.codeId;
        deployed.data.secret.testnet.secretGateway.gatewayContractCodeHash = res.contractCodeHash;
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
          if (isLocal) {
            deployed.data.secret.localhost.secretGateway.gatewayContractAddress = contractParams.contractAddress;
          } else {
            deployed.data.secret.testnet.secretGateway.gatewayContractAddress = contractParams.contractAddress;
          }
          await writeDeployed(deployed);

          // TODO: Refactor and put common types in types.ts
          type EphemeralKeys = {
            encryption_key: string,
            verification_key: string,
          }

          let params = {
            endpoint: secretEndpoint,
            chainId: secretChainId,
            contractAddress: contractParams.contractAddress,
            contractCodeHash: res.contractCodeHash,
          };

          // Fetch the latest from the Secret Gateway since it is generated randomly when instantiated rather than rely on user having populated it in config.ts already
          const secretGatewayContractKeys: EphemeralKeys = await getSecretGatewayContractKeys(params);
          console.log('secretGatewayContractKeys.encryption_key: ', secretGatewayContractKeys.encryption_key);
          console.log('secretGatewayContractKeys.verification_key: ', secretGatewayContractKeys.verification_key);

          deployed = await loadDeployed();
          if (isLocal) {
            deployed.data.secret.localhost.secretGateway.gatewayContractEncryptionKeyForChaChaPoly1305 = secretGatewayContractKeys.encryption_key;
            deployed.data.secret.localhost.secretGateway.gatewayContractPublicKey = secretGatewayContractKeys.verification_key;
          } else {
            deployed.data.secret.testnet.secretGateway.gatewayContractEncryptionKeyForChaChaPoly1305 = secretGatewayContractKeys.encryption_key;
            deployed.data.secret.testnet.secretGateway.gatewayContractPublicKey = secretGatewayContractKeys.verification_key;
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
