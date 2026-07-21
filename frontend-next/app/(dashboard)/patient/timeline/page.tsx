"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Clock3, NotebookPen } from "lucide-react";
import api from "@/lib/api";

type TimelineEntry = {
  id: string;
  date?: string;
  title?: string;
  metric?: string;
  value?: string | number;
  note?: string;
};

type SymptomEntry = {
  id: string;
  symptom: string;
  severity: number;
  notes?: string;
  date?: string;
};

type AlertItem = {
  id: string;
  title?: string;
  message?: string;
  created_at?: string;
};

export default function TimelinePage() {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadInitialData = async () => {
      try {
        const [timelineRes, symptomsRes, alertsRes] = await Promise.all([
          api.get("/patient/timeline"),
          api.get("/patient/symptoms"),
          api.get("/patient/alerts"),
        ]);

        if (!active) {
          return;
        }

        setTimeline(timelineRes.data as TimelineEntry[]);
        setSymptoms(symptomsRes.data as SymptomEntry[]);
        setAlerts(alertsRes.data as AlertItem[]);
      } catch (loadError) {
        console.error(loadError);
        if (active) {
          setError("Unable to load your longitudinal record right now.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  const resolveAlert = async (alertId: string) => {
    setResolvingId(alertId);
    try {
      await api.post(`/patient/alerts/${alertId}/resolve`);
      setAlerts((current) => current.filter((alert) => alert.id !== alertId));
    } catch (resolveError) {
      console.error(resolveError);
    } finally {
      setResolvingId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-500">Loading timeline...</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900">Health Timeline</h1>
        <p className="text-slate-500">Track clinical events, symptom logs, and unresolved alerts in one place.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Timeline Events</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{timeline.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Symptom Logs</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{symptoms.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Open Alerts</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{alerts.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" /> Clinical Events
            </h2>
          </div>
          <div className="p-6">
            {timeline.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                Your care timeline will populate here as appointments, vitals, and reports are added.
              </div>
            ) : (
              <div className="space-y-4">
                {timeline.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{entry.title || entry.metric || "Recorded event"}</p>
                        <p className="mt-1 text-sm text-slate-500">{entry.note || "Added to your medical history."}</p>
                      </div>
                      <div className="text-right text-sm text-slate-500">
                        <p>{entry.date || "Undated"}</p>
                        {(entry.metric || entry.value) && (
                          <p className="mt-1 font-medium text-slate-700">
                            {[entry.metric, entry.value].filter(Boolean).join(": ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Active Alerts
              </h2>
            </div>
            <div className="p-6 space-y-3">
              {alerts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  No active alerts at the moment.
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="font-semibold text-slate-900">{alert.title || "Patient alert"}</p>
                    <p className="mt-1 text-sm text-slate-600">{alert.message || "A clinician flagged this record for follow-up."}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-500">{alert.created_at ? new Date(alert.created_at).toLocaleString() : "Needs review"}</span>
                      <button
                        onClick={() => void resolveAlert(alert.id)}
                        disabled={resolvingId === alert.id}
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {resolvingId === alert.id ? "Resolving..." : "Mark Resolved"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <NotebookPen className="w-5 h-5 text-emerald-500" /> Recent Symptoms
              </h2>
            </div>
            <div className="p-6 space-y-3">
              {symptoms.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  No symptom logs yet.
                </div>
              ) : (
                symptoms.slice(0, 6).map((symptom) => (
                  <div key={symptom.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold text-slate-900">{symptom.symptom}</p>
                      <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        <Clock3 className="w-3.5 h-3.5" /> Severity {symptom.severity}/10
                      </div>
                    </div>
                    {symptom.notes && <p className="mt-2 text-sm text-slate-600">{symptom.notes}</p>}
                    <p className="mt-2 text-xs text-slate-500">{symptom.date || "Recently added"}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
