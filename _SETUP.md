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

* **Local Network** (on remote machine)

* Connect to Linode (e.g. in the example shown below the Linode server IP address is 172.105.188.31)
```
ssh root@172.105.188.31
```

If you want to run a local network:

Note: Use `accounts: [deployerPrivateKey]` or `accounts: { mnemonic: MNEMONIC }` in ./packages/hardhat/hardhat.config.ts and specify the IP Address where it is being run.

* Terminal 1
```
yarn hardhat:chain
```

Example output:
```
Started HTTP and WebSocket JSON-RPC server at http://172.105.188.31:8545/

Accounts
========
...
```

* Compile and Deploy to Local Network
```
yarn hardhat:clean
yarn hardhat:compile
yarn hardhat:deploy --network localhost
```

This command starts a local Ethereum network using Hardhat. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `packages/hardhat/hardhat.config.ts`.

* **Testnet**

Check configured correctly.

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
Deployer account balance: 6.938448757518362804 ETH
deploying "NunyaBusiness" (tx: 0x95ce8c146374df85ce0f0f5425e65a2e33092a74b972495c005fa038fe094d33)...: deployed at 0xAFFF311821C3F3AF863C7103BB17BDC1Ba04603D with 2871810 gas
Successfully deployed NunyaBusiness to address:  0xAFFF311821C3F3AF863C7103BB17BDC1Ba04603D
deploying "Gateway" (tx: 0x0c5c2b097801afec5518d3714095569b7df2a53dcde0802c192d036dbd95a66a)...: deployed at 0x1E4B12A9F82b33DA1127B27861EFf5E652de7a6F with 3337833 gas
Successfully deployed Gateway to address:  0x1E4B12A9F82b33DA1127B27861EFf5E652de7a6F
setGatewayAddressTx tx hash: 0xefc300507bbddb3ca95dc178d95b857a3771fd0a0334626f036edfe6ffda4343
👋 Nunya contract: 0xAFFF311821C3F3AF863C7103BB17BDC1Ba04603D
NunyaBusiness balance:  0.0005
Gateway balance:  0.0
```

> Warning: Do not rename 01_deploy_your_contract.ts to 00_deploy_your_contract.ts or it will only compile but will not deploy
4. Add the deployed Nunya.business Contract Address to `nunyaBusinessContractAddress` and Gateway address `gatewayContractAddress` for the relevant network in ./nunya/packages/secret-contracts-scripts/src/config/deploy.ts

5. Call the Nunya.business Contract `setEVMGatewayAddress` function to set the Gateway EVM address in its state.

* Run script:
```bash
yarn run secret:setEVMGatewayAddress
```

Example transaction hash: https://sepolia.etherscan.io/tx/0xef7a241e3eba870138323440e910e2a0e608654a46bd7720af8e03ed63618f3a

6. View the contract in block explorer

Example previous deployment: 
  NunyaBusiness: https://sepolia.etherscan.io/address/0xAFFF311821C3F3AF863C7103BB17BDC1Ba04603D#code

  Gateway: https://sepolia.etherscan.io/address/0x1E4B12A9F82b33DA1127B27861EFf5E652de7a6F#code

7. Interact with deployed EVM Gateway via the NunyaBusiness contract

Assumes that you have already uploaded and instantiated the custom Secret contract in the [Setup Secret Contracts](#setup-secret) section.

Skip to the [`requestValue`](#requestValue) step in the [Setup Secret Contracts](#setup-secret) section.

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

#### Install Dependencies

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

* Install SecretCLI on Linux
  ```bash
  wget https://github.com/scrtlabs/SecretNetwork/releases/download/v1.15.0-beta.18/secretcli-Linux
  chmod +x secretcli-Linux
  mv secretcli-Linux /usr/bin/secretcli
  echo 'PATH=/usr/bin/secretcli:$PATH' >> ~/.bashrc && source ~/.bashrc
  secretcli --help
  ```

##### Deploy Gateway and Relayer of SecretPath on Localhost

* Connect to Linode. Note: Replace the IP address with the address of your remote server.
```
ssh root@172.105.188.31
```

* Start Localhost server with chain-id `secretdev-1`

```bash
docker stop secretdev && docker rm secretdev
docker run -it --rm \
  -p 9091:9091 -p 26657:26657 -p 26656:26656 -p 1317:1317 -p 5000:5000 \
  -v $(pwd):/root/code \
  --name secretdev ghcr.io/scrtlabs/localsecret:latest
