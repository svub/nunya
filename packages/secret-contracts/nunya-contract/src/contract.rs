use crate::{
    msg::{
        ExecuteMsg, InstantiateMsg,
        // GatewayMsg, QueryMsg,
        // NewAuthOutStoreMsg, LinkPaymentRefStoreMsg, PayStoreMsg, WithdrawToStoreMsg,
        // ResponseNewAuthOutStoreMsg, ResponseLinkPaymentRefStoreMsg, ResponsePayStoreMsg, ResponseWithdrawToStoreMsg, ResponseRetrievePubkeyMsg,
    },
    // state::{
    //     // PaymentReceipt, PaymentReferenceBalance, ResponseStatusCode,
    //     State, CONFIG,
    //     // MY_KEYS,
    //     // VIEWING_KEY, VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP,
    // },
};
use cosmwasm_std::{
    entry_point, to_binary, coin, Binary, Coin, Deps, DepsMut, Env, MessageInfo, Response, StdError, StdResult, Uint128, Uint256
};
use secret_toolkit::viewing_key::{ViewingKey, ViewingKeyStore};
use secret_toolkit::utils::{pad_handle_result, pad_query_result, HandleCallback};
use tnls::{
    msg::{PostExecutionMsg, PrivContractHandleMsg},
    state::Task,
};

/// pad handle responses and log attributes to blocks of 256 bytes to prevent leaking info based on
/// response size
pub const BLOCK_SIZE: usize = 256;

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    // // Initialise state
    // let state = State {
    //     gateway_address: msg.gateway_address,
    //     gateway_hash: msg.gateway_hash,
    //     gateway_key: msg.gateway_key,
    // };

    // CONFIG.save(deps.storage, &state)?;

    Ok(Response::default())
}

#[entry_point]
pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: ExecuteMsg) -> StdResult<Response> {
    let response = match msg {
        ExecuteMsg::Input { message } => try_handle(deps, env, info, message),
    };
    pad_handle_result(response, BLOCK_SIZE)
}

// acts like a gateway message handle filter
fn try_handle(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: PrivContractHandleMsg,
) -> StdResult<Response> {
    // verify signature with stored gateway public key
    // let config = CONFIG.load(deps.storage)?;

    // // Security
    // //
    // // reference: evm-kv-store-demo
    // if info.sender != config.gateway_address {
    //     return Err(StdError::generic_err(
    //         "Only SecretPath Gateway can call this function",
    //     ));
    // }

    // deps.api
    //     .secp256k1_verify(
    //         msg.input_hash.as_slice(),
    //         msg.signature.as_slice(),
    //         config.gateway_key.as_slice(),
    //     )
    //     .map_err(|err| StdError::generic_err(err.to_string()))?;

    // determine which function to call based on the included handle
    let handle = msg.handle.as_str();
    match handle {
        // "newSecretUser" => create_new_auth_out(deps, env, info, msg.input_values, msg.task, msg.input_hash),
        // "createPaymentReference" => create_payment_reference(deps, env, msg.input_values, msg.task, msg.input_hash),
        // // handle both `pay` and `payWithReceipt` Solidity function calls using the same `create_pay` Secret contract function
        // "pay" => create_pay(deps, env, msg.input_values, msg.task, msg.input_hash),
        // "payWithReceipt" => create_pay(deps, env, msg.input_values, msg.task, msg.input_hash),
        // "withdrawTo" => create_withdraw_to(deps, env, msg.input_values, msg.task, msg.input_hash),

        _ => Err(StdError::generic_err("invalid handle".to_string())),
    }
}

// fn create_new_auth_out(
//     deps: DepsMut,
//     env: Env,
//     info: MessageInfo,
//     input_values: String,
//     task: Task,
//     input_hash: Binary,
// ) -> StdResult<Response> {
//     let config = CONFIG.load(deps.storage)?;

//     let input: NewAuthOutStoreMsg = serde_json_wasm::from_str(&input_values)
//         .map_err(|err| StdError::generic_err(err.to_string()))?;

//     let viewing_key_index = input.secret_user.as_str(); // convert u8 to String

