// Project ID
export const projectId = "9f68d526720f359ea9cd5fa13c3c5b08"

// 4. Metadata Object
export const metadata = {
  name: "EVM Cross-Chain Encryption Demo",
  description: "EVM Cross-Chain Encryption Demo",
  url: "", // origin must match your domain & subdomain
  icons: [""],
}

export const config = {
  evm: {
    defaultNetwork: "localhost",
    localhost: {
      chainId: 31337,
      endpoint: "http://172.105.184.209:8545/",
      // Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
      privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      // Obtained from ./packages/secret-contracts-scripts/src/functions/secretpath/generateKeys.ts
      publicKey: "0x038318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75",
      nunyaBusinessContractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // only know after deploy
      gatewayContractAddress: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", // only know after deploy
    },
    // sepolia: {
    //   chainId: 11155111,
    //   endpoint: process.env.PROVIDER_RPC_ETHEREUM_SEPOLIA,
    //   privateKey: process.env.DEPLOYER_PRIVATE_KEY,
    //   nunyaBusinessContractAddress: "0xAFFF311821C3F3AF863C7103BB17BDC1Ba04603D", // only know after deploy
    //   gatewayContractAddress: "0x1E4B12A9F82b33DA1127B27861EFf5E652de7a6F", // only know after deploy
    // }
  },
  secret: {
    defaultNetwork: "localhost",
    // testnet: {
    //   walletMnemonic: process.env.WALLET_MNEMONIC_TESTNET,
    //   isOptimizedContractWasm: true,
    //   chainId: "pulsar-3",
    //   endpoint: process.env.ENDPOINT_TESTNET,
    //   secretNunya: {
    //     nunyaContractCodeId: "12247", // only know after upload
    //     nunyaContractCodeHash: "b44049cbf187939df9f9857905197ecbc06e99702b3332b12cb6d968f39d88b2", // only know after upload
    //     nunyaContractAddress: "secret1h09whd3z8s9ms66mavd9rjm8r2rpew2trm0nkp", // only know after instantiate
    //     nunyaContractWasmPath: "contract.wasm.gz",
    //   },
    //   secretGateway: {
    //     // https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/supported-networks/secret-gateway/secretpath-testnet-pulsar-3-contracts
    //     gatewayContractCodeId: "3375",
    //     gatewayContractAddress: "secret10ex7r7c4y704xyu086lf74ymhrqhypayfk7fkj",
    //     gatewayContractCodeHash: "ad8ca07ffba1cb26ebf952c29bc4eced8319c171430993e5b5089887f27b3f70",
    //     gatewayContractAdminAddress: "secret1glfedwlusunwly7q05umghzwl6nf2vj6wr38fg",
    //     gatewayContractPublicKey: "0x046d0aac3ef10e69055e934ca899f508ba516832dc74aa4ed4d741052ed5a568774d99d3bfed641a7935ae73aac8e34938db747c2f0e8b2aa95c25d069a575cc8b",
    //     gatewayContractEncryptionKeyForChaChaPoly1305: "A20KrD7xDmkFXpNMqJn1CLpRaDLcdKpO1NdBBS7VpWh3",
    //     gatewayContractWasmPath: "secret-gateway-contract.wasm.gz",
    //   }
    // },
    localhost: {
      walletMnemonic: process.env.SECRET_LOCAL_WALLET_MNEMONIC,
      isOptimizedContractWasm: false,
      chainId: "secretdev-1",
      endpoint: process.env.SECRET_LOCAL_ENDPOINT,
      secretNunya: {
        nunyaContractCodeId: "2", // only know after upload
        nunyaContractCodeHash: "bd379de6cac6c154690c2c398631ccbcad13bd3242486356e764cf23327aa623", // only know after upload
        nunyaContractAddress: "secret1gyruqan6yxf0q423t8z5zce3x7np35uw8s8wqc", // only know after instantiate
        nunyaContractWasmPath: "contract.wasm.gz",
      },
      secretGateway: {
        gatewayContractCodeId: "1", // only know after upload
        gatewayContractAddress: "secret1mfk7n6mc2cg6lznujmeckdh4x0a5ezf6hx6y8q", // only know after instantiate
        gatewayContractCodeHash: "836a34c60637d684c044d4ddc1277e3d21ae1f440d2bb2d26870c81639d2f4c4", // only know after upload
        
        // Generated with Keplar wallet using "Connect with Google" to obtain a private key and used in the
        // .env file of the custom Secret Relayer. The `pub_key` associated with it may be obtained through debugging
        // `account_info = data.get('account', {})` in the Relayer with `self.logger.info(f"sync_account_number_and_sequence: account_info {account_info}")`
        // Address: secret1glfedwlusunwly7q05umghzwl6nf2vj6wr38fg
        // 'pub_key': {'@type': '/cosmos.crypto.secp256k1.PubKey', 'key': 'A4K+MyJNnNcdt78SncjhArLWNnDRHapkZFsemjmf9/7A'
        gatewayContractAdminAddress: "secret1glfedwlusunwly7q05umghzwl6nf2vj6wr38fg",
        // obtain from running `yarn run secret:querySecretGatewayPubkey`
        gatewayContractPublicKey: "0x041d515b717dfd0389615e2368e7ca2aee86f4b3f325a10ef4f3e6edf87d099b8b88d7f01a8b38dbc722a6d899033b5bb059bc3431543e4821ad0e8034a923ab18",
        // obtain from running `yarn run secret:querySecretGatewayPubkey`
        gatewayContractEncryptionKeyForChaChaPoly1305: "Ah1RW3F9/QOJYV4jaOfKKu6G9LPzJaEO9PPm7fh9CZuL",
        gatewayContractWasmPath: "secret-gateway-contract.wasm.gz",
      }
    }
  }
};
