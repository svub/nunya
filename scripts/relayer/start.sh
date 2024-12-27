#!/usr/bin/env bash

NAME="relayer_service"
NODE_PATH="/opt/relayer"
PORT="8545"

CMD="python3 $NODE_PATH/web_app.py
"

echo "-----------------------"
echo "Executing: $CMD"
echo "----------------------"

$CMD
