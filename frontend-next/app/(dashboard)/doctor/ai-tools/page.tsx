"use client";

import { useState, useEffect } from "react";
import { Sparkles, Bot, FileText, Loader2, Save, User, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import ReactMarkdown from "react-markdown";

export default function DoctorAITools() {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [taskType, setTaskType] = useState("soap_note");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get("/doctor/patients");
        setPatients(res.data);
      } catch (err) {
        console.error("Failed to fetch patients", err);
      }
    };
    fetchPatients();
  }, []);

  const handleGenerate = async () => {
    if (!selectedPatient) {
      alert("Please select a patient.");
      return;
    }
    setLoading(true);
    setResult("");
    setSaved(false);
    try {
      const res = await api.post("/doctor/ai/generate", {
        patient_id: selectedPatient,
        task_type: taskType,
        additional_context: context || null
      });
      setResult(res.data.content);
    } catch (err) {
      console.error(err);
      alert("Failed to generate content.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const titleMap: Record<string, string> = {
        "soap_note": "AI Generated SOAP Note",
        "clinical_summary": "AI Clinical Summary",
        "differential_diagnosis": "AI Differential Diagnosis",
        "lab_explanation": "AI Lab Explanation"
      };
      
      await api.post("/doctor/notes", {
        patient_id: selectedPatient,
        title: titleMap[taskType] || "AI Clinical Note",
        content: result,
        note_type: taskType
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
      alert("Failed to save note.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical AI Assistant</h1>
          <p className="text-slate-500">Automate clinical documentation and generate insights instantly.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Controls */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" /> Select Patient
              </label>
              <select 
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm"
              >
                <option value="">Choose a patient...</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name} (Risk: {p.risk_level})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Generation Task
              </label>
              <select 
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm"
              >
                <option value="soap_note">SOAP Note</option>
                <option value="clinical_summary">Clinical Summary</option>
                <option value="differential_diagnosis">Differential Diagnosis</option>
                <option value="lab_explanation">Lab Results Explanation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Specific Instructions (Optional)
              </label>
              <textarea 
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. Focus on the recent spikes in blood pressure..."
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-sm resize-none"
              />
            </div>

            <button 
              onClick={handleGenerate}
              disabled={loading || !selectedPatient}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {loading ? "Analyzing Records..." : "Generate Insights"}
            </button>
          </div>
        </div>

        {/* Output Area */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[600px] overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" /> AI Output
              </h2>
              {result && (
                <button 
                  onClick={handleSaveNote}
                  disabled={saving || saved}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                    saved ? "bg-emerald-100 text-emerald-700" : "bg-slate-900 hover:bg-black text-white"
                  }`}
                >
                  {saved ? <CheckCircle2 className="w-4 h-4" /> : (saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />)}
                  {saved ? "Saved to Patient Notes" : "Save as Clinical Note"}
                </button>
              )}
            </div>
            <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                  <p>Processing patient timeline and generating insights...</p>
                </div>
              ) : result ? (
                <div className="prose prose-slate max-w-none prose-headings:text-slate-800 prose-a:text-blue-600">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <FileText className="w-8 h-8 text-slate-300" />
                  </div>
                  <p>Select a patient and task on the left to generate clinical content.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
