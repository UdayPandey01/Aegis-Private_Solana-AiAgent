// filename: executor/src/solana/solana.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as anchor from '@coral-xyz/anchor';
import idl from '../idl/onchain_program.json';
import { OnchainProgram } from '../idl/onchain_program';
import { Keypair, Connection, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

@Injectable()
export class SolanaService implements OnModuleInit {
  private readonly logger = new Logger(SolanaService.name);
  private provider: anchor.AnchorProvider;
  private program: anchor.Program<OnchainProgram>;
  private executorKeypair: Keypair;

  constructor() {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'http://127.0.0.1:8899';
    const privateKey = process.env.EXECUTOR_PRIVATE_KEY;

    if (!privateKey) {
      this.logger.error('Missing EXECUTOR_PRIVATE_KEY environment variable!');
      throw new Error('Missing EXECUTOR_PRIVATE_KEY environment variable!');
    }

    this.executorKeypair = Keypair.fromSecretKey(
      new Uint8Array(bs58.decode(privateKey))
    );

    const connection = new Connection(rpcUrl, 'confirmed');
    this.provider = new anchor.AnchorProvider(
      connection,
      new anchor.Wallet(this.executorKeypair),
      { commitment: 'confirmed' }
    );

    // Set the global provider for Anchor
    anchor.setProvider(this.provider);
  }

  async onModuleInit() {
    // const programIdStr = process.env.AEGIS_PROGRAM_ID;
    // if (!programIdStr) {
    //   this.logger.error('Missing AEGIS_PROGRAM_ID environment variable!');
    //   throw new Error('Missing AEGIS_PROGRAM_ID environment variable!');
    // }

    const programId = new PublicKey('D3jAcqXfbzCFWK69m4ysWKEtTowuSFf3b33dAJo3k8DW');

    // Initialize the program correctly
    this.program = new anchor.Program<OnchainProgram>(
  idl as anchor.Idl,
  this.provider
);


    this.logger.log(`Anchor program loaded: ${programId.toBase58()}`);
  }

  async buildExecuteJobTx(jobId: number, result: Buffer): Promise<string> {
    if (!this.program) {
      throw new Error('Anchor Program not initialized yet!');
    }

    const [jobPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('job'),
        this.executorKeypair.publicKey.toBuffer(),
        new anchor.BN(jobId).toArrayLike(Buffer, 'le', 8),
      ],
      this.program.programId
    );

    const tx = await this.program.methods
      .executeJob(result)
      .accounts({
        job: jobPda,
        authority: this.executorKeypair.publicKey,
      })
      .transaction();

    const latestBlockhash = await this.provider.connection.getLatestBlockhash();
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = this.executorKeypair.publicKey;
    tx.sign(this.executorKeypair);

    return tx.serialize({ requireAllSignatures: false }).toString('base64');
  }
}