```

* Ports:
  * RPC, 26657, secretcli, Keplr, cosmjs
  * gRPC-web, 9091, secretjs@v1.4 (deprecated)
  * SCRT Faucet, 5000, to get SCRT
  * LCD, 1317, secretjs, Keplr, secretjs@v0.17.5 (deprecated)

* Note: Localhost accounts that each have an initial balance of 1000000000000000000uscrt
```bash
a
secret1ap26qrlp8mcq2pg6r47w43l0y8zkqm8a450s03
A07oJJ9n4TYTnD7ZStYyiPbB3kXOZvqIMkchGmmPRAzf
grant rice replace explain federal release fix clever romance raise often wild taxi quarter soccer fiber love must tape steak together observe swap guitar

b
secret1fc3fzy78ttp0lwuujw7e52rhspxn8uj52zfyne
AgGQoJ1UiOfUW1PKCAnoYS
jelly shadow frog dirt dragon use armed praise universe win jungle close inmate rain oil canvas beauty pioneer chef soccer icon dizzy thunder meadow

c
secret1ajz54hz8azwuy34qwy9fkjnfcrvf0dzswy0lqq
AvK5BGEsO3kikflW0NlfV9cdVJcxVJgLh7tgh4TGS3Cg
chair love bleak wonder skirt permit say assist aunt credit roast size obtain minute throw sand usual age smart exact enough room shadow charge

