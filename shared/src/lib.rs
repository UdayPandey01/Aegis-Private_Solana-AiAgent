// filename: shared/src/lib.rs
use borsh::{BorshDeserialize, BorshSerialize};

// This struct defines the public output of our ZK agent.
// It will be serialized and sent to the on-chain program.
#[derive(Debug, BorshSerialize, BorshDeserialize, Clone, Hash)]
pub struct AgentOutput {
    pub message_length: u64,
}