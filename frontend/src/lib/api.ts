// API client for communicating with FastAPI backend
const API_BASE_URL = "https://guardrail-twi2.onrender.com";

export interface Log {
  id?: string | number;
  timestamp?: string;
  ip: string;
  user_agent?: string;
  fingerprint?: string;
  status?: string;       // "blocked" | "allowed"
  threat_score?: number;
}

export interface LogCountResponse {
  total: number;
}

export interface BlockedCountResponse {
  blocked_total: number;
}

// ---------------- FETCH LOGS ----------------

export async function getLogs(): Promise<Log[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/logs`);
    if (!res.ok) throw new Error("Failed to fetch logs");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Error fetching logs:", e);
    return [];
  }
}

// ---------------- FETCH COUNTS ----------------

export async function getTotalRequestsCount(): Promise<number> {
  try {
    const res = await fetch(`${API_BASE_URL}/logs/count`);
    if (!res.ok) throw new Error("Failed to fetch total count");
    const data: LogCountResponse = await res.json();
    return data.total ?? 0;
  } catch (e) {
    console.error("Error fetching logs count:", e);
    return 0;
  }
}

export async function getBlockedRequestsCount(): Promise<number> {
  try {
    const res = await fetch(`${API_BASE_URL}/logs/blocked/count`);
    if (!res.ok) throw new Error("Failed to fetch blocked count");
    const data: BlockedCountResponse = await res.json();
    return data.blocked_total ?? 0;
  } catch (e) {
    console.error("Error fetching blocked count:", e);
    return 0;
  }
}

// ---------------- BOT ATTACK ----------------

export async function triggerBotAttack(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/bot-attack`, { method: "POST" });
    return res.ok;
  } catch (e) {
    console.error("Error triggering bot attack:", e);
    return false;
  }
}

// ---------------- DELETE LOGS ----------------

export async function deleteLogs(adminPin: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/logs`, {
      method: "DELETE",
      headers: {
        "x-admin-pin": adminPin
      }
    });
    return res.ok;
  } catch (e) {
    console.error("Error deleting logs:", e);
    return false;
  }
}

// ---------------- MAPPERS ----------------

export function logsToBlockedClients(logs: Log[]) {
  if (!Array.isArray(logs)) return [];

  return logs
    .filter((log) => log.status === "blocked")
    .map((log, index) => ({
      id: log.id?.toString() || `blocked-${index}`,
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
  if (!Array.isArray(logs)) return [];

  return logs.map((log, index) => {
    const isBlocked = log.status === "blocked";

    return {
      id: log.id?.toString() || `event-${index}`,
      timestamp: log.timestamp || new Date().toISOString(),
      description: isBlocked
        ? `Request from ${log.ip} BLOCKED`
        : `Request from ${log.ip} allowed`,
      severity: (isBlocked ? "critical" : "info") as "info" | "warn" | "critical",
      type: (isBlocked ? "block" : "burst") as "burst" | "threshold" | "block" | "admin" | "rule",
    };
  });
}
