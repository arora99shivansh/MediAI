"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertCircle, Bell, Settings, ShieldCheck, UserRound, NotebookPen } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type PatientProfile = {
  profile?: {
    age?: number;
    gender?: string;
    allergies?: string[];
    chronic_conditions?: string[];
    risk_predictions?: Array<{ risk_level?: string }>;
  };
  age?: number;
  gender?: string;
  allergies?: string[];
  chronic_conditions?: string[];
  risk_predictions?: Array<{ risk_level?: string }>;
};

type AlertItem = {
  id: string;
  title?: string;
  message?: string;
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSymptom, setSavingSymptom] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({ symptom: "", severity: 5, notes: "" });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [profileRes, alertsRes] = await Promise.all([
          api.get("/patient/profile"),
          api.get("/patient/alerts"),
        ]);
        setProfile(profileRes.data as PatientProfile);
        setAlerts(alertsRes.data as AlertItem[]);
      } catch (error) {
        console.error("Failed to load patient settings", error);
      } finally {
        setLoading(false);
      }
    };

    void loadSettings();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingSymptom(true);
    setSaved(false);
    try {
      await api.post("/patient/symptoms", formData);
      setFormData({ symptom: "", severity: 5, notes: "" });
      setSaved(true);
    } catch (error) {
      console.error("Failed to save symptom", error);
    } finally {
      setSavingSymptom(false);
    }
  };

  const normalizedProfile = profile?.profile || profile || {};
  const riskPredictions = normalizedProfile.risk_predictions || [];
  const highestRisk = riskPredictions.some((prediction) => prediction.risk_level === "High")
    ? "High"
    : riskPredictions.some((prediction) => prediction.risk_level === "Medium")
      ? "Medium"
      : "Low";

  if (loading) {
    return <div className="p-8 text-slate-500">Loading account center...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Account Center</h1>
        <p className="mt-2 text-slate-500">Review your secure account details, health profile, and symptom intake settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Role</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 capitalize">{user?.role || "patient"}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Risk Level</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{highestRisk}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Open Alerts</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{alerts.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <UserRound className="w-5 h-5 text-blue-500" /> Account Snapshot
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Full Name</p>
              <p className="mt-2 text-slate-900 font-medium">{user?.full_name || "Not available"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
              <p className="mt-2 text-slate-900 font-medium">{user?.email || "Not available"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Age</p>
              <p className="mt-2 text-slate-900 font-medium">{normalizedProfile.age ?? "Unknown"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gender</p>
              <p className="mt-2 text-slate-900 font-medium">{normalizedProfile.gender || "Unknown"}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" /> Security & Alerts
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900">Session security</p>
                  <p className="text-sm text-slate-500">JWT session and refresh token flow are enabled for your account.</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-900">Current alerts</p>
                  <p className="text-sm text-slate-500">{alerts.length > 0 ? alerts[0].title || alerts[0].message : "No active alerts."}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" /> Health Profile
            </h2>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <p className="text-sm font-semibold text-slate-700">Allergies</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(normalizedProfile.allergies || []).length > 0 ? (
                  (normalizedProfile.allergies || []).map((allergy) => (
                    <span key={allergy} className="rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700">
                      {allergy}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No allergies recorded.</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Chronic Conditions</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(normalizedProfile.chronic_conditions || []).length > 0 ? (
                  (normalizedProfile.chronic_conditions || []).map((condition) => (
                    <span key={condition} className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                      {condition}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No chronic conditions recorded.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <NotebookPen className="w-5 h-5 text-purple-500" /> Quick Symptom Log
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Symptom</label>
              <input
                value={formData.symptom}
                onChange={(event) => setFormData((current) => ({ ...current, symptom: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500"
                placeholder="Headache, dizziness, cough..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Severity</label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.severity}
                onChange={(event) => setFormData((current) => ({ ...current, severity: Number(event.target.value) }))}
                className="w-full"
              />
              <p className="text-sm text-slate-500">Current severity: {formData.severity}/10</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500"
                rows={4}
                placeholder="Add timing, triggers, or anything your doctor should know."
              />
            </div>
            <button
              type="submit"
              disabled={savingSymptom}
              className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white hover:bg-black disabled:opacity-60"
            >
              {savingSymptom ? "Saving..." : "Save Symptom"}
            </button>
            {saved && <p className="text-sm font-medium text-emerald-600">Symptom saved to your record.</p>}
          </form>
        </section>
      </div>
    </div>
  );
}
