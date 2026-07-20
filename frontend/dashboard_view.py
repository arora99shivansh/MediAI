"""MediAI — Personal AI Health Operating System Dashboard.

Premium healthcare dashboard inspired by Apple Health, Epic MyChart,
Microsoft Copilot, and Linear.  Every section answers: How healthy am I?
What changed?  What should I do today?
"""
from __future__ import annotations

import json
from datetime import datetime, timedelta
from typing import Callable

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

# ─────────────────────────────────────────────────────────────────────────────
# Design-system CSS (injected once per render)
# ─────────────────────────────────────────────────────────────────────────────

_DASH_CSS = """
<style>
/* ══════════════════════════════════════════════
   MediAI Health OS — Dashboard Design System
   ══════════════════════════════════════════════ */

/* ── Animations ── */
@keyframes fadeInUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn     { from{opacity:0} to{opacity:1} }
@keyframes pulseGlow  { 0%,100%{box-shadow:0 0 8px rgba(48,209,88,.25)} 50%{box-shadow:0 0 18px rgba(48,209,88,.45)} }
@keyframes countUp    { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
@keyframes shimmer    { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
@keyframes ringFill   { from{stroke-dashoffset:251} }

/* ── Reusable card base ── */
.hos-card {
  background: #1C1C1E; border: 1px solid #2C2C2E;
  border-radius: 16px; padding: 1.25rem 1.4rem;
  transition: all .25s cubic-bezier(.4,0,.2,1);
  animation: fadeInUp .5s ease both;
}
.hos-card:hover { border-color: #48484A; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.35); }

/* ── Welcome header ── */
.welcome-wrap {
  padding: 2rem 0 1rem;
  animation: fadeIn .6s ease both;
}
.welcome-greeting {
  font-size: 1.75rem; font-weight: 700; color: #F2F2F7;
  letter-spacing: -.02em; margin: 0 0 .25rem;
  line-height: 1.3;
}
.welcome-sub {
  font-size: .95rem; color: #8E8E93; margin: 0;
  line-height: 1.5; font-weight: 400;
}
.welcome-sub strong { color: #30D158; font-weight: 600; }

/* ── Quick-action pills ── */
.qa-row { display: flex; gap: .6rem; flex-wrap: wrap; margin: 1.25rem 0 .5rem; }
.qa-pill {
  display: inline-flex; align-items: center; gap: .45rem;
  padding: .5rem 1rem; border-radius: 100px;
  background: #2C2C2E; border: 1px solid #38383A;
  color: #F2F2F7; font-size: .82rem; font-weight: 600;
  cursor: default; transition: all .2s ease;
  text-decoration: none;
}
.qa-pill:hover { background: #3A3A3C; border-color: #48484A; transform: translateY(-1px); }
.qa-pill .qa-icon { font-size: 1rem; }

/* ── Metric tile ── */
.metric-tile {
  background: #1C1C1E; border: 1px solid #2C2C2E;
  border-radius: 14px; padding: 1.1rem 1.2rem;
  display: flex; flex-direction: column; gap: .3rem;
  transition: all .25s cubic-bezier(.4,0,.2,1);
  animation: fadeInUp .5s ease both;
}
.metric-tile:hover { border-color: #48484A; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.3); }
.metric-label { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #8E8E93; }
.metric-value { font-size: 1.65rem; font-weight: 700; color: #F2F2F7; letter-spacing: -.02em; animation: countUp .4s ease both; }
.metric-delta { font-size: .75rem; font-weight: 600; display: inline-flex; align-items: center; gap: .25rem; }
.metric-delta.up   { color: #30D158; }
.metric-delta.down { color: #FF453A; }
.metric-delta.flat { color: #8E8E93; }

/* ── Score ring (SVG) ── */
.score-ring-wrap {
  display: flex; align-items: center; gap: 1.4rem;
  padding: 1.5rem; background: #1C1C1E;
  border: 1px solid #2C2C2E; border-radius: 16px;
  animation: fadeInUp .5s ease both;
  transition: all .25s ease;
}
.score-ring-wrap:hover { border-color: #48484A; box-shadow: 0 8px 24px rgba(0,0,0,.35); }
.score-ring svg { filter: drop-shadow(0 0 6px rgba(10,132,255,.25)); }
.score-ring-label { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #8E8E93; margin-bottom: .15rem; }
.score-ring-value { font-size: 2.2rem; font-weight: 700; letter-spacing: -.03em; }
.score-ring-detail { font-size: .8rem; color: #8E8E93; margin-top: .2rem; }

/* ── Insight card ── */
.insight-card {
  background: #1C1C1E; border: 1px solid #2C2C2E;
  border-radius: 14px; padding: 1rem 1.2rem;
  display: flex; align-items: flex-start; gap: 1rem;
  transition: all .25s ease; animation: fadeInUp .5s ease both;
}
.insight-card:hover { border-color: #48484A; transform: translateX(3px); }
.insight-icon { font-size: 1.5rem; flex-shrink: 0; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.insight-icon.good  { background: rgba(48,209,88,.12); }
.insight-icon.warn  { background: rgba(255,159,10,.12); }
.insight-icon.bad   { background: rgba(255,69,58,.12); }
.insight-icon.info  { background: rgba(10,132,255,.12); }
.insight-body { flex: 1; min-width: 0; }
.insight-title { font-size: .9rem; font-weight: 600; color: #F2F2F7; margin: 0 0 .2rem; }
.insight-desc  { font-size: .8rem; color: #8E8E93; margin: 0; line-height: 1.5; }
.insight-tag   { display: inline-block; margin-top: .35rem; font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; padding: .15rem .5rem; border-radius: 100px; }
.insight-tag.good { background: rgba(48,209,88,.12); color: #30D158; }
.insight-tag.warn { background: rgba(255,159,10,.12); color: #FF9F0A; }
.insight-tag.bad  { background: rgba(255,69,58,.12);  color: #FF453A; }
.insight-tag.info { background: rgba(10,132,255,.12);  color: #0A84FF; }

/* ── Body-system card ── */
.body-card {
  background: #1C1C1E; border: 1px solid #2C2C2E;
  border-radius: 14px; padding: 1rem; text-align: center;
  transition: all .25s ease; animation: fadeInUp .5s ease both;
}
.body-card:hover { border-color: #48484A; transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,.3); }
.body-card-icon { font-size: 2rem; margin-bottom: .4rem; }
.body-card-name { font-size: .8rem; font-weight: 700; color: #F2F2F7; margin-bottom: .25rem; }
.body-card-status { font-size: .7rem; font-weight: 600; padding: .15rem .5rem; border-radius: 100px; display: inline-block; }
.body-card-status.ok    { background: rgba(48,209,88,.12); color: #30D158; }
.body-card-status.warn  { background: rgba(255,159,10,.12); color: #FF9F0A; }
.body-card-status.alert { background: rgba(255,69,58,.12);  color: #FF453A; }
.body-card-status.na    { background: rgba(142,142,147,.12); color: #8E8E93; }

/* ── Medication row ── */
.med-row {
  display: flex; align-items: center; gap: 1rem;
  padding: .9rem 1.1rem; background: #1C1C1E;
  border: 1px solid #2C2C2E; border-radius: 12px;
  margin-bottom: .5rem; transition: all .25s ease;
  animation: fadeInUp .45s ease both;
}
.med-row:hover { border-color: #48484A; transform: translateX(3px); }
.med-pill { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; background: rgba(10,132,255,.12); flex-shrink: 0; }
.med-name  { font-size: .88rem; font-weight: 600; color: #F2F2F7; }
.med-dose  { font-size: .75rem; color: #8E8E93; }
.med-freq  { margin-left: auto; font-size: .72rem; color: #8E8E93; text-align: right; }

/* ── Timeline event ── */
.tl-event {
  position: relative; padding-left: 2rem; margin-bottom: 1.2rem;
  animation: fadeInUp .5s ease both;
}
.tl-event::before {
  content: ''; position: absolute; left: 7px; top: 24px; bottom: -1.2rem;
  width: 2px; background: #2C2C2E;
}
.tl-event:last-child::before { display: none; }
.tl-dot {
  position: absolute; left: 0; top: 6px;
  width: 16px; height: 16px; border-radius: 50%;
  border: 2px solid #0A84FF; background: #1C1C1E;
  z-index: 1;
}
.tl-dot.active { background: #0A84FF; animation: pulseGlow 2s ease-in-out infinite; border-color: #0A84FF; }
.tl-date   { font-size: .7rem; font-weight: 700; color: #8E8E93; text-transform: uppercase; letter-spacing: .05em; }
.tl-title  { font-size: .88rem; font-weight: 600; color: #F2F2F7; margin: .15rem 0; }
.tl-detail { font-size: .78rem; color: #636366; line-height: 1.5; }

/* ── Follow-up card ── */
.fu-card {
  display: flex; align-items: center; gap: .9rem;
  padding: .85rem 1.1rem; background: #1C1C1E;
  border: 1px solid #2C2C2E; border-radius: 12px;
  margin-bottom: .5rem; transition: all .25s ease;
  animation: fadeInUp .45s ease both;
}
.fu-card:hover { border-color: #48484A; transform: translateX(3px); }
.fu-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: .95rem; flex-shrink: 0; }
.fu-icon.test    { background: rgba(100,210,255,.12); }
.fu-icon.life    { background: rgba(48,209,88,.12); }
.fu-icon.monitor { background: rgba(255,159,10,.12); }
.fu-icon.doctor  { background: rgba(10,132,255,.12); }
.fu-text { font-size: .85rem; font-weight: 500; color: #F2F2F7; flex: 1; }
.fu-tag  { font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; padding: .2rem .55rem; border-radius: 100px; }
.fu-tag.due    { background: rgba(255,159,10,.12); color: #FF9F0A; }
.fu-tag.active { background: rgba(48,209,88,.12); color: #30D158; }
.fu-tag.new    { background: rgba(10,132,255,.12); color: #0A84FF; }

/* ── Section heading ── */
.dash-section {
  font-size: .72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .08em; color: #636366;
  padding: 1.8rem 0 .7rem; margin: 0;
  display: flex; align-items: center; gap: .5rem;
}
.dash-section::after {
  content: ''; flex: 1; height: 1px; background: #2C2C2E;
}

/* ── Onboarding / empty-state ── */
.onboard-card {
  text-align: center; padding: 2.5rem 2rem;
  background: linear-gradient(135deg, #1C1C1E 0%, #232326 100%);
  border: 1px dashed #38383A; border-radius: 16px;
  animation: fadeIn .6s ease both;
}
.onboard-icon { font-size: 2.5rem; display: block; margin-bottom: .8rem; opacity: .7; }
.onboard-title { font-size: 1rem; font-weight: 700; color: #F2F2F7; margin: 0 0 .35rem; }
.onboard-body { font-size: .85rem; color: #8E8E93; margin: 0 0 1rem; line-height: 1.6; max-width: 320px; margin-left: auto; margin-right: auto; }
.onboard-cta {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .55rem 1.2rem; border-radius: 100px;
  background: #0A84FF; color: #fff; font-size: .82rem;
  font-weight: 600; text-decoration: none; border: none;
  cursor: default; transition: all .2s ease;
}
.onboard-cta:hover { background: #0070DF; transform: translateY(-1px); }

/* ── Report card ── */
.report-card {
  display: flex; align-items: center; gap: 1rem;
  padding: 1rem 1.2rem; background: #1C1C1E;
  border: 1px solid #2C2C2E; border-radius: 14px;
  margin-bottom: .6rem; transition: all .25s ease;
  animation: fadeInUp .5s ease both;
}
.report-card:hover { border-color: #48484A; transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,.25); }
.report-icon { font-size: 1.6rem; flex-shrink: 0; }
.report-body { flex: 1; min-width: 0; }
.report-name { font-size: .88rem; font-weight: 600; color: #F2F2F7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.report-meta { font-size: .72rem; color: #8E8E93; margin-top: .15rem; }
.report-finding { font-size: .78rem; color: #636366; font-style: italic; margin-top: .25rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ── Grid helpers ── */
.dash-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: .6rem; }
.dash-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: .6rem; }
.dash-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: .6rem; }
@media (max-width: 768px) {
  .dash-grid-2, .dash-grid-3, .dash-grid-4 { grid-template-columns: 1fr; }
}
@media (min-width: 769px) and (max-width: 1024px) {
  .dash-grid-3, .dash-grid-4 { grid-template-columns: repeat(2, 1fr); }
}
</style>
"""


