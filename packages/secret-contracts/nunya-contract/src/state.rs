use cosmwasm_std::{Addr, Binary, Coin, Uint256};
use secret_toolkit::storage::{Item, Keymap};

use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

pub static MY_KEYS: Item<MyKeys> = Item::new(b"my_keys");
pub static CONFIG: Item<State> = Item::new(b"config");
pub static VIEWING_KEY: Keymap<Index, VK> = Keymap::new(b"VIEWING_KEY");
pub static VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP: Keymap<VK, Vec<PaymentReferenceBalance>> = Keymap::new(b"VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP");

pub type Index = String;
// pub type ContractAddress = [u8; 32];
pub type ResponseStatusCode = u16;

// reference: https://github.com/scrtlabs/examples/blob/master/secret-viewing-keys/secret-viewing-keys-contract/src/state.rs
pub type VK = String; // Viewing Key

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct State {
    pub gateway_address: Addr,
    pub gateway_hash: String,
    pub gateway_key: Binary,
    pub nunya_business_contract_address: Vec<u8>,
}

// Secret contract keys
// Reference: https://github.com/writersblockchain/aes-encrypt/blob/afa384d69aaddd92b50323fe1b9324f1342a5c0e/src/state.rs#L7
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct MyKeys {
    pub public_key: Vec<u8>,
    pub private_key: Vec<u8>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct PaymentReferenceBalance {
    pub payment_reference: String,
    pub balance: Coin,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct PaymentReceipt {
    pub payment_reference: String,
    // TODO: Why am I using CosmWasm Uint256 instead of Rust uint256, do we really need the extra methods associated with it
    pub amount: Uint256,
    pub denomination: String,
    pub sig: Binary,
}
