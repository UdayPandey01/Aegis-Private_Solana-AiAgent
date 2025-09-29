use borsh::BorshDeserialize;
use methods::GUEST_ELF;
use risc0_zkvm::{default_prover, ExecutorEnv};
use shared::AgentOutput;
use std::env;
 
fn main() {
    let args: Vec<String> = env::args().collect();
    let private_input_string = args.get(1).expect("Please provide a private input string").clone();

    let private_input_bytes = private_input_string.as_bytes();

    let env = ExecutorEnv::builder()
        .write(&private_input_bytes)
        .unwrap()
        .build()
        .unwrap();

    let prover = default_prover();

    let receipt = prover.prove(env, GUEST_ELF).unwrap().receipt;

    let output = AgentOutput::try_from_slice(&receipt.journal.bytes).expect("Failed to decode journal");
    println!("\n✅ Proof generated successfully!");
    println!("The ZK agent has proven that the length of the secret input is: {}", output.message_length);
}