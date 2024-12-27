#!/usr/bin/env bash

NAME="hardhat_ethereum_development_node"
# FIXME: Permission denied
# NODE_PATH="/opt/ethlocal/hardhat"
# FIXME: Permission denied
# Note: Check if can execute a file with a given user:
# `sudo -u ethlocal_service test -x /opt/ethlocal/hardhat || {    echo "otheruser cannot execute the file"; }`
NODE_PATH="/root/nunya/packages/hardhat/node_modules/.bin/hardhat"

PORT="8545"

# Note: Must be inside a hardhat project to run the command otherwise error
# Error HH1: You are not inside a Hardhat project.
# It runs this from directory root `/` hence the error. Suggest move into a script where can change directory.
CMD="$NODE_PATH node --network hardhat \
  --no-deploy \
  --watch \
  --port $PORT
"

echo "-----------------------"
echo "Executing: $CMD"
echo "----------------------"

$CMD
