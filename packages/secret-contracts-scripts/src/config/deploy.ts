import dotenv from "dotenv";
dotenv.config();

// https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/supported-networks/secret-gateway/secretpath-testnet-pulsar-3-contracts
// https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/supported-networks/secret-gateway/secretpath-mainnet-secret-4-contracts

const config = {
  evm: {
    network: "localhost",
    localhost: {
      chainId: 31337,
      endpoint: "http://127.0.0.1:8545/",
      // Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
      privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      // Obtained from ./packages/secret-contracts-scripts/src/functions/secretpath/generateKeys.ts
      publicKey: "0x038318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75",
      nunyaBusinessContractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // only know after deploy
      gatewayContractAddress: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", // only know after deploy
    },
    sepolia: {
      chainId: 11155111,
      endpoint: process.env.PROVIDER_RPC_ETHEREUM_SEPOLIA,
      privateKey: process.env.DEPLOYER_PRIVATE_KEY,
      nunyaBusinessContractAddress: "0xAFFF311821C3F3AF863C7103BB17BDC1Ba04603D", // only know after deploy
      gatewayContractAddress: "0x1E4B12A9F82b33DA1127B27861EFf5E652de7a6F", // only know after deploy
    }
  },
  secret: {
    network: "localhost",
    mainnet: {
      walletMnemonic: process.env.WALLET_MNEMONIC_MAINNET,
      isOptimizedContractWasm: true,
      // https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/supported-networks/secret-gateway
      chainId: "secret-4",
      endpoint: process.env.ENDPOINT_MAINNET, 
      secretNunya: {
        nunyaContractCodeId: "", // only know after upload
        nunyaContractCodeHash: "", // only know after upload
        nunyaContractAddress: "", // only know after instantiate
        nunyaContractWasmPath: "contract.wasm.gz",
      },
      secretGateway: {
        // https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/supported-networks/secret-gateway/secretpath-mainnet-secret-4-contracts
        gatewayContractCodeId: "1533",
        gatewayContractAddress: "secret1qzk574v8lckjmqdg3r3qf3337pk45m7qd8x02a",
        gatewayContractCodeHash: "012dd8efab9526dec294b6898c812ef6f6ad853e32172788f54ef3c305c1ecc5",
        gatewayContractAdminAddress: "secret1glfedwlusunwly7q05umghzwl6nf2vj6wr38fg",
        gatewayContractPublicKey: "0x04a0d632acd0d2f5da02fc385ea30a8deab4d5639d1a821a3a552625ad0f1759d0d2e80ca3adb236d90caf1b12e0ddf3a351c5729b5e00505472dca6fed5c31e2a",
        gatewayContractEncryptionKeyForChaChaPoly1305: "AqDWMqzQ0vXaAvw4XqMKjeq01WOdGoIaOlUmJa0PF1nQ",
        gatewayContractWasmPath: "secret-gateway-contract.wasm.gz",
      }
    },
    testnet: {
      walletMnemonic: process.env.WALLET_MNEMONIC_TESTNET,
      isOptimizedContractWasm: true,
      chainId: "pulsar-3",
      endpoint: process.env.ENDPOINT_TESTNET,
      secretNunya: {
        nunyaContractCodeId: "12247", // only know after upload
        nunyaContractCodeHash: "b44049cbf187939df9f9857905197ecbc06e99702b3332b12cb6d968f39d88b2", // only know after upload
        nunyaContractAddress: "secret1h09whd3z8s9ms66mavd9rjm8r2rpew2trm0nkp", // only know after instantiate
        nunyaContractWasmPath: "contract.wasm.gz",
      },
      secretGateway: {
        // https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/supported-networks/secret-gateway/secretpath-testnet-pulsar-3-contracts
        gatewayContractCodeId: "3375",
        gatewayContractAddress: "secret10ex7r7c4y704xyu086lf74ymhrqhypayfk7fkj",
        gatewayContractCodeHash: "ad8ca07ffba1cb26ebf952c29bc4eced8319c171430993e5b5089887f27b3f70",
        gatewayContractAdminAddress: "secret1glfedwlusunwly7q05umghzwl6nf2vj6wr38fg",
        gatewayContractPublicKey: "0x046d0aac3ef10e69055e934ca899f508ba516832dc74aa4ed4d741052ed5a568774d99d3bfed641a7935ae73aac8e34938db747c2f0e8b2aa95c25d069a575cc8b",
        gatewayContractEncryptionKeyForChaChaPoly1305: "A20KrD7xDmkFXpNMqJn1CLpRaDLcdKpO1NdBBS7VpWh3",
        gatewayContractWasmPath: "secret-gateway-contract.wasm.gz",
      }
    },
    localhost: {
      walletMnemonic: process.env.WALLET_MNEMONIC_LOCAL,
      isOptimizedContractWasm: false,
      chainId: "secretdev-1",
      endpoint: process.env.ENDPOINT_LOCAL,
      secretNunya: {
        nunyaContractCodeId: "2", // only know after upload
        nunyaContractCodeHash: "0e1904c8f258b365d24865041ab51de62fdbf515d15e8fe785774662201c809a", // only know after upload
        nunyaContractAddress: "secret1gyruqan6yxf0q423t8z5zce3x7np35uw8s8wqc", // only know after instantiate
        nunyaContractWasmPath: "contract.wasm.gz",
      },
      secretGateway: {
        gatewayContractCodeId: "1", // only know after upload
        gatewayContractAddress: "secret1mfk7n6mc2cg6lznujmeckdh4x0a5ezf6hx6y8q", // only know after instantiate
        // IMPORTANT: If this changes, then you need to update the Relayer config.yml file to match this value
        // otherwise you will get an error `Message contains mismatched contract hash` whenever you try to interact
        // with the Secret Gateway via the Relayer.
        //   "secretdev-1": # Secret Localhost 
        //     code_hash: "..."
        gatewayContractCodeHash: "b9fb512153812cd554884922d10c007bef9d2749d14ae9fda445e83710ee8c10", // only know after upload
        // Generated with Keplar wallet using "Connect with Google" to obtain a private key and used in the
        // .env file of the custom Secret Relayer. The `pub_key` associated with it may be obtained through debugging
        // `account_info = data.get('account', {})` in the Relayer with `self.logger.info(f"sync_account_number_and_sequence: account_info {account_info}")`
        // Address: secret1glfedwlusunwly7q05umghzwl6nf2vj6wr38fg
        // 'pub_key': {'@type': '/cosmos.crypto.secp256k1.PubKey', 'key': 'A4K+MyJNnNcdt78SncjhArLWNnDRHapkZFsemjmf9/7A'
        gatewayContractAdminAddress: "secret1glfedwlusunwly7q05umghzwl6nf2vj6wr38fg",
        // obtain from running `yarn run secret:querySecretGatewayPubkey`
        gatewayContractPublicKey: "0x04a8e8ea80598d85feb3ae5f3ffb8054cc45f58e635f015a4d44bdbfa96a7a56e1237bb5cd3bdd026773657869e7e03be9887339ff689ad71616e2f1cf8786bae5",
        // obtain from running `yarn run secret:querySecretGatewayPubkey`
        // Note: Used in generateKey.ts
        gatewayContractEncryptionKeyForChaChaPoly1305: "A6jo6oBZjYX+s65fP/uAVMxF9Y5jXwFaTUS9v6lqelbh",
        gatewayContractWasmPath: "secret-gateway-contract.wasm.gz",
      }
    }
  }
};

export default config;
