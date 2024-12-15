use crate::{
    msg::{
        ExecuteMsg, GatewayMsg, InstantiateMsg, QueryMsg,
        NewAuthOutStoreMsg, LinkPaymentRefStoreMsg, PayStoreMsg, WithdrawToStoreMsg,
        ResponseRequestValueMsg, ResponseRetrievePubkeyStoreMsg, ResponseNewAuthOutStoreMsg, ResponseLinkPaymentRefStoreMsg, ResponsePayStoreMsg, ResponseWithdrawToStoreMsg, ResponseRetrievePubkeyMsg,
    },
    state::{
        PaymentReceipt, PaymentReferenceBalance, ResponseStatusCode,
        MyKeys, State, CONFIG, MY_KEYS,
        VIEWING_KEY, VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP,
    },
};
use base64::{engine::general_purpose, Engine};
use cosmwasm_std::{
    entry_point, to_binary, to_vec, coin, Binary, Coin, ContractResult, Deps, DepsMut, Env, MessageInfo, Response, StdError, StdResult, SystemResult, Uint128, Uint256
};
use secret_toolkit::viewing_key::{ViewingKey, ViewingKeyStore};
use secret_toolkit::utils::{pad_handle_result, pad_query_result, HandleCallback};
use tnls::{
    msg::{PostExecutionMsg, PrivContractHandleMsg},
    state::Task,
};
use secp256k1::{PublicKey, Secp256k1, SecretKey};

use anybuf::Anybuf;

/// pad handle responses and log attributes to blocks of 256 bytes to prevent leaking info based on
/// response size
pub const BLOCK_SIZE: usize = 256;

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    // Initialise state with Secret Network Gateway and EVM Nunya.Business custom contract address
    let state = State {
        gateway_address: msg.clone().gateway_address,
        gateway_hash: msg.clone().gateway_hash,
        gateway_key: msg.clone().gateway_key,
        nunya_business_contract_address: msg.clone().nunya_business_contract_address,
        owner: info.sender.clone(),
    };

    eprintln!("instantiate");
    eprintln!("msg: {:#?}", msg.clone());
    eprintln!("info: {:#?}", info.clone());
    eprintln!("state: {:#?}", state.clone());

    deps.api
        .debug(format!("Contract was initialized by {}", info.sender).as_str());

    CONFIG.save(deps.storage, &state)?;

    // Initialise state with Secret Network Contract Keys that are generated
    let rng = env.block.random.unwrap().0;
    let secp = Secp256k1::new();

    // Private Key
    let private_key = SecretKey::from_slice(&rng).unwrap();
    let private_key_string = private_key.to_string();
    let private_key_bytes = hex::decode(private_key_string).unwrap();

    // Public Key
    let public_key = PublicKey::from_secret_key(&secp, &private_key);
    let public_key_bytes = public_key.serialize().to_vec();
    // let public_key_string = public_key.to_string();

    let my_keys = MyKeys {
        private_key: private_key_bytes,
        public_key: public_key_bytes,
    };

    MY_KEYS.save(deps.storage, &my_keys)?;

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
    let config = CONFIG.load(deps.storage)?;

    eprintln!("try_handle");
    eprintln!("msg: {:#?}", msg.clone());
    eprintln!("info: {:#?}", info.clone());

    // Security
    //
    // reference: evm-kv-store-demo
    if info.sender != config.gateway_address {
        return Err(StdError::generic_err(
            "Only SecretPath Gateway can call this function",
        ));
    }

    // SecretPath source code
    // public network user address
    if msg.user_address != config.nunya_business_contract_address {
        return Err(StdError::generic_err(
            "Only NunyaBusiness contract can call this function via SecretPath Gateway",
        ));
    }

    deps.api
        .secp256k1_verify(
            msg.input_hash.as_slice(),
            msg.signature.as_slice(),
            config.gateway_key.as_bytes(),
        )
        .map_err(|err| StdError::generic_err(err.to_string()))?;

    // determine which function to call based on the included handle
    let handle = msg.handle.as_str();

    eprintln!("try_handle");
    eprintln!("handle: {:#?}", handle);

    match handle {
        // TODO: change all below to snake_case if required for Gateway contract to be able to call.
        // but first test that `request_value` works.
        "request_value" => request_value(deps, env, info, msg.input_values, msg.task, msg.input_hash),
        "retrievePubkey" => retrieve_pubkey(deps, env, info, msg.input_values, msg.task, msg.input_hash),
        "newSecretUser" => create_new_auth_out(deps, env, info, msg.input_values, msg.task, msg.input_hash),
        "createPaymentReference" => create_payment_reference(deps, env, msg.input_values, msg.task, msg.input_hash),
        // handle both `pay` and `payWithReceipt` Solidity function calls using the same `create_pay` Secret contract function
        "pay" => create_pay(deps, env, msg.input_values, msg.task, msg.input_hash),
        "payWithReceipt" => create_pay(deps, env, msg.input_values, msg.task, msg.input_hash),
        "withdrawTo" => create_withdraw_to(deps, env, msg.input_values, msg.task, msg.input_hash),

        _ => Err(StdError::generic_err("invalid handle".to_string())),
    }
}

