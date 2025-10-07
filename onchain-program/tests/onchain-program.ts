// tests/onchain-program.ts
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OnchainProgram } from "../target/types/onchain_program";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  createMint,
  mintTo,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";

describe("onchain-program", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.OnchainProgram as Program<OnchainProgram>;
  const user = provider.wallet as anchor.Wallet;

  // Keypairs for our test mints
  let solMint: PublicKey;
  let usdcMint: PublicKey;

  // User's Associated Token Accounts
  let userSolATA: PublicKey;
  let userUsdcATA: PublicKey;
  
  // PDAs for the vault
  const [vaultPDA, vaultBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), user.publicKey.toBuffer()],
    program.programId
  );
  
  let solVaultATA: PublicKey;
  let usdcVaultATA: PublicKey;

  // Job PDA
  const jobId = new anchor.BN(1);
  const [jobPDA, jobBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("job"), user.publicKey.toBuffer(), jobId.toBuffer("le", 8)],
    program.programId
  );

  // Utility to create a new mint
  const createTestMint = async (): Promise<PublicKey> => {
    return await createMint(
      provider.connection,
      user.payer, // Payer of the transaction
      user.publicKey, // Mint authority
      null, // Freeze authority
      6 // Decimals
    );
  };

  before(async () => {
    // Airdrop SOL to user for transactions
    await provider.connection.requestAirdrop(user.publicKey, 2 * LAMPORTS_PER_SOL);

    // Create our test SOL and USDC mints
    solMint = await createTestMint();
    usdcMint = await createTestMint();
    console.log(`SOL Mint: ${solMint.toBase58()}`);
    console.log(`USDC Mint: ${usdcMint.toBase58()}`);

    // Create Associated Token Accounts for the user
    const userSolAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      user.payer,
      solMint,
      user.publicKey
    );
    userSolATA = userSolAccount.address;

    const userUsdcAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      user.payer,
      usdcMint,
      user.publicKey
    );
    userUsdcATA = userUsdcAccount.address;
    
    console.log(`User SOL ATA: ${userSolATA.toBase58()}`);
    console.log(`User USDC ATA: ${userUsdcATA.toBase58()}`);

    // Mint some tokens to the user's accounts
    await mintTo(provider.connection, user.payer, solMint, userSolATA, user.payer, 100 * 10 ** 6);
    await mintTo(provider.connection, user.payer, usdcMint, userUsdcATA, user.payer, 1000 * 10 ** 6);

    // Derive vault's ATAs
    solVaultATA = (await PublicKey.findProgramAddress(
        [vaultPDA.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), solMint.toBuffer()],
        ASSOCIATED_TOKEN_PROGRAM_ID
    ))[0];
    usdcVaultATA = (await PublicKey.findProgramAddress(
        [vaultPDA.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), usdcMint.toBuffer()],
        ASSOCIATED_TOKEN_PROGRAM_ID
    ))[0];
  });

  it("Initializes the trading vault!", async () => {
    const tx = await program.methods
      .initializeVault()
      .accounts({
        vault: vaultPDA,
        solMint: solMint,
        usdcMint: usdcMint,
        solVault: solVaultATA,
        usdcVault: usdcVaultATA,
        user: user.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .rpc();
    
    console.log("Initialize vault transaction signature", tx);

    // Fetch the created account
    const vaultAccount = await program.account.tradingVault.fetch(vaultPDA);
    
    assert.ok(vaultAccount.owner.equals(user.publicKey), "Vault owner is incorrect");
    assert.ok(vaultAccount.solVault.equals(solVaultATA), "SOL vault address is incorrect");
    assert.ok(vaultAccount.usdcVault.equals(usdcVaultATA), "USDC vault address is incorrect");
    assert.equal(vaultAccount.solBalance.toNumber(), 0, "Initial SOL balance should be 0");
    assert.equal(vaultAccount.usdcBalance.toNumber(), 0, "Initial USDC balance should be 0");
  });

  it("Deposits SOL and USDC into the vault", async () => {
    const solAmount = new anchor.BN(1 * 10 ** 6); // 1 SOL
    const usdcAmount = new anchor.BN(100 * 10 ** 6); // 100 USDC
    
    await program.methods
      .deposit(solAmount, usdcAmount)
      .accounts({
        vault: vaultPDA,
        userSolAccount: userSolATA,
        userUsdcAccount: userUsdcATA,
        solVault: solVaultATA,
        usdcVault: usdcVaultATA,
        owner: user.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        solMint: solMint,
        usdcMint: usdcMint,
      })
      .rpc();
      
    const vaultAccount = await program.account.tradingVault.fetch(vaultPDA);
    assert.equal(vaultAccount.solBalance.toString(), solAmount.toString());
    assert.equal(vaultAccount.usdcBalance.toString(), usdcAmount.toString());
    
    const solVaultBalance = await provider.connection.getTokenAccountBalance(solVaultATA);
    assert.equal(solVaultBalance.value.amount, solAmount.toString());
  });

  it("Withdraws SOL and USDC from the vault", async () => {
    const solAmount = new anchor.BN(0.5 * 10 ** 6); // 0.5 SOL
    const usdcAmount = new anchor.BN(50 * 10 ** 6); // 50 USDC
    
    await program.methods
      .withdraw(solAmount, usdcAmount)
      .accounts({
        vault: vaultPDA,
        userSolAccount: userSolATA,
        userUsdcAccount: userUsdcATA,
        solVault: solVaultATA,
        usdcVault: usdcVaultATA,
        owner: user.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        solMint: solMint,
        usdcMint: usdcMint,
      })
      .rpc();
      
    const vaultAccount = await program.account.tradingVault.fetch(vaultPDA);
    assert.equal(vaultAccount.solBalance.toNumber(), 500000); // 1M - 0.5M
    assert.equal(vaultAccount.usdcBalance.toNumber(), 50000000); // 100M - 50M
    
    const solVaultBalance = await provider.connection.getTokenAccountBalance(solVaultATA);
    assert.equal(solVaultBalance.value.amount, "500000");
  });

  it("Creates a new job", async () => {
    await program.methods
      .createJob(jobId)
      .accounts({
        job: jobPDA,
        authority: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
      
    const jobAccount = await program.account.job.fetch(jobPDA);
    assert.ok(jobAccount.authority.equals(user.publicKey));
    assert.equal(jobAccount.jobId.toString(), jobId.toString());
    assert.deepEqual(jobAccount.status, { pending: {} });
  });

  it("Executes a job", async () => {
    const result = Buffer.from("trade successful");

    await program.methods
      .executeJob(result)
      .accounts({
        job: jobPDA,
        authority: user.publicKey,
      })
      .rpc();
      
    const jobAccount = await program.account.job.fetch(jobPDA);
    assert.deepEqual(jobAccount.status, { completed: {} });
    assert.deepEqual(jobAccount.result, result);
  });
});