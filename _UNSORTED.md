## Unsorted

The below is unfinished work that may not be necessary anymore.

### WIP - SecretCLI <a id="run-secret-cli"></a> 

Enter Secret Development Docker container to interact manually with SecretCLI:

```bash
docker exec -it secretdev /bin/bash
secretcli --help
secretcli keys list
ls /root/.secretd/config
```

* IGNORE - Transfer some Localhost Ethereum tokens from a default account like `Account #0` that is shown when running Ethereum Localhost to an Ethereum wallet address associated with the private key `ETH_DEVELOPMENT_PRIVATE_KEY`.
  ```
  Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
  privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  ```

  * TODO - is this necessary? why not just use the default account?

* Transfer some Localhost Secret tokens from a default account that is shown when running Secret Localhost (e.g. secret1ap26qrlp8mcq2pg6r47w43l0y8zkqm8a450s03) to that Secret wallet address (e.g. secret1glfedwlusunwly7q05umghzwl6nf2vj6wr38fg).
  * Reference: https://docs.scrt.network/secret-network-documentation/infrastructure/secret-cli/configuration

  ```
  docker exec -it secretdev /bin/bash
  secretcli config view
  secretcli config set client node tcp://localhost:26657
  secretcli config set client chain-id secretdev-1
  secretcli config set client output json
  secretcli config set client keyring-backend test
  secretcli config view client --output-format json
  secretcli config home

  secretcli query bank balances secret1ap26qrlp8mcq2pg6r47w43l0y8zkqm8a450s03 | jq
  secretcli query bank balances secret1glfedwlusunwly7q05umghzwl6nf2vj6wr38fg | jq
  ```
  * Note: Configuration is stored in /root/.secretd/config/client.toml
  * Note: `keyring-backend` is where the keys are stored from possible options including: (os|file|kwallet|pass|test|memory)
  * Note: We need the 300000uscrt to process the broadcast the `submitRequestValue` transaction from the relayer, so give them more than that.
  * Note: If you forget to do this before running the relayer, then you might get error `[SCRT Interface: ERROR] Failed to fetch account info: HTTP 404`
  ```
  secretcli tx bank send secret1ap26qrlp8mcq2pg6r47w43l0y8zkqm8a450s03 secret1glfedwlusunwly7q05umghzwl6nf2vj6wr38fg 100000000000000000uscrt -y

  secretcli query bank balances secret1glfedwlusunwly7q05umghzwl6nf2vj6wr38fg | jq
  ```

    * Note: This is necessary because the default account only has a mnemonic phrase, not a private key.

  * IGNORE
    ```
    a_mnemonic="grant rice replace explain federal release fix clever romance raise often wild taxi quarter soccer fiber love must tape steak together observe swap guitar"
    echo $a_mnemonic | secretcli keys add account --recover
    secretcli keys show account
    
    # it should output `secret1ap26qrlp8mcq2pg6r47w43l0y8zkqm8a450s03`

    b_mnemonic="jelly shadow frog dirt dragon use armed praise universe win jungle close inmate rain oil canvas beauty pioneer chef soccer icon dizzy thunder meadow"
    echo $b_mnemonic | secretcli keys add account2 --recover
    secretcli keys show account2

    # it should output `secret1fc3fzy78ttp0lwuujw7e52rhspxn8uj52zfyne`

    custom_mnemonic="<INSERT_MNEMONIC_PHRASE>"
    echo $custom_mnemonic | secretcli keys add custom --hd-path="m/44'/60'/0'/0" --recover
    secretcli keys show custom
    ```

    * IGNORE
      * TODO - why doesn't the wallet address recovered with `custom_mnemonic` match the one that was generated with MyCrypto when recovering it with that mnemonic phrase? is it possible to recover with the private key instead so it recovers the correct wallet address?
      * Note: Used `m/44'/60'/0'/0` since that was the default HD path chosen when generating the wallet in MyCrypto for use with Metamask that uses BIP44 derivation, where the HD path is defined as `m / purpose' / coin_type' / account' / change / address_index`
      References: 
        * https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
        * https://ethereum.stackexchange.com/questions/19055/what-is-the-difference-between-m-44-60-0-0-and-m-44-60-0
      * Note: The `coin_type` is `529` for Secret Network by default, but we generated it using MyCrypto for Ether, which is `60`
      References:
        * https://help.keplr.app/articles/how-to-set-a-custom-derivation-path
      * TODO
        * https://github.com/scrtlabs/SecretNetwork/issues/1690
        * https://github.com/scrtlabs/SecretNetwork/issues/1689
