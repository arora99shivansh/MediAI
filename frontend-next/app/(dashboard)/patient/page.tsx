"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Activity, HeartPulse, Calendar, ArrowRight, ShieldCheck, Video, Bell, Pill } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import api from "@/lib/api";

type Appointment = {
  id: string;
  date: string;
  slot: string;
  status: string;
  doctor_name?: string;
};

type AlertItem = {
  id: string;
  title?: string;
  message?: string;
};

type Medication = {
  id: string;
  status?: string;
};

type LiveVitals = {
  heart_rate?: number;
  blood_pressure?: string;
  recorded_at?: string;
};

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [vitals, setVitals] = useState<LiveVitals | null>(null);
  const [vitalsConnected, setVitalsConnected] = useState(false);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const [appointmentsRes, alertsRes, medicationsRes] = await Promise.all([
          api.get("/appointments/patient"),
          api.get("/patient/alerts"),
          api.get("/patient/medications"),
        ]);

        const today = new Date().toISOString().split("T")[0];
        const upcoming = (appointmentsRes.data as Appointment[])
          .filter((appointment) => appointment.date >= today)
          .slice(0, 3);

        setAppointments(upcoming);
        setAlerts(alertsRes.data as AlertItem[]);
        setMedications(medicationsRes.data as Medication[]);
      } catch (e) {
        console.error(e);
      }
    };

    if (user?._id) {
      fetchAppointments();

      const wsUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace('http', 'ws') + `/ws/vitals/${user._id}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => setVitalsConnected(true);
      ws.onerror = () => setVitalsConnected(false);
      ws.onclose = () => setVitalsConnected(false);
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "VITAL_UPDATE") {
          setVitals((prev) => ({ ...prev, ...data.data }));
        }
      };

      return () => ws.close();
    }
  }, [user]);

  const activeMedicationCount = medications.filter((medication) => medication.status?.toLowerCase() !== "inactive").length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Good Morning, {user?.full_name?.split(' ')[0] || "Patient"}</h1>
        <p className="text-slate-500 mt-2">Here is a live view of your appointments, medication list, and monitoring status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: "Upcoming Visits",
            value: appointments.length.toString(),
            detail: appointments.length > 0 ? `${appointments[0].date} at ${appointments[0].slot}` : "Nothing scheduled",
            icon: Calendar,
            tone: "bg-blue-50 text-blue-600",
          },
          {
            label: "Open Alerts",
            value: alerts.length.toString(),
            detail: alerts[0]?.title || alerts[0]?.message || "No unresolved alerts",
            icon: Bell,
            tone: "bg-amber-50 text-amber-600",
          },
          {
            label: "Active Medicines",
            value: activeMedicationCount.toString(),
            detail: activeMedicationCount > 0 ? "Based on your current medication list" : "No active prescriptions recorded",
            icon: Pill,
            tone: "bg-emerald-50 text-emerald-600",
          },
          {
            label: "Vitals Feed",
            value: vitalsConnected ? "Live" : "Idle",
            detail: vitals?.recorded_at ? `Updated ${new Date(vitals.recorded_at).toLocaleTimeString()}` : "Waiting for a device update",
            icon: HeartPulse,
            tone: "bg-rose-50 text-rose-600",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${card.tone}`}>
                <Icon className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{card.value}</p>
              <p className="text-sm text-slate-500 mt-2">{card.detail}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 shadow-md text-white relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-1/4 translate-y-1/4">
            <ShieldCheck className="w-64 h-64" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold uppercase tracking-wider mb-4 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              AI Co-Pilot Ready
            </div>
            <h2 className="text-2xl font-bold mb-2">Ask the assistant about your reports, medicines, or recovery plan.</h2>
            <p className="text-blue-100 max-w-2xl mb-8">Use the patient AI workspace to explain uploaded reports, prepare visit questions, and turn your health data into clear next steps.</p>
          </div>
          <div className="relative z-10">
            <Link href="/patient/ai" className="inline-flex bg-white text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-xl font-medium shadow-sm transition-colors items-center gap-2">
              Open Patient AI <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" /> Upcoming Appointments
            </h3>
            <Link href="/patient/appointments" className="text-sm font-medium text-blue-600 hover:text-blue-700">View all</Link>
          </div>
          <div className="p-6">
            {appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex flex-col items-center justify-center border border-slate-200 shadow-sm">
                        <span className="text-xs font-bold text-slate-500 uppercase">{new Date(appt.date).toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-lg font-bold text-blue-600 leading-none">{new Date(appt.date).getDate()}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{appt.doctor_name}</h4>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {appt.slot}</span>
                        </div>
                      </div>
                    </div>
                    {appt.status === "confirmed" && (
                      <Link 
                        href={`/video/${appt.id}`}
                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-2.5 rounded-lg transition-colors flex items-center justify-center"
                        title="Join Video Call"
                      >
                        <Video className="w-5 h-5" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-slate-500 py-6">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-slate-400" />
                </div>
                <p className="font-medium">No upcoming appointments</p>
                <p className="text-sm mt-1 mb-6">You do not have any visits scheduled.</p>
                <Link href="/patient/doctors" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm">
                  Book a Consultation
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Live Vitals */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" /> Live Vitals
            </h3>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${vitalsConnected ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-slate-100 border-slate-200 text-slate-600"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${vitalsConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
              {vitalsConnected ? "Sync Active" : "Awaiting Feed"}
            </div>
          </div>
          <div className="p-6">
            {vitals ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-100 text-rose-500 flex items-center justify-center rounded-lg">
                      <HeartPulse className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Heart Rate</p>
                      <p className="text-xs text-slate-500">Latest reading</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">{vitals.heart_rate ?? "--"} <span className="text-sm text-slate-500 font-medium">bpm</span></p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-500 flex items-center justify-center rounded-lg">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Blood Pressure</p>
                      <p className="text-xs text-slate-500">Latest reading</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">{vitals.blood_pressure || "--"} <span className="text-sm text-slate-500 font-medium">mmHg</span></p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                Live vitals will appear here as soon as a connected device or clinical workstation sends an update.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
