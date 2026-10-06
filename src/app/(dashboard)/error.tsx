"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-4 gap-3">
      <AlertTriangle className="w-10 h-10 text-amber-500" />
      <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Something went wrong</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        We couldn&apos;t load this page. This is usually temporary — please try again.
      </p>
      {error.digest && <p className="text-xs text-gray-400 font-mono">Error ID: {error.digest}</p>}
      <div className="flex gap-2 mt-2">
        <button
          onClick={reset}
          className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Try again
        </button>
        <Link
          href="/dashboard"
          className="text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:border-gray-400 transition-colors"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
