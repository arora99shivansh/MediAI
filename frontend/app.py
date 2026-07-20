"""MediAI — Clinical AI assistant."""
from __future__ import annotations

import json
import os
from datetime import datetime

import plotly.express as px
import requests
import streamlit as st

# ─────────────────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────────────────

API_URL: str = os.environ.get("API_URL") or st.secrets.get("API_URL", "https://mediai-backend-co2d.onrender.com/api/v1")

st.set_page_config(
    page_title="MediAI · Clinical AI",
    page_icon="⊕",
    layout="wide",
    menu_items={
        "About": "MediAI — AI-powered clinical assistant. For professional use only.",
        "Get help": None,
        "Report a bug": None,
    },
)

# ─────────────────────────────────────────────────────────────────────────────
# Design system
# Dark-mode-first clinical interface: ECG-monitor palette, diagnostic precision.
# Ground: #0C1714  Accent: #1FD89D (ECG-green)  AI: #8B7EE8 (violet)
# ─────────────────────────────────────────────────────────────────────────────

_CSS = """
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root {
  /* Premium Dark Theme (Apple/Microsoft inspired) */
  --ground:        #000000;
  --surface:       #1C1C1E;
  --surface-2:     #2C2C2E;
  --surface-3:     #3A3A3C;
  --text:          #F2F2F7;
  --text-muted:    #8E8E93;
  --text-dim:      #636366;
  --accent:        #0A84FF;
  --accent-dim:    rgba(10, 132, 255, 0.15);
  --accent-ai:     #30D158;
  --accent-ai-dim: rgba(48, 209, 88, 0.15);
  --border:        #38383A;
  --border-mid:    #48484A;
  --danger:        #FF453A;
  --danger-dim:    rgba(255, 69, 58, 0.15);
  --warning:       #FF9F0A;
  --r-sm:  8px; --r-md: 12px; --r-lg: 18px; --r-xl: 24px;
  --font-ui:   'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.2);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.3);
}

/* ── Base ── */
html, body, [class*="st-"], [class^="st-"] { font-family: var(--font-ui) !important; }
p, li, span, a { color: var(--text); }
[data-testid="stHeader"], #MainMenu, footer,
[data-testid="stDeployButton"]  { display: none !important; }
[data-testid="stApp"]           { background: var(--ground) !important; }
.main .block-container          { padding: 2rem 3rem 6rem !important; max-width: 1400px !important; }
[data-testid="stSidebar"]       { background: var(--surface) !important; border-right: 1px solid var(--border) !important; box-shadow: var(--shadow-sm); }
[data-testid="stSidebarContent"]{ padding: 1.5rem 1rem !important; }
[data-testid="stSidebarNav"]    { display: none !important; }

/* ── Typography ── */
h1,h2,h3,h4,h5,h6 { font-family: var(--font-ui) !important; color: var(--text) !important; letter-spacing: -0.015em; }
h1 { font-weight: 700 !important; font-size: 1.8rem !important; }
h2 { font-weight: 600 !important; font-size: 1.4rem !important; }
.stMarkdown p { color: var(--text) !important; line-height: 1.6 !important; font-size: 0.95rem !important; }
.stMarkdown code { background: var(--surface-2) !important; border: 1px solid var(--border-mid) !important;
  color: var(--text) !important; font-family: var(--font-mono) !important; border-radius: 6px; padding: 0.2em 0.4em; font-size: 0.85em !important; }
.stMarkdown pre { background: var(--surface) !important; border: 1px solid var(--border-mid) !important;
  border-radius: var(--r-md) !important; padding: 1.2rem !important; box-shadow: var(--shadow-sm); }
.stCaption, [data-testid="stCaptionContainer"] { color: var(--text-muted) !important; font-size: 0.8rem !important; }

/* ── Inputs ── */
.stTextInput input, .stTextArea textarea, .stNumberInput input {
  background: var(--surface-2) !important; border: 1px solid var(--border-mid) !important;
  border-radius: var(--r-md) !important; color: var(--text) !important;
  font-family: var(--font-ui) !important; font-size: 0.95rem !important;
  padding: 0.6rem 1rem !important; transition: all 0.2s ease;
}
.stTextInput input:focus, .stTextArea textarea:focus {
  border-color: var(--accent) !important;
  box-shadow: 0 0 0 3px var(--accent-dim) !important; outline: none !important;
}
.stTextInput input::placeholder, .stTextArea textarea::placeholder { color: var(--text-dim) !important; }
.stTextInput label, .stTextArea label, .stSelectbox label,
.stMultiSelect label, .stNumberInput label {
  color: var(--text-muted) !important; font-size: 0.75rem !important;
  font-weight: 600 !important; letter-spacing: 0.05em !important; text-transform: uppercase !important; margin-bottom: 0.4rem !important;
}
.stSelectbox > div > div {
  background: var(--surface-2) !important; border: 1px solid var(--border-mid) !important;
  border-radius: var(--r-md) !important; color: var(--text) !important;
}

/* ── File uploader ── */
[data-testid="stFileUploader"] {
  background: var(--surface-2) !important; border: 2px dashed var(--border-mid) !important;
  border-radius: var(--r-lg) !important; transition: all 0.2s ease; padding: 1.5rem !important;
}
[data-testid="stFileUploader"]:hover { border-color: var(--accent) !important; background: var(--surface-3) !important; }
[data-testid="stFileUploader"] section { background: transparent !important; }

/* ── Buttons ── */
.stButton > button {
  background: var(--surface-2) !important; border: 1px solid var(--border-mid) !important;
  border-radius: var(--r-md) !important; color: var(--text) !important;
  font-family: var(--font-ui) !important; font-size: 0.9rem !important;
  font-weight: 600 !important; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  padding: 0.5rem 1rem !important;
}
.stButton > button:hover {
  background: var(--surface-3) !important; border-color: var(--accent) !important;
  color: var(--accent) !important; transform: translateY(-1px); box-shadow: var(--shadow-sm);
}
.stButton > button:active { transform: translateY(0); }
.stButton > button:focus-visible { outline: 2px solid var(--accent) !important; outline-offset: 2px !important; }

/* Primary Submit Button */
.stFormSubmitButton > button {
  background: var(--accent) !important; border: none !important; color: #FFFFFF !important;
  font-weight: 600 !important; border-radius: var(--r-md) !important; letter-spacing: 0.01em !important;
  box-shadow: 0 2px 5px rgba(10, 132, 255, 0.3) !important;
}
.stFormSubmitButton > button:hover { background: #0070DF !important; color: #FFFFFF !important; border: none !important; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(10, 132, 255, 0.4) !important; }

[data-testid="stDownloadButton"] > button {
  background: var(--accent-dim) !important; border: 1px solid var(--accent) !important;
  color: var(--accent) !important; border-radius: var(--r-md) !important;
}

/* ── Tabs ── */
.stTabs [data-baseweb="tab-list"] {
  background: transparent !important; border-bottom: 1px solid var(--border) !important;
  gap: 1.5rem !important; padding: 0 !important;
}
.stTabs [data-baseweb="tab"] {
  background: transparent !important; color: var(--text-muted) !important;
  font-family: var(--font-ui) !important; font-size: 0.95rem !important;
  font-weight: 500 !important; border: none !important;
  padding: 0.8rem 0 !important; border-radius: 0 !important; transition: color 0.2s ease;
}
.stTabs [aria-selected="true"] { color: var(--text) !important; border-bottom: 2px solid var(--accent) !important; font-weight: 600 !important; }
.stTabs [data-baseweb="tab"]:hover { color: var(--text) !important; }
.stTabs [data-baseweb="tab-highlight"] { display: none !important; }
.stTabs [data-baseweb="tab-panel"] { padding: 2rem 0 0 !important; }

/* ── Chat (ChatGPT / Copilot Style) ── */
[data-testid="stChatMessage"] {
  background: transparent !important; border: none !important; padding: 1rem 0 !important; gap: 1rem !important;
}
[data-testid="stChatMessageContent"] {
  background: transparent !important; border: none !important;
  border-radius: 0 !important; padding: 0 !important; color: var(--text) !important;
}
[data-testid="stChatInput"] {
  background: var(--surface) !important; border: 1px solid var(--border-mid) !important;
  border-radius: var(--r-xl) !important; box-shadow: var(--shadow-md) !important; padding: 0.2rem 0.5rem !important;
}
[data-testid="stChatInput"]:focus-within {
  border-color: var(--accent) !important; box-shadow: 0 0 0 3px var(--accent-dim) !important;
}
[data-testid="stChatInput"] textarea {
  background: transparent !important; border: none !important;
  color: var(--text) !important; font-family: var(--font-ui) !important; font-size: 1rem !important;
}
[data-testid="stChatInput"] button {
  background: var(--accent) !important; border-radius: 50% !important;
  margin: 0.3rem !important; color: #FFFFFF !important; transition: transform 0.2s ease !important;
}
[data-testid="stChatInput"] button:hover { transform: scale(1.05) !important; background: #0070DF !important; }

/* ── Metrics ── */
[data-testid="stMetric"] {
  background: var(--surface) !important; border: 1px solid var(--border) !important;
  border-radius: var(--r-lg) !important; padding: 1.5rem !important; box-shadow: var(--shadow-sm); transition: transform 0.2s ease;
}
[data-testid="stMetric"]:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
[data-testid="stMetricValue"] {
  color: var(--text) !important; font-size: 2rem !important;
  font-weight: 700 !important; letter-spacing: -0.02em !important; margin-top: 0.5rem !important;
}
[data-testid="stMetricLabel"] {
  color: var(--text-muted) !important; font-size: 0.8rem !important;
  font-weight: 600 !important; text-transform: uppercase !important; letter-spacing: 0.05em !important;
}

/* ── Expander ── */
[data-testid="stExpander"] {
  background: var(--surface) !important; border: 1px solid var(--border) !important;
  border-radius: var(--r-lg) !important; overflow: hidden !important; box-shadow: var(--shadow-sm);
}
[data-testid="stExpander"] summary {
  padding: 1rem 1.2rem !important; color: var(--text) !important; font-weight: 600 !important; font-size: 0.95rem !important; transition: background 0.2s ease;
}
[data-testid="stExpander"] summary:hover { background: var(--surface-2) !important; }

/* ── DataFrames ── */
[data-testid="stDataFrame"] {
  border: 1px solid var(--border) !important; border-radius: var(--r-md) !important; overflow: hidden !important; box-shadow: var(--shadow-sm);
}
[data-testid="stDataFrame"] table { width: 100% !important; }
[data-testid="stDataFrame"] th { background: var(--surface-2) !important; color: var(--text-muted) !important; font-weight: 600 !important; padding: 0.8rem !important; }
[data-testid="stDataFrame"] td { padding: 0.8rem !important; border-bottom: 1px solid var(--border) !important; }

/* ── Alerts ── */
[data-testid="stAlert"]        { border-radius: var(--r-md) !important; border: 1px solid var(--border) !important; border-left-width: 4px !important; box-shadow: var(--shadow-sm); }
[data-testid="stSuccessAlert"] { background: var(--surface) !important; border-left-color: var(--accent-ai) !important; }
[data-testid="stErrorAlert"]   { background: var(--surface) !important; border-left-color: var(--danger) !important; }
[data-testid="stInfoAlert"]    { background: var(--surface) !important; border-left-color: var(--accent) !important; }
[data-testid="stWarningAlert"] { background: var(--surface) !important; border-left-color: var(--warning) !important; }

/* ── Spinner ── */
[data-testid="stSpinner"] > div > div { border-top-color: var(--accent) !important; border-width: 3px !important; }

/* ── Misc ── */
hr { border-color: var(--border) !important; margin: 1.5rem 0 !important; }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border-mid); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-dim); }
*:focus-visible { outline: 2px solid var(--accent) !important; outline-offset: 2px !important; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}

/* ══════════════════════════════════════════════
   Custom HTML components
   ══════════════════════════════════════════════ */

/* Brand */
.brand-wrap { padding: 0.5rem 0 1.5rem; }
.brand-lockup { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 0.5rem; }
.brand-icon-box {
  width: 36px; height: 36px; background: linear-gradient(135deg, var(--accent), #005BB5); border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 10px rgba(10, 132, 255, 0.3);
}
.brand-wordmark { font-size: 1.5rem; font-weight: 700; color: var(--text); letter-spacing: -0.02em; }
.brand-tagline  { font-size: 0.85rem; color: var(--text-muted); margin: 0; line-height: 1.4; font-weight: 400; }

/* User card */
.user-card {
  display: flex; align-items: center; gap: 0.8rem;
  padding: 0.8rem; background: var(--surface-2);
  border: 1px solid var(--border); border-radius: var(--r-md); margin-bottom: 1rem; transition: background 0.2s ease;
}
.user-card:hover { background: var(--surface-3); }
.avatar {
  width: 38px; height: 38px; border-radius: 50%;
  background: var(--surface); border: 2px solid var(--accent);
  color: var(--accent); font-size: 0.8rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; box-shadow: var(--shadow-sm);
}
.user-full-name { font-size: 0.9rem; font-weight: 600; color: var(--text); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-email-sm  { font-size: 0.75rem; color: var(--text-muted); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.role-badge { display: inline-flex; align-items: center; padding: 0.15rem 0.5rem; border-radius: 100px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
.role-doctor  { background: var(--accent-dim); color: var(--accent); }
.role-patient { background: var(--accent-ai-dim); color: var(--accent-ai); }
.role-admin   { background: rgba(255,159,10,.15); color: var(--warning); }

/* Sidebar labels */
.sidebar-section { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); padding: 1.5rem 0 0.5rem; display: block; }

/* Live indicator */
.status-live { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; color: var(--accent-ai); font-weight: 600; padding: 0.3rem 0.6rem; background: var(--surface-2); border-radius: 100px; border: 1px solid var(--border); }
.status-dot  { width: 6px; height: 6px; border-radius: 50%; background: var(--accent-ai); animation: beat 2s ease-in-out infinite; box-shadow: 0 0 5px var(--accent-ai); }
@keyframes beat { 0%,100%{opacity:1} 50%{opacity:.4} }

/* Chat Bubbles / Layout */
.chat-message-row { display: flex; gap: 1rem; margin-bottom: 1rem; align-items: flex-start; }
.chat-avatar { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 1rem; box-shadow: var(--shadow-sm); }
.chat-avatar.user { background: var(--surface-2); border: 1px solid var(--border-mid); }
.chat-avatar.ai { background: var(--accent); color: white; }
.chat-content-wrap { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.5rem; }

/* Citation card */
.citation-card {
  background: var(--surface-2); border: 1px solid var(--border);
  border-left: 3px solid var(--accent-ai);
  border-radius: var(--r-md);
  padding: 0.8rem 1rem; margin: 0.5rem 0; box-shadow: var(--shadow-sm); transition: transform 0.2s ease;
}
.citation-card:hover { transform: translateX(2px); border-color: var(--border-mid); }
.citation-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; }
.citation-filename   { font-size: 0.85rem; font-weight: 600; color: var(--text); }
.citation-page       { font-size: 0.75rem; color: var(--text-dim); font-family: var(--font-mono); }
.citation-score-pill { margin-left: auto; background: var(--accent-ai-dim); color: var(--accent-ai); border-radius: 100px; padding: .15rem .6rem; font-size: .7rem; font-family: var(--font-mono); font-weight: 600; border: 1px solid rgba(48,209,88,0.2); }
.citation-text       { font-size: 0.85rem; color: var(--text-muted); line-height: 1.6; margin: 0; font-style: italic; }

/* Document card */
.doc-card {
  background: var(--surface-2); border: 1px solid var(--border);
  border-radius: var(--r-md); padding: 0.8rem 1rem;
  margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.8rem; box-shadow: var(--shadow-sm); transition: all 0.2s ease;
}
.doc-card:hover { border-color: var(--border-mid); transform: translateY(-1px); }
.doc-icon  { font-size: 1.4rem; line-height: 1; flex-shrink: 0; }
.doc-name  { font-size: 0.9rem; font-weight: 600; color: var(--text); }
.doc-meta  { font-size: 0.75rem; color: var(--text-muted); display: block; margin-top: 0.2rem; }
.doc-badge { margin-left: auto; flex-shrink: 0; background: var(--surface-3); border: 1px solid var(--border-mid); color: var(--text); font-size: 0.7rem; font-family: var(--font-mono); padding: .2rem .5rem; border-radius: 6px; font-weight: 500; }

/* Empty states */
.empty-state { text-align: center; padding: 4rem 2rem; background: var(--surface); border: 1px dashed var(--border-mid); border-radius: var(--r-lg); }
.empty-icon  { font-size: 3rem; display: block; margin-bottom: 1rem; opacity: 0.5; }
.empty-title { font-size: 1.1rem; font-weight: 600; color: var(--text); margin: 0 0 0.5rem; }
.empty-body  { font-size: 0.9rem; color: var(--text-muted); margin: 0; line-height: 1.6; }

/* Section heading */
.section-head { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin: 2rem 0 1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }

/* Sources label above citations */
.sources-label { font-size: 0.75rem; font-weight: 700; color: var(--accent-ai); text-transform: uppercase; letter-spacing: 0.08em; margin: 1rem 0 0.5rem; display: flex; align-items: center; gap: 0.4rem; }
.sources-label::before { content: ''; display: inline-block; width: 4px; height: 12px; background: var(--accent-ai); border-radius: 2px; }

/* ── Sidebar radio as navigation ── */
[data-testid="stSidebar"] .stRadio > div {
  display: flex; flex-direction: column; gap: 2px !important;
}
[data-testid="stSidebar"] .stRadio > div > label {
  display: flex !important; align-items: center !important;
  padding: .55rem .75rem !important; border-radius: 10px !important;
  cursor: pointer !important; transition: all .2s ease !important;
  color: var(--text-muted) !important; font-size: .88rem !important;
  font-weight: 500 !important; border: 1px solid transparent !important;
  background: transparent !important; margin: 0 !important;
}
[data-testid="stSidebar"] .stRadio > div > label:hover {
  background: var(--surface-2) !important; color: var(--text) !important;
}
[data-testid="stSidebar"] .stRadio > div > label[data-checked="true"],
[data-testid="stSidebar"] .stRadio > div > label:has(input:checked) {
  background: var(--accent-dim) !important; color: var(--accent) !important;
  font-weight: 600 !important; border-color: rgba(10,132,255,.2) !important;
}
[data-testid="stSidebar"] .stRadio > div > label > div:first-child {
  display: none !important;  /* Hide the default radio circle */
}
[data-testid="stSidebar"] .stRadio > div > label > div:last-child p {
  margin: 0 !important; font-size: inherit !important; color: inherit !important;
}
</style>
"""

