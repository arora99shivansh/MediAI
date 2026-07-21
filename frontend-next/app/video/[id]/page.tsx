"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, VideoOff } from "lucide-react";
import api from "@/lib/api";

export default function VideoConsultationRoom() {
  const params = useParams();
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await api.get(`/appointments/${params.id}/video-token`);
        setRoomName(res.data.room_name);
      } catch (err: any) {
        console.error("Failed to join room", err);
        setError(err.response?.data?.detail || "Failed to join video room. Ensure your appointment is confirmed.");
      } finally {
        setLoading(false);
      }
    };
    if (params.id) {
      fetchToken();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p>Connecting to secure room...</p>
      </div>
    );
  }

  if (error || !roomName) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white text-center p-6">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-6">
          <VideoOff className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Cannot Join Consultation</h1>
        <p className="text-slate-400 mb-8 max-w-md">{error}</p>
        <button 
          onClick={() => router.back()}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black flex flex-col">
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between">
        <div className="font-bold text-white tracking-tight">DoorDoctor <span className="text-blue-500">Video</span></div>
        <button 
          onClick={() => router.back()}
          className="text-sm font-medium text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 px-4 py-1.5 rounded-md transition-colors"
        >
          Leave Room
        </button>
      </div>
      
      <div className="flex-1 w-full bg-slate-950">
        <iframe
          src={`https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false&interfaceConfig.SHOW_JITSI_WATERMARK=false`}
          allow="camera; microphone; fullscreen; display-capture"
          className="w-full h-full border-0"
          title="Telemedicine Video Room"
        />
      </div>
    </div>
  );
}
