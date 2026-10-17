"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

/** Copies `text` (or the result of `getText`) and shows a check mark for 1.5s. */
export default function CopyButton({
  text,
  getText,
  label = "Copy",
  showLabel = false,
  className,
}: {
  text?: string;
  getText?: () => string;
  label?: string;
  showLabel?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    // Cleanup clears the timer if the button unmounts or is clicked again first.
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(getText ? getText() : text ?? "");
      setCopied(true);
    } catch {
      toast.error("Couldn't copy — your browser blocked clipboard access");
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-md px-1.5 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
        className
      )}
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      {showLabel && <span>{copied ? "Copied" : label}</span>}
    </button>
  );
}
