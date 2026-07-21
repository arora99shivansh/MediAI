import { Activity } from "lucide-react";

export default function TimelinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
        <Activity className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Health Timeline</h1>
      <p className="text-slate-500 max-w-md">
        View a chronological history of your health events, visits, and milestones. This feature is coming in a future update.
      </p>
    </div>
  );
}
