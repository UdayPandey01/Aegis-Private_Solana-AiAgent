"use client"

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export function Hero() {

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black"
    >
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-900 via-black to-slate-900">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3), transparent 50%), radial-gradient(circle at 80% 80%, rgba(102, 126, 234, 0.3), transparent 50%)'
        }} />
      </div>
      <div className="relative z-10 text-center px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto"
        >
          <motion.h1
            variants={itemVariants}
            transition={{ duration: 0.8 }}
            className="font-heading text-5xl sm:text-7xl font-bold mb-6 text-slate-50 drop-shadow-lg"
          >
            Autonomous Trading, <br />
            Fortified.
          </motion.h1>

          <motion.p
            variants={itemVariants}
            transition={{ duration: 0.8 }}
            className="font-sans text-lg text-slate-400 mb-10 max-w-2xl mx-auto"
          >
            Private, autonomous agents for Solana that protect your strategies
            from MEV attacks and alpha leakage. Confidential computation meets unstoppable execution.
          </motion.p>

          <motion.div
            variants={itemVariants}
            transition={{ duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/app/vault" passHref>
              <button
                className="font-sans bg-white hover:bg-slate-200 text-black px-6 py-3 rounded-md font-semibold transition-colors duration-200 w-full sm:w-auto"
              >
                Launch App
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}