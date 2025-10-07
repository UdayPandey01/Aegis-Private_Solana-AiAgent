// components/FeatureGridSection.tsx
"use client"

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Lock, Cpu, Shield, CheckCircle } from "lucide-react";
import { FloatingNodes } from "../ui/FloatingNodes"; // Assuming FloatingNodes is in ui folder

// NEW: Added className for bento grid layout
const features = [
  {
    icon: Lock,
    title: "Confidential Compute",
    description: "Your logic runs privately in a zkVM. No one sees your strategy, inputs, or state.",
    className: "md:col-span-2", // This item will be wider
  },
  {
    icon: Cpu,
    title: "ZK Proof Generation",
    description: "A cryptographic proof is generated, confirming your logic executed correctly without revealing it.",
    className: "md:col-span-1", // This item will be narrower
  },
  {
    icon: Shield,
    title: "MEV Resistance",
    description: "Transactions are sent via private relayers like Jito, making them invisible to front-running bots.",
    className: "md:col-span-1", // This item will be narrower
  },
  {
    icon: CheckCircle,
    title: "Non-Custodial & Verified",
    description: "You retain full control of your assets. On-chain contracts verify proofs, settling trades trustlessly.",
    className: "md:col-span-2", // This item will be wider
  },
];

export function FeatureGridSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { duration: 0.7, ease: [0.25, 1, 0.5, 1] } 
    },
  };

  return (
    <section id="how-it-works" ref={ref} className="py-24 relative bg-black overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20">
        <FloatingNodes />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-4xl sm:text-5xl font-bold mb-4 text-white">
            A Look Inside the Engine
          </h2>
          <p className="font-sans text-lg text-slate-400 max-w-3xl mx-auto">
            Our architecture separates private computation from public settlement, giving you the best of both worlds.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          // CHANGED: Updated grid columns for bento layout
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              // CHANGED: Applied dynamic className for bento grid
              className={`relative p-8 overflow-hidden rounded-xl border border-white/10 bg-neutral-900/50 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-neutral-900 ${feature.className}`}
            >
              <div className="flex items-start gap-4">
                  <feature.icon className="h-6 w-6 text-white flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-heading text-xl font-semibold mb-2 text-slate-50">{feature.title}</h3>
                    <p className="font-sans text-base text-slate-400">{feature.description}</p>
                  </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}