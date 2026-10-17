import { loadProject } from "@/lib/project-loader";
import DatabaseTab from "@/components/project/tabs/DatabaseTab";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { blueprint } = await loadProject((await params).id);
  // The layout renders the empty state when there is no blueprint yet.
  return blueprint ? <DatabaseTab blueprint={blueprint} /> : null;
}
