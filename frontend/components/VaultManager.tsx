// filename: frontend/components/VaultManager.tsx
"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import idl from "../src/idl/onchain_program.json"
import type { OnchainProgram } from "../src/types/onchain_program";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { Button } from "@/components/ui/button";
import * as fs from "fs";
import * as os from "os";

const SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
const USDC_MINT = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");
// const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_AEGIS_PROGRAM_ID!);

const walletPath = `${os.homedir()}/.config/solana/id.json`;
const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(walletPath, "utf8")));
const keypair = Keypair.fromSecretKey(secretKey);

export const VaultManager = () => {
    const { connection } = useConnection();
    const wallet = useWallet();

    const initializeVault = async () => {
        if (!wallet.publicKey || !wallet.signTransaction) return;

        const provider = new anchor.AnchorProvider(
            connection,
            new anchor.Wallet(keypair),
            { commitment: "confirmed" }
        );

        const program = new anchor.Program<OnchainProgram>(idl as any, provider);

        const [vaultPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("vault"), wallet.publicKey.toBuffer()],
            program.programId
        );

        const solVaultAta = await getAssociatedTokenAddress(SOL_MINT, vaultPda, true);
        const usdcVaultAta = await getAssociatedTokenAddress(USDC_MINT, vaultPda, true);

        try {
            const tx = await program.methods
                .initializeVault()
                .accounts({
                    vault: vaultPda,
                    solMint: SOL_MINT,
                    usdcMint: USDC_MINT,
                    solVault: solVaultAta,
                    usdcVault: usdcVaultAta,
                    user: wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY
                } as any)
                .rpc();

            console.log("Vault initialized successfully!", `https://explorer.solana.com/tx/${tx}?cluster=devnet`);
            alert("Vault created! Check the console for the transaction link.");
        } catch (error) {
            console.error("Failed to initialize vault:", error);
            alert("Failed to create vault. Check the console for errors.");
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Manage Your Aegis Vault</h2>
            <Button onClick={initializeVault} disabled={!wallet.publicKey}>
                Create My Trading Vault
            </Button>
        </div>
    );
};