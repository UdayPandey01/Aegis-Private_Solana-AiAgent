#![no_std]
#![no_main]

extern crate alloc;
use alloc::vec::Vec;
use borsh::{BorshDeserialize, BorshSerialize};
use risc0_zkvm::guest::env;
use shared::{ArbitrageAction, ArbitrageInput};

risc0_zkvm::guest::entry!(main);

fn calculate_swap_out(amount_in: u64, reserves_in: u64, reserves_out: u64) -> u64 {
    let amount_in_u128 = amount_in as u128;
    let reserves_in_u128 = reserves_in as u128;
    let reserves_out_u128 = reserves_out as u128;

    let numerator = amount_in_u128 * reserves_out_u128;
    let denominator = reserves_in_u128 + amount_in_u128;
    (numerator / denominator) as u64
}

fn main() {
    let input = ArbitrageInput::deserialize_reader(&mut env::stdin()).unwrap();

    let mut instructions = Vec::new();
    let amount_to_swap = 1_000_000_000;

    let usdc_from_orca = calculate_swap_out(amount_to_swap, input.orca_sol_reserves, input.orca_usdc_reserves);
    let sol_from_raydium = calculate_swap_out(usdc_from_orca, input.raydium_usdc_reserves, input.raydium_sol_reserves);

    let profit = sol_from_raydium.saturating_sub(amount_to_swap);
    
    let profit_threshold = (amount_to_swap / 1_000_000) * input.user_profit_threshold;

    if profit > profit_threshold {
        instructions.push(b"Instruction: Swap SOL for USDC on Orca".to_vec());
        instructions.push(b"Instruction: Swap USDC for SOL on Raydium".to_vec());
    }

    let action = ArbitrageAction {
        transaction_instructions: instructions,
    };

    let serialized_output = action.try_to_vec().unwrap();
    env::commit_slice(&serialized_output);
}