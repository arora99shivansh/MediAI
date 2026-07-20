"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Check, X } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { format } from "date-fns";

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await api.get("/appointments/doctor");
      setAppointments(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    setProcessingId(id);
    try {
      await api.put(`/appointments/${id}/status`, { status });
      // If rejected, also trigger refund if it was paid
      if (status === "rejected") {
        try {
          await api.post("/payments/refund", { appointment_id: id, reason: "Doctor rejected" });
        } catch (e) {
          console.error("Refund failed or not applicable", e);
        }
      }
      fetchAppointments();
    } catch (error) {
      console.error("Failed to update status", error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Appointments Hub</h1>
        <p className="text-slate-500 mt-2">Manage your schedule and incoming booking requests.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Calendar className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No appointments found</h3>
            <p className="text-slate-500 max-w-sm mt-2">You don't have any upcoming appointments or pending requests.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.map(appt => (
              <div key={appt.id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center text-xl font-bold border border-slate-200 flex-shrink-0">
                    {appt.patient_name?.charAt(0) || "P"}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{appt.patient_name}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5 font-medium text-slate-900">
                        <Calendar className="w-4 h-4 text-blue-500" /> {format(new Date(appt.date), "MMM d, yyyy")}
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-slate-900">
                        <Clock className="w-4 h-4 text-amber-500" /> {appt.slot}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <MapPin className="w-4 h-4" /> Online Video
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                  {appt.status === "pending" || appt.status === "pending_payment" ? (
                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Pending Confirmation</span>
                  ) : appt.status === "confirmed" ? (
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Confirmed</span>
                  ) : (
                    <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold uppercase">{appt.status}</span>
                  )}

                  {(appt.status === "pending" || appt.status === "pending_payment") && (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button 
                        onClick={() => handleUpdateStatus(appt.id, "confirmed")}
                        disabled={processingId === appt.id}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" /> Accept
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(appt.id, "rejected")}
                        disabled={processingId === appt.id}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                      >
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  )}

                  {appt.status === "confirmed" && (
                    <Link href={`/consultation/${appt.id}`} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors text-center inline-block">
                      Start Consultation
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
