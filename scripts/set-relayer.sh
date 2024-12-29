#!/usr/bin/env bash

# Only run after ./scripts/run.sh

apt install -y jq
echo -e "Folder: $PWD"
PARENT_DIR="$(dirname "$PWD")"
JSON_DEPLOYED=$(cat $PARENT_DIR/deployed.json)
echo -e "deployed.json: $JSON_DEPLOYED"
RELAYER_CONFIG_PATH=$(echo "$JSON_DEPLOYED" | jq -r '.data.relayer.configPath')
echo -e "Relayer path: $RELAYER_CONFIG_PATH"
CHOSEN_NETWORK=$(echo "$JSON_DEPLOYED" | jq -r '.data.secret.network')

SECRET_GATEWAY_CONTRACT_CODE_HASH=""
if [ $CHOSEN_NETWORK == "localhost" ]; then
  SECRET_GATEWAY_CONTRACT_CODE_HASH=$(echo "$JSON_DEPLOYED" | jq -r '.data.secret.localhost.secretGateway.gatewayContractCodeHash')
elif [ $CHOSEN_NETWORK == "testnet" ]; then
  SECRET_GATEWAY_CONTRACT_CODE_HASH=$(echo "$JSON_DEPLOYED" | jq -r '.data.secret.testnet.secretGateway.gatewayContractCodeHash')
else
  echo -e "Chosen network not supported"
fi
echo -e "Latest Secret Gateway code hash for $CHOSEN_NETWORK is $SECRET_GATEWAY_CONTRACT_CODE_HASH"

apt install -y yq
# https://fabianlee.org/2022/12/20/yq-update-deeply-nested-elements-in-yaml/
yq ".\"secretdev-1\".code_hash = \"$SECRET_GATEWAY_CONTRACT_CODE_HASH\"" $RELAYER_CONFIG_PATH

echo -e "Finished updating Secret Gateway code hash in the Relayer configuration"