# ─────────────────────────────────────────────────────────────────────────────
# State
# ─────────────────────────────────────────────────────────────────────────────

def _init() -> None:
    defaults: dict = {
        "access_token": None,
        "refresh_token": None,
        "user": None,
        "active_chat_id": None,
        "messages": [],
        "language": "auto",
    }
    for k, v in defaults.items():
        st.session_state.setdefault(k, v)


# ─────────────────────────────────────────────────────────────────────────────
# API layer
# ─────────────────────────────────────────────────────────────────────────────

def _headers() -> dict[str, str]:
    tok = st.session_state.get("access_token")
    return {"Authorization": f"Bearer {tok}"} if tok else {}


def api(method: str, path: str, *, silent: bool = False, **kwargs):
    try:
        resp = requests.request(
            method,
            f"{API_URL}{path}",
            headers={**_headers(), **kwargs.pop("headers", {})},
            timeout=120,
            **kwargs,
        )
    except requests.exceptions.ConnectionError:
        if not silent:
            st.error("Cannot reach the API server. Verify it is running and try again.")
        return None
    except requests.exceptions.Timeout:
        if not silent:
            st.error("The request timed out. Try again in a moment.")
        return None
    if resp.status_code >= 400:
        if not silent:
            ct = resp.headers.get("content-type", "")
            if "application/json" in ct:
                data = resp.json()
                if "error" in data and isinstance(data["error"], dict):
                    err = data["error"]
                    detail = err.get("message", resp.text)
                    if "details" in err and isinstance(err["details"], list):
                        msgs = [d.get("msg", str(d)) for d in err["details"]]
                        detail = f"{detail}: {', '.join(msgs)}"
                else:
                    detail = data.get("detail", resp.text)
            else:
                detail = resp.text
            st.error(str(detail))
        return None
    return resp.json()


