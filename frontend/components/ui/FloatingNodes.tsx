"use client"
import { motion } from "framer-motion";

const Node = ({ x, y, delay }) => (
  <motion.g
    initial={{ opacity: 0 }}
    animate={{ opacity: [0, 0.7, 0] }}
    transition={{ duration: 5, delay, repeat: Infinity, ease: "easeInOut" }}
  >
    <motion.circle
      cx={x}
      cy={y}
      r="2"
      stroke="rgba(255, 255, 255, 0.3)"
      strokeWidth="0.5"
      fill="rgba(255, 255, 255, 0.5)"
    />
  </motion.g>
);

const Line = ({ x1, y1, x2, y2, delay }) => (
  <motion.line
    x1={x1}
    y1={y1}
    x2={x2}
    y2={y2}
    stroke="rgba(255, 255, 255, 0.1)"
    strokeWidth="0.5"
    initial={{ opacity: 0 }}
    animate={{ opacity: [0, 0.3, 0] }}
    transition={{ duration: 6, delay, repeat: Infinity, ease: "easeInOut" }}
  />
);

export const FloatingNodes = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <svg width="100%" height="100%" className="absolute inset-0">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        <Line x1="10%" y1="20%" x2="30%" y2="40%" delay={0} />
        <Line x1="30%" y1="40%" x2="20%" y2="70%" delay={1} />
        <Line x1="20%" y1="70%" x2="40%" y2="80%" delay={2} />
        <Line x1="40%" y1="80%" x2="60%" y2="60%" delay={0.5} />
        <Line x1="60%" y1="60%" x2="80%" y2="85%" delay={1.5} />
        <Line x1="80%" y1="85%" x2="90%" y2="50%" delay={2.5} />
        <Line x1="90%" y1="50%" x2="70%" y2="20%" delay={1} />
        <Line x1="70%" y1="20%" x2="50%" y2="30%" delay={0} />
        <Line x1="50%" y1="30%" x2="30%" y2="40%" delay={2} />

        <Node x="10%" y="20%" delay={0.5} />
        <Node x="30%" y="40%" delay={1.5} />
        <Node x="20%" y="70%" delay={2.5} />
        <Node x="40%" y="80%" delay={0.8} />
        <Node x="60%" y="60%" delay={1.8} />
        <Node x="80%" y="85%" delay={2.8} />
        <Node x="90%" y="50%" delay={1.2} />
        <Node x="70%" y="20%" delay={0.2} />
        <Node x="50%" y="30%" delay={2.2} />
      </svg>
    </div>
  );
};