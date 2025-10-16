// filename: frontend/components/VaultManager.tsx
"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import idl from "../src/idl/onchain_program.json"
import type { OnchainProgram } from "../src/types/onchain_program";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Button } from "@/components/ui/button";

const SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
const USDC_MINT = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");

export const VaultManager = () => {
    const { connection } = useConnection();
    const wallet = useWallet();
    const [isLoading, setIsLoading] = useState(false);

    const initializeVault = async () => {
        if (!wallet.publicKey || !wallet.signTransaction) {
            alert("Please connect your wallet first.");
            return;
        }

        setIsLoading(true);

        try {
            const provider = new anchor.AnchorProvider(
                connection,
                wallet as any,
                { commitment: "confirmed" }
            );

            const program = new anchor.Program<OnchainProgram>(idl as any, provider);

            const [vaultPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("vault"), wallet.publicKey.toBuffer()],
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

            console.log("Initializing vault for user:", wallet.publicKey.toBase58());
            console.log("Vault PDA:", vaultPda.toBase58());

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
                .rpc({ skipPreflight: false, commitment: "finalized" });

            console.log("Vault initialized successfully!", `https://explorer.solana.com/tx/${tx}?cluster=devnet`);
            alert("Vault created successfully! Check the console for the transaction link.");
        } catch (error) {
            console.error("Failed to initialize vault:", error);
            alert(`Failed to create vault: ${error.message || "Unknown error"}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Manage Your Aegis Vault</h2>
            <Button
                onClick={initializeVault}
                disabled={!wallet.publicKey || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
            >
                {isLoading ? "Creating Vault..." : "Create My Trading Vault"}
            </Button>
            {!wallet.publicKey && (
                <p className="text-sm text-gray-500 mt-2">
                    Please connect your wallet to create a vault.
                </p>
            )}
        </div>
    );
};