import streamlit as st
import pandas as pd
import requests
import time

# --- Configuration ---
API_URL = "https://guardrail-twi2.onrender.com/logs"
COUNT_URL = "https://guardrail-twi2.onrender.com/logs/count"
BLOCKED_COUNT_URL = "https://guardrail-twi2.onrender.com/logs/blocked/count"
DELETE_URL = "https://guardrail-twi2.onrender.com/logs"

# Refresh every 5 seconds to prevent UI glitches while typing
REFRESH_SECONDS = 5 

st.set_page_config(page_title="Guardrail", layout="wide")

st.markdown("""
# 🛡️ Secure API Abuse & Rate-Limit Bypass Detection  
**Real-time behavioral security monitoring dashboard**
""")
st.caption("Live traffic • Behavioral analysis • Automated blocking")
st.divider()

# ================= SIDEBAR =================
st.sidebar.title("⚙️ Dashboard Info")
st.sidebar.markdown("**Environment:** Built for CODE CRAFT CHASE 2.0")
st.sidebar.markdown("**Detection Type:** Behavioral Fingerprinting")
st.sidebar.markdown("**Protection:** Active")
st.sidebar.markdown("**Mode:** API")

st.sidebar.divider()
st.sidebar.subheader("🗑️ Admin Controls")

# Input for PIN
pin = st.sidebar.text_input("Enter Admin PIN", type="password")

# --- CORRECTED DELETE LOGIC ---
if st.sidebar.button("Delete all logs 🚨"):
    if not pin:
        st.sidebar.error("Enter PIN first")
    else:
        success = False
        try:
            r = requests.delete(DELETE_URL, headers={"x-admin-pin": pin}, timeout=5)
            if r.status_code == 200:
                success = True
                # Use st.toast for a temporary popup that fades automatically
                st.toast("Logs deleted successfully!", icon="✅")
            else:
                st.sidebar.error("Invalid PIN or delete failed")
        except Exception as e:
            st.sidebar.error(f"Delete failed: {e}")
        
        # Rerun MUST happen outside the try/except block
        if success:
            time.sleep(1) 
            st.rerun()

# ================= SAFE DATA FETCH =================
df = pd.DataFrame(columns=["status", "timestamp", "ip", "threat_score"])

try:
    resp = requests.get(API_URL, timeout=5)
    if resp.status_code == 200:
        raw = resp.json()
        if isinstance(raw, list) and len(raw) > 0:
            df = pd.DataFrame(raw)
except Exception as e:
    st.error(f"API Connection Error: {e}")

# Process Data
if not df.empty:
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
col1, col2, col3 = st.columns([1, 1, 3])

col1.metric("📥 Total Requests (Lifetime)", total_requests)

col2.metric(
    "🚫 Blocked Requests (Lifetime)",
    blocked_requests,
    delta=f"{round((recent_blocked/max(recent_total,1))*100,1)}% in last {recent_total}"
)

threat = "HIGH 🔴 : Critical threat detected!" if recent_blocked >= 6 else "MEDIUM 🟡 : Elevated risk" if recent_blocked >= 2 else "LOW 🟢 : Normal traffic"
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
        # Safe map method for all Pandas versions
        styler = blocked_df.style
        map_method = getattr(styler, "map", styler.applymap)
        
        st.dataframe(
            map_method(decision_style, subset=["Decision"])
            .map(threat_style, subset=["Threat Score"])
        )
    else:
        st.caption("No blocked requests in current logs.")
else:
    st.caption("No data available.")

# ================= AUTO REFRESH =================
time.sleep(REFRESH_SECONDS)
st.rerun()