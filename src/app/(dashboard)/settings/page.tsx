"use client";

import { useEffect, useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { Save, User, Cpu, Loader2, AlertTriangle } from "lucide-react";

const inputClass =
  "w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
  }, [user]);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setCredits(data.user.credits))
      .catch(() => {});
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await user.update({ firstName: firstName.trim(), lastName: lastName.trim() });
      toast.success("Profile updated");
    } catch (err) {
      const message = (err as { errors?: { longMessage?: string }[] })?.errors?.[0]?.longMessage;
      toast.error(message ?? "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/user", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account");
      toast.success("Your account has been deleted");
      await signOut({ redirectUrl: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete account");
      setDeleting(false);
    }
  };

  const dirty = !!user && (firstName.trim() !== (user.firstName ?? "") || lastName.trim() !== (user.lastName ?? ""));

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your account and preferences.</p>
      </div>

      {/* Profile */}
      <form onSubmit={handleSaveProfile} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">Profile</h2>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">First name</label>
              <input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={!isLoaded} className={inputClass} />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Last name</label>
              <input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={!isLoaded} className={inputClass} />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
            <input
              id="email"
              value={user?.primaryEmailAddress?.emailAddress ?? ""}
              disabled
              className="w-full px-3 py-2 text-sm border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Change your email or password from the account menu (your avatar in the sidebar).</p>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving || !dirty}
          className="mt-4 inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>

      {/* Usage */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">AI usage</h2>
        </div>
        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{credits ?? "—"}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Credits remaining. Each blueprint generation uses 10 credits; failed generations are refunded.</p>
      </div>

      {/* Danger zone */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-100 dark:border-red-900/30 p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">Danger zone</h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Permanently delete your account and all projects and blueprints. This cannot be undone. Type <strong>DELETE</strong> to confirm.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            aria-label="Type DELETE to confirm"
            className={inputClass}
          />
          <button
            onClick={handleDeleteAccount}
            disabled={confirmText !== "DELETE" || deleting}
            className="inline-flex items-center justify-center gap-1.5 text-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
}
