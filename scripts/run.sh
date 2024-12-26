#!/usr/bin/env bash

# FIXME -
# ```
# Warning: The unit file, source configuration file or drop-ins of ethlocal.service changed on disk. Run 'systemctl daemon-reload' to reload units.
# ● ethlocal.service - Ethereum Network Development Node systemd service
#      Loaded: loaded (/etc/systemd/system/ethlocal.service; enabled; preset: enabled)
#      Active: active (running) since Thu 2024-12-26 15:39:27 UTC; 14ms ago
#    Main PID: 1110762 (start.sh)
#       Tasks: 1 (limit: 4614)
#      Memory: 308.0K (peak: 352.0K)
#         CPU: 3ms
#      CGroup: /system.slice/ethlocal.service
#              └─1110762 /bin/bash /opt/ethlocal/start.sh

# Dec 26 15:39:27 localhost systemd[1]: Started ethlocal.service - Ethereum Network Development Node systemd service.
# Dec 26 15:39:27 localhost ethlocal[1110762]: -----------------------
# Dec 26 15:39:27 localhost ethlocal[1110762]: Executing: /opt/ethlocal/hardhat node --network hardhat   --no-deploy   --watch   --port 8545
# Dec 26 15:39:27 localhost ethlocal[1110762]: ----------------------
# Dec 26 15:39:27 localhost ethlocal[1110765]: /opt/ethlocal/start.sh: line 18: /opt/ethlocal/hardhat: Permission denied
# Dec 26 15:39:27 localhost systemd[1]: ethlocal.service: Main process exited, code=exited, status=126/n/a
# Dec 26 15:39:27 localhost systemd[1]: ethlocal.service: Failed with result 'exit-code'.
# ```

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
# nvm use
# TODO - update to clone and checkout if folder not exist
git stash
git pull origin submit-pubkey
git checkout submit-pubkey
cd ~/nunya/packages/secret-contracts/secret-gateway
git submodule update --init --recursive
# nvm use
docker stop secretdev && docker rm secretdev
sleep 5
# run `make start-server` in daemon background mode
docker run -it -d --rm -p 9091:9091 -p 26657:26657 -p 26656:26656 -p 1317:1317 -p 5000:5000 -v $PWD:/root/code --name secretdev ghcr.io/scrtlabs/localsecret:v1.15.0-beta.19
# docker logs -f secretdev | tee ~/nunya/docker.log

# Ethereum Network Development Node
cd ~/nunya
# nvm use

sudo adduser ethlocal_service --system --no-create-home
DB_STORAGE="/mnt/storage1"
mkdir -p $DB_STORAGE/.chains

mkdir -p /opt/ethlocal
cp ~/nunya/scripts/ethlocal/start.sh /opt/ethlocal
sudo chmod 777 /opt/ethlocal/start.sh

# create a soft link to this file in my present directory:

sudo rm /opt/ethlocal/hardhat
sudo ln -s ~/nunya/packages/hardhat/node_modules/.bin/hardhat /opt/ethlocal/hardhat
sudo chmod 777 /opt/ethlocal/hardhat

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

systemctl stop ethlocal
systemctl daemon-reload
systemctl enable ethlocal
systemctl start ethlocal
systemctl status ethlocal

cd ~/nunya
# nvm use
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
# nvm use
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

sudo adduser relayer_service --system --no-create-home

mkdir -p /opt/relayer
cp ~/nunya/scripts/relayer/start.sh /opt/relayer
sudo chmod 777 /opt/relayer/start.sh

# create symlink in /opt/relayer to /root/ltfschoen/SecretPath/TNLS-Relayers/web_app.py

# create a soft link to this file in my present directory:

sudo rm /opt/relayer/web_app.py
sudo ln -s ~/ltfschoen/SecretPath/TNLS-Relayers/web_app.py /opt/relayer/web_app.py

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

systemctl stop relayer
systemctl daemon-reload
systemctl enable relayer
systemctl start relayer
systemctl status relayer

# Part 6

cd ~/nunya
# nvm use
yarn run secret:submitRequestValue
yarn run secret:submitRetrievePubkey