// Only for testing that it works e2e
fn request_value(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    input_values: String,
    task: Task,
    input_hash: Binary,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;

    let response_status_code: ResponseStatusCode = 0u16;

    let value = "NUNYA".to_string();

    // TODO - println!("callback stuff: {:#?}", value);

    let data = ResponseRequestValueMsg {
        _request_id: task.clone(),
        _key: value.into_bytes(),
        _code: response_status_code,
        _nunya_business_contract_address: config.nunya_business_contract_address,
    };

    let json_string =
        serde_json_wasm::to_string(&data).map_err(|err| StdError::generic_err(err.to_string()))?;

    let result = general_purpose::STANDARD.encode(json_string);

    // Get the contract's code hash using the gateway address
    let gateway_code_hash = get_contract_code_hash(deps, config.gateway_address.to_string())?;

    let callback_msg = GatewayMsg::Output {
        outputs: PostExecutionMsg {
            result,
            task,
            input_hash,
        },
    }
    .to_cosmos_msg(
        gateway_code_hash,
        config.gateway_address.to_string(),
        None,
    )?;

    Ok(Response::new()
        .add_message(callback_msg)
        .add_attribute("status", "request_value"))
}

fn retrieve_pubkey(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    input_values: String,
    task: Task,
    input_hash: Binary,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;

    // No input values expected, just retrieving
    // let input: RetrievePubkeyStoreMsg = serde_json_wasm::from_str(&input_values)
    //     .map_err(|err| StdError::generic_err(err.to_string()))?;

    let existing_my_keys = MY_KEYS.load(deps.storage)?;
    if existing_my_keys.public_key.len() == 0 {
        return Err(StdError::generic_err("Public key does not exist in Secret storage"));
    }

    let my_keys = MY_KEYS.load(deps.storage)?;

    let response_status_code: ResponseStatusCode = 0u16;

    let data = ResponseRetrievePubkeyStoreMsg {
        _request_id: task.clone(),
        _key: my_keys.public_key,
        _code: response_status_code,
        _nunya_business_contract_address: config.nunya_business_contract_address,
    };

    let json_string =
        serde_json_wasm::to_string(&data).map_err(|err| StdError::generic_err(err.to_string()))?;

    let result = general_purpose::STANDARD.encode(json_string);

    // Get the contract's code hash using the gateway address
    let gateway_code_hash = get_contract_code_hash(deps, config.gateway_address.to_string())?;

    let callback_msg = GatewayMsg::Output {
        outputs: PostExecutionMsg {
            result,
            task,
            input_hash,
        },
    }
    .to_cosmos_msg(
        gateway_code_hash,
        config.gateway_address.to_string(),
        None,
    )?;

    Ok(Response::new()
        .add_message(callback_msg)
        .add_attribute("status", "retrieve_pubkey"))
}

