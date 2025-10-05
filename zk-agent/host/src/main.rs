use methods::GUEST_ELF;
use risc0_zkvm::{default_prover, ExecutorEnv, Receipt};
use shared::ArbitrageInput;
use serde_json;

fn main() {
    const SOL_DECIMALS: u64 = 1_000_000_000;
    const USDC_DECIMALS: u64 = 1_000_000;

    let simulated_market_data = ArbitrageInput {
        orca_sol_reserves: 10_000 * SOL_DECIMALS,
        orca_usdc_reserves: 1_000_000 * USDC_DECIMALS,
        raydium_sol_reserves: 10_000 * SOL_DECIMALS,
        raydium_usdc_reserves: 500_000 * USDC_DECIMALS,
        user_profit_threshold: 1,
    };

    let env = ExecutorEnv::builder()
        .write(&simulated_market_data)
        .unwrap()
        .build()
        .unwrap();

    // --- PROOF GENERATION (Remains the same) ---
    let prover = default_prover();
    let prove_info = prover.prove(env, GUEST_ELF).unwrap();
    let receipt: Receipt = prove_info.receipt;

    // --- THIS IS THE FIX ---
    // The host's ONLY job is to serialize the original, complete receipt
    // (which includes the 'seal') to a JSON string and print it.
    let receipt_json = serde_json::to_string(&receipt).unwrap();
    print!("{}", receipt_json);
}