# ─────────────────────────────────────────────────────────────────────────────
# Plotly theme
# ─────────────────────────────────────────────────────────────────────────────

_CHART_OPTS = dict(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    font=dict(color="#8E8E93", family="Inter, system-ui, sans-serif", size=11),
    xaxis=dict(gridcolor="#2C2C2E", linecolor="#38383A",
               tickfont=dict(color="#636366", size=10)),
    yaxis=dict(gridcolor="#2C2C2E", linecolor="#38383A",
               tickfont=dict(color="#636366", size=10)),
    margin=dict(t=36, r=16, b=32, l=44),
    legend=dict(font=dict(color="#8E8E93", size=10), bgcolor="rgba(0,0,0,0)",
                orientation="h", yanchor="bottom", y=1.02, xanchor="left", x=0),
    hoverlabel=dict(bgcolor="#2C2C2E", bordercolor="#48484A",
                    font_color="#F2F2F7", font_family="Inter"),
)


def _theme(fig):
    fig.update_layout(**_CHART_OPTS)
    return fig


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _greeting() -> str:
    h = datetime.now().hour
    if h < 12:
        return "Good Morning"
    elif h < 17:
        return "Good Afternoon"
    return "Good Evening"


def _health_score_ring(score: int, label: str, color: str, size: int = 90) -> str:
    """Render an SVG circular progress ring."""
    r = 40
    c = 2 * 3.14159 * r
    offset = c * (1 - score / 100)
    return (
        f'<div style="display:flex;flex-direction:column;align-items:center;gap:.3rem;">'
        f'<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}">'
        f'<circle cx="{size//2}" cy="{size//2}" r="{r}" fill="none" stroke="#2C2C2E" stroke-width="6"/>'
        f'<circle cx="{size//2}" cy="{size//2}" r="{r}" fill="none" stroke="{color}" stroke-width="6" '
        f'stroke-linecap="round" stroke-dasharray="{c}" stroke-dashoffset="{offset}" '
        f'transform="rotate(-90 {size//2} {size//2})" style="animation:ringFill 1.2s ease both;"/>'
        f'<text x="{size//2}" y="{size//2+5}" text-anchor="middle" fill="#F2F2F7" '
        f'font-size="1.3rem" font-weight="700" font-family="Inter,sans-serif">{score}</text>'
        f'</svg>'
        f'<span style="font-size:.65rem;font-weight:700;color:#8E8E93;text-transform:uppercase;letter-spacing:.05em;">{label}</span>'
        f'</div>'
    )


