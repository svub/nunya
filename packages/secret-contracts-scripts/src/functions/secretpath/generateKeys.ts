// generateKeys.js
import { ethers, Wallet } from "ethers";
import { arrayify, SigningKey } from "ethers/lib/utils";
import { ecdh } from "@solar-republic/neutrino";
import { base64_to_bytes, sha256 } from "@blake.regalia/belt";
import config from '../../config/deploy';

export async function generateKeys() {
  const { gatewayEncryptionKeyForChaChaPoly1305 } =
  config.secret.network == "testnet"
  ? config.secret.testnet
  : config.secret.local;

  if (gatewayEncryptionKeyForChaChaPoly1305 == "") {
    throw Error("Unable to obtain Secret Network Gateway information");
  }

  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

  if (!privateKey) {
    console.log("🚫️ You don't have a deployer account configured in environment variables");
    return;
  }
  const wallet = new Wallet(privateKey);
  const address = wallet.address;
  console.log("Generating keys for deployer public address:", address, "\n");
  
  const userPrivateKeyBytes = arrayify(wallet.privateKey);
  const userPublicKey = new SigningKey(wallet.privateKey).compressedPublicKey;
  const userPublicKeyBytes = arrayify(userPublicKey);
  // Secret Network Testnet
  // https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/supported-networks/secret-gateway/secretpath-testnet-pulsar-3-contracts
  const gatewayPublicKey = gatewayEncryptionKeyForChaChaPoly1305;
  const gatewayPublicKeyBytes = base64_to_bytes(gatewayPublicKey);

  const sharedKey = await sha256(ecdh(userPrivateKeyBytes, gatewayPublicKeyBytes));

  return { userPrivateKeyBytes, userPublicKeyBytes, sharedKey };
}
