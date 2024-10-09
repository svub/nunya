use crate::{
    msg::{
        ExecuteMsg, GatewayMsg, InstantiateMsg, QueryMsg,
        NewSecretUserStoreMsg, LinkPaymentRefStoreMsg, PayStoreMsg, PayEncryptedWithReceiptStoreMsg, WithdrawToStoreMsg,
        ResponseStoreMsg, ResponseRetrievePubkeyMsg,
    },
    state::{
        NewSecretUser, LinkPaymentRef, Pay, PayEncryptedWithReceipt, WithdrawTo,
        State, CONFIG,
        PUBKEY_MAP, NEW_SECRET_USER_MAP, LINK_PAYMENT_REF_MAP, PAY_MAP, PAY_ENCRYPTED_WITH_RECEIPT_MAP, WITHDRAW_TO_MAP,
    },
};
use cosmwasm_std::{
    entry_point, to_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdError, StdResult, Uint128, Uint256
};
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
    let state = State {
        gateway_address: msg.gateway_address,
        gateway_hash: msg.gateway_hash,
        gateway_key: msg.gateway_key,
    };

    CONFIG.save(deps.storage, &state)?;

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
    _info: MessageInfo,
    msg: PrivContractHandleMsg,
) -> StdResult<Response> {
    // verify signature with stored gateway public key
    let gateway_key = CONFIG.load(deps.storage)?.gateway_key;
    deps.api
        .secp256k1_verify(
            msg.input_hash.as_slice(),
            msg.signature.as_slice(),
            gateway_key.as_slice(),
        )
        .map_err(|err| StdError::generic_err(err.to_string()))?;

    // determine which function to call based on the included handle
    let handle = msg.handle.as_str();
    match handle {
        "newSecretUser" => create_new_secret_user(deps, env, msg.input_values, msg.task, msg.input_hash),
        "linkPaymentRef" => create_link_payment_ref(deps, env, msg.input_values, msg.task, msg.input_hash),
        "pay" => create_pay(deps, env, msg.input_values, msg.task, msg.input_hash),
        "payWithReceipt" => create_pay_encrypted_with_receipt(deps, env, msg.input_values, msg.task, msg.input_hash),
        "withdrawTo" => create_withdraw_to(deps, env, msg.input_values, msg.task, msg.input_hash),

        _ => Err(StdError::generic_err("invalid handle".to_string())),
    }
}

fn create_new_secret_user(
    deps: DepsMut,
    env: Env,
    input_values: String,
    task: Task,
    input_hash: Binary,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;

    let input: NewSecretUserStoreMsg = serde_json_wasm::from_str(&input_values)
        .map_err(|err| StdError::generic_err(err.to_string()))?;

    // Parse as u256
    let secret_user = input
        .secret_user
        .map_err(|err| StdError::generic_err(format!("Invalid _secret: {}", err)))?;

    let new_secret_user = NewSecretUser {
        secret_user: secret_user
    };

    // Extract KeyIter from Result, handle error if necessary
    let key_iter_result = NEW_SECRET_USER_MAP.iter_keys(deps.storage);
    let mut max_key: u32 = 0;

    for key in key_iter_result? {
        max_key = max_key.max(key?);
    }
    let new_key = max_key + 1;

    // Insert the new item with the new key
    NEW_SECRET_USER_MAP.insert(deps.storage, &new_key, &new_secret_user)?;

    let data = ResponseStoreMsg {
        message: true,
    };

    let json_string =
        serde_json_wasm::to_string(&data).map_err(|err| StdError::generic_err(err.to_string()))?;

    let result = base64::encode(json_string);

    let callback_msg = GatewayMsg::Output {
        outputs: PostExecutionMsg {
            result,
            task,
            input_hash,
        },
    }
    .to_cosmos_msg(
        config.gateway_hash,
        config.gateway_address.to_string(),
        None,
    )?;

    Ok(Response::new()
        .add_message(callback_msg)
        .add_attribute("status", "stored value with key"))
}

