#!/usr/bin/env bash

# Important: Only configured to work on Linux since cannot run on macOS Silicon due to SGX

# Part 1 - Secret Network

PROJECT_ROOT=$1
USE_NETWORK=$2
echo -e "PROJECT_ROOT: $PROJECT_ROOT"
echo -e "USE_NETWORK: $USE_NETWORK"
cd $PROJECT_ROOT

# Install Docker for Linux
#
# It is needed to compile Secret Network contracts for Testnet or Mainnet that are optimized
# It is also needed incase we want to run the Secret Development Network locally on Localhost
if [ ! -f /usr/bin/docker ]; then
  echo "docker not found. Installing Docker"

  sudo apt-get remove docker docker-engine docker.io containerd runc
  sudo apt-get update && sudo apt-get upgrade -y
  sudo apt-get install apt-transport-https ca-certificates curl gnupg-agent software-properties-common -y
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
  sudo apt-key fingerprint 0EBFCD88
  sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" -y
  sudo apt-get update
  sudo apt-get install docker-ce docker-ce-cli containerd.io -y
  adduser user
  usermod -aG docker user
  systemctl restart docker
  systemctl daemon-reload
  systemctl enable docker
  sudo apt-get install -y docker-compose-plugin
fi

if [ $USE_NETWORK == "localhost" ]; then
  # Localhost - Secret Network Development Node Docker Container

  rm docker.log
  docker stop secretdev && docker rm secretdev

  sleep 5

  SERVICE=ethlocal.service
  systemctl stop $SERVICE
  sleep 5
  systemctl disable $SERVICE
  rm /etc/systemd/system/$SERVICE
  systemctl daemon-reload
  systemctl reset-failed

  rm -rf /opt/ethlocal
  rm -rf /mnt/storage1/.chains
fi


SERVICE=relayer.service
systemctl stop $SERVICE
sleep 5
systemctl disable $SERVICE
rm /etc/systemd/system/$SERVICE
systemctl daemon-reload
systemctl reset-failed

rm -rf /opt/relayer


# update environment with PATH so nvm available
source ~/.zshrc

apt update
nvm install
nvm use

which node

# Install dependencies. Reference https://docs.scrt.network/secret-network-documentation/development/readme-1

apt-get install -y git make

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
rustup update
rustup default stable
# Add WASM build target
rustup target add wasm32-unknown-unknown
# Restart shell
source "$HOME/.cargo/env"
# Install cargo-generate
cargo install cargo-generate --features vendored-openssl

# Install SecretCLI on Linux

wget https://github.com/scrtlabs/SecretNetwork/releases/download/v1.15.0-beta.19/secretcli-Linux
# wget https://github.com/scrtlabs/SecretNetwork/releases/latest/download/secretcli-Linux
chmod +x secretcli-Linux
mv secretcli-Linux /usr/bin/secretcli
echo 'PATH=/usr/bin/secretcli:$PATH' >> ~/.zshrc
source ~/.zshrc

npm install -g lerna
npm install -g yarn
npm install -g corepack
yarn set version 4.5.3
corepack enable
corepack prepare yarn@v4.5.3 --activate
yarn install


cd $PROJECT_ROOT/packages/secret-contracts/secret-gateway
git submodule update --init --recursive
nvm use
# docker stop secretdev && docker rm secretdev
# sleep 5

if [ $USE_NETWORK == "localhost" ]; then
  # Secret Development
  #
  # Reference: https://docs.scrt.network/secret-network-documentation/development/example-contracts/tools-and-libraries/local-secret#advantages-of-localsecret-vs.-a-public-testnet
  #
  # Run `make start-server` in daemon background mode. This generates multiple in-build accounts
  # that each have an initial balance of 1000000000000000000uscrt and are shown at the start of the logs
  # including account `a` with address `secret1ap26qrlp8mcq2pg6r47w43l0y8zkqm8a450s03`.
  #
  # Ports:
  # RPC, 26657, secretcli, Keplr, cosmjs
  # gRPC-web, 9091, secretjs@v1.4 (deprecated)
  # SCRT Faucet, 5000, to get SCRT
  # LCD, 1317, secretjs, Keplr, secretjs@v0.17.5 (deprecated)
  cd $PROJECT_ROOT/packages/secret-contracts/secret-gateway
  make start-server-daemon
  # docker run -it -d --rm -p 9091:9091 -p 26657:26657 -p 26656:26656 -p 1317:1317 -p 5000:5000 -v $PWD:/root/code --name secretdev ghcr.io/scrtlabs/localsecret:v1.15.0-beta.19
  # docker logs -f secretdev | tee $PROJECT_ROOT/docker.log
fi

# Part 2 - Ethereum Network

# Localhost - Ethereum Development Node Service

cd $PROJECT_ROOT/packages/hardhat
nvm use

