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
  environment: string;
  detectionType: string;

  totalRequests: number;
  totalBlocked: number;
  uniqueClients: number;
  activeConnections: number;
  currentRps: number;
  peakRps: number;
  rpsHistory: number[];
  threatScore: number;

  loading: boolean;
  error: string | null;

  blockedClients: BlockedClient[];
  liveEvents: LiveEvent[];

  isAdminTyping: boolean;
  setAdminTyping: (v: boolean) => void;

  tick: () => void;
  addEvent: (desc: string, sev: "info" | "warn" | "critical") => void;
  executePurge: (inputPin: string) => Promise<boolean>;
  triggerBotAttack: () => Promise<boolean>;
  manualBlock: (ip: string) => Promise<void>;
  clearLogs: () => void;
}

export const useSentinelStore = create<SentinelState>((set, get) => ({
  environment: "CODE CRAFT CHASE 2.0",
  detectionType: "Behavioral Fingerprinting",

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

  isAdminTyping: false,
  setAdminTyping: (v) => set({ isAdminTyping: v }),

  addEvent: (description, severity) => {
    const newEvent: LiveEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString(),
      description,
      severity,
      type: "block",
    };
    set((state) => ({
      liveEvents: [newEvent, ...state.liveEvents].slice(0, 15),
    }));
  },

  clearLogs: () => set({ blockedClients: [], liveEvents: [] }),

  executePurge: async (inputPin) => {
    try {
      set({ loading: true, error: null });

      const success = await api.deleteLogs(inputPin);

      if (!success) {
        set({ error: "Invalid PIN or delete failed", loading: false });
        return false;
      }

      get().addEvent("SYSTEM PURGE: Logs Cleared", "critical");

      set({
        totalBlocked: 0,
        blockedClients: [],
        threatScore: 0,
        loading: false,
        error: null,
      });

      return true;
    } catch (e) {
      console.error("Purge failed:", e);
      set({ error: "Delete failed", loading: false });
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
      }

      set({ error: "Failed to trigger bot attack" });
      return false;
    } catch (e) {
      console.error("Bot attack failed:", e);
      set({ error: "Bot attack failed", loading: false });
      return false;
    }
  },

  manualBlock: async (ip) => {
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

    get().addEvent(`MANUAL BLOCK: ${ip}`, "warn");

    set((state) => ({
      blockedClients: [newClient, ...state.blockedClients].slice(0, 50),
      totalBlocked: state.totalBlocked + 1,
    }));
  },

  tick: async () => {
    const state = get();
    if (state.isAdminTyping) return;

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
      const currentRps = recentLogs.length;

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
      console.error("Tick failed:", err);
      set({ error: "Data fetch failed", loading: false });
    }
  },
}));