"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Maximize, Settings, ShieldCheck, Bot, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

export default function VideoConsultationRoom() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [isCopilotGenerating, setIsCopilotGenerating] = useState(false);
  const [generatedNote, setGeneratedNote] = useState<string | null>(null);

  // Mock call duration timer
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    if (confirm("Are you sure you want to end this consultation?")) {
      // Direct back to respective dashboard
      if (user?.role === "doctor") {
        router.push("/doctor/appointments");
      } else {
        router.push("/patient/appointments");
      }
    }
  };

  const generateAISOAP = async () => {
    setIsCopilotGenerating(true);
    // Simulate generating a SOAP note during the call based on voice transcript
    setTimeout(() => {
      setGeneratedNote("### S: Subjective\nPatient reports a mild headache for 2 days. No fever.\n\n### O: Objective\nVitals appear stable on video. Patient is alert.\n\n### A: Assessment\nTension headache.\n\n### P: Plan\nRest, hydration, and OTC paracetamol as needed.");
      setIsCopilotGenerating(false);
    }, 2500);
  };

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col overflow-hidden font-sans">
      
      {/* Top Bar */}
      <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 text-slate-200">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-md text-sm font-medium flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> E2E Encrypted
          </div>
          <div className="text-slate-400 text-sm font-mono">
            {formatTime(duration)}
          </div>
        </div>
        
        <div className="font-semibold">
          DoorDoctor Telemedicine Room
        </div>
        
        <div className="flex gap-4">
          <button onClick={() => setShowChat(!showChat)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors relative">
            <MessageSquare className="w-5 h-5 text-slate-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Video Grid */}
        <div className="flex-1 p-4 flex gap-4 h-full">
          
          {/* Main Feed (Other Person) */}
          <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden relative group">
            {/* Mock Video Placeholder */}
            <div className="absolute inset-0 flex items-center justify-center flex-col">
               <div className="w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700">
                  <User className="w-16 h-16 text-slate-500" />
               </div>
               <div className="mt-4 text-slate-400 font-medium text-lg animate-pulse">Waiting for video stream...</div>
            </div>
            
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              {user?.role === "doctor" ? "Patient" : "Dr. Smith"}
            </div>
          </div>
          
          {/* Self View & Co-Pilot sidebar if doctor */}
          <div className="w-80 flex flex-col gap-4 h-full">
            
            {/* Self Video */}
            <div className="h-64 bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden">
               {videoOn ? (
                 <div className="absolute inset-0 bg-slate-800"></div>
               ) : (
                 <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                    <VideoOff className="w-8 h-8 text-slate-600" />
                 </div>
               )}
               <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded text-xs font-medium">
                 You ({user?.role === "doctor" ? "Doctor" : "Patient"})
               </div>
               {!micOn && (
                 <div className="absolute top-2 right-2 bg-red-500/80 p-1.5 rounded text-white">
                   <MicOff className="w-3 h-3" />
                 </div>
               )}
            </div>

            {/* Doctor AI Co-Pilot (Only visible to doctor) */}
            {user?.role === "doctor" && (
              <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col">
                <div className="p-3 border-b border-slate-800 bg-slate-800/50 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-bold text-slate-200">Live AI Assistant</span>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto">
                  {isCopilotGenerating ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs">Analyzing live transcript...</span>
                    </div>
                  ) : generatedNote ? (
                    <div className="text-sm text-slate-300 whitespace-pre-wrap">{generatedNote}</div>
                  ) : (
                    <div className="text-center text-slate-500 text-sm mt-8">
                      <p>AI is securely transcribing this call.</p>
                      <button 
                        onClick={generateAISOAP}
                        className="mt-4 bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 px-4 py-2 rounded-lg text-xs font-medium transition-colors w-full"
                      >
                        Generate Live SOAP Note
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Simple Chat Sidebar (if patient, or if doctor wants it) */}
            {showChat && user?.role === "patient" && (
              <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col">
                <div className="p-3 border-b border-slate-800 font-medium text-sm text-slate-200">Chat</div>
                <div className="flex-1 p-4"></div>
                <div className="p-3 border-t border-slate-800">
                  <input type="text" placeholder="Type a message..." className="w-full bg-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:outline-none" />
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Control Bar */}
      <div className="h-24 bg-slate-950 flex items-center justify-center gap-6 pb-4">
        
        <button 
          onClick={() => setMicOn(!micOn)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            micOn ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-red-500 text-white hover:bg-red-600"
          }`}
        >
          {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>

        <button 
          onClick={() => setVideoOn(!videoOn)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            videoOn ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-red-500 text-white hover:bg-red-600"
          }`}
        >
          {videoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </button>

        <button className="w-14 h-14 rounded-full bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center">
          <Settings className="w-6 h-6" />
        </button>

        <button 
          onClick={handleEndCall}
          className="w-16 h-12 px-6 rounded-full bg-red-600 text-white hover:bg-red-700 flex items-center justify-center font-bold"
        >
          <PhoneOff className="w-6 h-6" />
        </button>

      </div>
    </div>
  );
}
