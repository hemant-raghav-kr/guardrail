import streamlit as st
import pandas as pd
import time
import requests

API_URL = "https://guardrail-twi2.onrender.com/logs"
COUNT_URL = "https://guardrail-twi2.onrender.com/logs/count"
BLOCKED_COUNT_URL = "https://guardrail-twi2.onrender.com/logs/blocked/count"
REFRESH_SECONDS = 2

pd.set_option("display.max_colwidth", 30)

st.set_page_config(page_title="Secure API Abuse Detection", layout="wide")

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

pin = st.sidebar.text_input("Enter Admin PIN", type="password")

if st.sidebar.button("Delete all logs 🚨"):
    if not pin:
        st.sidebar.error("Enter PIN first")
    else:
        try:
            r = requests.delete(
                "https://guardrail-twi2.onrender.com/logs",
                headers={"x-admin-pin": pin},
                timeout=5
            )
            if r.status_code == 200:
                st.success("Logs deleted!")
                st.rerun()
            else:
                st.error("Invalid PIN or delete failed")
        except Exception as e:
            st.error(f"Delete failed: {e}")

# ================= METRICS =================
col1, col2, col3 = st.columns(3)
total_ph = col1.empty()
blocked_ph = col2.empty()
threat_ph = col3.empty()

st.subheader("📈 Traffic Intensity (Requests / Second)")
chart_ph = st.empty()

st.subheader("🚨 Recently Blocked Clients")
table_ph = st.empty()

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

# ================= DATA FETCH =================
try:
    df = pd.DataFrame(requests.get(API_URL, timeout=3).json())
except Exception as e:
    st.error(f"API error: {e}")
    st.stop()

if df.empty:
    st.info("Waiting for logs...")
    st.stop()

df["status"] = df["status"].astype(str).str.upper()
df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
df = df.sort_values("timestamp", ascending=False)

total_requests = requests.get(COUNT_URL).json().get("total", 0)
blocked_requests = requests.get(BLOCKED_COUNT_URL).json().get("blocked_total", 0)

recent_total = len(df)
recent_blocked = len(df[df["status"] == "BLOCKED"])

total_ph.metric("📥 Total Requests (Lifetime)", total_requests)
blocked_ph.metric(
    "🚫 Blocked Requests (Lifetime)",
    blocked_requests,
    delta=f"{round((recent_blocked/max(recent_total,1))*100,1)}% in last {recent_total}"
)

threat = "LOW 🟢" if recent_blocked < 2 else "MEDIUM 🟠" if recent_blocked < 6 else "HIGH 🔴"
threat_ph.metric("Threat Level", threat)

rps_df = df.set_index("timestamp").resample("1S").size()
chart_ph.line_chart(rps_df.tail(30))

blocked_df = df[df["status"] == "BLOCKED"].head(10).rename(columns={
    "ip": "Client IP",
    "status": "Decision",
    "threat_score": "Threat Score"
})

table_ph.dataframe(
    blocked_df.style
    .applymap(decision_style, subset=["Decision"])
    .applymap(threat_style, subset=["Threat Score"])
)

time.sleep(REFRESH_SECONDS)
st.rerun()