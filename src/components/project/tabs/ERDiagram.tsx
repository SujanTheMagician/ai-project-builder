"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { KeyRound, Link2 } from "lucide-react";
import { relations } from "@/lib/blueprint-tools";
import { cn } from "@/lib/utils";
import type { DatabaseTable } from "@/types";

type Edge = { id: string; d: string; from: string; to: string };

/**
 * Entity-relationship diagram. Tables are laid out by CSS grid; after layout we
 * measure each FK row and target header and draw SVG curves between them.
 * A ResizeObserver redraws the lines whenever the container changes size.
 */
export default function ERDiagram({ tables }: { tables: DatabaseTable[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [focus, setFocus] = useState<string | null>(null);
  const rels = useMemo(() => relations(tables), [tables]);

  const measure = useCallback(() => {
    const root = containerRef.current;
    if (!root) return;
    const box = root.getBoundingClientRect();
    const rect = (sel: string) => root.querySelector<HTMLElement>(sel)?.getBoundingClientRect();

    const next: Edge[] = [];
    for (const r of rels) {
      const src = rect(`[data-col="${CSS.escape(`${r.from}.${r.column}`)}"]`);
      const dst = rect(`[data-table="${CSS.escape(r.to)}"]`);
      if (!src || !dst) continue;

      const y1 = src.top + src.height / 2 - box.top;
      const y2 = dst.top + 18 - box.top;
      const dx = dst.left + dst.width / 2 - (src.left + src.width / 2);
      let d: string;
      if (Math.abs(dx) < src.width / 2) {
        // Same column (or a self-reference): loop out through the gap on the right and back in.
        const x1 = src.right - box.left;
        const x2 = dst.right - box.left;
        d = `M ${x1} ${y1} C ${x1 + 44} ${y1}, ${x2 + 44} ${y2}, ${x2} ${y2}`;
      } else {
        // Leave from the side facing the target, enter the target header's facing side.
        const rightward = dx > 0;
        const x1 = (rightward ? src.right : src.left) - box.left;
        const x2 = (rightward ? dst.left : dst.right) - box.left;
        const bend = Math.max(40, Math.abs(x2 - x1) / 2) * (rightward ? 1 : -1);
        d = `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`;
      }
      next.push({ id: `${r.from}.${r.column}`, d, from: r.from, to: r.to });
    }
    setEdges(next);
    setSize({ w: root.scrollWidth, h: root.scrollHeight });
  }, [rels]);

  // useLayoutEffect measures after DOM layout but before paint, so lines never flash in the wrong place.
  useLayoutEffect(() => {
    measure();
    const observer = new ResizeObserver(() => measure());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [measure]);

  const related = (name: string) => !focus || focus === name || rels.some((r) => (r.from === focus && r.to === name) || (r.to === focus && r.from === name));

  return (
    <div ref={containerRef} className="relative" onMouseLeave={() => setFocus(null)}>
      <svg className="absolute inset-0 pointer-events-none z-10" width={size.w} height={size.h} aria-hidden>
        <defs>
          <marker id="er-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L8,4 L0,8 z" className="fill-violet-500" />
          </marker>
        </defs>
        {edges.map((e) => {
          const active = !focus || e.from === focus || e.to === focus;
          return (
            <path
              key={e.id}
              d={e.d}
              fill="none"
              strokeWidth={active && focus ? 2.5 : 1.5}
              markerEnd="url(#er-arrow)"
              className={cn("stroke-violet-500 transition-opacity", active ? "opacity-90" : "opacity-10")}
            />
          );
        })}
      </svg>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-16 gap-y-8 py-2 pl-2 pr-12">
        {tables.map((t) => (
          <div
            key={t.name}
            data-table={t.name}
            onMouseEnter={() => setFocus(t.name)}
            onFocus={() => setFocus(t.name)}
            tabIndex={0}
            className={cn(
              "relative z-20 rounded-lg border bg-white dark:bg-gray-950 overflow-hidden transition-all outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
              focus === t.name ? "border-violet-400 shadow-md" : "border-gray-200 dark:border-gray-700",
              !related(t.name) && "opacity-40"
            )}
          >
            <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-mono font-medium text-gray-900 dark:text-white">{t.name}</span>
            </div>
            <ul className="text-xs font-mono">
              {t.cols.map((c) => (
                <li key={c.n} data-col={`${t.name}.${c.n}`} className="flex items-center gap-2 px-3 py-1 border-b border-gray-50 dark:border-gray-800/60 last:border-0">
                  <span className="w-3.5 flex-shrink-0">
                    {c.k === "PK" && <KeyRound className="w-3 h-3 text-amber-500" aria-label="Primary key" />}
                    {c.k === "FK" && <Link2 className="w-3 h-3 text-violet-500" aria-label="Foreign key" />}
                  </span>
                  <span className="text-gray-900 dark:text-gray-100 truncate">{c.n}</span>
                  <span className="ml-auto text-gray-400 truncate">{c.t}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
