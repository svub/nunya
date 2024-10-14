use cosmwasm_std::{Addr, Binary, Coin, Uint128, Uint256};
use secret_toolkit::storage::{Item, Keymap};
use secret_toolkit::viewing_key::{ViewingKey, ViewingKeyStore};

use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

pub static CONFIG: Item<State> = Item::new(b"config");
pub static VIEWING_KEY: Keymap<Index, ViewingKey> = Keymap::new(b"VIEWING_KEY");
pub static VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP: Keymap<ViewingKey, Vec<PaymentReferenceBalance>> = Keymap::new(b"VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP");

pub Index: u8;
pub ViewingKey: String;
pub ContractAddress: [u8; 32];
pub ResponseStatusCode: u16;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct State {
    pub gateway_address: Addr,
    pub gateway_hash: String,
    pub gateway_key: Binary,
    pub secret_contract_pubkey: [u8; 32],
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct PaymentReferenceBalance {
    pub payment_reference: String,
    pub balance: Coin,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
struct PaymentReceipt {
    pub payment_reference: Uint256,
    pub amount: Uint256,
    pub denomination: Uint256,
    pub sig: bytes32,
}
