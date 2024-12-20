// generateKeys.js
import { ethers, Wallet } from "ethers";
import { arrayify, SigningKey } from "ethers/lib/utils.js";
import { ecdh } from "@solar-republic/neutrino";
import { base64_to_bytes, sha256 } from "@blake.regalia/belt";
import config from '../../config/deploy.js';

export async function generateKeys() {
  const { secretGateway: { gatewayContractEncryptionKeyForChaChaPoly1305 } } =
  config.secret.network == "testnet"
  ? config.secret.testnet
  : config.secret.localhost;

  let vars;
  if (config.evm.network == "sepolia") {
    vars = config.evm.sepolia;
  } else if (config.evm.network == "localhost") {
    vars = config.evm.localhost;
  } else {
    throw new Error(`Unsupported network.`)
  }
  const { chainId, endpoint, nunyaBusinessContractAddress, gatewayContractAddress, privateKey } = vars;

  if (gatewayContractEncryptionKeyForChaChaPoly1305 == "") {
    throw Error("Unable to obtain Secret Network Gateway information");
  }

  if (!privateKey) {
    console.log("🚫️ You don't have a deployer account configured in environment variables");
    return;
  }
  const wallet = new Wallet(privateKey);
  const address = wallet.address;
  console.log("Generating keys for deployer public address:", address, "\n");
  
  const userPrivateKeyBytes = arrayify(wallet.privateKey);
  const userPublicKey = new SigningKey(wallet.privateKey).compressedPublicKey;
  console.log('userPublicKey: ', userPublicKey);
  const userPublicKeyBytes = arrayify(userPublicKey);
  console.log('userPublicKeyBytes: ', userPublicKeyBytes);
  // Secret Network Testnet
  // https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/supported-networks/secret-gateway/secretpath-testnet-pulsar-3-contracts
  const gatewayContractPublicKey = gatewayContractEncryptionKeyForChaChaPoly1305;
  console.log('gatewayContractPublicKey: ', gatewayContractPublicKey);
  const gatewayContractPublicKeyBytes = base64_to_bytes(gatewayContractPublicKey);
  console.log('gatewayContractPublicKeyBytes: ', gatewayContractPublicKeyBytes);

  // https://github.com/SolarRepublic/neutrino/blob/main/src/secp256k1.ts#L334
  const sharedKey = await sha256(ecdh(userPrivateKeyBytes, gatewayContractPublicKeyBytes));
  console.log('sharedKey: ', sharedKey);

  return { userPublicKey, userPrivateKeyBytes, userPublicKeyBytes, sharedKey };
}
