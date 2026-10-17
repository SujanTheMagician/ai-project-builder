import { loadProject } from "@/lib/project-loader";
import ApiTab from "@/components/project/tabs/ApiTab";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { blueprint } = await loadProject((await params).id);
  // The layout renders the empty state when there is no blueprint yet.
  return blueprint ? <ApiTab blueprint={blueprint} /> : null;
}
