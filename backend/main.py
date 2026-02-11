from fastapi import FastAPI, Request, Header, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from db import supabase
import time, hashlib, os
import httpx

app = FastAPI(title="GuardRail Target API")

REQUEST_COUNTS = {}
LONG_TERM_COUNTS = {}
LAST_CLEANUP = time.time()

ADMIN_DELETE_PIN = os.getenv("ADMIN_DELETE_PIN", "1234")

# ---------------- UTILS ----------------

def cleanup_counts():
    global LAST_CLEANUP
    now = time.time()

    if now - LAST_CLEANUP > 300:  # every 5 mins
        current_window = int(now) // 60
        REQUEST_COUNTS_KEYS = list(REQUEST_COUNTS.keys())
        LONG_TERM_KEYS = list(LONG_TERM_COUNTS.keys())

        for k in REQUEST_COUNTS_KEYS:
            try:
                window = int(k.split(":")[1])
                if window < current_window - 2:
                    del REQUEST_COUNTS[k]
            except:
                pass

        for k in LONG_TERM_KEYS:
            try:
                window = int(k.split(":")[1])
                if window < (int(now) // 600) - 2:
                    del LONG_TERM_COUNTS[k]
            except:
                pass

        LAST_CLEANUP = now

def log_event(ip, user_agent, fingerprint, status, threat_score):
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
        print("DB insert failed:", e)

# ---------------- MIDDLEWARE ----------------

@app.middleware("http")
async def guard_middleware(request: Request, call_next):
    path = request.url.path

    if path in ["/", "/logs", "/logs/count", "/logs/blocked/count", "/docs", "/openapi.json", "/health", "/bot-attack"]:
        return await call_next(request)

    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "unknown"

    ua = request.headers.get("user-agent", "unknown")
    ua_lower = ua.lower()

    fingerprint = hashlib.sha256(f"{ip}:{ua}".encode()).hexdigest()[:16]

    now = int(time.time())
    window_60 = now // 60
    window_10m = now // 600

    key_60 = f"{fingerprint}:{window_60}"
    key_10m = f"{fingerprint}:{window_10m}"

    cleanup_counts()

    REQUEST_COUNTS[key_60] = REQUEST_COUNTS.get(key_60, 0) + 1
    LONG_TERM_COUNTS[key_10m] = LONG_TERM_COUNTS.get(key_10m, 0) + 1

    count_60 = REQUEST_COUNTS[key_60]
    count_10m = LONG_TERM_COUNTS[key_10m]

    threat_score = 10 + count_60 * 5
    status = "allowed"

    # Bot UA heuristic (weak signal)
    if any(x in ua_lower for x in ["python", "curl", "bot", "httpclient"]):
        threat_score += 30

    # Header anomaly detection
    browser_headers = ["accept", "accept-language", "referer", "sec-ch-ua"]
    missing = sum(1 for h in browser_headers if h not in request.headers)
    if missing >= 3:
        threat_score += 25

    # Sensitive endpoint abuse
    if path in ["/login", "/transfer"] and count_60 > 5:
        threat_score += 30

    # Burst detection
    if count_60 > 8:
        threat_score += 30

    # Low-and-slow detection (long window)
    if count_10m > 40:
        threat_score += 35

    if threat_score >= 80:
        status = "blocked"

    log_event(ip, ua, fingerprint, status, threat_score)

    if status == "blocked":
        return JSONResponse(status_code=403, content={"detail": "Blocked by GuardRail"})

    return await call_next(request)

# ---------------- POST ROUTES ----------------

@app.post("/log-test")
async def log_test(request: Request, background_tasks: BackgroundTasks):
    ip = request.client.host
    ua = request.headers.get("user-agent")
    background_tasks.add_task(log_event, ip, ua, "test_fp", "allowed", 5)
    return {"message": "Logged in background"}

@app.post("/login")
def login():
    return {"status": "login ok"}

@app.post("/transfer")
def transfer():
    return {"status": "transfer ok"}

@app.post("/bot-attack")
async def bot_attack():
    target_url = "https://guardrail-twi2.onrender.com/login"

    headers = {"User-Agent": "python-requests/2.32.5"}

    results = []
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

    res = supabase.table("request_logs").delete().neq("id", 0).execute()
    return {"message": "All logs deleted", "deleted_count": len(res.data) if res.data else 0}

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
    res = supabase.table("request_logs").select("id", count="exact").execute()
    return {"total": res.count}

@app.get("/logs/blocked/count")
def get_blocked_count():
    res = supabase.table("request_logs").select("id", count="exact").eq("status", "blocked").execute()
    return {"blocked_total": res.count}
