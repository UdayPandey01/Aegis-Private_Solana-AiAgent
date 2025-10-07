// app/vault/page.tsx
"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, ArrowLeft, ArrowDownToLine, ArrowUpFromLine, Wallet } from "lucide-react"
import Link from "next/link"

export default function VaultPage() {
  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")

  const handleDeposit = () => {
    alert(`Depositing ${depositAmount} SOL...`)
  }

  const handleWithdraw = () => {
    alert(`Withdrawing ${withdrawAmount} SOL...`)
  }

  return (
    <div className="min-h-screen bg-black text-slate-50">
      {/* UPDATED: Header to match the theme */}
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

        {/* UPDATED: Stat cards now have a consistent theme */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <StatCard title="SOL Balance" value="52.3 SOL" description="≈ $4,215.00" delay={0.1} />
           <StatCard title="USDC Balance" value="8,234 USDC" description="Stablecoin" delay={0.2} />
           <StatCard title="Total Value" value="$12,450.00" description="Combined balance" delay={0.3} />
        </div>

        {/* UPDATED: Main card styling for deposit/withdraw */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-neutral-900 border border-white/10 rounded-2xl max-w-2xl mx-auto"
        >
          <Tabs defaultValue="deposit" className="w-full">
            {/* UPDATED: Tabs styling */}
            <TabsList className="grid w-full grid-cols-2 bg-black/30 rounded-t-xl rounded-b-none h-14 p-1">
              <TabsTrigger value="deposit" className="font-sans rounded-lg data-[state=active]:bg-neutral-800 data-[state=active]:text-white">Deposit</TabsTrigger>
              <TabsTrigger value="withdraw" className="font-sans rounded-lg data-[state=active]:bg-neutral-800 data-[state=active]:text-white">Withdraw</TabsTrigger>
            </TabsList>
            <div className="p-8">
              <TabsContent value="deposit" className="space-y-6 mt-0">
                <VaultActionForm
                  action="Deposit"
                  amount={depositAmount}
                  setAmount={setDepositAmount}
                  maxAmount="52.3"
                  icon={ArrowDownToLine}
                  onAction={handleDeposit}
                />
              </TabsContent>
              <TabsContent value="withdraw" className="space-y-6 mt-0">
                <VaultActionForm
                  action="Withdraw"
                  amount={withdrawAmount}
                  setAmount={setWithdrawAmount}
                  maxAmount="52.3"
                  icon={ArrowUpFromLine}
                  onAction={handleWithdraw}
                />
              </TabsContent>
            </div>
          </Tabs>
        </motion.div>
      </main>
    </div>
  )
}

// Reusable StatCard component for consistency
const StatCard = ({ title, value, description, delay }) => (
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

// NEW: Reusable form for Deposit/Withdraw tabs to reduce code duplication
const VaultActionForm = ({ action, amount, setAmount, maxAmount, icon: Icon, onAction }) => (
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