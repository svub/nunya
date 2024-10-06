use cosmwasm_std::{Addr, Binary};
use secret_toolkit::utils::HandleCallback;
use tnls::msg::{PostExecutionMsg, PrivContractHandleMsg};

use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {
    pub gateway_address: Addr,
    pub gateway_hash: String,
    pub gateway_key: Binary,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    Input { message: PrivContractHandleMsg },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct NewSecretUserStoreMsg {
    pub secret_user: u256,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct LinkPaymentRefStoreMsg {
    pub secret_user: u256,
    pub payment_ref: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct PayStoreMsg {
    pub payment_ref: String,
    pub value: u256,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct PayEncryptedWithReceiptStoreMsg {
    pub payment_ref: String,
    pub value: u256,
    pub user_pubkey: u256,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct WithdrawToStoreMsg {
    pub secret_user: u256,
    pub amount: u256,
    pub withdrawalAddress: String, // u160, // u160(u256(bytes32))
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ResponseStoreMsg {
    // response message
    pub message: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    RetrievePubkey { key: u256 },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ResponseRetrievePubkeyMsg {
    // response message
    pub message: bool,
}

// TODO: this may not be necessary
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct QueryResponse {
    pub message: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum GatewayMsg {
    Output { outputs: PostExecutionMsg },
}

impl HandleCallback for GatewayMsg {
    const BLOCK_SIZE: usize = 256;
}
