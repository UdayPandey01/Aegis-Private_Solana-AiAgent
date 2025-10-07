"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { useRouter } from "next/navigation"

const wallets = [
  { name: "Phantom", icon: "👻" },
  { name: "Solflare", icon: "☀️" },
  { name: "Backpack", icon: "🎒" },
]

export default function AppPage() {
  const [isConnecting, setIsConnecting] = useState(false)
  const router = useRouter()

  const handleConnect = async (walletName: string) => {
    setIsConnecting(true)
    setTimeout(() => {
      router.push("/app/dashboard")
    }, 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-background" />

      <div className="absolute inset-0">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 10 + Math.random() * 20,
              delay: Math.random() * 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-md w-full"
      >
        <Card className="glass border-cyan-500/20 glow-cyan">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex p-4 rounded-full bg-cyan-500/10 mb-4">
                <Wallet className="h-12 w-12 text-cyan-400" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Connect Wallet</h1>
              <p className="text-muted-foreground">
                Choose your Solana wallet to get started
              </p>
            </div>

            <div className="space-y-3">
              {wallets.map((wallet) => (
                <Button
                  key={wallet.name}
                  onClick={() => handleConnect(wallet.name)}
                  disabled={isConnecting}
                  className="w-full h-16 text-lg glass hover:bg-cyan-500/10 hover:border-cyan-500/40 border border-white/10 justify-start"
                  variant="outline"
                >
                  <span className="text-2xl mr-3">{wallet.icon}</span>
                  {wallet.name}
                </Button>
              ))}
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                By connecting, you agree to our Terms of Service
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
