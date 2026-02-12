import { motion, AnimatePresence } from "framer-motion";
import { useSentinelStore } from "@/stores/useSentinelStore";
import { Loader2 } from "lucide-react";

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
      return "text-red-500";
    case "warn":
      return "text-yellow-500";
    default:
      return "text-cyan-400";
  }
};

const LiveEvents = () => {
  const { liveEvents, loading, error } = useSentinelStore();

  return (
    <section className="relative px-8 py-16">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="flex items-center gap-3 mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-cyan-400 animate-pulse'}`} />
          <span className="text-[10px] tracking-[0.4em] uppercase text-white/50">
            Live Events Stream
          </span>
        </motion.div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded text-[10px] text-red-500">
            {error}
          </div>
        )}

        <div className="space-y-0">
          {loading && !liveEvents.length ? (
            <div className="py-12 flex items-center justify-center text-white/40">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-xs">Loading events...</span>
            </div>
          ) : (
            <AnimatePresence>
              {liveEvents.slice(0, 12).map((event) => (
                <motion.div
                  key={event.id}
                  className="flex items-start gap-4 py-3 border-b border-white/5"
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span className={`text-sm mt-0.5 ${severityStyle(event.severity)}`}>
                    {severityIcon(event.severity)}
                  </span>
                  <span className="text-[10px] text-white/40 font-mono min-w-[70px]">
                    {event.timestamp}
                  </span>
                  <span className="text-xs text-white/70 flex-1">
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
          )}

          {!loading && liveEvents.length === 0 && (
            <div className="py-12 text-center text-[10px] tracking-[0.3em] uppercase text-white/20">
              AWAITING EVENTS...
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default LiveEvents;
