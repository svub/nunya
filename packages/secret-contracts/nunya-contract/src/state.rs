use cosmwasm_std::{Addr, Binary};
use secret_toolkit::storage::{Item, Keymap};

use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

pub static CONFIG: Item<State> = Item::new(b"config");
pub static PUBKEY_MAP: Keymap<u32, Vec<u256>> = Keymap::new(b"PUBKEY_MAP");
pub static NEW_SECRET_USER_MAP: Keymap<u32, Vec<NewSecretUser>> = Keymap::new(b"NEW_SECRET_USER_MAP");
pub static LINK_PAYMENT_REF_MAP: Keymap<u32, Vec<LinkPaymentRef>> = Keymap::new(b"LINK_PAYMENT_REF_MAP");
pub static PAY_MAP: Keymap<u32, Vec<PayRef>> = Keymap::new(b"PAY_MAP");
pub static PAY_ENCRYPTED_WITH_RECEIPT_MAP: Keymap<u32, Vec<PayEnryptedWithReceipt>> = Keymap::new(b"PAY_ENCRYPTED_WITH_RECEIPT_MAP");
pub static WITHDRAW_TO_MAP: Keymap<u32, Vec<WithdrawTo>> = Keymap::new(b"WITHDRAW_TO_MAP");

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct State {
    pub gateway_address: Addr,
    pub gateway_hash: String,
    pub gateway_key: Binary,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct NewSecretUser {
    pub secret_user: u256,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct LinkPaymentRef {
    pub secret_user: u256,
    pub payment_ref: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Pay {
    pub payment_ref: String,
    pub value: u256,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct PayEnryptedWithReceipt {
    pub payment_ref: String,
    pub value: u256,
    pub user_pubkey: u256,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct WithdrawTo {
    pub secret_user: u256,
    pub amount: u256,
    pub withdrawalAddress: String, // u160, // u160(u256(bytes32))
}
