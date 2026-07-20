"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, MapPin, Stethoscope, Star, Filter } from "lucide-react";
import api from "@/lib/api";

export default function DoctorDirectory() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState("");
  const [searchSpec, setSearchSpec] = useState("");

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchCity) params.append("city", searchCity);
      if (searchSpec) params.append("specialization", searchSpec);
      
      const res = await api.get(`/doctor/search?${params.toString()}`);
      setDoctors(res.data);
    } catch (error) {
      console.error("Failed to fetch doctors", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Find a Doctor</h1>
        <p className="text-slate-500 mt-2">Book an appointment with top specialists.</p>
      </div>

      {/* Search Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by city..." 
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-sm"
          />
        </div>
        <div className="flex-1 relative">
          <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Specialization (e.g. Cardiologist)" 
            value={searchSpec}
            onChange={(e) => setSearchSpec(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors text-sm"
          />
        </div>
        <button 
          onClick={fetchDoctors}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" /> Search
        </button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading doctors...</div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500 font-medium">No doctors found matching your criteria.</p>
          <button onClick={() => { setSearchCity(""); setSearchSpec(""); fetchDoctors(); }} className="text-blue-600 font-medium text-sm mt-2">Clear Filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map(doctor => (
            <div key={doctor._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl font-bold border border-blue-100">
                    {doctor.full_name?.charAt(0) || "D"}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{doctor.full_name}</h3>
                    <p className="text-sm font-medium text-blue-600">{doctor.specialization || "General Physician"}</p>
                    <div className="flex items-center gap-1 text-xs font-medium text-slate-500 mt-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> 4.8 (120 reviews)
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" /> {doctor.city || "Online Consultation"}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Consultation Fee</span>
                    <span className="font-bold text-slate-900">${doctor.consultation_fee || "50"}</span>
                  </div>
                </div>
              </div>
              <div className="mt-auto p-4 bg-slate-50 border-t border-slate-100">
                <Link 
                  href={`/patient/doctors/${doctor._id}`}
                  className="w-full flex items-center justify-center bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  View Profile & Book
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
