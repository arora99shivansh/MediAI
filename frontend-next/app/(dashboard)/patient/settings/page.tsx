"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertCircle, Bell, Settings, ShieldCheck, UserRound, NotebookPen, Lock, MonitorSmartphone, Palette, Globe, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type PatientProfile = {
  profile?: {
    age?: number;
    gender?: string;
    allergies?: string[];
    chronic_conditions?: string[];
    risk_predictions?: Array<{ risk_level?: string }>;
  };
  age?: number;
  gender?: string;
  allergies?: string[];
  chronic_conditions?: string[];
  risk_predictions?: Array<{ risk_level?: string }>;
};

type AlertItem = {
  id: string;
  title?: string;
  message?: string;
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSymptom, setSavingSymptom] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({ symptom: "", severity: 5, notes: "" });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [profileRes, alertsRes] = await Promise.all([
          api.get("/patient/profile"),
          api.get("/patient/alerts"),
        ]);
        setProfile(profileRes.data as PatientProfile);
        setAlerts(alertsRes.data as AlertItem[]);
      } catch (error) {
        console.error("Failed to load patient settings", error);
      } finally {
        setLoading(false);
      }
    };

    void loadSettings();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingSymptom(true);
    setSaved(false);
    try {
      await api.post("/patient/symptoms", formData);
      setFormData({ symptom: "", severity: 5, notes: "" });
      setSaved(true);
    } catch (error) {
      console.error("Failed to save symptom", error);
    } finally {
      setSavingSymptom(false);
    }
  };

  const normalizedProfile = profile?.profile || profile || {};
  
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="mt-2 text-slate-500">Manage your profile, security preferences, and health data.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-1">
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <UserRound className="w-4 h-4" /> Personal Profile
          </button>
          <button onClick={() => setActiveTab('security')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === 'security' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <ShieldCheck className="w-4 h-4" /> Security & Login
          </button>
          <button onClick={() => setActiveTab('notifications')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === 'notifications' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Bell className="w-4 h-4" /> Notifications
          </button>
          <button onClick={() => setActiveTab('preferences')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === 'preferences' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Settings className="w-4 h-4" /> Preferences
          </button>
          <button onClick={() => setActiveTab('danger')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === 'danger' ? 'bg-rose-50 text-rose-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Trash2 className="w-4 h-4" /> Danger Zone
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 p-6">
                  <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                      <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-slate-900" defaultValue={user?.full_name} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                      <input type="email" disabled className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed" defaultValue={user?.email} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Age</label>
                      <input type="number" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" defaultValue={normalizedProfile.age} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Gender</label>
                      <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" defaultValue={normalizedProfile.gender}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button className="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-medium transition-colors">Save Profile</button>
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 p-6">
                  <h2 className="text-lg font-bold text-slate-900">Health Profile</h2>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Allergies</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(normalizedProfile.allergies || []).map(a => (
                        <span key={a} className="bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-sm font-medium">{a}</span>
                      ))}
                    </div>
                    <input type="text" placeholder="Add an allergy..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Chronic Conditions</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(normalizedProfile.chronic_conditions || []).map(c => (
                        <span key={c} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">{c}</span>
                      ))}
                    </div>
                    <input type="text" placeholder="Add a condition..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" />
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button className="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-medium transition-colors">Save Health Profile</button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 p-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Password</h2>
                    <p className="text-sm text-slate-500 mt-1">Ensure your account is using a long, random password.</p>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Current Password</label>
                    <input type="password" placeholder="••••••••" className="w-full md:w-1/2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                    <input type="password" placeholder="••••••••" className="w-full md:w-1/2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" />
                  </div>
                  <div className="pt-2">
                    <button className="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-medium transition-colors">Update Password</button>
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 p-6">
                  <h2 className="text-lg font-bold text-slate-900">Connected Devices</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-4">
                      <MonitorSmartphone className="w-6 h-6 text-slate-400" />
                      <div>
                        <p className="font-semibold text-slate-900">Chrome on Windows (Current)</p>
                        <p className="text-sm text-slate-500">New York, USA • Active now</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                    <div className="flex items-center gap-4">
                      <MonitorSmartphone className="w-6 h-6 text-slate-400" />
                      <div>
                        <p className="font-semibold text-slate-900">Safari on iPhone</p>
                        <p className="text-sm text-slate-500">New York, USA • Last active 2 hours ago</p>
                      </div>
                    </div>
                    <button className="text-sm text-rose-600 font-medium hover:text-rose-700">Revoke</button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 p-6">
                  <h2 className="text-lg font-bold text-slate-900">Notification Preferences</h2>
                  <p className="text-sm text-slate-500 mt-1">Choose how you want to be notified about account activity.</p>
                </div>
                <div className="p-0">
                  <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">Appointment Updates</p>
                      <p className="text-sm text-slate-500">Confirmations, cancellations, and reschedule requests.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" /> Email
                      </label>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" /> Push
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">Chat Messages</p>
                      <p className="text-sm text-slate-500">Direct messages from your doctors.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" /> Email
                      </label>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" /> Push
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">Payment Receipts</p>
                      <p className="text-sm text-slate-500">Invoices and refund confirmations.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" /> Email
                      </label>
                      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" /> Push
                      </label>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-slate-50 flex justify-end">
                  <button className="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-medium transition-colors">Save Preferences</button>
                </div>
              </section>
            </div>
          )}

          {/* PREFERENCES TAB */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 p-6">
                  <h2 className="text-lg font-bold text-slate-900">App Preferences</h2>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><Palette className="w-4 h-4" /> Theme Interface</label>
                    <div className="flex gap-4">
                      <button className="flex-1 p-4 rounded-xl border-2 border-blue-600 bg-slate-50 flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm"></div>
                        <span className="text-sm font-semibold text-blue-700">Light Mode</span>
                      </button>
                      <button className="flex-1 p-4 rounded-xl border-2 border-slate-200 bg-white flex flex-col items-center gap-2 opacity-50 cursor-not-allowed">
                        <div className="w-8 h-8 rounded-full bg-slate-800"></div>
                        <span className="text-sm font-semibold text-slate-500">Dark Mode (Soon)</span>
                      </button>
                      <button className="flex-1 p-4 rounded-xl border-2 border-slate-200 bg-white flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-slate-200 to-slate-800"></div>
                        <span className="text-sm font-semibold text-slate-700">System</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"><Globe className="w-4 h-4" /> Language</label>
                    <select className="w-full md:w-1/2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none">
                      <option value="en">English (US)</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* DANGER ZONE TAB */}
          {activeTab === 'danger' && (
            <div className="space-y-6">
              <section className="bg-white rounded-2xl border border-rose-200 shadow-sm overflow-hidden">
                <div className="border-b border-rose-100 p-6 bg-rose-50/50">
                  <h2 className="text-lg font-bold text-rose-700">Danger Zone</h2>
                  <p className="text-sm text-rose-600/80 mt-1">Irreversible and destructive actions.</p>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold text-slate-900">Delete Account</h3>
                    <p className="text-sm text-slate-500 mt-1 mb-4">Permanently delete your account, medical history, and all chat records. This action cannot be undone.</p>
                    <button className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-6 py-2.5 rounded-xl font-medium transition-colors">Delete My Account</button>
                  </div>
                  <hr className="border-slate-100" />
                  <div>
                    <h3 className="font-semibold text-slate-900">Export Medical Data</h3>
                    <p className="text-sm text-slate-500 mt-1 mb-4">Download a complete copy of all your medical reports, timelines, and consultation notes in JSON format.</p>
                    <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-2.5 rounded-xl font-medium transition-colors">Request Data Export</button>
                  </div>
                </div>
              </section>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