def _compute_health_score(profile: dict, meds: list, timeline: list, symptoms: list) -> dict:
    """Compute a simple health score from available data. Returns scores dict."""
    twin = profile.get("profile", {})
    conditions = twin.get("chronic_conditions", [])
    risks = twin.get("risk_predictions", [])

    # Base score starts at 78 (realistic healthy baseline)
    base = 78
    if timeline:
        base += min(8, len(timeline))  # More data = higher confidence = +score
    if meds:
        base -= min(5, len(meds))  # More meds = slightly lower
    high_risks = sum(1 for r in risks if r.get("risk_level") == "High")
    med_risks = sum(1 for r in risks if r.get("risk_level") == "Medium")
    base -= high_risks * 6
    base -= med_risks * 3
    if len(conditions) > 2:
        base -= 4

    base = max(35, min(95, base))

    return {
        "overall": base,
        "recovery": min(95, base + 5) if meds else base,
        "consistency": min(92, base + 3) if symptoms else max(60, base - 10),
        "risk": max(0, 100 - (high_risks * 25 + med_risks * 12)),
    }


_BODY_SYSTEMS = [
    ("❤️", "Heart",     "Cardiovascular"),
    ("🧠", "Brain",     "Neurological"),
    ("🫁", "Lungs",     "Respiratory"),
    ("🫘", "Kidneys",   "Renal"),
    ("🔬", "Blood",     "Hematology"),
    ("🫀", "Liver",     "Hepatic"),
    ("🦠", "Immune",    "Immunology"),
    ("🦴", "Bones",     "Musculoskeletal"),
]


