import {
  json_to_bytes,
  bytes,
  concat,
  text_to_bytes,
} from "@blake.regalia/belt";
import { chacha20_poly1305_seal } from "@solar-republic/neutrino";
import {
  keccak256,
  arrayify,
  recoverPublicKey,
  hexlify,
} from "ethers/lib/utils.js";
import config from '../../config/deploy.js';

const { chainId, secretGateway: { gatewayContractEncryptionKeyForChaChaPoly1305 } } =
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
const { } = vars;


export async function encryptPayload(
  payload: any,
  sharedKey: any,
  provider: any,
  myAddress: any,
  userPublicKeyBytes: any,
  routing_code_hash: any,
  handle: any,
  callbackGasLimit: any,
  iface: any,
  callbackSelector: any
) {
  const plaintext = json_to_bytes(payload);
  const nonce = crypto.getRandomValues(bytes(12));
  // const nonce = window.crypto.getRandomValues(bytes(12));

  const [ciphertextClient, tagClient] = chacha20_poly1305_seal(
    sharedKey,
    nonce,
    plaintext
  );
  const ciphertext = concat([ciphertextClient, tagClient]);
  const ciphertextHash = keccak256(ciphertext);
  const payloadHash = keccak256(
    concat([
      text_to_bytes("\x19Ethereum Signed Message:\n32"),
      arrayify(ciphertextHash),
    ])
  );
  const msgParams = ciphertextHash;

  // FIXME: Do this without Metamask sign approach
  const params = [myAddress, msgParams];
  const method = "personal_sign";
  const payloadSignature = await provider.send(method, params);
  const user_pubkey = recoverPublicKey(payloadHash, payloadSignature);

  const _info = {
    user_key: hexlify(userPublicKeyBytes),
    user_pubkey: user_pubkey,
    routing_code_hash: routing_code_hash,
    task_destination_network: chainId,
    handle: handle,
    nonce: hexlify(nonce),
    payload: hexlify(ciphertext),
    payload_signature: payloadSignature,
    callback_gas_limit: callbackGasLimit,
  };

  return { ciphertext, payloadHash, payloadSignature, _info };
}
