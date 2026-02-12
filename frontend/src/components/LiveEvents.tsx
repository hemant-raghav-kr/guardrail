import { motion, AnimatePresence } from "framer-motion";
import { useSentinelStore } from "@/stores/useSentinelStore";

const severityIcon = (s: "info" | "warn" | "critical") => {
  switch (s) {
    case "critical":
      return "◆";
    case "warn":
      return "▲";
    default:
      return "●";
  }
};

const severityStyle = (s: "info" | "warn" | "critical") => {
  switch (s) {
    case "critical":
      return "text-primary text-glow-red";
    case "warn":
      return "text-neon-amber";
    default:
      return "text-neon-cyan";
  }
};

const LiveEvents = () => {
  const liveEvents = useSentinelStore((s) => s.liveEvents);

  return (
    <section className="relative px-8 py-16">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="flex items-center gap-3 mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="w-2 h-2 bg-neon-cyan animate-pulse-glow" />
          <span className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground">
            Live Events Stream
          </span>
        </motion.div>

        <div className="space-y-0">
          <AnimatePresence>
            {liveEvents.slice(0, 12).map((event) => (
              <motion.div
                key={event.id}
                className="flex items-start gap-4 py-3 border-b border-border/10"
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className={`text-sm mt-0.5 ${severityStyle(event.severity)}`}>
                  {severityIcon(event.severity)}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono min-w-[70px]">
                  {event.timestamp.split("T")[1]?.split(".")[0] || "—"}
                </span>
                <span className="text-xs text-foreground/70 flex-1">
                  {event.description}
                </span>
                <span
                  className={`text-[9px] tracking-[0.3em] uppercase font-bold ${severityStyle(
                    event.severity
                  )}`}
                >
                  {event.severity}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>

          {liveEvents.length === 0 && (
            <div className="py-12 text-center text-[10px] tracking-[0.3em] uppercase text-muted-foreground/40">
              AWAITING EVENTS...
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default LiveEvents;
