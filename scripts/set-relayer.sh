#!/usr/bin/env bash

# Only run after ./scripts/run.sh

echo -e "set-relayer.sh"

apt install -y jq
echo -e "Folder: $PWD"
# PARENT_DIR="$(dirname "$PWD")"
JSON_DEPLOYED=$(cat $PWD/deployed.json)
echo -e "deployed.json: $JSON_DEPLOYED"
RELAYER_PATH=$(echo "$JSON_DEPLOYED" | jq -r '.data.relayer.path')
echo -e "RELAYER_PATH: $RELAYER_PATH"

# TODO - update to clone and checkout if folder not exist
cd $RELAYER_PATH/SecretPath/TNLS-Relayers

RELAYER_CONFIG_PATH=$RELAYER_PATH/SecretPath/TNLS-Relayers/config.yml
echo -e "Relayer config path: $RELAYER_CONFIG_PATH"
CHOSEN_NETWORK=$(echo "$JSON_DEPLOYED" | jq -r '.data.secret.network')

SECRET_GATEWAY_CONTRACT_CODE_HASH=""
SECRET_GATEWAY_CONTRACT_ADDRESS=""
if [ $CHOSEN_NETWORK == "localhost" ]; then
  SECRET_GATEWAY_CONTRACT_CODE_HASH=$(echo "$JSON_DEPLOYED" | jq -r '.data.secret.localhost.secretGateway.gatewayContractCodeHash')
  SECRET_GATEWAY_CONTRACT_ADDRESS=$(echo "$JSON_DEPLOYED" | jq -r '.data.secret.localhost.secretGateway.gatewayContractAddress')
elif [ $CHOSEN_NETWORK == "testnet" ]; then
  SECRET_GATEWAY_CONTRACT_CODE_HASH=$(echo "$JSON_DEPLOYED" | jq -r '.data.secret.testnet.secretGateway.gatewayContractCodeHash')
  SECRET_GATEWAY_CONTRACT_ADDRESS=$(echo "$JSON_DEPLOYED" | jq -r '.data.secret.testnet.secretGateway.gatewayContractAddress')
else
  echo -e "Chosen network not supported"
fi
echo -e "Latest Secret Gateway code hash for $CHOSEN_NETWORK is $SECRET_GATEWAY_CONTRACT_CODE_HASH"
echo -e "Latest Secret Gateway contract address for $CHOSEN_NETWORK is $SECRET_GATEWAY_CONTRACT_ADDRESS"

# install specific `yq` version from Github (not via apt or apt-get)
# beware of bugs and different syntax in more recent versions
VERSION=v4.18.1 && BINARY=yq_linux_amd64 && \
wget https://github.com/mikefarah/yq/releases/download/${VERSION}/${BINARY}.tar.gz -O - | tar xz && mv ${BINARY} /usr/bin/yq
# https://fabianlee.org/2022/12/20/yq-update-deeply-nested-elements-in-yaml/
# update environment with PATH so yq available
source ~/.zshrc

if [ ! -f /usr/bin/yq ]; then
  echo "yq not found"
fi

# https://mikefarah.gitbook.io/yq/usage/properties
# note: use `strenv(MY_ENV)` or not `$MY_ENV`

# WARNING: `yq` removes empty lines from the config.yml file
# TODO: Find a workaround https://stackoverflow.com/questions/57627243/how-to-prevent-yq-removing-comments-and-empty-lines
export C_HASH=$SECRET_GATEWAY_CONTRACT_CODE_HASH && yq -i ".secretdev-1.code_hash = strenv(C_HASH)" $RELAYER_CONFIG_PATH
echo -e "Finished updating Secret Gateway code hash in the Relayer configuration"

export C_ADDR=$SECRET_GATEWAY_CONTRACT_ADDRESS && yq -i ".secretdev-1.contract_address = strenv(C_ADDR)" $RELAYER_CONFIG_PATH
echo -e "Finished updating Secret Gateway address in the Relayer configuration"
