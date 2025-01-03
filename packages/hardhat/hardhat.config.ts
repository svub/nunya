import * as dotenv from "dotenv";
dotenv.config();
import { HardhatUserConfig } from "hardhat/config";
import { HDAccountsUserConfig, HttpNetworkAccountsUserConfig } from "hardhat/types";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@nomicfoundation/hardhat-verify";
import "hardhat-deploy";
import "hardhat-deploy-ethers";

const mainnetProviderApiKeyAlchemy = process.env.ETH_MAINNET_ALCHEMY_API_KEY || process.env.FALLBACK_ETH_MAINNET_ALCHEMY_API_KEY;
const sepoliaProviderApiKeyGeoblock = process.env.ETH_SEPOLIA_GETBLOCK_API_KEY;
// If not set, it uses ours Etherscan default API key.
const etherscanApiKey = process.env.ETHERSCAN_API_KEY || "DNXJA8RX2Q3VZ4URQIWP7Z68CJXQZSC6AW";

const accountsValuesOptions = {
  mainnet: {
    private: [process.env.ETH_MAINNET_PRIVATE_KEY] || undefined,
    mnemonic: { mnemonic: process.env.ETH_MAINNET_MNEMONIC || "" },
  },
  testnet: {
    private: [process.env.ETH_TESTNET_PRIVATE_KEY] || undefined,
    mnemonic: { mnemonic: process.env.ETH_TESTNET_MNEMONIC || "" },
  },
  development: {
    private: [process.env.ETH_DEVELOPMENT_PRIVATE_KEY] || undefined,
    mnemonic: { mnemonic: process.env.ETH_DEVELOPMENT_MNEMONIC || "" },
  }
}

const accountsValues = {
  mainnet: 
    process.env.USE_PRIVATE_KEY_OR_MNEMONIC == "private"
    ? accountsValuesOptions.mainnet.private
    : accountsValuesOptions.mainnet.mnemonic,
  testnet: 
    process.env.USE_PRIVATE_KEY_OR_MNEMONIC == "private"
    ? accountsValuesOptions.testnet.private
    : accountsValuesOptions.testnet.mnemonic,
  development: 
    process.env.USE_PRIVATE_KEY_OR_MNEMONIC == "private"
    ? accountsValuesOptions.development.private
    : accountsValuesOptions.development.mnemonic,
}

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.26",
        settings: {
          optimizer: {
            enabled: true,
            // https://docs.soliditylang.org/en/latest/using-the-compiler.html#optimizer-options
            runs: 200,
          },
        },
      },
    ],
  },
  defaultNetwork: "localhost",
  namedAccounts: {
    deployer: {
      // By default, it will take the first Hardhat account as the deployer
      default: 0,
    },
  },
  networks: {
    localhost: {
      chainId: 31337,
      url: process.env.ETH_DEVELOPMENT_PROVIDER_RPC,
    },
    // View the networks that are pre-configured.
    // If the network you are looking for is not here you can add new network settings
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${mainnetProviderApiKeyAlchemy}`,
        enabled: process.env.MAINNET_FORKING_ENABLED === "true",
      },
    },
    // mainnet: {
    //   url: `https://eth-mainnet.alchemyapi.io/v2/${providerApiKey}`,
    //   accounts: accountsValues.mainnet as HttpNetworkAccountsUserConfig,
    // },
    sepolia: {
      // Other providers https://chainlist.org/chain/11155111
      chainId: 11155111,
      url: process.env.ETH_SEPOLIA_PROVIDER_RPC,
      accounts: accountsValues.testnet as HttpNetworkAccountsUserConfig,
      timeout: 100_000_000,
    },
    // arbitrum: {
    //   url: `https://arb-mainnet.g.alchemy.com/v2/${providerApiKey}`,
    //   accounts: accountsValues.mainnet as HttpNetworkAccountsUserConfig,
    // },
    // arbitrumSepolia: {
    //   url: `https://arb-sepolia.g.alchemy.com/v2/${providerApiKey}`,
    //   accounts: accountsValues.testnet as HttpNetworkAccountsUserConfig,
    // },
    // optimism: {
    //   url: `https://opt-mainnet.g.alchemy.com/v2/${providerApiKey}`,
    //   accounts: accountsValues.mainnet as HttpNetworkAccountsUserConfig,
    // },
    // optimismSepolia: {
    //   url: `https://opt-sepolia.g.alchemy.com/v2/${providerApiKey}`,
    //   accounts: accountsValues.testnet as HttpNetworkAccountsUserConfig,
    // },
    // polygon: {
    //   url: `https://polygon-mainnet.g.alchemy.com/v2/${providerApiKey}`,
    //   accounts: accountsValues.mainnet as HttpNetworkAccountsUserConfig,
    // },
    // polygonMumbai: {
    //   url: `https://polygon-mumbai.g.alchemy.com/v2/${providerApiKey}`,
    //   accounts: accountsValues.testnet as HttpNetworkAccountsUserConfig,
    // },
    // polygonZkEvm: {
    //   url: `https://polygonzkevm-mainnet.g.alchemy.com/v2/${providerApiKey}`,
    //   accounts: accountsValues.mainnet as HttpNetworkAccountsUserConfig,
    // },
    // polygonZkEvmTestnet: {
    //   url: `https://polygonzkevm-testnet.g.alchemy.com/v2/${providerApiKey}`,
    //   accounts: accountsValues.testnet as HttpNetworkAccountsUserConfig,
    // },
    // gnosis: {
    //   url: "https://rpc.gnosischain.com",
    //   accounts: accountsValues.mainnet as HttpNetworkAccountsUserConfig,
    // },
    // chiado: {
    //   url: "https://rpc.chiadochain.net",
    //   accounts: accountsValues.mainnet as HttpNetworkAccountsUserConfig,
    // },
    // base: {
    //   url: "https://mainnet.base.org",
    //   accounts: accountsValues.mainnet as HttpNetworkAccountsUserConfig,
    // },
    // baseSepolia: {
    //   url: "https://sepolia.base.org",
    //   accounts: accountsValues.testnet as HttpNetworkAccountsUserConfig,
    // },
    // scrollSepolia: {
    //   url: "https://sepolia-rpc.scroll.io",
    //   accounts: accountsValues.testnet as HttpNetworkAccountsUserConfig,
    // },
    // scroll: {
    //   url: "https://rpc.scroll.io",
    //   accounts: accountsValues.mainnet as HttpNetworkAccountsUserConfig,
    // },
    // pgn: {
    //   url: "https://rpc.publicgoods.network",
    //   accounts: accountsValues.mainnet as HttpNetworkAccountsUserConfig,
    // },
    // pgnTestnet: {
    //   url: "https://sepolia.publicgoods.network",
    //   accounts: accountsValues.testnet as HttpNetworkAccountsUserConfig,
    // },
  },
  // configuration for harhdat-verify plugin
  etherscan: {
    apiKey: `${etherscanApiKey}`,
  },
  // configuration for etherscan-verify from hardhat-deploy plugin
  verify: {
    etherscan: {
      apiKey: `${etherscanApiKey}`,
    },
  },
  sourcify: {
    enabled: false,
  },
};

export default config;
