use methods::GUEST_ELF;
use risc0_zkvm::{default_prover, ExecutorEnv, Receipt};
use shared::ArbitrageInput;
use solana_client::rpc_client::RpcClient;
use solana_program::pubkey::Pubkey;
use spl_token::state::Account as SplTokenAccount;
use std::env;
use std::str::FromStr;
use anchor_lang::AccountDeserialize;
use serde_json;

fn get_token_account_balance(rpc_client: &RpcClient, pubkey: &Pubkey) -> u64 {
    let account_data = rpc_client.get_account_data(pubkey).unwrap();
    let token_account = SplTokenAccount::unpack(&account_data).unwrap();
    token_account.amount
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let user_profit_threshold_str = args.get(1).expect("Please provide a profit threshold");
    let user_profit_threshold = user_profit_threshold_str.parse::<u64>().expect("Invalid threshold");

    let rpc_client = RpcClient::new("https://api.devnet.solana.com");
    // const SOL_DECIMALS: u64 = 1_000_000_000;
    // const USDC_DECIMALS: u64 = 1_000_000;

    let orca_sol_reserves_pubkey = Pubkey::from_str("EUuUbDcafPrmVTD5M6qoJAoyyNbihBhugADAxRMn5he9").unwrap();
    let orca_usdc_reserves_pubkey = Pubkey::from_str("2WLWEuKDgkDUccTpbwYp1GToYktiSB1cXvreHUwiSUVP").unwrap();
    let raydium_sol_reserves_pubkey = Pubkey::from_str("4ct7br2vTPzfdmY3S5HLtTxcGSBfn6pnw98hsS6v359A").unwrap();
    let raydium_usdc_reserves_pubkey = Pubkey::from_str("5it83u57VRrVgc51oNV19TTmAJuffPx5GtGwQr7gQNUo").unwrap();

    let orca_sol_reserves = get_token_account_balance(&rpc_client, &orca_sol_reserves_pubkey);
    let orca_usdc_reserves = get_token_account_balance(&rpc_client, &orca_usdc_reserves_pubkey);
    let raydium_sol_reserves = get_token_account_balance(&rpc_client, &raydium_sol_reserves_pubkey);
    let raydium_usdc_reserves = get_token_account_balance(&rpc_client, &raydium_usdc_reserves_pubkey);

    let market_data = ArbitrageInput {
        orca_sol_reserves,
        orca_usdc_reserves,
        raydium_sol_reserves,
        raydium_usdc_reserves,
        user_profit_threshold,
    };

    let env = ExecutorEnv::builder()
        .write(&market_data)
        .unwrap()
        .build()
        .unwrap();

    let prover = default_prover();
    let prove_info = prover.prove(env, GUEST_ELF).unwrap();
    let receipt: Receipt = prove_info.receipt;

    let receipt_json = serde_json::to_string(&receipt).unwrap();
    print!("{}", receipt_json);
}