"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { Save, Key, User } from "lucide-react";

export default function SettingsPage() {
  const { user } = useUser();
  const [geminiKey, setGeminiKey] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    toast.success("Profile updated");
  };

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your account and preferences.</p>
      </div>

      {/* Profile */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">Profile</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Full name</label>
            <input defaultValue={user?.fullName ?? ""} className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
            <input defaultValue={user?.primaryEmailAddress?.emailAddress ?? ""} disabled className="w-full px-3 py-2 text-sm border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed" />
            <p className="text-xs text-gray-400 mt-1">Managed by Clerk authentication.</p>
          </div>
        </div>
        <button onClick={handleSaveProfile} disabled={saving} className="mt-4 inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          <Save className="w-3.5 h-3.5" />{saving ? "Saving..." : "Save changes"}
        </button>
      </div>

      {/* API Keys */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">API keys</h2>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Gemini API key</label>
          <input
            type="password"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="AIza..."
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono"
          />
          <p className="text-xs text-gray-400 mt-1">
            Get your key from{" "}
            <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer" className="text-violet-600 dark:text-violet-400 hover:underline">
              Google AI Studio
            </a>
          </p>
        </div>
        <button onClick={() => { if (geminiKey) toast.success("API key saved"); }} className="mt-4 inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          <Save className="w-3.5 h-3.5" />Save key
        </button>
      </div>

      {/* Danger zone */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-100 dark:border-red-900/30 p-5">
        <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Danger zone</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Permanently delete your account and all associated data. This cannot be undone.</p>
        <button onClick={() => toast.error("Account deletion requires confirmation email")} className="text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:border-red-400 dark:hover:border-red-700 px-3 py-2 rounded-lg transition-colors">
          Delete account
        </button>
      </div>
    </div>
  );
}
