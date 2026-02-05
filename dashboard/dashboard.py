import streamlit as st
import pandas as pd
import time
import random
from datetime import datetime
import sqlite3

# ================= CONFIG =================
MODE = "MOCK"   # change to "DB" when backend logs.db is ready
REFRESH_SECONDS = 1

pd.set_option("display.max_colwidth", 30)

# ================= PAGE SETUP =================
st.set_page_config(
    page_title="Secure API Abuse Detection",
    layout="wide"
)

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
    if val >= 80:
        return "background-color:#d32f2f; color:white; font-weight:bold"
    elif val >= 60:
        return "background-color:#ffa000; color:black; font-weight:bold"
    else:
        return "background-color:#c8e6c9; color:black"

def decision_style(val):
    if val == "BLOCKED":
        return "color:#d32f2f; font-weight:bold"
    return "color:#2e7d32"

# ================= MOCK MODE =================
if MODE == "MOCK":
    rows = []
    rps = []

    while True:
        status = random.choices(["ALLOWED", "BLOCKED"], [80, 20])[0]

        # 🔥 DYNAMIC RPS LOGIC (THIS IS THE FIX)
        if status == "ALLOWED":
            current_rps = random.randint(1, 5)      # normal traffic
        else:
            current_rps = random.randint(25, 80)    # attack traffic

        rps.append(current_rps)

        rows.append({
            "timestamp": datetime.now(),
            "ip": f"192.168.1.{random.randint(1,255)}",
            "endpoint": random.choice(["/login", "/transfer", "/home"]),
            "status": status,
            "threat_score": random.randint(30, 100)
        })

        df = pd.DataFrame(rows)

        total_requests = len(df)
        blocked_requests = len(df[df["status"] == "BLOCKED"])

        total_ph.metric(
            "📥 Total Requests",
            total_requests,
            delta="Live"
        )

        blocked_ph.metric(
            "🚫 Blocked Requests",
            blocked_requests,
            delta=f"{round((blocked_requests/max(total_requests,1))*100,1)}% blocked"
        )

        # Threat Level Badge
        if blocked_requests < 5:
            threat = "LOW 🟢"
        elif blocked_requests < 15:
            threat = "MEDIUM 🟠"
        else:
            threat = "HIGH 🔴"

        threat_ph.metric(
            "Threat Level",
            threat,
            help="Calculated from blocked request volume"
        )

        # 📈 UPDATED GRAPH
        chart_ph.line_chart(rps[-30:])

        blocked_df = df[df["status"] == "BLOCKED"].tail(10)
        blocked_df = blocked_df.rename(columns={
            "ip": "Client IP",
            "endpoint": "Target API",
            "status": "Decision",
            "threat_score": "Threat Score"
        })

        table_ph.dataframe(
            blocked_df.style
            .applymap(decision_style, subset=["Decision"])
            .applymap(threat_style, subset=["Threat Score"])
        )

        time.sleep(REFRESH_SECONDS)

# ================= DB MODE =================
else:
    conn = sqlite3.connect("logs.db", check_same_thread=False)

    while True:
        df = pd.read_sql(
            "SELECT * FROM logs ORDER BY timestamp DESC",
            conn
        )

        total_requests = len(df)
        blocked_requests = len(df[df["status"] == "BLOCKED"])

        total_ph.metric(
            "📥 Total Requests",
            total_requests,
            delta="Live"
        )

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

        threat_ph.metric(
            "Threat Level",
            threat,
            help="Calculated from blocked request volume"
        )

        df["timestamp"] = pd.to_datetime(df["timestamp"])
        rps_df = df.set_index("timestamp").resample("1S").size()

        chart_ph.line_chart(rps_df.tail(30))

        blocked_df = df[df["status"] == "BLOCKED"].head(10)
        blocked_df = blocked_df.rename(columns={
            "ip": "Client IP",
            "endpoint": "Target API",
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
