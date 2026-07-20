"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { HeartPulse, ArrowRight, User, Stethoscope } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const registerSchema = z.object({
  full_name: z.string().min(2, "Full name is required."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(10, "Password must be at least 10 characters.")
    .regex(/[A-Z]/, "Password must contain an uppercase letter.")
    .regex(/[0-9]/, "Password must contain a digit.")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character."),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post("/auth/register", {
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        role: role
      });
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Email may already be in use.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 text-slate-200 py-12">
      <div className="w-full max-w-lg bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-blue-500/10 rounded-full border border-blue-500/20 text-blue-400">
            <HeartPulse className="w-8 h-8" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">Create an account</h1>
        <p className="text-slate-400 text-center mb-8 text-sm">Join DoorDoctor AI today</p>
        
        {isSuccess ? (
          <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-4 py-6 rounded-xl text-center mb-6">
            <h3 className="font-bold text-lg mb-2">Registration Successful!</h3>
            <p className="text-sm">Redirecting you to login...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
                {error}
              </div>
            )}

            <div className="flex gap-4 mb-8">
              <button
                type="button"
                onClick={() => setRole("patient")}
                className={`flex-1 p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  role === "patient" 
                    ? "bg-blue-500/10 border-blue-500 text-blue-400" 
                    : "bg-black/50 border-white/10 text-slate-400 hover:border-white/20"
                }`}
              >
                <User className="w-6 h-6" />
                <span className="font-medium">Patient</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("doctor")}
                className={`flex-1 p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  role === "doctor" 
                    ? "bg-blue-500/10 border-blue-500 text-blue-400" 
                    : "bg-black/50 border-white/10 text-slate-400 hover:border-white/20"
                }`}
              >
                <Stethoscope className="w-6 h-6" />
                <span className="font-medium">Doctor</span>
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Full Name</label>
                <input 
                  {...register("full_name")}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="John Doe"
                />
                {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Email Address</label>
                <input 
                  {...register("email")}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="you@example.com"
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Password</label>
                <input 
                  {...register("password")}
                  type="password"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
                <p className="text-xs text-slate-500 mt-2">Must contain 10+ characters, 1 uppercase, 1 digit, 1 special character.</p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create Account"} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </>
        )}

        <p className="text-center text-sm text-slate-400 mt-8">
          Already have an account? <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}
