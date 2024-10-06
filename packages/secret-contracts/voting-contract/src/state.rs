use cosmwasm_std::{Addr, Binary};
use secret_toolkit::storage::{Item, Keymap};

use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

pub static CONFIG: Item<State> = Item::new(b"config");
// pub static PROPOSAL_MAP: Keymap<u32, Proposal> = Keymap::new(b"PROPOSAL_MAP");
// pub static VOTE_MAP: Keymap<u32, Vec<Vote>> = Keymap::new(b"VOTE_MAP");

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct State {
    pub gateway_address: Addr,
    pub gateway_hash: String,
    pub gateway_key: Binary,
}

// #[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
// pub struct Proposal {
//     pub name: String,
//     pub description: String,
//     pub end_time: u64,
// }

// #[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
// pub struct Vote {
//     pub vote: String,
//     pub wallet_address: String,
//     pub index: u32,
// }

// #[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
// pub struct Votes {
//     pub votes: Vec<Vote>,
// }
