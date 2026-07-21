import { Pill } from "lucide-react";

export default function MedicinesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
        <Pill className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Medicines</h1>
      <p className="text-slate-500 max-w-md">
        View your active prescriptions, refill statuses, and medication history. This feature is coming in a future update.
      </p>
    </div>
  );
}
