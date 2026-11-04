import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { formatRelative, todayISO } from "@/lib/dates";
import { priorityClass, priorityLabel, projectStatusLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { getProjects } from "@/db/queries";

type Row = Awaited<ReturnType<typeof getProjects>>[number];

export function ProjectCard({ row }: { row: Row }) {
  const { project: p, areaName, total, done } = row;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const late = p.dueDate && p.dueDate < todayISO() && p.status !== "done";

  return (
    <Link href={`/projects/${p.id}`} className="flex flex-col rounded-xl border p-4 transition-colors hover:bg-muted/40">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium leading-snug">{p.title}</p>
        {(p.priority === "urgent" || p.priority === "high") && (
          <span className={cn("shrink-0 rounded border px-1.5 text-xs", priorityClass[p.priority])}>{priorityLabel[p.priority]}</span>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {[areaName, p.status !== "active" ? projectStatusLabel[p.status] : null].filter(Boolean).join(" · ") || " "}
      </p>
      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="tabular-nums">{done}/{total} tâches</span>
          {p.dueDate && (
            <span className={cn("inline-flex items-center gap-1", late && "font-medium text-red-600")}>
              <CalendarDays className="size-3" /> {formatRelative(p.dueDate)}
            </span>
          )}
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </Link>
  );
}
