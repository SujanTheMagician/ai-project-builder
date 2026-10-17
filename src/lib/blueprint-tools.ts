import type { DatabaseTable, GeneratedBlueprint } from "@/types";

// ─── Foreign keys ────────────────────────────────────────────────────────────

const candidates = (base: string) => {
  const b = base.toLowerCase();
  const out = [b, `${b}s`, `${b}es`];
  if (b.endsWith("y")) out.push(`${b.slice(0, -1)}ies`);
  if (b.endsWith("s")) out.push(b.slice(0, -1));
  return out;
};

/** Guesses which table an FK column points at: org_id / orgId → orgs, category_id → categories. */
export function fkTarget(column: string, tables: DatabaseTable[], self: string): string | null {
  const base = column.replace(/(_id|Id|_uuid)$/, "");
  if (base === column) return null;
  // Strip a role prefix as a fallback: created_by_user_id → user, parent_category_id → category.
  const tries = [base, base.split(/_|(?=[A-Z])/).pop() ?? base];
  for (const t of tries) {
    for (const name of candidates(t)) {
      const hit = tables.find((tb) => tb.name.toLowerCase() === name);
      if (hit && (hit.name !== self || base.startsWith("parent"))) return hit.name;
    }
  }
  return null;
}

export type Relation = { from: string; column: string; to: string };

export function relations(tables: DatabaseTable[]): Relation[] {
  return tables.flatMap((t) =>
    t.cols
      .filter((c) => c.k === "FK")
      .map((c) => ({ from: t.name, column: c.n, to: fkTarget(c.n, tables, t.name) }))
      .filter((r): r is Relation => r.to !== null)
  );
}

// ─── SQL DDL ─────────────────────────────────────────────────────────────────

/** Orders tables so referenced tables are created first (falls back to input order on cycles). */
function topoSort(tables: DatabaseTable[], rels: Relation[]) {
  const done = new Set<string>();
  const out: DatabaseTable[] = [];
  const visit = (t: DatabaseTable, stack: Set<string>) => {
    if (done.has(t.name) || stack.has(t.name)) return;
    stack.add(t.name);
    for (const r of rels) if (r.from === t.name && r.to !== t.name) {
      const dep = tables.find((x) => x.name === r.to);
      if (dep) visit(dep, stack);
    }
    done.add(t.name);
    out.push(t);
  };
  tables.forEach((t) => visit(t, new Set()));
  return out;
}

const ident = (s: string) => (/^[a-z_][a-z0-9_]*$/.test(s) ? s : `"${s.replace(/"/g, '""')}"`);

/** PostgreSQL CREATE TABLE statements for the blueprint's schema. */
export function toSqlDdl(tables: DatabaseTable[]): string {
  const rels = relations(tables);
  return topoSort(tables, rels)
    .map((t) => {
      const lines = t.cols.map((c) => {
        let line = `  ${ident(c.n)} ${c.t || "text"}`;
        if (c.k === "PK") line += " PRIMARY KEY";
        if (c.k === "FK") {
          const target = rels.find((r) => r.from === t.name && r.column === c.n)?.to;
          line += target ? ` REFERENCES ${ident(target)}(id)` : " -- FK: target table not found";
        }
        return line;
      });
      return `CREATE TABLE ${ident(t.name)} (\n${lines.join(",\n")}\n);`;
    })
    .join("\n\n");
}

// ─── Amounts ─────────────────────────────────────────────────────────────────

/** "$15,000", "₹2.5L", "$1.2k/month" → 15000, 250000, 1200. Returns null when there's no number. */
export function parseAmount(amount: string): number | null {
  const m = amount.replace(/,/g, "").match(/(\d+(?:\.\d+)?)\s*(k|m|l|lakh|cr|crore)?/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const unit = m[2]?.toLowerCase();
  const mult = unit === "k" ? 1e3 : unit === "m" ? 1e6 : unit === "l" || unit === "lakh" ? 1e5 : unit === "cr" || unit === "crore" ? 1e7 : 1;
  return n * mult;
}

// ─── Version diff ────────────────────────────────────────────────────────────

const LABELS: Partial<Record<keyof GeneratedBlueprint, (item: never) => string>> = {
  tech: (t: { layer: string; stack: string }) => `${t.layer}: ${t.stack}`,
  dbTables: (t: DatabaseTable) => `${t.name} (${t.cols.map((c) => c.n).join(", ")})`,
  apiEndpoints: (e: { method: string; path: string }) => `${e.method} ${e.path}`,
  roadmap: (p: { n: number; title: string; dur: string }) => `${p.n}. ${p.title} — ${p.dur}`,
  sprints: (s: { title: string; tasks: string[] }) => `${s.title}: ${s.tasks.join("; ")}`,
  costRows: (r: { label: string; amount: string }) => `${r.label}: ${r.amount}`,
};

export type FieldDiff = { field: keyof GeneratedBlueprint; before?: string; after?: string; added: string[]; removed: string[] };

/** Field-by-field comparison: text fields show before/after, lists show added and removed items. */
export function diffBlueprints(a: GeneratedBlueprint, b: GeneratedBlueprint): FieldDiff[] {
  const fields = Object.keys(b) as (keyof GeneratedBlueprint)[];
  const diffs: FieldDiff[] = [];
  for (const field of fields) {
    const x = a[field];
    const y = b[field];
    if (JSON.stringify(x) === JSON.stringify(y)) continue;
    if (Array.isArray(x) && Array.isArray(y)) {
      const label = (LABELS[field] ?? ((i: unknown) => String(i))) as (i: unknown) => string;
      const xs = x.map(label);
      const ys = y.map(label);
      diffs.push({ field, added: ys.filter((i) => !xs.includes(i)), removed: xs.filter((i) => !ys.includes(i)) });
    } else {
      diffs.push({ field, before: String(x ?? ""), after: String(y ?? ""), added: [], removed: [] });
    }
  }
  return diffs;
}
