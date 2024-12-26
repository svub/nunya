#!/bin/bash

DB_STORAGE="/mnt/storage1"
NAME="hardhat_ethereum_development_node"
NODE_PATH="/opt/ethlocal/hardhat"
PORT="8545"

CMD="$NODE_PATH node --network hardhat \
  --no-deploy \
  --watch \
  --port $PORT
"

echo "-----------------------"
echo "Executing: $CMD"
echo "----------------------"

$CMD