d
secret1ldjxljw7v4vk6zhyduywh04hpj0jdwxsmrlatf
AzBzrKqSZp3YXMzITB8ZAqYysO0YCjtV
word twist toast cloth movie predict advance crumble escape whale sail such angry muffin balcony keen move employ cook valve hurt glimpse breeze brick
```

Deploy Relayer of SecretPath on Localhost

###### Deploy Gateway of SecretPath on Localhost

* Note: An example of the Gateway to be deployed on Secret Network is here https://github.com/SecretSaturn/SecretPath/tree/main/TNLS-Gateways/secret. This example was used to create github/svub/nunya/packages/secret-contracts/secret-gateway

* Connect to Linode
```
ssh root@172.105.188.31
```

* Clone the Github repo containing the Secret Gateway and initialise the submodules
```
mkdir -p github/ltfschoen && cd github/ltfschoen
git clone https://github.com/svub/nunya
cd nunya
git fetch origin submit-pubkey:submit-pubkey
git checkout submit-pubkey
cd packages/secret-contracts/secret-gateway
git submodule update --init --recursive
```

* Terminal Tab 1: Secret Localhost (Localsecret)
  ```
  make start-server
  ```

* Terminal Tab 2: [Compile](https://docs.scrt.network/secret-network-documentation/development/readme-1/compile-and-deploy#compile-the-code). Note: Outputs contract.wasm or contract.wasm.gz file in the root directory being the ./SecretPath/TNLS-Gateways/secret/ folder. Using `make build-mainnet-reproducible` will remove contract.wasm so only the optimised contract.wasm.gz remains. Warning: If you only run `make build-mainnet` then you will get this error https://github.com/svub/nunya/issues/8 when deploying.

  * Secret Gateway Contract
    ```
    make clean
    make build
    ```
    * Note: If `wasm-opt` binary is required but not installed on macOS install it with `brew install binaryen`
    * Note: Use `make build-mainnet-reproducible` to deploy to Testnet
    * Note: The default Makefile originally used `--features="debug-print"` but running that gives error `the package secret_gateway depends on secret-cosmwasm-std, with features: debug-print but secret-cosmwasm-std does not have these features.`. The reason why it was removed is mentioned here:
        * https://github.com/CosmWasm/cosmwasm/issues/1841
          * https://github.com/CosmWasm/wasmvm/pull/453
        * https://github.com/CosmWasm/cosmwasm/pull/1667
        * https://github.com/CosmWasm/cosmwasm/pull/1953
      * Solution:
        * https://github.com/CosmWasm/cosmwasm/blob/main/contracts/cyberpunk/tests/integration.rs#L126
      * TODO: For Production on mainnet, configure it to use a debug-print or debug_print with a custom feature flag and wrap use of `set_debug_handler` with it so debug logs aren't output in production.

* Note: Use existing secretdev Docker container that is running already.

* Copy compiled Secret Gateway contract to the Docker container
  ```
  make copy-secret-gateway-contract-local
  ```

* Store compiled Secret Gateway contract on Localhost (Localsecret network)
  ```
  make store-secret-gateway-contract-local
  ```
  * Note: To enter the Docker container to interact manually with secretcli:
    ```bash
    docker exec -it secretdev /bin/bash
    secretcli --help
    secretcli keys list
    ls /root/.secretd/config
    ```

  * Example output:
    ```
    {"height":"0","txhash":"A5A2E9864A3F455AD503935AE739B4E898F71A5B5BFCDB7B7D6934942297223C","codespace":"","code":0,"data":"","raw_log":"","logs":[],"info":"","gas_wanted":"0","gas_used":"0","tx":null,"timestamp":"","events":[]}
    ```
  * Note that in the Secret Localsecret chain logs it output:
    ```
    11:43AM INF finalizing commit of block hash=9B39F1E7367B876F61E45CFD0DE3EC55CE59D140A4604E35622D8C6CDEE1BB66 height=115 module=consensus num_txs=1 root=371919C2BE93B7F0C2B81837770B871592793F8A74847C04593F27F8A62109A1
    ```
    * TODO: Why didn't it output `"height":"115"` instead of `"height":"0"`?


###### Deploy Relayer of SecretPath on Localhost

* Reference: https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/basics/cross-chain-messaging/secretpath/how-to-deploy-secretpath-on-your-chain

* Connect to Linode
```
ssh root@172.105.188.31
```

* Clone the Relayer Github repo and initialise the submodules
```
mkdir -p SecretSaturn && cd SecretSaturn
git clone https://github.com/SecretSaturn/SecretPath
cd SecretPath/TNLS-Gateways/public-gateway
git submodule update --init --recursive
```

* Configure the Relayer
  * Reference: https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/basics/cross-chain-messaging/secretpath/how-to-deploy-secretpath-on-your-chain#configuring-the-relayer

  * Edit Relayer Configuration
    ```
    cd ../../TNLS-Relayers
    vim config.yml
    ```

  * **Add the Following Configuration**

    * EVM
      * Testnet Ethereum Sepolia. For `11155111` change it to the following. Replacing the value of `contract_address` with the Gateway EVM address that you deployed and stored in ./packages/secret-contracts-scripts/src/config/deploy.ts.

        ```yaml
        "11155111": #Ethereum Sepolia
          active: true
          type: "evm"
          chain_id: "11155111"
          api_endpoint: https://go.getblock.io/d9be982c38f64fd98d27533b1bff032c
          contract_address: "0x1E4B12A9F82b33DA1127B27861EFf5E652de7a6F"
          timeout: 1
        ```
      
      * Localhost. Replacing `172.105.188.31` with the IP Address of your server that is running Ethereum on Localhost
        ```yaml
        "31337": #Ethereum Localhost
          active: true
          type: "evm"
          chain_id: "31337"
          api_endpoint: http://172.105.188.31:8545/
          contract_address: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
          timeout: 1
        ```

    * Secret Network
      * Testnet `pulsar-3` change it to the following. Replacing the value of `contract_address` with the Gateway EVM address that you deployed and stored in ./packages/secret-contracts-scripts/src/config/deploy.ts.
        ```yaml
          "pulsar-3": #Secret Testnet
            active: true
            type: "secret"
            chain_id: "pulsar-3"
            api_endpoint: "https://api.pulsar.scrttestnet.com"
            contract_address: "secret10ex7r7c4y704xyu086lf74ymhrqhypayfk7fkj"
            code_hash: "ad8ca07ffba1cb26ebf952c29bc4eced8319c171430993e5b5089887f27b3f70"
            feegrant_address: "secret1gutgtpw0caqfsp8ja0r5yecv8jxz2y8vhpnck8"
        ```
      
      * Localhost. Replacing `172.105.188.31` with the IP Address of your server that is running Secret Localhost. Replacing the value of `contract_address` with the Gateway EVM address that you deployed and stored in ./packages/secret-contracts-scripts/src/config/deploy.ts.
        ```yaml
        "secretdev-1": #Secret Localhost
          active: true
          type: "secret"
          chain_id: "secretdev-1"
          api_endpoint: "http://172.105.188.31:1317"
          contract_address: "<TODO>"
          timeout: 1
        ```

* Edit ./SecretPath/TNLS-Relayers/.env.example
  ```
  vim ./SecretPath/TNLS-Relayers/.env.example
  ```

  * Generate an Ethereum wallet with address, private key, mnemonic phrase, and encrypted JSON file using MyCrypto desktop from Github https://github.com/MyCryptoHQ/MyCrypto/releases/tag/1.7.17 and ensure that you verify the checksum of the download. Import that into Keplar browser extension using the **private key** to obtain the associated Secret Network address. Verify that the Ethereum address on the Ethereum Network in the Keplar wallet once imported matches the Ethereum address that was chosen.

  * Add for Localhost of Ethereum the private key into `ethereum-private-key = XXXXX` of the .env file /Users/luke/code/clones/github/svub/nunya/packages/secret-contracts-scripts/.env

  * Add for Localhost of Secret Network the private key to `secret-private-key = XXXXX` of the .env file /Users/luke/code/clones/github/svub/nunya/packages/secret-contracts-scripts/.env

* Transfer some Localhost Ethereum tokens from a default account like `Account #0` that is shown when running Ethereum Localhost to that Ethereum wallet address associated with the private key `ethereum-private-key`.
  ```
  Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
  privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  ```

  * TODO - is this necessary? why not just use the default account?

