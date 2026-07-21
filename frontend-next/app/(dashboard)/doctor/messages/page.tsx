"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Send, User, MoreVertical, Phone, Video, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import Link from "next/link";
import Cookies from "js-cookie";

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
};

export default function DoctorMessages() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [activePatient, setActivePatient] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(true);
  
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch patients on mount
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get("/doctor/patients");
        setPatients(res.data);
        if (res.data.length > 0) {
          setActivePatient(res.data[0]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  // Fetch history when activePatient changes
  useEffect(() => {
    if (!activePatient) return;
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/messages/${activePatient.id}`);
        setMessages(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchHistory();
  }, [activePatient]);

  // Setup WebSocket
  useEffect(() => {
    if (!user?._id) return;
    
    // Connect WS
    const wsUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace('http', 'ws') + `/ws/chat/${user._id}`;
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Add message if it belongs to the current chat
      setMessages(prev => {
        // Prevent duplicate appending if we sent it via REST and got it via WS
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
    if (!inputMsg.trim() || !activePatient || !user?._id) return;
    
    const tempMsg = {
      sender_id: user._id,
      receiver_id: activePatient.id,
      content: inputMsg,
    };
    
    setInputMsg("");
    
    try {
      // Send via REST for persistence
      const res = await api.post("/messages/", tempMsg);
      // WS echo might also append it, but we can append it directly
      setMessages(prev => {
        if (prev.find(m => m.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
      
      // Also send via WS for live broadcast
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
          <h2 className="text-lg font-bold text-slate-900 mb-4">Patient Inbox</h2>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search patients..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {patients.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">No assigned patients found.</div>
          ) : (
            patients.map(p => (
              <button 
                key={p.id}
                onClick={() => setActivePatient(p)}
                className={`w-full p-4 flex items-center gap-3 border-b border-slate-100 transition-colors text-left ${
                  activePatient?.id === p.id ? "bg-blue-50" : "hover:bg-slate-100"
                }`}
              >
                <div className="w-10 h-10 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center font-bold">
                  {p.full_name?.charAt(0) || "P"}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-semibold text-slate-900 text-sm truncate">{p.full_name}</h4>
                  <p className="text-xs text-slate-500 truncate">Risk: {p.risk_level}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {activePatient ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center font-bold">
                {activePatient.full_name?.charAt(0) || "P"}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{activePatient.full_name}</h3>
                <p className="text-xs text-slate-500">Patient • {activePatient.gender}, {activePatient.age}y</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/doctor/appointments" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Video className="w-5 h-5" /></Link>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-sm text-slate-400 my-8">No messages yet. Send a message to start the consultation.</div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.sender_id === user?._id;
                return (
                  <div key={msg.id || i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                      isMe 
                        ? "bg-slate-900 text-white rounded-br-sm" 
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
                placeholder={`Message ${activePatient.full_name}...`}
                className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-200 rounded-xl px-4 py-3 text-sm transition-all outline-none"
              />
              <button 
                onClick={handleSend}
                className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-black transition-colors shadow-sm"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-50">
          <p>Select a patient to view messages</p>
        </div>
      )}
    </div>
  );
}
