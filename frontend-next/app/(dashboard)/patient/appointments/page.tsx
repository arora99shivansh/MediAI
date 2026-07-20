"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Search } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { format } from "date-fns";

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await api.get("/appointments/patient");
      setAppointments(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "confirmed": return <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Confirmed</span>;
      case "pending_payment": return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Pending Payment</span>;
      case "cancelled": return <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Cancelled</span>;
      default: return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold uppercase">{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Appointments</h1>
          <p className="text-slate-500 mt-2">Manage your upcoming consultations and history.</p>
        </div>
        <Link 
          href="/patient/doctors"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <Search className="w-4 h-4" /> Book New
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Calendar className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No appointments yet</h3>
            <p className="text-slate-500 max-w-sm mt-2">You haven't booked any consultations. Find a doctor to get started.</p>
            <Link href="/patient/doctors" className="mt-6 text-blue-600 font-medium">Browse Doctors &rarr;</Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.map(appt => (
              <div key={appt.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl font-bold border border-blue-100 flex-shrink-0">
                    {appt.doctor_name?.charAt(0) || "D"}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{appt.doctor_name}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar className="w-4 h-4 text-slate-400" /> {format(new Date(appt.date), "MMM d, yyyy")}
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-4 h-4 text-slate-400" /> {appt.slot}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-400" /> Online Video
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
                  {getStatusBadge(appt.status)}
                  {appt.status === "confirmed" && (
                    <Link href={`/consultation/${appt.id}`} className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center inline-block">
                      Join Video Call
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
