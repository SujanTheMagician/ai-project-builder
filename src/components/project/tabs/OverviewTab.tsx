"use client";

import { CheckCircle, ShieldCheck } from "lucide-react";
import { Section } from "@/components/project/workspace/Section";
import { EditableList, EditableText } from "@/components/project/workspace/Editable";
import type { GeneratedBlueprint } from "@/types";

export default function OverviewTab({ blueprint }: { blueprint: GeneratedBlueprint }) {
  return (
    <div>
      <Section title="Executive summary" section="overview">
        <EditableText value={blueprint.summary} field="summary" label="Summary" />
      </Section>

      <div className="grid md:grid-cols-2 gap-4">
        <Section title="Problem statement">
          <EditableText value={blueprint.problem} field="problem" label="Problem statement" />
        </Section>
        <Section title="Target users">
          <EditableText value={blueprint.targetUsers} field="targetUsers" label="Target users" />
        </Section>
      </div>

      <Section title={`Functional requirements (${blueprint.requirements.length})`}>
        <EditableList
          items={blueprint.requirements}
          field="requirements"
          label="Functional requirements"
          renderItem={(r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
              {r}
            </li>
          )}
        />
      </Section>

      <Section title="Non-functional requirements">
        <EditableList
          items={blueprint.nonFunctional}
          field="nonFunctional"
          label="Non-functional requirements"
          renderItem={(r, i) => {
            const [head, ...rest] = r.split(":");
            return (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                <ShieldCheck className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                {rest.length ? (
                  <span>
                    <span className="font-medium text-gray-900 dark:text-white">{head}:</span>
                    {rest.join(":")}
                  </span>
                ) : (
                  r
                )}
              </li>
            );
          }}
        />
      </Section>

      {blueprint.userStories.length > 0 && (
        <Section title="User stories">
          <EditableList
            items={blueprint.userStories}
            field="userStories"
            label="User stories"
            renderItem={(s, i) => (
              <li key={i} className="text-sm text-gray-600 dark:text-gray-300 pl-3 border-l-2 border-violet-200 dark:border-violet-800">
                {s}
              </li>
            )}
          />
        </Section>
      )}
    </div>
  );
}