* Transfer some Localhost Secret tokens from a default account that is shown when running Secret Localhost to that Secret wallet address.
  * Reference: https://docs.scrt.network/secret-network-documentation/infrastructure/secret-cli/configuration

  ```
  secretcli config set client node http://172.105.188.31:26657
  secretcli config set client chain-id secretdev-1
  secretcli config set client output json
  secretcli config set client keyring-backend test
  secretcli config view client --output-format json
  secretcli config home

  secretcli query bank balances secret1kc6j4dvvcwtqjwcv68equux88lt4rar6scz32a | jq
  secretcli query bank balances secret1u9jfestafdkr5cr057e436puzp6agf2vvcejfc | jq
  ```
  * Note: Configuration is stored in /root/.secretd/config/client.toml
  * Note: `keyring-backend` is where the keys are stored from possible options including: (os|file|kwallet|pass|test|memory)

  * TODO - how to transfer uscrt tokens from the default account to my account that i have the private key of

  ```
  secretcli tx bank send secret1ap26qrlp8mcq2pg6r47w43l0y8zkqm8a450s03 secret1u9jfestafdkr5cr057e436puzp6agf2vvcejfc 10uscrt --fees=70000uscrt --fee-payer secret1ap26qrlp8mcq2pg6r47w43l0y8zkqm8a450s03
  
  Error: failed to convert address field to address: key with address secret1ap26qrlp8mcq2pg6r47w43l0y8zkqm8a450s03 not found: key not found [scrtlabs/cosmos-sdk@v0.50.10-secret.2/crypto/keyring/keyring.go:538]
  ```

    * TODO - is this necessary? why not just use the default account?

  * QUESTION - do i need to add both addresses into the keyring? but if i do that it asks me to provide the account's mnemonic phrase and then doesn't add the correct secret network account address to keyring, see how below the address should be `secret1u9....`. is it possible to provide the private key instead so it adds the correct secret network account address to the keyring. it appears that it is necessary to even add the default accounts `a`, `b`, `c`, and `d`, as required to the keyring. 

  ```
  a_mnemonic="grant rice replace explain federal release fix clever romance raise often wild taxi quarter soccer fiber love must tape steak together observe swap guitar"
  echo $a_mnemonic | secretcli keys add account --recover
  secretcli keys show account
  
  # it should output `secret1ap26qrlp8mcq2pg6r47w43l0y8zkqm8a450s03`

  b_mnemonic="jelly shadow frog dirt dragon use armed praise universe win jungle close inmate rain oil canvas beauty pioneer chef soccer icon dizzy thunder meadow"
  echo $b_mnemonic | secretcli keys add account2 --recover
  secretcli keys show account2

  # it should output `secret1fc3fzy78ttp0lwuujw7e52rhspxn8uj52zfyne`
  ```

  TODO - is the below necessary? why not just add the default accounts to the keyring above?
  ```
  custom_mnemonic="<INSERT_MNEMONIC_PHRASE>"
  echo $custom_mnemonic | secretcli keys add custom --hd-path="m/44'/60'/0'/0" --recover
  secretcli keys show custom
  ```

  TODO - why doesn't the wallet address recovered with `custom_mnemonic` match the one that was generated with MyCrypto when recovering it with that mnemonic phrase? is it possible to recover with the private key instead so it recovers the correct wallet address?

  Note: Used `m/44'/60'/0'/0` since that was the default HD path chosen when generating the wallet in MyCrypto for use with Metamask that uses BIP44 derivation, where the HD path is defined as `m / purpose' / coin_type' / account' / change / address_index`
  References: 
    * https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
    * https://ethereum.stackexchange.com/questions/19055/what-is-the-difference-between-m-44-60-0-0-and-m-44-60-0
  * Note: The `coin_type` is `529` for Secret Network by default, but we generated it using MyCrypto for Ether, which is `60`
  References:
    * https://help.keplr.app/articles/how-to-set-a-custom-derivation-path

  * TODO
    * https://github.com/scrtlabs/SecretNetwork/issues/1690
    * https://github.com/scrtlabs/SecretNetwork/issues/1689


