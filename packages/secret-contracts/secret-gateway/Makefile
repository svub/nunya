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
.PHONY: build _build
build: _build compress-wasm
_build:
	cargo clean && \
	sudo bash ../../../set-env.sh && \
	cargo build --release --target wasm32-unknown-unknown

# This is a build suitable for uploading to mainnet.
# Calls to `debug_print` get removed by the compiler.
.PHONY: build-mainnet _build-mainnet
build-mainnet: _build-mainnet compress-wasm
_build-mainnet:
	cargo clean && \
	sudo bash ../../../set-env.sh && \
	cargo build --release --target wasm32-unknown-unknown

# like build-mainnet, but slower and more deterministic
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
	cp ./target/wasm32-unknown-unknown/release/*.wasm ./secret-gateway-contract.wasm
	@## The following line is not necessary, may work only on linux (extra size optimization)
	wasm-opt -Os ./secret-gateway-contract.wasm -o ./secret-gateway-contract.wasm --enable-threads --enable-bulk-memory --all-features
	cat ./secret-gateway-contract.wasm | gzip -9 > ./secret-gateway-contract.wasm.gz

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

.PHONY: start-server-daemon
start-server-daemon: # CTRL+C to stop
	docker run -it -d --rm \
		-p 9091:9091 -p 26657:26657 -p 26656:26656 -p 1317:1317 -p 5000:5000 \
		-v $$(pwd):/root/code \
		--name secretdev ghcr.io/scrtlabs/localsecret:v1.15.0-beta.19

.PHONY: copy-secret-gateway-contract-local
copy-secret-gateway-contract-local:
	sudo docker cp secret-gateway-contract.wasm secretdev:/root/code/secret-gateway-contract.wasm
	sudo docker cp secret-gateway-contract.wasm.gz secretdev:/root/code/secret-gateway-contract.wasm.gz

# This relies on running `start-server` in another console
# You can run other commands on the secretcli inside the dev image
# by using `docker exec secretdev secretcli`.
.PHONY: store-secret-gateway-contract-local
store-secret-gateway-contract-local:
	sudo docker exec secretdev secretcli tx compute store -y --from a --gas 5000000 /root/code/secret-gateway-contract.wasm.gz --keyring-backend test
.PHONY: integration-test
integration-test:
	npx ts-node tests/integration.ts

.PHONY: clean
clean:
	cargo clean
	-rm -f ./secret-gateway-contract.wasm ./secret-gateway-contract.wasm.gz
	sudo docker exec secretdev rm -rf /root/code/secret-gateway-contract.wasm
	sudo docker exec secretdev rm -rf /root/code/secret-gateway-contract.wasm.gz