//     if viewing_key_index.chars().count() == 0 {
//         return Err(StdError::generic_err("Secret must not be an empty string"));
//     }

//     // https://docs.scrt.network/secret-network-documentation/development/development-concepts/permissioned-viewing/viewing-keys#viewing-keys-implementation
//     let gateway_account = config.gateway_address.to_owned();
//     let mut index_concat: String = gateway_account.to_string();
//     let suffix: &str = viewing_key_index;
//     // mutate in place https://stackoverflow.com/a/30154791/3208553
//     index_concat.push_str(suffix);

//     // https://docs.scrt.network/secret-network-documentation/development/development-concepts/permissioned-viewing/viewing-keys#viewing-keys-introduction
//     // https://github.com/scrtlabs/examples/blob/master/secret-viewing-keys/secret-viewing-keys-contract/src/contract.rs
//     let entropy: &[u8] = b"entropy";
//     let viewing_key = ViewingKey::create(deps.storage, &info, &env, gateway_account.as_str(), entropy);

//     // Viewing Key
//     VIEWING_KEY
//         // TODO - sender is always the gateway contract, or perhaps change this to `info.sender.as_bytes()`
//         .add_suffix(config.gateway_address.as_bytes())
//         .insert(deps.storage, &viewing_key_index.to_string(), &viewing_key)?;

//     // Attempt to retrieve existing
//     let value_payment_reference_to_balances_map: Option<Vec<PaymentReferenceBalance>> = Some(VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP
//         .get(deps.storage, &index_concat)
//         .ok_or_else(|| StdError::generic_err("Value for this VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP key not found"))?);

//     // TODO: need to setup viewing key for the mapping, but not necessary to store this example
//     let init_balance: Coin = coin(0u128, String::new());
//     let init_payment_ref = String::new();
//     let init_payment_reference_balance = PaymentReferenceBalance {
//         payment_reference: init_payment_ref,
//         balance: init_balance,
//     };

//     let mut value_payment_reference_to_balances: Vec<PaymentReferenceBalance> = match value_payment_reference_to_balances_map {
//         Some(payment_reference_to_balances) => payment_reference_to_balances, // If there are existing
//         None => Vec::new(),   // If none are found, start with an empty vector
//     };

//     // Add the new to vector
//     value_payment_reference_to_balances.push(init_payment_reference_balance.clone());

//     // Save updated back to storage
//     VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP
//         .insert(deps.storage, &viewing_key, &value_payment_reference_to_balances)?;

//     let response_status_code: ResponseStatusCode = 0u16;

//     let data = ResponseNewAuthOutStoreMsg {
//         _request_id: task.clone(),
//         _code: response_status_code,
//     };

//     let json_string =
//         serde_json_wasm::to_string(&data).map_err(|err| StdError::generic_err(err.to_string()))?;

//     let result = base64::encode(json_string);

//     let callback_msg = GatewayMsg::Output {
//         // Sepolia network gateway contract Solidity source code
//         //   https://github.com/SecretSaturn/SecretPath/blob/main/TNLS-Gateways/public-gateway/src/Gateway.sol
//         // Sepolia network gateway contract deployed code (line 383, 914)
//         //   https://sepolia.etherscan.io/address/0x0B6c705db59f7f02832d66B97b03E9EB3c0b4AAB#code
//         // Secret network gateway contract Rust source code `PostExecutionInfo`
//         //   https://github.com/SecretSaturn/SecretPath/blob/main/TNLS-Gateways/solana-gateway/programs/solana-gateway/src/lib.rs#L737
//         outputs: PostExecutionMsg {
//             result,
//             task, // task is the requestId
//             input_hash,
//         },
//     }
//     .to_cosmos_msg(
//         config.gateway_hash,
//         config.gateway_address.to_string(),
//         None,
//     )?;

//     Ok(Response::new()
//         .add_message(callback_msg)
//         .add_attribute("status", "create_new_auth_out"))
// }

// fn create_payment_reference(
//     deps: DepsMut,
//     _env: Env,
//     input_values: String,
//     task: Task,
//     input_hash: Binary,
// ) -> StdResult<Response> {
//     let config = CONFIG.load(deps.storage)?;

