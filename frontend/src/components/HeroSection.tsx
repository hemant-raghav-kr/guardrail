import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedCounter from "./AnimatedCounter";

const HeroSection = () => {
  const [threatLevel, setThreatLevel] = useState("CRITICAL");
  const [rps, setRps] = useState(12847);
  const [blocked, setBlocked] = useState(3291);
  const [uptime, setUptime] = useState(99.97);

  // Simulate live data
  useEffect(() => {
    const interval = setInterval(() => {
      setRps((prev) => prev + Math.floor(Math.random() * 200 - 80));
      setBlocked((prev) => prev + Math.floor(Math.random() * 50));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const levels = ["NOMINAL", "ELEVATED", "HIGH", "CRITICAL"];
  useEffect(() => {
    const interval = setInterval(() => {
      setThreatLevel(levels[2 + Math.floor(Math.random() * 2)]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Ambient radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, hsla(4, 100%, 50%, 0.06) 0%, transparent 70%)",
        }}
      />

      {/* Top status bar */}
      <motion.div
        className="absolute top-8 left-0 right-0 flex justify-between px-8 md:px-16 text-xs tracking-[0.3em] uppercase text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        <span>SYS.ONLINE</span>
        <span className="text-primary animate-pulse-glow">● LIVE</span>
        <span>NODE.PRIMARY</span>
      </motion.div>

      {/* Main threat display */}
      <motion.div
        className="text-center z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.p
          className="font-display text-sm md:text-base tracking-[0.5em] uppercase text-muted-foreground mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Threat Posture
        </motion.p>

        <AnimatePresence mode="wait">
          <motion.h1
            key={threatLevel}
            className={`font-display text-7xl md:text-[10rem] lg:text-[14rem] font-bold leading-none tracking-tight ${
              threatLevel === "CRITICAL"
                ? "text-primary text-glow-red"
                : "text-neon-amber text-glow-amber"
            }`}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -20 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {threatLevel}
          </motion.h1>
        </AnimatePresence>

        {/* Metrics row */}
        <motion.div
          className="mt-12 flex gap-12 md:gap-20 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          <MetricBlock
            label="REQ/SEC"
            value={rps}
            color="text-neon-cyan text-glow-cyan"
          />
          <MetricBlock
            label="BLOCKED"
            value={blocked}
            color="text-primary text-glow-red"
          />
          <MetricBlock
            label="UPTIME"
            value={uptime}
            suffix="%"
            decimals={2}
            color="text-neon-amber text-glow-amber"
          />
        </motion.div>
      </motion.div>

      {/* Bottom scan line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1.5, duration: 2 }}
      />

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <span className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground">
          Scroll
        </span>
        <motion.div
          className="w-px h-8 bg-primary/40"
          animate={{ scaleY: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
    </section>
  );
};

const MetricBlock = ({
  label,
  value,
  color,
  suffix = "",
  decimals = 0,
}: {
  label: string;
  value: number;
  color: string;
  suffix?: string;
  decimals?: number;
}) => (
  <div className="text-center">
    <p className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-2">
      {label}
    </p>
    <p className={`font-display text-3xl md:text-5xl font-bold ${color}`}>
      <AnimatedCounter target={value} suffix={suffix} decimals={decimals} />
    </p>
  </div>
);

export default HeroSection;
