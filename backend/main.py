from fastapi import FastAPI, Request
from db import supabase
from fastapi.responses import JSONResponse
import time
import hashlib

app = FastAPI(title="GuardRail Target API")
REQUEST_COUNTS = {}

LOG_DASHBOARD_REQUESTS = False  # 🔴 turn OFF DB logging for dashboard polling

def log_event(ip, user_agent, fingerprint, status, threat_score):
    data = {
        "ip": ip,
        "user_agent": user_agent,
        "fingerprint": fingerprint,
        "status": status,  # lowercase always
        "threat_score": threat_score
    }
    try:
        supabase.table("request_logs").insert(data).execute()
    except Exception as e:
        print("DB insert failed:", e)

@app.middleware("http")
async def guard_middleware(request: Request, call_next):
    path = request.url.path

    # ❌ Don't guard/log dashboard & docs endpoints
    if path in ["/logs", "/logs/count", "/logs/blocked/count", "/docs", "/openapi.json", "/health"]:
        response = await call_next(request)
        return response

    ip = request.client.host if request.client else "unknown"
    ua = request.headers.get("user-agent", "unknown")

    fingerprint = hashlib.sha256(f"{ip}:{ua}".encode()).hexdigest()[:16]

    now = int(time.time())
    window = now // 60
    key = f"{fingerprint}:{window}"
    REQUEST_COUNTS[key] = REQUEST_COUNTS.get(key, 0) + 1
    count = REQUEST_COUNTS[key]

    threat_score = 10 + count * 5
    status = "allowed"

    ua_lower = ua.lower()

    if "python" in ua_lower or "curl" in ua_lower or "bot" in ua_lower:
        threat_score = 95
        status = "blocked"

    if path in ["/login", "/transfer"] and count > 5:
        threat_score = max(threat_score, 85)
        status = "blocked"

    if count > 10:
        threat_score = 90
        status = "blocked"

    log_event(ip, ua, fingerprint, status, threat_score)
    print(f"[GUARD] {ip} {path} {status} score={threat_score}")

    if status == "blocked":
        return JSONResponse(status_code=403, content={"detail": "Blocked by GuardRail"})

    return await call_next(request)

@app.get("/")
def root():
    return {"status": "API running"}

@app.get("/health")
def health():
    return {"api": "ok", "db": "connected"}

@app.post("/log-test")
async def log_test(request: Request):
    ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent")
    log_event(ip, user_agent, "test_fp", "allowed", 5)
    return {"message": "Logged to Supabase"}

@app.post("/login")
def login():
    return {"status": "login ok"}

@app.post("/transfer")
def transfer():
    return {"status": "transfer ok"}

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
    res = supabase.table("request_logs") \
        .select("id", count="exact") \
        .eq("status", "blocked") \
        .execute()
    return {"blocked_total": res.count}
