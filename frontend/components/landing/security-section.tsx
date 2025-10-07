"use client"

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Lock, Cpu, Shield, CheckCircle } from "lucide-react";

const features = [
  {
    icon: Lock,
    title: "Confidential Compute",
    description: "Your logic runs privately in a zkVM. No one sees your strategy, inputs, or state.",
  },
  {
    icon: Cpu,
    title: "ZK Proof Generation",
    description: "A cryptographic proof is generated, confirming your logic executed correctly without revealing it.",
  },
  {
    icon: Shield,
    title: "MEV Resistance",
    description: "Transactions are sent via private relayers like Jito, making them invisible to front-running bots.",
  },
  {
    icon: CheckCircle,
    title: "Non-Custodial & Verified",
    description: "You retain full control of your assets. On-chain contracts verify proofs, settling trades trustlessly.",
  },
];

export function FeatureGridSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.25, 1, 0.5, 1] } },
  };

  return (
    <section id="how-it-works" ref={ref} className="py-24 relative bg-black">
       <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-4xl sm:text-5xl font-bold mb-4 text-white">
            Private, Verifiable, Secure.
          </h2>
          <p className="font-sans text-lg text-slate-400 max-w-3xl mx-auto">
            Our architecture separates private computation from public settlement, giving you the best of both worlds.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="relative p-8 overflow-hidden rounded-xl border border-white/10 bg-neutral-900/50"
            >
              <div className="flex items-start gap-4">
                  <feature.icon className="h-7 w-7 text-white flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-heading text-xl font-semibold mb-2 text-slate-50">{feature.title}</h3>
                    <p className="font-sans text-slate-400">{feature.description}</p>
                  </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}