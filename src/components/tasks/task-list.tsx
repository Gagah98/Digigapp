"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { createTaskFromText } from "@/app/actions";
import type { TaskView } from "@/db/queries";
import { parseCapture } from "@/lib/quick-parse";
import { formatRelative } from "@/lib/dates";
import { priorityLabel } from "@/lib/labels";
import { TaskRow } from "./task-row";
import { TaskDialog } from "./task-dialog";

export type TaskSection = { title?: string; tasks: TaskView[]; tone?: "danger" | "muted"; emptyText?: string };

/** Liste de tâches en sections, avec ajout rapide et fenêtre d'édition. */
export function TaskList({
  sections,
  addDefaults,
  showProject = true,
  addPlaceholder = "Ajouter une tâche…  (ex. Appeler Marc demain !haute #client)",
}: {
  sections: TaskSection[];
  addDefaults?: { projectId?: string | null; areaId?: string | null; scheduledDate?: string | null } | false;
  showProject?: boolean;
  addPlaceholder?: string;
}) {
  const [open, setOpen] = useState<TaskView | null>(null);
  const params = useSearchParams();

  // Ouvre automatiquement une tâche passée dans l'URL (?task=…), ex. depuis la recherche
  const wanted = params.get("task");
  useEffect(() => {
    if (!wanted) return;
    const t = sections.flatMap((s) => s.tasks).find((x) => x.id === wanted);
    if (t) setOpen(t);
  }, [wanted, sections]);

  return (
    <div className="space-y-6">
      {addDefaults !== false && <QuickAdd defaults={addDefaults ?? {}} placeholder={addPlaceholder} />}
      {sections.map((s, i) =>
        s.tasks.length === 0 && !s.emptyText ? null : (
          <section key={i}>
            {s.title && (
              <h2
                className={`mb-2 text-xs font-medium uppercase tracking-wider ${
                  s.tone === "danger" ? "text-red-600" : "text-muted-foreground"
                }`}
              >
                {s.title} <span className="tabular-nums opacity-60">{s.tasks.length || ""}</span>
              </h2>
            )}
            {s.tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">{s.emptyText}</p>
            ) : (
              <ul className={`divide-y rounded-xl border ${s.tone === "muted" ? "opacity-70" : ""}`}>
                {s.tasks.map((t) => (
                  <TaskRow key={t.id} task={t} onOpen={setOpen} showProject={showProject} />
                ))}
              </ul>
            )}
          </section>
        ),
      )}
      <TaskDialog task={open} onClose={() => setOpen(null)} />
    </div>
  );
}

export function QuickAdd({
  defaults,
  placeholder,
}: {
  defaults: { projectId?: string | null; areaId?: string | null; scheduledDate?: string | null };
  placeholder: string;
}) {
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = text.trim() ? parseCapture(text) : null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        const value = text;
        setText("");
        startTransition(async () => {
          await createTaskFromText(value, defaults);
          inputRef.current?.focus();
        });
      }}
    >
      <div className="flex items-center gap-2 rounded-xl border px-3 focus-within:ring-3 focus-within:ring-ring/50">
        <Plus className="size-4 text-muted-foreground" />
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          disabled={pending}
          className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {preview && (preview.date || preview.priority || preview.tags.length > 0 || preview.projectHint) && (
        <p className="mt-1.5 flex flex-wrap gap-2 px-1 text-xs text-muted-foreground">
          {preview.date && <span>📅 {formatRelative(preview.date)}</span>}
          {preview.priority && <span>🚩 {priorityLabel[preview.priority]}</span>}
          {preview.tags.map((t) => <span key={t}>#{t}</span>)}
          {preview.projectHint && <span>📁 {preview.projectHint}</span>}
        </p>
      )}
    </form>
  );
}
