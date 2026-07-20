"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Cookies from "js-cookie";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function PatientAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    "What do my latest CBC results mean?",
    "Should I be worried about my high cholesterol?",
    "What are the side effects of Metformin?"
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (messageText: string) => {
    if (!messageText.trim()) return;
    
    const newUserMessage: Message = { role: "user", content: messageText };
    setMessages(prev => [...prev, newUserMessage]);
    setInput("");
    setIsTyping(true);
    setSuggestions([]);

    try {
      const token = Cookies.get('access_token');
      const response = await fetch("http://localhost:8000/api/v1/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ message: messageText })
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let assistantMessageContent = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.token) {
                assistantMessageContent += data.token;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1].content = assistantMessageContent;
                  return newMessages;
                });
              }
              if (data.done && data.suggestions) {
                setSuggestions(data.suggestions);
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1].role === 'assistant') {
          newMessages[newMessages.length - 1].content = "Sorry, I encountered an error. Please try again.";
        }
        return newMessages;
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">DoorDoctor AI</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
          <AlertCircle className="w-3.5 h-3.5" /> AI can make mistakes.
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-2 shadow-sm">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">How can I help you today?</h2>
            <p className="text-slate-500 text-sm">
              I have access to your complete medical timeline, reports, and prescriptions. Feel free to ask me anything about your health.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "user" ? "bg-slate-200 text-slate-600" : "bg-blue-100 text-blue-600"
              }`}>
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl p-4 ${
                msg.role === "user" 
                  ? "bg-blue-600 text-white rounded-tr-none shadow-sm" 
                  : "bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm"
              }`}>
                {msg.role === "user" ? (
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                ) : (
                  <div className="prose prose-sm prose-slate max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {isTyping && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 flex items-center gap-1 shadow-sm">
              <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
              <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions & Input */}
      <div className="p-4 bg-white border-t border-slate-100">
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(suggestion)}
                className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 px-3 py-1.5 rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(input);
              }
            }}
            placeholder="Ask about your health, reports, or medicines..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            disabled={isTyping}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