# ─────────────────────────────────────────────────────────────────────────────
# HTML component builders
# ─────────────────────────────────────────────────────────────────────────────

_CROSS_SVG = (
    '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">'
    '<rect x="8.5" y="2" width="3" height="16" rx="1.5" fill="#FFFFFF"/>'
    '<rect x="2" y="8.5" width="16" height="3" rx="1.5" fill="#FFFFFF"/>'
    '</svg>'
)


def _brand_html(tagline: str = "Enterprise Clinical Intelligence") -> str:
    return (
        '<div class="brand-wrap">'
        '<div class="brand-lockup">'
        f'<div class="brand-icon-box" role="img" aria-label="MediAI logo">{_CROSS_SVG}</div>'
        '<span class="brand-wordmark">MediAI</span>'
        '</div>'
        f'<p class="brand-tagline">{tagline}</p>'
        '</div>'
    )


def _initials(name: str) -> str:
    parts = name.strip().split()
    return "".join(p[0] for p in parts[:2]).upper() or "?"


def _user_card_html(user: dict) -> str:
    initials = _initials(user.get("full_name", "?"))
    role = user.get("role", "user")
    name = user.get("full_name", "")
    email = user.get("email", "")
    return (
        '<div class="user-card" role="region" aria-label="Signed-in user">'
        f'<div class="avatar" aria-hidden="true">{initials}</div>'
        '<div style="flex:1;min-width:0;">'
        f'<span class="user-full-name">{name}</span>'
        f'<span class="user-email-sm">{email}</span>'
        '</div>'
        f'<span class="role-badge role-{role}">{role}</span>'
        '</div>'
    )