if [ $USE_NETWORK == "localhost" ]; then
  sudo adduser ethlocal_service --system --no-create-home
  DB_STORAGE="/mnt/storage1"
  mkdir -p $DB_STORAGE/.chains

  mkdir -p /opt/ethlocal
  cp $PROJECT_ROOT/scripts/ethlocal/start.sh /opt/ethlocal
  sudo chown -R ethlocal_service /opt/ethlocal
  sudo chmod 755 /opt/ethlocal/start.sh

  # create a soft link to this file in my present directory:

  sudo rm /opt/ethlocal/hardhat
  # create symlink
  sudo ln -s $PROJECT_ROOT/packages/hardhat/node_modules/.bin/hardhat /opt/ethlocal/hardhat
  # change permission to symlink and where it points to
  sudo chown -R ethlocal_service $DB_STORAGE/.chains
  sudo chown -R ethlocal_service /opt/ethlocal
  sudo chown -R ethlocal_service $PROJECT_ROOT/packages/hardhat/node_modules/.bin/
  sudo chown -R ethlocal_service $PROJECT_ROOT/packages/hardhat/node_modules/hardhat/
  # change permission to symlink and where it points to
  sudo chmod 755 /opt/ethlocal/hardhat
  sudo chmod 755 $PROJECT_ROOT/packages/hardhat/node_modules/.bin/hardhat
  sudo chmod 755 $PROJECT_ROOT/packages/hardhat/node_modules/hardhat/internal/cli/bootstrap.js
  # ls -al /opt/ethlocal

  # Create service file

  touch /etc/systemd/system/ethlocal.service

  {
    echo '[Unit]'
    echo 'Description=Ethereum Network Development Node systemd service'
    echo 'After=network.target'
    echo 'StartLimitIntervalSec=0'
    echo '[Service]'
    echo 'Type=simple'
    echo 'Restart=on-failure'
    echo 'RestartSec=10'
    # FIXME: Change to `User=ethlocal_service` without `Permission denied` error
    echo 'User=root'
    # echo 'User=ethlocal_service'
    echo 'SyslogIdentifier=ethlocal'
    echo 'SyslogFacility=local7'
    echo 'KillSignal=SIGHUP'
    echo 'ExecStart=/opt/ethlocal/start.sh'
    # Note: Must be inside a hardhat project to run the command otherwise error
    # Error HH1: You are not inside a Hardhat project.
    # It runs this from directory root `/` hence the error. Suggest move into a script where can change directory.
    echo "WorkingDirectory=$PROJECT_ROOT/packages/hardhat" # must be run inside a Hardhat project
    echo '[Install]'
    echo 'WantedBy=multi-user.target'
  } > /etc/systemd/system/ethlocal.service

  # cat /etc/systemd/system/ethlocal.service

  DB_STORAGE="/mnt/storage1"
  mkdir -p $DB_STORAGE/.chains/ethlocal
  sudo chown -R ethlocal_service $DB_STORAGE/.chains

  systemctl stop ethlocal
  sleep 5
  systemctl enable ethlocal
  systemctl start ethlocal
  # load new settings instead of use old cache settings
  systemctl daemon-reload
  systemctl status ethlocal
fi

# Part 3 - Ethereum Contracts Deployment to Ethereum Network Development Node

cd $PROJECT_ROOT
nvm use
yarn hardhat:clean
yarn hardhat:compile
# Uses the deploy script located in `packages/hardhat/deploy` to deploy the contract to the network
# TODO: Adapt depending on network the user configuration they want to use (e.g. `localhost`, or `sepolia`)
if [ $USE_NETWORK == "localhost" ]; then
  yarn hardhat:deploy --network localhost
elif [ $CHOSEN_NETWORK == "testnet" ]; then
  yarn hardhat:deploy --network sepolia
elif [ $CHOSEN_NETWORK == "mainnet" ]; then
  yarn hardhat:deploy --network mainnet
else
  echo -e "Chosen network not supported"
fi
# Set the Gateway EVM address in the state of the deployed NunyaBusiness.sol contract
yarn run secret:setEVMGatewayAddress

# TODO: If testnet, then output the Etherscan or Blockscout transaction hash e.g. https://sepolia.etherscan.io/tx/0x_

# Part 4 - Secret Contract custom Gateway and custom private Secret Contarct Deployment to Secret Network Development Node

# References:
# - https://docs.scrt.network/secret-network-documentation/development/readme-1/compile-and-deploy
#
# Clean and compile to generate latest ABI file in $PROJECT_ROOT/packages/hardhat/artifacts/contracts/Gateway.sol/Gateway.json
# since it is used in the Secret network script `secret:uploadAndInstantiateGateway`
#
# Note: Outputs contract.wasm and contract.wasm.gz file in the root directory of the secret-contracts/nunya-contract folder.
# Using `make build-mainnet-reproducible` will remove contract.wasm so only the optimised contract.wasm.gz remains.
# Warning: If you only run `make build-mainnet` then you will get this error https://github.com/svub/nunya/issues/8 when deploying.
#
# Note: Use `make build-mainnet-reproducible` for both Testnet and Mainnet, NOT just Mainnet
if [ $USE_NETWORK == "localhost" ]; then
  cd $PROJECT_ROOT/packages/secret-contracts/nunya-contract
  make clean
  make build

  cd $PROJECT_ROOT/packages/secret-contracts/secret-gateway
  make clean
  make build