//     let input: LinkPaymentRefStoreMsg = serde_json_wasm::from_str(&input_values)
//         .map_err(|err| StdError::generic_err(err.to_string()))?;

//     let viewing_key_index = input.secret_user.as_str(); // convert u8 to String

//     if viewing_key_index.chars().count() == 0 {
//         return Err(StdError::generic_err("Secret must not be an empty string"));
//     }

//     // https://docs.scrt.network/secret-network-documentation/development/development-concepts/permissioned-viewing/viewing-keys#viewing-keys-implementation
//     let gateway_account = config.gateway_address.to_owned();
//     let mut index_concat: String = gateway_account.to_string();
//     let suffix: &str = viewing_key_index;
//     index_concat.push_str(suffix);

//     let binding = "entropy".to_string();
//     let entropy: &str = binding.as_str();
//     let result = ViewingKey::check(deps.storage, &index_concat, entropy);
//     assert_ne!(result, Err(StdError::generic_err("unauthorized")));

//     let viewing_key = VIEWING_KEY
//         .get(deps.storage, &index_concat)
//         .ok_or_else(|| StdError::generic_err("Value for this VIEWING_KEY key not found"))?;

//     if viewing_key != index_concat {
//         return Err(StdError::generic_err("Viewing Key incorrect or not found"));
//     }

//     let payment_ref = input.payment_ref.as_str(); // convert Uint256 to String

//     if payment_ref.chars().count() == 0 {
//         return Err(StdError::generic_err("Payment reference must not be an empty string"));
//     }

//     // TODO: Check stored correctly but move to tests
//     let value_payment_reference_to_balances_map: Option<Vec<PaymentReferenceBalance>> = Some(VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP
//         .get(deps.storage, &index_concat)
//         .ok_or_else(|| StdError::generic_err("Value for this VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP key not found"))?);

//     // TODO: if payment_ref already exists in VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP value then early exit here

//     let new_balance: Coin = coin(0u128, String::new());
//     let new_payment_ref = payment_ref;
//     let new_payment_reference_balance = PaymentReferenceBalance {
//         payment_reference: new_payment_ref.to_string(),
//         balance: new_balance,
//     };

//     let mut value_payment_reference_to_balances: Vec<PaymentReferenceBalance> = match value_payment_reference_to_balances_map {
//         Some(payment_reference_to_balances) => payment_reference_to_balances, // If there are existing
//         None => Vec::new(),   // If none are found, start with an empty vector
//     };

//     // Add the new to vector
//     value_payment_reference_to_balances.push(new_payment_reference_balance.clone());

//     // Save updated back to storage
//     VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP
//         .insert(deps.storage, &viewing_key, &value_payment_reference_to_balances)?;

//     let response_status_code: ResponseStatusCode = 0u16;

//     let data = ResponseLinkPaymentRefStoreMsg {
//         _request_id: task.clone(),
//         _code: response_status_code,
//         _reference: new_payment_ref.to_string(),
//     };

//     let json_string =
//         serde_json_wasm::to_string(&data).map_err(|err| StdError::generic_err(err.to_string()))?;

//     let result = base64::encode(json_string);

//     let callback_msg = GatewayMsg::Output {
//         outputs: PostExecutionMsg {
//             result,
//             task,
//             input_hash,
//         },
//     }
//     .to_cosmos_msg(
//         config.gateway_hash,
//         config.gateway_address.to_string(),
//         None,
//     )?;

//     Ok(Response::new()
//         .add_message(callback_msg)
//         .add_attribute("status", "create_payment_reference"))
// }

// fn create_pay(
//     deps: DepsMut,
//     _env: Env,
//     input_values: String,
//     task: Task,
//     input_hash: Binary,
// ) -> StdResult<Response> {
//     let config = CONFIG.load(deps.storage)?;

//     let input: PayStoreMsg = serde_json_wasm::from_str(&input_values)
//         .map_err(|err| StdError::generic_err(err.to_string()))?;

