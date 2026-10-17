"use client";

import { Section } from "@/components/project/workspace/Section";
import { EditableText } from "@/components/project/workspace/Editable";
import CopyButton from "@/components/ui/CopyButton";
import type { GeneratedBlueprint } from "@/types";

export default function ArchitectureTab({ blueprint }: { blueprint: GeneratedBlueprint }) {
  return (
    <div>
      <Section title="Technology stack" section="architecture">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {blueprint.tech.map((t) => (
            <div key={t.layer} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{t.layer}</p>
              <p className="text-sm text-gray-900 dark:text-white">{t.stack}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Request flow">
        <div className="flex flex-wrap items-center gap-2 text-xs" aria-label="How a request travels through the stack">
          {blueprint.tech.map((t, i) => (
            <div key={t.layer} className="flex items-center gap-2">
              <span className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-950">
                <span className="block text-[10px] uppercase tracking-wide text-gray-400">{t.layer}</span>
                <span className="text-gray-800 dark:text-gray-200">{t.stack.split(/[,(—-]/)[0].trim()}</span>
              </span>
              {i < blueprint.tech.length - 1 && <span className="text-gray-300 dark:text-gray-600">→</span>}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Folder structure" actions={<CopyButton text={blueprint.folderStructure} label="Copy folder tree" />}>
        <pre className="text-xs font-mono text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto leading-6">{blueprint.folderStructure}</pre>
      </Section>

      {blueprint.deploymentStrategy && (
        <Section title="Deployment strategy">
          <EditableText value={blueprint.deploymentStrategy} field="deploymentStrategy" label="Deployment strategy" />
        </Section>
      )}
    </div>
  );
}
