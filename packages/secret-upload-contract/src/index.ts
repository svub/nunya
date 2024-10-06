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
const contract_wasm: any = fs.readFileSync(`${rootPath}/packages/secret-contracts/my-counter-contract/contract.wasm`);

const gatewayAddress = "secret10ex7r7c4y704xyu086lf74ymhrqhypayfk7fkj";

const gatewayHash =
  "012dd8efab9526dec294b6898c812ef6f6ad853e32172788f54ef3c305c1ecc5";

const gatewayPublicKey =
  "0x046d0aac3ef10e69055e934ca899f508ba516832dc74aa4ed4d741052ed5a568774d99d3bfed641a7935ae73aac8e34938db747c2f0e8b2aa95c25d069a575cc8b";

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
    codeId: String | undefined,
    contractCodeHash: String | undefined,
  };

  let upload_contract = async () => {
    console.log("Starting deployment...");

    let codeId: String | undefined;
    let contractCodeHash: String | undefined;
    let contractAddress;

    let tx = await secretjs.tx.compute.storeCode(
      {
        sender: wallet.address,
        wasm_byte_code: contract_wasm,
        source: "",
        builder: "",
      },
      {
        gasLimit: 5_000_000,
      }
    );

    codeId = String(
      tx?.arrayLog?.find((log) => log?.type === "message" && log?.key === "code_id")?.value
    );

    console.log("codeId: ", codeId);

    contractCodeHash = (
      await secretjs.query.compute.codeHashByCodeId({ code_id: codeId.toString() })
    ).code_hash;
    console.log(`CODE_HASH: ${contractCodeHash}`);

    return {
      codeId,
      contractCodeHash
    }
  };

  let instantiate_contract = async (params: CODE_PARAMS) => {
    if (!params.codeId || !params.contractCodeHash) {
      throw new Error("codeId or contractCodeHash is not set.");
    }
    console.log("Instantiating contract...");

    let initMsg = {
      gateway_address: gatewayAddress,
      gateway_hash: gatewayHash,
      gateway_key: gatewayPublicKeyBytes,
    };
    let tx = await secretjs.tx.compute.instantiateContract(
      {
        code_id: params.codeId.toString(),
        sender: wallet.address,
        code_hash: params.contractCodeHash.toString(),
        init_msg: initMsg,
        label: "Encrypt " + Math.ceil(Math.random() * 10000),
      },
      {
        gasLimit: 400_000,
      }
    );

    //Find the contract_address in the logs
    const contractAddress = tx?.arrayLog?.find(
      (log) => log?.type === "message" && log?.key === "contract_address"
    )?.value;

    console.log("SECRET_ADDRESS: ", contractAddress);
  };
  
  // Chain the execution using promises
  upload_contract()
    .then((res) => {
      instantiate_contract(res);
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
