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

Example of output:
```
Generating typings for: 8 artifacts in dir: typechain-types for target: ethers-v6
Successfully generated 20 typings!
Compiled 7 Solidity files successfully (evm target: paris).
transaction 0x53593beece8061f774f9a9b6efa4584e88ed91eef22eb4ea5613b9631daed888 still pending... It used a gas pricing config of maxPriorityFeePerGas: 1500000000 maxFeePerGas: 14500077156 ,
              current gas price is 5987481929 wei
              new baseFee is 6102384838

✔ Choose what to do with the pending transaction: · continue waiting
waiting for transaction...
network:  sepolia
chain id:  11155111
hre.network.name:  sepolia
deployerAddress:  0x83De04f1aad8ABF1883166B14A29c084b7B8AB59
Deployer account balance: 7.01981295761257996 ETH
deploying "Gateway" (tx: 0xb45283f3d585794164052a82e7bd2930aeade41090584a25464e6551bf1e37b5)...: deployed at 0x5Be91fd4b49489bb3aEc8bE2F5Fa1d83FD8C5A1b with 2559228 gas
Successfully deployed Gateway to address:  0x5Be91fd4b49489bb3aEc8bE2F5Fa1d83FD8C5A1b
deploying "NunyaBusiness" (tx: 0x9b69c6a4ace42a0ce36e4d1ef6ce99d3f2cc0271eed966c8c7e35438bb0fee33)...: deployed at 0x41E52332e76988AFBc38280583a7A02492177C65 with 1672042 gas
Successfully deployed NunyaBusiness to address:  0x41E52332e76988AFBc38280583a7A02492177C65
tx hash: 0x848763e137d97ea53000f360fa27db943f47a13e4e03982320d72dec33478e36
👋 Nunya contract: 0x41E52332e76988AFBc38280583a7A02492177C65
NunyaBusiness balance:  0.000000000000021
Gateway balance:  0.000499999999979
📝 Updated TypeScript contract definition file on ../nextjs/contracts/deployedContracts.ts
```

> Warning: Do not rename 01_deploy_your_contract.ts to 00_deploy_your_contract.ts or it will only compile but will not deploy

5. View the contract in block explorer

Example previous deployment: 
  NunyaBusiness: https://sepolia.etherscan.io/address/0x41E52332e76988AFBc38280583a7A02492177C65#code

  DummyGatewayContract: https://sepolia.etherscan.io/address/0x77257FE5ef16d11CFA91D8fDaA79Fc9e47541BE7

  Gateway: https://sepolia.etherscan.io/address/0x5Be91fd4b49489bb3aEc8bE2F5Fa1d83FD8C5A1b

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

#### Run Unit Tests

> Important: Only works in Rust Nightly (not Stable)

Run the following.
```
cd packages/secret-contracts/nunya-contract

rustup update
rustup default nightly

make build

make test

cargo test

# quicker tests
cargo test --lib

```

TODO: Find out why `cargo test --features=backtraces` does not work even though we have that dependency in cargo.toml

### Setup Custom Gateways and Relayers <a id="setup-gateways-relayers"></a> 

See https://github.com/ltfschoen/SecretPath to deploy the following:

* Custom Public Gateway on Ethereum Sepolia
* Custom Relay Network
* Custom Private Gateway on Secret Network

The deployed [NunyaBusiness.sol](./packages/hardhat/contracts/NunyaBusiness.sol) contract on Ethereum Sepolia shall interact with the Public Gateway.

The deployed [Nunya Private Contract](./packages/secret-contracts/nunya-contract/src/contract.rs) shall interact with the Private Gateway on Secret Network 

### Usage Guidelines <a id="usage"></a> 

Help judges and other developers understand the project.

See the [DEMO_AND_VIDEO](./_DEMO_AND_VIDEO.md) file for details.
