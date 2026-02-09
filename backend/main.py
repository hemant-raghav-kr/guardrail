from fastapi import FastAPI, Request
from db import supabase
from fastapi.responses import JSONResponse
import time
import hashlib
import requests

app = FastAPI(title="GuardRail Target API")
REQUEST_COUNTS = {}

LOG_DASHBOARD_REQUESTS = False
DEMO_BOT_MODE = True

# ================= HELPERS =================

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

# ================= MIDDLEWARE =================

@app.middleware("http")
async def guard_middleware(request: Request, call_next):
    path = request.url.path

    if path in ["/logs", "/logs/count", "/logs/blocked/count", "/docs", "/openapi.json", "/health", "/bot-attack"]:
        return await call_next(request)

    ip = request.client.host if request.client else "unknown"
    ua = request.headers.get("user-agent", "unknown")
    ua_lower = ua.lower()

    fingerprint = hashlib.sha256(f"{ip}:{ua}".encode()).hexdigest()[:16]

    now = int(time.time())
    window = now // 60
    key = f"{fingerprint}:{window}"
    REQUEST_COUNTS[key] = REQUEST_COUNTS.get(key, 0) + 1
    count = REQUEST_COUNTS[key]

    threat_score = 10 + count * 5
    status = "allowed"

    bot_flag = request.headers.get("x-bot-attack", "false").lower() == "true"
    if DEMO_BOT_MODE and bot_flag:
        threat_score = 99
        status = "blocked"

    if ("python" in ua_lower or "curl" in ua_lower) and not ua_lower.startswith("mozilla"):
        threat_score = 95
        status = "blocked"

    if path in ["/login", "/transfer"] and count > 10:
        threat_score = 90
        status = "blocked"

    if count > 15:
        threat_score = 95
        status = "blocked"

    log_event(ip, ua, fingerprint, status, threat_score)
    print(f"[GUARD] {ip} {path} {status} score={threat_score}")

    if status == "blocked":
        return JSONResponse(status_code=403, content={"detail": "Blocked by GuardRail"})

    return await call_next(request)

# ================= POST ROUTES =================

@app.post("/log-test")
async def log_test(request: Request):
    ip = request.client.host if request.client else "unknown"
    ua = request.headers.get("user-agent")
    log_event(ip, ua, "test_fp", "allowed", 5)
    return {"message": "Logged to Supabase"}

@app.post("/login")
def login():
    return {"status": "login ok"}

@app.post("/transfer")
def transfer():
    return {"status": "transfer ok"}

@app.post("/bot-attack")
def bot_attack():
    target_url = "https://guardrail-twi2.onrender.com/login"

    headers = {
        "User-Agent": "python-requests/2.32.5",
        "x-bot-attack": "true"
    }

    results = []
    for _ in range(15):
        try:
            r = requests.post(target_url, headers=headers, timeout=2)
            results.append(r.status_code)
        except Exception as e:
            results.append(str(e))

    return {
        "message": "Bot attack simulated",
        "hits_sent": 15,
        "results": results
    }

# ================= DELETE ROUTES =================

@app.delete("/logs")
def delete_logs():
    res = supabase.table("request_logs").delete().gt("id", 0).execute()
    return {
        "message": "All logs deleted",
        "deleted_count": len(res.data) if res.data else 0
    }

# ================= GET ROUTES =================

@app.get("/")
def root():
    return {"status": "API running"}

@app.get("/health")
def health():
    return {"api": "ok", "db": "connected"}

@app.get("/home")
def home():
    return {"status": "home ok"}

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