## WARNING: For internal use only.

Only consider using this if you are already familiar with the [SETUP](./_SETUP.md) file and have already followed the steps to install all relevant dependencies, since this document assumes that has already been done and skips many steps.

It may be used to create a script in future.

It assumes that the Ethereum Local Network and Secret Local Network are being run on a remote machine running Linux, since macOS may not support SGX.
The guide uses `scp` to copy file changes that are being made on a local machine across to the remote machine. Alternatively make the changes directly on the remote server using `vim` or similar, or otheriwse configure your code editor like Visual Studio Code to do so.

### Local Machine

```
cd /Users/luke/code/clones/github/svub/nunya

REMOTE_IP=172.105.184.209
SOURCE=/Users/luke/code/clones/github/svub/nunya/packages/hardhat/.env
DESTINATION=/root/nunya/packages/hardhat/.env
scp -r $SOURCE root@$REMOTE_IP:$DESTINATION

SOURCE=/Users/luke/code/clones/github/svub/nunya/packages/secret-contracts-scripts/.env
DESTINATION=/root/nunya/packages/secret-contracts-scripts/.env
scp -r $SOURCE root@$REMOTE_IP:$DESTINATION

SOURCE=/Users/luke/code/clones/github/svub/nunya/packages/secret-contracts-scripts/src/config/deploy.ts
DESTINATION=/root/nunya/packages/secret-contracts-scripts/src/config/deploy.ts
scp -r $SOURCE root@$REMOTE_IP:$DESTINATION
```

### Remote server

#### Terminal Tab 1

	* Start here

  ```bash
	ssh root@172.105.184.209

	cd ~/nunya
	nvm use
	git fetch origin submit-pubkey:submit-pubkey
	git checkout submit-pubkey
	cd ~/nunya/packages/secret-contracts/secret-gateway
	git submodule update --init --recursive
	nvm use
	docker stop secretdev && docker rm secretdev
  ```

	* WAIT

  ```bash
	make start-server
  ```

	* OPTIONAL (IF NECESSARY)

  ```bash
	docker logs -f --tail 10 secretdev
  ```

	* TODO - turn into service that can start and stop and reset

#### Terminal Tab 2

  ```bash
	ssh root@172.105.184.209

	cd ~/nunya
	nvm use

	yarn hardhat:chain
  ```

	* TODO - turn into service that can start and stop and reset

#### Terminal Tab 3

  ```bash
	ssh root@172.105.184.209

	cd ~/nunya
	nvm use

  yarn hardhat:clean
  yarn hardhat:compile
	yarn hardhat:deploy --network localhost
	yarn run secret:setEVMGatewayAddress
  ```

	* PREPARE ABI USED FOR ROUTING INFO

	* UPDATE CONFIG `gatewayContractAdminAddress` before deploy Secret Gateway
  ```bash
  SOURCE=/Users/luke/code/clones/github/svub/nunya/packages/secret-contracts-scripts/src/config/deploy.ts
  DESTINATION=/root/nunya/packages/secret-contracts-scripts/src/config/deploy.ts
  scp -r $SOURCE root@$REMOTE_IP:$DESTINATION
  ```

  ```bash
  cd ~/nunya/packages/secret-contracts/nunya-contract
  make clean
  make build

  cd ~/nunya/packages/secret-contracts/secret-gateway
  make clean
  make build
  ```

  ```bash
	cd ~/nunya
  yarn install
  yarn run secret:clean
  yarn run secret:uploadGateway
  ```

	* UPDATE CONFIG AND RUN ON LOCAL IF DIFFERS
  ```bash
  SOURCE=/Users/luke/code/clones/github/svub/nunya/packages/secret-contracts-scripts/src/config/deploy.ts
  DESTINATION=/root/nunya/packages/secret-contracts-scripts/src/config/deploy.ts
  scp -r $SOURCE root@$REMOTE_IP:$DESTINATION
  ```

	* IMPORTANT: If the CODE_HASH changes due to changes in the Secret Gateway codebase, it is also necessary to update the `code_hash` in the Relay to match it.

  ```bash
  yarn run secret:instantiateGateway
  ```

  * Get the Secret Gateway public key (signing verification key '0x' prefixed hex string) and base64 encryption key
	```bash
	yarn run secret:querySecretGatewayPubkey
  ```

  Example output:
	```
	res queryPubkey:  {
	  encryption_key: '...',
	  verification_key: '0x...'
	}
	```

  * Paste `verification_key` into Gateway.sol for value of `secret_gateway_signer_pubkey`
  * Redeploy if differs Gateway.sol 

	* Paste them into deploy.ts, `gatewayContractPublicKey` with `verification_key` and `gatewayContractEncryptionKeyForChaChaPoly1305` with `encryption_key`

	* UPDATE CONFIG AND RUN ON LOCAL IF DIFFERS
  ```bash
  SOURCE=/Users/luke/code/clones/github/svub/nunya/packages/secret-contracts-scripts/src/config/deploy.ts
  DESTINATION=/root/nunya/packages/secret-contracts-scripts/src/config/deploy.ts
  scp -r $SOURCE root@$REMOTE_IP:$DESTINATION
  ```

  ```bash
	yarn run secret:clean
	yarn run secret:upload
  ```

	# UPDATE IF DIFFERS deploy.ts

  ```bash
	yarn run secret:instantiate
  ```

	# UPDATE IF DIFFERS deploy.ts

  ```bash
	docker exec -it secretdev secretcli tx bank send secret1ap26qrlp8mcq2pg6r47w43l0y8zkqm8a450s03 secret1glfedwlusunwly7q05umghzwl6nf2vj6wr38fg 100000000000000000uscrt -y

	docker exec -it secretdev secretcli query bank balances secret1glfedwlusunwly7q05umghzwl6nf2vj6wr38fg | jq
  ```

