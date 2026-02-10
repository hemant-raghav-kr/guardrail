import streamlit as st
import pandas as pd
import requests
import time

# --- Configuration ---
API_URL = "https://guardrail-twi2.onrender.com/logs"
COUNT_URL = "https://guardrail-twi2.onrender.com/logs/count"
BLOCKED_COUNT_URL = "https://guardrail-twi2.onrender.com/logs/blocked/count"
DELETE_URL = "https://guardrail-twi2.onrender.com/logs"

REFRESH_SECONDS = 2

st.set_page_config(page_title="Guardrail", layout="wide")

st.markdown("""
# 🛡️ Secure API Abuse & Rate-Limit Bypass Detection  
**Real-time behavioral security monitoring dashboard**
""")
st.caption("Live traffic • Behavioral analysis • Automated blocking")
st.divider()

# ================= SIDEBAR =================
st.sidebar.title("⚙️ Dashboard Info")
st.sidebar.markdown("**Environment:** Hackathon Simulation")
st.sidebar.markdown("**Detection Type:** Behavioral Fingerprinting")
st.sidebar.markdown("**Protection:** Active")
st.sidebar.markdown("**Mode:** API")

st.sidebar.divider()
st.sidebar.subheader("🗑️ Admin Controls")

# Input for PIN
pin = st.sidebar.text_input("Enter Admin PIN", type="password")

# Delete Logic
if st.sidebar.button("Delete all logs 🚨"):
    if not pin:
        st.sidebar.error("Enter PIN first")
    else:
        try:
            r = requests.delete(DELETE_URL, headers={"x-admin-pin": pin}, timeout=5)
            if r.status_code == 200:
                st.sidebar.success("Logs deleted!")
                time.sleep(1) # Give user time to read message
                st.rerun()
            else:
                st.sidebar.error("Invalid PIN or delete failed")
        except Exception as e:
            st.sidebar.error(f"Delete failed: {e}")

# ================= SAFE DATA FETCH =================
# Initialize default empty dataframe to prevent crashes
df = pd.DataFrame(columns=["status", "timestamp", "ip", "threat_score"])

try:
    resp = requests.get(API_URL, timeout=5)
    if resp.status_code == 200:
        raw = resp.json()
        if isinstance(raw, list) and len(raw) > 0:
            df = pd.DataFrame(raw)
except Exception as e:
    st.error(f"API Connection Error: {e}")

# Process Data if exists
if not df.empty:
    # Ensure columns exist
    for col in ["status", "timestamp", "ip", "threat_score"]:
        if col not in df.columns:
            df[col] = None

    df["status"] = df["status"].astype(str).str.upper()
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df = df.sort_values("timestamp", ascending=False)

# ================= COUNTS =================
try:
    total_requests = requests.get(COUNT_URL, timeout=5).json().get("total", 0)
except:
    total_requests = 0

try:
    blocked_requests = requests.get(BLOCKED_COUNT_URL, timeout=5).json().get("blocked_total", 0)
except:
    blocked_requests = 0

recent_total = len(df)
recent_blocked = len(df[df["status"] == "BLOCKED"]) if not df.empty else 0

# ================= METRICS =================
col1, col2, col3 = st.columns(3)
col1.metric("📥 Total Requests (Lifetime)", total_requests)

# Avoid divide by zero
percentage = (recent_blocked / recent_total * 100) if recent_total > 0 else 0
col2.metric(
    "🚫 Blocked Requests (Lifetime)",
    blocked_requests,
    delta=f"{round(percentage, 1)}% in last {recent_total}"
)

threat = "LOW 🟢: You are safe." if recent_blocked < 2 else "MEDIUM 🟠: You are under moderate threat." if recent_blocked < 6 else "HIGH 🔴: Critical threat detected!"
col3.metric("Threat Level", threat)

# ================= GRAPH =================
st.subheader("📈 Traffic Intensity (Requests / Second)")

if not df.empty and df["timestamp"].notna().any():
    try:
        rps_df = df.set_index("timestamp").resample("1s").size()
        st.line_chart(rps_df.tail(30))
    except Exception as e:
        st.caption("Not enough data to generate graph yet.")
else:
    st.info("Waiting for traffic to generate graph...")

# ================= BLOCKED TABLE =================
st.subheader("🚨 Recently Blocked Clients")

def threat_style(val):
    try:
        val = int(val)
    except:
        return ""
    if val >= 80:
        return "background-color:#d32f2f; color:white; font-weight:bold"
    elif val >= 60:
        return "background-color:#ffa000; color:black; font-weight:bold"
    return "background-color:#c8e6c9; color:black"

def decision_style(val):
    return "color:#d32f2f; font-weight:bold" if str(val).upper() == "BLOCKED" else "color:#2e7d32"

if not df.empty:
    blocked_df = df[df["status"] == "BLOCKED"].head(10).rename(columns={
        "ip": "Client IP",
        "status": "Decision",
        "threat_score": "Threat Score"
    })

    if not blocked_df.empty:
        # subset checks ensure we only style columns that actually exist
        st.dataframe(
            blocked_df.style
                .map(decision_style, subset=["Decision"])
                .map(threat_style, subset=["Threat Score"])
        )
    else:
        st.caption("No blocked requests in current logs.")
else:
    st.caption("No data available.")

# ================= AUTO REFRESH =================
# This is the safe way to refresh that doesn't clear your Input text
time.sleep(REFRESH_SECONDS)
st.rerun()