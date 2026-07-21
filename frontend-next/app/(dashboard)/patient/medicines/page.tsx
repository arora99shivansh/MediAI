"use client";

import { useEffect, useState } from "react";
import { Pill, ShieldAlert } from "lucide-react";
import api from "@/lib/api";

type Medication = {
  id: string;
  name?: string;
  medication_name?: string;
  dosage?: string;
  frequency?: string;
  status?: string;
  instructions?: string;
  prescribed_by?: string;
};

export default function MedicinesPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMedications = async () => {
      try {
        const res = await api.get("/patient/medications");
        setMedications(res.data as Medication[]);
      } catch (loadError) {
        console.error(loadError);
        setError("Unable to load your medication list right now.");
      } finally {
        setLoading(false);
      }
    };

    void loadMedications();
  }, []);

  const activeMedications = medications.filter((medication) => medication.status?.toLowerCase() !== "inactive");
  const archivedMedications = medications.filter((medication) => medication.status?.toLowerCase() === "inactive");

  if (loading) {
    return <div className="p-8 text-slate-500">Loading medications...</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Medicines</h1>
        <p className="mt-2 text-slate-500">Review active prescriptions, instructions, and inactive medication history.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Active Prescriptions</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{activeMedications.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Inactive History</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{archivedMedications.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Medication Safety</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">Use Patient AI for explanation and interaction checks.</p>
        </div>
      </div>

      {medications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500">
          No medications have been recorded for your account yet.
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Pill className="w-5 h-5 text-blue-500" /> Active Medications
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {activeMedications.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  No active prescriptions are currently listed.
                </div>
              ) : (
                activeMedications.map((medication) => (
                  <div key={medication.id} className="rounded-xl border border-slate-200 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{medication.medication_name || medication.name || "Medication"}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {[medication.dosage, medication.frequency].filter(Boolean).join(" • ") || "Dosage instructions pending"}
                        </p>
                      </div>
                      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                        {medication.status || "Active"}
                      </span>
                    </div>
                    {medication.instructions && <p className="mt-3 text-sm text-slate-600">{medication.instructions}</p>}
                    {medication.prescribed_by && <p className="mt-3 text-xs text-slate-500">Prescribed by {medication.prescribed_by}</p>}
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" /> Inactive Medication History
              </h2>
            </div>
            <div className="p-6 space-y-3">
              {archivedMedications.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                  No archived medications found.
                </div>
              ) : (
                archivedMedications.map((medication) => (
                  <div key={medication.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">{medication.medication_name || medication.name || "Medication"}</p>
                    <p className="mt-1 text-sm text-slate-500">{[medication.dosage, medication.frequency].filter(Boolean).join(" • ") || "History entry"}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
