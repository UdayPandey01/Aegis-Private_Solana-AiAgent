"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, ArrowLeft, TrendingUp, Activity, ExternalLink, Play, Pause } from "lucide-react"
import Link from "next/link"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const generateChartData = () => {
  const data = []
  let value = 10000
  for (let i = 0; i < 20; i++) {
    value += (Math.random() - 0.4) * 500
    data.push({
      time: `${i}:00`,
      value: Math.round(value),
    })
  }
  return data
}

const executionLogs = [
    { id: 1, timestamp: "14:32:15", action: "Market Scan Completed", result: "Opportunity detected: Jupiter vs Raydium", tx: null },
    { id: 2, timestamp: "14:32:16", action: "ZK Proof Generation", result: "Proof generated successfully", tx: null },
    { id: 3, timestamp: "14:32:18", action: "Trade Executed", result: "Arbitrage completed: +$42.31", tx: "5xK2...8mP9" },
    { id: 4, timestamp: "14:35:42", action: "Market Scan Completed", result: "No profitable opportunities", tx: null },
    { id: 5, timestamp: "14:38:21", action: "Market Scan Completed", result: "Opportunity detected: Orca vs Jupiter", tx: null },
];

export default function AgentStatusPage() {
  const [isRunning, setIsRunning] = useState(true)
  const [chartData] = useState(generateChartData())
  const [logs, setLogs] = useState(executionLogs.slice(0, 5))

  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => {
      const newLog = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        action: "Market Scan Completed",
        result: Math.random() > 0.8 ? "Opportunity detected" : "No profitable opportunities",
        tx: null,
      }
      setLogs(prev => [newLog, ...prev].slice(0, 5))
    }, 5000)
    return () => clearInterval(interval)
  }, [isRunning, logs])

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
              <h1 className="font-heading text-4xl font-bold text-slate-50">Arbitrage Agent</h1>
              <p className="font-sans text-slate-400">Real-time monitoring and execution logs.</p>
            </div>
            <Button
              onClick={() => setIsRunning(!isRunning)}
              variant={isRunning ? "destructive" : "default"}
              className="font-sans flex items-center gap-2 w-full sm:w-auto"
            >
              {isRunning ? <><Pause className="h-4 w-4" /> Pause Agent</> : <><Play className="h-4 w-4" /> Resume Agent</>}
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Total Net P/L" value="+$234.56" description="+18.2% ROI" icon={TrendingUp} delay={0.1} />
          <StatCard title="Status" description={isRunning ? "Monitoring markets" : "Agent paused"} icon={Activity} delay={0.2}>
             <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
                <span className={`font-heading text-2xl font-bold ${isRunning ? 'text-green-400' : 'text-yellow-400'}`}>{isRunning ? "Active" : "Paused"}</span>
              </div>
          </StatCard>
          <StatCard title="Trades Executed" value="47" description="85% success rate" icon={Activity} delay={0.3} />
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
                                <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false}/>
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`}/>
                                <Tooltip contentStyle={{ backgroundColor: "#0a0a0a", border: "1px solid rgba(255, 255, 255, 0.1)" }}/>
                                <Line type="monotone" dataKey="value" stroke="#ffffff" strokeWidth={2} dot={false}/>
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
                        <div className="space-y-4">
                            {logs.map((log) => (
                                <div key={log.id} className="flex items-start justify-between font-sans text-sm">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-slate-500">{log.timestamp}</span>
                                            <span className="font-semibold text-slate-200">{log.action}</span>
                                        </div>
                                        <p className="text-slate-400">{log.result}</p>
                                    </div>
                                    {log.tx && (
                                        <a href={`https://solscan.io/tx/${log.tx}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white">
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
      </main>
    </div>
  )
}

const StatCard = ({ title, value, description, icon: Icon, delay, children = null }) => (
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