fn create_new_auth_out(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    input_values: String,
    task: Task,
    input_hash: Binary,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;

    let input: NewAuthOutStoreMsg = serde_json_wasm::from_str(&input_values)
        .map_err(|err| StdError::generic_err(err.to_string()))?;

    let viewing_key_index = input.secret_user.as_str(); // convert u8 to String

    if viewing_key_index.chars().count() == 0 {
        return Err(StdError::generic_err("Secret must not be an empty string"));
    }

    // https://docs.scrt.network/secret-network-documentation/development/development-concepts/permissioned-viewing/viewing-keys#viewing-keys-implementation
    let gateway_account = config.gateway_address.to_owned();
    let mut index_concat: String = gateway_account.to_string();
    let suffix: &str = viewing_key_index;
    // mutate in place https://stackoverflow.com/a/30154791/3208553
    index_concat.push_str(config.nunya_business_contract_address.as_str());
    index_concat.push_str(suffix);

    // https://docs.scrt.network/secret-network-documentation/development/development-concepts/permissioned-viewing/viewing-keys#viewing-keys-introduction
    // https://github.com/scrtlabs/examples/blob/master/secret-viewing-keys/secret-viewing-keys-contract/src/contract.rs
    let entropy: &[u8] = viewing_key_index.as_bytes();
    let viewing_key = ViewingKey::create(deps.storage, &info, &env, index_concat.as_str(), entropy);

    // Viewing Key
    VIEWING_KEY
        // TODO - sender is always the gateway contract, or perhaps change this to `info.sender.as_bytes()`
        .add_suffix(config.gateway_address.as_bytes())
        .insert(deps.storage, &viewing_key_index.to_string(), &viewing_key)?;

    // Attempt to retrieve existing
    let value_payment_reference_to_balances_map: Option<Vec<PaymentReferenceBalance>> = Some(VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP
        .get(deps.storage, &index_concat)
        .ok_or_else(|| StdError::generic_err("Value for this VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP key not found"))?);

    // TODO: need to setup viewing key for the mapping, but not necessary to store this example
    let init_balance: Coin = coin(0u128, String::new());
    let init_payment_ref = String::new();
    let init_payment_reference_balance = PaymentReferenceBalance {
        payment_reference: init_payment_ref,
        balance: init_balance,
    };

    let mut value_payment_reference_to_balances: Vec<PaymentReferenceBalance> = match value_payment_reference_to_balances_map {
        Some(payment_reference_to_balances) => payment_reference_to_balances, // If there are existing
        None => Vec::new(),   // If none are found, start with an empty vector
    };

    // Add the new to vector
    value_payment_reference_to_balances.push(init_payment_reference_balance.clone());

    // Save updated back to storage
    VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP
        .insert(deps.storage, &viewing_key, &value_payment_reference_to_balances)?;

    let response_status_code: ResponseStatusCode = 0u16;

    let data = ResponseNewAuthOutStoreMsg {
        _request_id: task.clone(),
        _code: response_status_code,
    };

    let json_string =
        serde_json_wasm::to_string(&data).map_err(|err| StdError::generic_err(err.to_string()))?;

    let result = general_purpose::STANDARD.encode(json_string);

    // Get the contract's code hash using the gateway address
    let gateway_code_hash = get_contract_code_hash(deps, config.gateway_address.to_string())?;

    let callback_msg = GatewayMsg::Output {
        // Sepolia network gateway contract Solidity source code
        //   https://github.com/SecretSaturn/SecretPath/blob/main/TNLS-Gateways/public-gateway/src/Gateway.sol
        // Sepolia network gateway contract deployed code (line 383, 914)
        //   https://sepolia.etherscan.io/address/0x0B6c705db59f7f02832d66B97b03E9EB3c0b4AAB#code
        // Secret network gateway contract Rust source code `PostExecutionInfo`
        //   https://github.com/SecretSaturn/SecretPath/blob/main/TNLS-Gateways/solana-gateway/programs/solana-gateway/src/lib.rs#L737
        outputs: PostExecutionMsg {
            result,
            task, // task is the requestId
            input_hash,
        },
    }
    .to_cosmos_msg(
        gateway_code_hash,
        config.gateway_address.to_string(),
        None,
    )?;

    Ok(Response::new()
        .add_message(callback_msg)
        .add_attribute("status", "create_new_auth_out"))
}

