use borsh::{BorshDeserialize, BorshSerialize};
use serde::{Deserialize, Serialize};

#[derive(Debug, BorshSerialize, BorshDeserialize,Serialize, Deserialize, Clone, Hash)]
pub struct ArbitrageInput {
    pub orca_sol_reserves : u64,
    pub orca_usdc_reserves : u64,
    pub raydium_sol_reserves : u64,
    pub raydium_usdc_reserves : u64,
    pub user_profit_threshold : u64
}

#[derive(BorshSerialize, BorshDeserialize, Serialize, Deserialize)]
pub struct ArbitrageAction {
    pub transaction_instructions : Vec<Vec<u8>>,
}