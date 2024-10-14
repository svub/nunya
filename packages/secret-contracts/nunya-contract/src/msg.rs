use cosmwasm_std::{Addr, Binary, Uint128, Uint256};
use secret_toolkit::utils::HandleCallback;
use tnls::msg::{PostExecutionMsg, PrivContractHandleMsg};
use tnls::state::{Task}

use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use crate::{
    state::{
        ResponseStatusCode,
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {
    pub gateway_address: Addr,
    pub gateway_hash: String,
    pub gateway_key: Binary,
    pub secret_contract_pubkey: [u8; 32],
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    Input { message: PrivContractHandleMsg },
}

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
    pub denomination: Uint256,
    pub user_pubkey: Option<Uint256>, // encrypted with receipt
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct WithdrawToStoreMsg {
    pub secret_user: Addr,
    pub amount: Uint128,
    pub withdrawal_address: Addr,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ResponseNewAuthOutStoreMsg {
    pub _requestId: Task,
    pub _code: ResponseStatusCode,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ResponseLinkPaymentRefStoreMsg {
    pub _requestId: Task,
    pub _code: ResponseStatusCode,
    pub _reference: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ResponsePayStoreMsg {
    pub _requestId: Task,
    pub _code: ResponseStatusCode,
    pub _receipt: Receipt,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ResponseWithdrawToStoreMsg {
    pub _requestId: Task,
    pub _code: ResponseStatusCode,
    pub _amount: Uint128,
    // TODO: should this be of type `Addr`? does it support EVM addresses?
    pub _withdrawalAddress: Addr,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    RetrievePubkey { key: u32 },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ResponseRetrievePubkeyMsg {
    // TODO: can only access `_requestId` if function called from `try_handle` and callback, but not from queries
    // pub _requestId: Uint256,
    pub _key: Uint256,
}

// TODO: this may not be necessary as not used
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct QueryResponse {
    pub message: String,
}

// We define a custom struct for each query response
#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
pub struct PubkeyResponse {
    pub secret_contract_pubkey: [u8; 32],
}


#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum GatewayMsg {
    Output { outputs: PostExecutionMsg },
}

impl HandleCallback for GatewayMsg {
    const BLOCK_SIZE: usize = 256;
}
