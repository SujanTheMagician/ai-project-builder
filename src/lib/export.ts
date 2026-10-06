import type { GeneratedBlueprint } from "@/types";
import { toFileName } from "@/lib/utils";

type ExportProject = { name: string; category: string; description: string };

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const escapeHtml = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function exportMarkdown(project: ExportProject, b: GeneratedBlueprint) {
  const list = (items: string[]) => items.map((i) => `- ${i}`).join("\n");
  const md = `# ${project.name}

_${project.category}_ — ${project.description}

## Executive Summary
${b.summary}

## Problem Statement
${b.problem}

## Target Users
${b.targetUsers}

## Functional Requirements
${list(b.requirements)}

## Non-Functional Requirements
${list(b.nonFunctional)}

## User Stories
${list(b.userStories)}

## Technology Stack
${b.tech.map((t) => `- **${t.layer}**: ${t.stack}`).join("\n")}

## Folder Structure
\`\`\`
${b.folderStructure}
\`\`\`

## Database Schema
${b.dbTables
  .map(
    (t) =>
      `### ${t.name}\n\n| Column | Type | Key |\n|---|---|---|\n${t.cols.map((c) => `| ${c.n} | ${c.t} | ${c.k} |`).join("\n")}`
  )
  .join("\n\n")}

## API Endpoints
| Method | Path | Description |
|---|---|---|
${b.apiEndpoints.map((e) => `| ${e.method} | \`${e.path}\` | ${e.desc} |`).join("\n")}

## Roadmap
${b.roadmap.map((p) => `### Phase ${p.n}: ${p.title} (${p.dur})\n${list(p.tasks)}`).join("\n\n")}

## Sprint Plan
${b.sprints.map((s) => `### ${s.title}\n${list(s.tasks)}`).join("\n\n")}

## Cost Estimate
| Item | Amount |
|---|---|
${b.costRows.map((r) => `| ${r.label} | ${r.amount} |`).join("\n")}

## Deployment Strategy
${b.deploymentStrategy}
`;
  download(new Blob([md], { type: "text/markdown;charset=utf-8" }), `${toFileName(project.name)}.md`);
}

/** Opens a print-friendly page; the user picks "Save as PDF" in the print dialog. Returns false if pop-ups are blocked. */
export function exportPdf(project: ExportProject, b: GeneratedBlueprint): boolean {
  const e = escapeHtml;
  const ul = (items: string[]) => `<ul>${items.map((i) => `<li>${e(i)}</li>`).join("")}</ul>`;
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${e(project.name)} — Blueprint</title>
<style>
  body { font-family: -apple-system, "Segoe UI", Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #111; line-height: 1.55; }
  h1 { color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 8px; }
  h2 { color: #374151; margin-top: 32px; border-left: 4px solid #7c3aed; padding-left: 12px; page-break-after: avoid; }
  h3 { color: #4b5563; margin-bottom: 4px; }
  .badge { background: #ede9fe; color: #6d28d9; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
  .meta { color: #6b7280; font-size: 14px; margin-bottom: 32px; }
  ul { padding-left: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px; page-break-inside: avoid; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
  th { background: #f9fafb; }
  code, pre { font-family: Consolas, monospace; font-size: 12px; }
  pre { background: #f9fafb; padding: 12px; border-radius: 6px; white-space: pre-wrap; }
  .total td { font-weight: 700; color: #7c3aed; }
  @media print { body { padding: 0; } }
</style></head>
<body>
<span class="badge">${e(project.category)}</span>
<h1>${e(project.name)}</h1>
<p class="meta">${e(project.description)}</p>
<h2>Executive Summary</h2><p>${e(b.summary)}</p>
<h2>Problem Statement</h2><p>${e(b.problem)}</p>
<h2>Target Users</h2><p>${e(b.targetUsers)}</p>
<h2>Functional Requirements</h2>${ul(b.requirements)}
<h2>Non-Functional Requirements</h2>${ul(b.nonFunctional)}
<h2>User Stories</h2>${ul(b.userStories)}
<h2>Technology Stack</h2>
<table><tr><th>Layer</th><th>Stack</th></tr>${b.tech.map((t) => `<tr><td>${e(t.layer)}</td><td>${e(t.stack)}</td></tr>`).join("")}</table>
<h2>Folder Structure</h2><pre>${e(b.folderStructure)}</pre>
<h2>Database Schema</h2>
${b.dbTables.map((t) => `<h3><code>${e(t.name)}</code></h3><table><tr><th>Column</th><th>Type</th><th>Key</th></tr>${t.cols.map((c) => `<tr><td><code>${e(c.n)}</code></td><td>${e(c.t)}</td><td>${e(c.k)}</td></tr>`).join("")}</table>`).join("")}
<h2>API Endpoints</h2>
<table><tr><th>Method</th><th>Path</th><th>Description</th></tr>${b.apiEndpoints.map((a) => `<tr><td><b>${e(a.method)}</b></td><td><code>${e(a.path)}</code></td><td>${e(a.desc)}</td></tr>`).join("")}</table>
<h2>Development Roadmap</h2>
${b.roadmap.map((p) => `<h3>Phase ${e(p.n)}: ${e(p.title)} <small>(${e(p.dur)})</small></h3>${ul(p.tasks)}`).join("")}
<h2>Sprint Plan</h2>
${b.sprints.map((s) => `<h3>${e(s.title)}</h3>${ul(s.tasks)}`).join("")}
<h2>Cost Estimate</h2>
<table>${b.costRows.map((r, i) => `<tr class="${i === b.costRows.length - 1 ? "total" : ""}"><td>${e(r.label)}</td><td>${e(r.amount)}</td></tr>`).join("")}</table>
<h2>Deployment Strategy</h2><p>${e(b.deploymentStrategy)}</p>
<p style="margin-top:48px;color:#9ca3af;font-size:12px;text-align:center">Generated by ProjectAI · ${e(new Date().toLocaleDateString())}</p>
</body></html>`;

  // Write into a fresh about:blank window and never run scripts from AI output.
  const win = window.open("", "_blank");
  if (!win) return false;
  win.opener = null;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
  return true;
}

