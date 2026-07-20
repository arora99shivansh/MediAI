"use client";

import { useAuth } from "@/contexts/AuthContext";
import { LogOut, LayoutDashboard, Users, UserCheck, Shield, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Doctors", href: "/admin/doctors", icon: UserCheck },
    { name: "Patients", href: "/admin/patients", icon: Users },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex text-slate-300">
        <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-black/20">
          <Shield className="w-6 h-6 text-purple-500 mr-2" />
          <span className="text-xl font-bold text-white tracking-tight">Admin<span className="text-purple-500">Panel</span></span>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <div className="mb-4 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Management
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
                    ? "bg-purple-600 text-white" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-800 bg-black/10">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold border border-purple-500/30">
              {user?.full_name?.charAt(0) || "A"}
            </div>
            <div>
              <div className="text-sm font-medium text-white line-clamp-1">{user?.full_name}</div>
              <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between sticky top-0 z-10 text-white">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Shield className="w-5 h-5 text-purple-500" /> DoorDoctor Admin
          </div>
          <button onClick={logout} className="p-2 text-rose-400"><LogOut className="w-5 h-5" /></button>
        </header>

        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
