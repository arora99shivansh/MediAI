"use client";

import { useEffect, useState } from "react";
import { Activity, TrendingUp, Users, CalendarClock } from "lucide-react";
import api from "@/lib/api";

type Appointment = {
  id: string;
  date: string;
  status: string;
};

type Patient = {
  id: string;
  risk_level?: string;
  chronic_conditions?: string[];
};

export default function AnalyticsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const [appointmentsRes, patientsRes] = await Promise.all([
          api.get("/appointments/doctor"),
          api.get("/doctor/patients"),
        ]);
        setAppointments(appointmentsRes.data as Appointment[]);
        setPatients(patientsRes.data as Patient[]);
      } catch (loadError) {
        console.error(loadError);
        setError("Unable to load practice analytics right now.");
      } finally {
        setLoading(false);
      }
    };

    void loadAnalytics();
  }, []);

  if (loading) {
    return <div className="p-8 text-slate-500">Loading analytics...</div>;
  }

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>;
  }

  const confirmed = appointments.filter((appointment) => appointment.status === "confirmed").length;
  const pending = appointments.filter((appointment) => appointment.status === "pending_payment" || appointment.status === "pending").length;
  const cancelled = appointments.filter((appointment) => appointment.status === "cancelled" || appointment.status === "rejected").length;
  const highRiskPatients = patients.filter((patient) => patient.risk_level === "High").length;
  const chronicCarePatients = patients.filter((patient) => (patient.chronic_conditions || []).length > 0).length;
  const completionRate = appointments.length > 0 ? Math.round((confirmed / appointments.length) * 100) : 0;

  const appointmentsByDay = appointments.reduce<Record<string, number>>((summary, appointment) => {
    const key = appointment.date || "Unknown";
    summary[key] = (summary[key] || 0) + 1;
    return summary;
  }, {});

  const dailyLoad = Object.entries(appointmentsByDay)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 7);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Practice Analytics</h1>
        <p className="mt-2 text-slate-500">Operational metrics derived from your live appointment and patient data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Confirmed Visits", value: confirmed, icon: TrendingUp, tone: "bg-blue-50 text-blue-600" },
          { label: "Pending Queue", value: pending, icon: CalendarClock, tone: "bg-amber-50 text-amber-600" },
          { label: "Assigned Patients", value: patients.length, icon: Users, tone: "bg-emerald-50 text-emerald-600" },
          { label: "High-Risk Patients", value: highRiskPatients, icon: Activity, tone: "bg-rose-50 text-rose-600" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${card.tone}`}>
                <Icon className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Workload by Date</h2>
          </div>
          <div className="p-6 space-y-4">
            {dailyLoad.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-slate-500">
                Appointment analytics will appear after patients begin booking.
              </div>
            ) : (
              dailyLoad.map(([date, count]) => (
                <div key={date} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{date}</p>
                      <p className="text-sm text-slate-500">{count} scheduled interactions</p>
                    </div>
                    <div className="h-3 flex-1 rounded-full bg-slate-100">
                      <div
                        className="h-3 rounded-full bg-blue-600"
                        style={{ width: `${Math.max((count / Math.max(...dailyLoad.map(([, value]) => value), 1)) * 100, 8)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Practice Snapshot</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">Visit completion rate</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{completionRate}%</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">Cancelled or rejected visits</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{cancelled}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">Patients needing chronic care review</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{chronicCarePatients}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
