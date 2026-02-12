import { create } from "zustand";
import * as api from "@/lib/api";

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
  
  // Loading & Error States
  loading: boolean;
  error: string | null;

  // Data Feeds
  blockedClients: BlockedClient[];
  liveEvents: LiveEvent[];

  // Actions
  tick: () => void;
  addEvent: (desc: string, sev: "info" | "warn" | "critical") => void;
  executePurge: (inputPin: string) => Promise<boolean>; // Modified to accept PIN
  triggerBotAttack: () => Promise<boolean>;
  manualBlock: (ip: string) => Promise<void>;
  clearLogs: () => void;
}

export const useSentinelStore = create<SentinelState>((set, get) => ({
  // --- INITIAL METADATA VALUES ---
  environment: "CRAFT CHASE 2.0",
  detectionType: "Behavioral Fingerprinting",
  adminPin: "1234",

  totalRequests: 0,
  totalBlocked: 0,
  uniqueClients: 0,
  activeConnections: 0,
  currentRps: 0,
  peakRps: 0,
  threatScore: 0,
  rpsHistory: new Array(60).fill(0),
  loading: false,
  error: null,
  blockedClients: [],
  liveEvents: [],

  addEvent: (description, severity) => {
    const newEvent: LiveEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString(),
      description,
      severity,
      type: "block",
    };
    set((state) => ({ liveEvents: [newEvent, ...state.liveEvents].slice(0, 15) }));
  },

  clearLogs: () => set({ blockedClients: [], liveEvents: [] }),

  executePurge: async (inputPin: string) => {
    if (inputPin !== get().adminPin) {
      set({ error: "Invalid PIN" });
      return false;
    }
    try {
      set({ loading: true, error: null });
      const success = await api.deleteLogs(inputPin);
      if (success) {
        get().addEvent("SYSTEM PURGE: Logs Cleared", "critical");
        set({
          totalBlocked: 0,
          blockedClients: [],
          threatScore: 0,
          loading: false,
          error: null,
        });
        return true;
      }
      set({ error: "Failed to delete logs", loading: false });
      return false;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Purge failed";
      console.error("Purge failed", e);
      set({ error: errorMsg, loading: false });
      return false;
    }
  },

  triggerBotAttack: async () => {
    try {
      set({ loading: true, error: null });
      const success = await api.triggerBotAttack();
      set({ loading: false });
      if (success) {
        get().addEvent("BOT ATTACK SIMULATION TRIGGERED", "warn");
        return true;
      } else {
        set({ error: "Failed to trigger bot attack" });
        return false;
      }
    } catch (e) {
      const errorMsg =
        e instanceof Error ? e.message : "Bot attack trigger failed";
      console.error("Bot attack trigger failed", e);
      set({ error: errorMsg, loading: false });
      return false;
    }
  },

  manualBlock: async (ip) => {
    try {
      const newClient: BlockedClient = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        clientIp: ip,
        userAgent: "Manual Block",
        fingerprint: "ADMIN",
        decision: "BLOCKED",
        threatScore: 100,
        reason: "Manual Action",
        endpoint: "/admin",
        rpsAtTime: get().currentRps,
      };
      get().addEvent(`MANUAL BLOCK: ${ip} restricted`, "warn");
      set((state) => ({
        blockedClients: [newClient, ...state.blockedClients].slice(0, 50),
        totalBlocked: state.totalBlocked + 1,
      }));
    } catch (e) {
      console.error("Block failed", e);
    }
  },

  tick: async () => {
    const state = get();
    try {
      set({ loading: true, error: null });

      const [logs, totalCount, blockedCount] = await Promise.all([
        api.getLogs(),
        api.getTotalRequestsCount(),
        api.getBlockedRequestsCount(),
      ]);

      const blockedClients = api.logsToBlockedClients(logs);
      const liveEvents = api.logsToLiveEvents(logs);

      const recentLogs = logs.slice(0, 60);
      const currentRps =
        recentLogs.length > 0
          ? Math.floor(recentLogs.length / (60 / 60))
          : 0;

      const threatScore =
        totalCount > 0
          ? Math.min(100, Math.round((blockedCount / totalCount) * 100))
          : 0;

      set({
        totalRequests: totalCount,
        totalBlocked: blockedCount,
        blockedClients: blockedClients.slice(0, 50),
        liveEvents: liveEvents.slice(0, 15),
        currentRps,
        peakRps: Math.max(state.peakRps, currentRps),
        rpsHistory: [...state.rpsHistory.slice(1), currentRps],
        threatScore,
        loading: false,
        error: null,
      });
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Data fetch failed";
      console.error("Tick failed:", err);

      const fakeRps = Math.floor(Math.random() * 10) + 5;
      set({
        currentRps: fakeRps,
        rpsHistory: [...state.rpsHistory.slice(1), fakeRps],
        loading: false,
        error: errorMsg,
      });
    }
  },
}));