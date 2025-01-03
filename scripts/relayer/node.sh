#!/usr/bin/env bash

# References:
# - https://docs.scrt.network/secret-network-documentation/confidential-computing-layer/ethereum-evm-developer-toolkit/basics/cross-chain-messaging/secretpath/how-to-deploy-secretpath-on-your-chain#setting-up-the-virtual-environment
# - https://docs.anaconda.com/miniconda/install/#quick-command-line-install

DIRECTORY=/root/miniconda3
if [ ! -d "$DIRECTORY" ]; then
  echo "$DIRECTORY does not exist."

  mkdir -p ~/miniconda3
  wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda3/miniconda.sh
  bash ~/miniconda3/miniconda.sh -b -u -p ~/miniconda3
  rm ~/miniconda3/miniconda.sh
fi

# activate miniconda
source ~/miniconda3/bin/activate
conda init --all
source ~/.zshrc

conda create -y --name secretpath_env python=3.11

# Install relayer dependencies and activate conda environment
# Environment location: /root/miniconda3/envs/secretpath_env
# Activate environment `conda activate secretpath_env` or deactivate `conda deactivate`
conda activate secretpath_env

# Check that it is using the latest version of the Python secret-sdk
# in requirements.txt https://github.com/secretanalytics/secret-sdk-python/releases
pip install -r requirements.txt --no-dependencies
pip install --upgrade lru-dict

python3 web_app.py

