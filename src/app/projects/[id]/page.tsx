import Link from "next/link";
import { notFound } from "next/navigation";
import { KanbanSquare, List } from "lucide-react";
import { getBacklinks, getNotes, getProject, getProjectTasks } from "@/db/queries";
import { ProjectHeader } from "@/components/projects/project-header";
import { TaskList, QuickAdd } from "@/components/tasks/task-list";
import { Kanban } from "@/components/tasks/kanban";
import { NoteList } from "@/components/notes/note-list";
import { NewNoteButton } from "@/components/notes/new-note";
import { cn } from "@/lib/utils";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { id } = await params;
  const { view } = await searchParams;
  const row = await getProject(id);
  if (!row) notFound();

  const [tasks, notes, backlinks] = await Promise.all([getProjectTasks(id), getNotes({ projectId: id }), getBacklinks("project", id)]);
  const open = tasks.filter((t) => t.status !== "done");
  const done = tasks.filter((t) => t.status === "done");
  const kanban = view === "kanban";

  return (
    <div className="max-w-5xl">
      <div className="mb-3 text-sm text-muted-foreground">
        <Link href="/projects" className="hover:underline">Projets</Link>
        {row.areaName && <> · {row.areaName}</>}
      </div>
      <ProjectHeader project={row.project} />

      <section className="mb-12">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Tâches <span className="tabular-nums opacity-60">{done.length}/{tasks.length}</span>
          </h2>
          <div className="flex rounded-lg border p-0.5 text-sm">
            <Link
              href={`/projects/${id}`}
              className={cn("flex items-center gap-1.5 rounded-md px-2 py-1", !kanban && "bg-muted font-medium")}
            >
              <List className="size-4" /> Liste
            </Link>
            <Link
              href={`/projects/${id}?view=kanban`}
              className={cn("flex items-center gap-1.5 rounded-md px-2 py-1", kanban && "bg-muted font-medium")}
            >
              <KanbanSquare className="size-4" /> Kanban
            </Link>
          </div>
        </div>
        {kanban ? (
          <div className="space-y-4">
            <QuickAdd defaults={{ projectId: id }} placeholder="Ajouter une tâche…" />
            <Kanban tasks={tasks} />
          </div>
        ) : (
          <TaskList
            showProject={false}
            addDefaults={{ projectId: id }}
            sections={[
              { tasks: open, emptyText: "Aucune tâche ouverte." },
              { title: "Terminées", tasks: done, tone: "muted" },
            ]}
          />
        )}
      </section>

      <section className="mb-12">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Notes</h2>
          <NewNoteButton projectId={id} areaId={row.project.areaId ?? undefined} variant="outline" />
        </div>
        <NoteList notes={notes} showProject={false} empty="Aucune note : brief, accès, comptes rendus…" />
      </section>

      {backlinks.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Mentionné dans</h2>
          <ul className="flex flex-wrap gap-2">
            {backlinks.map((b) => (
              <li key={b.id}>
                <Link href={`/notes/${b.id}`} className="rounded-full border px-3 py-1 text-sm hover:bg-muted">
                  {b.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
