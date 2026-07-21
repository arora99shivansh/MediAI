import { TrendingUp } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
        <TrendingUp className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Practice Analytics</h1>
      <p className="text-slate-500 max-w-md">
        View metrics, patient demographics, and insights about your practice. This feature is coming in a future update.
      </p>
    </div>
  );
}
