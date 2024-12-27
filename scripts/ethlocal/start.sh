#!/usr/bin/env bash

NAME="hardhat_ethereum_development_node"
# FIXME: Permission denied
# NODE_PATH="/opt/ethlocal/hardhat"
# Note: Check if can execute a file with a given user:
# `sudo -u ethlocal_service test -x /opt/ethlocal/hardhat || {    echo "otheruser cannot execute the file"; }`
NODE_PATH="/root/nunya/packages/hardhat/node_modules/.bin/hardhat"

PORT="8545"

# Important: systemd service must be configured with the `WorkingDirectory` pointing to a Hardhat project
# that you may debug here with `echo $PWD` if necessary
CMD="$NODE_PATH node --network hardhat --no-deploy --watch --port $PORT
"

echo "-----------------------"
echo "Executing: $CMD"
echo "----------------------"

$CMD
