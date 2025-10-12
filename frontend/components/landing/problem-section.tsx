"use client"

import { motion, useScroll, useTransform } from "framer-motion";
import React, { useRef, useState, useEffect } from "react";
import { TriangleAlert as AlertTriangle, Shield, Lock } from "lucide-react";

const problems = [
  {
    icon: AlertTriangle,
    title: "Alpha Leakage",
    description: "Your strategies get copied the moment they touch the mempool. Front-runners and copycats steal your edge.",
  },
  {
    icon: Shield,
    title: "MEV Attacks",
    description: "Bots sandwich your trades, extract value, and leave you with worse execution. Your profit becomes their profit.",
  },
  {
    icon: Lock,
    title: "Private Data Barrier",
    description: "On-chain execution means public transactions. You can't use confidential logic or private data without exposure.",
  },
];

export function ProblemSection() {
  const targetRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    return scrollYProgress.onChange(latest => {
      const newIndex = Math.min(Math.floor(latest * problems.length), problems.length - 1);
      if (newIndex !== activeIndex) {
        setActiveIndex(newIndex);
      }
    });
  }, [scrollYProgress, activeIndex]);

  return (
    <section id="problem" ref={targetRef} className="relative bg-black text-white" style={{ height: `${problems.length * 100 + 50}vh` }}>
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">


        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="h-full flex flex-col justify-center">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="font-heading text-4xl sm:text-5xl font-bold mb-6 text-slate-50"
              >
                The Flaw in <br /> Public Trading
              </motion.h2>
              <div className="space-y-8 mt-8">
                {problems.map((problem, index) => (
                  <motion.div
                    key={problem.title}
                    animate={{ opacity: activeIndex === index ? 1 : 0.3 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex items-start gap-4">
                      <problem.icon className="h-7 w-7 flex-shrink-0 text-white mt-1" />
                      <div>
                        <h3 className="font-heading text-2xl font-bold text-slate-50">{problem.title}</h3>
                        <p className="font-sans text-slate-400 mt-2 ml-0 leading-relaxed">
                          {problem.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative h-[120vh]">
              {problems.map((problem, index) => {
                const start = index / problems.length;
                const end = (index + 1) / problems.length;
                const opacity = useTransform(scrollYProgress, [start, start + 0.1, end - 0.1, end], [0, 1, 1, 0]);
                const scale = useTransform(scrollYProgress, [start, start + 0.1, end - 0.1, end], [0.85, 1, 1, 0.85]);
                const y = useTransform(scrollYProgress, [start, end], ["50%", "-50%"]);

                return (
                  <motion.div
                    key={problem.title}
                    style={{ opacity, scale, y }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-[400px] h-[300px] bg-neutral-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-8 flex flex-col justify-center items-center text-center shadow-2xl shadow-black/50">
                      <div className="p-4 bg-black/30 rounded-xl mb-4">
                        <problem.icon className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="font-heading text-2xl font-bold text-slate-50">{problem.title}</h3>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}