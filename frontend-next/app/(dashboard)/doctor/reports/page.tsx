import { FileText } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
        <FileText className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Patient Reports</h1>
      <p className="text-slate-500 max-w-md">
        This section will allow you to generate and view comprehensive medical reports for your patients. This feature is coming in a future update.
      </p>
    </div>
  );
}
