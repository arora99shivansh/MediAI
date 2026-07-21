"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Users, ClipboardList, Activity, AlertCircle, Bot, ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function DoctorDashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome, Dr. {user?.full_name?.split(' ')[0] || "Doctor"}</h1>
          <p className="text-slate-500 mt-1">Here is the overview of your clinical practice today.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/doctor/appointments" className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors">
            View Schedule
          </Link>
          <Link href="/doctor/patients" className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-2">
            <Bot className="w-4 h-4" /> Open AI Co-Pilot
          </Link>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Today's Appointments", value: "8", icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Assigned Patients", value: "142", icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending Reports", value: "5", icon: Activity, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Critical Alerts", value: "1", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Patient Queue */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-semibold text-slate-900">Today's Queue</h3>
            <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">8 Patients</span>
          </div>
          <div className="divide-y divide-slate-100">
            {/* Dummy Queue Items */}
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                    JD
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">John Doe</h4>
                    <p className="text-xs text-slate-500">Follow-up • Hypertension</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-slate-900">10:00 AM</p>
                    <p className="text-xs text-amber-600 font-medium">Waiting</p>
                  </div>
                  <button className="text-slate-400 hover:text-blue-600 transition-colors">
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-center">
            <Link href="/doctor/appointments" className="text-sm font-medium text-blue-600 hover:text-blue-700">View Full Schedule</Link>
          </div>
        </div>

        {/* AI Co-Pilot Quick Actions */}
        <div className="bg-slate-900 rounded-xl shadow-md text-white overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-800 bg-black/20">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-white">Clinical Co-Pilot</h3>
            </div>
            <p className="text-xs text-slate-400">Powered by RAG & Medical LLMs</p>
          </div>
          <div className="p-6 flex-1 flex flex-col gap-3">
            <Link href="/doctor/patients" className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-between group">
              Generate SOAP Note
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
            </Link>
            <Link href="/doctor/patients" className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-between group">
              Draft Prescription
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
            </Link>
            <Link href="/doctor/patients" className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-between group">
              Summarize Recent Reports
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
