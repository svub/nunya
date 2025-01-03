#!/bin/bash

# Reference: https://getsubstrate.io/

if [[ "$OSTYPE" == "linux-gnu" ]]; then
	set -e
	if [[ $(whoami) == "root" ]]; then
		MAKE_ME_ROOT=
	else
		MAKE_ME_ROOT=sudo
	fi

	if [ -f /etc/debian_version ]; then
		echo "Ubuntu/Debian Linux detected."
		# $MAKE_ME_ROOT apt update
		$MAKE_ME_ROOT apt install -y cmake pkg-config libssl-dev git gcc build-essential git protobuf-compiler clang libclang-dev
	  export AR="$(which llvm-ar)" CC="$(which clang)" RUSTFLAGS='-C link-arg=-s'
  else
		echo "Unknown Linux distribution."
		echo "This OS is not supported with this script at present. Sorry."
		exit 1
	fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
	echo "Mac OS (Darwin) detected."

	if ! which brew >/dev/null 2>&1; then
		/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
	fi

	brew update
	brew install openssl cmake llvm 
  # export AR=/opt/homebrew/opt/llvm/bin/llvm-ar CC=/opt/homebrew/opt/llvm/bin/clang RUSTFLAGS='-C link-arg=-s' && \
  export AR="$(which llvm-ar)" CC="$(which clang)" RUSTFLAGS='-C link-arg=-s'
else
	echo "Unknown operating system."
	echo "This OS is not supported with this script at present. Sorry."
	exit 1
fi

echo "Configured: "
echo $AR
echo $CC
echo $RUSTFLAGS