def _map_system_status(system_name: str, conditions: list, risks: list, vitals: list) -> tuple[str, str]:
    """Map a body system to a status and CSS class from patient data."""
    name_lower = system_name.lower()
    # Check risks first
    for r in risks:
        cond = r.get("condition", "").lower()
        if name_lower in cond or any(kw in cond for kw in _SYSTEM_KEYWORDS.get(name_lower, [])):
            if r.get("risk_level") == "High":
                return "At Risk", "alert"
            elif r.get("risk_level") == "Medium":
                return "Monitor", "warn"
    # Check conditions
    for c in conditions:
        cl = c.lower()
        if any(kw in cl for kw in _SYSTEM_KEYWORDS.get(name_lower, [])):
            return "Active", "warn"
    # Check vitals
    for v in vitals:
        vn = v.get("vital_name", "").lower()
        if any(kw in vn for kw in _SYSTEM_KEYWORDS.get(name_lower, [])):
            if v.get("status", "").lower() in ("high", "low", "abnormal"):
                return "Abnormal", "warn"
            return "Normal", "ok"
    return "No Data", "na"


_SYSTEM_KEYWORDS = {
    "heart": ["heart", "cardiac", "blood pressure", "bp", "cholesterol", "ecg", "cardio", "hypertension"],
    "brain": ["brain", "neuro", "cognitive", "headache", "migraine"],
    "lungs": ["lung", "respiratory", "oxygen", "spo2", "breathing", "asthma"],
    "kidneys": ["kidney", "renal", "creatinine", "urea", "bun", "gfr"],
    "blood": ["blood", "hemoglobin", "hb", "cbc", "wbc", "rbc", "platelet", "anemia", "hematocrit"],
    "liver": ["liver", "hepat", "alt", "ast", "bilirubin", "albumin"],
    "immune": ["immune", "wbc", "lymphocyte", "infection", "autoimmune", "allergy"],
    "bones": ["bone", "calcium", "vitamin d", "joint", "arthritis", "osteo", "fracture"],
}


# ─────────────────────────────────────────────────────────────────────────────
# Main dashboard renderer
# ─────────────────────────────────────────────────────────────────────────────

