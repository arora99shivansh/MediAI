"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Send, User, MoreVertical, Phone, Video, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import Link from "next/link";

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
};

export default function PatientMessages() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [activeDoctor, setActiveDoctor] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(true);
  
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch unique doctors from appointments
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get("/appointments/patient");
        // Extract unique doctors
        const uniqueDocsMap = new Map();
        res.data.forEach((appt: any) => {
          if (!uniqueDocsMap.has(appt.doctor_id)) {
            uniqueDocsMap.set(appt.doctor_id, {
              id: appt.doctor_id,
              name: appt.doctor_name,
              spec: "Doctor" // We don't have spec directly in appt, fallback
            });
          }
        });
        const docs = Array.from(uniqueDocsMap.values());
        setDoctors(docs);
        if (docs.length > 0) setActiveDoctor(docs[0]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  // Fetch history when activeDoctor changes
  useEffect(() => {
    if (!activeDoctor) return;
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/messages/${activeDoctor.id}`);
        setMessages(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchHistory();
  }, [activeDoctor]);

  // Setup WebSocket
  useEffect(() => {
    if (!user?._id) return;
    
    const wsUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace('http', 'ws') + `/ws/chat/${user._id}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => {
        if (prev.find(m => m.timestamp === data.timestamp && m.content === data.content)) return prev;
        return [...prev, data];
      });
    };
    
    wsRef.current = ws;
    
    return () => {
      ws.close();
    };
  }, [user]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputMsg.trim() || !activeDoctor || !user?._id) return;
    
    const tempMsg = {
      sender_id: user._id,
      receiver_id: activeDoctor.id,
      content: inputMsg,
    };
    
    setInputMsg("");
    
    try {
      const res = await api.post("/messages/", tempMsg);
      setMessages(prev => {
        if (prev.find(m => m.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(res.data));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-4"/>Loading messages...</div>;

  return (
    <div className="h-[calc(100vh-100px)] flex bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Sidebar List */}
      <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Messages</h2>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {doctors.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">You don't have any booked doctors to chat with.</div>
          ) : (
            doctors.map(doc => (
              <button 
                key={doc.id}
                onClick={() => setActiveDoctor(doc)}
                className={`w-full p-4 flex items-center gap-3 border-b border-slate-100 transition-colors text-left ${
                  activeDoctor?.id === doc.id ? "bg-blue-50" : "hover:bg-slate-100"
                }`}
              >
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  {doc.name.replace('Dr. ', '').charAt(0) || "D"}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-semibold text-slate-900 text-sm truncate">{doc.name}</h4>
                  <p className="text-xs text-slate-500 truncate">{doc.spec}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {activeDoctor ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                {activeDoctor.name.replace('Dr. ', '').charAt(0) || "D"}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{activeDoctor.name}</h3>
                <p className="text-xs text-slate-500">Doctor</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/patient/appointments" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Video className="w-5 h-5" /></Link>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-sm text-slate-400 my-8">No messages yet. Send a message to your doctor.</div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.sender_id === user?._id;
                return (
                  <div key={msg.id || i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                      isMe 
                        ? "bg-blue-600 text-white rounded-br-sm" 
                        : "bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm"
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-slate-200">
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your message securely..." 
                className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm transition-all outline-none"
              />
              <button 
                onClick={handleSend}
                className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-50">
          <p>Select a doctor to view messages</p>
        </div>
      )}
    </div>
  );
}
