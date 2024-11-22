import dotenv from "dotenv";
dotenv.config();

// https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/supported-networks/secret-gateway/secretpath-testnet-pulsar-3-contracts
// https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/supported-networks/secret-gateway/secretpath-mainnet-secret-4-contracts

const config = {
  evm: {
    network: "sepolia",
    sepolia: {
      chainId: 11155111,
      endpoint: process.env.PROVIDER_RPC_ETHEREUM_SEPOLIA,
      privateKey: process.env.DEPLOYER_PRIVATE_KEY,
      nunyaBusinessContractAddress: "0x5c757f18B4f6d74cE99A290CC9884aFea4476af0", // only know after deploy
      gatewayContractAddress: "0x8375b3D0555c818eF2e50823f8F1F4cdD0696c54"
    }
  },
  secret: {
    network: "testnet",
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
      codeId: "12245", // only know after upload
      contractCodeHash: "154da84fd022f8b886ac2ef686399bb7c0aa4a2b90208685e86b7756e4a26483", // only know after upload
      secretContractAddress: "secret1n0q5taawu77w7ulnyynft4dl4pxf9szjvrjmc2", // only know after instantiate
    },
    local: {
      walletMnemonic: process.env.WALLET_MNEMONIC_LOCAL,
      isOptimizedContractWasm: false,
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
