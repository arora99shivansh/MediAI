"use client";

import { useState, useEffect } from "react";
import { Check, X, ShieldCheck } from "lucide-react";
import api from "@/lib/api";

export default function DoctorApprovalQueue() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await api.get("/admin/doctors");
      setDoctors(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    setProcessingId(id);
    try {
      await api.put(`/admin/doctors/${id}/status`, { status });
      fetchDoctors();
    } catch (error) {
      console.error("Failed to update status", error);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Loading doctors...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Doctor Verifications</h1>
        <p className="text-slate-500 mt-2">Approve or reject doctor registrations on the platform.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {doctors.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No doctors registered yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {doctors.map(doctor => (
              <div key={doctor._id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-xl font-bold border border-slate-200 flex-shrink-0">
                    {doctor.full_name?.charAt(0) || "D"}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                      {doctor.full_name}
                      {doctor.status === "approved" && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                    </h3>
                    <p className="text-sm text-slate-600">{doctor.email}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs font-medium text-slate-500">
                      <span>{doctor.specialization || "General"}</span>
                      <span>•</span>
                      <span>{doctor.city || "Online"}</span>
                      <span>•</span>
                      <span>ID: {doctor._id}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                  {doctor.status === "approved" ? (
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Approved</span>
                  ) : doctor.status === "rejected" ? (
                    <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Rejected</span>
                  ) : (
                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Pending</span>
                  )}

                  <div className="flex gap-2">
                    {doctor.status !== "approved" && (
                      <button 
                        onClick={() => handleUpdateStatus(doctor._id, "approved")}
                        disabled={processingId === doctor._id}
                        className="w-10 h-10 flex items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50"
                        title="Approve"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    )}
                    {doctor.status !== "rejected" && (
                      <button 
                        onClick={() => handleUpdateStatus(doctor._id, "rejected")}
                        disabled={processingId === doctor._id}
                        className="w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors disabled:opacity-50"
                        title="Reject"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
