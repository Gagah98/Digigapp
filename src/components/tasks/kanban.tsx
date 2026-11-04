"use client";

import { useOptimistic, useState, useTransition } from "react";
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CalendarDays } from "lucide-react";
import { updateTask } from "@/app/actions";
import type { TaskView } from "@/db/queries";
import { formatRelative } from "@/lib/dates";
import { priorityClass, priorityLabel, TASK_STATUSES, taskStatusLabel, type TaskStatus } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { TaskDialog } from "./task-dialog";

/** Tableau Kanban des tâches par statut (glisser-déposer). */
export function Kanban({ tasks }: { tasks: TaskView[] }) {
  const [open, setOpen] = useState<TaskView | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [optimistic, move] = useOptimistic(tasks, (state, { id, status }: { id: string; status: TaskStatus }) =>
    state.map((t) => (t.id === id ? { ...t, status } : t)),
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const id = String(e.active.id);
    const status = e.over?.id as TaskStatus | undefined;
    const task = tasks.find((t) => t.id === id);
    if (!status || !task || task.status === status) return;
    startTransition(async () => {
      move({ id, status });
      await updateTask(id, { status });
    });
  };

  const active = optimistic.find((t) => t.id === activeId);

  return (
    <>
      <DndContext sensors={sensors} onDragStart={(e) => setActiveId(String(e.active.id))} onDragEnd={onDragEnd}>
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:px-0">
          {TASK_STATUSES.map((status) => (
            <Column key={status} status={status} tasks={optimistic.filter((t) => t.status === status)} onOpen={setOpen} />
          ))}
        </div>
        <DragOverlay>{active ? <Card task={active} dragging /> : null}</DragOverlay>
      </DndContext>
      <TaskDialog task={open} onClose={() => setOpen(null)} />
    </>
  );
}

function Column({ status, tasks, onOpen }: { status: TaskStatus; tasks: TaskView[]; onOpen: (t: TaskView) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-[75vw] shrink-0 snap-start flex-col rounded-xl bg-muted/50 p-2 transition-colors sm:w-64 md:w-auto",
        isOver && "bg-muted ring-2 ring-ring/40",
      )}
    >
      <p className="px-1.5 pb-2 pt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {taskStatusLabel[status]} <span className="tabular-nums opacity-60">{tasks.length}</span>
      </p>
      <div className="flex min-h-24 flex-col gap-2">
        {tasks.map((t) => (
          <Draggable key={t.id} task={t} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function Draggable({ task, onOpen }: { task: TaskView; onOpen: (t: TaskView) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} onClick={() => onOpen(task)} className={cn(isDragging && "opacity-30")}>
      <Card task={task} />
    </div>
  );
}

function Card({ task, dragging }: { task: TaskView; dragging?: boolean }) {
  const date = task.scheduledDate ?? task.dueDate;
  return (
    <div
      className={cn(
        "cursor-grab rounded-lg border bg-card p-2.5 text-sm shadow-xs active:cursor-grabbing",
        dragging && "rotate-2 shadow-lg",
        task.status === "done" && "text-muted-foreground line-through",
      )}
    >
      <p>{task.title}</p>
      {(date || task.priority === "urgent" || task.priority === "high" || task.tags.length > 0) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {date && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3" />
              {formatRelative(date)}
            </span>
          )}
          {(task.priority === "urgent" || task.priority === "high") && (
            <span className={cn("rounded border px-1", priorityClass[task.priority])}>{priorityLabel[task.priority]}</span>
          )}
          {task.tags.map((t) => (
            <span key={t} className="text-sky-700 dark:text-sky-400">#{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}
