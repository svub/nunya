# Super Quick Start

> WARNING: Only consider using this if you are already familiar with the [SETUP](./_SETUP.md) file and have already followed the steps to install all relevant dependencies, since this document assumes that has already been done and skips many steps. It will eventually be migrated into [SETUP](./_SETUP.md).

It has only been configured to use Local development networks, not Testnets or Mainnet.

It assumes that the Ethereum Local Network and Secret Local Network are being run on a remote machine running Linux, since macOS may not support SGX. In this guide it assumes that you are making changes directly on a local machine or a remote server that supports SGX using `vim` or similar, or otheriwse configuring your code editor like Visual Studio Code to do so.
If necessary, use `scp` to copy file changes that are being made on a local machine across to the remote machine (e.g. `scp -r $SOURCE root@$REMOTE_IP:$DESTINATION`).

> MAINTAINERS: If you are a maintainer of this repository, then consider initially following the steps in [_MAINTAINER](./_MAINTAINER.md).

## Configure Editor

* Setup remote editing if using remote Linux server
	* Install and open Visual Studio Code
	* Install Plugin "Remote Explorer"
	* Remote Explorer
	* Click SSH > + (Note: Replace the IP address below with your own)
		* Enter `ssh root@172.105.184.209`, choose to update /Users/luke/ssh/config
		* Click 172.105.184.209 > "root" > "Connect in Current Window"
	* Go to Extensions, search for "solidity", and click the apply that extension to "SSH 172.105.184.209" for syntax highlighting
	* Use the "Terminal" in Visual Studio code to interact

## Setup

* Configure `PROJECT_ROOT` to be the path to the directory where you want to install it.
	```bash
	export PROJECT_ROOT=~/nunya
	```
* Clone https://github.com/svub/nunya into `$PROJECT_ROOT`
* Fetch latest from branch 'submit-pubkey'.
	```bash
	BRANCH_NUNYA=submit-pubkey
	cd $PROJECT_ROOT
	git fetch origin $BRANCH_NUNYA:$BRANCH_NUNYA
	git checkout $BRANCH_NUNYA
	cd $PROJECT_ROOT/packages/secret-contracts/secret-gateway
	git submodule update --init --recursive
	nvm use
	docker stop secretdev && docker rm secretdev
	```
	* Generate the .env files
		```bash
		ETH_CONTRACTS_PATH=$PROJECT_ROOT/packages/hardhat
		cp $ETH_CONTRACTS_PATH/.env.example $ETH_CONTRACTS_PATH/.env

		SCRIPTS_PATH=$PROJECT_ROOT/packages/secret-contracts-scripts
		cp $SCRIPTS_PATH/.env.example $SCRIPTS_PATH/.env

		FRONTEND_PATH=$PROJECT_ROOT/packages/nextjs
		cp $FRONTEND_PATH/.env.example $FRONTEND_PATH/.env
		```
	* Configure the following files:
		* $PROJECT_ROOT/packages/secret-contracts-scripts/src/config/config.ts
		* $PROJECT_ROOT/packages/hardhat/.env
		* $PROJECT_ROOT/packages/secret-contract-scripts/.env
* Initialise Gitsubmodules to include the Relayer and the relevant branch
	```bash
	git submodule update --init --recursive --remote
	```
	* Generate the .env file for the Relayer
		```bash
		RELAYER_PATH=/root/nunya/packages/relayer
		cp $RELAYER_PATH/SecretPath/TNLS-Relayers/.env.example $RELAYER_PATH/SecretPath/TNLS-Relayers/.env
		```
	* Configure the following files for the Relayer:
		* $PROJECT_ROOT/packages/relayer/SecretPath/TNLS-Relayers/.env
			* Add a value for `secret-private-key` that you obtain from creating a new Keplar Wallet that must use Google to generate an associated private key, and exclude the '0x' prefix
		* $PROJECT_ROOT/packages/relayer/SecretPath/TNLS-Relayers/config.yml

* Run the following to start the Secret Development Node docker container, the Ethereum Development Node systemd service, and the Relayer systemd service.
	```
	$PROJECT_ROOT/scripts/run.sh $PROJECT_ROOT
	```
	* Note: If you modified your custom Secret Gateway code and the CODE_HASH changes, the script automatically update the `code_hash` of the Relay in the relevant Gitsubmodule to match it.
* Wait for the script to output "Finished loading"
* Run examples
	```bash
	nvm use
	yarn run secret:submitRequestValue
	```
	OR 
	```bash
	nvm use
	yarn run secret:submitRetrievePubkey
	```
