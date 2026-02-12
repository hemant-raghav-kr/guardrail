import { create } from "zustand";

export interface BlockedClient {
  id: string;
  timestamp: string;
  clientIp: string;
  userAgent: string;
  fingerprint: string;
  decision: "BLOCKED" | "ALLOWED";
  threatScore: number;
  reason: string;
  endpoint: string;
  rpsAtTime: number;
}

export interface LiveEvent {
  id: string;
  timestamp: string;
  description: string;
  severity: "info" | "warn" | "critical";
  type: "burst" | "threshold" | "block" | "admin" | "rule";
}

interface SentinelState {
  // --- ADDED METADATA FROM STREAMLIT ---
  environment: string;
  detectionType: string;
  adminPin: string;

  // Stats & Metrics
  totalRequests: number;
  totalBlocked: number;
  uniqueClients: number;
  activeConnections: number;
  currentRps: number;
  peakRps: number;
  rpsHistory: number[];
  threatScore: number;

  // Data Feeds
  blockedClients: BlockedClient[];
  liveEvents: LiveEvent[];

  // Actions
  tick: () => void;
  addEvent: (desc: string, sev: "info" | "warn" | "critical") => void;
  executePurge: (inputPin: string) => Promise<boolean>; // Modified to accept PIN
  manualBlock: (ip: string) => Promise<void>;
  clearLogs: () => void;
}

export const useSentinelStore = create<SentinelState>((set, get) => ({
  // --- INITIAL METADATA VALUES ---
  environment: "CRAFT CHASE 2.0",
  detectionType: "Behavioral Fingerprinting",
  adminPin: "1234", // Default PIN matching your earlier requirement

  totalRequests: 0,
  totalBlocked: 0,
  uniqueClients: 0,
  activeConnections: 0,
  currentRps: 0,
  peakRps: 0,
  threatScore: 0,
  rpsHistory: new Array(60).fill(0),
  blockedClients: [],
  liveEvents: [],

  addEvent: (description, severity) => {
    const newEvent: LiveEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString(),
      description,
      severity,
      type: "block"
    };
    set((state) => ({ liveEvents: [newEvent, ...state.liveEvents].slice(0, 15) }));
  },

  clearLogs: () => set({ blockedClients: [], liveEvents: [] }),

  // --- MODIFIED PURGE WITH PIN LOGIC ---
  executePurge: async (inputPin: string) => {
  if (inputPin !== get().adminPin) {
    return false;
  }
  try {
    // UPDATED: Points to the DELETE /logs endpoint from your API docs
    const response = await fetch("http://127.0.0.1:8000/logs", { method: "DELETE" });
    if (response.ok) {
      get().addEvent("SYSTEM PURGE: Supabase Logs Cleared", "critical");
      set({ totalBlocked: 0, blockedClients: [], threatScore: 0 });
      return true;
    }
    return false;
  } catch (e) {
    console.error("Purge failed", e);
    return false;
  }
},

  manualBlock: async (ip) => {
    try {
      await fetch(`http://127.0.0.1:8000/block?ip=${ip}`, { method: "POST" });
      get().addEvent(`MANUAL BLOCK: ${ip} restricted`, "warn");
    } catch (e) {
       console.error("Block failed", e);
    }
  },

 tick: async () => {
  const state = get();
  try {
    const res = await fetch("http://127.0.0.1:8000/stats");
    const data = await res.json();
    
    set({
      currentRps: data.rps,
      peakRps: Math.max(state.peakRps, data.rps),
      // data.total_requests now comes from Supabase via Python
      totalRequests: data.total_requests, 
      totalBlocked: data.blocked_count,
      threatScore: data.threat_score,
      activeConnections: data.active_conns,
      rpsHistory: [...state.rpsHistory.slice(1), data.rps],
      blockedClients: data.recent_blocks || state.blockedClients
    });
  } catch (err) {
    // Keep your working fallback logic
    const fakeRps = Math.floor(Math.random() * 10) + 5;
    set({
      currentRps: fakeRps,
      rpsHistory: [...state.rpsHistory.slice(1), fakeRps]
    });
  }
}
}));