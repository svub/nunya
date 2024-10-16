import {
    json_to_bytes,
    bytes,
    concat,
    text_to_bytes,
    JsonValue,
    base64_to_bytes,
    sha256,
  } from "@blake.regalia/belt";
  import { chacha20_poly1305_seal, ecdh } from "@solar-republic/neutrino";
  import ethers, {
    keccak256,
    hexlify,
    SigningKey,
  } from "ethers";
  
  interface EncryptPayloadParams {
    payload: JsonValue;
    sharedKey: Uint8Array;
    provider: any;
    myAddress: string;
    userPublicKeyBytes: Uint8Array;
    routing_code_hash: string;
    handle: string;
    callbackGasLimit: number;
  }
  
  interface EncryptPayloadResult {
    ciphertext: Uint8Array;
    payloadHash: string;
    payloadSignature: string;
    _info: {
      user_key: string;
      user_pubkey: string;
      routing_code_hash: string;
      task_destination_network: string;
      handle: string;
      nonce: string;
      payload: string;
      payload_signature: string;
      callback_gas_limit: number;
    };
  }

  export async function encyptPayload(payload: []) {
    const { /*userPrivateKeyBytes,*/ userPublicKeyBytes, sharedKey } = await generateKeys();
    const provider = new ethers.BrowserProvider(window.ethereum, "any");
    const [myAddress] = await provider.send("eth_requestAccounts", []);
    const callbackGasLimit = 90000;
    const handle = "TODO"; // TODO needed?
    const routing_code_hash = "TODO" // TODO needed?

    return _encryptPayload({
        payload,
        sharedKey,
        provider,
        myAddress,
        userPublicKeyBytes,
        routing_code_hash,
        handle,
        callbackGasLimit,
    });
  }
  
// adapted from https://github.com/writersblockchain/evm-kv-store-demo/blob/main/kv-store-frontend/src/functions/secretpath/encryptPayload.js
async function _encryptPayload({
    payload,
    sharedKey,
    provider,
    myAddress,
    userPublicKeyBytes,
    routing_code_hash,
    handle,
    callbackGasLimit,
  }: EncryptPayloadParams): Promise<EncryptPayloadResult> {
    // TODO not memory preserving/efficient; 
    const plaintext = json_to_bytes(payload);
    const nonce = window.crypto.getRandomValues(bytes(12));
    const [ciphertextClient, tagClient] = chacha20_poly1305_seal(sharedKey, nonce, plaintext);
    const ciphertext = concat([ciphertextClient, tagClient]);
    const ciphertextHash = keccak256(ciphertext);
    
    const payloadHash = keccak256(
      concat([
        text_to_bytes("\x19Ethereum Signed Message:\n32"),
        // QUESTION original code uses arrayify (not included in ethers v6) -- why not using text_to_bytes as well?
        // arrayify(ciphertextHash),
        ethers.getBytes(ciphertextHash)
      ])
    );
    
    const params = [myAddress, ciphertextHash];
    const method = "personal_sign";
    const payloadSignature = await provider.send(method, params);
    const user_pubkey = ethers.SigningKey.recoverPublicKey(payloadHash, payloadSignature);
    
    const _info = {
      // QUESTION `userPublicKeyBytes` is returned unchanged from function parameters. Needed?
      user_key: hexlify(userPublicKeyBytes),
      user_pubkey: user_pubkey,
      routing_code_hash: routing_code_hash,
      task_destination_network: "pulsar-3",
      handle: handle,
      nonce: hexlify(nonce),
      payload: hexlify(ciphertext),
      payload_signature: payloadSignature,
      callback_gas_limit: callbackGasLimit,
    };
    
    return { ciphertext, payloadHash, payloadSignature, _info };
  }

  // adapted from https://github.com/writersblockchain/evm-kv-store-demo/blob/main/kv-store-frontend/src/functions/secretpath/generateKeys.js
  async function generateKeys() {
    const wallet = ethers.Wallet.createRandom();
    const userPrivateKeyBytes = ethers.getBytes(wallet.privateKey);
    const userPublicKey = new SigningKey(wallet.privateKey).compressedPublicKey;
    const userPublicKeyBytes = ethers.getBytes(userPublicKey);
    const gatewayPublicKey = "A20KrD7xDmkFXpNMqJn1CLpRaDLcdKpO1NdBBS7VpWh3";
    const gatewayPublicKeyBytes = base64_to_bytes(gatewayPublicKey);
  
    const sharedKey = await sha256(ecdh(userPrivateKeyBytes, gatewayPublicKeyBytes));
  
    return { userPrivateKeyBytes, userPublicKeyBytes, sharedKey };
  }