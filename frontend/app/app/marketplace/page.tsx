"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, ArrowUpDown, TrendingUp, DollarSign, Target, Zap, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const templates = [
  { icon: ArrowUpDown, title: "Cross-DEX Arbitrage", description: "Exploit price differences across Solana DEXs instantly and privately.", features: ["Multi-DEX scanning", "Gas optimization", "MEV protection"]},
  { icon: Shield, title: "Stop-Loss Executor", description: "Automated position protection that executes without revealing your targets.", features: ["Private triggers", "Zero slippage", "Instant execution"]},
  { icon: TrendingUp, title: "Trend Follower", description: "Detect and capitalize on market trends with confidential signal processing.", features: ["AI-powered signals", "Dynamic sizing", "Risk management"]},
  { icon: DollarSign, title: "Yield Optimizer", description: "Automatically rebalance across lending protocols for maximum returns.", features: ["Auto-compound", "Gas-efficient", "Multi-protocol"]},
  { icon: Target, title: "Limit Order Bot", description: "Execute trades at your target prices without exposing your strategy.", features: ["Private orders", "No front-running", "Instant fills"]},
  { icon: Zap, title: "Flash Loan Executor", description: "Complex multi-step transactions executed atomically and privately.", features: ["Zero capital needed", "Risk-free execution", "Unlimited strategies"]},
];

export default function MarketplacePage() {
  const [selectedTemplate, setSelectedTemplate] = useState<(typeof templates)[0] | null>(null)
  const router = useRouter()

  const handleLaunchAgent = () => {
    router.push("/app/agent/demo")
  }

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

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-2 text-slate-50">Agent Marketplace</h1>
          <p className="font-sans text-slate-400 max-w-2xl mx-auto">Choose a template to launch your autonomous trading agent.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {templates.map((template, index) => (
            <motion.div
              key={template.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="bg-neutral-900 border border-white/10 rounded-2xl h-full p-8 flex flex-col transition-colors hover:border-white/20"
            >
              <div>
                <div className="inline-flex p-3 rounded-lg bg-black/50 border border-white/10 mb-4">
                  <template.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-heading text-xl font-bold text-slate-50">{template.title}</h3>
                <p className="font-sans text-sm text-slate-400 mt-1 leading-relaxed">
                  {template.description}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2 my-6">
                {template.features.map((feature) => (
                  <span key={feature} className="font-sans text-xs text-slate-300 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                    {feature}
                  </span>
                ))}
              </div>

              <div className="mt-auto pt-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => setSelectedTemplate(template)}
                      className="w-full font-sans bg-white text-black hover:bg-slate-200 transition-colors"
                    >
                      Configure & Launch
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-neutral-950 border-white/10 text-slate-50 max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="font-heading text-2xl">Configure {template.title}</DialogTitle>
                      <DialogDescription className="font-sans text-slate-400">
                        Set up your agent's parameters before launching.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4 font-sans">
                      <div className="space-y-2"><Label>Agent Name</Label><Input placeholder="My Trading Agent" className="bg-neutral-900 border-white/10" /></div>
                      <div className="space-y-2"><Label>Capital Allocation (SOL)</Label><Input type="number" placeholder="10" className="bg-neutral-900 border-white/10" /></div>
                      <div className="space-y-2"><Label>Risk Level</Label><Select defaultValue="medium"><SelectTrigger className="bg-neutral-900 border-white/10"><SelectValue /></SelectTrigger><SelectContent className="bg-neutral-900 border-white/10"><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select></div>
                      <Button onClick={handleLaunchAgent} className="w-full bg-white text-black hover:bg-slate-200" size="lg">Launch Agent</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  )
}