fn create_link_payment_ref(
    deps: DepsMut,
    env: Env,
    input_values: String,
    task: Task,
    input_hash: Binary,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;

    let input: LinkPaymentRefStoreMsg = serde_json_wasm::from_str(&input_values)
        .map_err(|err| StdError::generic_err(err.to_string()))?;

    // FIXME
    // Parse as u256
    let secret_user = input
        .secret_user
        .map_err(|err| StdError::generic_err(format!("Invalid _secret: {}", err)))?;

    let payment_ref = input
        .payment_ref
        .parse::<String>()
        .map_err(|err| StdError::generic_err(format!("Invalid _ref: {}", err)))?;

    let link_payment_reference = LinkPaymentRef {
        secret_user: secret_user,
        payment_ref: payment_ref,
    };

    // Extract KeyIter from Result, handle error if necessary
    let key_iter_result = LINK_PAYMENT_REF_MAP.iter_keys(deps.storage);
    let mut max_key: u32 = 0;

    for key in key_iter_result? {
        max_key = max_key.max(key?);
    }
    let new_key = max_key + 1;

    // Insert the item with the new key
    LINK_PAYMENT_REF_MAP.insert(deps.storage, &new_key, &link_payment_reference)?;

    let data = ResponseStoreMsg {
        message: true,
    };

    let json_string =
        serde_json_wasm::to_string(&data).map_err(|err| StdError::generic_err(err.to_string()))?;

    let result = base64::encode(json_string);

    let callback_msg = GatewayMsg::Output {
        outputs: PostExecutionMsg {
            result,
            task,
            input_hash,
        },
    }
    .to_cosmos_msg(
        config.gateway_hash,
        config.gateway_address.to_string(),
        None,
    )?;

    Ok(Response::new()
        .add_message(callback_msg)
        .add_attribute("status", "stored value with key"))
}

fn create_pay(
    deps: DepsMut,
    env: Env,
    input_values: String,
    task: Task,
    input_hash: Binary,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;

    let input: PayStoreMsg = serde_json_wasm::from_str(&input_values)
        .map_err(|err| StdError::generic_err(err.to_string()))?;

    let payment_ref = input
        .payment_ref
        .parse::<String>()
        .map_err(|err| StdError::generic_err(format!("Invalid _ref: {}", err)))?;

    // Parse as u256
    let amount = input
        .amount
        .parse::<Uint128>()
        .map_err(|err| StdError::generic_err(format!("Invalid _amount: {}", err)))?;

    let pay = Pay {
        payment_ref: payment_ref,
        amount: amount,
    };

    // Extract KeyIter from Result, handle error if necessary
    let key_iter_result = PAY_MAP.iter_keys(deps.storage);
    let mut max_key: u32 = 0;

    for key in key_iter_result? {
        max_key = max_key.max(key?);
    }
    let new_key = max_key + 1;

    // Insert the item with the new key
    PAY_MAP.insert(deps.storage, &new_key, &pay)?;

    let data = ResponseStoreMsg {
        message: true,
    };

    let json_string =
        serde_json_wasm::to_string(&data).map_err(|err| StdError::generic_err(err.to_string()))?;

    let result = base64::encode(json_string);

    let callback_msg = GatewayMsg::Output {
        outputs: PostExecutionMsg {
            result,
            task,
            input_hash,
        },
    }
    .to_cosmos_msg(
        config.gateway_hash,
        config.gateway_address.to_string(),
        None,
    )?;

    Ok(Response::new()
        .add_message(callback_msg)
        .add_attribute("status", "stored value with key"))
}

