"use client";

import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Home, Calendar, Activity, Pill, Settings, User, MessageSquare, Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);

  const navItems = [
    { name: "Overview", href: "/patient", icon: Home },
    { name: "Find Doctors", href: "/patient/doctors", icon: User },
    { name: "Appointments", href: "/patient/appointments", icon: Calendar },
    { name: "Messages", href: "/patient/messages", icon: MessageSquare },
    { name: "Timeline", href: "/patient/timeline", icon: Activity },
    { name: "Medicines", href: "/patient/medicines", icon: Pill },
    { name: "Settings", href: "/patient/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <span className="text-xl font-bold text-blue-600 tracking-tight">DoorDoctor AI</span>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <div className="mb-4 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Patient Portal
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {user?.full_name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {/* Global Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 md:px-8 z-10 sticky top-0">
          <div className="flex items-center md:hidden">
             <span className="font-bold text-blue-600">DoorDoctor AI</span>
          </div>
          <div className="hidden md:block">
            {/* Breadcrumb or Title could go here */}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notification Center */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-900">Notifications</h3>
                    <button className="text-xs font-medium text-blue-600 hover:text-blue-700">Mark all read</button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer">
                      <p className="text-sm font-semibold text-slate-900">Welcome to DoorDoctor AI</p>
                      <p className="text-xs text-slate-500 mt-1">Complete your health profile to get better AI recommendations.</p>
                      <p className="text-xs text-slate-400 mt-2">Just now</p>
                    </div>
                    <div className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer">
                      <p className="text-sm font-semibold text-slate-900">Security Alert</p>
                      <p className="text-xs text-slate-500 mt-1">New login from Chrome on Windows.</p>
                      <p className="text-xs text-slate-400 mt-2">2 hours ago</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="w-8 h-8 rounded-full bg-blue-100 flex md:hidden items-center justify-center text-blue-700 font-bold">
              {user?.full_name?.charAt(0) || "U"}
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
