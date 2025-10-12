"use client"

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, TrendingUp, Shield, DollarSign, Target, Zap } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { useInView } from "framer-motion";

const agents = [
  {
    icon: ArrowUpDown,
    title: "Cross-DEX Arbitrage",
    description: "Exploit price differences across Solana DEXs instantly and privately.",
    features: ["Multi-DEX scanning", "Gas optimization", "MEV protection"],
    gradient: "from-cyan-500/20 to-blue-500/20",
  },
  {
    icon: Shield,
    title: "Stop-Loss Executor",
    description: "Automated position protection that executes without revealing your targets.",
    features: ["Private triggers", "Zero slippage", "Instant execution"],
    gradient: "from-violet-500/20 to-purple-500/20",
  },
  {
    icon: TrendingUp,
    title: "Trend Follower",
    description: "Detect and capitalize on market trends with confidential signal processing.",
    features: ["AI-powered signals", "Dynamic sizing", "Risk management"],
    gradient: "from-green-500/20 to-emerald-500/20",
  },
  {
    icon: DollarSign,
    title: "Yield Optimizer",
    description: "Automatically rebalance across lending protocols for maximum returns.",
    features: ["Auto-compound", "Gas-efficient", "Multi-protocol"],
    gradient: "from-yellow-500/20 to-orange-500/20",
  },
  {
    icon: Target,
    title: "Limit Order Bot",
    description: "Execute trades at your target prices without exposing your strategy.",
    features: ["Private orders", "No front-running", "Instant fills"],
    gradient: "from-pink-500/20 to-rose-500/20",
  },
  {
    icon: Zap,
    title: "Flash Loan Executor",
    description: "Complex multi-step transactions executed atomically and privately.",
    features: ["Zero capital needed", "Risk-free execution", "Unlimited strategies"],
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
]

const Marquee = ({ children, direction = 1 }) => {
  return (
    <div className="w-full overflow-hidden">
      <motion.div
        className="flex"
        animate={{ x: direction === 1 ? ["0%", "-100%"] : ["-100%", "0%"] }}
        transition={{ ease: "linear", duration: 80, repeat: Infinity }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export function AgentsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section id="agents" ref={ref} className="py-24 relative overflow-hidden bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-4xl sm:text-5xl font-bold mb-4 text-white">
            Pre-Built Agent Templates
          </h2>
          <p className="font-sans text-lg text-slate-400 max-w-3xl mx-auto">
            Launch sophisticated, battle-tested trading strategies in minutes.
          </p>
        </motion.div>
      </div>

      <div className="flex flex-col gap-4 py-8">
        <Marquee direction={1}>
          {[...agents, ...agents].map((agent, index) => (
            <AgentCard agent={agent} key={`top-${index}`} />
          ))}
        </Marquee>
        <Marquee direction={-1}>
          {[...agents, ...agents].reverse().map((agent, index) => (
            <AgentCard agent={agent} key={`bottom-${index}`} />
          ))}
        </Marquee>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-center mt-12"
      >
        <Button asChild size="lg" className="font-sans bg-white hover:bg-slate-200 text-black font-bold text-base py-3 px-8 rounded-md transition-all duration-300">
          <Link href="/app/marketplace">Explore All Templates</Link>
        </Button>
      </motion.div>
    </section>
  );
}

const AgentCard = ({ agent }) => {
  return (
    <Card className="bg-neutral-900/50 border border-white/10 hover:border-white/20 transition-colors duration-300 flex-shrink-0 w-96 mx-2 group p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 rounded-lg bg-black border border-white/10">
          <agent.icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="font-heading text-xl font-bold text-slate-50">{agent.title}</h3>
          <p className="font-sans text-sm text-slate-400">{agent.description}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-auto">
        {agent.features.map(feature => (
          <span key={feature} className="font-sans text-xs text-slate-300 bg-white/5 px-2 py-1 rounded-full border border-white/10">
            {feature}
          </span>
        ))}
      </div>
    </Card>
  );
};