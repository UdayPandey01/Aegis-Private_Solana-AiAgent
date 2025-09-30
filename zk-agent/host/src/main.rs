use borsh::BorshDeserialize;
use methods::GUEST_ELF;
use risc0_zkvm::{default_prover, ExecutorEnv};
use shared::{ArbitrageAction, ArbitrageInput};

fn main() {
    println!("--- Fetching real-time market data... ---");

    const SOL_DECIMALS: u64 = 1_000_000_000;
    const USDC_DECIMALS: u64 = 1_000_000;

    let simulated_market_data = ArbitrageInput {
        orca_sol_reserves: 10_000 * SOL_DECIMALS,
    orca_usdc_reserves: 1_000_000 * USDC_DECIMALS, 
    raydium_sol_reserves: 10_000 * SOL_DECIMALS,
    raydium_usdc_reserves: 500_000 * USDC_DECIMALS,
    user_profit_threshold: 1,
    };
    println!("    Market data fetched.");


    let env = ExecutorEnv::builder()
        .write(&simulated_market_data)
        .unwrap()
        .build()
        .unwrap();

    let prover = default_prover();
    println!("\n--- ZK agent is confidentially analyzing the market for arbitrage...---");
    let prove_info = prover.prove(env, GUEST_ELF).unwrap();
    println!("    Proof generated successfully!");
    
    let receipt = prove_info.receipt;

    let output = ArbitrageAction::try_from_slice(&receipt.journal.bytes).expect("Failed to decode journal");

    if output.transaction_instructions.is_empty() {
        println!("\n--- Agent found no profitable arbitrage opportunity. ---");
    } else {
        println!("\n--- Agent found a profitable arbitrage! The following transaction was proven: ---");
        for (i, instruction) in output.transaction_instructions.iter().enumerate() {
            println!("   {}. {}", i + 1, String::from_utf8(instruction.clone()).unwrap());
        }
    }
}