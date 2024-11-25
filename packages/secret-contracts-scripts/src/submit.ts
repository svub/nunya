// // reference: https://github.com/writersblockchain/secretpath-ballz
import * as dotenv from "dotenv";
dotenv.config();
import { ethers, Wallet } from "ethers";
// import abi from "./config/abi.js";
import config from './config/deploy.js';
import gatewayAbi from "../../hardhat/artifacts/contracts/Gateway.sol/Gateway.json" assert { type: "json" };
import nunyaAbi from "../../hardhat/artifacts/contracts/NunyaBusiness.sol/NunyaBusiness.json" assert { type: "json" };
import { generateKeys } from "./functions/secretpath/generateKeys.js";
// import { getPublicClientAddress } from "./functions/secretpath/getPublicClientAddress";
// import { constructPayload } from "./functions/secretpath/constructPayload";
// import { encryptPayload } from "./functions/secretpath/encryptPayload";
// import { queryPubkey } from "./functions/query/queryPubkey";
// import { hexlify } from "ethers/lib/utils";

if (config.evm.network != "sepolia") {
  console.error("Unsupported network");
}

const { contractCodeHash, secretContractAddress } =
  config.secret.network == "testnet"
  ? config.secret.testnet
  : config.secret.local;

const { chainId, endpoint, nunyaBusinessContractAddress, gatewayContractAddress, privateKey } =
  config.evm.sepolia;

const SECRET_ADDRESS = secretContractAddress;
const CONTRACT_CODE_HASH = contractCodeHash;

// relates to unsafeRequestSecretContractPubkey
async function unsafeRequestSecretContractPubkey() {
//   // Ethereum Sepolia
//   // IGNORE
  // const gatewayAddressInstance = "0x5Be91fd4b49489bb3aEc8bE2F5Fa1d83FD8C5A1b";
  // const nunyaAddressInstance = "0x41E52332e76988AFBc38280583a7A02492177C65";
  const ifaceGateway = new ethers.utils.Interface(gatewayAbi.abi);
  const ifaceNunya = new ethers.utils.Interface(nunyaAbi.abi);

  const routing_contract = SECRET_ADDRESS;
  const routing_code_hash = CONTRACT_CODE_HASH;

//   // https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/supported-networks/evm/gateway-contract-abi
//   const iface = new ethers.utils.Interface(abi);
  
  if (!privateKey) {
    console.log("🚫️ You don't have a deployer account. Run `yarn generate` first");
    return;
  }

  let provider;
  provider = new ethers.providers.JsonRpcProvider(endpoint);
  console.log(provider);
  await provider.detectNetwork();
  const signer = new Wallet(privateKey, provider);
  const address = signer.address;
  console.log("Public address:", address, "\n");
  signer.connect(provider);
  console.log("signer is: ", provider.getSigner());
  const balance = await provider.getBalance(address);
  console.log("balance:", +ethers.utils.formatEther(balance));
  console.log("nonce:", +(await provider.getTransactionCount(address)));

  const blockNumber = await provider.getBlockNumber();
  console.log("Current block number: ", blockNumber);

  // const { userPrivateKeyBytes, userPublicKeyBytes, sharedKey } = await generateKeys();
  const res = await generateKeys();
  console.log('res: ', res);
//   // TODO: should this be `upgradeHandler`
//   const callbackSelector = iface.getSighash(
//     iface.getFunction("upgradeHandler")
//   );

//   console.log("callbackSelector: ", callbackSelector);

//   const callbackGasLimit = 90000;
//   // The function name of the function that is called on the private contract
//   const handle = "request_value";

//   // Data are the calldata/parameters that are passed into the contract
//   // TODO: change this depending on function being called
//   const data = JSON.stringify({ address: myAddress });

  const chainId2 = (await provider.getNetwork()).chainId.toString();
  console.log("chainId2: ", chainId2);

//   const publicClientAddress = await getPublicClientAddress(chainId);

//   const callbackAddress = publicClientAddress.toLowerCase();
//   console.log("callback address: ", callbackAddress);

//   // Payload construction
//   const payload = constructPayload(
//     data,
//     routing_contract,
//     routing_code_hash,
//     myAddress,
//     userPublicKeyBytes,
//     callbackAddress,
//     callbackSelector,
//     callbackGasLimit
//   );

//   const {
//     ciphertext,
//     payloadHash,
//     payloadSignature,
//     _info,
//   } = await encryptPayload(
//     payload,
//     sharedKey,
//     provider,
//     myAddress,
//     userPublicKeyBytes,
//     routing_code_hash,
//     handle,
//     callbackGasLimit,
//     iface,
//     callbackSelector
//   );

//   const functionData = iface.encodeFunctionData("send", [
//     payloadHash,
//     myAddress,
//     routing_contract,
//     _info,
//   ]);

//   const feeData = await provider.getFeeData();
//   const maxFeePerGas = feeData.maxFeePerGas;
//   const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
//   const gasFee =
//     maxFeePerGas && maxPriorityFeePerGas
//       ? maxFeePerGas.add(maxPriorityFeePerGas)
//       : await provider.getGasPrice();

//   let amountOfGas;
//   let my_gas = 150000;

//   if (chainId === "4202") {
//     amountOfGas = gasFee.mul(callbackGasLimit).mul(100000).div(2);
//   } else if (chainId === "128123") {
//     amountOfGas = gasFee.mul(callbackGasLimit).mul(1000).div(2);
//     my_gas = 15000000;
//   } else if (chainId === "1287") {
//     amountOfGas = gasFee.mul(callbackGasLimit).mul(1000).div(2);
//     my_gas = 15000000;
//   } else if (chainId === "300") {
//     amountOfGas = gasFee.mul(callbackGasLimit).mul(100000).div(2);
//     my_gas = 15000000;
//   } else if (chainId === "5003") {
//     amountOfGas = gasFee.mul(callbackGasLimit).mul(1000000).div(2);
//     my_gas = 1500000000;
//   } else if (chainId === "80002") {
//     amountOfGas = gasFee.mul(callbackGasLimit).mul(100).div(2);
//     my_gas = 200000;
//   } else if (chainId === "1995") {
//     amountOfGas = gasFee.mul(callbackGasLimit).mul(100).div(2);
//     my_gas = 200000;
//   } else if (chainId === "713715") {
//     amountOfGas = gasFee.mul(callbackGasLimit).mul(100).div(2);
//     my_gas = 200000;
//   } else {
//     // Note: Sepolia Ethereum has chainId 11155111
//     amountOfGas = gasFee.mul(callbackGasLimit).mul(3).div(2);
//   }

//   const tx_params = {
//     gas: hexlify(my_gas),
//     to: publicClientAddress,
//     from: myAddress,
//     value: hexlify(amountOfGas),
//     data: functionData,
//   };

//   const txHash = await provider.send("eth_sendTransaction", [tx_params]);

//   let params = {
//     endpoint: endpoint,
//     chainId: chainId,
//     contractAddress: SECRET_ADDRESS,
//     contractCodeHash: CONTRACT_CODE_HASH,
//   };
//   const publicKey = await queryPubkey(params);
//   console.log("Public key of private Secret Network contract:", publicKey);
//   console.log(`Transaction Hash: ${txHash}`);
}

async function main() {
  await unsafeRequestSecretContractPubkey();
}

main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
