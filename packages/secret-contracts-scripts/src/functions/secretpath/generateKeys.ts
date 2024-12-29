// generateKeys.js
import { ethers, Wallet } from "ethers";
import { arrayify, SigningKey } from "ethers/lib/utils.js";
// import { ecdh } from "@solar-republic/neutrino";
import * as secp from "@noble/secp256k1";
import { base64_to_bytes, sha256 } from "@blake.regalia/belt";
import config from '../../config/config.js';
import { getSecretGatewayContractKeys } from "../query/getSecretGatewayContractKeys.js";
import { assert } from "console";

// Polyfill thankfully suggested here https://www.npmjs.com/package/@noble/secp256k1 to overcome error
// `ReferenceError: crypto is not defined` when performing `await sha256`
import { webcrypto } from 'node:crypto';
// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;

// Generate ephermal keys and load in the public encryption key for the Secret Gateway.
// Then, use ECDH to create the encryption key
// Reference: https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/usecases/vrf/using-encrypted-payloads-for-vrf#generating-the-encryption-key-using-ecdh
export async function generateKeys() {
  const { chainId, endpoint, secretNunya: { nunyaContractAddress, nunyaContractCodeHash }, secretGateway: { gatewayContractAddress, gatewayContractCodeHash, gatewayContractEncryptionKeyForChaChaPoly1305 } } =
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
  const { privateKey } = vars;

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
  // Secret Network Gateway
  // https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/supported-networks/secret-gateway/secretpath-testnet-pulsar-3-contracts
  // Note: If you provide an invalid Secret Gateway public key you may get error:
  // `Error: Invalid point data`
  // const secretGatewayContractEncryptionKey = gatewayContractEncryptionKeyForChaChaPoly1305;

  let params = {
    endpoint: endpoint,
    chainId: chainId,
    contractAddress: gatewayContractAddress,
    contractCodeHash: gatewayContractCodeHash,
  };

  // TODO: Refactor and put common types in types.ts
  type EphemeralKeys = {
    encryption_key: string,
    verification_key: string, // public key
  }

  // Fetch the latest from the Secret Gateway since it is generated randomly when instantiated rather than rely on user having populated it in config.ts already
  const secretGatewayContractKeys: EphemeralKeys = await getSecretGatewayContractKeys(params);
  console.log('secretGatewayContractKeys.encryption_key: ', secretGatewayContractKeys.encryption_key);
  const secretGatewayContractEncryptionKeyBytes = base64_to_bytes(secretGatewayContractKeys.encryption_key);
  console.log('secretGatewayContractEncryptionKeyBytes: ', secretGatewayContractEncryptionKeyBytes);

  // https://github.com/SolarRepublic/neutrino/blob/main/src/secp256k1.ts#L334
  // `ReferenceError: crypto is not defined` error is caused by `await sha256`
  // at sha256 (file:///root/nunya/packages/secret-contracts-scripts/node_modules/@blake.regalia/belt/dist/mjs/data.js:80:56)
  // const sharedSecret = ecdh(userPrivateKeyBytes, secretGatewayContractEncryptionKeyBytes);
  // const sharedKey = await sha256(ecdh(userPrivateKeyBytes, secretGatewayContractEncryptionKeyBytes));

  const secretGatewayContractPublicKeyHex = ["0x", secp.etc.bytesToHex(secretGatewayContractEncryptionKeyBytes)].join("");
  console.log('secretGatewayContractPublicKeyHex: ', secretGatewayContractPublicKeyHex);
  assert!(secp.utils.isValidPrivateKey((wallet.privateKey).slice(2)), "invalid private key");
  const sharedSecret = secp.getSharedSecret((wallet.privateKey).slice(2), secp.etc.bytesToHex(secretGatewayContractEncryptionKeyBytes));
  console.log('sharedSecret: ', sharedSecret);
  const sharedKey = await sha256(sharedSecret);
  console.log('sharedKey: ', sharedKey);

  return { userPublicKey, userPrivateKeyBytes, userPublicKeyBytes, sharedKey };
}
