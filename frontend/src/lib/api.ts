// src/lib/api.ts
const API_BASE_URL = "https://guardrail-twi2.onrender.com";

export interface Log {
  id?: string | number;
  timestamp?: string;
  ip: string;
  user_agent?: string;
  fingerprint?: string;
  status?: string;
  threat_score?: number;
}

export async function getLogs(): Promise<Log[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/logs`);
    if (!res.ok) throw new Error("Failed to fetch logs");
    return await res.json();
  } catch (e) {
    console.error("getLogs error:", e);
    return [];
  }
}

export async function getTotalRequestsCount(): Promise<number> {
  try {
    const res = await fetch(`${API_BASE_URL}/logs/count`);
    if (!res.ok) throw new Error("Failed to fetch count");
    const data = await res.json();
    return data.total ?? 0;
  } catch (e) {
    console.error("getTotalRequestsCount error:", e);
    return 0;
  }
}

export async function getBlockedRequestsCount(): Promise<number> {
  try {
    const res = await fetch(`${API_BASE_URL}/logs/blocked/count`);
    if (!res.ok) throw new Error("Failed to fetch blocked count");
    const data = await res.json();
    return data.blocked_total ?? 0;
  } catch (e) {
    console.error("getBlockedRequestsCount error:", e);
    return 0;
  }
}

export async function triggerBotAttack(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/bot-attack`, { method: "POST" });
    return res.ok;
  } catch (e) {
    console.error("triggerBotAttack error:", e);
    return false;
  }
}

export async function deleteLogs(adminPin: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/logs`, {
      method: "DELETE",
      headers: {
        "x-admin-pin": adminPin,
      },
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("Delete failed:", txt);
      return false;
    }

    return true;
  } catch (e) {
    console.error("deleteLogs error:", e);
    return false;
  }
}

export function logsToBlockedClients(logs: Log[]) {
  return logs
    .filter((log) => log.status === "blocked")
    .map((log, i) => ({
      id: log.id?.toString() || `blocked-${i}`,
      timestamp: log.timestamp || new Date().toISOString(),
      clientIp: log.ip,
      userAgent: log.user_agent || "Unknown",
      fingerprint: log.fingerprint || "N/A",
      decision: "BLOCKED" as const,
      threatScore: log.threat_score || 80,
      reason: "Threat Detected",
      endpoint: "/",
      rpsAtTime: Math.floor(Math.random() * 40) + 1,
    }));
}

export function logsToLiveEvents(logs: Log[]) {
  return logs.map((log, i) => {
    const isBlocked = log.status === "blocked";
    return {
      id: log.id?.toString() || `event-${i}`,
      timestamp: log.timestamp || new Date().toISOString(),
      description: isBlocked
        ? `Request from ${log.ip} BLOCKED`
        : `Request from ${log.ip} allowed`,
      severity: (isBlocked ? "critical" : "info") as
        | "info"
        | "warn"
        | "critical",
      type: (isBlocked ? "block" : "burst") as
        | "burst"
        | "threshold"
        | "block"
        | "admin"
        | "rule",
    };
  });
}