//     let viewing_key_index = input.secret_user.as_str(); // convert u8 to String
//     let payment_ref = input.payment_ref.as_str(); // convert Uint256 to String
//     // TODO: handle error if issue with amount or denomination received
//     let amount: Uint128 = input.amount.into(); // Uint128
//     let denomination = input.denomination.as_str();

//     if viewing_key_index.chars().count() == 0 {
//         return Err(StdError::generic_err("Secret must not be an empty string"));
//     }
//     if payment_ref.chars().count() == 0 {
//         return Err(StdError::generic_err("Payment reference must not be an empty string"));
//     }
//     if amount == <u128 as Into<Uint128>>::into(0u128) {
//         return Err(StdError::generic_err("Payment amount must be greater than 0"));
//     }
//     if denomination.chars().count() == 0 {
//         return Err(StdError::generic_err("Payment denomination must not be an empty string"));
//     }

//     // https://docs.scrt.network/secret-network-documentation/development/development-concepts/permissioned-viewing/viewing-keys#viewing-keys-implementation
//     let gateway_account = config.gateway_address.to_owned();
//     let mut index_concat: String = gateway_account.to_string();
//     let suffix: &str = viewing_key_index;
//     index_concat.push_str(suffix);

//     let binding = "entropy".to_string();
//     let entropy: &str = binding.as_str();
//     let result = ViewingKey::check(deps.storage, &index_concat, entropy);
//     assert_ne!(result, Err(StdError::generic_err("unauthorized")));

//     let viewing_key = VIEWING_KEY
//         .get(deps.storage, &index_concat)
//         .ok_or_else(|| StdError::generic_err("Value for this VIEWING_KEY key not found"))?;

//     if viewing_key != index_concat {
//         return Err(StdError::generic_err("Viewing Key incorrect or not found"));
//     }

//     // Attempt to retrieve existing
//     let value_payment_reference_to_balances_map: Option<Vec<PaymentReferenceBalance>> = Some(VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP
//         .get(deps.storage, &index_concat)
//         .ok_or_else(|| StdError::generic_err("Value for this VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP key not found"))?);

//     let mut value_payment_reference_to_balances: Vec<PaymentReferenceBalance> = match value_payment_reference_to_balances_map {
//         Some(payment_reference_to_balances) => payment_reference_to_balances, // If there are existing
//         None => return Err(StdError::generic_err("No payment references found")), // If none are found, early return
//     };

//     // Check if matching `payment_ref` is in the vector since only pay if it exists
//     let index: Option<usize> = Some(value_payment_reference_to_balances.iter().position(|r| r.payment_reference == payment_ref).unwrap());

//     let index_value_payment_reference_to_balances = match index {
//         Some(val) => {
//             println!("Found matching payment reference at index: {:#?}", val);
//             val
//         },
//         None => return Err(StdError::generic_err("No payment references found")),
//     };

//     // Add pay amount to existing balance associated with the payment reference that was found
//     let new_balance_amount: Uint128 = value_payment_reference_to_balances[index_value_payment_reference_to_balances].balance.amount.saturating_add(amount);
//     let new_balance: Coin = coin(<Uint128 as Into<u128>>::into(new_balance_amount), denomination);


//     let new_payment_reference_balance = PaymentReferenceBalance {
//         payment_reference: payment_ref.to_string(),
//         balance: new_balance,
//     };

//     // Update the index in the vector with the matching payment reference
//     value_payment_reference_to_balances[index_value_payment_reference_to_balances] = new_payment_reference_balance;

//     // Save updated back to storage
//     VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP
//         .insert(deps.storage, &viewing_key, &value_payment_reference_to_balances)?;

//     let receipt: PaymentReceipt;

//     // FIXME: sign receipt using Secret contract's private key, currently just hardcoded.
//     // But how to get the Secret contract's public and private key?
//     let signature: Binary = "0x".as_bytes().into();

//     let user_pubkey: Uint256;
//     if let Some(ref _user_pubkey) = input.user_pubkey {
//         user_pubkey = *_user_pubkey;