fn create_payment_reference(
    deps: DepsMut,
    _env: Env,
    input_values: String,
    task: Task,
    input_hash: Binary,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;

    let input: LinkPaymentRefStoreMsg = serde_json_wasm::from_str(&input_values)
        .map_err(|err| StdError::generic_err(err.to_string()))?;

    let viewing_key_index = input.secret_user.as_str(); // convert u8 to String

    if viewing_key_index.chars().count() == 0 {
        return Err(StdError::generic_err("Secret must not be an empty string"));
    }

    // https://docs.scrt.network/secret-network-documentation/development/development-concepts/permissioned-viewing/viewing-keys#viewing-keys-implementation
    let gateway_account = config.gateway_address.to_owned();
    let mut index_concat: String = gateway_account.to_string();
    let suffix: &str = viewing_key_index;
    index_concat.push_str(config.nunya_business_contract_address.as_str());
    index_concat.push_str(suffix);

    let entropy: &str = viewing_key_index.clone();
    let result = ViewingKey::check(deps.storage, &index_concat, entropy);
    assert_ne!(result, Err(StdError::generic_err("unauthorized")));

    let viewing_key = VIEWING_KEY
        .get(deps.storage, &index_concat)
        .ok_or_else(|| StdError::generic_err("Value for this VIEWING_KEY key not found"))?;

    if viewing_key != index_concat {
        return Err(StdError::generic_err("Viewing Key incorrect or not found"));
    }

    let payment_ref = input.payment_ref.as_str(); // convert Uint256 to String

    if payment_ref.chars().count() == 0 {
        return Err(StdError::generic_err("Payment reference must not be an empty string"));
    }

    // TODO: Check stored correctly but move to tests
    let value_payment_reference_to_balances_map: Option<Vec<PaymentReferenceBalance>> = Some(VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP
        .get(deps.storage, &index_concat)
        .ok_or_else(|| StdError::generic_err("Value for this VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP key not found"))?);

    // TODO: if payment_ref already exists in VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP value then early exit here

    let new_balance: Coin = coin(0u128, String::new());
    let new_payment_ref = payment_ref;
    let new_payment_reference_balance = PaymentReferenceBalance {
        payment_reference: new_payment_ref.to_string(),
        balance: new_balance,
    };

    let mut value_payment_reference_to_balances: Vec<PaymentReferenceBalance> = match value_payment_reference_to_balances_map {
        Some(payment_reference_to_balances) => payment_reference_to_balances, // If there are existing
        None => Vec::new(),   // If none are found, start with an empty vector
    };

    // Add the new to vector
    value_payment_reference_to_balances.push(new_payment_reference_balance.clone());

    // Save updated back to storage
    VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP
        .insert(deps.storage, &viewing_key, &value_payment_reference_to_balances)?;

    let response_status_code: ResponseStatusCode = 0u16;

    let data = ResponseLinkPaymentRefStoreMsg {
        _request_id: task.clone(),
        _code: response_status_code,
        _reference: new_payment_ref.to_string(),
    };

    let json_string =
        serde_json_wasm::to_string(&data).map_err(|err| StdError::generic_err(err.to_string()))?;

    let result = general_purpose::STANDARD.encode(json_string);

    // Get the contract's code hash using the gateway address
    let gateway_code_hash = get_contract_code_hash(deps, config.gateway_address.to_string())?;

    let callback_msg = GatewayMsg::Output {
        outputs: PostExecutionMsg {
            result,
            task,
            input_hash,
        },
    }
    .to_cosmos_msg(
        gateway_code_hash,
        config.gateway_address.to_string(),
        None,
    )?;

    Ok(Response::new()
        .add_message(callback_msg)
        .add_attribute("status", "create_payment_reference"))
}

