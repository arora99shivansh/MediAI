"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Clock, Stethoscope, MapPin, DollarSign, AlignLeft } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsPage() {
  const { user } = useAuth();
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

  if (loading) return <div className="p-8 text-slate-500">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
          <p className="text-slate-500">Manage your public profile and weekly schedule.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 font-medium">
          Profile updated successfully!
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-400" /> Professional Details
          </h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Stethoscope className="w-4 h-4" /> Specialization
              </label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                placeholder="e.g. Cardiologist"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Experience (Years)
              </label>
              <input
                type="number"
                name="experience_years"
                value={formData.experience_years}
                onChange={handleChange}
                placeholder="e.g. 10"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Consultation Fee ($)
              </label>
              <input
                type="number"
                name="consultation_fee"
                value={formData.consultation_fee}
                onChange={handleChange}
                placeholder="e.g. 150"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. New York"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Hospital / Clinic Name
              </label>
              <input
                type="text"
                name="hospital"
                value={formData.hospital}
                onChange={handleChange}
                placeholder="e.g. City General Hospital"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <AlignLeft className="w-4 h-4" /> About
              </label>
              <textarea
                name="about"
                value={formData.about}
                onChange={handleChange}
                rows={4}
                placeholder="Brief professional bio..."
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" /> Weekly Availability Schedule
          </h2>
          <p className="text-sm text-slate-500 mt-1">Select the slots you are available for consultation each day.</p>
        </div>
        <div className="p-6 space-y-8">
          {Object.keys(availability).map((day) => (
            <div key={day} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
              <h3 className="font-medium text-slate-900 mb-3">{day}</h3>
              <div className="flex flex-wrap gap-2">
                {availableTimeSlots.map((slot) => {
                  const isSelected = availability[day].includes(slot);
                  return (
                    <button
                      key={slot}
                      onClick={() => toggleSlot(day, slot)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
