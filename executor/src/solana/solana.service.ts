import { Injectable, Logger } from '@nestjs/common';
import * as anchor from '@coral-xyz/anchor';
import idl from '../idl/onchain_program.json';
import { OnchainProgram } from '../idl/onchain_program';
import { Keypair, Connection, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

const USDC_MINT = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");

const JITO_TIP_ACCOUNT = new PublicKey("9jTuMHumUrYp8F8TFJUSN9tBTXGCV8m332AHZbxtm82t");

@Injectable()
export class SolanaService {
  private readonly logger = new Logger(SolanaService.name);
  private readonly provider: anchor.AnchorProvider;
  private readonly program: anchor.Program<OnchainProgram>;
  private readonly executorKeypair: Keypair;

  private lastApiCall = 0;
  private readonly minApiDelay = 1000;

  constructor() {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'http://127.0.0.1:8899';
    const privateKey = process.env.EXECUTOR_PRIVATE_KEY;
    const programId = process.env.AEGIS_PROGRAM_ID;

    // Debug logging
    this.logger.log(`Environment check:`);
    this.logger.log(`- SOLANA_RPC_URL: ${rpcUrl}`);
    this.logger.log(`- EXECUTOR_PRIVATE_KEY exists: ${!!privateKey}`);
    this.logger.log(`- AEGIS_PROGRAM_ID exists: ${!!programId}`);
    this.logger.log(`- All env keys: ${Object.keys(process.env).filter(k => k.includes('EXECUTOR') || k.includes('AEGIS') || k.includes('SOLANA')).join(', ')}`);

    if (!privateKey || !programId) {
      this.logger.error('Missing required environment variables!');
      this.logger.error(`EXECUTOR_PRIVATE_KEY: ${privateKey ? 'SET' : 'MISSING'}`);
      this.logger.error(`AEGIS_PROGRAM_ID: ${programId ? 'SET' : 'MISSING'}`);
      throw new Error("Missing required environment variables!");
    }

    this.executorKeypair = Keypair.fromSecretKey(bs58.decode(privateKey));

    const connection = new Connection(rpcUrl, 'confirmed');

    this.provider = new anchor.AnchorProvider(connection, new anchor.Wallet(this.executorKeypair), { commitment: 'confirmed' });

    this.program = new anchor.Program(
      idl as anchor.Idl,
      this.provider
    );

    this.logger.log(`Anchor program loaded for Program ID: ${programId}`);
  }

  async checkExecutorBalance(): Promise<{ hasEnoughBalance: boolean; balance: number; required: number }> {
    try {
      const balance = await this.provider.connection.getBalance(this.executorKeypair.publicKey);
      const required = 0.01 * LAMPORTS_PER_SOL; // 0.01 SOL minimum for fees and tips

      this.logger.log(`Executor balance: ${balance / LAMPORTS_PER_SOL} SOL, Required: ${required / LAMPORTS_PER_SOL} SOL`);

      return {
        hasEnoughBalance: balance >= required,
        balance: balance / LAMPORTS_PER_SOL,
        required: required / LAMPORTS_PER_SOL
      };
    } catch (error) {
      this.logger.error('Failed to check executor balance:', error);
      return { hasEnoughBalance: false, balance: 0, required: 0.01 };
    }
  }

  async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCall;

    if (timeSinceLastCall < this.minApiDelay) {
      const delay = this.minApiDelay - timeSinceLastCall;
      this.logger.log(`Rate limiting: waiting ${delay}ms before next API call`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this.lastApiCall = Date.now();
  }

  async buildCreateAndExecuteJobTx(jobId: number, result: Buffer): Promise<string> {
    const [jobPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("job"),
        this.executorKeypair.publicKey.toBuffer(),
        new anchor.BN(jobId).toArrayLike(Buffer, "le", 8),
      ],
      this.program.programId
    );

    // Check if job account already exists
    let jobExists = false;
    try {
      await this.program.account.job.fetch(jobPda);
      jobExists = true;
      this.logger.log(`Job account already exists for jobId ${jobId}`);
    } catch (error) {
      // Job doesn't exist yet, we'll create it
      this.logger.log(`Job account doesn't exist yet for jobId ${jobId}, will create it`);
    }

    const latestBlockhash = await this.provider.connection.getLatestBlockhash();
    const tx = new anchor.web3.Transaction();

    // Add create job instruction if job doesn't exist
    if (!jobExists) {
      const createJobIx = await this.program.methods
        .createJob(new anchor.BN(jobId))
        .accounts({
          job: jobPda,
          authority: this.executorKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .instruction();

      tx.add(createJobIx);
      this.logger.log(`Added createJob instruction for jobId ${jobId}`);
    }

    // Add execute job instruction
    const executeJobIx = await this.program.methods
      .executeJob(result)
      .accounts({
        job: jobPda,
        authority: this.executorKeypair.publicKey,
      } as any)
      .instruction();

    tx.add(executeJobIx);
    this.logger.log(`Added executeJob instruction for jobId ${jobId}`);

    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = this.executorKeypair.publicKey;

    // Ensure transaction is properly formatted
    if (!tx.instructions || tx.instructions.length === 0) {
      throw new Error('Transaction has no instructions');
    }

    tx.sign(this.executorKeypair);

    // Validate transaction before serialization
    try {
      const serialized = tx.serialize({ requireAllSignatures: true });
      this.logger.log(`Transaction serialized successfully, size: ${serialized.length} bytes, instructions: ${tx.instructions.length}`);
      // Return base58 format for Jito compatibility
      return bs58.encode(serialized);
    } catch (error) {
      this.logger.error('Failed to serialize transaction:', error);
      throw new Error(`Transaction serialization failed: ${error.message}`);
    }
  }

  // Keep old method name for backward compatibility, but call new implementation
  async buildExecuteJobTx(jobId: number, result: Buffer): Promise<string> {
    return this.buildCreateAndExecuteJobTx(jobId, result);
  }

  async createTipTx(): Promise<string> {
    const latestBlockhash = await this.provider.connection.getLatestBlockhash();

    const tipInstruction = SystemProgram.transfer({
      fromPubkey: this.executorKeypair.publicKey,
      toPubkey: JITO_TIP_ACCOUNT,
      lamports: 100000,
    });

    const tx = new anchor.web3.Transaction().add(tipInstruction);
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = this.executorKeypair.publicKey;

    // Ensure tip transaction is properly formatted
    if (!tx.instructions || tx.instructions.length === 0) {
      throw new Error('Tip transaction has no instructions');
    }

    tx.sign(this.executorKeypair);

    // Validate tip transaction before serialization
    try {
      const serialized = tx.serialize({ requireAllSignatures: true });
      this.logger.log(`Tip transaction serialized successfully, size: ${serialized.length} bytes`);
      // Return base58 format for Jito compatibility
      return bs58.encode(serialized);
    } catch (error) {
      this.logger.error('Failed to serialize tip transaction:', error);
      throw new Error(`Tip transaction serialization failed: ${error.message}`);
    }
  }

  /**
   * Transfer real USDC to user's vault as profit
   */
  async transferUSDCToVault(userWalletAddress: string, usdcAmount: number): Promise<{ success: boolean; signature?: string; error?: string }> {
    try {
      this.logger.log(`Transferring ${usdcAmount} micro USDC to user vault: ${userWalletAddress}`);

      // Get user's vault PDA
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), new PublicKey(userWalletAddress).toBuffer()],
        this.program.programId
      );

      // Get vault's USDC token account
      const [vaultUsdcAta] = PublicKey.findProgramAddressSync(
        [vaultPda.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), USDC_MINT.toBuffer()],
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Get executor's USDC token account (funding source)
      const [executorUsdcAta] = PublicKey.findProgramAddressSync(
        [this.executorKeypair.publicKey.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), USDC_MINT.toBuffer()],
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Check if executor has enough USDC
      try {
        const executorBalance = await this.provider.connection.getTokenAccountBalance(executorUsdcAta);
        const availableUSDC = executorBalance.value.amount;

        if (parseInt(availableUSDC) < usdcAmount) {
          this.logger.warn(`Insufficient USDC balance. Available: ${availableUSDC}, Required: ${usdcAmount}`);
          return { success: false, error: 'Insufficient USDC balance for profit transfer' };
        }
      } catch (error) {
        this.logger.warn(`Could not check executor USDC balance: ${error.message}`);
        return { success: false, error: 'Could not verify executor USDC balance' };
      }

      // Create transfer instruction
      const transferIx = await this.program.methods
        .deposit(new anchor.BN(0), new anchor.BN(usdcAmount))
        .accounts({
          vault: vaultPda,
          owner: this.executorKeypair.publicKey,
          userSolAccount: executorUsdcAta, // Using executor's USDC account as source
          solVault: vaultUsdcAta, // Transfer to vault's USDC account
          userUsdcAccount: executorUsdcAta,
          usdcVault: vaultUsdcAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          solMint: USDC_MINT,
          usdcMint: USDC_MINT,
        } as any)
        .instruction();

      // Build and sign transaction
      const latestBlockhash = await this.provider.connection.getLatestBlockhash();
      const tx = new anchor.web3.Transaction();
      tx.add(transferIx);
      tx.recentBlockhash = latestBlockhash.blockhash;
      tx.feePayer = this.executorKeypair.publicKey;
      tx.sign(this.executorKeypair);

      // Send transaction
      const signature = await this.provider.connection.sendTransaction(tx, [this.executorKeypair], {
        skipPreflight: false,
        maxRetries: 3,
        preflightCommitment: 'confirmed'
      });

      this.logger.log(`✅ USDC profit transfer successful. Signature: ${signature}`);
      this.logger.log(`View on explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`);

      return { success: true, signature };

    } catch (error) {
      this.logger.error('Failed to transfer USDC to vault:', error);
      return { success: false, error: error.message };
    }
  }
}