export async function exportDocx(project: ExportProject, b: GeneratedBlueprint) {
  const { Document, Packer, Paragraph, HeadingLevel, TextRun, Table, TableRow, TableCell, WidthType } = await import("docx");

  const h1 = (text: string) => new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 120 } });
  const h2 = (text: string) => new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 } });
  const p = (text: string) => new Paragraph({ children: [new TextRun(text)], spacing: { after: 120 } });
  const bullets = (items: string[]) => items.map((text) => new Paragraph({ text, bullet: { level: 0 } }));
  const table = (header: string[], rows: string[][]) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: header.map((h) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] })),
        }),
        ...rows.map((r) => new TableRow({ children: r.map((c) => new TableCell({ children: [new Paragraph(c)] })) })),
      ],
    });

  const doc = new Document({
    creator: "ProjectAI",
    title: `${project.name} — Blueprint`,
    sections: [
      {
        children: [
          new Paragraph({ text: project.name, heading: HeadingLevel.TITLE }),
          new Paragraph({ children: [new TextRun({ text: `${project.category} — ${project.description}`, italics: true })] }),
          h1("Executive Summary"), p(b.summary),
          h1("Problem Statement"), p(b.problem),
          h1("Target Users"), p(b.targetUsers),
          h1("Functional Requirements"), ...bullets(b.requirements),
          h1("Non-Functional Requirements"), ...bullets(b.nonFunctional),
          h1("User Stories"), ...bullets(b.userStories),
          h1("Technology Stack"), table(["Layer", "Stack"], b.tech.map((t) => [t.layer, t.stack])),
          h1("Folder Structure"),
          ...b.folderStructure.split("\n").map((line) => new Paragraph({ children: [new TextRun({ text: line, font: "Consolas", size: 18 })] })),
          h1("Database Schema"),
          ...b.dbTables.flatMap((t) => [h2(t.name), table(["Column", "Type", "Key"], t.cols.map((c) => [c.n, c.t, c.k]))]),
          h1("API Endpoints"), table(["Method", "Path", "Description"], b.apiEndpoints.map((e) => [e.method, e.path, e.desc])),
          h1("Development Roadmap"),
          ...b.roadmap.flatMap((ph) => [h2(`Phase ${ph.n}: ${ph.title} (${ph.dur})`), ...bullets(ph.tasks)]),
          h1("Sprint Plan"), ...b.sprints.flatMap((s) => [h2(s.title), ...bullets(s.tasks)]),
          h1("Cost Estimate"), table(["Item", "Amount"], b.costRows.map((r) => [r.label, r.amount])),
          h1("Deployment Strategy"), p(b.deploymentStrategy),
        ],
      },
    ],
  });

  download(await Packer.toBlob(doc), `${toFileName(project.name)}.docx`);
}
