#!/usr/bin/env bash

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

# install relayer dependencies and activate conda environment
conda activate secretpath_env
pip install -r requirements.txt --no-dependencies
pip install --upgrade lru-dict

python3 web_app.py

