"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ShieldAlert, Sparkles } from "lucide-react";
import api from "@/lib/api";

type Patient = {
  id: string;
  full_name: string;
  email: string;
  risk_level?: string;
  chronic_conditions?: string[];
};

type PatientWithNotes = Patient & {
  noteCount: number;
};

export default function ReportsPage() {
  const [patients, setPatients] = useState<PatientWithNotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReports = async () => {
      try {
        const patientsRes = await api.get("/doctor/patients");
        const roster = patientsRes.data as Patient[];
        const noteCounts = await Promise.all(
          roster.map(async (patient) => {
            try {
              const notesRes = await api.get(`/doctor/patients/${patient.id}/notes`);
              return { ...patient, noteCount: Array.isArray(notesRes.data) ? notesRes.data.length : 0 };
            } catch (notesError) {
              console.error("Failed to load patient notes", notesError);
              return { ...patient, noteCount: 0 };
            }
          })
        );
        setPatients(noteCounts);
      } catch (loadError) {
        console.error(loadError);
        setError("Unable to load patient reporting data right now.");
      } finally {
        setLoading(false);
      }
    };

    void loadReports();
  }, []);

  if (loading) {
    return <div className="p-8 text-slate-500">Loading reports workspace...</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>;
  }

  const highRiskCount = patients.filter((patient) => patient.risk_level === "High").length;
  const patientsWithNotes = patients.filter((patient) => patient.noteCount > 0).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Clinical Reports</h1>
        <p className="mt-2 text-slate-500">Review your patient roster, note coverage, and high-priority charts ready for deeper analysis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Assigned Patients</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{patients.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Charts With Notes</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{patientsWithNotes}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">High-Risk Reviews</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{highRiskCount}</p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" /> Patient Reporting Queue
          </h2>
        </div>
        <div className="p-6">
          {patients.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
              Once patients are assigned to your practice, their charts will appear here for note review and AI-assisted reporting.
            </div>
          ) : (
            <div className="space-y-4">
              {patients.map((patient) => (
                <div key={patient.id} className="rounded-xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold text-slate-900">{patient.full_name}</p>
                        {patient.risk_level === "High" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                            <ShieldAlert className="w-3.5 h-3.5" /> High Risk
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{patient.email}</p>
                      <p className="text-sm text-slate-600">
                        {(patient.chronic_conditions || []).length > 0
                          ? `Conditions: ${patient.chronic_conditions?.join(", ")}`
                          : "No chronic conditions recorded."}
                      </p>
                      <p className="text-sm text-slate-600">{patient.noteCount} saved clinical note(s)</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/doctor/patients/${patient.id}`}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Open Chart
                      </Link>
                      <Link
                        href={`/doctor/patients/${patient.id}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        <Sparkles className="w-4 h-4" /> Generate Report
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
