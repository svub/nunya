#!/bin/bash

# Part 1

# Note:
# Run `cd ~/nunya && git stash && cd ~/ltfschoen && git stash` to remove changed files

# # Commands
#
# ## Restart Secret Network Development Node
# ```
# docker stop secretdev && docker rm secretdev && sleep 5 &&
# cd ~/nunya/packages/secret-contracts/secret-gateway && nvm use &&
# make start-server
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
nvm use
# TODO - update to clone and checkout if folder not exist
git stash
git pull origin submit-pubkey
git checkout submit-pubkey
cd ~/nunya/packages/secret-contracts/secret-gateway
git submodule update --init --recursive
nvm use
docker stop secretdev && docker rm secretdev
sleep 5
make start-server
docker logs -f secretdev | tee ~/nunya/docker.log

# Ethereum Network Development Node
cd ~/nunya
nvm use

adduser ethlocal_service --system --no-create-home
DB_STORAGE="/mnt/storage1"
mkdir -p $DB_STORAGE/.chains

mkdir -p /opt/ethlocal
cp ~/nunya/scripts/ethlocal/start.sh /opt/ethlocal
chmod +x /opt/ethlocal/start.sh

cp ~/nunya/packages/hardhat/node_modules/.bin/hardhat /opt/ethlocal
chmod +x /opt/ethlocal/hardhat

sudo chown -R ethlocal_service $DB_STORAGE/.chains
sudo chown -R ethlocal_service /opt/ethlocal

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
  echo 'User=ethlocal_service'
  echo 'SyslogIdentifier=ethlocal'
  echo 'SyslogFacility=local7'
  echo 'KillSignal=SIGHUP'
  echo 'ExecStart=/opt/ethlocal/start.sh'
  echo '[Install]'
  echo 'WantedBy=multi-user.target'
} > /etc/systemd/system/ethlocal.service

cat /etc/systemd/system/ethlocal.service

DB_STORAGE="/mnt/storage1"
mkdir -p $DB_STORAGE/.chains/ethlocal
sudo chown -R ethlocal_service $DB_STORAGE/.chains

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

## TODO - write output to config.ts including code id, code hash, and contract hash

# PART 2
yarn run secret:querySecretGatewayPubkey

# TODO - update config.ts

# PART 3

## TODO - upload and instantiate private Secret contract

yarn run secret:clean
yarn run secret:upload
yarn run secret:instantiate
docker exec -it secretdev secretcli tx bank send secret1ap26qrlp8mcq2pg6r47w43l0y8zkqm8a450s03 secret1glfedwlusunwly7q05umghzwl6nf2vj6wr38fg 100000000000000000uscrt -y

# TODO - update config.ts

# Part 4

# TODO - update to clone and checkout if folder not exist
cd ~/nunya
nvm use
cd ~/ltfschoen/SecretPath/TNLS-Relayers
git stash
git pull origin nunya
git checkout nunya

## TODO - configure thes files
# /root/ltfschoen/SecretPath/TNLS-Relayers/config.yml
# /root/ltfschoen/SecretPath/TNLS-Relayers/.env

conda activate secretpath_env
pip install -r requirements.txt --no-dependencies
pip install --upgrade lru-dict

# Part 5

adduser relayer_service --system --no-create-home

mkdir -p /opt/relayer
cp ~/nunya/scripts/relayer/start.sh /opt/relayer
chmod +x /opt/relayer/start.sh

# create symlink in /opt/relayer to /root/ltfschoen/SecretPath/TNLS-Relayers/web_app.py

# create a soft link to this file in my present directory:

ln -s ~/ltfschoen/SecretPath/TNLS-Relayers/web_app.py /opt/relayer/web_app.py

sudo chown -R relayer_service /opt/relayer

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
  echo 'User=relayer_service'
  echo 'SyslogIdentifier=relayer'
  echo 'SyslogFacility=local7'
  echo 'KillSignal=SIGHUP'
  echo 'ExecStart=/opt/relayer/start.sh'
  echo '[Install]'
  echo 'WantedBy=multi-user.target'
} > /etc/systemd/system/relayer.service

cat /etc/systemd/system/relayer.service

# Part 6

cd ~/nunya
nvm use
yarn run secret:submitRequestValue
yarn run secret:submitRetrievePubkey
