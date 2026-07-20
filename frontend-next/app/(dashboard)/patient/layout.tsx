"use client";

import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Home, Calendar, Activity, Pill, Settings, User, MessageSquare } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

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
        <div className="h-20 flex items-center px-6 border-b border-slate-100">
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
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:hidden">
          <span className="font-bold text-blue-600">DoorDoctor AI</span>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
