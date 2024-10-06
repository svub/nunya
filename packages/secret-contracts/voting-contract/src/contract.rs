use crate::{
    msg::{
        ExecuteMsg, GatewayMsg, InstantiateMsg, ProposalStoreMsg, QueryMsg,
        ResponseRetrieveProposalMsg, ResponseRetrieveVotesMsg, ResponseStoreProposalMsg,
        VoteStoreMsg,
    },
    state::{Proposal, State, Vote, CONFIG, PROPOSAL_MAP, VOTE_MAP},
};
use cosmwasm_std::{
    entry_point, to_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdError, StdResult,
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
        "create_proposal" => create_proposal(deps, env, msg.input_values, msg.task, msg.input_hash),
        "create_vote" => create_vote(deps, env, msg.input_values, msg.task, msg.input_hash),

        _ => Err(StdError::generic_err("invalid handle".to_string())),
    }
}

fn create_proposal(
    deps: DepsMut,
    env: Env,
    input_values: String,
    task: Task,
    input_hash: Binary,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;

    let input: ProposalStoreMsg = serde_json_wasm::from_str(&input_values)
        .map_err(|err| StdError::generic_err(err.to_string()))?;

    // Parse the index as u32
    let end_time = input
        .end_time
        .parse::<u64>()
        .map_err(|err| StdError::generic_err(format!("Invalid index: {}", err)))?;

    let proposal_end = calculate_future_block_height(env.block.height, end_time);

    let proposal = Proposal {
        name: input.name,
        description: input.description,
        end_time: proposal_end,
    };

    // Extract KeyIter from Result, handle error if necessary
    let key_iter_result = PROPOSAL_MAP.iter_keys(deps.storage);
    let mut max_key: u32 = 0;

    for key in key_iter_result? {
        max_key = max_key.max(key?);
    }
    let new_key = max_key + 1;

    // Insert the new auction item with the new key
    PROPOSAL_MAP.insert(deps.storage, &new_key, &proposal)?;

    let data = ResponseStoreProposalMsg {
        message: "Value store completed successfully".to_string(),
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

fn create_vote(
    deps: DepsMut,
    env: Env,
    input_values: String,
    task: Task,
    input_hash: Binary,
) -> StdResult<Response> {
    let config = CONFIG.load(deps.storage)?;

    let input: VoteStoreMsg = serde_json_wasm::from_str(&input_values)
        .map_err(|err| StdError::generic_err(err.to_string()))?;

    // Parse the index as u32
    let index = input
        .index
        .parse::<u32>()
        .map_err(|err| StdError::generic_err(format!("Invalid index: {}", err)))?;

    let proposal = PROPOSAL_MAP
        .get(deps.storage, &index)
        .ok_or_else(|| StdError::generic_err("Proposal not found"))?;

    let max_block_height = proposal.end_time;

    // Check if the current block height has surpassed the maximum allowed block height for bidding
    if env.block.height > max_block_height {
        return Err(StdError::generic_err("Voting period has ended"));
    }

    let storage_vote = Vote {
        vote: input.vote,
        wallet_address: input.wallet_address,
        index: index,
    };

    // Attempt to retrieve the existing bids for the auction item
    let votes_result = VOTE_MAP.get(deps.storage, &storage_vote.index);

    let mut proposal_votes: Vec<Vote> = match votes_result {
        Some(votes) => votes, // If there are existing votess
        None => Vec::new(),   // If no votes are found, start with an empty vector
    };

    // Add the new vote
    proposal_votes.push(storage_vote.clone());

    // Save the updated votes back to storage
    VOTE_MAP.insert(deps.storage, &storage_vote.index, &proposal_votes)?;

    let data = ResponseStoreProposalMsg {
        message: "Vote stored successfully".to_string(),
    };

    // Serialize the struct to a JSON string
    let json_string =
        serde_json_wasm::to_string(&data).map_err(|err| StdError::generic_err(err.to_string()))?;

    // Encode the JSON string to base64
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
        .add_attribute("status", "Bid stored with key"))
}

#[entry_point]
pub fn query(deps: Deps, env: Env, msg: QueryMsg) -> StdResult<Binary> {
    let response = match msg {
        QueryMsg::RetrieveProposal { key } => retrieve_proposal_query(deps, key),
        QueryMsg::RetrieveVotes { key } => retrieve_votes_query(env, deps, key),
    };
    pad_query_result(response, BLOCK_SIZE)
}

fn retrieve_proposal_query(deps: Deps, key: u32) -> StdResult<Binary> {
    let value = PROPOSAL_MAP
        .get(deps.storage, &key)
        .ok_or_else(|| StdError::generic_err("Value not found"))?;

    to_binary(&ResponseRetrieveProposalMsg {
        message: "Retrieved value successfully".to_string(),
        end_time: value.end_time,
        name: value.name,
        description: value.description,
    })
}

fn retrieve_votes_query(env: Env, deps: Deps, key: u32) -> StdResult<Binary> {
    // Retrieve the votes for the given proposal key
    let votes = VOTE_MAP
        .get(deps.storage, &key)
        .ok_or_else(|| StdError::generic_err("Votes not found for the given proposal"))?;

    let proposal = PROPOSAL_MAP
        .get(deps.storage, &key)
        .ok_or_else(|| StdError::generic_err("Value not found"))?;

    let max_block_height = proposal.end_time;

    // Check if the current block height has surpassed the maximum allowed block height for voting
    if env.block.height > max_block_height {
        let mut yes_votes = 0;
        let mut no_votes = 0;

        // Count yes and no votes
        for vote in votes.iter() {
            match vote.vote.as_str() {
                "yes" => yes_votes += 1,
                "no" => no_votes += 1,
                _ => {} // handle unexpected values if necessary
            }
        }

        // Determine the result based on vote counts
        let message = if yes_votes > no_votes {
            format!("Yes wins! Total yes votes: {}", yes_votes)
        } else if no_votes > yes_votes {
            format!("No wins! Total no votes: {} ", no_votes)
        } else {
            format!(
                "Tie! Total no votes: {}. Total yes votes: {}.",
                no_votes, yes_votes
            )
        };

        to_binary(&ResponseRetrieveVotesMsg { message })
    } else {
        to_binary(&ResponseRetrieveVotesMsg {
            message: "Voting period has not yet ended.".to_string(),
        })
    }
}

fn calculate_future_block_height(current_block_height: u64, minutes_into_future: u64) -> u64 {
    let average_block_time_seconds = 6; // Rounded average block time in seconds for simplification
    let seconds_into_future = minutes_into_future * 60; // Convert minutes into seconds

    // Calculate how many blocks will be produced in that time using integer arithmetic
    let blocks_to_be_added = seconds_into_future / average_block_time_seconds;

    // Calculate and return the future block height
    current_block_height + blocks_to_be_added as u64
}