fn create_pay(
    deps: DepsMut,
    _env: Env,
    input_values: String,
    task: Task,
    input_hash: Binary,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;

    let input: PayStoreMsg = serde_json_wasm::from_str(&input_values)
        .map_err(|err| StdError::generic_err(err.to_string()))?;

    // TODO: validate the input.secret_user input
    let viewing_key_index = input.secret_user.as_str(); // convert u8 to String
    let payment_ref = input.payment_ref.as_str(); // convert Uint256 to String
    // TODO: handle error if issue with amount or denomination received
    let amount: Uint128 = input.amount.into(); // Uint128
    let denomination = input.denomination.as_str();

    if viewing_key_index.chars().count() == 0 {
        return Err(StdError::generic_err("Secret must not be an empty string"));
    }
    if payment_ref.chars().count() == 0 {
        return Err(StdError::generic_err("Payment reference must not be an empty string"));
    }
    if amount == <u128 as Into<Uint128>>::into(0u128) {
        return Err(StdError::generic_err("Payment amount must be greater than 0"));
    }
    if denomination.chars().count() == 0 {
        return Err(StdError::generic_err("Payment denomination must not be an empty string"));
    }

    // https://docs.scrt.network/secret-network-documentation/development/development-concepts/permissioned-viewing/viewing-keys#viewing-keys-implementation
    let gateway_account = config.gateway_address.to_owned();
    let mut index_concat: String = gateway_account.to_string();
    let suffix: &str = viewing_key_index;
    index_concat.push_str(config.nunya_business_contract_address.as_str());
    index_concat.push_str(suffix);

    let entropy: &str = viewing_key_index.clone();
    let result = ViewingKey::check(deps.storage, &index_concat, entropy);
    assert_ne!(result, Err(StdError::generic_err("unauthorized")));

    let viewing_key = VIEWING_KEY
        .get(deps.storage, &index_concat)
        .ok_or_else(|| StdError::generic_err("Value for this VIEWING_KEY key not found"))?;

    if viewing_key != index_concat {
        return Err(StdError::generic_err("Viewing Key incorrect or not found"));
    }

    // Attempt to retrieve existing
    let value_payment_reference_to_balances_map: Option<Vec<PaymentReferenceBalance>> = Some(VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP
        .get(deps.storage, &index_concat)
        .ok_or_else(|| StdError::generic_err("Value for this VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP key not found"))?);

    let mut value_payment_reference_to_balances: Vec<PaymentReferenceBalance> = match value_payment_reference_to_balances_map {
        Some(payment_reference_to_balances) => payment_reference_to_balances, // If there are existing
        None => return Err(StdError::generic_err("No payment references found")), // If none are found, early return
    };

    // Check if matching `payment_ref` is in the vector since only pay if it exists
    let index: Option<usize> = Some(value_payment_reference_to_balances.iter().position(|r| r.payment_reference == payment_ref).unwrap());

    let index_value_payment_reference_to_balances = match index {
        Some(val) => {
            println!("Found matching payment reference at index: {:#?}", val);
            val
        },
        None => return Err(StdError::generic_err("No payment references found")),
    };

    // Add pay amount to existing balance associated with the payment reference that was found
    let new_balance_amount: Uint128 = value_payment_reference_to_balances[index_value_payment_reference_to_balances].balance.amount.saturating_add(amount);
    let new_balance: Coin = coin(<Uint128 as Into<u128>>::into(new_balance_amount), denomination);


    let new_payment_reference_balance = PaymentReferenceBalance {
        payment_reference: payment_ref.to_string(),
        balance: new_balance,
    };

    // Update the index in the vector with the matching payment reference
    value_payment_reference_to_balances[index_value_payment_reference_to_balances] = new_payment_reference_balance;

    // Save updated back to storage
    VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP
        .insert(deps.storage, &viewing_key, &value_payment_reference_to_balances)?;

    let receipt: PaymentReceipt;

    // FIXME: sign receipt using Secret contract's private key, currently just hardcoded.
    // But how to get the Secret contract's public and private key?
    let signature: Binary = "0x".as_bytes().into();

    let user_pubkey: Uint256;
    if let Some(ref _user_pubkey) = input.user_pubkey {
        user_pubkey = *_user_pubkey;

        // TODO: if user_pubkey has been provided then return encrypted receipt and signature with the user_pubkey
        // TODO: still need to encrypt below with user_pubkey
        receipt = PaymentReceipt {
            payment_reference: payment_ref.to_string(),
            // TODO: convert Uint256 to Uint128
            // Note: denomination of `Coin` type for the Receipt, since that is handled by the Solidity contract
            amount: new_balance_amount.into(),
            // TODO: serialise denomination
            denomination: denomination.to_string(),
            sig: signature,
        };
    } else {
        // return receipt and signature unencrypted
        receipt = PaymentReceipt {
            payment_reference: payment_ref.to_string(),
            // TODO: convert Uint256 to Uint128
            // Note: denomination of `Coin` type for the Receipt, since that is handled by the Solidity contract
            amount: new_balance_amount.into(),
            // TODO: serialise denomination
            denomination: denomination.to_string(),
            sig: signature,
        };
    }

    let response_status_code: ResponseStatusCode = 0u16;

    let data = ResponsePayStoreMsg {
        _request_id: task.clone(),
        _code: response_status_code,
        _receipt: receipt,
    };

    let json_string =
        serde_json_wasm::to_string(&data).map_err(|err| StdError::generic_err(err.to_string()))?;

    let result = general_purpose::STANDARD.encode(json_string);

    // Get the contract's code hash using the gateway address
    let gateway_code_hash = get_contract_code_hash(deps, config.gateway_address.to_string())?;

    let callback_msg = GatewayMsg::Output {
        outputs: PostExecutionMsg {
            result,
            task,
            input_hash,
        },
    }
    .to_cosmos_msg(
        gateway_code_hash,
        config.gateway_address.to_string(),
        None,
    )?;

    Ok(Response::new()
        .add_message(callback_msg)
        .add_attribute("status", "create_pay"))
}