elif [ $CHOSEN_NETWORK == "testnet" || $CHOSEN_NETWORK == "mainnet" ]; then
  # Remove any old Docker containers, if necessary, that were used to compile the Testnet or Mainnet code
  docker rmi sco

  cd $PROJECT_ROOT/packages/secret-contracts/nunya-contract
  make clean
  make build-mainnet-reproducible

  cd $PROJECT_ROOT/packages/secret-contracts/secret-gateway
  make clean
  make build-mainnet-reproducible
else
  echo -e "Chosen network not supported"
fi

cd $PROJECT_ROOT
yarn install
yarn run secret:clean
yarn run secret:uploadAndInstantiateGateway

# yarn run secret:querySecretGatewayPubkey

# IMPORTANT: Both upload and instantiate must be performed using the same version of secretjs
yarn run secret:clean
yarn run secret:uploadAndInstantiateNunya

# TODO: If the user is using Secret Testnet then output the link to view the contract on the
# Secret Testnet block explorer at https://testnet.ping.pub/secret/

docker exec -it secretdev secretcli tx bank send secret1ap26qrlp8mcq2pg6r47w43l0y8zkqm8a450s03 secret1glfedwlusunwly7q05umghzwl6nf2vj6wr38fg 100000000000000000uscrt -y
# docker exec -it secretdev secretcli query bank balances secret1glfedwlusunwly7q05umghzwl6nf2vj6wr38fg | jq

# Part 5 - Relayer

apt install -y jq
echo -e "Folder: $PWD"
# PARENT_DIR="$(dirname "$PWD")"
JSON_DEPLOYED=$(cat $PWD/deployed.json)
echo -e "deployed.json: $JSON_DEPLOYED"
RELAYER_PATH=$(echo "$JSON_DEPLOYED" | jq -r '.data.relayer.path')
echo -e "RELAYER_PATH: $RELAYER_PATH"

cd $PROJECT_ROOT
# Set the Secret Gateway code hash in the Relay config.yml file for the network to be the latest deployed code hash
# TODO: Provide $JSON_DEPLOYED $RELAYER_PATH as arguments using `jq tostring` or similar
bash $PROJECT_ROOT/scripts/set-relayer.sh

# Part 6 - Relayer (continued)

# Reference: https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/basics/cross-chain-messaging/secretpath/how-to-deploy-secretpath-on-your-chain
sudo adduser relayer_service --system --no-create-home

mkdir -p /opt/relayer
cp $PROJECT_ROOT/scripts/relayer/start.sh /opt/relayer
cp $PROJECT_ROOT/scripts/relayer/node.sh /opt/relayer
sudo chown -R relayer_service /opt/relayer
sudo chmod 755 /opt/relayer/start.sh
sudo chmod 755 /opt/relayer/node.sh

sudo rm /opt/relayer/web_app.py
# create symlink in /opt/relayer to $RELAYER_PATH/SecretPath/TNLS-Relayers/web_app.py
sudo ln -s $RELAYER_PATH/SecretPath/TNLS-Relayers/web_app.py /opt/relayer/web_app.py
sudo chown -R relayer_service /opt/relayer
sudo chown -R relayer_service $RELAYER_PATH/SecretPath/TNLS-Relayers
# change permission to symlink and where it points to
sudo chmod 755 /opt/relayer/web_app.py
sudo chmod 755 $RELAYER_PATH/SecretPath/TNLS-Relayers/web_app.py

# Create service file

touch /etc/systemd/system/relayer.service

{
  echo '[Unit]'
  echo 'Description=Relayer between Ethereum Network Development Node and Secret Network Development Node systemd service'
  echo 'After=network.target'
  echo 'StartLimitIntervalSec=0'
  echo '[Service]'
  echo 'Type=simple'
  echo 'Restart=on-failure'
  echo 'RestartSec=10'
  # FIXME: Change to `User=relayer_service` without `Permission denied` error
  echo 'User=root'
  # echo 'User=relayer_service'
  echo 'SyslogIdentifier=relayer'
  echo 'SyslogFacility=local7'
  echo 'KillSignal=SIGHUP'
  echo "WorkingDirectory=$RELAYER_PATH/SecretPath/TNLS-Relayers" # run from inside the project where dependencies are installed
  echo 'ExecStart=/opt/relayer/start.sh'
  echo '[Install]'
  echo 'WantedBy=multi-user.target'
} > /etc/systemd/system/relayer.service

# cat /etc/systemd/system/relayer.service

systemctl stop relayer
sleep 5
systemctl enable relayer
systemctl start relayer
# load new settings instead of use old cache settings
systemctl daemon-reload
systemctl status relayer

# Part 7

cd $PROJECT_ROOT
nvm use
# yarn run secret:submitRequestValue
# yarn run secret:submitRetrievePubkey

echo -e "Finished loading"
exit 0
