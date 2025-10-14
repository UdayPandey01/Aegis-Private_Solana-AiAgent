"use client"

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import GridDistortion from "@/components/ui/GridDis";

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
      {/* GridDistortion Background */}
      <div
        className="absolute inset-0 z-0"
        style={{ width: '100%', height: '100%', position: 'absolute' }}
      >
        <GridDistortion
          imageSrc="/bg.jpg"
          grid={10}
          mouse={0.1}
          strength={0.15}
          relaxation={0.9}
          className="w-full h-full"
        />
      </div>

      {/* Subtle vignette for text readability */}
      <div className="absolute inset-0 z-[1]" style={{
        background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.5) 100%)'
      }}></div>
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
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Autonomous
            </span>{" "}
            <span className="bg-gradient-to-r from-slate-200 via-slate-100 to-white bg-clip-text text-transparent">
              Trading
            </span>, <br />
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Fortified
            </span>.
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