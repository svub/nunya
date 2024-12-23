// generateKeys.js
import { ethers } from "ethers";
import { arrayify, SigningKey } from "ethers/lib/utils";
import { ecdh } from "@solar-republic/neutrino";
import { base64_to_bytes, sha256 } from "@blake.regalia/belt";

export async function generateKeys() {
  const wallet = ethers.Wallet.createRandom();
  const userPrivateKeyBytes = arrayify(wallet.privateKey);
  const userPublicKey = new SigningKey(wallet.privateKey).compressedPublicKey;
  const userPublicKeyBytes = arrayify(userPublicKey);
  const gatewayPublicKey = "A20KrD7xDmkFXpNMqJn1CLpRaDLcdKpO1NdBBS7VpWh3";
  const gatewayPublicKeyBytes = base64_to_bytes(gatewayPublicKey);

  const sharedKey = await sha256(ecdh(userPrivateKeyBytes, gatewayPublicKeyBytes));

  return { userPrivateKeyBytes, userPublicKeyBytes, sharedKey };
}