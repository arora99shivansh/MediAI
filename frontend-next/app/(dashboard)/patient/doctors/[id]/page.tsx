"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Star, Calendar, Clock, CreditCard, ShieldCheck } from "lucide-react";
import api from "@/lib/api";

export default function DoctorBookingProfile() {
  const params = useParams();
  const router = useRouter();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Booking State
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [bookingStep, setBookingStep] = useState(1); // 1: Select slot, 2: Checkout, 3: Success
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock Slots
  const timeSlots = ["09:00 AM", "10:30 AM", "01:00 PM", "03:30 PM", "05:00 PM"];
  // Mock Dates (Next 5 days)
  const availableDates = Array.from({length: 5}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (params.id) fetchDoctor();
  }, [params.id]);

  const fetchDoctor = async () => {
    try {
      const res = await api.get(`/doctor/profile/${params.id}`);
      setDoctor(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedDate || !selectedSlot) return;
    setIsProcessing(true);
    try {
      const res = await api.post("/appointments/book", {
        doctor_id: params.id,
        date: selectedDate,
        slot: selectedSlot
      });
      setAppointmentId(res.data._id);
      setBookingStep(2); // Move to checkout
    } catch (error) {
      console.error("Booking failed", error);
      alert("Failed to book slot. It might be already taken.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckout = async () => {
    if (!appointmentId) return;
    setIsProcessing(true);
    try {
      // 1. Create Payment Intent
      const intentRes = await api.post(`/payments/intent?amount=${doctor.consultation_fee || 50}&appointment_id=${appointmentId}`);
      const paymentId = intentRes.data.payment_id;
      
      // 2. Mock Stripe Checkout success -> Confirm Payment
      await api.post("/payments/confirm", {
        payment_id: paymentId,
        appointment_id: appointmentId
      });
      
      setBookingStep(3); // Success
    } catch (error) {
      console.error("Payment failed", error);
      alert("Payment processing failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="text-center p-12 text-slate-500">Loading profile...</div>;
  if (!doctor) return <div className="text-center p-12 text-red-500">Doctor not found</div>;

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
            
            {bookingStep === 1 && (
              <>
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
                      {availableDates.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {selectedDate && (
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2 mt-4">
                        <Clock className="w-4 h-4" /> Available Slots
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {timeSlots.map(slot => (
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
                    </div>
                  )}

                  <button
                    onClick={handleBook}
                    disabled={!selectedDate || !selectedSlot || isProcessing}
                    className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-colors"
                  >
                    {isProcessing ? "Booking..." : "Continue to Payment"}
                  </button>
                </div>
              </>
            )}

            {bookingStep === 2 && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Secure Checkout</h3>
                <p className="text-slate-500 text-sm mt-2 mb-6">You are booking a consultation on <b>{selectedDate}</b> at <b>{selectedSlot}</b> for <b>${doctor.consultation_fee || 50}</b>.</p>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-left">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Test Payment Gateway</p>
                  <p className="text-sm text-slate-600">This simulates a Stripe checkout. No real card needed.</p>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full bg-slate-900 hover:bg-black text-white py-3 rounded-xl font-bold transition-colors shadow-md flex justify-center items-center gap-2"
                >
                  {isProcessing ? "Processing..." : `Pay $${doctor.consultation_fee || 50}`}
                </button>
                <button
                  onClick={() => setBookingStep(1)}
                  className="w-full mt-3 text-slate-500 hover:text-slate-800 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            )}

            {bookingStep === 3 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Booking Confirmed!</h3>
                <p className="text-slate-500 mt-2">Your payment was successful and the appointment is booked.</p>
                
                <button
                  onClick={() => router.push("/patient/appointments")}
                  className="mt-8 bg-blue-50 text-blue-700 hover:bg-blue-100 px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                  View My Appointments
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
