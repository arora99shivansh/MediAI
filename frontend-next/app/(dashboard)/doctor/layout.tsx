"use client";

import { useAuth } from "@/contexts/AuthContext";
import { LogOut, LayoutDashboard, Users, MessageSquare, ClipboardList, TrendingUp, Settings, FileText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", href: "/doctor", icon: LayoutDashboard },
    { name: "Patients", href: "/doctor/patients", icon: Users },
    { name: "Appointments", href: "/doctor/appointments", icon: ClipboardList },
    { name: "Messages", href: "/doctor/messages", icon: MessageSquare },
    { name: "Reports", href: "/doctor/reports", icon: FileText },
    { name: "Analytics", href: "/doctor/analytics", icon: TrendingUp },
    { name: "Settings", href: "/doctor/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Hospital Grade Dark Theme */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex text-slate-300">
        <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-black/20">
          <span className="text-xl font-bold text-white tracking-tight">DoorDoctor <span className="text-blue-500">PRO</span></span>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <div className="mb-4 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Clinical Workspace
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
                    ? "bg-blue-600 text-white" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-800 bg-black/20">
          <div className="flex items-center gap-3 px-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
              {user?.full_name?.charAt(0) || "D"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Dr. {user?.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/10"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 md:hidden text-white">
          <span className="font-bold">DoorDoctor <span className="text-blue-500">PRO</span></span>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
