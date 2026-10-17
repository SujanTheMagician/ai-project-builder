import { loadProject } from "@/lib/project-loader";
import CostTab from "@/components/project/tabs/CostTab";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { blueprint } = await loadProject((await params).id);
  // The layout renders the empty state when there is no blueprint yet.
  return blueprint ? <CostTab blueprint={blueprint} /> : null;
}
