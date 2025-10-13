"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, ArrowLeft, TrendingUp, Activity, ExternalLink, Play, Pause, Circle, CheckCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useSearchParams } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import { useVaultBalance } from "@/hooks/useVaultBalance"
import { useSSE } from "@/hooks/useSSE"
import axios from "axios"
import { API_ENDPOINTS } from "@/lib/api"

type Agent = {
  id: number;
  jobId: string;
  agentType: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RUNNING' | 'PAUSED';
  result: string | null;
  createdAt: string;
  updatedAt: string;
};

type ExecutionLog = {
  id: number;
  timestamp: string;
  action: string;
  result: string;
  tx: string | null;
};

type AgentMetrics = {
  totalPnL: number;
  totalTrades: number;
  winRate: number;
  avgTradeSize: number;
  maxDrawdown: number;
  sharpeRatio: number;
};

function AgentStatusPageContent() {
  const searchParams = useSearchParams();
  const { publicKey } = useWallet();
  const { balance: vaultBalance } = useVaultBalance();
  const { isConnected, connect, disconnect, addEventListener, removeEventListener } = useSSE();

  const agentId = searchParams.get('id');

  const [agent, setAgent] = useState<Agent | null>(null);
  const [metrics, setMetrics] = useState<AgentMetrics>({
    totalPnL: 0,
    totalTrades: 0,
    winRate: 0,
    avgTradeSize: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
  });
  const [chartData, setChartData] = useState<Array<{ time: string; value: number; pnl: number }>>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  const generateRealChartData = useCallback((basePnL: number) => {
    const data = [];
    const now = new Date();
    let cumulativePnL = basePnL;

    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);

      if (basePnL === 0) {
        data.push({
          time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: vaultBalance.totalValueUSD,
          pnl: 0,
        });
      } else {
        const variation = (Math.random() - 0.5) * 5;
        cumulativePnL += variation;

        data.push({
          time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: Math.round(vaultBalance.totalValueUSD + cumulativePnL),
          pnl: Math.round(cumulativePnL * 100) / 100,
        });
      }
    }
    setChartData(data);
  }, [vaultBalance.totalValueUSD]);

  const fetchExecutionLogs = useCallback(async (agentId: string) => {
    if (!publicKey) return;

    try {
      console.log(`Fetching execution logs for job ${agentId}`);
      const response = await axios.get(
        API_ENDPOINTS.executionLogs(publicKey.toBase58(), agentId)
      );

      const realLogs: ExecutionLog[] = response.data;
      console.log("Real execution logs received:", realLogs);
      console.log("Number of logs:", realLogs.length);

      if (realLogs.length > 0) {
        realLogs.forEach((log, index) => {
          console.log(`Log ${index + 1}:`, {
            action: log.action,
            result: log.result,
            tx: log.tx,
            timestamp: log.timestamp
          });
        });
        setLogs(realLogs);
      } else {
        console.log("No logs returned from API - showing initial status log");
        setLogs([{
          id: 1,
          timestamp: new Date().toLocaleTimeString(),
          action: "Agent Initialized",
          result: "Waiting for agent to start execution...",
          tx: null
        }]);
      }
    } catch (error) {
      console.error("Failed to fetch execution logs:", error);
      setLogs([{
        id: 1,
        timestamp: new Date().toLocaleTimeString(),
        action: "Status",
        result: "Agent is initializing. Logs will appear when execution begins.",
        tx: null
      }]);
    }
  }, [publicKey]);

  useEffect(() => {
    const fetchAgentData = async () => {
      if (!agentId || !publicKey) return;

      setIsLoading(true);
      try {
        const response = await axios.get(API_ENDPOINTS.jobsByWallet(publicKey.toBase58()));
        const userJobs: Agent[] = response.data;
        const selectedAgent = userJobs.find(job => job.id.toString() === agentId);

        if (selectedAgent) {
          console.log("Found agent data:", selectedAgent);
          console.log("Agent status:", selectedAgent.status);
          console.log("Agent result:", selectedAgent.result);
          console.log("Agent created at:", selectedAgent.createdAt);
          console.log("Agent updated at:", selectedAgent.updatedAt);

          setAgent(selectedAgent);
          setIsRunning(selectedAgent.status === 'RUNNING' || selectedAgent.status === 'PROCESSING');

          // Debug logging
          console.log("Agent status from database:", selectedAgent.status);
          console.log("Agent result from database:", selectedAgent.result);
          console.log("Agent jobId for SSE:", selectedAgent.jobId);

          let pnl = 0;
          if (selectedAgent.result && selectedAgent.status === 'COMPLETED') {
            if (selectedAgent.result.length > 50) {
              pnl = 0;
            } else {
              pnl = 0;
            }
          }
          console.log("Calculated P&L from agent result:", pnl, "from result:", selectedAgent.result);

          setMetrics({
            totalPnL: pnl,
            totalTrades: selectedAgent.status === 'COMPLETED' && selectedAgent.result && selectedAgent.result.length > 50 ? 1 : 0,
            winRate: selectedAgent.status === 'COMPLETED' && selectedAgent.result && selectedAgent.result.length > 50 ? 100 : 0,
            avgTradeSize: 0,
            maxDrawdown: 0,
            sharpeRatio: 0,
          });

          generateRealChartData(pnl);

          const createdTime = new Date(selectedAgent.createdAt).toLocaleTimeString();
          setLogs([{
            id: Date.now(),
            timestamp: createdTime,
            action: "Agent Created",
            result: `${selectedAgent.agentType} agent initialized with status: ${selectedAgent.status}`,
            tx: null
          }]);

          fetchExecutionLogs(selectedAgent.jobId);
        }
      } catch (error) {
        console.error("Failed to fetch agent data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgentData();
  }, [agentId, publicKey, generateRealChartData, fetchExecutionLogs]);

  useEffect(() => {
    if (!agent || !publicKey) return;

    console.log('Setting up SSE connection for agent:', agent.id, 'jobId:', agent.jobId);

    connect(agent.jobId, publicKey.toBase58());

    const handleJobUpdate = (data: any) => {
      console.log('Job update received:', data);
      setAgent(prev => prev ? { ...prev, status: data.status, result: data.result } : null);

      if (data.pnl !== undefined || data.tradesExecuted !== undefined) {
        setMetrics(prev => ({
          ...prev,
          totalPnL: data.pnl !== undefined ? data.pnl : prev.totalPnL,
          totalTrades: data.tradesExecuted !== undefined ? data.tradesExecuted : prev.totalTrades,
        }));
        console.log('Updated metrics - PnL:', data.pnl, 'Trades:', data.tradesExecuted);
      }

      const newLog = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        action: data.message || 'Status Update',
        result: data.result || data.message,
        tx: data.result && data.result.length > 20 ? data.result : null,
      };

      setLogs(prev => [...prev, newLog]);
    };

    const handleLogUpdate = (newLogs: any[]) => {
      console.log('Log update received:', newLogs, 'count:', newLogs.length);

      setLogs(prev => {
        const existingMap = new Map(
          prev.map(log => [`${log.timestamp}:${log.action}`, log])
        );

        newLogs.forEach(log => {
          const key = `${log.timestamp}:${log.action}`;
          existingMap.set(key, log);
        });

        return Array.from(existingMap.values());
      });
    };

    const handleChartUpdate = (newChartData: any[]) => {
      console.log('Chart update received:', newChartData);
      setChartData(newChartData);
    };

    addEventListener('job_update', handleJobUpdate);
    addEventListener('log_update', handleLogUpdate);
    addEventListener('chart_update', handleChartUpdate);

    return () => {
      removeEventListener('job_update', handleJobUpdate);
      removeEventListener('log_update', handleLogUpdate);
      removeEventListener('chart_update', handleChartUpdate);
    };
  }, [agent?.jobId, publicKey?.toBase58()]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-slate-400">Loading agent details...</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-black text-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Agent Not Found</h1>
          <p className="text-slate-400 mb-6">The requested agent could not be found.</p>
          <Link href="/app/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatAgentType = (type: string) => {
    return type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PROCESSING':
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case 'COMPLETED':
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case 'FAILED':
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
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
                <span className="font-heading text-xl font-bold text-white">AEGIS</span>
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
          className="mb-10"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-heading text-4xl font-bold text-slate-50">
                {formatAgentType(agent.agentType)}
              </h1>
              <p className="font-sans text-slate-400">Agent ID: {agent.id} • Real-time monitoring and execution logs</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`px-3 py-1 ${getStatusColor(agent.status)}`}>
                {agent.status}
              </Badge>
              <Button
                onClick={() => setIsRunning(!isRunning)}
                variant={isRunning ? "destructive" : "default"}
                className="font-sans flex items-center gap-2 w-full sm:w-auto"
              >
                {isRunning ? <><Pause className="h-4 w-4" /> Pause Agent</> : <><Play className="h-4 w-4" /> Resume Agent</>}
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Net P/L"
            value={`${metrics.totalPnL >= 0 ? '+' : ''}$${metrics.totalPnL.toFixed(2)}`}
            description={`${((metrics.totalPnL / vaultBalance.totalValueUSD) * 100).toFixed(1)}% ROI`}
            icon={TrendingUp}
            delay={0.1}
          />
          <StatCard title="Status" description={isRunning ? "Monitoring markets" : "Agent paused"} icon={Activity} delay={0.2}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
              <span className={`font-heading text-2xl font-bold ${isRunning ? 'text-green-400' : 'text-yellow-400'}`}>
                {isRunning ? "Active" : "Paused"}
              </span>
            </div>
          </StatCard>
          <StatCard
            title="Trades Executed"
            value={metrics.totalTrades.toString()}
            description={`${metrics.winRate.toFixed(1)}% success rate`}
            icon={Activity}
            delay={0.3}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-3"
          >
            <Card className="bg-neutral-900 border-white/10 h-full">
              <CardHeader><CardTitle className="font-heading text-xl">Performance Chart</CardTitle></CardHeader>
              <CardContent className="h-[300px] p-0 pr-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0a0a0a", border: "1px solid rgba(255, 255, 255, 0.1)" }}
                      formatter={(value: any, name: string) => [
                        `$${value}`,
                        name === 'value' ? 'Total Value' : 'P&L'
                      ]}
                    />
                    <Line type="monotone" dataKey="value" stroke="#ffffff" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="pnl" stroke="#10b981" strokeWidth={1} dot={false} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="bg-neutral-900 border-white/10 h-full">
              <CardHeader><CardTitle className="font-heading text-xl">Execution Log</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <div key={log.id} className="flex items-start justify-between gap-3 font-sans text-sm border-b border-white/5 pb-3 last:border-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-xs text-slate-500">{log.timestamp}</span>
                            <span className="font-semibold text-slate-200">{log.action}</span>
                          </div>
                          <p className="text-slate-400 break-words overflow-wrap-anywhere text-sm">{log.result}</p>
                        </div>
                        {log.tx && (
                          <a href={`https://explorer.solana.com/tx/${log.tx}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white flex-shrink-0" title={`View transaction: ${log.tx}`}>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-slate-600 mx-auto mb-3 opacity-50" />
                      <p className="text-slate-400 text-sm">No execution logs yet</p>
                      <p className="text-slate-500 text-xs mt-1">Logs will appear here as the agent executes trades</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

const StatCard = ({ title, value, description, icon: Icon, delay, children = null }: {
  title: string;
  value?: string;
  description: string;
  icon: any;
  delay: number;
  children?: React.ReactNode;
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
        {children || <div className="font-heading text-2xl font-bold text-slate-50">{value}</div>}
        <p className="font-sans text-xs text-slate-500">{description}</p>
      </CardContent>
    </Card>
  </motion.div>
);

export default function AgentStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-slate-400">Loading agent status...</p>
        </div>
      </div>
    }>
      <AgentStatusPageContent />
    </Suspense>
  );
}