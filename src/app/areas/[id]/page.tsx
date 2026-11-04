import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { areas } from "@/db/schema";
import { getAreaLooseTasks, getNotes, getProjects } from "@/db/queries";
import { ProjectCard } from "@/components/projects/project-card";
import { NewProjectButton } from "@/components/projects/new-project";
import { TaskList } from "@/components/tasks/task-list";
import { NoteList } from "@/components/notes/note-list";
import { NewNoteButton } from "@/components/notes/new-note";
import { AreaTitle } from "../areas-client";

export default async function AreaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [area] = await db.select().from(areas).where(eq(areas.id, id));
  if (!area) notFound();

  const [projectRows, tasks, notes] = await Promise.all([getProjects(), getAreaLooseTasks(id), getNotes({ areaId: id })]);
  const areaProjects = projectRows.filter((r) => r.project.areaId === id);

  return (
    <div className="max-w-5xl space-y-12">
      <div>
        <div className="mb-3 text-sm text-muted-foreground">
          <Link href="/areas" className="hover:underline">Aires</Link>
        </div>
        <AreaTitle id={area.id} name={area.name} archived={!!area.archivedAt} />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Projets</h2>
          <NewProjectButton areaId={id} />
        </div>
        {areaProjects.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {areaProjects.map((r) => (
              <ProjectCard key={r.project.id} row={r} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun projet dans cette aire.</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Tâches hors projet</h2>
        <TaskList addDefaults={{ areaId: id }} addPlaceholder="Tâche récurrente ou ponctuelle de cette aire…" sections={[{ tasks }]} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Notes &amp; ressources</h2>
          <NewNoteButton areaId={id} variant="outline" />
        </div>
        <NoteList notes={notes} />
      </section>
    </div>
  );
}
