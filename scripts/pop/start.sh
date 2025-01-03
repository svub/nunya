#!/usr/bin/env bash

# Note: Common installation for macOS and Linux
function install_rust()
{
  echo "Installing Rust"

  if ! which rustup >/dev/null 2>&1; then
    # Install Rust
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    rustup update
    rustup default stable
    # Add WASM build target
    rustup target add wasm32-unknown-unknown
    rustup update nightly
    rustup target add wasm32-unknown-unknown --toolchain nightly
    # Restart shell
    source "$HOME/.cargo/env"
    rustup show
    rustup +nightly show
  else
    rustup update
  fi
}

if [[ "$OSTYPE" == "linux-gnu" ]]; then
  echo "Linux operating system detected."

	if [ -f /etc/debian_version ]; then
    apt update
  fi

  # Reference: https://learn.onpop.io/cli/installing-pop-cli/linux
  install_rust()

  if ! which pop >/dev/null 2>&1; then
    cargo install --force --locked pop-cli
  fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
  echo "macOS operating system detected."

  # https://learn.onpop.io/cli/installing-pop-cli/macos
	if ! which brew >/dev/null 2>&1; then
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
    brew --version
    brew update
    brew install cmake openssl protobuf
	fi

  install_rust

  if ! which pop >/dev/null 2>&1; then
    cargo install --force --locked pop-cli
  fi

else
  echo "Unknown operating system is unsupported."
fi

pop --version

# Reference: https://learn.onpop.io/contracts/guides/set-up-your-development-environment

# Install all packages for smart contract development
pop install -y