//         // TODO: if user_pubkey has been provided then return encrypted receipt and signature with the user_pubkey
//         // TODO: still need to encrypt below with user_pubkey
//         receipt = PaymentReceipt {
//             payment_reference: payment_ref.to_string(),
//             // TODO: convert Uint256 to Uint128
//             // Note: denomination of `Coin` type for the Receipt, since that is handled by the Solidity contract
//             amount: new_balance_amount.into(),
//             // TODO: serialise denomination
//             denomination: denomination.to_string(),
//             sig: signature,
//         };
//     } else {
//         // return receipt and signature unencrypted
//         receipt = PaymentReceipt {
//             payment_reference: payment_ref.to_string(),
//             // TODO: convert Uint256 to Uint128
//             // Note: denomination of `Coin` type for the Receipt, since that is handled by the Solidity contract
//             amount: new_balance_amount.into(),
//             // TODO: serialise denomination
//             denomination: denomination.to_string(),
//             sig: signature,
//         };
//     }

//     let response_status_code: ResponseStatusCode = 0u16;

//     let data = ResponsePayStoreMsg {
//         _request_id: task.clone(),
//         _code: response_status_code,
//         _receipt: receipt,
//     };

//     let json_string =
//         serde_json_wasm::to_string(&data).map_err(|err| StdError::generic_err(err.to_string()))?;

//     let result = base64::encode(json_string);

//     let callback_msg = GatewayMsg::Output {
//         outputs: PostExecutionMsg {
//             result,
//             task,
//             input_hash,
//         },
//     }
//     .to_cosmos_msg(
//         config.gateway_hash,
//         config.gateway_address.to_string(),
//         None,
//     )?;

//     Ok(Response::new()
//         .add_message(callback_msg)
//         .add_attribute("status", "create_pay"))
// }

// fn create_withdraw_to(
//     deps: DepsMut,
//     _env: Env,
//     input_values: String,
//     task: Task,
//     input_hash: Binary,
// ) -> StdResult<Response> {
//     let config = CONFIG.load(deps.storage)?;

//     let input: WithdrawToStoreMsg = serde_json_wasm::from_str(&input_values)
//         .map_err(|err| StdError::generic_err(err.to_string()))?;

//     let viewing_key_index = input.secret_user.as_str(); // convert u8 to String

//     // Do not include receiving any payment reference since want to ignore it

//     // TODO: handle error if issue with amount or denomination received
//     let amount: Uint128 = input.amount.into(); // Uint128
//     let denomination = input.denomination.as_str();
//     let withdrawal_address: [u8; 20] = input.withdrawal_address.into(); // or `Addr`

//     if viewing_key_index.chars().count() == 0 {
//         return Err(StdError::generic_err("Secret must not be an empty string"));
//     }
//     // Do not validate payment reference since want to ignore it
//     if amount == <u128 as Into<Uint128>>::into(0u128) {
//         return Err(StdError::generic_err("Payment amount must be greater than 0"));
//     }
//     if denomination.chars().count() == 0 {
//         return Err(StdError::generic_err("Payment denomination must not be an empty string"));
//     }
//     // TODO: validate withdrawal address input. check if could be `Addr` type

//     // https://docs.scrt.network/secret-network-documentation/development/development-concepts/permissioned-viewing/viewing-keys#viewing-keys-implementation
//     let gateway_account = config.gateway_address.to_owned();
//     let mut index_concat: String = gateway_account.to_string();
//     let suffix: &str = viewing_key_index;
//     index_concat.push_str(suffix);

//     let binding = "entropy".to_string();
//     let entropy: &str = binding.as_str();
//     let result = ViewingKey::check(deps.storage, &index_concat, entropy);
//     assert_ne!(result, Err(StdError::generic_err("unauthorized")));

//     let value_viewing_key = VIEWING_KEY
//         .get(deps.storage, &index_concat)
//         .ok_or_else(|| StdError::generic_err("Value for this VIEWING_KEY key not found"))?;

//     if value_viewing_key != index_concat {
//         return Err(StdError::generic_err("Viewing Key incorrect or not found"));
//     }

