import streamlit as st
import pandas as pd
from datetime import datetime
import plotly.express as px

def render_doctor_dashboard(api_client, user: dict) -> None:
    """Main entry point for the Doctor Portal UI."""
    
    st.html("""
    <style>
    .doctor-header {
        padding: 1rem 0 2rem;
        border-bottom: 1px solid var(--surface-2);
        margin-bottom: 2rem;
    }
    .doctor-title { font-size: 1.8rem; font-weight: 700; margin: 0; color: var(--text); }
    .doctor-subtitle { font-size: 0.95rem; color: var(--text-muted); margin-top: 0.4rem; }
    
    .patient-row {
        background: var(--surface);
        border: 1px solid var(--surface-2);
        border-radius: 12px;
        padding: 1rem;
        margin-bottom: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: all 0.2s ease;
    }
    .patient-row:hover {
        border-color: rgba(255,255,255,0.15);
        transform: translateY(-1px);
    }
    .patient-info h4 { margin: 0; font-size: 1.1rem; color: var(--text); }
    .patient-info p { margin: 0.2rem 0 0; font-size: 0.85rem; color: var(--text-muted); }
    
    .risk-High { color: var(--danger); background: rgba(255,69,58,0.1); padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; }
    .risk-Medium { color: var(--warning); background: rgba(255,159,10,0.1); padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; }
    .risk-Low { color: var(--success); background: rgba(48,209,88,0.1); padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; }
    </style>
    """)

    # State management for navigation within the doctor portal
    if "doc_nav" not in st.session_state:
        st.session_state.doc_nav = "directory"
    if "selected_patient" not in st.session_state:
        st.session_state.selected_patient = None

    if st.session_state.doc_nav == "directory":
        _render_directory(api_client)
    elif st.session_state.doc_nav == "patient_detail":
        _render_patient_detail(api_client)

def _render_directory(api) -> None:
    st.html(f"""
    <div class="doctor-header">
        <h1 class="doctor-title">Patient Directory</h1>
        <p class="doctor-subtitle">Manage your assigned patients and review incoming clinical data.</p>
    </div>
    """)
    
    tab_my, tab_search = st.tabs(["👥 My Patients", "🔍 Global Directory"])
    
    with tab_my:
        patients = api("GET", "/doctor/patients", silent=True) or []
        if not patients:
            st.info("No patients assigned to you yet. Use the Global Directory to assign patients.")
        else:
            for p in patients:
                c1, c2, c3, c4 = st.columns([3, 2, 2, 2])
                with c1:
                    st.html(f"""
                    <div class="patient-info">
                        <h4>{p.get('full_name') or 'Unknown Patient'}</h4>
                        <p>{p.get('email', '')}</p>
                    </div>
                    """)
                with c2:
                    age = p.get('age') or '--'
                    gender = p.get('gender') or '--'
                    st.html(f"<p style='color:var(--text-muted);font-size:0.9rem;margin-top:0.5rem;'>{age} y/o • {gender}</p>")
                with c3:
                    risk = p.get("risk_level", "Low")
                    st.html(f"<span class='risk-{risk}' style='display:inline-block;margin-top:0.5rem;'>{risk} Risk</span>")
                with c4:
                    if st.button("View Chart", key=f"btn_view_{p['id']}", use_container_width=True):
                        st.session_state.selected_patient = p
                        st.session_state.doc_nav = "patient_detail"
                        st.rerun()
                st.html("<hr style='margin: 0.5rem 0; border-color: var(--surface-2);'>")

    with tab_search:
        st.markdown("##### Global Patient Registry")
        all_patients = api("GET", "/doctor/patients/all", silent=True) or []
        if not all_patients:
            st.info("No patients found in the system.")
        else:
            for p in all_patients:
                c1, c2, c3 = st.columns([4, 2, 2])
                with c1:
                    st.html(f"""
                    <div class="patient-info">
                        <h4>{p.get('full_name') or 'Unknown Patient'}</h4>
                        <p>{p.get('email', '')}</p>
                    </div>
                    """)
                with c2:
                    st.html(f"<p style='color:var(--text-muted);font-size:0.9rem;margin-top:0.5rem;'>ID: {p['id'][:8]}...</p>")
                with c3:
                    if st.button("Assign to Me", key=f"btn_assign_{p['id']}", use_container_width=True, type="primary"):
                        api("POST", f"/doctor/patients/{p['id']}/assign")
                        st.success("Assigned!")
                        st.rerun()
                st.html("<hr style='margin: 0.5rem 0; border-color: var(--surface-2);'>")

