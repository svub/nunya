
# Nunya.business

> Receive business payments without revealing to other clients what you've earned.

**Table of contents**

* [About](#about)
* [Specification](#specification)
* [Setup](#setup)
  * [Setup Frontend & Solidity Contracts](#setup-frontend)
  * [Setup Secret Contracts](#setup-secret)
* [License](#license)
* [Disclaimer](#disclaimer)

## About <a id="about"></a>

Wanna get yer salary in crypto, but don't want all your clients to know what you charge the others? Nunya.business can help! Your clients pay to a smart contract and you can decide when you pick up the treasure. All bookkeeping is done in a separate private smart contract on the [Secret.network](https://scrt.network/).

### The use case

For people new to public ledgers, it can be a rude awakening to realize that sharing an address means anyone can track all of their transactions—both incoming and outgoing, past and future! Imagine if every person you gave your bank account number to could access your entire transaction history... Unsettling, right? 

Nunya ftw! By adding a simple Nunya payment reference—either as a link or a QR code—to your invoice, you can enable clients to pay directly from their Web3 wallets without exposing any sensitive details. Later on, you can in parts or all at once redeem their payments to an address of your choosing. Encryption ensures that all bookkeeping data is kept protected in a secret contract on [Secret.network](https://scrt.network/). Like with a bank and a bank account. But decentralized and better. 😎

### The pitch

In the world of blockchain payments, a critical challenge remains: balancing the inherent transparency of public ledgers with the privacy needs of businesses and individuals. **Nunya** solves this problem by providing a simple, user-friendly interface that allows non-technical users to accept crypto payments without exposing their personal transaction history or wallet balances. 

Built on-chain with no central authority, Nunya leverages the security and decentralization of blockchain while maintaining confidentiality. By integrating with public ledger blockchains like Ethereum and other EVM-compatible chains, Nunya brings a level of privacy typically reserved for traditional banking systems to the world of decentralized finance (DeFi).

Furthermore, Nunya offers a pathway to incentivize community engagement through a customizable utility token, and the platform can generate sustainable revenue by incorporating automated transaction fees—similar to the mechanisms employed by DeFi protocols like Uniswap. 

In short, Nunya bridges the gap between transparency and privacy, providing businesses with a secure, scalable, and professional way to manage crypto payments while preserving the privacy of all parties involved.

## Specification <a id="specification"></a>

### State of the secret contract

There are *two* main state elements in the Secret contract.

> TODO
 
They use three types for their keys and values: `secretUser`, `ref` and `u__`.

Note that previously `secretUser` was called `authOut`, and in the Solidity contract it is named `secret`. They all refer to a fixed length hash of something, that the user receiving payments uses to authenticate.

#### `balances`
 A mapping from each user's `secret` to their balance (`u___`)

#### `paymentRefs`
 A mapping from every payment ref that every user has created, to the `authOut` of the user that created it.

##### the `ref` type
 This may be extended in future work. 

 The underlying type should be something we can compare easily in secret contracts. For simpilcity we should limit it to 32 bytes. I propose `string` (but if something else is easier, we could choose any 32 byte type and cast it in Solidity and the frontend).

##### the `authOut` type

> TODO
 
 will be exentded in future work to include different types of auth.
 for now, an `authOut` will represent a password. The password does not even need to be encrypted since it will be encrypted for transport from the frontend, and encrypted in storage in the secret contract transparently due to the TEE.
 However, for appearances sake, it would be nice to encrypt it ourselves in storage, 
 Therefore the type of `authOut` could be `string`, but may be better being `bytes32` - so that we can cast various different types of auth into it now and later.

##### the balances type
 is not even its own type, will just be an unsigned integer. `u32` is overkill, but it is also standard for balances so we may as well use it.

### Secondary state elements
  
#### Contract's own (pub, priv) keypair
 The privkey allows us to sign receipts.

 The pubkey allows the sender of a payment to encrypt the payment reference

 Note that these are secp1k256 keys, *not* the type of keys which encrypt transport between the frontend and the secret contract.


> TODO
 
 These type may already be determined by how secret network contracts generate contract keypairs. I guhess they are going to be some kind of bytes32.

#### Any elements inherent to secret contracts

> TODO
 
 I don't know what these are but @ltfschoen mentioned, for example, storing the gateway contract's address.


### types used for input output but not stored in state
 
#### `address`
 will be accepted  by withdrawTo function

#### `pubkey` / `Option(pubkey)`

secp1k256 - allows a sender of funds who wants a receipt to (optionally) receive that receipt encrypted with their pubkey

#### messaging types used by secret contracts
 such as `handle`, which specifies which function is being called.
 I have not looked into these in detail

### What about..

#### storing the withdrawal address.
We do not store  the withdrawal address.

#### usernames
We do not use usernames. We can, as future work, modularly update authOut so that it can also represent a (user, password), instead of just a password. But there is NO REASON to complexify things with this feature at this stage.

#### approvals, permissions, roles
There are no approvals, permissions or roles.

The only fucntion that requires any authentication is `withdrawTo`, and the authentication is solely on the basis of the `authOut` provided when calling that function. If the user provides the correct `authOut` to map to a `balance`, then they have full control of the whole of the balance.

### Functions:

##### new_auth_out (preferred_auth : authOut)
```
if preferred_auth exists already as a key in balances, then report error.
if not, then add it as a key with balance 0 and report success.
```

###### link_payment_reference (auth : authOut, payment_ref : ref)
```
if auth does not exist as a key in balances, then report error.
if not: 
    if payment_ref already exists as a key in paymentRefs, then randomly generate an alternative and set payment_ref to that.
    add payment_ref as a key in paymentRefs and set its value to auth
```
##### accept_payment (payment_ref : ref, amount : u__, encrypt_to : Option(pubkey))
```
<<< future work: 
if payment_ref is encrypted with secret contract's own pubkey
    decrypt it and set payment_ref to the decrypted version >>>
```

```
if payment_ref not exist as a key in paymentRefs, then report error.
if it does:
    add amount to balances[ paymentRefs[payment_ref] ]
    create a receipt (eg json) { payment_ref, amount }
    sign the receipt with the secret contract's privkey
    if encrypt_to contains a pubkey:
        encrypt the receipt and signature with pubkey and return them
    if not,
        return the receipt and signature
```
 
##### withdraw_to (auth : authOut, amount : u__, withdrawal_address : address)
```
if auth does not exist as a key in balances, then report error.
if balances[auth] < amount then report error.
if neither error:
    return DO_THE_WITHDRAWAL (withdrawal_address, amount)   
```

##### retrieve_pubkey ()
```
return the secret contract's own pubkey
```

## Setup <a id="setup"></a>

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

2. Run a local network in the first terminal:

Note: Use `accounts: [deployerPrivateKey]` or `accounts: { mnemonic: MNEMONIC }` in ./packages/hardhat/hardhat.config.ts

```
yarn chain
```

This command starts a local Ethereum network using Hardhat. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `packages/hardhat/hardhat.config.ts`.

3. On a second terminal, deploy the test contract to desired network (e.g. `yarn deploy --network localhost` or `yarn deploy --network sepolia`)

```
yarn deploy
```

> Note: The contract is located in `packages/hardhat/contracts` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/hardhat/deploy` to deploy the contract to the network. You can also customize the deploy script.

4. On a third terminal, start the Nunya NextJS app:

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

## License <a id="license"></a>

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](./LICENSE) file for details.

It was built based on Scaffold ETH 2 that has MIT license that must be respected - see the [LICENSE-SE-2](./LICENSE-SE-2).

The Secret contracts were built based on the example [SecretPath Confidential Voting Tutorial](https://github.com/SecretFoundation/Secretpath-tutorials/tree/master/secretpath-voting). 

## Disclaimer <a id="disclaimer"></a>

See the [DISCLAIMER](./DISCLAIMER.md) file for details.
