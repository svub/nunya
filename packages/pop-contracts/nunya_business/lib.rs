#![cfg_attr(not(feature = "std"), no_std, no_main)]

use ink::primitives::AccountId

struct ExecutionInfo {
    bytes user_key;
    bytes user_pubkey;
    string routing_code_hash;
    string task_destination_network;
    string handle;
    bytes12 nonce;
    uint32 callback_gas_limit;
    bytes payload;
    bytes payload_signature;
}

#[ink::event]
pub struct LogNewTask {
    #[ink(topic)]
    _taskId: uint256,
    #[ink(topic)]
    source_network: string,
    #[ink(topic)]
    user_address: AccountId,
    routing_info: string,
    payload_hash: bytes32,
    info: ExecutionInfo,
}

#[ink::contract]
mod nunya_business {

    #[ink(storage)]
    pub struct NunyaBusiness {
        pub taskId: uint256,
    }

    impl NunyaBusiness {
        #[ink(constructor)]
        pub fn new() -> Self {
            const taskId = 1;
            Self { taskId: taskId }
        }

        /// Constructor that initializes the value.
        #[ink(constructor)]
        pub fn default() -> Self {
            Self::new(Default::default())
        }

        #[ink(message)]
        pub fn send(
            &self,
            _payloadHash: bytes32,
            _userAddress: AccountId,
            _routingInfo: string,
            _info: ExecutionInfo,
        ) -> uint256 {

            const _taskId = self.taskId;

            const _chainId = self.chain

            Self::env().emit_event(LogNewTask {
                _taskId,
                source_network: _chainId,
                _userAddress,
                _routingInfo,
                _payloadHash,
                _info,
            });

            Self { taskId: _taskId + 1 }
        }
    }
}
