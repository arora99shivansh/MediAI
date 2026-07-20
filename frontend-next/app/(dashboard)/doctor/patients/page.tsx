"use client";

import { useEffect, useState } from "react";
import { Search, UserPlus, FileText, ChevronRight, Filter } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

interface Patient {
  _id: string;
  email: string;
  full_name: string;
  assigned_doctor_id?: string;
  role: string;
}

export default function PatientDirectory() {
  const [assignedPatients, setAssignedPatients] = useState<Patient[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"assigned" | "directory">("assigned");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assignedRes, allRes] = await Promise.all([
        api.get("/doctor/patients"),
        api.get("/doctor/patients/all")
      ]);
      setAssignedPatients(assignedRes.data);
      setAllPatients(allRes.data);
    } catch (error) {
      console.error("Failed to fetch patients", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (patientId: string) => {
    try {
      await api.post(`/doctor/patients/${patientId}/assign`);
      // Refresh data after assignment
      fetchData();
    } catch (error) {
      console.error("Failed to assign patient", error);
      alert("Failed to assign patient.");
    }
  };

  const displayedPatients = activeTab === "assigned" ? assignedPatients : allPatients;
  const filteredPatients = displayedPatients.filter(p => 
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Directory</h1>
          <p className="text-slate-500 mt-1">Manage your assigned patients or browse the hospital directory.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex bg-slate-200/50 p-1 rounded-lg w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("assigned")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 sm:flex-none ${
                activeTab === "assigned" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              My Patients ({assignedPatients.length})
            </button>
            <button
              onClick={() => setActiveTab("directory")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 sm:flex-none ${
                activeTab === "directory" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Global Directory
            </button>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors bg-white"
              />
            </div>
            <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100 bg-white">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient Name</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">Loading patients...</td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">No patients found.</td>
                </tr>
              ) : (
                filteredPatients.map((patient) => {
                  const isAssignedToMe = assignedPatients.some(p => p._id === patient._id);
                  const isAssigned = !!patient.assigned_doctor_id;

                  return (
                    <tr key={patient._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold border border-slate-200 text-sm">
                            {patient.full_name?.charAt(0) || "U"}
                          </div>
                          <span className="font-medium text-slate-900">{patient.full_name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-500">
                        {patient.email}
                      </td>
                      <td className="py-4 px-6">
                        {isAssignedToMe ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Assigned to You
                          </span>
                        ) : isAssigned ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                            Assigned
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        {isAssignedToMe ? (
                          <Link 
                            href={`/doctor/patients/${patient._id}`}
                            className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                            title="View Profile"
                          >
                            <FileText className="w-5 h-5" />
                          </Link>
                        ) : (
                          <button 
                            onClick={() => handleAssign(patient._id)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                          >
                            <UserPlus className="w-4 h-4" /> Claim
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
