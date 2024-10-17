use cosmwasm_std::{Addr, Binary, Uint128, Uint256};
use secret_toolkit::utils::HandleCallback;
use tnls::msg::{PostExecutionMsg, PrivContractHandleMsg};
use tnls::state::{Task};

use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use crate::{
    state::{
        PaymentReceipt, ResponseStatusCode,
    }
};

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

// No input required so not need to implement
// #[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
// pub struct RetrievePubkeyStoreMsg {}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct NewAuthOutStoreMsg {
    // TODO - is this key the variable of the parameter provided from Solidity contract to its new_secret_user function?
    // secret_user or auth_out
    pub secret_user: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct LinkPaymentRefStoreMsg {
    pub secret_user: String,
    pub payment_ref: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct PayStoreMsg {
    pub secret_user: String,
    pub payment_ref: String,
    pub amount: Uint128,
    pub denomination: String,
    pub user_pubkey: Option<Uint256>, // encrypted with receipt
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct WithdrawToStoreMsg {
    pub secret_user: String,
    pub amount: Uint128,
    pub denomination: String,
    pub withdrawal_address: [u8; 20],
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ResponseRetrievePubkeyStoreMsg {
    pub _request_id: Task,
    pub _key: Vec<u8>,
    pub _code: ResponseStatusCode,
    pub _user_address: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ResponseNewAuthOutStoreMsg {
    pub _request_id: Task,
    pub _code: ResponseStatusCode,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ResponseLinkPaymentRefStoreMsg {
    pub _request_id: Task,
    pub _code: ResponseStatusCode,
    pub _reference: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ResponsePayStoreMsg {
    pub _request_id: Task,
    pub _code: ResponseStatusCode,
    pub _receipt: PaymentReceipt,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ResponseWithdrawToStoreMsg {
    pub _request_id: Task,
    pub _code: ResponseStatusCode,
    pub _amount: Uint128,
    // TODO: should this be of type `Addr`? does it support EVM addresses?
    pub _withdrawal_address: [u8; 20],
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    RetrievePubkey {},
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ResponseRetrievePubkeyMsg {
    // TODO: can only access `_requestId` if function called from `try_handle` and callback, but not from queries
    // pub _requestId: Uint256,
    pub _key: Vec<u8>,
}

// TODO: this may not be necessary as not used
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
