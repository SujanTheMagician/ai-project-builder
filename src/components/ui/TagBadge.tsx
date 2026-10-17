import { cn, TAG_COLOR_CLASSES } from "@/lib/utils";

export default function TagBadge({ name, color, className }: { name: string; color: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center text-[11px] font-medium rounded-full px-2 py-0.5", TAG_COLOR_CLASSES[color] ?? TAG_COLOR_CLASSES.gray, className)}>
      {name}
    </span>
  );
}
