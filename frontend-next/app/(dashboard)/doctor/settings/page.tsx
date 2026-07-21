import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 bg-slate-200 text-slate-600 rounded-2xl flex items-center justify-center mb-6">
        <Settings className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Account Settings</h1>
      <p className="text-slate-500 max-w-md">
        Manage your profile, notification preferences, and security settings. This feature is coming in a future update.
      </p>
    </div>
  );
}