def _doc_icon(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return {"pdf": "📄", "docx": "📝", "txt": "📃"}.get(ext, "📎")


def _doc_card_html(doc: dict) -> str:
    icon = _doc_icon(doc.get("filename", ""))
    name = doc.get("filename", "Untitled")
    size_kb = round(doc.get("size_bytes", 0) / 1024, 1)
    chunks = doc.get("chunk_count", 0)
    uploaded = (doc.get("created_at") or "")[:10]
    return (
        '<div class="doc-card">'
        f'<span class="doc-icon" aria-hidden="true">{icon}</span>'
        '<div style="flex:1;min-width:0;">'
        f'<span class="doc-name">{name}</span>'
        f'<span class="doc-meta">{chunks} chunks · {size_kb} KB · {uploaded}</span>'
        '</div>'
        f'<span class="doc-badge">{chunks}×</span>'
        '</div>'
    )


def _citation_html(c: dict) -> str:
    score = c.get("score", 0)
    page = c.get("page") or "n/a"
    filename = c.get("filename", "Source")
    text = (c.get("text") or "")[:220]
    return (
        '<div class="citation-card" role="complementary" aria-label="Source citation">'
        '<div class="citation-row">'
        '<span aria-hidden="true">📄</span>'
        f'<span class="citation-filename">{filename}</span>'
        f'<span class="citation-page">p.{page}</span>'
        f'<span class="citation-score-pill">{score:.2f}</span>'
        '</div>'
        f'<p class="citation-text">"{text}..."</p>'
        '</div>'
    )


def _citations_block(citations: list[dict]) -> str:
    if not citations:
        return ""
    cards = "".join(_citation_html(c) for c in citations[:3])
    return (
        '<div style="margin-top:1rem;">'
        '<span class="sources-label">Sources</span>'
        f'{cards}'
        '</div>'
    )


# ─────────────────────────────────────────────────────────────────────────────
# Plotly theme
# ─────────────────────────────────────────────────────────────────────────────

_CHART_LAYOUT = dict(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    font=dict(color="#F2F2F7", family="Inter, system-ui, sans-serif", size=12),
    xaxis=dict(
        gridcolor="#2C2C2E", linecolor="#38383A",
        tickfont=dict(color="#8E8E93", size=11), title_font=dict(color="#8E8E93", size=12),
    ),
    yaxis=dict(
        gridcolor="#2C2C2E", linecolor="#38383A",
        tickfont=dict(color="#8E8E93", size=11), title_font=dict(color="#8E8E93", size=12),
    ),
    colorway=["#0A84FF", "#30D158", "#FF9F0A", "#FF453A", "#64D2FF"],
    margin=dict(t=40, r=20, b=40, l=50),
    title_font=dict(size=14, color="#F2F2F7", family="Inter"),
    legend=dict(font=dict(color="#8E8E93", size=11), bgcolor="rgba(0,0,0,0)"),
    hoverlabel=dict(bgcolor="#2C2C2E", bordercolor="#38383A", font_color="#F2F2F7", font_family="Inter"),
)


def _theme(fig):
    fig.update_layout(**_CHART_LAYOUT)
    return fig


# ─────────────────────────────────────────────────────────────────────────────
# Auth view
# ─────────────────────────────────────────────────────────────────────────────

def auth_view() -> None:
    _, col, _ = st.columns([1, 1.15, 1])
    with col:
        st.html(_brand_html())
        tab_in, tab_up, tab_rst = st.tabs(["Sign in", "Create account", "Reset password"])

        with tab_in:
            with st.form("login_form"):
                email = st.text_input("Email address", placeholder="you@hospital.org", autocomplete="email")
                password = st.text_input("Password", type="password", placeholder="••••••••••", autocomplete="current-password")
                if st.form_submit_button("Sign in", use_container_width=True):
                    with st.spinner("Authenticating…"):
                        data = api("POST", "/auth/login", json={"email": email, "password": password})
                    if data:
                        st.session_state.access_token = data["access_token"]
                        st.session_state.refresh_token = data["refresh_token"]
                        st.session_state.user = api("GET", "/auth/me")
                        st.rerun()

        with tab_up:
            with st.form("register_form"):
                full_name = st.text_input("Full name", placeholder="Dr. Jane Smith", autocomplete="name")
                reg_email = st.text_input("Work email", placeholder="jane.smith@clinic.org", autocomplete="email")
                role = st.selectbox("Account type", ["patient", "doctor"], format_func=str.capitalize)
                reg_pw = st.text_input(
                    "Password",
                    type="password",
                    placeholder="10+ chars · uppercase · digit · special character",
                    autocomplete="new-password",
                    help="Must be at least 10 characters and include an uppercase letter, a digit, and a special character.",
                )
                if st.form_submit_button("Create account", use_container_width=True):
                    with st.spinner("Creating account…"):
                        data = api(
                            "POST", "/auth/register",
                            json={"email": reg_email, "full_name": full_name, "role": role, "password": reg_pw},
                        )
                    if data:
                        st.success("Account created. Share the verification token below with your administrator, then sign in.")
                        st.code(data.get("email_verification_token", ""), language=None)

        with tab_rst:
            st.html('<p class="section-head">Request a reset token</p>')
            with st.form("forgot_form"):
                forgot_email = st.text_input("Email address", placeholder="you@hospital.org", key="forgot_email")
                if st.form_submit_button("Send reset token", use_container_width=True):
                    data = api("POST", "/auth/forgot-password", json={"email": forgot_email})
                    if data:
                        st.success("If that address is registered, a reset token has been issued.")
                        st.code(data.get("reset_token", ""), language=None)

            st.html('<p class="section-head">Apply a reset token</p>')
            with st.form("reset_form"):
                rst_token = st.text_input("Reset token", placeholder="Paste the token here")
                new_pw = st.text_input("New password", type="password", placeholder="10+ chars · uppercase · digit · special character", autocomplete="new-password")
                if st.form_submit_button("Reset password", use_container_width=True):
                    if api("POST", "/auth/reset-password", json={"token": rst_token, "new_password": new_pw}):
                        st.success("Password updated. You can now sign in.")


# ─────────────────────────────────────────────────────────────────────────────
# Sidebar
# ─────────────────────────────────────────────────────────────────────────────

def sidebar() -> None:
    user = st.session_state.user or {}
    with st.sidebar:
        st.html(_brand_html("Clinical AI assistant"))
        st.html(_user_card_html(user))
        st.html('<span class="status-live"><span class="status-dot"></span>Connected</span>')

        st.html('<span class="sidebar-section">Workspace</span>')
        st.selectbox(
            "Response language",
            ["auto", "English", "Hindi", "Spanish", "French", "German"],
            key="language",
            label_visibility="collapsed",
            help="Language for AI responses. 'Auto' detects from your message.",
        )
        if st.button("＋  New chat", use_container_width=True, key="new_chat_btn"):
            st.session_state.active_chat_id = None
            st.session_state.messages = []
            st.rerun()

        st.html('<span class="sidebar-section">Conversations</span>')
        query = st.text_input(
            "Search conversations",
            placeholder="Search…",
            label_visibility="collapsed",
            key="chat_search",
        )
        chats = (
            api("GET", f"/chat/search?q={query}", silent=True)
            if query
            else api("GET", "/chat/history", silent=True)
        )
        for chat in chats or []:
            pin = "● " if chat.get("pinned") else ""
            label = f"{pin}{chat['title']}"
            updated = (chat.get("updated_at") or "")[:10]
            if st.button(label, key=f"c_{chat['_id']}", use_container_width=True, help=f"Last updated {updated}"):
                sel = api("GET", f"/chat/{chat['_id']}", silent=True)
                if sel:
                    st.session_state.active_chat_id = chat["_id"]
                    st.session_state.messages = sel.get("messages", [])
                    st.rerun()

        if st.session_state.active_chat_id:
            st.markdown("---")
            current_title = (st.session_state.messages[0]["content"][:60] if st.session_state.messages else "")
            new_title = st.text_input(
                "Rename",
                value=current_title,
                key="rename_input",
                label_visibility="collapsed",
                placeholder="Chat title…",
            )
            c1, c2 = st.columns(2)
            with c1:
                if st.button("Rename", use_container_width=True, key="rename_btn") and new_title:
                    api("PATCH", f"/chat/rename/{st.session_state.active_chat_id}", json={"title": new_title})
                    st.rerun()
            with c2:
                if st.button("Pin", use_container_width=True, key="pin_btn"):
                    api("PATCH", f"/chat/pin/{st.session_state.active_chat_id}?pinned=true")
                    st.rerun()
            c3, c4 = st.columns(2)
            with c3:
                exported = api("GET", f"/chat/export/{st.session_state.active_chat_id}", silent=True)
                if exported:
                    st.download_button(
                        "Export",
                        json.dumps(exported, indent=2),
                        file_name="mediai-chat.json",
                        mime="application/json",
                        use_container_width=True,
                    )
            with c4:
                if st.button("Delete", use_container_width=True, key="delete_btn"):
                    api("DELETE", f"/chat/delete/{st.session_state.active_chat_id}")
                    st.session_state.active_chat_id = None
                    st.session_state.messages = []
                    st.rerun()

        st.markdown("---")
        if st.button("Sign out", use_container_width=True, key="logout_btn"):
            if st.session_state.refresh_token:
                api("POST", "/auth/logout", json={"refresh_token": st.session_state.refresh_token}, silent=True)
            st.session_state.clear()
            st.rerun()


# ─────────────────────────────────────────────────────────────────────────────
# Document panel
# ─────────────────────────────────────────────────────────────────────────────

def document_panel() -> None:
    with st.expander("Document workspace", expanded=False):
        files = st.file_uploader(
            "Upload medical documents",
            type=["pdf", "docx", "txt"],
            accept_multiple_files=True,
            help="Supported: PDF, DOCX, TXT · Max 25 MB per file · Files are indexed for retrieval.",
        )
        if files and st.button("Ingest documents", use_container_width=True, key="ingest_btn"):
            with st.spinner(f"Indexing {len(files)} document(s)…"):
                multipart = [("files", (f.name, f.getvalue(), f.type or "application/octet-stream")) for f in files]
                data = api("POST", "/upload", files=multipart)
            if data:
                st.success(f"{len(data)} document(s) indexed — ready to query.")

        docs = api("GET", "/documents", silent=True) or []
        if docs:
            st.html('<p class="section-head">Indexed documents</p>')
            cards_html = "".join(_doc_card_html(d) for d in docs)
            st.html(cards_html)
            doc_map = {d["filename"]: d["_id"] for d in docs}
            selected = st.selectbox("Remove document", list(doc_map.keys()), label_visibility="collapsed")
            if st.button("Remove selected document", use_container_width=True, key="del_doc_btn"):
                with st.spinner("Removing and rebuilding index…"):
                    api("DELETE", f"/documents/{doc_map[selected]}")
                st.rerun()
        else:
            st.html(
                '<div class="empty-state">'
                '<span class="empty-icon" aria-hidden="true">📂</span>'
                '<p class="empty-title">No documents indexed</p>'
                '<p class="empty-body">Upload PDFs, DOCX, or TXT files to ground AI responses in your clinical data.</p>'
                '</div>'
            )


# ─────────────────────────────────────────────────────────────────────────────
# Chat view
# ─────────────────────────────────────────────────────────────────────────────

def chat_view() -> None:
    document_panel()

    if not st.session_state.messages:
        st.html(
            '<div class="empty-state" style="padding:4rem 1rem;">'
            '<span class="empty-icon" aria-hidden="true">💬</span>'
            '<p class="empty-title">Start a clinical consultation</p>'
            '<p class="empty-body">'
            'Ask about symptoms, lab results, medication interactions, or uploaded reports.<br>'
            'All answers cite their source documents.'
            '</p>'
            '</div>'
        )

    for msg in st.session_state.messages:
        avatar = "🧑‍⚕️" if msg["role"] == "user" else "⚕️"
        with st.chat_message(msg["role"], avatar=avatar):
            st.markdown(msg["content"])
            if msg.get("citations"):
                st.html(_citations_block(msg["citations"]))

    prompt = st.chat_input("Ask about your documents, symptoms, medications, or lab values…")
    if not prompt:
        return

    st.session_state.messages.append({
        "role": "user",
        "content": prompt,
        "created_at": datetime.utcnow().isoformat(),
        "citations": [],
    })
    with st.chat_message("user", avatar="🧑‍⚕️"):
        st.markdown(prompt)

    with st.chat_message("assistant", avatar="⚕️"):
        stream_area = st.empty()
        payload = {
            "message": prompt,
            "chat_id": st.session_state.active_chat_id,
            "language": st.session_state.language,
            "top_k": 5,
        }
        try:
            with requests.post(
                f"{API_URL}/chat/stream",
                headers=_headers(),
                json=payload,
                stream=True,
                timeout=180,
            ) as response:
                if response.status_code >= 400:
                    st.error("The AI service returned an error. Please try again.")
                    return
                answer = ""
                citations: list[dict] = []
                for raw_line in response.iter_lines():
                    if not raw_line or not raw_line.startswith(b"data: "):
                        continue
                    event = json.loads(raw_line[6:])
                    if "token" in event:
                        answer += event["token"]
                        stream_area.markdown(answer + " ▌")
                    if event.get("done"):
                        st.session_state.active_chat_id = event["chat_id"]
                        citations = event.get("citations", [])
                stream_area.markdown(answer)
        except requests.exceptions.Timeout:
            st.error("The response timed out. Try rephrasing your question or try again shortly.")
            return
        except requests.exceptions.ConnectionError:
            st.error("Connection lost. Verify the API server is running.")
            return

        if citations:
            st.html(_citations_block(citations))

        st.session_state.messages.append({
            "role": "assistant",
            "content": answer,
            "created_at": datetime.utcnow().isoformat(),
            "citations": citations,
        })


# ─────────────────────────────────────────────────────────────────────────────
# Admin dashboard
# ─────────────────────────────────────────────────────────────────────────────

def admin_view() -> None:
    data = api("GET", "/admin/dashboard")
    if not data:
        return

    storage_mb = round(data["storage_usage"]["bytes"] / (1024 * 1024), 2)
    usage = data.get("token_usage", {})
    response_time_list = data.get("response_time_ms") or [{}]
    latency = response_time_list[0].get("value", 0) if response_time_list else 0

    # ── KPI row 1: platform health ──
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Total users", f"{data['total_users']:,}")
    c2.metric("Active (14 days)", f"{data['active_users']:,}")
    c3.metric("Indexed documents", f"{data['uploaded_files']:,}")
    c4.metric("Storage (MB)", f"{storage_mb:,.2f}")

    # ── KPI row 2: LLM telemetry ──
    u1, u2, u3, u4 = st.columns(4)
    u1.metric("Prompt tokens", f"{usage.get('prompt_tokens', 0):,}")
    u2.metric("Completion tokens", f"{usage.get('completion_tokens', 0):,}")
    u3.metric("Total tokens", f"{usage.get('total_tokens', 0):,}")
    u4.metric("Avg latency (ms)", f"{latency:.0f}" if latency else "—")

    # ── Charts ──
    chart_l, chart_r = st.columns(2)
    with chart_l:
        if data.get("queries_per_day"):
            fig = px.area(
                data["queries_per_day"],
                x="date", y="count",
                title="Queries per day — last 14 days",
                labels={"date": "", "count": "Queries"},
                color_discrete_sequence=["#1FD89D"],
            )
            fig.update_traces(line_color="#1FD89D", fillcolor="rgba(31,216,157,0.08)")
            st.plotly_chart(_theme(fig), use_container_width=True)
        else:
            st.info("No query data available yet.")

    with chart_r:
        if any(usage.values()):
            fig2 = px.bar(
                x=["Prompt", "Completion", "Total"],
                y=[usage.get("prompt_tokens", 0), usage.get("completion_tokens", 0), usage.get("total_tokens", 0)],
                title="Token usage by type",
                labels={"x": "", "y": "Tokens"},
                color_discrete_sequence=["#8B7EE8"],
            )
            st.plotly_chart(_theme(fig2), use_container_width=True)
        else:
            st.info("No token usage data yet.")

    ent_l, ent_r = st.columns(2)
    with ent_l:
        if data.get("top_diseases"):
            fig3 = px.bar(
                data["top_diseases"], x="count", y="name",
                orientation="h", title="Top diseases mentioned",
                labels={"count": "Mentions", "name": ""},
                color_discrete_sequence=["#F59E0B"],
            )
            fig3.update_layout(yaxis=dict(autorange="reversed"))
            st.plotly_chart(_theme(fig3), use_container_width=True)

    with ent_r:
        if data.get("top_medicines"):
            fig4 = px.bar(
                data["top_medicines"], x="count", y="name",
                orientation="h", title="Top medicines mentioned",
                labels={"count": "Mentions", "name": ""},
                color_discrete_sequence=["#38BDF8"],
            )
            fig4.update_layout(yaxis=dict(autorange="reversed"))
            st.plotly_chart(_theme(fig4), use_container_width=True)

    if data.get("most_asked_questions"):
        st.html('<p class="section-head">Most asked questions</p>')
        st.dataframe(
            [{"Question": q["question"], "Times asked": q["count"]} for q in data["most_asked_questions"]],
            use_container_width=True,
            hide_index=True,
        )


def main() -> None:
    st.html(_CSS)
    _init()

    if not st.session_state.access_token:
        auth_view()
        return

    user = st.session_state.user or {}

    if user.get("role") in ["admin", "doctor"]:
        # ── Doctor / Admin sidebar with icon navigation ──
        with st.sidebar:
            st.html(_brand_html("MediAI Clinical OS"))
            st.html(_user_card_html(user))
            st.html('<span class="status-live"><span class="status-dot"></span>Connected</span>')

            st.html('<span class="sidebar-section">Navigation</span>')
            nav_options = ["👥  Patient Directory", "📈  Analytics & Usage"]
            nav = st.radio("Nav", nav_options, label_visibility="collapsed", key="nav_radio_doctor")

            st.markdown("---")
            if st.button("Sign out", use_container_width=True, key="logout_btn_doctor"):
                if st.session_state.refresh_token:
                    api("POST", "/auth/logout", json={"refresh_token": st.session_state.refresh_token}, silent=True)
                st.session_state.clear()
                st.rerun()
                
        # ── Route views ──
        if nav == "👥  Patient Directory":
            from doctor_dashboard_view import render_doctor_dashboard
            render_doctor_dashboard(api, user)
        elif nav == "📈  Analytics & Usage":
            admin_view()
    else:
        # ── Patient sidebar with icon navigation ──
        with st.sidebar:
            st.html(_brand_html("Personal AI Health OS"))
            st.html(_user_card_html(user))
            st.html('<span class="status-live"><span class="status-dot"></span>Connected</span>')

            st.html('<span class="sidebar-section">Navigation</span>')

            nav_options = ["🏠  Overview", "🤖  AI Doctor", "📄  Reports", "🩺  Symptoms"]
            nav = st.radio("Nav", nav_options, label_visibility="collapsed", key="nav_radio")

            st.html('<span class="sidebar-section">Workspace</span>')
            st.selectbox(
                "Response language",
                ["auto", "English", "Hindi", "Spanish", "French", "German"],
                key="language",
                label_visibility="collapsed",
                help="Language for AI responses. 'Auto' detects from your message.",
            )

            st.markdown("---")
            if st.button("Sign out", use_container_width=True, key="logout_btn"):
                if st.session_state.refresh_token:
                    api("POST", "/auth/logout", json={"refresh_token": st.session_state.refresh_token}, silent=True)
                st.session_state.clear()
                st.rerun()

        # ── Route views ──
        if nav == "🏠  Overview":
            from dashboard_view import render_dashboard
            render_dashboard(api, user)
        elif nav == "🤖  AI Doctor":
            chat_view()
        elif nav == "📄  Reports":
            document_panel()
        elif nav == "🩺  Symptoms":
            _symptoms_standalone_view()


def _symptoms_standalone_view() -> None:
    """Standalone symptom view accessible from sidebar nav."""
    from dashboard_view import render_dashboard
    # We render just the symptom section by calling the dashboard
    # but for now, redirect to dashboard which includes symptom tracker
    st.html('<h2 style="margin-bottom:.5rem;">Symptom Tracker</h2>')
    st.html('<p style="color:#8E8E93;font-size:.9rem;margin-bottom:1.5rem;">Log and track your daily symptoms. MediAI analyzes patterns over time.</p>')

    symptoms = api("GET", "/patient/symptoms", silent=True) or []

    sym_left, sym_right = st.columns([1, 2])
    with sym_left:
        with st.form("symptom_form_standalone", border=False):
            st.markdown("##### Log a Symptom")
            sym = st.text_input("Symptom", placeholder="e.g. Headache, Fatigue, Nausea")
            sev = st.slider("Severity", 1, 10, 5, help="1 = mild, 10 = severe")
            notes = st.text_input("Notes", placeholder="Optional details…")
            if st.form_submit_button("Log Symptom", use_container_width=True):
                if sym.strip():
                    api("POST", "/patient/symptoms", json={"symptom": sym.strip(), "severity": sev, "notes": notes})
                    st.rerun()
                else:
                    st.warning("Please enter a symptom name.")

    with sym_right:
        if symptoms:
            import pandas as pd
            import plotly.express as px
            df_sym = pd.DataFrame(symptoms)
            if "severity" in df_sym.columns and "date" in df_sym.columns:
                fig_sym = px.scatter(
                    df_sym, x="date", y="severity", color="symptom",
                    size="severity", size_max=14,
                    title="Symptom Severity Over Time",
                )
                fig_sym.update_layout(
                    paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
                    font=dict(color="#8E8E93"), xaxis_title="", yaxis_title="Severity",
                    yaxis=dict(range=[0, 11]),
                )
                st.plotly_chart(fig_sym, use_container_width=True, key="symptom_standalone")

    if symptoms:
        import pandas as pd
        st.html('<p style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#636366;padding:1.5rem 0 .5rem;">Symptom History</p>')
        df_hist = pd.DataFrame(symptoms)[["date", "symptom", "severity", "notes"]]
        st.dataframe(df_hist, hide_index=True, use_container_width=True)


if __name__ == "__main__":
    main()

