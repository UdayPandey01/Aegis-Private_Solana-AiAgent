"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Plus, Wallet, TrendingUp, Activity, MoreHorizontal, Circle, CheckCircle, AlertTriangle, Trash2 } from "lucide-react"
import Link from "next/link"
import axios from "axios"
import { API_ENDPOINTS } from "@/lib/api"
import { useWallet } from "@solana/wallet-adapter-react"
import { useVaultBalance } from "@/hooks/useVaultBalance"
import { useToastNotifications } from "@/hooks/use-toast-notifications"

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || process.env.NODE_ENV === 'development';
import { useSolPrice } from "@/hooks/useSolPrice"

type Agent = {
  id: number;
  agentType: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RUNNING' | 'PAUSED';
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
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showSuccess, showError, showWarning } = useToastNotifications();

  const { balance: vaultBalance, isLoading: vaultLoading } = useVaultBalance();
  const { price: solPrice, change24h, isLoading: priceLoading } = useSolPrice();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('.dropdown-menu') || target.closest('.dropdown-toggle')) {
        return;
      }
      if (openDropdown !== null) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  useEffect(() => {
    const fetchData = async () => {
      if (!publicKey) {
        setAgents([]);
        setStats({ totalBalance: 0, totalPnl: 0 });
        setIsLoading(false);
        return;
      };

      try {
        const response = await axios.get(API_ENDPOINTS.jobsByWallet(publicKey.toBase58()));
        const userJobs: Agent[] = response.data;
        console.log(`Fetched ${userJobs.length} agents for dashboard`);

        setAgents(prev => {
          const hasChanged = JSON.stringify(prev) !== JSON.stringify(userJobs);
          return hasChanged ? userJobs : prev;
        });


        const totalPnl = userJobs.reduce((acc, job) => {
          console.log("Processing job result:", job.result);
          if (job.result && job.status === 'COMPLETED') {
            if (job.result.length > 50) {
              console.log("Job completed with transaction, P&L = 0 (no real P&L data yet)");
              return acc + 0;
            } else {
              console.log("Job completed with no profit");
              return acc + 0;
            }
          }
          return acc;
        }, 0);

        console.log("Total P&L calculated:", totalPnl);

        setStats({
          totalBalance: vaultBalance.totalValueUSD,
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

      const refreshInterval = setInterval(() => {
        if (publicKey && document.visibilityState === 'visible') {
          console.log('Auto-refreshing dashboard data...');
          fetchData();
        }
      }, 30000);

      return () => clearInterval(refreshInterval);
    }
  }, [publicKey, isMounted, vaultBalance.totalValueUSD]);

  const walletAddress = publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : "Not Connected";

  const handleDeleteAgent = async (agentId: number) => {
    if (!publicKey) return;

    setIsDeleting(true);
    try {
      await axios.delete(API_ENDPOINTS.deleteJob(agentId.toString(), publicKey.toBase58()));

      setAgents(prev => prev.filter(agent => agent.id !== agentId));

      setDeleteConfirm(null);
      setOpenDropdown(null);

      console.log(`Agent ${agentId} deleted successfully`);
    } catch (error) {
      console.error('Failed to delete agent:', error);
      showError('Failed to delete agent', 'Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Vault Balance"
            value={`$${stats.totalBalance.toFixed(2)}`}
            description={priceLoading ? "Loading SOL price..." : `SOL: $${solPrice.toFixed(2)} ${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`}
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
          <StatCard
            title="SOL Price"
            value={priceLoading ? "Loading..." : `$${solPrice.toFixed(2)}`}
            description={priceLoading ? "Fetching price..." : `24h: ${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`}
            icon={TrendingUp}
            delay={0.4}
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
              <div className="flex gap-3">
                <Button asChild variant="outline" className="font-sans bg-transparent border-white/20 hover:bg-white/10 hover:text-white">
                  <a href="/app/vault">
                    <Wallet className="h-4 w-4 mr-2" />
                    Go to Vault
                  </a>
                </Button>
                <Button asChild variant="outline" className="font-sans bg-transparent border-white/20 hover:bg-white/10 hover:text-white">
                  <a href="/app/marketplace">
                    <Plus className="h-4 w-4 mr-2" />
                    Launch New Agent
                  </a>
                </Button>
              </div>
            </div>

            <div className="border-t border-white/10">
              {isLoading ? (
                <div className="p-6 text-center text-slate-400">Loading agents...</div>
              ) : agents.length > 0 ? (
                <div className="divide-y divide-white/10">
                  {agents.map(agent => (
                    <AgentRow
                      key={agent.id}
                      agent={agent}
                      openDropdown={openDropdown}
                      setOpenDropdown={setOpenDropdown}
                      deleteConfirm={deleteConfirm}
                      setDeleteConfirm={setDeleteConfirm}
                      onDelete={handleDeleteAgent}
                      isDeleting={isDeleting}
                    />
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
                      You haven&apos;t launched any trading agents yet. Explore the marketplace to find a strategy.
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

const StatCard = ({ title, value, description, icon: Icon, delay }: {
  title: string;
  value: string;
  description: string;
  icon: any;
  delay: number;
}) => (
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

const AgentRow = ({
  agent,
  openDropdown,
  setOpenDropdown,
  deleteConfirm,
  setDeleteConfirm,
  onDelete,
  isDeleting
}: {
  agent: Agent;
  openDropdown: number | null;
  setOpenDropdown: (id: number | null) => void;
  deleteConfirm: number | null;
  setDeleteConfirm: (id: number | null) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}) => {
  const getStatusIcon = (status: Agent['status']) => {
    switch (status?.toUpperCase()) {
      case 'RUNNING':
      case 'MONITORING':
      case 'PENDING':
      case 'PROCESSING':
        return <Circle className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'COMPLETED':
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'PAUSED':
        return <Circle className="h-4 w-4 text-yellow-500" />;
      case 'FAILED':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-slate-500" />;
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
    <div className="relative">
      <div className="grid grid-cols-12 gap-4 items-center p-4 hover:bg-white/5 transition-colors">
        <Link href={`/app/agent/demo?id=${agent.id}`} className="col-span-10 grid grid-cols-10 gap-4 items-center cursor-pointer">
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
        </Link>
        <div className="col-span-2 flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="dropdown-toggle"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpenDropdown(openDropdown === agent.id ? null : agent.id);
            }}
          >
            <MoreHorizontal className="h-4 w-4 text-slate-400" />
          </Button>
        </div>
      </div>

      {
        openDropdown === agent.id && (
          <div className="dropdown-menu absolute right-4 top-12 z-50 bg-neutral-800 border border-white/20 rounded-lg shadow-lg py-1 min-w-[160px]">
            <button
              onClick={(e) => {
                e.preventDefault();
                setDeleteConfirm(agent.id);
                setOpenDropdown(null);
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Agent
            </button>
          </div>
        )
      }

      {
        deleteConfirm === agent.id && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-neutral-900 border border-white/20 rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-slate-50 mb-2">Delete Agent</h3>
              <p className="text-slate-400 mb-6">
                Are you sure you want to delete this agent? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={isDeleting}
                  className="border-white/20 hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => onDelete(agent.id)}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}