* Watch the logs
	* Ethereum Local Node. Verify it calls `PostExecution` and the callback function in NunyaBusiness.sol contract.
		```bash
		journalctl -u ethlocal.service -f | tee ~/nunya/ethlocal.service.log
		```
	* Secret Local Node. Optional `docker logs -f --tail 10 secretdev`.
		```bash
		docker logs -f secretdev | tee ~/nunya/secret.service.log
		```
		* Decode the base64 `result` value (e.g. `eyJ...n0=\` from Localsecret logs at https://base64.guru/converter/decode/text
			```bash
			INFO  [enclave_contract_engine::wasm3] debug_print: "msg: PostExecutionMsg {\n    result: \"eyJfcmVxdWVzdF9pZCI6eyJuZXR3b3JrIjoiMzEzMzciLCJ0YXNrX2lkIjoiNCJ9LCJfa2V5IjpbMiwyNTEsMTg4LDE0MywxNjMsMTExLDM0LDE1OCwxNjcsODIsMTE1LDE4OSwyNSwyMzksMTcyLDEyNiw4LDY3LDIzMCwxMzgsNTAsNzcsODEsMTEzLDEyMiwyMDEsNzYsMjE5LDI0Myw1NSwxMzQsMjE0LDg2XSwiX2NvZGUiOjAsIl9udW55YV9idXNpbmVzc19jb250cmFjdF9hZGRyZXNzIjoiMHhBRkZGMzExODIxQzNGM0FGODYzQzcxMDNCQjE3QkRDMUJhMDQ2MDNEIn0=\"
			```
	* Relayer
		```bash
		journalctl -u relayer.service -f | tee ~/nunya/relayer.service.log
		```

* Optional:
  * Get the Secret Gateway public key (signing verification key '0x' prefixed hex string) and base64 encryption key. Note that the ./scripts/run.sh script already automatically uses a similar script to this to copy and paste the `gatewayContractPublicKey` with `verification_key` and `gatewayContractEncryptionKeyForChaChaPoly1305` with `encryption_key` into $PROJECT_ROOT/packages/secret-contracts-scripts/src/config/config.ts
		```bash
		yarn run secret:querySecretGatewayPubkey
		```

## Troubleshooting

### Restart Secret Network Development Node
```bash
docker stop secretdev && \
docker rm secretdev && \
sleep 5 && \
cd $PROJECT_ROOT/packages/secret-contracts/secret-gateway && nvm use && make start-server && \
docker logs -f secretdev | tee $PROJECT_ROOT/docker.log
```


### Restart Ethereum Development Node Service

```bash
systemctl stop ethlocal
systemctl enable ethlocal
systemctl daemon-reload
systemctl start ethlocal
systemctl restart ethlocal
systemctl status ethlocal
journalctl -u ethlocal.service -f
```

### Restart Relayer Service
```
systemctl stop relayer
systemctl enable relayer
systemctl daemon-reload
systemctl start relayer
systemctl restart relayer
systemctl status relayer
journalctl -u relayer.service -f
```

## About

### Development Environment

#### Services

* Custom Ethereum Nunya contract [NunyaBusiness.sol](./packages/hardhat/contracts/NunyaBusiness.sol) contract gets deployed on an Ethereum Development Node that is running in a systemd service that is running. Calls to it shall interact with the custom Public Gateway.
* Custom Ethereum Public Gateway contract also gets deployed on an Ethereum Development Node. It was copied from https://github.com/SecretSaturn/SecretPath/blob/main/TNLS-Gateways/public-gateway/src/Gateway.sol and modified. Ideally in future the changes made to it should be transferred to a fork at https://github.com/ltfschoen/SecretPath and used instead
* Custom Relayer uses this fork https://github.com/ltfschoen/SecretPath. It is configured to listens to events emitted by each Gateway and broadcast transactions from the source chain to the destination chain. 
* Custom [Private Secret Gateway contract](./packages/secret-contracts/secret-gateway) gets deployed on Secret Development Network running in a Docker container. It was copied from https://github.com/ltfschoen/SecretPath/tree/main/TNLS-Gateways/secret and modified. It interacts with the Custom Relayer and the Nunya Private contract that gets deployed on on Secret Development Network.
* Custom private Secret [Nunya contract](./packages/secret-contracts/nunya-contract/src/contract.rs) gets deployed on Secret Development Network.
