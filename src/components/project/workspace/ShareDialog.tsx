"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import toast from "react-hot-toast";
import { Eye, Globe, Link2Off, Loader2, Share2, X } from "lucide-react";
import CopyButton from "@/components/ui/CopyButton";
import { ensureOk } from "@/lib/stream";

type Link = { url: string; views: number; createdAt: string } | null;

export default function ShareDialog({ projectId, disabled }: { projectId: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState<Link | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  // Fetch the current link state each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    fetch(`/api/projects/${projectId}/share`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => setLink(d.link))
      .catch(() => {});
    return () => controller.abort();
  }, [open, projectId]);

  const call = async (method: "POST" | "DELETE") => {
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/share`, { method });
      await ensureOk(res, method === "POST" ? "Couldn't create link" : "Couldn't revoke link");
      setLink((await res.json()).link);
      toast.success(method === "POST" ? "Public link created" : "Link revoked — it no longer works");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger disabled={disabled} className="inline-flex items-center gap-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:border-gray-400 transition-colors disabled:opacity-50">
        <Share2 className="w-3.5 h-3.5" /> Share
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-1">
            <Dialog.Title className="text-base font-semibold text-gray-900 dark:text-white">Share blueprint</Dialog.Title>
            <Dialog.Close aria-label="Close" className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Anyone with the link can view the latest version — read-only, no sign-in needed. Chat, history and edit controls stay private.
          </Dialog.Description>

          {link === undefined ? (
            <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
          ) : link ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-3 pr-1 py-1">
                <Globe className="w-4 h-4 text-green-500 flex-shrink-0" />
                <input readOnly value={link.url} onFocus={(e) => e.target.select()} aria-label="Share link" className="flex-1 min-w-0 bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none" />
                <CopyButton text={link.url} label="Copy link" showLabel />
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <Eye className="w-3.5 h-3.5" /> {link.views} view{link.views === 1 ? "" : "s"}
                </span>
                <button onClick={() => call("DELETE")} disabled={busy} className="inline-flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 rounded-lg px-2.5 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/40">
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2Off className="w-3.5 h-3.5" />} Revoke link
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => call("POST")} disabled={busy} className="w-full inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2.5 rounded-lg disabled:opacity-60">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />} Create public link
            </button>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
