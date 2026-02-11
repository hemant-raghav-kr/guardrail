from fastapi import FastAPI, Request, Header, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from db import supabase
import time, hashlib, os
import httpx  # You must install this: pip install httpx

app = FastAPI(title="GuardRail Target API")

# Store request counts in memory (In production, use Redis)
REQUEST_COUNTS = {}
LAST_CLEANUP = time.time()

# Get PIN from environment variable (safer)
ADMIN_DELETE_PIN = os.getenv("ADMIN_DELETE_PIN", "1234") 

# ---------------- UTILS ----------------

def cleanup_counts():
    """Removes old keys to prevent memory leaks."""
    global LAST_CLEANUP
    now = time.time()
    # Cleanup every 5 minutes
    if now - LAST_CLEANUP > 300:
        current_window = int(now) // 60
        # Remove keys older than 2 minutes ago
        keys_to_delete = [k for k in REQUEST_COUNTS.keys() if int(k.split(":")[1]) < current_window - 2]
        for k in keys_to_delete:
            del REQUEST_COUNTS[k]
        LAST_CLEANUP = now

def log_event(ip: str, user_agent: str, fingerprint: str, status: str, threat_score: int):
    """
    Logs the request details to Supabase.
    This runs in the background to avoid slowing down the response.
    """
    data = {
        "ip": ip,
        "user_agent": user_agent,
        "fingerprint": fingerprint,
        "status": status,
        "threat_score": threat_score
    }
    try:
        supabase.table("request_logs").insert(data).execute()
    except Exception as e:
        print(f"DB insert failed: {e}")

# ---------------- MIDDLEWARE ----------------

@app.middleware("http")
async def guard_middleware(request: Request, call_next):
    path = request.url.path

    # Allow certain paths to bypass checks (health, docs, etc.)
    if path in ["/", "/logs", "/logs/count", "/logs/blocked/count", "/docs", "/openapi.json", "/health", "/bot-attack"]:
        return await call_next(request)

    # 1. CORRECT IP DETECTION (Fixes proxy issue on Render)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip = forwarded.split(",")[0]
    else:
        ip = request.client.host if request.client else "unknown"

    ua = request.headers.get("user-agent", "unknown")
    ua_lower = ua.lower()

    # Create a fingerprint (IP + User Agent)
    fingerprint = hashlib.sha256(f"{ip}:{ua}".encode()).hexdigest()[:16]

    # Time window logic (1 minute buckets)
    now = int(time.time())
    window = now // 60
    key = f"{fingerprint}:{window}"
    
    # 2. MEMORY MANAGEMENT
    cleanup_counts()

    REQUEST_COUNTS[key] = REQUEST_COUNTS.get(key, 0) + 1
    count = REQUEST_COUNTS[key]

    # Scoring Logic
    threat_score = 10 + count * 5
    status = "allowed"

    # Rule: Block known bot User-Agents
    if "python" in ua_lower or "curl" in ua_lower or "bot" in ua_lower:
        threat_score = 95
        status = "blocked"

    # Rule: Protect sensitive endpoints
    if path in ["/login", "/transfer"] and count > 10:
        threat_score = max(threat_score, 85)
        status = "blocked"

    # Rule: Rate Limit (Global)
    if count > 15:
        threat_score = 90
        status = "blocked"

    log_event(ip, ua, fingerprint, status, threat_score)

    if status == "blocked":
        return JSONResponse(status_code=403, content={"detail": "Blocked by GuardRail"})

    return await call_next(request)

# ---------------- POST ROUTES ----------------

@app.post("/log-test")
async def log_test(request: Request, background_tasks: BackgroundTasks):
    ip = request.client.host
    user_agent = request.headers.get("user-agent")
    # Correct way to use background tasks in endpoints
    background_tasks.add_task(log_event, ip, user_agent, "test_fp", "allowed", 5)
    return {"message": "Logged in background"}

@app.post("/login")
def login():
    return {"status": "login ok"}

@app.post("/transfer")
def transfer():
    return {"status": "transfer ok"}

@app.post("/bot-attack")
async def bot_attack():
    # Targets the self-same server (Dynamic URL detection would be better)
    target_url = "https://guardrail-twi2.onrender.com/login"
    
    headers = {
        "User-Agent": "python-requests/2.32.5" # Explicitly identify as a bot
    }

    results = []
    
    # 4. PREVENT DEADLOCK (Use Async Client)
    async with httpx.AsyncClient() as client:
        for _ in range(15):
            try:
                r = await client.post(target_url, headers=headers, timeout=2)
                results.append(r.status_code)
            except Exception as e:
                results.append(str(e))

    return {"message": "Bot attack simulated", "hits": 15, "results": results}

# ---------------- DELETE ROUTE ----------------

@app.delete("/logs")
def delete_logs(x_admin_pin: str = Header(None)):
    if x_admin_pin != ADMIN_DELETE_PIN:
        raise HTTPException(status_code=401, detail="Invalid PIN")

    try:
        res = supabase.table("request_logs").delete().neq("id", 0).execute()
        count = len(res.data) if res.data else 0
        return {"message": "All logs deleted", "deleted_count": count}
    except Exception as e:
        return {"error": str(e)}

# ---------------- GET ROUTES ----------------

@app.get("/")
def root():
    return {"status": "API running"}

@app.get("/health")
def health():
    return {"api": "ok", "db": "connected"}

@app.get("/logs")
def get_logs(limit: int = 20):
    res = supabase.table("request_logs").select("*").order("id", desc=True).limit(limit).execute()
    return res.data

@app.get("/logs/count")
def get_log_count():
    # Note: 'exact' count can be slow on large tables
    res = supabase.table("request_logs").select("id", count="exact").execute()
    return {"total": res.count}

@app.get("/logs/blocked/count")
def get_blocked_count():
    res = supabase.table("request_logs").select("id", count="exact").eq("status", "blocked").execute()
    return {"blocked_total": res.count}