fn create_withdraw_to(
    deps: DepsMut,
    _env: Env,
    input_values: String,
    task: Task,
    input_hash: Binary,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;

    let input: WithdrawToStoreMsg = serde_json_wasm::from_str(&input_values)
        .map_err(|err| StdError::generic_err(err.to_string()))?;

    let viewing_key_index = input.secret_user.as_str(); // convert u8 to String

    // Do not include receiving any payment reference since want to ignore it

    // TODO: handle error if issue with amount or denomination received
    let amount: Uint128 = input.amount.into(); // Uint128
    let denomination = input.denomination.as_str();
    let withdrawal_address: [u8; 20] = input.withdrawal_address.into(); // or `Addr`

    if viewing_key_index.chars().count() == 0 {
        return Err(StdError::generic_err("Secret must not be an empty string"));
    }
    // Do not validate payment reference since want to ignore it
    if amount == <u128 as Into<Uint128>>::into(0u128) {
        return Err(StdError::generic_err("Payment amount must be greater than 0"));
    }
    if denomination.chars().count() == 0 {
        return Err(StdError::generic_err("Payment denomination must not be an empty string"));
    }
    // TODO: validate withdrawal address input. check if could be `Addr` type

    // https://docs.scrt.network/secret-network-documentation/development/development-concepts/permissioned-viewing/viewing-keys#viewing-keys-implementation
    let gateway_account = config.gateway_address.to_owned();
    let mut index_concat: String = gateway_account.to_string();
    let suffix: &str = viewing_key_index;
    index_concat.push_str(config.nunya_business_contract_address.as_str());
    index_concat.push_str(suffix);

    let entropy: &str = viewing_key_index.clone();
    let result = ViewingKey::check(deps.storage, &index_concat, entropy);
    assert_ne!(result, Err(StdError::generic_err("unauthorized")));

    let value_viewing_key = VIEWING_KEY
        .get(deps.storage, &index_concat)
        .ok_or_else(|| StdError::generic_err("Value for this VIEWING_KEY key not found"))?;

    if value_viewing_key != index_concat {
        return Err(StdError::generic_err("Viewing Key incorrect or not found"));
    }

    // Attempt to retrieve existing
    let value_payment_reference_to_balances_map: Option<Vec<PaymentReferenceBalance>> = Some(VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP
        .get(deps.storage, &index_concat)
        .ok_or_else(|| StdError::generic_err("Value for this VIEWING_KEY_TO_PAYMENT_REF_TO_BALANCES_MAP key not found"))?);

    let value_payment_reference_to_balances: Vec<PaymentReferenceBalance> = match value_payment_reference_to_balances_map {
        Some(payment_reference_to_balances) => payment_reference_to_balances, // If there are existing
        None => return Err(StdError::generic_err("No payment references found")), // If none are found, early return
    };

    // Do not only withdraw associated with a specific payment reference at an index in the storage vector since want to ignore it
    // Do not need to check that the `payment_ref` provided exists in storage since ignore it
    // Do not need to check using the `payment_ref` that we want to withdraw using:
    // the `amount` provided ensuring it is less than or equal to the amount stored associated with the payment reference
    // and that the `denomination` matches the provided denomination that we want to withdraw

    // Do not store withdrawal address in state
    // Do not transfer anything on Secret Network
    // Only authorise the withdrawal

    let mut balance_all_payment_refs: Uint128 = 0u128.into();
    for element in value_payment_reference_to_balances.into_iter() {
        if element.balance.denom == denomination {
            balance_all_payment_refs += element.balance.amount
        }
    }

    if amount > balance_all_payment_refs {
        return Err(StdError::generic_err("Withdrawal amount must be less than or equal to total balance of all payment references"));
    }

    let response_status_code: ResponseStatusCode = 0u16;

    let data = ResponseWithdrawToStoreMsg {
        _request_id: task.clone(),
        _code: response_status_code,
        _amount: amount,
        _withdrawal_address: withdrawal_address,
    };

    let json_string =
        serde_json_wasm::to_string(&data).map_err(|err| StdError::generic_err(err.to_string()))?;

    let result = general_purpose::STANDARD.encode(json_string);

    // Get the contract's code hash using the gateway address
    let gateway_code_hash = get_contract_code_hash(deps, config.gateway_address.to_string())?;

    let callback_msg = GatewayMsg::Output {
        outputs: PostExecutionMsg {
            result,
            task,
            input_hash,
        },
    }
    .to_cosmos_msg(
        gateway_code_hash,
        config.gateway_address.to_string(),
        None,
    )?;

    Ok(Response::new()
        .add_message(callback_msg)
        .add_attribute("status", "DO_THE_WITHDRAWAL"))
}

