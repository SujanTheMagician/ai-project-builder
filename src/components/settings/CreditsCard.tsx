"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Cpu, Loader2 } from "lucide-react";
import BarChart from "@/components/ui/BarChart";
import { CREDIT_COSTS } from "@/lib/pricing";
import { CREDIT_REASON_LABELS, formatRelativeTime } from "@/lib/utils";

type Ledger = {
  balance: number;
  transactions: { id: string; amount: number; reason: string; createdAt: string; projectId: string | null; projectName: string | null }[];
  daily: { day: string; spent: number }[];
  page: number;
  pageCount: number;
};

export default function CreditsCard() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Ledger | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // `ignore` is captured by this effect run's closure; a newer page request flips it so
    // a slow, stale response can't overwrite the page the user is now looking at.
    let ignore = false;
    setLoading(true);
    fetch(`/api/user/credits?page=${page}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Ledger | null) => {
        if (!ignore && d) setData(d);
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [page]);

  return (
    <section id="credits" className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 scroll-mt-20">
      <div className="flex items-center gap-2 mb-4">
        <Cpu className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <h2 className="text-sm font-medium text-gray-900 dark:text-white">AI credits</h2>
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
      </div>

      <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-end mb-5">
        <div>
          <p className="text-3xl font-semibold text-gray-900 dark:text-white tabular-nums">{data?.balance ?? "—"}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Blueprint {CREDIT_COSTS.blueprint_generation} · Section {CREDIT_COSTS.section_regeneration} · Chat & edits free
          </p>
        </div>
        {data && (
          <BarChart
            title="Credits used per day, last 14 days"
            height={64}
            data={data.daily.map((d) => ({
              label: new Date(d.day + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
              value: d.spent,
              display: `${d.spent} credits`,
            }))}
          />
        )}
      </div>

      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">History</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sr-only">
            <tr><th>Event</th><th>Project</th><th>When</th><th>Amount</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {data?.transactions.map((t) => (
              <tr key={t.id}>
                <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{CREDIT_REASON_LABELS[t.reason] ?? t.reason}</td>
                <td className="py-2 pr-3 text-gray-500 dark:text-gray-400 max-w-[10rem] truncate">
                  {t.projectId ? <Link href={`/projects/${t.projectId}`} className="hover:underline">{t.projectName}</Link> : t.reason.includes("generation") ? "Deleted project" : "—"}
                </td>
                <td className="py-2 pr-3 text-xs text-gray-400 whitespace-nowrap">{formatRelativeTime(t.createdAt)}</td>
                <td className={`py-2 text-right tabular-nums font-medium ${t.amount < 0 ? "text-gray-900 dark:text-white" : "text-green-600 dark:text-green-400"}`}>
                  {t.amount > 0 ? "+" : ""}{t.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && data.pageCount > 1 && (
        <div className="flex items-center justify-end gap-2 mt-3 text-xs text-gray-500">
          <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1} aria-label="Previous page" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40">
            <ChevronLeft className="w-4 h-4" />
          </button>
          Page {data.page} of {data.pageCount}
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= data.pageCount} aria-label="Next page" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
}
