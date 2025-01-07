#!/usr/bin/env bash


if [[ "$OSTYPE" == "linux-gnu" ]]; then
	if [ -f /etc/debian_version ]; then
    apt update
  fi

  if ! which rustup >/dev/null 2>&1; then
    # Reference: https://learn.onpop.io/cli/installing-pop-cli/linux

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
  end

  if ! which pop >/dev/null 2>&1; then
    cargo install --force --locked pop-cli
  end
elif [[ "$OSTYPE" == "darwin"* ]]; then
  echo "macOS operating system is not yet supported."
  # TODO

else
  echo "Unknown operating system is unsupported."
fi

pop --version

# Reference: https://learn.onpop.io/contracts/guides/set-up-your-development-environment

# Install all packages for smart contract development
pop install -y
