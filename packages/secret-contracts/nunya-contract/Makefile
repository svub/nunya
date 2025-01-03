.PHONY: check
check:
	cargo check

.PHONY: clippy
clippy:
	cargo clippy

PHONY: test
test: unit-test

.PHONY: unit-test
unit-test:
	cargo unit-test

# This is a local build with debug-prints activated. Debug prints only show up
# in the local development chain (see the `start-server` command below)
# and mainnet won't accept contracts built with the feature enabled.
#
# https://github.com/rust-bitcoin/rust-secp256k1/issues/283#issuecomment-1200858455
# RUSTFLAGS='-C link-arg=-s' cargo build --release --target wasm32-unknown-unknown
.PHONY: build _build
build: _build compress-wasm
_build:
	cargo clean && \
	sudo bash ../../../set-env.sh && \
	cargo build --release --target wasm32-unknown-unknown

# This is a build suitable for uploading to mainnet.
# Calls to `debug_print` get removed by the compiler.
#
# RUSTFLAGS='-C link-arg=-s' cargo build --release --target wasm32-unknown-unknown
.PHONY: build-mainnet _build-mainnet
build-mainnet: _build-mainnet compress-wasm
_build-mainnet:
	cargo clean && \
	sudo bash ../../../set-env.sh && \
	cargo build --release --target wasm32-unknown-unknown

# like build-mainnet, but slower and more deterministic
# https://hub.docker.com/r/enigmampc/secret-contract-optimizer/tags
.PHONY: build-mainnet-reproducible _build-mainnet-reproducible
build-mainnet-reproducible: _build-mainnet-reproducible
_build-mainnet-reproducible:
	cargo clean && \
	sudo bash ../../../set-env.sh && \
	docker buildx build --label "sco" --tag "sco" -f "../../../docker/secret-contract-optimizer.Dockerfile" . && \
	docker run --rm -v "$$(pwd)":/contract \
	--mount type=volume,source="$$(basename "$$(pwd)")_cache",target=/contract/target \
	--mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
	sco:latest

.PHONY: compress-wasm
compress-wasm:
	cp ./target/wasm32-unknown-unknown/release/*.wasm ./contract.wasm
	@## The following line is not necessary, may work only on linux (extra size optimization)
	@# wasm-opt -Os ./contract.wasm -o ./contract.wasm --enable-threads --enable-bulk-memory --all-features
	cat ./contract.wasm | gzip -9 > ./contract.wasm.gz

.PHONY: schema
schema:
	cargo run --example schema

# Run local development chain with four funded accounts (named a, b, c, and d)
.PHONY: start-server
start-server: # CTRL+C to stop
	docker run -it --rm \
		-p 9091:9091 -p 26657:26657 -p 26656:26656 -p 1317:1317 -p 5000:5000 \
		-v $$(pwd):/root/code \
		--name secretdev ghcr.io/scrtlabs/localsecret:v1.15.0-beta.19

.PHONY: copy-nunya-contract-local
copy-nunya--contract-local:
	sudo docker cp contract.wasm secretdev:/root/code/contract.wasm
	sudo docker cp contract.wasm.gz secretdev:/root/code/contract.wasm.gz

# This relies on running `start-server` in another console
# You can run other commands on the secretcli inside the dev image
# by using `docker exec secretdev secretcli`.
.PHONY: store-nunya-contract-local
store-nunya-contract-local:
	sudo docker exec secretdev secretcli tx compute store -y --from a --gas 3000000 /root/code/contract.wasm.gz --keyring-backend test

.PHONY: clean
clean:
	cargo clean
	-rm -f ./contract.wasm ./contract.wasm.gz
	sudo docker exec secretdev rm -rf /root/code/contract.wasm
	sudo docker exec secretdev rm -rf /root/code/contract.wasm.gz
