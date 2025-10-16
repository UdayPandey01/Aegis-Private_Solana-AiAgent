import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import idl from '../../executor/src/idl/onchain_program.json';
import { OnchainProgram } from '../../onchain-program/target/types/onchain_program';
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as os from "os";
import * as fs from "fs";

const SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
const USDC_MINT = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");

async function main() {
    try {
        const walletPath = `${os.homedir()}/.config/solana/id.json`;
        if (!fs.existsSync(walletPath)) throw new Error("Wallet not found at ~/.config/solana/id.json");
        const keypair = Keypair.fromSecretKey(
            new Uint8Array(JSON.parse(fs.readFileSync(walletPath, "utf8")))
        );

        const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");
        const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(keypair), { commitment: "confirmed" });

        const programIdStr = process.env.AEGIS_PROGRAM_ID;
        if (!programIdStr) throw new Error("Please set AEGIS_PROGRAM_ID in your environment variables.");
        // const programId = new PublicKey(programIdStr);
        const program = new anchor.Program<OnchainProgram>(idl as any, provider);


        const [vaultPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("vault"), keypair.publicKey.toBuffer()],
            program.programId
        );

        // Correct ATA calculation using findProgramAddress
        const solVaultAta = (await PublicKey.findProgramAddress(
            [vaultPda.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), SOL_MINT.toBuffer()],
            ASSOCIATED_TOKEN_PROGRAM_ID
        ))[0];

        const usdcVaultAta = (await PublicKey.findProgramAddress(
            [vaultPda.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), USDC_MINT.toBuffer()],
            ASSOCIATED_TOKEN_PROGRAM_ID
        ))[0];

        console.log(`User Wallet: ${keypair.publicKey.toBase58()}`);
        console.log(`Vault PDA: ${vaultPda.toBase58()}`);
        console.log(`SOL Vault ATA: ${solVaultAta.toBase58()}`);
        console.log(`USDC Vault ATA: ${usdcVaultAta.toBase58()}`);
        console.log("Initializing vault...");

        const tx = await program.methods
            .initializeVault()
            .accounts({
                vault: vaultPda,
                solMint: SOL_MINT,
                usdcMint: USDC_MINT,
                solVault: solVaultAta,
                usdcVault: usdcVaultAta,
                user: keypair.publicKey,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY
            } as any)
            .rpc();

        console.log(" Vault initialized successfully!");
        console.log(`Transaction signature: ${tx}`);
        console.log(`View on Solana Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    } catch (err) {
        console.error(" Error initializing vault:", err);
        process.exit(1);
    }
}

main();
