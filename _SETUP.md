# Setup and Usage

**Table of contents**

* [Usage Guidelines](#usage)
* [Setup Frontend & Solidity Contracts](#setup-frontend)
* [Setup Secret Contracts](#setup-secret)
* [About Custom Gateways and Relayers](#about-gateways-relayers)

### Usage Guidelines <a id="usage"></a> 

Help judges and other developers understand the project.

See the [DEMO_AND_VIDEO](./_DEMO_AND_VIDEO.md) file for details.

* **IMPORTANT**: Private secret contract on Secret Network must be deployed before deploying EVM gateway contract since it must be modified to include its address `routing_info` and code hash `routing_code_hash`.

* **NOTE**: The public key of the user that deploys the custom Nunya.Business contract is sent through to the custom EVM Gateway contract so only that user may call that custom EVM Gateway contract, however we actually want to try and use the default EVM Gateway contract that has been deployed by the Secret network team with minimal changes and move the logic to the Secret contract instead. Apart from the creator of the Nunya.Business contract, the only other users that call any Secret network functions are accounts whose public keys are provided by the creator of the Nunya.Business giving those accounts permission to call the withdraw function.

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

Update Gateway.sol to change the value of `secret_gateway_signer_address` to be the deployed Gateway address on the Mainnet or Testnet of the Secret Network.

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
yarn hardhat:chain
```

This command starts a local Ethereum network using Hardhat. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `packages/hardhat/hardhat.config.ts`.

* Testnet

Check configured correctly.

4. On a second terminal, compile and deploy the test contract to desired network (e.g. `yarn hardhat:deploy --network localhost` or `yarn hardhat:deploy --network sepolia`)

```
yarn hardhat:clean
yarn hardhat:compile
yarn hardhat:deploy --network sepolia
```

> Note: The contract is located in `packages/hardhat/contracts` and can be modified to suit your needs. The `yarn hardhat:deploy` command uses the deploy script located in `packages/hardhat/deploy` to deploy the contract to the network. You can also customize the deploy script.

Note: If it has deployed previously it will output `Nothing to compile. No need to generate any newer typings.`. To make a fresh deployment first run `yarn run hardhat:clean` from the project root folder.

Example of output:
```
Generating typings for: 9 artifacts in dir: typechain-types for target: ethers-v6
Successfully generated 20 typings!
Compiled 9 Solidity files successfully (evm target: paris).
network:  sepolia
chain id:  11155111
hre.network.name:  sepolia
deployerAddress:  0x83De04f1aad8ABF1883166B14A29c084b7B8AB59
Deployer account balance: 6.938852504603366312 ETH
reusing "NunyaBusiness" at 0x366C18C390B1cfC05ae7E6Af168a878D5B3c3b5C
Successfully deployed NunyaBusiness to address:  0x366C18C390B1cfC05ae7E6Af168a878D5B3c3b5C
reusing "Gateway" at 0x8375b3D0555c818eF2e50823f8F1F4cdD0696c54
Successfully deployed Gateway to address:  0x8375b3D0555c818eF2e50823f8F1F4cdD0696c54
setGatewayAddressTx tx hash: 0x67367277ef051620c5229bfbfc0019f836e3a5b22961065d8261e4defd63dd76
👋 Nunya contract: 0x366C18C390B1cfC05ae7E6Af168a878D5B3c3b5C
NunyaBusiness balance:  0.000500000000042
Gateway balance:  0.000359999999916
```

> Warning: Do not rename 01_deploy_your_contract.ts to 00_deploy_your_contract.ts or it will only compile but will not deploy

5. Add the deployed Nunya.business Contract Address to `nunyaBusinessContractAddress` and Gateway address `gatewayContractAddress` for the relevant network in ./nunya/packages/secret-contracts-scripts/src/config/deploy.ts

6. Call the Nunya.business Contract `setEVMGatewayAddress` function to set the Gateway EVM address in its state.

* Run script:
```bash
yarn run secret:setEVMGatewayAddress
```

Example transaction hash: https://sepolia.etherscan.io/tx/0xd68415b9dbc6df7f8f7ae4027e2c935082cd5f212bf5e607a24ad3a62a98b898

7. View the contract in block explorer

Example previous deployment: 
  NunyaBusiness: https://sepolia.etherscan.io/address/0x366C18C390B1cfC05ae7E6Af168a878D5B3c3b5C#code

  Gateway: https://sepolia.etherscan.io/address/0x8375b3D0555c818eF2e50823f8F1F4cdD0696c54#code

8. On a third terminal, start the Nunya NextJS app:

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
  yarn set version 4.5.3
  corepack enable
  corepack prepare yarn@v4.5.3 --activate
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

  * Nunya Contract
    ```
    cd packages/secret-contracts/nunya-contract
    make build-mainnet-reproducible
    ```

  OR

  * My Counter Contract (Example only)
    ```
    cd packages/secret-contracts/my-counter-contract
    make build-mainnet-reproducible
    ```

* Upload and Instantiate 

> IMPORTANT: Prior to Upload step it is necessary to recompile changes if any.

> IMPORTANT: Prior to Upload step it is necessary to configure the wallet, network, and endpoint to use either Local or Testnet, and to specify what project's compiled smart contract WASM file to use and whether to use the optimized build (e.g. ./nunya-contract/optimized-wasm/secret_evm_storage.wasm.gz or ./nunya-contract/contract.wasm.gz) in the script ./packages/secret-contracts-scripts/src/index.ts

> IMPORTANT: Prior to Instantiation step it is necessary to deploy the EVM Gateway

* Update the secretjs dependency in ./packages/secret-contracts-scripts/package.json to use a version from https://github.com/scrtlabs/secret.js/tags that works (e.g. 1.15.0-beta.1) by asking the Secret Network team.
Use 1.15.0-beta.1.
Note that 1.15.0-beta.2 may only upload but does not instantiate.
Note that 1.15.0-beta.0 does not upload at all.

> IMPORTANT: Errors deploying may be because of mismatched types, for example InstantiateMsg here https://github.com/svub/nunya/blob/45e884194e8183229e3d7c61ccba7d789ff996b1/packages/secret-contracts/nunya-contract/src/msg.rs#L16C12-L16C26 must match here https://github.com/svub/nunya/blob/45e884194e8183229e3d7c61ccba7d789ff996b1/packages/secret-contracts-scripts/src/instantiate.ts#L92

> IMPORTANT: Both upload and instantiate must be performed using the same version of secretjs

```
yarn install
cd ../../../
yarn run secret:clean
yarn run secret:upload
```

* Add the `CODE_ID` to `codeId` and `CODE_HASH` to `contractCodeHash` respectively to the relevant config.secret.<network> in ./packages/secret-contracts-scripts/src/config/deploy.ts
* Add the terminal log to ./logs/uploadOutput.log

> IMPORTANT: If deployment of the code with `await secretjs.tx.compute.storeCode` is unsuccessful, then check if Beta version of secretjs is necessary incase the Secret Testnet is being upgraded.

```
yarn run secret:instantiate
```

* Add the `SECRET_CONTRACT_ADDRESS` to `secretContractAddress` in the relevant config.secret.<network> in ./nunya/packages/secret-contracts-scripts/src/config/deploy.ts
* Add the terminal log to ./logs/instantiateOutput.log

* View logs at ./logs/instantiateOutput.log
* View on Secret Testnet block explorer at https://testnet.ping.pub/secret/

* Reference https://docs.scrt.network/secret-network-documentation/development/readme-1/compile-and-deploy

* Run the requestValue.ts script
```
yarn run secret:requestValue
```

* Interact with the deployed Gateway EVM contract on Sepolia Ethereum
  * Open Remix https://remix.ethereum.org/
    * Choose "File explorer" tab on the left
    * Choose "Upload Folder" icon
    * Choose the contracts folder ./svub/nunya/packages/hardhat/contracts containing the Solidity files
    * Gateway.sol
      * Open Gateway.sol
        * Click compile icon
      * Choose "Solidity compiler" tab on the left
      * Choose version 0.8.28
      * Click "Compile Gateway.sol" and view the warnings by scrolling down
      * Choose "Deploy and run transactions" tab on the left
      * Click "Environment" and choose "Customize this list..."
        * Select "Sepolia Testnet - Metamask"
      * Click "Sepolia Testnet - Metamask" from the "Environment" drop-down list
      * Allow Metamask to switch to Sepolia network in the popup that appears
      * Open Metamask and click the Remix icon and choose to "Connect more accounts..." to remix.ethereum.org and connect the address associated with the DEPLOYER_ADDRESS used in the .env file
      * Select "Account" to be that DEPLOYER_ADDRESS
      * Enter the deployed Gateway EVM address on Sepolia Testnet (e.g. mentioned in ./nunya/packages/secret-contracts-scripts/src/config/deploy.ts) and click "At Address"
      * Scroll down to the "Deployed Contracts" section that is autogenerated to interact with the deployed contract
      * Click "secret_gateway_signer_address" to call the Gateway contract getter for that constant and return its value that should be shown as 0x2821E794B01ABF0cE2DA0ca171A1fAc68FaDCa06
      * Click `setSecretContractInfo` to create a transaction after providing the following arguments `config.secret.testnet.contractCodeHash` and `config.secret.testnet.secretContractAddress` using values from ./nunya/packages/secret-contracts-scripts/src/config/deploy.ts
        * Retrieve their values by clicking to calls `routing_info` and `routing_code_hash`
    * NunyaBusiness.sol
      * Repeat relevant initial steps above for NunyaBusiness.sol
      * Enter the deployed NunyaBusiness EVM address on Sepolia Testnet (e.g. mentioned in ./nunya/packages/secret-contracts-scripts/src/config/deploy.ts) and click "At Address"
      * Scroll down to the "Deployed Contracts" section that is autogenerated to interact with the deployed contract
      * FIXME - Click "setGatewayAddress" to create a transaction after providing the following argument to call the NunyaBusiness contracts transaction using the latest value from ./nunya/packages/secret-contracts-scripts/src/config/deploy.ts
        * FIXME - Retrieve its value by clicking to call `CustomGateway`

##### Unsorted

* Query Pubkey
```
cd ../../../
yarn run secret:queryPubkey
```

* TODO: Transaction `secretContract.retrievePubkey`
```
yarn run secret:submit
```

### About Custom Gateways and Relayers <a id="about-gateways-relayers"></a> 

See https://github.com/ltfschoen/SecretPath for source code associated with the following:

* Custom Public Gateway on Ethereum Sepolia
* Custom Relay Network
* Custom Private Gateway on Secret Network

The deployed [NunyaBusiness.sol](./packages/hardhat/contracts/NunyaBusiness.sol) contract on Ethereum Sepolia shall interact with the Public Gateway.

The deployed [Nunya Secret Private Contract](./packages/secret-contracts/nunya-contract/src/contract.rs) on Secret Network shall interact with the Private Gateway on Secret Network 
