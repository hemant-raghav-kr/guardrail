// API client for communicating with FastAPI backend
const API_BASE_URL = "https://guardrail-twi2.onrender.com";

export interface Log {
  id?: string | number;
  timestamp: string;
  method?: string;
  path?: string;
  ip: string;
  status?: number;
  blocked: boolean;
  reason?: string;
  user_agent?: string;
  fingerprint?: string;
  threat_score?: number;
}

export interface LogCountResponse {
  total: number;
}

export interface BlockedCountResponse {
  blocked_total: number;
}

// Fetch recent request logs
export async function getLogs(): Promise<Log[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/logs`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch logs: ${response.statusText}`);
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : data.logs || [];
  } catch (error) {
    console.error("Error fetching logs:", error);
    return [];
  }
}

// Fetch total request count
export async function getTotalRequestsCount(): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/logs/count`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch logs count: ${response.statusText}`);
    }
    
    const data: LogCountResponse = await response.json();
    return data.total ?? 0;
  } catch (error) {
    console.error("Error fetching logs count:", error);
    return 0;
  }
}

// Fetch blocked request count
export async function getBlockedRequestsCount(): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/logs/blocked/count`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch blocked count: ${response.statusText}`);
    }
    
    const data: BlockedCountResponse = await response.json();
    return data.blocked_total ?? 0;
  } catch (error) {
    console.error("Error fetching blocked count:", error);
    return 0;
  }
}

// Trigger bot attack simulation
export async function triggerBotAttack(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/bot-attack`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to trigger bot attack: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error("Error triggering bot attack:", error);
    return false;
  }
}

// Delete logs (requires admin PIN in header)
export async function deleteLogs(adminPin: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/logs`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-admin-pin": adminPin,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete logs: ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting logs:", error);
    return false;
  }
}

// Helper function to convert logs to blocked clients format
export function logsToBlockedClients(logs: Log[]): any[] {
  if (!Array.isArray(logs)) {
    return [];
  }

  return logs
    .filter((log) => log && log.blocked === true)
    .map((log, index) => {
      const ip = log.ip || "unknown";
      return {
        id: log.id ? String(log.id) : `${log.timestamp}-${index}`,
        timestamp: log.timestamp || new Date().toISOString(),
        clientIp: ip,
        userAgent: log.user_agent || "Unknown",
        fingerprint: log.fingerprint || `FP-${ip.split(".").slice(0, 2).join("-")}`,
        decision: "BLOCKED" as const,
        threatScore: Math.min(100, Math.max(0, Math.floor(log.threat_score || 75))),
        reason: log.reason || "Threat Detected",
        endpoint: log.path || "/",
        rpsAtTime: Math.floor(Math.random() * 1000) + 100,
      };
    });
}

// Helper function to create live events from logs
export function logsToLiveEvents(logs: Log[]): any[] {
  if (!Array.isArray(logs)) {
    return [];
  }

  return logs
    .filter((log) => log)
    .map((log, index) => {
      const method = log.method || "REQUEST";
      const path = log.path || "/";
      const ip = log.ip || "unknown";
      const isBlocked = log.blocked === true;

      return {
        id: log.id ? String(log.id) : `event-${index}`,
        timestamp: log.timestamp || new Date().toISOString(),
        description: isBlocked
          ? `${method} ${path} from ${ip} - BLOCKED`
          : `${method} ${path} from ${ip} - Allowed`,
        severity: (isBlocked ? "critical" : "info") as "info" | "warn" | "critical",
        type: (isBlocked ? "block" : "burst") as "burst" | "threshold" | "block" | "admin" | "rule",
      };
    });
}
