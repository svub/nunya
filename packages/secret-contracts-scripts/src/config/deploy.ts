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
      wasmContractPath: "secret_evm_storage.wasm.gz",
      // https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/supported-networks/secret-gateway
      gatewayAddress: "secret1qzk574v8lckjmqdg3r3qf3337pk45m7qd8x02a",
      gatewayHash: "012dd8efab9526dec294b6898c812ef6f6ad853e32172788f54ef3c305c1ecc5",
      gatewayPublicKey: "0x04a0d632acd0d2f5da02fc385ea30a8deab4d5639d1a821a3a552625ad0f1759d0d2e80ca3adb236d90caf1b12e0ddf3a351c5729b5e00505472dca6fed5c31e2a",
      gatewayEncryptionKeyForChaChaPoly1305: "AqDWMqzQ0vXaAvw4XqMKjeq01WOdGoIaOlUmJa0PF1nQ",
      chainId: "secret-4",
      endpoint: process.env.ENDPOINT_MAINNET,
      codeId: "", // only know after upload
      contractCodeHash: "", // only know after upload
      secretContractAddress: "", // only know after instantiate
    },
    testnet: {
      walletMnemonic: process.env.WALLET_MNEMONIC_TESTNET,
      isOptimizedContractWasm: true,
      wasmContractPath: "secret_evm_storage.wasm.gz",
      gatewayAddress: "secret10ex7r7c4y704xyu086lf74ymhrqhypayfk7fkj",
      gatewayHash: "ad8ca07ffba1cb26ebf952c29bc4eced8319c171430993e5b5089887f27b3f70",
      gatewayPublicKey: "0x046d0aac3ef10e69055e934ca899f508ba516832dc74aa4ed4d741052ed5a568774d99d3bfed641a7935ae73aac8e34938db747c2f0e8b2aa95c25d069a575cc8b",
      gatewayEncryptionKeyForChaChaPoly1305: "A20KrD7xDmkFXpNMqJn1CLpRaDLcdKpO1NdBBS7VpWh3",
      chainId: "pulsar-3",
      endpoint: process.env.ENDPOINT_TESTNET,
      codeId: "12247", // only know after upload
      contractCodeHash: "b44049cbf187939df9f9857905197ecbc06e99702b3332b12cb6d968f39d88b2", // only know after upload
      secretContractAddress: "secret1h09whd3z8s9ms66mavd9rjm8r2rpew2trm0nkp", // only know after instantiate
    },
    local: {
      walletMnemonic: process.env.WALLET_MNEMONIC_LOCAL,
      isOptimizedContractWasm: true,
      wasmContractPath: "secret_evm_storage.wasm.gz",
      gatewayAddress: "",
      gatewayHash: "",
      gatewayPublicKey: "",
      gatewayEncryptionKeyForChaChaPoly1305: "",
      chainId: "secretdev-1",
      endpoint: process.env.ENDPOINT_LOCAL,
      codeId: "0", // only know after upload
      contractCodeHash: "", // only know after upload
      secretContractAddress: "", // only know after instantiate
    }
  }
};

export default config;
