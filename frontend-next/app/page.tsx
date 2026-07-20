"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeartPulse, Stethoscope, Clock, ShieldCheck, ChevronRight, Activity, CalendarDays, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState("patients");

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="min-h-screen bg-black text-slate-50 selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="text-blue-500 w-8 h-8" />
            <span className="text-xl font-bold tracking-tight">DoorDoctor AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-white transition-colors">How it Works</Link>
            <Link href="#doctors" className="hover:text-white transition-colors">For Doctors</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-white transition-colors hidden md:block">
              Log in
            </Link>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6">
              Book Appointment
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Your AI-Powered Healthcare Ecosystem
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
              Hospital-grade care,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                delivered to your door.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12">
              Book consultations, upload your medical reports, and get instant analysis from our AI Doctor. Seamlessly integrated with world-class specialists.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="h-14 px-8 text-base bg-blue-600 hover:bg-blue-700 rounded-full w-full sm:w-auto gap-2">
                Find a Doctor <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-full w-full sm:w-auto bg-white/5 border-white/10 hover:bg-white/10 text-white">
                Try AI Co-Pilot
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 border-y border-white/10 bg-white/[0.02]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Active Doctors", value: "500+" },
              { label: "AI Consultations", value: "2M+" },
              { label: "Response Time", value: "< 2 min" },
              { label: "Patient Rating", value: "4.9/5" }
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-sm text-slate-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Toggle */}
      <section id="features" className="py-32 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">A complete healthcare platform.</h2>
            <p className="text-slate-400 text-lg">Designed for both patients and healthcare providers.</p>
          </div>

          <div className="flex justify-center mb-12">
            <div className="p-1 rounded-full bg-white/5 border border-white/10 flex gap-1">
              <button
                onClick={() => setActiveTab("patients")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === "patients" ? "bg-white text-black shadow-lg" : "text-slate-400 hover:text-white"
                }`}
              >
                For Patients
              </button>
              <button
                onClick={() => setActiveTab("doctors")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === "doctors" ? "bg-white text-black shadow-lg" : "text-slate-400 hover:text-white"
                }`}
              >
                For Doctors
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid md:grid-cols-3 gap-6"
            >
              {activeTab === "patients" ? (
                <>
                  <FeatureCard 
                    icon={<Activity />} title="AI Health Score" 
                    desc="Track your recovery and vitals with our intelligent timeline and risk prediction models."
                  />
                  <FeatureCard 
                    icon={<CalendarDays />} title="Video Consultations" 
                    desc="Book instant online appointments with top doctors in our secure waiting room."
                  />
                  <FeatureCard 
                    icon={<HeartPulse />} title="Medicine Tracker" 
                    desc="Get digital prescriptions and automated medicine reminders directly on your phone."
                  />
                </>
              ) : (
                <>
                  <FeatureCard 
                    icon={<ShieldCheck />} title="Clinical AI Co-pilot" 
                    desc="Generate SOAP notes, differential diagnoses, and referral letters automatically using RAG."
                  />
                  <FeatureCard 
                    icon={<Stethoscope />} title="Patient Assignment" 
                    desc="Securely manage your assigned patients, review timelines, and approve prescriptions."
                  />
                  <FeatureCard 
                    icon={<ChevronRight />} title="Practice Analytics" 
                    desc="Track revenue, appointment history, and patient outcomes in a hospital-grade dashboard."
                  />
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Call to action */}
      <section className="py-32 px-6 bg-gradient-to-t from-blue-900/20 to-black">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to transform your health?</h2>
          <p className="text-xl text-slate-400 mb-10">Join thousands of patients taking control of their medical records with the power of DoorDoctor AI.</p>
          <Button size="lg" className="h-14 px-8 text-base bg-white text-black hover:bg-slate-200 rounded-full">
            Create Free Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6 text-sm text-slate-500">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-blue-500" />
            <span className="font-semibold text-slate-300">DoorDoctor AI</span>
          </div>
          <div>© {new Date().getFullYear()} DoorDoctor AI. All rights reserved.</div>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-slate-300">Privacy Policy</Link>
            <Link href="#" className="hover:text-slate-300">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/[0.07] transition-all group">
      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-200 mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
