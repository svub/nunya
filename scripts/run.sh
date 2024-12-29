#!/usr/bin/env bash

# Important: Only configured to work on Linux since cannot run on macOS Silicon due to SGX

# Part 1

# Note:
# Run `cd ~/nunya && git stash && cd ~/ltfschoen && git stash` to remove changed files

# # Commands
#
# ## Restart Secret Network Development Node
# ```
# docker stop secretdev && docker rm secretdev && sleep 5 &&
# cd ~/nunya/packages/secret-contracts/secret-gateway && nvm use &&
# docker run -it --rm -p 9091:9091 -p 26657:26657 -p 26656:26656 -p 1317:1317 -p 5000:5000 -v $PWD:/root/code --name secretdev ghcr.io/scrtlabs/localsecret:v1.15.0-beta.19
# docker logs -f secretdev | tee ~/nunya/docker.log
# ```
#
# ## Reload Ethereum Network Development service file after changes
# ```
# systemctl daemon-reload
# ```
#
# ## Other
# ```
# systemctl enable ethlocal
# systemctl stop ethlocal
# systemctl daemon-reload
# systemctl start ethlocal
# systemctl restart ethlocal
# systemctl status ethlocal
# journalctl -u ethlocal.service -f
# ```
# ## Reload Relayer service file after changes
# ```
# systemctl daemon-reload
# ```
#
# ## Other
# ```
# systemctl enable relayer
# systemctl stop relayer
# systemctl daemon-reload
# systemctl start relayer
# systemctl restart relayer
# systemctl status relayer
# journalctl -u relayer.service -f
# ```

# Secret Network Development Node
cd ~/nunya

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

SERVICE=relayer.service
systemctl stop $SERVICE
sleep 5
systemctl disable $SERVICE
rm /etc/systemd/system/$SERVICE
systemctl daemon-reload
systemctl reset-failed

rm -rf /opt/ethlocal
rm -rf /opt/relayer
rm -rf /mnt/storage1/.chains

touch ~/.zprofile

ZPROFILE_PATH=~/.zprofile

nvm_cmd=$(which nvm)
if [ -z $nvm_cmd ]; then

  if ! grep -q NVM_DIR "$ZPROFILE_PATH"; then
    echo -e "Adding to PATH"

    printf '%s' '
    # nvm installation
    export NVM_DIR="$HOME/.nvm" && (
      git clone https://github.com/nvm-sh/nvm.git "$NVM_DIR"
      cd "$NVM_DIR"
      git checkout `git describe --abbrev=0 --tags --match "v[0-9]*" $(git rev-list --tags --max-count=1)`
    ) && \. "$NVM_DIR/nvm.sh"

    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

    # node path
    export PATH="/root/.nvm/versions/node/v18.20.5/bin/node/v18.20.5/bin/node:$PATH"
    ' >> ~/.zprofile
  fi

  source ~/.zprofile
else
	echo -e "Detected NVM"
fi

source ~/.zprofile

nvm install
nvm use

which node

npm install -g yarn
npm install -g corepack
yarn set version 4.5.3
corepack enable
corepack prepare yarn@v4.5.3 --activate
yarn install

# TODO - update to clone and checkout if folder not exist
# git stash
# git pull origin submit-pubkey
# git checkout submit-pubkey

cd ~/nunya/packages/secret-contracts/secret-gateway
git submodule update --init --recursive
nvm use
docker stop secretdev && docker rm secretdev
sleep 5
# run `make start-server` in daemon background mode
docker run -it -d --rm -p 9091:9091 -p 26657:26657 -p 26656:26656 -p 1317:1317 -p 5000:5000 -v $PWD:/root/code --name secretdev ghcr.io/scrtlabs/localsecret:v1.15.0-beta.19
# docker logs -f secretdev | tee ~/nunya/docker.log

# Ethereum Network Development Node
cd ~/nunya/packages/hardhat
nvm use

sudo adduser ethlocal_service --system --no-create-home
DB_STORAGE="/mnt/storage1"
mkdir -p $DB_STORAGE/.chains

mkdir -p /opt/ethlocal
cp ~/nunya/scripts/ethlocal/start.sh /opt/ethlocal
sudo chown -R ethlocal_service /opt/ethlocal
sudo chmod 755 /opt/ethlocal/start.sh

# create a soft link to this file in my present directory:

