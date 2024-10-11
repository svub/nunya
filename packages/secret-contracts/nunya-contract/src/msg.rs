use cosmwasm_std::{Addr, Binary, Uint128, Uint256};
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
    pub secret_user: Addr,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct LinkPaymentRefStoreMsg {
    pub secret_user: Addr,
    pub payment_ref: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct PayStoreMsg {
    pub payment_ref: String,
    pub amount: Uint128,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct PayEncryptedWithReceiptStoreMsg {
    pub payment_ref: String,
    pub amount: Uint128,
    pub user_pubkey: Uint256,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct WithdrawToStoreMsg {
    pub secret_user: Addr,
    pub amount: Uint128,
    pub withdrawal_address: Addr,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ResponseStoreMsg {
    // response message
    pub message: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    RetrievePubkey { key: u32 },
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
