"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ensureOk } from "@/lib/stream";
import type { GeneratedBlueprint, SectionKey } from "@/types";

type Workspace = {
  projectId: string;
  projectName: string;
  /** False on the public share page: hides every edit control. */
  editable: boolean;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  /** Saves a manual edit of some blueprint fields as a new version. */
  saveFields: (patch: Partial<GeneratedBlueprint>, note?: string) => Promise<boolean>;
  /** Regenerates a section with AI (3 credits). */
  refineSection: (section: SectionKey, instruction?: string) => Promise<boolean>;
  busySection: SectionKey | null;
};

const WorkspaceContext = createContext<Workspace | null>(null);

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}

export function WorkspaceProvider({
  projectId,
  projectName,
  editable = true,
  children,
}: {
  projectId: string;
  projectName: string;
  editable?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [chatOpen, setChatOpen] = useState(false);
  const [busySection, setBusySection] = useState<SectionKey | null>(null);

  const saveFields = useCallback(
    async (patch: Partial<GeneratedBlueprint>, note?: string) => {
      try {
        const res = await fetch(`/api/projects/${projectId}/blueprint`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patch, note }),
        });
        await ensureOk(res, "Couldn't save your edit");
        const { version } = await res.json();
        toast.success(`Saved as version ${version}`);
        router.refresh();
        return true;
      } catch (err) {
        toast.error((err as Error).message);
        return false;
      }
    },
    [projectId, router]
  );

  const refineSection = useCallback(
    async (section: SectionKey, instruction?: string) => {
      setBusySection(section);
      try {
        const res = await fetch(`/api/projects/${projectId}/sections`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ section, instruction: instruction?.trim() || undefined }),
        });
        await ensureOk(res, "Couldn't regenerate this section");
        const { version } = await res.json();
        toast.success(`Section rewritten — version ${version}`);
        router.refresh();
        return true;
      } catch (err) {
        toast.error((err as Error).message);
        return false;
      } finally {
        setBusySection(null);
      }
    },
    [projectId, router]
  );

  const value = useMemo(
    () => ({ projectId, projectName, editable, chatOpen, setChatOpen, saveFields, refineSection, busySection }),
    [projectId, projectName, editable, chatOpen, saveFields, refineSection, busySection]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
