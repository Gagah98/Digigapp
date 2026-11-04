"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { CalendarDays, Flag, Repeat } from "lucide-react";
import { toggleTask } from "@/app/actions";
import type { TaskView } from "@/db/queries";
import { formatRelative, todayISO } from "@/lib/dates";
import { priorityClass, priorityLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";

export function TaskRow({
  task,
  onOpen,
  showProject = true,
}: {
  task: TaskView;
  onOpen: (task: TaskView) => void;
  showProject?: boolean;
}) {
  const [, startTransition] = useTransition();
  const [done, setDone] = useOptimistic(task.status === "done");
  const date = task.scheduledDate ?? task.dueDate;
  const overdue = !done && date && date < todayISO();

  return (
    <li className="group flex items-start gap-3 px-3 py-2.5 hover:bg-muted/40">
      <button
        aria-label={done ? "Marquer comme à faire" : "Marquer comme terminée"}
        onClick={() =>
          startTransition(async () => {
            setDone(!done);
            await toggleTask(task.id, !done);
          })
        }
        className={cn(
          "mt-0.5 size-[18px] shrink-0 rounded-full border-2 transition-colors",
          done ? "border-primary bg-primary" : "border-muted-foreground/40 hover:border-primary",
          task.priority === "urgent" && !done && "border-red-500",
          task.priority === "high" && !done && "border-orange-500",
        )}
      >
        {done && (
          <svg viewBox="0 0 16 16" className="size-full p-0.5 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3.5 8.5l3 3 6-7" />
          </svg>
        )}
      </button>

      <button className="min-w-0 flex-1 text-left" onClick={() => onOpen(task)}>
        <span className={cn("block text-sm", done && "text-muted-foreground line-through")}>{task.title}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {date && (
            <span className={cn("inline-flex items-center gap-1", overdue && "font-medium text-red-600")}>
              <CalendarDays className="size-3" />
              {formatRelative(date)}
            </span>
          )}
          {task.recurrence && <Repeat className="size-3" aria-label="Récurrente" />}
          {(task.priority === "urgent" || task.priority === "high") && (
            <span className={cn("inline-flex items-center gap-1 rounded border px-1", priorityClass[task.priority])}>
              <Flag className="size-3" />
              {priorityLabel[task.priority]}
            </span>
          )}
          {task.tags.map((t) => (
            <span key={t} className="text-sky-700 dark:text-sky-400">#{t}</span>
          ))}
          {task.notes && <span className="max-w-[40ch] truncate">{task.notes}</span>}
        </span>
      </button>

      {showProject && task.projectTitle && task.projectId && (
        <Link
          href={`/projects/${task.projectId}`}
          className="mt-0.5 hidden max-w-[30%] shrink-0 truncate text-xs text-muted-foreground hover:underline sm:block"
        >
          {task.projectTitle}
        </Link>
      )}
    </li>
  );
}
