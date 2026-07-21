"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Clock, Stethoscope, MapPin, DollarSign, AlignLeft, UserRound, ShieldCheck, Bell, Palette, Globe, Trash2, MonitorSmartphone } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("professional");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    specialization: "",
    experience_years: "",
    consultation_fee: "",
    hospital: "",
    city: "",
    about: "",
  });

  const [availability, setAvailability] = useState<Record<string, string[]>>({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  });

  const availableTimeSlots = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
    "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM"
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?._id) return;
      try {
        const res = await api.get(`/doctor/profile/${user._id}`);
        const data = res.data;
        setFormData({
          specialization: data.specialization || "",
          experience_years: data.experience_years || "",
          consultation_fee: data.consultation_fee || "",
          hospital: data.hospital || "",
          city: data.city || "",
          about: data.about || "",
        });
        if (data.availability) {
          setAvailability((prev) => ({ ...prev, ...data.availability }));
        }
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleSlot = (day: string, slot: string) => {
    setAvailability((prev) => {
      const daySlots = prev[day] || [];
      if (daySlots.includes(slot)) {
        return { ...prev, [day]: daySlots.filter((s) => s !== slot) };
      } else {
        return { ...prev, [day]: [...daySlots, slot].sort() };
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const payload = {
        ...formData,
        experience_years: formData.experience_years ? parseInt(formData.experience_years as string) : null,
        consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee as string) : null,
        availability,
      };
      await api.put("/doctor/profile", payload);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save profile", error);
      alert("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

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
        <p className="mt-2 text-slate-500">Manage your public profile, schedule, and security preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-1">
          <button onClick={() => setActiveTab('professional')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === 'professional' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <UserRound className="w-4 h-4" /> Professional Profile
          </button>
          <button onClick={() => setActiveTab('schedule')} className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${activeTab === 'schedule' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Clock className="w-4 h-4" /> Weekly Schedule
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
          
          {/* PROFESSIONAL TAB */}
          {activeTab === 'professional' && (
            <div className="space-y-6">
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 p-6 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-slate-900">Professional Details</h2>
                  {success && <span className="text-sm font-bold text-emerald-600">Saved!</span>}
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                      <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" defaultValue={user?.full_name} disabled />
                      <p className="text-xs text-slate-500 mt-2">Contact support to change your legal name.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <Stethoscope className="w-4 h-4" /> Specialization
                      </label>
                      <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} placeholder="e.g. Cardiologist" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Experience (Years)
                      </label>
                      <input type="number" name="experience_years" value={formData.experience_years} onChange={handleChange} placeholder="e.g. 10" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" /> Consultation Fee ($)
                      </label>
                      <input type="number" name="consultation_fee" value={formData.consultation_fee} onChange={handleChange} placeholder="e.g. 150" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> City
                      </label>
                      <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="e.g. New York" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Hospital / Clinic Name
                      </label>
                      <input type="text" name="hospital" value={formData.hospital} onChange={handleChange} placeholder="e.g. City General Hospital" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <AlignLeft className="w-4 h-4" /> About You
                      </label>
                      <textarea name="about" value={formData.about} onChange={handleChange} rows={4} placeholder="Brief professional bio..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none" />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2">
                      {saving ? "Saving..." : "Save Details"}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* SCHEDULE TAB */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 p-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Weekly Schedule</h2>
                    <p className="text-sm text-slate-500 mt-1">Select the slots you are available for consultation each day.</p>
                  </div>
                  {success && <span className="text-sm font-bold text-emerald-600">Saved!</span>}
                </div>
                <div className="p-6 space-y-8">
                  {Object.keys(availability).map((day) => (
                    <div key={day} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                      <h3 className="font-semibold text-slate-900 mb-4">{day}</h3>
                      <div className="flex flex-wrap gap-2">
                        {availableTimeSlots.map((slot) => {
                          const isSelected = availability[day].includes(slot);
                          return (
                            <button
                              key={slot}
                              onClick={() => toggleSlot(day, slot)}
                              className={`px-3 py-2 text-sm font-medium rounded-xl border transition-colors ${
                                isSelected
                                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                  : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 flex justify-end">
                    <button onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2">
                      {saving ? "Saving..." : "Save Schedule"}
                    </button>
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
                  <p className="text-sm text-slate-500 mt-1">Choose how you want to be notified about patient activity.</p>
                </div>
                <div className="p-0">
                  <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">New Appointment Requests</p>
                      <p className="text-sm text-slate-500">When a patient requests a slot.</p>
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
                      <p className="font-semibold text-slate-900">Patient Messages</p>
                      <p className="text-sm text-slate-500">Direct messages and report uploads from patients.</p>
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
                    <h3 className="font-semibold text-slate-900">Deactivate Profile</h3>
                    <p className="text-sm text-slate-500 mt-1 mb-4">Hide your profile from the directory. Existing appointments will remain active.</p>
                    <button className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-6 py-2.5 rounded-xl font-medium transition-colors">Deactivate Profile</button>
                  </div>
                  <hr className="border-slate-100" />
                  <div>
                    <h3 className="font-semibold text-slate-900">Delete Account</h3>
                    <p className="text-sm text-slate-500 mt-1 mb-4">Permanently delete your account, patient records, and all chat logs. This action cannot be undone.</p>
                    <button className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">Delete My Account</button>
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