* TODO - how should we add the Secret Relayer to deploy.ts file, is that necessary, and ensure it is used by EVM Gateway and Secret Gateway, or do we just configure the Secret Relayer to listen to specific events and foreward the associated transactions?

* Install Miniconde
  * References:
    * https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/basics/cross-chain-messaging/secretpath/how-to-deploy-secretpath-on-your-chain#setting-up-the-virtual-environment
    * https://docs.anaconda.com/miniconda/install/#quick-command-line-install

  * Linux
    ```
    mkdir -p ~/miniconda3
    wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda3/miniconda.sh
    bash ~/miniconda3/miniconda.sh -b -u -p ~/miniconda3
    rm ~/miniconda3/miniconda.sh
    ```

  * Activate Miniconda
    ```
    source ~/miniconda3/bin/activate
    conda init --all
    source ~/.zshrc
    ```
  
  * Setup
    ```
    conda create --name secretpath_env python=3.11
    y
    ```

    * Outputs:
      ```
      # To activate this environment, use
      #
      #     $ conda activate secretpath_env
      #
      # To deactivate an active environment, use
      #
      #     $ conda deactivate
      ```

    * Install Relayer dependencies
      ```
      cd ~/SecretSaturn/SecretPath/TNLS-Relayers
      pip install -r requirements.txt --no-dependencies
      pip install --upgrade lru-dict
      ```
    * Run the Relayer
      ```
      python3 web_app.py
      ```
    
    * TODO - customize the relayer to watch for events from the gateway

#### Configure

##### Deploy Nunya Contract on Localhost

* Open file ./nunya/packages/secret-contracts-scripts/src/config/deploy.ts
* Check ./nunya/packages/secret-contracts-scripts/.env has been created from the .env-sample file

* Reference: https://docs.scrt.network/secret-network-documentation/development/example-contracts/tools-and-libraries/local-secret#advantages-of-localsecret-vs.-a-public-testnet

###### Testnet

* Edit config.secret.network to be "testnet"

###### Localhost