// reference: https://github.com/writersblockchain/secretpath-voting/commit/b0b5d8ac7b7d691c7d7ebf0bc52e5aedb8da7e86#diff-a982e501ba4bd05192a8c497bd5093517ea5606f9e341b9b7d09b233068da829R232
fn get_contract_code_hash(deps: DepsMut, contract_address: String) -> StdResult<String> {
    let code_hash_query: cosmwasm_std::QueryRequest<cosmwasm_std::Empty> =
        cosmwasm_std::QueryRequest::Stargate {
            path: "/secret.compute.v1beta1.Query/CodeHashByContractAddress".into(),
            data: Binary(Anybuf::new().append_string(1, contract_address).into_vec()),
        };
    let raw = to_vec(&code_hash_query).map_err(|serialize_err| {
        StdError::generic_err(format!("Serializing QueryRequest: {}", serialize_err))
    })?;
    let code_hash = match deps.querier.raw_query(&raw) {
        SystemResult::Err(system_err) => Err(StdError::generic_err(format!(
            "Querier system error: {}",
            system_err
        ))),
        SystemResult::Ok(ContractResult::Err(contract_err)) => Err(StdError::generic_err(format!(
            "Querier contract error: {}",
            contract_err
        ))),
        SystemResult::Ok(ContractResult::Ok(value)) => Ok(value),
    }?;
    // Remove the "\n@" if it exists at the start of the code_hash
    let mut code_hash_str = String::from_utf8(code_hash.to_vec())
        .map_err(|err| StdError::generic_err(format!("Invalid UTF-8 sequence: {}", err)))?;
    if code_hash_str.starts_with("\n@") {
        code_hash_str = code_hash_str.trim_start_matches("\n@").to_string();
    }
    Ok(code_hash_str)
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    let response = match msg {
        QueryMsg::RetrievePubkey {} => to_binary(&retrieve_pubkey_query(deps)?),
    };
    pad_query_result(response, BLOCK_SIZE)
}

fn retrieve_pubkey_query(deps: Deps) -> StdResult<ResponseRetrievePubkeyMsg> {
    let my_keys = MY_KEYS.load(deps.storage)?;
    Ok(ResponseRetrievePubkeyMsg {
        _key: my_keys.public_key,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::testing::{message_info, mock_dependencies, mock_dependencies_with_balances, mock_env};
    use cosmwasm_std::coins;
    use cosmwasm_std::{from_binary, StdError};

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
}
