"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { useRouter } from "next/navigation"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"

export default function AppPage() {
  const router = useRouter()
  const { connected, connecting } = useWallet()
  const { setVisible } = useWalletModal()

  useEffect(() => {
    if (connected) {
      router.push("/app/dashboard")
    }
  }, [connected, router])

  const handleConnect = () => {
    setVisible(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-background" />

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
              <Button
                onClick={handleConnect}
                disabled={connecting}
                className="w-full h-16 text-lg bg-cyan-500 hover:bg-cyan-600 border-cyan-500/40 border text-white font-semibold"
              >
                <Wallet className="h-5 w-5 mr-3" />
                {connecting ? "Connecting..." : "Select Wallet"}
              </Button>
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
