"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Plus, Wallet, TrendingUp, Activity, MoreHorizontal, Circle, CheckCircle, AlertTriangle } from "lucide-react"
import axios from "axios"
import { useWallet } from "@solana/wallet-adapter-react"

type Agent = {
  id: number;
  agentType: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  result: string | null;
  createdAt: string;
};

export default function DashboardPage() {
  const { publicKey } = useWallet();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalPnl: 0,
  });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!publicKey) {
        setAgents([]);
        setStats({ totalBalance: 0, totalPnl: 0 });
        setIsLoading(false);
        return;
      };

      setIsLoading(true);
      try {
        const response = await axios.get(`http://localhost:3001/jobs?walletAddress=${publicKey.toBase58()}`);
        const userJobs: Agent[] = response.data;
        setAgents(userJobs);

        const totalPnl = userJobs.reduce((acc, job) => {
            if (job.result && job.result.includes("+$")) {
                const pnlValue = parseFloat(job.result.split("+$")[1]);
                if (!isNaN(pnlValue)) {
                    return acc + pnlValue;
                }
            }
            return acc;
        }, 0);
        
        setStats({
          totalBalance: 12450.00, 
          totalPnl: totalPnl,
        });

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isMounted) {
      fetchData();
    }
  }, [publicKey, isMounted]);

  const walletAddress = publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : "Not Connected";

  if (!isMounted) {
    return null; 
  }

  return (
    <div className="min-h-screen bg-black text-slate-50">
      <header className="sticky top-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <a href="/" className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-white" />
              <span className="font-heading text-xl font-bold text-white">
                AEGIS
              </span>
            </a>
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
            title="Total Vault Balance"
            value={`$${stats.totalBalance.toFixed(2)}`}
            description="Combined value of all assets"
            icon={Wallet}
            delay={0.1}
          />
          <StatCard
            title="Total P/L"
            value={`${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toFixed(2)}`}
            description="All-time agent performance"
            icon={TrendingUp}
            delay={0.2}
          />
          <StatCard
            title="Active Agents"
            value={agents.length.toString()}
            description={agents.length > 0 ? `${agents.length} agent(s) running` : "No agents running"}
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
                <a href="/app/marketplace">
                  <Plus className="h-4 w-4 mr-2" />
                  Launch New Agent
                </a>
              </Button>
            </div>

            <div className="border-t border-white/10">
              {isLoading ? (
                <div className="p-6 text-center text-slate-400">Loading agents...</div>
              ) : agents.length > 0 ? (
                <div className="divide-y divide-white/10">
                  {agents.map(agent => (
                    <AgentRow key={agent.id} agent={agent} />
                  ))}
                </div>
              ) : (
                <div className="p-6">
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="inline-flex p-5 rounded-full bg-black/50 border border-white/10 mb-6">
                      <Shield className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="font-heading text-xl font-bold mb-2 text-slate-50">No Active Agents</h3>
                    <p className="font-sans text-slate-400 mb-6 max-w-sm">
                      You haven't launched any trading agents yet. Explore the marketplace to find a strategy.
                    </p>
                    <Button asChild size="lg" className="font-sans bg-white text-black hover:bg-slate-200">
                      <a href="/app/marketplace">Browse Agent Templates</a>
                    </Button>
                  </div>
                </div>
              )}
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

const AgentRow = ({ agent }: { agent: Agent }) => {
  const getStatusIcon = (status: Agent['status']) => {
    switch(status?.toUpperCase()) {
      case 'MONITORING':
      case 'PENDING':
      case 'PROCESSING':
        return <Circle className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'COMPLETED':
      case 'SUCCESS':
         return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Circle className="h-4 w-4 text-slate-500" />;
    }
  }

  const getPnl = (result: string | null) => {
    if (result && result.includes("+$")) {
      const pnlValue = parseFloat(result.split("+$")[1]);
      return isNaN(pnlValue) ? 0 : pnlValue;
    }
    return 0;
  }

  const pnl = getPnl(agent.result);

  return (
    <div className="grid grid-cols-12 gap-4 items-center p-4 hover:bg-white/5 transition-colors">
      <div className="col-span-1 flex items-center justify-center">
        {getStatusIcon(agent.status)}
      </div>
      <div className="col-span-4">
        <p className="font-bold text-slate-50">{agent.agentType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
        <p className="text-xs text-slate-400">ID: {agent.id}</p>
      </div>
      <div className="col-span-3 text-slate-400 text-sm">
        {agent.status}
      </div>
      <div className={`col-span-2 font-mono text-sm ${pnl > 0 ? 'text-green-500' : 'text-slate-400'}`}>
        {pnl > 0 ? `+${pnl.toFixed(2)}` : `0.00`} USDC
      </div>
      <div className="col-span-2 flex justify-end">
         <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4 text-slate-400" />
        </Button>
      </div>
    </div>
  );
}