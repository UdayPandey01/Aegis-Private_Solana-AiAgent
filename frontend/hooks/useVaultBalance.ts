import { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { NATIVE_MINT } from "@solana/spl-token";
import idl from "../src/idl/onchain_program.json";
import type { OnchainProgram } from "../src/types/onchain_program";

const USDC_MINT = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");

export interface VaultBalance {
    solBalance: number;
    usdcBalance: number;
    totalValueUSD: number;
    vaultExists: boolean;
}

export const useVaultBalance = () => {
    const { connection } = useConnection();
    const wallet = useWallet();
    const { publicKey } = wallet;
    const [balance, setBalance] = useState<VaultBalance>({
        solBalance: 0,
        usdcBalance: 0,
        totalValueUSD: 0,
        vaultExists: false,
    });
    const [isLoading, setIsLoading] = useState(false);

    const program = useCallback(() => {
        if (wallet.publicKey) {
            const provider = new anchor.AnchorProvider(connection, wallet as any, { commitment: "confirmed" });
            return new Program<OnchainProgram>(idl as any, provider);
        }
        return null;
    }, [connection, wallet]);

    const fetchVaultBalance = useCallback(async () => {
        if (!program() || !publicKey) {
            setBalance({
                solBalance: 0,
                usdcBalance: 0,
                totalValueUSD: 0,
                vaultExists: false,
            });
            return;
        }

        setIsLoading(true);
        try {
            const [vaultPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("vault"), publicKey.toBuffer()],
                program()!.programId
            );

            const vaultAccount = await program()!.account.tradingVault.fetch(vaultPda);

            const solVaultTokenAccount = await connection.getTokenAccountBalance(vaultAccount.solVault);
            const usdcVaultTokenAccount = await connection.getTokenAccountBalance(vaultAccount.usdcVault);

            const solBalance = solVaultTokenAccount.value.uiAmount || 0;
            const usdcBalance = usdcVaultTokenAccount.value.uiAmount || 0;

            // Calculate total value in USD (using hardcoded SOL price of $150)
            const solPriceUSD = 150;
            const totalValueUSD = (solBalance * solPriceUSD) + usdcBalance;

            setBalance({
                solBalance,
                usdcBalance,
                totalValueUSD,
                vaultExists: true,
            });
        } catch (error) {
            console.log("Vault not initialized yet or failed to fetch balance:", error);
            setBalance({
                solBalance: 0,
                usdcBalance: 0,
                totalValueUSD: 0,
                vaultExists: false,
            });
        } finally {
            setIsLoading(false);
        }
    }, [program, publicKey, connection]);

    useEffect(() => {
        fetchVaultBalance();
    }, [fetchVaultBalance]);

    return {
        balance,
        isLoading,
        refetch: fetchVaultBalance,
    };
};
