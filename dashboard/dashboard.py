import streamlit as st
import pandas as pd
import time
from datetime import datetime
import requests

API_URL = "http://127.0.0.1:8000/logs"  # change to your IP if needed
MODE = "API"
REFRESH_SECONDS = 1

pd.set_option("display.max_colwidth", 30)

# ================= PAGE SETUP =================
st.set_page_config(page_title="Secure API Abuse Detection", layout="wide")

# ================= HEADER =================
st.markdown(
    """
    # 🛡️ Secure API Abuse & Rate-Limit Bypass Detection  
    **Real-time behavioral security monitoring dashboard**
    """
)
st.caption("Live traffic • Behavioral analysis • Automated blocking")
st.divider()

# ================= SIDEBAR =================
st.sidebar.title("⚙️ Dashboard Info")
st.sidebar.markdown("**Environment:** Hackathon Simulation")
st.sidebar.markdown("**Detection Type:** Behavioral Fingerprinting")
st.sidebar.markdown("**Protection:** Active")
st.sidebar.markdown(f"**Mode:** {MODE}")

# ================= METRICS =================
col1, col2, col3 = st.columns(3)
total_ph = col1.empty()
blocked_ph = col2.empty()
threat_ph = col3.empty()

st.divider()

# ================= CHART =================
st.subheader("📈 Traffic Intensity (Requests / Second)")
st.caption("Sudden spikes indicate automated or abusive behavior")
chart_ph = st.empty()

st.divider()

# ================= TABLE =================
st.subheader("🚨 Recently Blocked Clients")
st.caption("High threat scores indicate bot-like or abusive behavior")
table_ph = st.empty()

# ================= STYLING FUNCTIONS =================
def threat_style(val):
    try:
        val = int(val)
    except:
        return ""
    if val >= 80:
        return "background-color:#d32f2f; color:white; font-weight:bold"
    elif val >= 60:
        return "background-color:#ffa000; color:black; font-weight:bold"
    else:
        return "background-color:#c8e6c9; color:black"

def decision_style(val):
    if str(val).upper() == "BLOCKED":
        return "color:#d32f2f; font-weight:bold"
    return "color:#2e7d32"

# ================= API MODE =================
while True:
    try:
        resp = requests.get(API_URL, timeout=3)
        resp.raise_for_status()
        data = resp.json()
        df = pd.DataFrame(data)
        st.success("🟢 Connected to live backend")
    except Exception as e:
        st.error(f"API error: {e}")
        time.sleep(REFRESH_SECONDS)
        continue

    if df.empty:
        st.info("Waiting for logs...")
        time.sleep(REFRESH_SECONDS)
        continue

    # Normalize + sort
    df["status"] = df["status"].astype(str).str.upper()
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df = df.sort_values("timestamp", ascending=False)

    total_requests = len(df)
    blocked_requests = len(df[df["status"] == "BLOCKED"])

    total_ph.metric("📥 Total Requests", total_requests, delta="Live")
    blocked_ph.metric(
        "🚫 Blocked Requests",
        blocked_requests,
        delta=f"{round((blocked_requests/max(total_requests,1))*100,1)}% blocked"
    )

    if blocked_requests < 5:
        threat = "LOW 🟢"
    elif blocked_requests < 15:
        threat = "MEDIUM 🟠"
    else:
        threat = "HIGH 🔴"

    threat_ph.metric("Threat Level", threat, help="Calculated from blocked request volume")

    # 📈 Requests per second graph
    rps_df = df.set_index("timestamp").resample("1S").size()
    chart_ph.line_chart(rps_df.tail(30))

    # 🚨 Blocked table
    blocked_df = df[df["status"] == "BLOCKED"].head(10)
    blocked_df = blocked_df.rename(columns={
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

# ================= FOOTER =================
st.info(
    "💡 Insight: Automated clients generate consistent high-frequency requests, which are detected and blocked using behavioral analysis."
)