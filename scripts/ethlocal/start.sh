#!/usr/bin/env bash

NAME="hardhat_ethereum_development_node"
NODE_PATH="/opt/ethlocal/hardhat"
PORT="8545"

CMD="yarn && sudo $NODE_PATH node --network hardhat \
  --no-deploy \
  --watch \
  --port $PORT
"

echo "-----------------------"
echo "Executing: $CMD"
echo "----------------------"

$CMD
