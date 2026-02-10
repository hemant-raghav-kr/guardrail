import streamlit as st
import pandas as pd
import requests

API_URL = "https://guardrail-twi2.onrender.com/logs"
COUNT_URL = "https://guardrail-twi2.onrender.com/logs/count"
BLOCKED_COUNT_URL = "https://guardrail-twi2.onrender.com/logs/blocked/count"
DELETE_URL = "https://guardrail-twi2.onrender.com/logs"

REFRESH_SECONDS = 2

pd.set_option("display.max_colwidth", 30)
st.set_page_config(page_title="Guardrail", layout="wide")

# 🔁 Cloud-safe auto refresh (no Streamlit hacks)
st.markdown(
    f"""
    <script>
        setTimeout(function(){{
            window.location.reload();
        }}, {REFRESH_SECONDS * 1000});
    </script>
    """,
    unsafe_allow_html=True
)

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
            r = requests.delete(DELETE_URL, headers={"x-admin-pin": pin}, timeout=5)
            if r.status_code == 200:
                st.sidebar.success("Logs deleted!")
            else:
                st.sidebar.error("Invalid PIN or delete failed")
        except Exception as e:
            st.sidebar.error(f"Delete failed: {e}")

# ================= SAFE DATA FETCH =================
try:
    resp = requests.get(API_URL, timeout=5)
    raw = resp.json()
except Exception as e:
    st.error(f"API error: {e}")
    st.stop()

if not isinstance(raw, list) or len(raw) == 0:
    st.info("No logs yet. Waiting for traffic...")
    st.stop()

df = pd.DataFrame(raw)

required_cols = {"status", "timestamp", "ip", "threat_score"}
if not required_cols.issubset(df.columns):
    st.warning("Logs received but missing expected fields.")
    st.json(df.head(3))
    st.stop()

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
recent_blocked = len(df[df["status"] == "BLOCKED"])

# ================= METRICS =================
col1, col2, col3 = st.columns(3)
col1.metric("📥 Total Requests (Lifetime)", total_requests)
col2.metric(
    "🚫 Blocked Requests (Lifetime)",
    blocked_requests,
    delta=f"{round((recent_blocked/max(recent_total,1))*100,1)}% in last {recent_total}"
)

threat = "LOW 🟢" if recent_blocked < 2 else "MEDIUM 🟠" if recent_blocked < 6 else "HIGH 🔴"
col3.metric("Threat Level", threat)

# ================= GRAPH =================
st.subheader("📈 Traffic Intensity (Requests / Second)")
rps_df = df.set_index("timestamp").resample("1S").size()
st.line_chart(rps_df.tail(30))

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

blocked_df = df[df["status"] == "BLOCKED"].head(10).rename(columns={
    "ip": "Client IP",
    "status": "Decision",
    "threat_score": "Threat Score"
})

st.dataframe(
    blocked_df.style
        .applymap(decision_style, subset=["Decision"])
        .applymap(threat_style, subset=["Threat Score"])
)
