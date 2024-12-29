#!/usr/bin/env bash

apt install -y jq
JSON_DEPLOYED=$(cat ../deployed.json)
RELAYER_CONFIG_PATH=$(echo "$JSON_DEPLOYED" | jq -r '.data.relayer.configPath')
CHOSEN_NETWORK=$(echo "$JSON_DEPLOYED" | jq -r '.data.secret.network')

if [ $CHOSEN_NETWORK == "localhost" ]; then
  SECRET_GATEWAY_CONTRACT_CODE_HASH=$(echo "$JSON_DEPLOYED" | jq -r '.data.secret.localhost.secretGateway.gatewayContractCodeHash')
else if [ $CHOSEN_NETWORK == "testnet" ]; then
  SECRET_GATEWAY_CONTRACT_CODE_HASH=$(echo "$JSON_DEPLOYED" | jq -r '.data.secret.testnet.secretGateway.gatewayContractCodeHash')
else
  echo -e "Chosen network not supported"
fi

apt install -y yq
# https://fabianlee.org/2022/12/20/yq-update-deeply-nested-elements-in-yaml/
yq '."secretdev-1".code_hash = $SECRET_GATEWAY_CONTRACT_CODE_HASH' $RELAYER_CONFIG_PATH

echo -e "Finished updating Secret Gateway code hash in the Relayer configuration"
