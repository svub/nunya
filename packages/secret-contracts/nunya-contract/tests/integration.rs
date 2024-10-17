// reference: https://github.com/CosmWasm/cosmwasm/blob/main/contracts/hackatom/tests/integration.rs

//! This integration test tries to run and call the generated wasm.
//! It depends on a Wasm build being available, which you can create with `cargo wasm`.
//! Then running `cargo integration-test` will validate we can properly call into that generated Wasm.
//!
//! You can easily convert unit tests to integration tests as follows:
//! 1. Copy them over verbatim
//! 2. Then change
//!      let mut deps = mock_dependencies(20, &[]);
//!    to
//!      let mut deps = mock_instance(WASM, &[]);
//! 3. If you access raw storage, where ever you see something like:
//!      deps.storage.get(CONFIG_KEY).expect("no data stored");
//!    replace it with:
//!      deps.with_storage(|store| {
//!          let data = store.get(CONFIG_KEY).expect("no data stored");
//!          //...
//!      });
//! 4. Anywhere you see query(&deps, ...) you must replace it with query(&mut deps, ...)

use cosmwasm_std::{
    assert_approx_eq, coins,
    Addr, AllBalanceResponse, BankMsg, Binary,
    ContractResult, Empty,
    Response, SubMsg,
};
use cosmwasm_vm::{
    call_execute, from_slice,
    testing::{
        execute, instantiate,
        mock_env, mock_info, mock_instance,
        mock_instance_with_balances, query, sudo, test_io, MockApi, MOCK_CONTRACT_ADDR,
    },
    Storage, VmError,
};

use nunya::msg::{ExecuteMsg, InstantiateMsg,
    QueryMsg,
};
use nunya::state::{State,
    CONFIG,
};

static WASM: &[u8] = include_bytes!("../target/wasm32-unknown-unknown/release/nunya.wasm");

const DESERIALIZATION_LIMIT: usize = 20_000;

fn make_init_msg(api: &MockApi) -> (InstantiateMsg, String) {

    // Create some Addr instances for testing
    let gateway_addr = Addr::unchecked("fake address".to_string());
    let gateway_address = gateway_addr.clone();
    let gateway_hash = "fake code hash".to_string();
    let gateway_key = Binary(b"fake key".to_vec());
    (
        InstantiateMsg {
            gateway_address: gateway_address.clone(),
            gateway_hash,
            gateway_key,
        },
        gateway_address.to_string(),
    )
}

// #[test]
// fn proper_initialization() {
//     // use WASM according to integration requirements
//     let mut deps = mock_instance(WASM, &[]);

//     // TODO
// }

