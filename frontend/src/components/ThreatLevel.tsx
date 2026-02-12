import { motion } from "framer-motion";
import { useSentinelStore } from "@/stores/useSentinelStore";

const ThreatLevel = () => {
  const threatScore = useSentinelStore((s) => s.threatScore);

  const level = threatScore > 70 ? "HIGH" : threatScore > 30 ? "MEDIUM" : "LOW";
  const color =
    level === "HIGH"
      ? "text-primary text-glow-red"
      : level === "MEDIUM"
      ? "text-neon-amber text-glow-amber"
      : "text-neon-cyan text-glow-cyan";
  const barColor =
    level === "HIGH"
      ? "bg-primary"
      : level === "MEDIUM"
      ? "bg-neon-amber"
      : "bg-neon-cyan";
  const glowClass =
    level === "HIGH"
      ? "box-glow-red"
      : level === "MEDIUM"
      ? ""
      : "box-glow-cyan";
  const statusText =
    level === "HIGH"
      ? "Active attack detected"
      : level === "MEDIUM"
      ? "Suspicious activity detected"
      : "System stable";

  return (
    <section className="relative flex flex-col items-center justify-center px-8 py-24">
      <motion.p
        className="font-display text-xs tracking-[0.5em] uppercase text-muted-foreground mb-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        Threat Assessment
      </motion.p>

      <motion.div
        className={`font-display text-7xl md:text-[10rem] font-bold leading-none ${color}`}
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        {level === "HIGH" ? (
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {level}
          </motion.span>
        ) : (
          level
        )}
      </motion.div>

      {/* Score bar */}
      <div className="w-full max-w-md mt-12">
        <div className="flex justify-between text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
          <span>SCORE</span>
          <span className={color}>{threatScore}/100</span>
        </div>
        <div className={`h-1 w-full bg-border/30 overflow-hidden ${glowClass}`}>
          <motion.div
            className={`h-full ${barColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${threatScore}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      <motion.p
        className={`mt-6 text-xs tracking-[0.3em] uppercase ${
          level === "HIGH" ? "text-primary/80" : "text-muted-foreground"
        }`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        {statusText}
      </motion.p>
    </section>
  );
};

export default ThreatLevel;