* Edit config.secret.network to be "localhost"
  * Ensure `ENDPOINT_LOCAL` is set to where you are running the Secret Localhost (e.g. `http://<IP_ADDRESS>:1317`)
  * Ensure that `gatewayAddress`, `gatewayHash`, `gatewayPublicKey`, and `gatewayEncryptionKeyForChaChaPoly1305` and set to where you deployed the Gateway on Localhost

#### Create, Compile and Deploy (Upload and Instantiate) Secret Contract

##### Create, Compile

* Note: To build on macOS it was necessary to run the following first as specified here https://github.com/rust-bitcoin/rust-secp256k1/issues/283#issuecomment-1590391777. Other details https://github.com/briansmith/ring/issues/1824

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install llvm
llvm-config --version
echo "export AR=$(which llvm-ar)" >> ~/.zshrc
echo "export CC=$(which clang)" >> ~/.zshrc
source ~/.zshrc
``` 

* Run Docker (e.g. Docker Desktop on macOS)

* Remove any old Docker containers
```
docker rmi sco
```

* [Compile](https://docs.scrt.network/secret-network-documentation/development/readme-1/compile-and-deploy#compile-the-code). Note: Outputs contract.wasm and contract.wasm.gz file in the root directory of the secret-contracts/nunya-contract folder. Using `make build-mainnet-reproducible` will remove contract.wasm so only the optimised contract.wasm.gz remains. Warning: If you only run `make build-mainnet` then you will get this error https://github.com/svub/nunya/issues/8 when deploying.

###### Testnet

  * Nunya Contract
    ```
    cd packages/secret-contracts/nunya-contract
    make clean
    make build-mainnet-reproducible
    ```

  OR

  * My Counter Contract (Example only)
    ```
    cd packages/secret-contracts/my-counter-contract
    make clean
    make build-mainnet-reproducible
    ```

###### Localhost

  * Nunya Contract
    ```
    cd packages/secret-contracts/nunya-contract
    make clean
    make build
    ```

##### Deploy (Upload and Instantiate)

###### Testnet

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

###### Localhost

* Note: Only run `make start-server if necessary
```bash
make start-server
make copy-nunya-contract-local
make store-nunya-contract-local
```

* TODO: How to configure the Secret Gateway in Nunya Secret Contract?

#### Interact with Deployed Secret Contract via Deployed EVM Gateway to `requestValue` <a id="request-value"></a> 

##### Testnet

Options:

1. Script requestValue.ts
  * FIXME - Use Remix instead to make these transactions until resolve why not receive response from wait()
    ```bash
    yarn run secret:requestValue
    ```

2. Remix

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
    * NunyaBusiness.sol
      * Repeat relevant initial steps above for NunyaBusiness.sol
      * Enter the deployed NunyaBusiness EVM address on Sepolia Testnet (e.g. mentioned in ./nunya/packages/secret-contracts-scripts/src/config/deploy.ts) and click "At Address"
      * Scroll down to the "Deployed Contracts" section that is autogenerated to interact with the deployed contract
      * Click `setGatewayAddress` to create a transaction after providing the following argument to call the NunyaBusiness contracts transaction using the latest value from ./nunya/packages/secret-contracts-scripts/src/config/deploy.ts
        * Retrieve its value by clicking to call `CustomGateway`
      * Click `unsafeSetSecretContractInfo` to create a transaction after providing the following arguments `config.secret.testnet.contractCodeHash` and `config.secret.testnet.secretContractAddress` using values from ./nunya/packages/secret-contracts-scripts/src/config/deploy.ts
        * Retrieve their values by clicking to calls `routing_info` and `routing_code_hash`
      * Click `unsafeRequestValue` to create a transaction after providing the following arguments `0xb6c2b131` and `10000000`
        * FIXME - Why get error `Paid Callback Fee Too Low` from the `requestValue` function in the Gateway EVM contract https://sepolia.etherscan.io/tx/0xdab1b76f3ede8042c850a483a28d73c23a271e5eac37d0e500b55d625fbdbabb. It may be necessary to deploy to local network for debugging.

##### Unsorted

###### Testnet

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
