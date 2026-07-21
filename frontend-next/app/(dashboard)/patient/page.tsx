"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Activity, HeartPulse, Stethoscope, Calendar, ArrowRight, ShieldCheck, Video } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import api from "@/lib/api";

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [vitals, setVitals] = useState<any>({ heart_rate: 72, blood_pressure: "120/80" }); // Fallback if no WS data

  useEffect(() => {
    // Fetch upcoming appointments
    const fetchAppointments = async () => {
      try {
        const res = await api.get("/appointments/patient");
        // Filter for upcoming
        const upcoming = res.data.filter((a: any) => new Date(a.date) >= new Date()).slice(0, 3);
        setAppointments(upcoming);
      } catch (e) {
        console.error(e);
      }
    };
    fetchAppointments();

    // Setup Vitals WebSocket
    if (user?._id) {
      const wsUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace('http', 'ws') + `/ws/vitals/${user._id}`;
      const ws = new WebSocket(wsUrl);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "VITAL_UPDATE") {
          setVitals((prev: any) => ({ ...prev, ...data.data }));
        }
      };

      return () => ws.close();
    }
  }, [user]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Good Morning, {user?.full_name?.split(' ')[0] || "Patient"}</h1>
        <p className="text-slate-500 mt-2">Here is a summary of your health data and upcoming appointments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Health Score Card */}
        <div className="col-span-1 md:col-span-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
            <HeartPulse className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-700">Overall Health Score</h2>
          <div className="text-5xl font-bold text-slate-900 my-4">86<span className="text-2xl text-slate-400 font-medium">/100</span></div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Excellent
          </div>
        </div>

        {/* AI Action Card */}
        <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 shadow-md text-white relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-1/4 translate-y-1/4">
            <ShieldCheck className="w-64 h-64" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold uppercase tracking-wider mb-4 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              AI Co-Pilot Ready
            </div>
            <h2 className="text-2xl font-bold mb-2">Analyze your latest blood report.</h2>
            <p className="text-blue-100 max-w-md mb-8">Our AI Doctor has reviewed your latest CBC results. Would you like a personalized breakdown?</p>
          </div>
          <div className="relative z-10">
            <Link href="/patient/ai" className="inline-flex bg-white text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-xl font-medium shadow-sm transition-colors items-center gap-2">
              View AI Analysis <ArrowRight className="w-4 h-4" />
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
                  <div key={appt._id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
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
                        href={`/video/${appt._id}`}
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
                <p className="text-sm mt-1 mb-6">You don't have any visits scheduled.</p>
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
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Sync Active
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-100 text-rose-500 flex items-center justify-center rounded-lg">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Heart Rate</p>
                    <p className="text-xs text-slate-500">Live</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">{vitals.heart_rate} <span className="text-sm text-slate-500 font-medium">bpm</span></p>
                  <p className="text-xs text-emerald-600 font-medium">Normal</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-500 flex items-center justify-center rounded-lg">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Blood Pressure</p>
                    <p className="text-xs text-slate-500">Live</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">{vitals.blood_pressure} <span className="text-sm text-slate-500 font-medium">mmHg</span></p>
                  <p className="text-xs text-emerald-600 font-medium">Normal</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
