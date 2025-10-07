"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Plus, Wallet, TrendingUp, Activity } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const [walletAddress] = useState("7xKX...9mP2")

  return (
    <div className="min-h-screen bg-black text-slate-50">
      <header className="sticky top-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-white" />
              <span className="font-heading text-xl font-bold text-white">
                AEGIS
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-md bg-neutral-900 border border-white/10">
                <Wallet className="h-4 w-4 text-white" />
                <span className="font-sans text-sm text-slate-300">{walletAddress}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="font-heading text-4xl font-bold mb-2 text-slate-50">Dashboard</h1>
          <p className="font-sans text-slate-400">Manage your autonomous trading agents.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Balance"
            value="$12,450.00"
            description="SOL: 52.3 | USDC: 8,234"
            icon={Wallet}
            delay={0.1}
          />
          <StatCard
            title="Total P/L"
            value="+$1,234.56"
            description="+10.4% this week"
            icon={TrendingUp}
            delay={0.2}
          />
          <StatCard
            title="Active Agents"
            value="0"
            description="No agents running"
            icon={Activity}
            delay={0.3}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="bg-neutral-900 border border-white/10 rounded-2xl">
            <div className="p-6 flex flex-row items-center justify-between">
              <h2 className="font-heading text-xl font-bold text-slate-50">My Active Agents</h2>
              <Button asChild variant="outline" className="font-sans bg-transparent border-white/20 hover:bg-white/10 hover:text-white">
                <Link href="/app/marketplace">
                  <Plus className="h-4 w-4 mr-2" />
                  Launch New Agent
                </Link>
              </Button>
            </div>
            <div className="p-6 border-t border-white/10">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="inline-flex p-5 rounded-full bg-black/50 border border-white/10 mb-6">
                  <Shield className="h-10 w-10 text-white" />
                </div>
                <h3 className="font-heading text-xl font-bold mb-2 text-slate-50">No Active Agents</h3>
                <p className="font-sans text-slate-400 mb-6 max-w-sm">
                  You haven't launched any trading agents yet. Explore our marketplace to find the perfect strategy.
                </p>
                <Button asChild size="lg" className="font-sans bg-white text-black hover:bg-slate-200">
                  <Link href="/app/marketplace">Browse Agent Templates</Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

const StatCard = ({ title, value, description, icon: Icon, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
  >
    <Card className="bg-neutral-900 border-white/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-sans text-sm font-medium text-slate-400">{title}</CardTitle>
        <Icon className="h-4 w-4 text-slate-400" />
      </CardHeader>
      <CardContent>
        <div className="font-heading text-2xl font-bold text-slate-50">{value}</div>
        <p className="font-sans text-xs text-slate-500">{description}</p>
      </CardContent>
    </Card>
  </motion.div>
);