"use client";

import { useState } from "react";
import { Search, Send, User, MoreVertical, Phone, Video } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function PatientMessages() {
  const { user } = useAuth();
  
  // Mock conversation list
  const [conversations] = useState([
    { id: 1, name: "Dr. Sarah Smith", spec: "Cardiologist", lastMsg: "Your recent test results look good.", time: "10:30 AM", unread: 2 },
    { id: 2, name: "Dr. James Wilson", spec: "General Physician", lastMsg: "Please make sure to stay hydrated.", time: "Yesterday", unread: 0 }
  ]);
  
  const [activeChat, setActiveChat] = useState(conversations[0]);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { id: 1, sender: "doctor", text: "Hello! How are you feeling today after starting the new medication?", time: "10:15 AM" },
    { id: 2, sender: "patient", text: "Hi Dr. Smith. I'm feeling a bit better, but I occasionally get a mild headache.", time: "10:20 AM" },
    { id: 3, sender: "doctor", text: "That can be a common side effect in the first few days. Your recent test results look good otherwise.", time: "10:30 AM" },
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    setChatHistory([...chatHistory, {
      id: Date.now(),
      sender: "patient",
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setMessage("");
  };

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
          {conversations.map(conv => (
            <button 
              key={conv.id}
              onClick={() => setActiveChat(conv)}
              className={`w-full p-4 flex items-start gap-3 border-b border-slate-100 transition-colors text-left ${
                activeChat.id === conv.id ? "bg-blue-50" : "hover:bg-slate-100"
              }`}
            >
              <div className="relative">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                  {conv.name.charAt(4)}
                </div>
                {conv.unread > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {conv.unread}
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-semibold text-slate-900 text-sm truncate">{conv.name}</h4>
                  <span className="text-xs text-slate-400">{conv.time}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{conv.lastMsg}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
              {activeChat.name.charAt(4)}
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{activeChat.name}</h3>
              <p className="text-xs text-slate-500">{activeChat.spec}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Phone className="w-5 h-5" /></button>
            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Video className="w-5 h-5" /></button>
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><MoreVertical className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4">
          {chatHistory.map(msg => {
            const isMe = msg.sender === "patient";
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                  isMe 
                    ? "bg-blue-600 text-white rounded-br-sm" 
                    : "bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm"
                }`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1">{msg.time}</span>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-slate-200">
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
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
    </div>
  );
}
