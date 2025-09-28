#![no_std]
#![no_main]

extern crate alloc;
use alloc::vec::Vec;
use borsh::BorshSerialize;
use risc0_zkvm::guest::env;
use shared::AgentOutput;

risc0_zkvm::guest::entry!(main);

fn main() {
    let private_input: Vec<u8> = env::read();
    let message_length = private_input.len() as u64;
    let output = AgentOutput { message_length };

    let mut serialized_output = Vec::new();
    output.serialize(&mut serialized_output).unwrap();
    
    env::commit_slice(&serialized_output);
}