//     // Attempt to retrieve existing
//     let value_payment_reference_to_balances_map: Option<Vec<PaymentReferenceBalance>> = Some(VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP
//         .get(deps.storage, &index_concat)
//         .ok_or_else(|| StdError::generic_err("Value for this VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP key not found"))?);

//     let value_payment_reference_to_balances: Vec<PaymentReferenceBalance> = match value_payment_reference_to_balances_map {
//         Some(payment_reference_to_balances) => payment_reference_to_balances, // If there are existing
//         None => return Err(StdError::generic_err("No payment references found")), // If none are found, early return
//     };

//     // Do not only withdraw associated with a specific payment reference at an index in the storage vector since want to ignore it
//     // Do not need to check that the `payment_ref` provided exists in storage since ignore it
//     // Do not need to check using the `payment_ref` that we want to withdraw using:
//     // the `amount` provided ensuring it is less than or equal to the amount stored associated with the payment reference
//     // and that the `denomination` matches the provided denomination that we want to withdraw

//     // Do not store withdrawal address in state
//     // Do not transfer anything on Secret Network
//     // Only authorise the withdrawal

//     let mut balance_all_payment_refs: Uint128 = 0u128.into();
//     for element in value_payment_reference_to_balances.into_iter() {
//         if element.balance.denom == denomination {
//             balance_all_payment_refs += element.balance.amount
//         }
//     }

//     if amount > balance_all_payment_refs {
//         return Err(StdError::generic_err("Withdrawal amount must be less than or equal to total balance of all payment references"));
//     }

//     let response_status_code: ResponseStatusCode = 0u16;

//     let data = ResponseWithdrawToStoreMsg {
//         _request_id: task.clone(),
//         _code: response_status_code,
//         _amount: amount,
//         _withdrawal_address: withdrawal_address,
//     };

//     let json_string =
//         serde_json_wasm::to_string(&data).map_err(|err| StdError::generic_err(err.to_string()))?;

//     let result = base64::encode(json_string);

//     let callback_msg = GatewayMsg::Output {
//         outputs: PostExecutionMsg {
//             result,
//             task,
//             input_hash,
//         },
//     }
//     .to_cosmos_msg(
//         config.gateway_hash,
//         config.gateway_address.to_string(),
//         None,
//     )?;

//     Ok(Response::new()
//         .add_message(callback_msg)
//         .add_attribute("status", "DO_THE_WITHDRAWAL"))
// }

// #[entry_point]
// pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
//     let response = match msg {
//         QueryMsg::RetrievePubkey {} => to_binary(&retrieve_pubkey_query(deps)?),
//     };
//     pad_query_result(response, BLOCK_SIZE)
// }

// fn retrieve_pubkey_query(deps: Deps) -> StdResult<ResponseRetrievePubkeyMsg> {
//     let my_keys = MY_KEYS.load(deps.storage)?;
//     Ok(ResponseRetrievePubkeyMsg {
//         _key: my_keys.public_key,
//     })
// }

// #[cfg(test)]
// mod tests {
//     use super::*;
//     use cosmwasm_std::testing::{message_info, mock_dependencies, mock_dependencies_with_balances, mock_env};
//     use cosmwasm_std::coins;
//     use cosmwasm_std::{from_binary, StdError};

//     #[test]
//     fn proper_initialization() {
//         let mut deps = mock_dependencies();
//         // Create some Addr instances for testing
//         let gateway = deps.api.addr_make("gateway");
//         // https://docs.rs/cosmwasm-std/latest/cosmwasm_std/testing/fn.message_info.html
//         let msg = InstantiateMsg {
//             gateway_address: gateway.to_string(),
//         };

//         let info = message_info(&gateway, &coins(1000, "earth"));
//         // we can just call .unwrap() to assert this was a success
//         let res = instantiate(deps.as_mut(), mock_env(), info, msg).unwrap();

//         assert_eq!(0, res.messages.len());

//         // it worked, let's query the state
//         let res = query(deps.as_ref(), mock_env(), QueryMsg::RetrievePubkey {}).unwrap();
//         let res: ResponseRetrievePubkeyMsg = from_binary(&res).unwrap();
//         assert!(res._key);
//     }
// }