sudo rm /opt/ethlocal/hardhat
# create symlink
sudo ln -s ~/nunya/packages/hardhat/node_modules/.bin/hardhat /opt/ethlocal/hardhat
# change permission to symlink and where it points to
sudo chown -R ethlocal_service $DB_STORAGE/.chains
sudo chown -R ethlocal_service /opt/ethlocal
sudo chown -R ethlocal_service ~/nunya/packages/hardhat/node_modules/.bin/
sudo chown -R ethlocal_service /root/nunya/packages/hardhat/node_modules/hardhat/
# change permission to symlink and where it points to
sudo chmod 755 /opt/ethlocal/hardhat
sudo chmod 755 ~/nunya/packages/hardhat/node_modules/.bin/hardhat
sudo chmod 755 ~/nunya/packages/hardhat/node_modules/hardhat/internal/cli/bootstrap.js
ls -al /opt/ethlocal

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
  echo 'WorkingDirectory=/root/nunya/packages/hardhat' # must be run inside a Hardhat project
  echo '[Install]'
  echo 'WantedBy=multi-user.target'
} > /etc/systemd/system/ethlocal.service

cat /etc/systemd/system/ethlocal.service

DB_STORAGE="/mnt/storage1"
mkdir -p $DB_STORAGE/.chains/ethlocal
sudo chown -R ethlocal_service $DB_STORAGE/.chains

systemctl stop ethlocal
systemctl daemon-reload
systemctl enable ethlocal
systemctl start ethlocal
systemctl status ethlocal

cd ~/nunya
nvm use
yarn hardhat:clean
yarn hardhat:compile
yarn hardhat:deploy --network localhost
yarn run secret:setEVMGatewayAddress

cd ~/nunya/packages/secret-contracts/nunya-contract
make clean
make build

cd ~/nunya/packages/secret-contracts/secret-gateway
make clean
make build

cd ~/nunya
yarn install
yarn run secret:clean
yarn run secret:uploadAndInstantiateGateway

## TODO - automatically if contract code hash changes then try to update the `contract_code_hash` and `contract_address` in ~/ltfschoen/SecretPath/TNLS-Relayers/config.yml

## TODO - write output to config.ts including code id, code hash, and contract hash

# SKIP: PART 2
# yarn run secret:querySecretGatewayPubkey

# TODO - update config.ts

# PART 3

## TODO - upload and instantiate private Secret contract

yarn run secret:clean
yarn run secret:uploadAndInstantiateNunya
docker exec -it secretdev secretcli tx bank send secret1ap26qrlp8mcq2pg6r47w43l0y8zkqm8a450s03 secret1glfedwlusunwly7q05umghzwl6nf2vj6wr38fg 100000000000000000uscrt -y

# TODO - update config.ts

# Part 4

# TODO - update to clone and checkout if folder not exist
cd ~/ltfschoen/SecretPath/TNLS-Relayers
# git stash
# git pull origin nunya
# git checkout nunya

cd ~/nunya
# Set the Secret Gateway code hash in the Relay config.yml file for the network to be the latest deployed code hash
bash ~/nunya/scripts/set-relayer.sh

## TODO - configure these files
# /root/ltfschoen/SecretPath/TNLS-Relayers/config.yml
# /root/ltfschoen/SecretPath/TNLS-Relayers/.env

# Part 5

sudo adduser relayer_service --system --no-create-home

mkdir -p /opt/relayer
cp ~/nunya/scripts/relayer/start.sh /opt/relayer
cp ~/nunya/scripts/relayer/node.sh /opt/relayer
sudo chown -R relayer_service /opt/relayer
sudo chmod 755 /opt/relayer/start.sh
sudo chmod 755 /opt/relayer/node.sh

sudo rm /opt/relayer/web_app.py
# create symlink in /opt/relayer to /root/ltfschoen/SecretPath/TNLS-Relayers/web_app.py
sudo ln -s ~/ltfschoen/SecretPath/TNLS-Relayers/web_app.py /opt/relayer/web_app.py
sudo chown -R relayer_service /opt/relayer
sudo chown -R relayer_service ~/ltfschoen/SecretPath/TNLS-Relayers
# change permission to symlink and where it points to
sudo chmod 755 /opt/relayer/web_app.py
sudo chmod 755 ~/ltfschoen/SecretPath/TNLS-Relayers/web_app.py

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
  echo 'WorkingDirectory=/root/ltfschoen/SecretPath/TNLS-Relayers' # run from inside the project where dependencies are installed
  echo 'ExecStart=/opt/relayer/start.sh'
  echo '[Install]'
  echo 'WantedBy=multi-user.target'
} > /etc/systemd/system/relayer.service

cat /etc/systemd/system/relayer.service

systemctl stop relayer
systemctl daemon-reload
systemctl enable relayer
systemctl start relayer
systemctl status relayer

# Part 6

cd ~/nunya
nvm use
# yarn run secret:submitRequestValue
# yarn run secret:submitRetrievePubkey