fn create_pay_encrypted_with_receipt(
    deps: DepsMut,
    env: Env,
    input_values: String,
    task: Task,
    input_hash: Binary,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;

    let input: PayEncryptedWithReceiptStoreMsg = serde_json_wasm::from_str(&input_values)
        .map_err(|err| StdError::generic_err(err.to_string()))?;

    let payment_ref = input
        .payment_ref
        .parse::<String>()
        .map_err(|err| StdError::generic_err(format!("Invalid _ref: {}", err)))?;

    // Parse as u256
    let amount = input
        .amount
        .parse::<Uint128>()
        .map_err(|err| StdError::generic_err(format!("Invalid _amount: {}", err)))?;

    // Parse as u256
    let user_pubkey = input
        .user_pubkey
        .parse::<Uint256>()
        .map_err(|err| StdError::generic_err(format!("Invalid _userPubkey: {}", err)))?;

    let pay_encrypted_with_receipt = PayEncryptedWithReceipt {
        payment_ref: payment_ref,
        amount: amount,
        user_pubkey: user_pubkey
    };

    // Extract KeyIter from Result, handle error if necessary
    let key_iter_result = PAY_ENCRYPTED_WITH_RECEIPT_MAP.iter_keys(deps.storage);
    let mut max_key: u32 = 0;

    for key in key_iter_result? {
        max_key = max_key.max(key?);
    }
    let new_key = max_key + 1;

    // Insert the item with the new key
    PAY_ENCRYPTED_WITH_RECEIPT_MAP.insert(deps.storage, &new_key, &pay_encrypted_with_receipt)?;

    let data = ResponseStoreMsg {
        message: true,
    };

    let json_string =
        serde_json_wasm::to_string(&data).map_err(|err| StdError::generic_err(err.to_string()))?;

    let result = base64::encode(json_string);

    let callback_msg = GatewayMsg::Output {
        outputs: PostExecutionMsg {
            result,
            task,
            input_hash,
        },
    }
    .to_cosmos_msg(
        config.gateway_hash,
        config.gateway_address.to_string(),
        None,
    )?;

    Ok(Response::new()
        .add_message(callback_msg)
        .add_attribute("status", "stored value with key"))
}

fn create_withdraw_to(
    deps: DepsMut,
    env: Env,
    input_values: String,
    task: Task,
    input_hash: Binary,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;

    let input: WithdrawToStoreMsg = serde_json_wasm::from_str(&input_values)
        .map_err(|err| StdError::generic_err(err.to_string()))?;

    let secret_user = input
        .secret_user
        .map_err(|err| StdError::generic_err(format!("Invalid _secret: {}", err)))?;

    // Parse as u256
    let amount = input
        .amount
        .parse::<Uint128>()
        .map_err(|err| StdError::generic_err(format!("Invalid amount: {}", err)))?;

    let withdrawal_address = input
        .withdrawal_address
        .map_err(|err| StdError::generic_err(format!("Invalid withdrawalAddress: {}", err)))?;

    let withdrawal_to = WithdrawTo {
        secret_user: secret_user,
        amount: amount,
        withdrawal_address: withdrawal_address
    };

    // Extract KeyIter from Result, handle error if necessary
    let key_iter_result = WITHDRAW_TO_MAP.iter_keys(deps.storage);
    let mut max_key: u32 = 0;

    for key in key_iter_result? {
        max_key = max_key.max(key?);
    }
    let new_key = max_key + 1;

    // Insert the item with the new key
    WITHDRAW_TO_MAP.insert(deps.storage, &new_key, &withdrawal_to)?;

    let data = ResponseStoreMsg {
        message: true,
    };

    let json_string =
        serde_json_wasm::to_string(&data).map_err(|err| StdError::generic_err(err.to_string()))?;

    let result = base64::encode(json_string);

    let callback_msg = GatewayMsg::Output {
        outputs: PostExecutionMsg {
            result,
            task,
            input_hash,
        },
    }
    .to_cosmos_msg(
        config.gateway_hash,
        config.gateway_address.to_string(),
        None,
    )?;

    Ok(Response::new()
        .add_message(callback_msg)
        .add_attribute("status", "stored value with key"))
}

#[entry_point]
pub fn query(deps: Deps, env: Env, msg: QueryMsg) -> StdResult<Binary> {
    let response = match msg {
        QueryMsg::RetrievePubkey { key } => retrieve_pubkey_query(deps, key),
    };
    pad_query_result(response, BLOCK_SIZE)
}

fn retrieve_pubkey_query(deps: Deps, key: u32) -> StdResult<Binary> {
    let value = PUBKEY_MAP
        .get(deps.storage, &key)
        .ok_or_else(|| StdError::generic_err("Value not found"))?;

    to_binary(&ResponseRetrievePubkeyMsg {
        message: true,
    })
}
