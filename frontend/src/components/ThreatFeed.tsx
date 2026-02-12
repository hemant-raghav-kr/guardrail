import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ThreatEvent {
  id: number;
  ip: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
}

const threatTypes = [
  "SQL_INJECTION",
  "XSS_ATTEMPT",
  "BRUTE_FORCE",
  "DDoS_FRAGMENT",
  "PATH_TRAVERSAL",
  "TOKEN_REPLAY",
  "BOT_SWARM",
  "PAYLOAD_OVERFLOW",
];

const randomIP = () =>
  `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

const ThreatFeed = () => {
  const [events, setEvents] = useState<ThreatEvent[]>([]);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((c) => c + 1);
      const severities: ThreatEvent["severity"][] = [
        "low",
        "medium",
        "high",
        "critical",
      ];
      const newEvent: ThreatEvent = {
        id: Date.now(),
        ip: randomIP(),
        type: threatTypes[Math.floor(Math.random() * threatTypes.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        timestamp: new Date().toISOString().split("T")[1].split(".")[0],
      };

      setEvents((prev) => [newEvent, ...prev].slice(0, 8));
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const severityColor = (s: ThreatEvent["severity"]) => {
    switch (s) {
      case "critical":
        return "text-primary text-glow-red";
      case "high":
        return "text-neon-amber";
      case "medium":
        return "text-neon-cyan";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-8 py-24 overflow-hidden">
      <motion.p
        className="font-display text-xs tracking-[0.5em] uppercase text-muted-foreground mb-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        Anomaly Detection
      </motion.p>

      <motion.h2
        className="font-display text-5xl md:text-8xl font-bold text-primary text-glow-red mb-16 text-center"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      >
        INTERCEPT
      </motion.h2>

      {/* Threat feed */}
      <div className="w-full max-w-3xl">
        <div className="border-t border-border/30 mb-4">
          <div className="grid grid-cols-4 gap-4 py-2 text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            <span>TIME</span>
            <span>ORIGIN</span>
            <span>VECTOR</span>
            <span className="text-right">SEVERITY</span>
          </div>
        </div>

        <AnimatePresence>
          {events.map((event) => (
            <motion.div
              key={event.id}
              className="grid grid-cols-4 gap-4 py-3 border-b border-border/10 font-mono text-xs"
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="text-muted-foreground">{event.timestamp}</span>
              <span className="text-foreground/70">{event.ip}</span>
              <span className="text-neon-cyan">{event.type}</span>
              <span
                className={`text-right uppercase font-bold ${severityColor(event.severity)}`}
              >
                {event.severity}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Blocked count */}
      <motion.div
        className="mt-16 text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-2">
          Auto-blocked this session
        </p>
        <p className="font-display text-6xl md:text-8xl font-bold text-primary text-glow-red">
          {(counter * 7 + 3291).toLocaleString()}
        </p>
      </motion.div>
    </section>
  );
};

export default ThreatFeed;
