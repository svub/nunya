# https://github.com/scrtlabs/SecretNetwork/blob/master/deployment/dockerfiles/base-images/secret-contract-optimizer.Dockerfile#L9
# v1.0.10
# Modifications:
# - removed `--locked`
# - added `--enable-threads --enable-bulk-memory --all-features`
FROM rust:1.71.0-slim-bullseye

RUN rustup target add wasm32-unknown-unknown
RUN apt update && apt install -y binaryen clang && rm -rf /var/lib/apt/lists/*

WORKDIR /contract

ENTRYPOINT ["/bin/bash", "-c", "\
    RUSTFLAGS='-C link-arg=-s' cargo build --release --lib --target wasm32-unknown-unknown && \
    (mkdir -p ./optimized-wasm/ && rm -f ./optimized-wasm/* && cp ./target/wasm32-unknown-unknown/release/*.wasm ./optimized-wasm/) && \
    for w in ./optimized-wasm/*.wasm; do \
        wasm-opt -Oz $w -o $w --enable-threads --enable-bulk-memory --all-features; \
    done && \
    (cd ./optimized-wasm && gzip -n -9 -f *) \
"]
