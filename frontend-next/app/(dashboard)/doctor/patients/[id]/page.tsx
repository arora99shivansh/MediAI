"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Activity, FileText, Pill, AlertCircle, Calendar, Bot } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

interface PatientOverview {
  user_id: string;
  full_name: string;
  email: string;
  age: number | null;
  gender: string | null;
  risk_level: string;
  chronic_conditions: string[];
  allergies: string[];
  recent_vitals: any[];
  active_medications: any[];
  last_visit: string | null;
}

export default function PatientProfile() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<PatientOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // AI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNote, setGeneratedNote] = useState<string | null>(null);
  const [pastNotes, setPastNotes] = useState<any[]>([]);

  useEffect(() => {
    if (params.id) {
      fetchPatient();
    }
  }, [params.id]);

  const fetchPatient = async () => {
    try {
      const res = await api.get(`/doctor/patients/${params.id}/overview`);
      setPatient(res.data);
    } catch (error) {
      console.error("Failed to fetch patient overview", error);
      // Fallback or handle error
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const res = await api.get(`/doctor/patients/${params.id}/notes`);
      setPastNotes(res.data);
    } catch (error) {
      console.error("Failed to fetch notes", error);
    }
  };

  useEffect(() => {
    if (activeTab === "notes" && params.id) {
      fetchNotes();
    }
  }, [activeTab, params.id]);

  const handleGenerateAI = async (taskType: string) => {
    setIsGenerating(true);
    setActiveTab("chat");
    setGeneratedNote(null);
    try {
      const res = await api.post("/doctor/ai/generate", {
        patient_id: params.id,
        task_type: taskType
      });
      setGeneratedNote(res.data.content);
      
      // Auto-save the note
      await api.post("/doctor/notes", {
        patient_id: params.id as string,
        title: `AI Generated ${taskType.replace('_', ' ').toUpperCase()}`,
        content: res.data.content,
        note_type: taskType
      });
      
    } catch (error) {
      console.error("AI Generation failed", error);
      setGeneratedNote("Failed to generate content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-medium">Loading patient profile...</div>;
  }

  if (!patient) {
    return <div className="p-12 text-center text-red-500 font-medium">Failed to load patient.</div>;
  }

  const getRiskColor = (level: string) => {
    switch(level?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "timeline", label: "Timeline", icon: Activity },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "notes", label: "Clinical Notes", icon: FileText },
    { id: "medicines", label: "Medicines", icon: Pill },
    { id: "chat", label: "AI Co-Pilot", icon: Bot },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div>
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </button>
        
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-3xl font-bold text-slate-400">
              {patient.full_name?.charAt(0) || "U"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{patient.full_name}</h1>
              <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                <span>{patient.age ? `${patient.age} yrs` : 'Age N/A'}</span>
                <span>•</span>
                <span>{patient.gender || 'Gender N/A'}</span>
                <span>•</span>
                <span>{patient.email}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Risk Level</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(patient.risk_level)}`}>
                {patient.risk_level.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
              <Calendar className="w-4 h-4" /> Last Visit: {patient.last_visit ? format(new Date(patient.last_visit), "MMM d, yyyy") : "None"}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10 px-2 rounded-t-xl overflow-x-auto hide-scrollbar">
        <div className="flex gap-6 min-w-max">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  isActive 
                    ? "border-blue-600 text-blue-600" 
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Medical Summary */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" /> Medical Conditions
              </h3>
              
              <div>
                <h4 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">Chronic Conditions</h4>
                {patient.chronic_conditions?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.chronic_conditions.map((c, i) => (
                      <span key={i} className="px-3 py-1 bg-rose-50 text-rose-700 rounded-lg text-sm font-medium border border-rose-100">
                        {c}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">No recorded conditions.</p>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">Allergies</h4>
                {patient.allergies?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map((a, i) => (
                      <span key={i} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium border border-amber-100">
                        {a}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">No known allergies.</p>
                )}
              </div>
            </div>

            {/* AI Assistant Quick Start */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700 p-6 shadow-md text-white flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Bot className="w-6 h-6 text-blue-400" />
                    <h3 className="text-lg font-bold">DoorDoctor AI Co-Pilot</h3>
                  </div>
                </div>
                <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                  Generate a complete SOAP note, draft a prescription, or ask questions about {patient.full_name.split(' ')[0]}'s uploaded medical history. The AI reads all past reports.
                </p>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={() => setActiveTab("chat")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors text-center shadow-sm"
                >
                  Start Clinical Analysis
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleGenerateAI("soap_note")}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-lg text-xs font-medium transition-colors text-center"
                  >
                    Auto-SOAP Note
                  </button>
                  <button 
                    onClick={() => handleGenerateAI("clinical_summary")}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-lg text-xs font-medium transition-colors text-center"
                  >
                    Summarize File
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}
        
        {/* Placeholders for other tabs */}
        {activeTab === "chat" && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">AI Clinical Co-Pilot</h3>
                <p className="text-sm text-slate-500">Evidence-based generation via RAG</p>
              </div>
            </div>
            
            <div className="min-h-[300px] flex flex-col">
              {isGenerating ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4 py-12">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-medium animate-pulse">Analyzing patient records & synthesizing notes...</p>
                </div>
              ) : generatedNote ? (
                <div className="prose prose-slate max-w-none prose-h2:text-lg prose-h2:mb-2 prose-h3:text-md prose-p:text-sm prose-ul:text-sm prose-li:my-1">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 text-slate-800 shadow-sm">
                    <ReactMarkdown>{generatedNote}</ReactMarkdown>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                      ✓ Auto-saved to Clinical Notes
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                  <p className="text-slate-500 mb-6">Select an action to generate clinical content based on {patient.full_name}'s history.</p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleGenerateAI("soap_note")}
                      className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Generate SOAP Note
                    </button>
                    <button 
                      onClick={() => handleGenerateAI("differential_diagnosis")}
                      className="bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Differential Diagnosis
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "notes" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Clinical Notes History</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {pastNotes.length === 0 ? (
                <div className="p-12 text-center text-slate-500">No notes recorded yet.</div>
              ) : (
                pastNotes.map((note) => (
                  <div key={note.id} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-slate-900">{note.title}</h4>
                        <p className="text-xs text-slate-400 mt-1">{format(new Date(note.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
                      </div>
                      <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {note.note_type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 whitespace-pre-wrap mt-2 bg-white border border-slate-100 p-4 rounded-lg">
                      <ReactMarkdown>{note.content}</ReactMarkdown>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {(activeTab === "timeline" || activeTab === "reports" || activeTab === "medicines") && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
            <p className="text-slate-500">Content for this section is coming in future phases.</p>
          </div>
        )}
      </div>
    </div>
  );
}