def render_dashboard(api_client: Callable, user: dict) -> None:
    st.html(_DASH_CSS)

    # ── Fetch all data ──
    profile = api_client("GET", "/patient/profile", silent=True) or {}
    timeline = api_client("GET", "/patient/timeline", silent=True) or []
    meds = api_client("GET", "/patient/medications", silent=True) or []
    symptoms = api_client("GET", "/patient/symptoms", silent=True) or []
    memory = api_client("GET", "/patient/memory", silent=True) or []
    docs = api_client("GET", "/documents", silent=True) or []

    twin = profile.get("profile", {})
    conditions = twin.get("chronic_conditions", [])
    risks = twin.get("risk_predictions", [])
    actions = twin.get("follow_up_actions", [])
    scores = _compute_health_score(profile, meds, timeline, symptoms)

    first_name = (user.get("full_name") or "").split()[0] or "there"
    has_data = bool(twin) or bool(timeline) or bool(meds)

    # ══════════════════════════════════════════════
    # EMERGENCY ALERTS
    # ══════════════════════════════════════════════
    alerts = api_client("GET", "/patient/alerts", silent=True) or []
    if alerts:
        for alert in alerts:
            st.markdown(
                f'''
                <div class="emergency-banner">
                    <div class="emergency-icon">⚠️</div>
                    <div class="emergency-content">
                        <p class="emergency-title">Critical Health Alert</p>
                        <p class="emergency-text">{alert["message"]}</p>
                    </div>
                </div>
                ''',
                unsafe_allow_html=True
            )
            if st.button("Acknowledge & Dismiss", key=f"dismiss_alert_{alert['_id']}", use_container_width=True):
                api_client("POST", f"/patient/alerts/{alert['_id']}/resolve")
                st.rerun()
        st.markdown("<br>", unsafe_allow_html=True)

    # ══════════════════════════════════════════════
    # SECTION 1 — Welcome header + Quick actions
    # ══════════════════════════════════════════════
    greeting_text = f"{_greeting()}, {first_name} 👋"
    sub_text = "Your <strong>AI Health Companion</strong> has analyzed your records." if has_data else "Upload your first medical report to activate your <strong>AI Health Companion</strong>."

    st.html(
        f'<div class="welcome-wrap">'
        f'<h1 class="welcome-greeting">{greeting_text}</h1>'
        f'<p class="welcome-sub">{sub_text}</p>'
        f'</div>'
    )

    st.html(
        '<div class="qa-row">'
        '<span class="qa-pill"><span class="qa-icon">📤</span>Upload Report</span>'
        '<span class="qa-pill"><span class="qa-icon">🤖</span>Ask AI</span>'
        '<span class="qa-pill"><span class="qa-icon">📅</span>Follow-ups</span>'
        '<span class="qa-pill"><span class="qa-icon">📈</span>View Timeline</span>'
        '<span class="qa-pill"><span class="qa-icon">🧬</span>Digital Twin</span>'
        '</div>'
    )

    # ══════════════════════════════════════════════
    # SECTION 2 — Health score + Metric tiles
    # ══════════════════════════════════════════════
    st.html('<p class="dash-section">Health Overview</p>')

    score_col, metrics_col = st.columns([1, 2])

    with score_col:
        overall = scores["overall"]
        color = "#30D158" if overall >= 75 else "#FF9F0A" if overall >= 55 else "#FF453A"
        detail = "Excellent — keep it up!" if overall >= 80 else "Good — minor areas to watch" if overall >= 65 else "Needs attention — see insights below"
        st.html(
            '<div class="score-ring-wrap">'
            f'<div class="score-ring">{_health_score_ring(overall, "Health Score", color, 110)}</div>'
            '<div>'
            f'<span class="score-ring-label">Overall Wellness</span>'
            f'<div class="score-ring-value" style="color:{color}">{overall}<span style="font-size:.9rem;color:#8E8E93">/100</span></div>'
            f'<span class="score-ring-detail">{detail}</span>'
            '</div>'
            '</div>'
        )

    with metrics_col:
        risk_score = scores["risk"]
        risk_color = "#30D158" if risk_score >= 75 else "#FF9F0A" if risk_score >= 50 else "#FF453A"
        rec_score = scores["recovery"]
        cons_score = scores["consistency"]

        rings_html = (
            '<div style="display:flex;gap:1.2rem;flex-wrap:wrap;justify-content:center;padding:.5rem 0;">'
            + _health_score_ring(risk_score, "Risk Score", risk_color, 85)
            + _health_score_ring(rec_score, "Recovery", "#0A84FF", 85)
            + _health_score_ring(cons_score, "Consistency", "#AF52DE", 85)
            + '</div>'
        )
        st.html(rings_html)

    # Small KPI tiles
    n_docs = len(docs)
    n_meds = len(meds)
    n_conditions = len(conditions)
    n_symptoms = len(symptoms)

    st.html(
        '<div class="dash-grid-4" style="margin-top:.8rem;">'
        f'<div class="metric-tile">'
        f'<span class="metric-label">Reports Analyzed</span>'
        f'<span class="metric-value">{n_docs}</span>'
        f'</div>'
        f'<div class="metric-tile">'
        f'<span class="metric-label">Active Medications</span>'
        f'<span class="metric-value">{n_meds}</span>'
        f'</div>'
        f'<div class="metric-tile">'
        f'<span class="metric-label">Conditions Tracked</span>'
        f'<span class="metric-value">{n_conditions}</span>'
        f'</div>'
        f'<div class="metric-tile">'
        f'<span class="metric-label">Symptoms Logged</span>'
        f'<span class="metric-value">{n_symptoms}</span>'
        f'</div>'
        '</div>'
    )

    # ══════════════════════════════════════════════
    # SECTION 3 — AI Health Insights
    # ══════════════════════════════════════════════
    st.html('<p class="dash-section">AI Health Insights</p>')

    if risks or conditions or timeline:
        insights_html = ""
        # Generate insight cards from risk predictions
        for r in risks[:4]:
            level = r.get("risk_level", "Low").lower()
            css_class = "bad" if level == "high" else "warn" if level == "medium" else "good"
            icon = "⚠️" if level == "high" else "⚡" if level == "medium" else "✅"
            insights_html += (
                f'<div class="insight-card">'
                f'<div class="insight-icon {css_class}">{icon}</div>'
                f'<div class="insight-body">'
                f'<p class="insight-title">{r.get("condition", "Unknown")} — {r.get("risk_level", "")} Risk</p>'
                f'<p class="insight-desc">{r.get("reasoning", "")}</p>'
                f'<span class="insight-tag {css_class}">{r.get("risk_level", "")} Risk</span>'
                f'</div>'
                f'</div>'
            )
        # Add condition insights
        for c in conditions[:2]:
            insights_html += (
                f'<div class="insight-card">'
                f'<div class="insight-icon info">🩺</div>'
                f'<div class="insight-body">'
                f'<p class="insight-title">Tracking: {c}</p>'
                f'<p class="insight-desc">This condition is being actively monitored. Upload new reports to track progress.</p>'
                f'<span class="insight-tag info">Active</span>'
                f'</div>'
                f'</div>'
            )
        if not insights_html:
            insights_html = (
                '<div class="insight-card">'
                '<div class="insight-icon good">✅</div>'
                '<div class="insight-body">'
                '<p class="insight-title">All Clear</p>'
                '<p class="insight-desc">No elevated risks detected. Keep monitoring by uploading new reports.</p>'
                '<span class="insight-tag good">Healthy</span>'
                '</div>'
                '</div>'
            )
        st.html(f'<div style="display:flex;flex-direction:column;gap:.6rem;">{insights_html}</div>')
    else:
        st.html(
            '<div class="onboard-card">'
            '<span class="onboard-icon">🔬</span>'
            '<p class="onboard-title">Unlock AI Health Insights</p>'
            '<p class="onboard-body">Upload a medical report and MediAI will analyze your vitals, detect patterns, and generate personalized health insights.</p>'
            '<span class="onboard-cta">📤 Upload Your First Report</span>'
            '</div>'
        )

    # ══════════════════════════════════════════════
    # SECTION 4 — Digital Twin profile
    # ══════════════════════════════════════════════
    st.html('<p class="dash-section">Digital Twin</p>')

    if twin:
        age = twin.get("age") or "—"
        gender = twin.get("gender") or "—"
        allergies = twin.get("allergies", [])
        lifestyle = twin.get("lifestyle_factors", [])
        family_hx = twin.get("family_history", [])

        twin_html = (
            '<div class="hos-card">'
            '<div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem;">'
            '<div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#0A84FF,#30D158);display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:#fff;font-weight:700;flex-shrink:0;">🧬</div>'
            '<div>'
            f'<div style="font-size:1rem;font-weight:700;color:#F2F2F7;">Patient Profile</div>'
            f'<div style="font-size:.8rem;color:#8E8E93;">Age: {age}  ·  Gender: {gender}</div>'
            '</div>'
            '</div>'
            '<div class="dash-grid-3">'
        )

        # Conditions
        cond_pills = "".join(f'<span style="display:inline-block;padding:.2rem .6rem;border-radius:100px;font-size:.72rem;font-weight:600;background:rgba(255,159,10,.12);color:#FF9F0A;margin:.15rem .2rem 0 0;">{c}</span>' for c in conditions) if conditions else '<span style="font-size:.78rem;color:#636366;">None reported</span>'
        twin_html += (
            f'<div style="padding:.7rem;background:#232326;border-radius:10px;">'
            f'<div style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#8E8E93;margin-bottom:.4rem;">Conditions</div>'
            f'{cond_pills}'
            f'</div>'
        )

        # Allergies
        allergy_pills = "".join(f'<span style="display:inline-block;padding:.2rem .6rem;border-radius:100px;font-size:.72rem;font-weight:600;background:rgba(255,69,58,.12);color:#FF453A;margin:.15rem .2rem 0 0;">{a}</span>' for a in allergies) if allergies else '<span style="font-size:.78rem;color:#636366;">None reported</span>'
        twin_html += (
            f'<div style="padding:.7rem;background:#232326;border-radius:10px;">'
            f'<div style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#8E8E93;margin-bottom:.4rem;">Allergies</div>'
            f'{allergy_pills}'
            f'</div>'
        )

        # Lifestyle
        life_pills = "".join(f'<span style="display:inline-block;padding:.2rem .6rem;border-radius:100px;font-size:.72rem;font-weight:600;background:rgba(10,132,255,.12);color:#0A84FF;margin:.15rem .2rem 0 0;">{l}</span>' for l in lifestyle) if lifestyle else '<span style="font-size:.78rem;color:#636366;">Not assessed</span>'
        twin_html += (
            f'<div style="padding:.7rem;background:#232326;border-radius:10px;">'
            f'<div style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#8E8E93;margin-bottom:.4rem;">Lifestyle</div>'
            f'{life_pills}'
            f'</div>'
        )

        twin_html += '</div></div>'
        st.html(twin_html)
    else:
        st.html(
            '<div class="onboard-card">'
            '<span class="onboard-icon">🧬</span>'
            '<p class="onboard-title">Build Your Digital Twin</p>'
            '<p class="onboard-body">Upload a medical report and MediAI will create a comprehensive digital profile of your health — conditions, allergies, medications, and lifestyle factors.</p>'
            '<span class="onboard-cta">🧬 Activate Digital Twin</span>'
            '</div>'
        )

    # ══════════════════════════════════════════════
    # SECTION 5 — Body System Overview
    # ══════════════════════════════════════════════
    st.html('<p class="dash-section">Body Systems</p>')

    body_html = '<div class="dash-grid-4">'
    for icon, name, full_name in _BODY_SYSTEMS:
        status_text, status_class = _map_system_status(name, conditions, risks, timeline)
        body_html += (
            f'<div class="body-card">'
            f'<div class="body-card-icon">{icon}</div>'
            f'<div class="body-card-name">{name}</div>'
            f'<span class="body-card-status {status_class}">{status_text}</span>'
            f'</div>'
        )
    body_html += '</div>'
    st.html(body_html)

    # ══════════════════════════════════════════════
    # SECTION 6 — Health Timeline (chart + events)
    # ══════════════════════════════════════════════
    st.html('<p class="dash-section">Health Timeline</p>')

    if timeline:
        tl_left, tl_right = st.columns([3, 2])
        with tl_left:
            df = pd.DataFrame(timeline)
            if "vital_name" in df.columns and "value" in df.columns:
                df["num_value"] = pd.to_numeric(df["value"], errors="coerce")
                df_chart = df.dropna(subset=["num_value"]).sort_values("date")
                if not df_chart.empty:
                    fig = px.line(
                        df_chart, x="date", y="num_value", color="vital_name",
                        markers=True, line_shape="spline",
                    )
                    fig.update_traces(line_width=2.5, marker_size=6)
                    fig = _theme(fig)
                    fig.update_layout(
                        title=dict(text="Vitals Trend", font=dict(size=13, color="#F2F2F7")),
                        xaxis_title="", yaxis_title="Value",
                        colorway=["#0A84FF", "#30D158", "#FF9F0A", "#FF453A", "#AF52DE", "#64D2FF"],
                    )
                    st.plotly_chart(fig, use_container_width=True, key="vitals_trend")
                else:
                    st.html(
                        '<div class="onboard-card">'
                        '<span class="onboard-icon">📊</span>'
                        '<p class="onboard-title">Numeric trends unavailable</p>'
                        '<p class="onboard-body">Your vitals contain non-numeric data. Upload lab reports with numeric values to see trend charts.</p>'
                        '</div>'
                    )

        with tl_right:
            events_html = ""
            seen_dates = set()
            for i, t in enumerate(timeline[:8]):
                date_str = t.get("date", "")
                vital = t.get("vital_name", "Unknown")
                val = t.get("value", "")
                unit = t.get("unit", "") or ""
                status = t.get("status", "")
                dot_cls = "active" if i == 0 else ""
                events_html += (
                    f'<div class="tl-event">'
                    f'<div class="tl-dot {dot_cls}"></div>'
                    f'<span class="tl-date">{date_str}</span>'
                    f'<div class="tl-title">{vital}: {val} {unit}</div>'
                    f'<div class="tl-detail">{status if status else "Recorded from uploaded report"}</div>'
                    f'</div>'
                )
            st.html(events_html)
    else:
        st.html(
            '<div class="onboard-card">'
            '<span class="onboard-icon">📈</span>'
            '<p class="onboard-title">Your Health Timeline Starts Here</p>'
            '<p class="onboard-body">Upload lab reports and medical records to track your vitals over time. MediAI will chart your progress and detect trends automatically.</p>'
            '<span class="onboard-cta">📤 Upload Report to Begin</span>'
            '</div>'
        )

    # ══════════════════════════════════════════════
    # SECTION 7 — Active Medications
    # ══════════════════════════════════════════════
    st.html('<p class="dash-section">Active Medications</p>')

    if meds:
        meds_html = ""
        for m in meds:
            name = m.get("name", "Unknown")
            dose = m.get("dosage", "")
            freq = m.get("frequency", "")
            reason = m.get("reason", "")
            meds_html += (
                f'<div class="med-row">'
                f'<div class="med-pill">💊</div>'
                f'<div>'
                f'<div class="med-name">{name}</div>'
                f'<div class="med-dose">{dose}{" · " + reason if reason else ""}</div>'
                f'</div>'
                f'<div class="med-freq">{freq}</div>'
                f'</div>'
            )
        st.html(meds_html)
    else:
        st.html(
            '<div class="onboard-card">'
            '<span class="onboard-icon">💊</span>'
            '<p class="onboard-title">No Medications Tracked Yet</p>'
            '<p class="onboard-body">When you upload prescriptions or medical reports, MediAI will automatically extract and track your medications, dosages, and schedules.</p>'
            '<span class="onboard-cta">📤 Upload a Prescription</span>'
            '</div>'
        )

    # ══════════════════════════════════════════════
    # SECTION 8 — Smart Follow-ups
    # ══════════════════════════════════════════════
    st.html('<p class="dash-section">Smart Follow-Ups</p>')

    if actions:
        fu_html = ""
        for a in actions:
            atype = a.get("type", "General").lower()
            icon_cls = "test" if "test" in atype else "life" if "life" in atype else "doctor" if "doctor" in atype else "monitor"
            icon_emoji = "🔬" if "test" in atype else "🌿" if "life" in atype else "🩺" if "doctor" in atype else "📋"
            tag_cls = "due" if "test" in atype else "active" if "life" in atype else "new"
            fu_html += (
                f'<div class="fu-card">'
                f'<div class="fu-icon {icon_cls}">{icon_emoji}</div>'
                f'<span class="fu-text">{a.get("description", "")}</span>'
                f'<span class="fu-tag {tag_cls}">{a.get("type", "Action")}</span>'
                f'</div>'
            )
        st.html(fu_html)
    else:
        st.html(
            '<div class="onboard-card">'
            '<span class="onboard-icon">📅</span>'
            '<p class="onboard-title">No Follow-Ups Yet</p>'
            '<p class="onboard-body">Once MediAI analyzes your reports, it will generate personalized follow-up recommendations — tests to schedule, lifestyle changes, and more.</p>'
            '<span class="onboard-cta">🤖 Let AI Generate Recommendations</span>'
            '</div>'
        )

    # ══════════════════════════════════════════════
    # SECTION 9 — Recent Reports
    # ══════════════════════════════════════════════
    st.html('<p class="dash-section">Recent Reports</p>')

    if memory:
        reports_html = ""
        for m in memory[:5]:
            fname = m.get("filename", "Unknown Report")
            date = (m.get("created_at") or "")[:10]
            extraction = m.get("extraction", {})
            summary = extraction.get("summary", "No summary generated")
            n_vitals = len(extraction.get("vitals", []))
            n_meds_ext = len(extraction.get("medications", []))
            reports_html += (
                f'<div class="report-card">'
                f'<div class="report-icon">📋</div>'
                f'<div class="report-body">'
                f'<div class="report-name">{fname}</div>'
                f'<div class="report-meta">{date} · {n_vitals} vitals · {n_meds_ext} medications extracted</div>'
                f'<div class="report-finding">{summary}</div>'
                f'</div>'
                f'</div>'
            )
        st.html(reports_html)
    elif docs:
        reports_html = ""
        for d in docs[:5]:
            fname = d.get("filename", "Untitled")
            date = (d.get("created_at") or "")[:10]
            chunks = d.get("chunk_count", 0)
            reports_html += (
                f'<div class="report-card">'
                f'<div class="report-icon">📄</div>'
                f'<div class="report-body">'
                f'<div class="report-name">{fname}</div>'
                f'<div class="report-meta">{date} · {chunks} indexed chunks</div>'
                f'</div>'
                f'</div>'
            )
        st.html(reports_html)
    else:
        st.html(
            '<div class="onboard-card">'
            '<span class="onboard-icon">📂</span>'
            '<p class="onboard-title">No Reports Uploaded</p>'
            '<p class="onboard-body">Upload PDFs, DOCX, or TXT files. MediAI will index them for AI chat and automatically extract structured health data.</p>'
            '<span class="onboard-cta">📤 Upload First Report</span>'
            '</div>'
        )

    # ══════════════════════════════════════════════
    # SECTION 10 — Symptom Tracker (interactive)
    # ══════════════════════════════════════════════
    st.html('<p class="dash-section">Symptom Tracker</p>')

    sym_left, sym_right = st.columns([1, 2])

    with sym_left:
        with st.form("symptom_form", border=False):
            st.markdown("##### Log a Symptom")
            sym = st.text_input("Symptom", placeholder="e.g. Headache, Fatigue, Nausea")
            sev = st.slider("Severity", 1, 10, 5, help="1 = mild, 10 = severe")
            notes = st.text_input("Notes", placeholder="Optional details…")
            if st.form_submit_button("Log Symptom", use_container_width=True):
                if sym.strip():
                    api_client("POST", "/patient/symptoms", json={"symptom": sym.strip(), "severity": sev, "notes": notes})
                    st.rerun()
                else:
                    st.warning("Please enter a symptom name.")

    with sym_right:
        if symptoms:
            df_sym = pd.DataFrame(symptoms)
            if "severity" in df_sym.columns and "date" in df_sym.columns:
                # Trend chart
                fig_sym = px.scatter(
                    df_sym, x="date", y="severity", color="symptom",
                    size="severity", size_max=14,
                    title="Symptom Severity Over Time",
                )
                fig_sym.update_traces(marker=dict(line=dict(width=1, color="#48484A")))
                fig_sym = _theme(fig_sym)
                fig_sym.update_layout(
                    xaxis_title="", yaxis_title="Severity",
                    yaxis=dict(range=[0, 11], dtick=2),
                    colorway=["#FF9F0A", "#FF453A", "#0A84FF", "#30D158", "#AF52DE"],
                )
                st.plotly_chart(fig_sym, use_container_width=True, key="symptom_chart")
        else:
            st.html(
                '<div class="onboard-card" style="padding:1.5rem;">'
                '<span class="onboard-icon" style="font-size:1.8rem;">📝</span>'
                '<p class="onboard-title">Track Your Symptoms</p>'
                '<p class="onboard-body">Log daily symptoms to unlock trend analysis, severity charts, and AI-powered correlations.</p>'
                '</div>'
            )
