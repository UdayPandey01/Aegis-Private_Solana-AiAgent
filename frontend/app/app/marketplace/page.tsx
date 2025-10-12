"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Shield, ArrowUpDown, TrendingUp, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import axios from "axios"
import { useWallet } from "@solana/wallet-adapter-react"

const templates = [
  { id: "arbitrage", icon: ArrowUpDown, title: "Cross-DEX Arbitrage", description: "Exploit price differences across Solana DEXs instantly and privately.", features: ["Multi-DEX scanning", "Gas optimization", "MEV protection"] },
  { id: "stop-loss", icon: Shield, title: "Stop-Loss Executor", description: "Automated position protection that executes without revealing your targets.", features: ["Private triggers", "Zero slippage", "Instant execution"] },
  { id: "trend-follower", icon: TrendingUp, title: "Trend Follower", description: "Detect and capitalize on market trends with confidential signal processing.", features: ["AI-powered signals", "Dynamic sizing", "Risk management"] },
];

type Template = (typeof templates)[0];

export default function MarketplacePage() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter()
  const { publicKey, connected } = useWallet();

  const handleLaunchAgent = async (params: any) => {
    console.log('Launch agent clicked - Wallet status:', { publicKey: publicKey?.toBase58(), connected });

    if (!publicKey || !connected) {
      alert("Please connect your wallet first! Go to the header and click 'Select Wallet'.");
      return;
    }

    setIsSubmitting(true);

    const jobPayload = {
      jobId: Date.now(),
      agentType: selectedTemplate?.id,
      userWalletAddress: publicKey.toBase58(),
      parameters: params,
    };

    try {
      await axios.post('http://localhost:3001/jobs/start-continuous', jobPayload);
      router.push("/app/dashboard");
    } catch (error) {
      console.error("Failed to launch agent:", error);
      alert("Failed to launch agent. Check the console for details.");
    } finally {
      setIsSubmitting(false);
    }
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
            <div className="justify-self-end">
              {connected && publicKey && (
                <span className="text-xs text-green-400">
                  ✓ {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12 text-center">
          <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-2 text-slate-50">Agent Marketplace</h1>
          <p className="font-sans text-slate-400 max-w-2xl mx-auto">Choose a template to launch your autonomous trading agent.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {templates.map((template) => (
            <div
              key={template.title}
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
                <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedTemplate(null)}>
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
                      <DialogTitle className="font-heading text-2xl">Configure {selectedTemplate?.title}</DialogTitle>
                      <DialogDescription className="font-sans text-slate-400">
                        Set your agent's secret parameters. This data is protected end-to-end.
                      </DialogDescription>
                    </DialogHeader>

                    {selectedTemplate?.id === 'arbitrage' && <ArbitrageConfigForm onLaunch={handleLaunchAgent} isSubmitting={isSubmitting} />}
                    {selectedTemplate?.id === 'stop-loss' && <StopLossConfigForm onLaunch={handleLaunchAgent} isSubmitting={isSubmitting} />}
                    {selectedTemplate?.id === 'trend-follower' && <TrendFollowerConfigForm onLaunch={handleLaunchAgent} isSubmitting={isSubmitting} />}

                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

const ArbitrageConfigForm = ({ onLaunch, isSubmitting }: { onLaunch: (params: any) => void; isSubmitting: boolean }) => {
  const [selectedDexs, setSelectedDexs] = useState({ orca: true, raydium: true });
  const [assetPair, setAssetPair] = useState("sol-usdc");
  const [profitThreshold, setProfitThreshold] = useState("");

  const handleSubmit = () => {
    onLaunch({
      dexs: Object.keys(selectedDexs).filter(k => selectedDexs[k as keyof typeof selectedDexs]),
      assetPair,
      profitThreshold: parseFloat(profitThreshold)
    });
  }

  return (
    <div className="space-y-6 py-4 font-sans">
      <div className="space-y-3">
        <Label>DEXs to Monitor</Label>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="orca" checked={selectedDexs.orca} onCheckedChange={(checked) => setSelectedDexs(prev => ({ ...prev, orca: !!checked }))} className="border-white/20" />
            <Label htmlFor="orca">Orca</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="raydium" checked={selectedDexs.raydium} onCheckedChange={(checked) => setSelectedDexs(prev => ({ ...prev, raydium: !!checked }))} className="border-white/20" />
            <Label htmlFor="raydium">Raydium</Label>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Asset Pair to Arbitrage</Label>
        <Select value={assetPair} onValueChange={setAssetPair}>
          <SelectTrigger className="bg-neutral-900 border-white/10"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-neutral-900 border-white/10">
            <SelectItem value="sol-usdc">SOL/USDC</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>My Secret Profit Threshold (%)</Label>
        <Input type="number" placeholder="e.g., 0.2" className="bg-neutral-900 border-white/10" value={profitThreshold} onChange={(e) => setProfitThreshold(e.target.value)} />
      </div>
      <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-white text-black hover:bg-slate-200" size="lg">
        {isSubmitting ? "Launching..." : "Launch Agent"}
      </Button>
    </div>
  )
}

const StopLossConfigForm = ({ onLaunch, isSubmitting }: { onLaunch: (params: any) => void; isSubmitting: boolean }) => {
  const handleSubmit = () => { onLaunch({}); }
  return (
    <div className="space-y-6 py-4 font-sans text-slate-400">
      <p>Configuration for the Stop-Loss Agent is coming soon...</p>
      <Button onClick={handleSubmit} disabled className="w-full bg-white text-black hover:bg-slate-200" size="lg">
        Launch Agent
      </Button>
    </div>
  );
}

const TrendFollowerConfigForm = ({ onLaunch, isSubmitting }: { onLaunch: (params: any) => void; isSubmitting: boolean }) => {
  const handleSubmit = () => { onLaunch({}); }
  return (
    <div className="space-y-6 py-4 font-sans text-slate-400">
      <p>Configuration for the Trend Follower Agent is coming soon...</p>
      <Button onClick={handleSubmit} disabled className="w-full bg-white text-black hover:bg-slate-200" size="lg">
        Launch Agent
      </Button>
    </div>
  );
}