#### Terminal Tab 4

  ```bash
	cd ~/nunya
	nvm use
	cd ~/ltfschoen/SecretPath/TNLS-Relayers
	git fetch origin nunya:nunya
	git checkout nunya
  ```

  * IF NECESSARY

  ```bash
	REMOTE_IP=172.105.184.209
	SOURCE=/Users/luke/code/clones/github/ltfschoen/SecretPath/TNLS-Relayers/config.yml
	DESTINATION=/root/ltfschoen/SecretPath/TNLS-Relayers/config.yml
	scp -r $SOURCE root@$REMOTE_IP:$DESTINATION

	REMOTE_IP=172.105.184.209
	SOURCE=/Users/luke/code/clones/github/ltfschoen/SecretPath/TNLS-Relayers/.env
	DESTINATION=/root/ltfschoen/SecretPath/TNLS-Relayers/.env
	scp -r $SOURCE root@$REMOTE_IP:$DESTINATION
  ```

  ```bash
	docker exec -it secretdev secretcli tx bank send secret1ap26qrlp8mcq2pg6r47w43l0y8zkqm8a450s03 secret1glfedwlusunwly7q05umghzwl6nf2vj6wr38fg 100000000000000000uscrt -y

	docker exec -it secretdev secretcli query bank balances secret1glfedwlusunwly7q05umghzwl6nf2vj6wr38fg | jq
  ```

  ```bash
	conda activate secretpath_env
	pip install -r requirements.txt --no-dependencies
	pip install --upgrade lru-dict
  ```

  ```bash
	python3 web_app.py
  ```

#### Terminal Tab 3

* RUN AFTER RELAYER STARTED

* Record logs from Localsecret since the output is too long otherwise. Press CTRL+C to cancel when PostExecution occurs in Ethereum Local Network logs to indicate it has finished.

```bash
docker logs -f secretdev | tee ~/nunya/docker.log
```

* Run end-to-end transaction

```bash
cd ~/nunya
nvm use
yarn run secret:submitRequestValue
```

* Copy Localsecret logs from remote machine to local.  
```bash
REMOTE_IP=172.105.184.209
SOURCE=/root/nunya/docker.log
DESTINATION=/Users/luke/code/clones/github/svub/nunya
scp -r root@$REMOTE_IP:$SOURCE $DESTINATION
```

### Notes

* Note: Restart all nodes and re-do steps in Terminal Tab 2 if any of the changes are made since it's faster, otherwise the CODE_ID and CONTRACT_ADDRESS may change requiring updating the config file between uploading and instantiation, which is annoying.
