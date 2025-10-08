"use client"

import React from "react";
import { motion } from "framer-motion";
import GridDistortion from "../ui/gridDistortion";
import Link from "next/link";
import { FloatingNodes } from "../ui/FloatingNodes"; 

export function Hero() {
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    window.dispatchEvent(new CustomEvent("grid-mouse", { detail: { x, y } }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black"
      onMouseMove={handleMouseMove}
    >
      <div className="absolute inset-0 z-0">
        <GridDistortion
          imageSrc="/bg.jpg"
          grid={20}
          mouse={0.05}
          strength={0.3}
          relaxation={0.9}
        />
      </div>
      
      <div className="absolute inset-0 z-[5] opacity-50">
        <FloatingNodes />
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
            className="font-heading text-5xl sm:text-7xl font-bold mb-6 text-slate-50 drop-shadow-lg"
          >
            Autonomous Trading, <br />
            Fortified.
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="font-sans text-lg text-slate-400 mb-10 max-w-2xl mx-auto"
          >
            Private, autonomous agents for Solana that protect your strategies
            from MEV attacks and alpha leakage. Confidential computation meets unstoppable execution.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/app" passHref>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="font-sans bg-white hover:bg-slate-200 text-black px-6 py-3 rounded-md font-semibold transition-all duration-300 w-full sm:w-auto"
              >
                Launch App
              </motion.button>
            </Link>
            <Link href="#how-it-works" passHref>
              <motion.button
                whileHover={{ scale: 1.05, y: -2, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                whileTap={{ scale: 0.95 }}
                className="font-sans px-6 py-3 rounded-md font-medium border border-white/20 bg-white/5 backdrop-blur-sm text-white transition-all duration-300 w-full sm:w-auto"
              >
                Learn More
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}