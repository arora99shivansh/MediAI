"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Star, Calendar, Clock, CreditCard, ShieldCheck } from "lucide-react";
import api from "@/lib/api";

type DoctorProfile = {
  _id: string;
  full_name: string;
  specialization?: string;
  city?: string;
  about?: string;
  consultation_fee?: number;
  available_dates?: string[];
  time_slots_by_date?: Record<string, string[]>;
};

export default function DoctorBookingProfile() {
  const params = useParams();
  const router = useRouter();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const getFallbackDates = () => {
    const dates = [];
    const slots: Record<string, string[]> = {};
    for (let i = 1; i <= 3; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dates.push(dateStr);
      slots[dateStr] = ["09:00 AM", "10:00 AM", "02:00 PM", "04:00 PM"];
    }
    return { dates, slots };
  };

  const fallbacks = getFallbackDates();
  const availableDates = doctor?.available_dates?.length ? doctor.available_dates : fallbacks.dates;
  const timeSlots = selectedDate 
    ? (doctor?.time_slots_by_date?.[selectedDate] || fallbacks.slots[selectedDate] || []) 
    : [];

  useEffect(() => {
    if (params.id) fetchDoctor();
  }, [params.id]);

  const fetchDoctor = async () => {
    try {
      const res = await api.get(`/doctor/profile/${params.id}`);
      setDoctor(res.data);
    } catch (error) {
      console.error(error);
      setError("Unable to load doctor profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedDate || !selectedSlot) return;
    setIsProcessing(true);
    setError("");
    try {
      const res = await api.post("/appointments/book", {
        doctor_id: params.id,
        date: selectedDate,
        slot: selectedSlot
      });

      const checkoutRes = await api.post("/payments/checkout-session", {
        appointment_id: res.data.id,
      });

      window.location.href = checkoutRes.data.checkout_url;
    } catch (error) {
      console.error("Booking failed", error);
      setError("We could not reserve this slot. It may have already been booked.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="text-center p-12 text-slate-500">Loading profile...</div>;
  if (!doctor) return <div className="text-center p-12 text-red-500">{error || "Doctor not found"}</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <button 
        onClick={() => router.push("/patient/doctors")}
        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Directory
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex items-start gap-6">
            <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-4xl font-bold border border-blue-100 flex-shrink-0">
              {doctor.full_name?.charAt(0) || "D"}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Practitioner
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{doctor.full_name}</h1>
              <p className="text-blue-600 font-medium">{doctor.specialization || "General Physician"}</p>
              
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> 4.8 Rating
                </div>
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" /> {doctor.city || "Online"}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">About</h2>
            <p className="text-slate-600 leading-relaxed">
              Dr. {doctor.full_name?.split(' ')[0]} is a highly experienced {doctor.specialization || "medical professional"} dedicated to providing exceptional care. With extensive expertise in modern treatments, they ensure comprehensive and personalized medical attention for every patient.
            </p>
          </div>
        </div>

        {/* Booking & Checkout Widget */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sticky top-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Book Appointment</h3>
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
              <span className="text-slate-500">Consultation Fee</span>
              <span className="text-xl font-bold text-slate-900">${doctor.consultation_fee || 50}</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Select Date
                </label>
                <select 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                >
                  <option value="">Choose a date...</option>
                  {availableDates.map((d: string) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {selectedDate && (
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2 mt-4">
                    <Clock className="w-4 h-4" /> Available Slots
                  </label>
                  {timeSlots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {timeSlots.map((slot: string) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2 rounded-lg text-sm font-medium border transition-colors ${
                            selectedSlot === slot 
                              ? "bg-blue-600 border-blue-600 text-white" 
                              : "bg-white border-slate-200 text-slate-700 hover:border-blue-500"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-red-500">No slots available for this date.</p>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Stripe-hosted checkout will open after you reserve the slot. Your appointment moves to doctor review once payment succeeds.
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={handleBook}
                disabled={!selectedDate || !selectedSlot || isProcessing}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                {isProcessing ? "Redirecting to Checkout..." : "Continue to Secure Payment"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