def _render_patient_detail(api) -> None:
    if st.button("← Back to Directory"):
        st.session_state.doc_nav = "directory"
        st.session_state.selected_patient = None
        st.rerun()
        
    p = st.session_state.selected_patient
    if not p:
        return
        
    st.html(f"""
    <div class="doctor-header" style="display:flex;justify-content:space-between;align-items:center;">
        <div>
            <h1 class="doctor-title">{p.get('full_name')}</h1>
            <p class="doctor-subtitle">Clinical 360 View</p>
        </div>
        <span class='risk-{p.get("risk_level", "Low")}'>{p.get("risk_level", "Low")} Risk</span>
    </div>
    """)
    
    # Fetch overview
    with st.spinner("Loading clinical data..."):
        overview = api("GET", f"/doctor/patients/{p['id']}/overview", silent=True)
    
    if not overview:
        st.error("Failed to load patient data.")
        return
        
    # Layout: Left side clinical data, Right side Doctor AI
    col_clinical, col_ai = st.columns([3, 2], gap="large")
    
    with col_clinical:
        st.subheader("Active Conditions")
        conds = overview.get("chronic_conditions", [])
        if conds:
            for c in conds:
                st.markdown(f"- {c}")
        else:
            st.write("No chronic conditions documented.")
            
        st.subheader("Vitals Timeline 📈")
        vitals = overview.get("recent_vitals", [])
        if vitals:
            df = pd.DataFrame(vitals)
            if "date" in df.columns and "vital_name" in df.columns and "value" in df.columns:
                df["value"] = pd.to_numeric(df["value"], errors="coerce")
                fig = px.line(
                    df.dropna(subset=["value"]), 
                    x="date", y="value", color="vital_name", markers=True,
                    title="Continuous Vitals Monitoring"
                )
                fig.update_layout(
                    paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
                    font=dict(color="#F2F2F7"), legend_title_text="Vital Sign",
                    margin=dict(l=20, r=20, t=40, b=20)
                )
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.dataframe(df, hide_index=True, use_container_width=True)
        else:
            st.info("No vitals recorded in timeline.")
            
        st.subheader("Current Medications")
        meds = overview.get("active_medications", [])
        if meds:
            df_m = pd.DataFrame(meds)
            st.dataframe(df_m, hide_index=True, use_container_width=True)
        else:
            st.write("No active medications.")
            
        st.subheader("Clinical Notes")
        notes = api("GET", f"/doctor/patients/{p['id']}/notes", silent=True) or []
        for n in notes:
            with st.expander(f"{n.get('title', 'Note')} - {n.get('created_at', '')[:10]}"):
                st.markdown(n.get("content", ""))

    with col_ai:
        st.html("""
        <div style="background:var(--surface-2);padding:1.5rem;border-radius:12px;border:1px solid rgba(10,132,255,0.2);">
            <h3 style="margin-top:0;display:flex;align-items:center;gap:0.5rem;">
                🤖 Doctor AI Assistant
            </h3>
            <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:1.5rem;">
                Generate clinical documentation based on patient history.
            </p>
        </div>
        """)
        
        task_map = {
            "SOAP Note": "soap_note",
            "Clinical Summary": "clinical_summary",
            "Differential Diagnosis": "differential_diagnosis",
            "Lab Explanation": "lab_explanation"
        }
        
        task_choice = st.selectbox("Select Task", list(task_map.keys()))
        context = st.text_area("Additional Context (Optional)", placeholder="e.g. Patient presents with acute lower back pain...")
        
        if st.button("Generate Output", type="primary", use_container_width=True):
            with st.spinner("Doctor AI is analyzing..."):
                payload = {
                    "patient_id": p['id'],
                    "task_type": task_map[task_choice],
                    "additional_context": context
                }
                res = api("POST", "/doctor/ai/generate", json=payload)
                if res and "content" in res:
                    st.session_state.ai_output = res["content"]
                    st.session_state.ai_task = task_choice
                    
        if "ai_output" in st.session_state:
            st.markdown("---")
            st.markdown(f"**Generated {st.session_state.ai_task}**")
            st.info("⚠️ AI generated. Clinical verification required.")
            st.markdown(st.session_state.ai_output)
            
            if st.button("Save to Clinical Notes"):
                payload = {
                    "patient_id": p['id'],
                    "title": f"AI {st.session_state.ai_task}",
                    "content": st.session_state.ai_output,
                    "note_type": task_map.get(st.session_state.ai_task, "general")
                }
                api("POST", "/doctor/notes", json=payload)
                st.success("Note saved.")
                del st.session_state.ai_output
                st.rerun()
