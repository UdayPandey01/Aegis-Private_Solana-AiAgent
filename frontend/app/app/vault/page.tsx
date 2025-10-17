"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, ArrowLeft, ArrowDownToLine, ArrowUpFromLine, Wallet } from "lucide-react"
import Link from "next/link"

import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import * as anchor from "@coral-xyz/anchor"
import { Program } from "@coral-xyz/anchor"
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js"
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, createSyncNativeInstruction, NATIVE_MINT } from "@solana/spl-token"
import idl from "../../../src/idl/onchain_program.json";
import type { OnchainProgram } from "../../../src/types/onchain_program";

const SOL_MINT = NATIVE_MINT; // This is the wrapped SOL mint address
const USDC_MINT = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");

export default function VaultPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, signTransaction } = wallet;
  const [solBalance, setSolBalance] = useState(0);
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [vaultExists, setVaultExists] = useState(false);

  const program = useMemo(() => {
    if (wallet.publicKey) {
      const provider = new anchor.AnchorProvider(connection, wallet as any, { commitment: "confirmed" });
      return new Program<OnchainProgram>(idl as any, provider);
    }
    return null;
  }, [connection, wallet]);

  const fetchVaultBalance = useCallback(async () => {
    if (!program || !publicKey) return;
    try {
      const [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), publicKey.toBuffer()],
        program.programId
      );
      const vaultAccount = await program.account.tradingVault.fetch(vaultPda);

      const solVaultTokenAccount = await connection.getTokenAccountBalance(vaultAccount.solVault);
      const usdcVaultTokenAccount = await connection.getTokenAccountBalance(vaultAccount.usdcVault);

      setSolBalance(solVaultTokenAccount.value.uiAmount || 0);
      setUsdcBalance(usdcVaultTokenAccount.value.uiAmount || 0);
      setVaultExists(true);
    } catch (error) {
      console.log("Vault not initialized yet or failed to fetch balance:", error);
      setVaultExists(false);
    } finally {
      setIsLoading(false);
    }
  }, [program, publicKey, connection]);

  useEffect(() => {
    fetchVaultBalance();
  }, [program, publicKey, fetchVaultBalance]);

  const handleInitializeVault = async () => {
    if (!program || !publicKey) return;
    setIsLoading(true);

    const [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), publicKey.toBuffer()],
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

    try {
      const tx = await program.methods
        .initializeVault()
        .accounts({
          vault: vaultPda,
          solMint: SOL_MINT,
          usdcMint: USDC_MINT,
          solVault: solVaultAta,
          usdcVault: usdcVaultAta,
          user: publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY
        } as any)
        .rpc({
          skipPreflight: false,
          commitment: "confirmed",
          maxRetries: 3,
          preflightCommitment: "confirmed"
        });

      console.log("Vault initialized successfully!", `https://explorer.solana.com/tx/${tx}?cluster=devnet`);
      alert("Vault created! It may take a moment for the balance to update.");
      setTimeout(fetchVaultBalance, 3000);
    } catch (error) {
      console.error("Failed to initialize vault:", error);

      if (error.message?.includes("TransactionExpiredTimeoutError")) {
        alert("Transaction timed out but may have succeeded. Please refresh the page and check if your vault was created. If not, try again.");
      } else if (error.message?.includes("already in use")) {
        alert("Vault already exists! Please refresh the page.");
      } else {
        alert(`Failed to create vault: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!program || !publicKey || parseFloat(depositAmount) <= 0) return;
    setIsLoading(true);

    try {
      const amountToDeposit = parseFloat(depositAmount) * Math.pow(10, 9);
      console.log("Amount to deposit:", amountToDeposit)

      // Check native balance first
      const nativeBalance = await connection.getBalance(publicKey);
      console.log("Native SOL balance:", nativeBalance / 1e9);

      // Reserve some SOL for transaction fees (about 0.01 SOL)
      const feeReserve = 0.01 * Math.pow(10, 9); // 0.01 SOL in lamports
      const maxDepositAmount = Math.floor((nativeBalance - feeReserve) * 0.99); // Leave some buffer

      console.log("Fee reserve:", feeReserve);
      console.log("Max deposit amount considering fees:", maxDepositAmount);

      if (amountToDeposit > maxDepositAmount) {
        throw new Error(`Insufficient SOL balance. You need at least ${(amountToDeposit + feeReserve) / 1e9} SOL (including fees) but only have ${nativeBalance / 1e9} SOL.`);
      }

      const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vault"), publicKey.toBuffer()], program.programId);
      const vaultAccount = await program.account.tradingVault.fetch(vaultPda);
      console.log("Vault account:", vaultAccount)

      const userSolAta = await getAssociatedTokenAddress(SOL_MINT, publicKey);
      console.log("User SOL ATA:", userSolAta.toString())
      const userUsdcAta = await getAssociatedTokenAddress(USDC_MINT, publicKey);
      console.log("User USDC ATA:", userUsdcAta.toString())

      // Check if token accounts exist
      const userSolAtaInfo = await connection.getAccountInfo(userSolAta);
      const userUsdcAtaInfo = await connection.getAccountInfo(userUsdcAta);

      console.log("User SOL ATA exists:", userSolAtaInfo !== null);
      console.log("User USDC ATA exists:", userUsdcAtaInfo !== null);

      // Create token accounts if they don't exist
      const instructions = [];
      if (userSolAtaInfo === null) {
        console.log("Creating SOL token account...");
        instructions.push(
          createAssociatedTokenAccountInstruction(
            publicKey, // Payer
            userSolAta,  // ATA address to create
            publicKey, // Owner of the ATA
            SOL_MINT     // Mint of the token
          )
        );
      }

      if (userUsdcAtaInfo === null) {
        console.log("Creating USDC token account...");
        instructions.push(
          createAssociatedTokenAccountInstruction(
            publicKey, // payer
            userUsdcAta, // ATA to create
            publicKey, // owner
            USDC_MINT // mint
          )
        );
      }

      // If we need to create token accounts, send a separate transaction first
      if (instructions.length > 0) {
        console.log("Sending token account creation transaction...");
        const createTx = new Transaction();
        createTx.add(...instructions);

        // Get recent blockhash and set fee payer
        const { blockhash } = await connection.getLatestBlockhash();
        createTx.recentBlockhash = blockhash;
        createTx.feePayer = publicKey;

        // Use the wallet adapter's sendTransaction method
        const createTxSig = await wallet.sendTransaction(createTx, connection);

        console.log("Token account creation TX:", `https://explorer.solana.com/tx/${createTxSig}?cluster=devnet`);

        // Wait for confirmation with better timeout handling
        let tokenAccountsCreated = false;
        try {
          await connection.confirmTransaction(createTxSig, "confirmed");
          console.log("Token accounts created successfully");
          tokenAccountsCreated = true;
        } catch (confirmationError) {
          console.log("Transaction confirmation timed out, but transaction was sent. Checking if it succeeded...");

          // Check if the transaction actually succeeded by polling
          let attempts = 0;
          const maxAttempts = 10;
          let confirmed = false;

          while (attempts < maxAttempts && !confirmed) {
            try {
              const status = await connection.getSignatureStatus(createTxSig);
              if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
                if (status.value.err) {
                  throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
                }
                confirmed = true;
                console.log("Token accounts created successfully (verified via polling)");
                tokenAccountsCreated = true;
                break;
              }
            } catch (pollError) {
              console.log(`Polling attempt ${attempts + 1} failed:`, pollError);
            }

            attempts++;
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between attempts
          }

          if (!confirmed) {
            throw new Error("Token account creation transaction confirmation timed out. Please check the transaction status manually.");
          }
        }

        // Verify token accounts were actually created by checking their existence
        if (tokenAccountsCreated) {
          console.log("Verifying token accounts were created...");
          const userSolAtaInfoAfter = await connection.getAccountInfo(userSolAta);
          const userUsdcAtaInfoAfter = await connection.getAccountInfo(userUsdcAta);

          console.log("User SOL ATA exists after creation:", userSolAtaInfoAfter !== null);
          console.log("User USDC ATA exists after creation:", userUsdcAtaInfoAfter !== null);

          if (!userSolAtaInfoAfter || !userUsdcAtaInfoAfter) {
            throw new Error("Token accounts were not created successfully. Please try again.");
          }
        }
      }

      // Wrap SOL to WSOL if needed
      console.log("Checking SOL balance and wrapping if needed...");
      const userSolTokenBalance = await connection.getTokenAccountBalance(userSolAta);

      console.log("Native SOL balance:", nativeBalance / 1e9);
      console.log("WSOL token balance:", userSolTokenBalance.value.uiAmount || 0);

      // If user has native SOL but insufficient WSOL, we need to wrap it
      // Check if we need to wrap more SOL to have enough WSOL for the deposit
      const currentWSOLBalance = userSolTokenBalance.value.uiAmount || 0;
      const neededWSOL = amountToDeposit / 1e9;

      if (currentWSOLBalance < neededWSOL) {
        const additionalSOLNeeded = (neededWSOL - currentWSOLBalance) * 1e9;

        // Check if user has enough native SOL for wrapping
        if (nativeBalance < additionalSOLNeeded + feeReserve) {
          throw new Error(`Insufficient SOL balance. Need ${additionalSOLNeeded / 1e9} SOL to wrap plus ${feeReserve / 1e9} SOL for fees, but only have ${nativeBalance / 1e9} SOL.`);
        }
        console.log("Wrapping SOL to WSOL...");

        const wrapInstructions = [];

        // Transfer native SOL to the WSOL token account (only what's needed)
        wrapInstructions.push(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: userSolAta,
            lamports: additionalSOLNeeded,
          })
        );

        // Sync the native account to update the token account balance
        wrapInstructions.push(createSyncNativeInstruction(userSolAta));

        const wrapTx = new Transaction();
        wrapTx.add(...wrapInstructions);

        const { blockhash: wrapBlockhash } = await connection.getLatestBlockhash();
        wrapTx.recentBlockhash = wrapBlockhash;
        wrapTx.feePayer = publicKey;

        const wrapTxSig = await wallet.sendTransaction(wrapTx, connection);
        console.log("SOL wrapping TX:", `https://explorer.solana.com/tx/${wrapTxSig}?cluster=devnet`);

        // Wait for wrapping to complete with robust confirmation
        let solWrapped = false;
        try {
          await connection.confirmTransaction(wrapTxSig, "confirmed");
          console.log("SOL wrapped successfully");
          solWrapped = true;
        } catch (wrapConfirmationError) {
          console.log("SOL wrapping confirmation timed out, checking status...");

          // Poll for confirmation
          let attempts = 0;
          const maxAttempts = 10;
          let confirmed = false;

          while (attempts < maxAttempts && !confirmed) {
            try {
              const status = await connection.getSignatureStatus(wrapTxSig);
              if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
                if (status.value.err) {
                  throw new Error(`SOL wrapping transaction failed: ${JSON.stringify(status.value.err)}`);
                }
                confirmed = true;
                console.log("SOL wrapped successfully (verified via polling)");
                solWrapped = true;
                break;
              }
            } catch (pollError) {
              console.log(`SOL wrapping polling attempt ${attempts + 1} failed:`, pollError);
            }

            attempts++;
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

          if (!confirmed) {
            throw new Error("SOL wrapping transaction confirmation timed out. Please check the transaction status manually.");
          }
        }

        // Verify the wrapping was successful by checking the token balance
        if (solWrapped) {
          console.log("Verifying SOL was wrapped successfully...");
          const updatedTokenBalance = await connection.getTokenAccountBalance(userSolAta);
          console.log("Updated WSOL balance:", updatedTokenBalance.value.uiAmount || 0);

          const finalWSOLBalance = updatedTokenBalance.value.uiAmount || 0;
          if (finalWSOLBalance < neededWSOL) {
            throw new Error(`SOL wrapping verification failed. Have ${finalWSOLBalance} WSOL but need ${neededWSOL} WSOL for deposit.`);
          }
        }
      }

      // Now perform the deposit
      console.log("Performing deposit...");

      // Build the transaction without sending it
      const depositTx = await program.methods
        .deposit(new anchor.BN(amountToDeposit), new anchor.BN(0))
        .accounts({
          vault: vaultPda,
          owner: publicKey,
          userSolAccount: userSolAta,
          solVault: vaultAccount.solVault,
          userUsdcAccount: userUsdcAta,
          usdcVault: vaultAccount.usdcVault,
          solMint: SOL_MINT,
          usdcMint: USDC_MINT,
          tokenProgram: TOKEN_PROGRAM_ID,
        } as any)
        .transaction();

      // Simulate the transaction first to catch any errors
      console.log("Simulating deposit transaction...");
      const simulation = await connection.simulateTransaction(depositTx);

      if (simulation.value.err) {
        throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
      }

      console.log("Transaction simulation successful, sending transaction...");

      // Send the transaction using wallet adapter
      const txSig = await wallet.sendTransaction(depositTx, connection);
      console.log("Deposit TX:", `https://explorer.solana.com/tx/${txSig}?cluster=devnet`);

      // Confirm the deposit transaction with robust error handling
      let depositSuccessful = false;
      try {
        await connection.confirmTransaction(txSig, "confirmed");
        console.log("Deposit confirmed successfully!");
        alert("Deposit successful!");
        depositSuccessful = true;
      } catch (depositConfirmationError) {
        console.log("Deposit confirmation timed out, checking status via polling...");

        // Poll for confirmation
        let attempts = 0;
        const maxAttempts = 15; // Give more attempts for the main deposit
        let confirmed = false;

        while (attempts < maxAttempts && !confirmed) {
          try {
            const status = await connection.getSignatureStatus(txSig);
            if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
              if (status.value.err) {
                throw new Error(`Deposit transaction failed: ${JSON.stringify(status.value.err)}`);
              }
              confirmed = true;
              console.log("Deposit confirmed successfully via polling!");
              alert("Deposit successful! (verified via polling)");
              depositSuccessful = true;
              break;
            }
          } catch (pollError) {
            console.log(`Deposit polling attempt ${attempts + 1} failed:`, pollError);
          }

          attempts++;
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        if (!confirmed) {
          throw new Error("Deposit transaction confirmation timed out. Please check the transaction status manually.");
        }
      }

      // Refresh vault balance after successful deposit
      if (depositSuccessful) {
        console.log("Refreshing vault balance...");
        fetchVaultBalance();
      }
    } catch (error) {
      console.error("Failed to deposit:", error);
      alert("Deposit failed. Check the console for details.");
    } finally {
      setIsLoading(false);
      setDepositAmount("");
    }
  };

  const handleWithdraw = async () => {
    if (!program || !publicKey || parseFloat(withdrawAmount) <= 0) return;
    setIsLoading(true);

    try {
      const amountToWithdraw = parseFloat(withdrawAmount) * Math.pow(10, 9); // Convert SOL to lamports

      const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from("vault"), publicKey.toBuffer()], program.programId);
      const vaultAccount = await program.account.tradingVault.fetch(vaultPda);

      const userSolAta = await getAssociatedTokenAddress(SOL_MINT, publicKey);
      const userUsdcAta = await getAssociatedTokenAddress(USDC_MINT, publicKey);

      const tx = await program.methods
        .withdraw(new anchor.BN(amountToWithdraw), new anchor.BN(0))
        .accounts({
          vault: vaultPda,
          userSolAccount: userSolAta,
          userUsdcAccount: userUsdcAta,
          solVault: vaultAccount.solVault,
          usdcVault: vaultAccount.usdcVault,
          owner: publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          solMint: SOL_MINT,
          usdcMint: USDC_MINT,
        } as any)
        .rpc();

      await connection.confirmTransaction(tx, 'confirmed');
      alert("Withdrawal successful!");
      fetchVaultBalance();
    } catch (error) {
      console.error("Failed to withdraw:", error);
      alert("Withdrawal failed. Check the console for details.");
    } finally {
      setIsLoading(false);
      setWithdrawAmount("");
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-50">
      <header className="sticky top-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 h-16 items-center">
            <div className="justify-self-start">
              <Link href="/app/dashboard" className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="h-5 w-5" />
                <span className="font-sans hidden sm:inline">Back to Dashboard</span>
              </Link>
            </div>
            <div className="justify-self-center">
              <Link href="/" className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-white" />
                <span className="font-heading text-xl font-bold text-white">
                  AEGIS
                </span>
              </Link>
            </div>
            <div className="justify-self-end" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-2 text-slate-50">Vault</h1>
          <p className="font-sans text-slate-400">Securely deposit and withdraw funds for your agents.</p>
        </motion.div>

        {!publicKey ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold">Please connect your wallet to continue.</h2>
          </div>
        ) : isLoading ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold">Loading Vault...</h2>
          </div>
        ) : !vaultExists ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Create Your Secure Trading Vault</h2>
            <p className="text-slate-400 mb-6">A one-time setup is required to create your personal, non-custodial vault on Solana.</p>
            <Button onClick={handleInitializeVault} disabled={isLoading} className="bg-white text-black hover:bg-slate-200">
              {isLoading ? "Processing..." : "Initialize My Trading Vault"}
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard title="SOL Balance" value={`${solBalance.toFixed(4)} SOL`} description="In Vault" delay={0.1} />
              <StatCard title="USDC Balance" value={`${usdcBalance.toFixed(2)} USDC`} description="In Vault" delay={0.2} />
              <StatCard title="Total Value" value={`$${(solBalance * 150 + usdcBalance).toFixed(2)}`} description="Estimated" delay={0.3} />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-neutral-900 border border-white/10 rounded-2xl max-w-2xl mx-auto"
            >
              <Tabs defaultValue="deposit" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-black/30 rounded-t-xl rounded-b-none h-14 p-1">
                  <TabsTrigger value="deposit">Deposit</TabsTrigger>
                  <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
                </TabsList>
                <div className="p-8">
                  <TabsContent value="deposit">
                    <VaultActionForm action="Deposit" amount={depositAmount} setAmount={setDepositAmount} maxAmount={"0"} icon={ArrowDownToLine} onAction={handleDeposit} isLoading={isLoading} />
                  </TabsContent>
                  <TabsContent value="withdraw">
                    <VaultActionForm action="Withdraw" amount={withdrawAmount} setAmount={setWithdrawAmount} maxAmount={solBalance.toString()} icon={ArrowUpFromLine} onAction={handleWithdraw} isLoading={isLoading} />
                  </TabsContent>
                </div>
              </Tabs>
            </motion.div>
          </>
        )}
      </main>
    </div>
  )
}
const StatCard = ({ title, value, description, delay }: { title: string; value: string; description: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
  >
    <Card className="bg-neutral-900 border-white/10">
      <CardHeader>
        <CardTitle className="font-sans text-sm font-medium text-slate-400 flex items-center justify-between">
          {title} <Wallet className="h-4 w-4 text-slate-500" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="font-heading text-3xl font-bold text-slate-50">{value}</div>
        <p className="font-sans text-xs text-slate-500">{description}</p>
      </CardContent>
    </Card>
  </motion.div>
);

const VaultActionForm = ({ action, amount, setAmount, maxAmount, icon: Icon, onAction, isLoading }: {
  action: string;
  amount: string;
  setAmount: (value: string) => void;
  maxAmount: string;
  icon: any;
  onAction: () => void;
  isLoading: boolean
}) => (
  <>
    <div className="flex items-center justify-center">
      <div className="p-4 rounded-full bg-neutral-800 border border-white/10">
        <Icon className="h-8 w-8 text-white" />
      </div>
    </div>
    <div className="space-y-2 font-sans">
      <Label htmlFor={`${action.toLowerCase()}-amount`}>Amount (SOL)</Label>
      <Input
        id={`${action.toLowerCase()}-amount`}
        type="number"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="bg-neutral-800 border-white/10 text-lg h-12"
      />
    </div>
    <div className="flex flex-wrap gap-2 font-sans">
      <Button variant="outline" size="sm" onClick={() => setAmount("1")} className="bg-transparent border-white/20 hover:bg-white/10">1 SOL</Button>
      <Button variant="outline" size="sm" onClick={() => setAmount("5")} className="bg-transparent border-white/20 hover:bg-white/10">5 SOL</Button>
      <Button variant="outline" size="sm" onClick={() => setAmount("10")} className="bg-transparent border-white/20 hover:bg-white/10">10 SOL</Button>
      <Button variant="outline" size="sm" onClick={() => setAmount(maxAmount)} className="bg-transparent border-white/20 hover:bg-white/10">Max</Button>
    </div>
    <Button
      onClick={onAction}
      disabled={!amount || parseFloat(amount) <= 0}
      className="w-full bg-white text-black hover:bg-slate-200 h-12 font-sans"
      size="lg"
    >
      {action} to Vault
    </Button>
  </>
);