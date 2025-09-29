use borsh::{BorshDeserialize, BorshSerialize};

#[derive(Debug, BorshSerialize, BorshDeserialize, Clone, Hash)]
pub struct AgentOutput {
    pub message_length: u64,
}