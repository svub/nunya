# Setup and Usage

**Table of contents**

* [Setup Frontend & Solidity Contracts](#setup-frontend)
* [Setup Secret Contracts](#setup-secret)
* [Setup Custom Gateways and Relayers](#setup-gateways-relayers)
* [Usage Guidelines](#usage)

### Setup Frontend and Solidity Contracts <a id="setup-frontend"></a> 

#### Requirements

Before you begin, you need to install the following tools:

- [Node (>= v18.18)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

#### Quickstart

To get started, follow the steps below:

1. Install dependencies:

```
yarn install
```

2. Configure environment variables

* Hardhat

Copy the example and add the relevant keys from https://etherscan.io/ and https://account.getblock.io and https://dashboard.alchemy.com/apps.

Note that Alchemy does not support Ethereum Sepolia, so use [Geoblocks](https://getblock.io/) instead to get an API key for Ethereum Sepolia JSON-RPC.
```bash
cp ./packages/hardhat/.env.example ./packages/hardhat/.env
```
Verify the contents of ./packages/hardhat/hardhat.config.ts

* Nextjs

Use the same Alchemy API key. Obtain a WalletConnect project ID at https://cloud.walletconnect.com
```bash
cp ./packages/nextjs/.env.example ./packages/nextjs/.env
```
Verify the contents of ./packages/nextjs/scaffold.config.ts

3. Setup network

* Local Network

If you want to run a local network in the first terminal:

Note: Use `accounts: [deployerPrivateKey]` or `accounts: { mnemonic: MNEMONIC }` in ./packages/hardhat/hardhat.config.ts

```
yarn chain
```

This command starts a local Ethereum network using Hardhat. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `packages/hardhat/hardhat.config.ts`.

* Testnet

Check configured correctly.

4. On a second terminal, deploy the test contract to desired network (e.g. `yarn deploy --network localhost` or `yarn deploy --network sepolia`)

```
yarn deploy --network sepolia
```

> Note: The contract is located in `packages/hardhat/contracts` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/hardhat/deploy` to deploy the contract to the network. You can also customize the deploy script.

Note: If it has deployed previously it will output `Nothing to compile. No need to generate any newer typings.`. To make a fresh deployment first run `yarn run hardhat:clean`.

It should output:
```
Generating typings for: 4 artifacts in dir: typechain-types for target: ethers-v6
Successfully generated 12 typings!
Compiled 4 Solidity files successfully (evm target: london).
network:  sepolia
chain id:  11155111
hre.network.name:  sepolia
deployer:  0x04f17aeb4b71e8f63f48749119f9957ca4a26268aaa87625e5e8b09aa2c45954
reusing "DummyGatewayContract" at 0x77257FE5ef16d11CFA91D8fDaA79Fc9e47541BE7
Successfully deployed DummyGatewayContract to address:  0x77257FE5ef16d11CFA91D8fDaA79Fc9e47541BE7
reusing "NunyaBusiness" at 0xB10C8F0E2279fAa112abFF17063326bf3Fe8Dd50
Successfully deployed NunyaBusiness to address:  0xB10C8F0E2279fAa112abFF17063326bf3Fe8Dd50
tx hash: 0x4c379792cc11a180d831036389d4ec4122de1a8ade85eaffb90a45b43d6ceb03
👋 Nunya contract: 0xB10C8F0E2279fAa112abFF17063326bf3Fe8Dd50
NunyaBusiness balance:  0.000000000030084
Gateway balance:  0.300499999969916
📝 Updated TypeScript contract definition file on ../nextjs/contracts/deployedContracts.ts
```

> Warning: Do not rename 01_deploy_your_contract.ts to 00_deploy_your_contract.ts or it will only compile but will not deploy

5. View the contract in block explorer

Example previous deployment: 
  NunyaBusiness: https://sepolia.etherscan.io/address/0xB10C8F0E2279fAa112abFF17063326bf3Fe8Dd50#code

  DummyGatewayContract: https://sepolia.etherscan.io/address/0x77257FE5ef16d11CFA91D8fDaA79Fc9e47541BE7

6. On a third terminal, start the Nunya NextJS app:

```
yarn start
```

Visit app on: `http://localhost:3000`. You can interact with your smart contract using the `Debug Contracts` page. You can tweak the app config in `packages/nextjs/scaffold.config.ts`.

Run smart contract test with `yarn hardhat:test`

- Edit smart contracts such as `NunyaBusiness.sol` in `packages/hardhat/contracts`
- Edit frontend homepage at `packages/nextjs/app/page.tsx`. For guidance on [routing](https://nextjs.org/docs/app/building-your-application/routing/defining-routes) and configuring [pages/layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts) checkout the Next.js documentation.
- Edit deployment scripts in `packages/hardhat/deploy`

### Setup Secret Contract <a id="setup-secret"></a> 

* Reference https://docs.scrt.network/secret-network-documentation/development/readme-1

* Install Git and Make - https://docs.scrt.network/secret-network-documentation/development/readme-1/setting-up-your-environment#install-requirements

* Install Rust
  ```
  rustup update
  rustup default stable
  rustup target add wasm32-unknown-unknown
  source "$HOME/.cargo/env"
  ```
* Install Cargo Generate
  ```
  cargo install cargo-generate --features vendored-openssl
  ```

* Install dependencies
  ```
  nvm use
  npm install --global lerna
  yarn set version 4.2.2
  corepack enable
  corepack prepare yarn@v4.2.2 --activate
  ```

#### Create, Compile and Deploy Contract

* Note: To build on macOS it was necessary to run the following first as specified here https://github.com/rust-bitcoin/rust-secp256k1/issues/283#issuecomment-1590391777. Other details https://github.com/briansmith/ring/issues/1824

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install llvm
llvm-config --version
echo 'export AR=/opt/homebrew/opt/llvm/bin/llvm-ar' >> ~/.zshrc
echo 'export CC=/opt/homebrew/opt/llvm/bin/clang' >> ~/.zshrc
source ~/.zshrc
``` 

* Run Docker (e.g. Docker Desktop on macOS)

* Remove any old Docker containers
```
docker rmi sco
```

* [Compile](https://docs.scrt.network/secret-network-documentation/development/readme-1/compile-and-deploy#compile-the-code). Note: Outputs contract.wasm and contract.wasm.gz file in the root directory of the secret-contracts/nunya-contract folder. Using `make build-mainnet-reproducible` will remove contract.wasm so only the optimised contract.wasm.gz remains. Warning: If you only run `make build-mainnet` then you will get this error https://github.com/svub/nunya/issues/8 when deploying.

```
cd packages/secret-contracts/nunya-contract
make build-mainnet-reproducible
```

* Upload and Instantiate 

> IMPORTANT: Currently unable to deploy due to this TNLS error https://github.com/svub/nunya/issues/8

```
yarn run secret:clean:uploadContract
yarn run secret:start:uploadContract
```
* Query Pubkey
```
yarn run secret:queryPubkey
```
* View logs at ./logs/instantiateOutput.log
* View on Secret Testnet block explorer at https://testnet.ping.pub/secret/

* Reference https://docs.scrt.network/secret-network-documentation/development/readme-1/compile-and-deploy

### Setup Custom Gateways and Relayers <a id="setup-gateways-relayers"></a> 

See https://github.com/ltfschoen/SecretPath to deploy the following:

* Custom Public Gateway on Ethereum Sepolia
* Custom Relay Network
* Custom Private Gateway on Secret Network

The deployed [NunyaBusiness.sol](./packages/hardhat/contracts/NunyaBusiness.sol) contract on Ethereum Sepolia shall interact with the Public Gateway.

The deployed [Nunya Private Contract](./packages/secret-contracts/nunya-contract/src/contract.rs) shall interact with the Private Gateway on Secret Network 

### Usage Guidelines <a id="usage"></a> 

TODO - help judges and other developers understand the project.
