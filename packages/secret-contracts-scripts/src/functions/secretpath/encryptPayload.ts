import * as secp from "@noble/secp256k1";
import {
  bytes_to_base64,
  uint32_to_bytes_be,
  biguint_to_bytes_be,
  json_to_bytes,
  concat,
  bytes,
  text_to_bytes,
} from "@blake.regalia/belt";
import { chacha20_poly1305_seal } from "@solar-republic/neutrino";
import {
  keccak256,
  arrayify,
  recoverPublicKey,
  hexlify,
} from "ethers/lib/utils.js";

// Polyfill thankfully suggested here https://www.npmjs.com/package/@noble/secp256k1 to overcome error
// `ReferenceError: crypto is not defined` when performing `await sha256`
import { webcrypto } from 'node:crypto';
// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = webcrypto;

// https://stackoverflow.com/questions/72476017/how-to-convert-a-javascript-number-to-a-uint8array#72476502
function numToUint8Array(num: any) {
  let arr = new Uint8Array(12);

  for (let i = 11; i >= 0; i--) {
    arr[i] = num % 256;
    num = Math.floor(num / 256);
  }

  return arr;
}

function uint8ArrayToNumV2(arr: any) {
  let num = 0;

  for (let i = 0; i <= 11; i++) {
    num = num * 256 + arr[i];
  }

  return num;
}

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
  callbackSelector: any,
  task_destination_network: any,
  nextNonceNum: any,
) {

  let nextNonceUint8Array: Uint8Array = numToUint8Array(nextNonceNum);
  console.log("nextNonceUint8Array: ", nextNonceUint8Array);
  console.log("uint8ArrayToNumV2: ", uint8ArrayToNumV2(nextNonceUint8Array));

  console.log("encryptPayload");
  const plaintext = json_to_bytes(payload);
  // https://github.com/blake-regalia/belt/blob/main/src/data.ts
  // uint32_to_bytes_be
  // biguint_to_bytes_be

  const nonce: Uint8Array = nextNonceUint8Array;
  // Alternative approaches below work
  // const nonce: Uint8Array = biguint_to_bytes_be(BigInt(nextNonceNum));
  // const nonce: Uint8Array = uint32_to_bytes_be(nextNonceNum);
  // const nonce = crypto.getRandomValues(bytes(12));

  // Does not work. No context of `window` since not using frontend here
  // const nonce = window.crypto.getRandomValues(bytes(12));

  const [ciphertextClient, tagClient] = chacha20_poly1305_seal(
    sharedKey,
    nonce,
    plaintext
  );
  const ciphertext = concat([ciphertextClient, tagClient]);
  console.log("ciphertext: ", ciphertext);
  const ciphertextHash = keccak256(ciphertext);
  const message = text_to_bytes("\x19Ethereum Signed Message:\n32");
  const payloadHash = keccak256(
    concat([
      message,
      arrayify(ciphertextHash),
    ])
  );
  const msgParams = ciphertextHash;

  // Note: msgParams and myAddress parameters are in opposite order when not using Metamask to sign
  const params = [msgParams, myAddress];
  const method = "personal_sign";
  const payloadSignature = await provider.send(method, params);
  console.log("payloadSignature: ", payloadSignature);
  const user_pubkey = recoverPublicKey(payloadHash, payloadSignature);
  console.log("user_pubkey: ", user_pubkey);
  const user_pubkey_base64 = bytes_to_base64(secp.etc.hexToBytes(user_pubkey.slice(2)));
  console.log("user_pubkey_base64: ", user_pubkey_base64);

  const _info = {
    user_key: hexlify(userPublicKeyBytes),
    user_pubkey: user_pubkey,
    routing_code_hash: routing_code_hash,
    task_destination_network: task_destination_network,
    handle: handle,
    nonce: hexlify(nonce),
    payload: hexlify(ciphertext),
    payload_signature: payloadSignature,
    callback_gas_limit: callbackGasLimit,
  };
  console.log("info: ", JSON.stringify(_info, null, 2));

  return { ciphertext, payloadHash, payloadSignature, _info };
}
