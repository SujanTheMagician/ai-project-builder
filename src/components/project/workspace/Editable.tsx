"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { useWorkspace } from "./WorkspaceContext";
import { cn } from "@/lib/utils";

function EditorShell({
  initial,
  rows,
  hint,
  onCancel,
  onSave,
}: {
  initial: string;
  rows: number;
  hint?: string;
  onCancel: () => void;
  onSave: (text: string) => Promise<boolean>;
}) {
  const [text, setText] = useState(initial);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  const save = async () => {
    if (text.trim() === initial.trim()) return onCancel();
    setSaving(true);
    const ok = await onSave(text);
    setSaving(false);
    if (ok) onCancel();
  };

  return (
    <div>
      <textarea
        ref={ref}
        value={text}
        rows={rows}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
        }}
        className="w-full text-sm leading-relaxed px-3 py-2 border border-violet-300 dark:border-violet-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
      />
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[11px] text-gray-400">{hint ?? "Ctrl+Enter to save · Esc to cancel"}</span>
        <div className="flex gap-1">
          <button onClick={onCancel} className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-1 text-xs bg-violet-600 hover:bg-violet-700 text-white rounded-md px-2.5 py-1 disabled:opacity-60">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

function EditTrigger({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-opacity"
    >
      <Pencil className="w-3.5 h-3.5" />
    </button>
  );
}

/** A paragraph that turns into a textarea when its pencil is clicked. */
export function EditableText({ value, field, label, className }: { value: string; field: string; label: string; className?: string }) {
  const { editable, saveFields } = useWorkspace();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <EditorShell initial={value} rows={Math.min(10, Math.max(3, Math.ceil(value.length / 90)))} onCancel={() => setEditing(false)} onSave={(text) => saveFields({ [field]: text.trim() }, `Edited ${label.toLowerCase()}`)} />;
  }
  return (
    <div className="group flex items-start gap-2">
      <p className={cn("flex-1 text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap", className)}>{value}</p>
      {editable && <EditTrigger onClick={() => setEditing(true)} label={`Edit ${label}`} />}
    </div>
  );
}

/** A list of strings, edited as one item per line. */
export function EditableList({
  items,
  field,
  label,
  renderItem,
}: {
  items: string[];
  field: string;
  label: string;
  renderItem: (item: string, i: number) => React.ReactNode;
}) {
  const { editable, saveFields } = useWorkspace();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <EditorShell
        initial={items.join("\n")}
        rows={Math.min(14, items.length + 2)}
        hint="One item per line · Ctrl+Enter to save"
        onCancel={() => setEditing(false)}
        onSave={(text) => {
          const next = text.split("\n").map((l) => l.replace(/^\s*[-•*]\s*/, "").trim()).filter(Boolean);
          return saveFields({ [field]: next }, `Edited ${label.toLowerCase()}`);
        }}
      />
    );
  }
  return (
    <div className="group flex items-start gap-2">
      <ul className="flex-1 space-y-2">{items.map(renderItem)}</ul>
      {editable && <EditTrigger onClick={() => setEditing(true)} label={`Edit ${label}`} />}
    </div>
  );
}
