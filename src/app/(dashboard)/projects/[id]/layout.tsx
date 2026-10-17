import type { Metadata } from "next";
import { loadProject } from "@/lib/project-loader";
import { WorkspaceProvider } from "@/components/project/workspace/WorkspaceContext";
import ProjectHeader from "@/components/project/workspace/ProjectHeader";
import ProjectTabs from "@/components/project/workspace/ProjectTabs";
import EmptyBlueprint from "@/components/project/workspace/EmptyBlueprint";
import ProjectChatDrawer from "@/components/project/workspace/ProjectChatDrawer";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; children: React.ReactNode };

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { project } = await loadProject((await params).id);
  return { title: `${project.name} — ProjectAI` };
}

/** Shared shell for every tab. It stays mounted while tabs change, so the chat drawer keeps its state. */
export default async function ProjectLayout({ params, children }: Props) {
  const { id } = await params;
  const { project, blueprint, version, versionDate, tags, allTags } = await loadProject(id);

  return (
    <WorkspaceProvider projectId={project.id} projectName={project.name}>
      <div className="max-w-5xl">
        <ProjectHeader
          project={{ id: project.id, name: project.name, category: project.category, description: project.description, status: project.status }}
          blueprint={blueprint}
          version={version}
          versionDate={versionDate?.toISOString() ?? null}
          tags={tags}
          allTags={allTags}
        />
        {blueprint ? (
          <>
            <ProjectTabs projectId={project.id} />
            {children}
          </>
        ) : (
          <EmptyBlueprint projectId={project.id} />
        )}
      </div>
      {blueprint && <ProjectChatDrawer />}
    </WorkspaceProvider>
  );
}
