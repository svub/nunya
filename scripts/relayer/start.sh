#!/usr/bin/env bash

NAME="relayer_service"
NODE_PATH="/opt/relayer"
PORT="8545"

CMD="cd $NODE_PATH && sudo python3 web_app.py
"

echo "-----------------------"
echo "Executing: $CMD"
echo "----------------------"

$CMD
