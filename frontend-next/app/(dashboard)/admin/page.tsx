"use client";

import { useState, useEffect } from "react";
import { Users, FileText, CheckCircle, Database } from "lucide-react";
import api from "@/lib/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/admin/dashboard");
      setStats(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Loading metrics...</div>;
  if (!stats) return <div className="p-12 text-center text-red-500">Failed to load analytics</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Platform Analytics</h1>
        <p className="text-slate-500 mt-2">Overview of DoorDoctor AI platform usage.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Users</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.total_users}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Active (14 days)</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.active_users}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Uploaded Docs</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.uploaded_files}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Storage Used</p>
              <h3 className="text-2xl font-bold text-slate-900">{(stats.storage_usage.bytes / 1024 / 1024).toFixed(2)} MB</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Asked Questions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-lg mb-4 text-slate-900">Top Patient Queries</h3>
          <ul className="space-y-3">
            {stats.most_asked_questions?.map((q: any, i: number) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">{i+1}</span>
                <span className="text-slate-700">{q.question}</span>
                <span className="ml-auto font-medium text-blue-600">{q.count}</span>
              </li>
            ))}
            {(!stats.most_asked_questions || stats.most_asked_questions.length === 0) && (
              <li className="text-slate-500 text-sm">No queries logged yet.</li>
            )}
          </ul>
        </div>

        {/* AI Usage */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-lg mb-4 text-slate-900">AI Tokens Usage</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Prompt Tokens</span>
              <span className="font-bold text-slate-900">{stats.token_usage.prompt_tokens}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Completion Tokens</span>
              <span className="font-bold text-slate-900">{stats.token_usage.completion_tokens}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-500 font-medium text-lg">Total Tokens</span>
              <span className="font-bold text-blue-600 text-lg">{stats.token_usage.total_tokens}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
