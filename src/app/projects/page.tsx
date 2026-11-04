import { getProjects } from "@/db/queries";
import { PageHeader } from "@/components/layout/page-header";
import { NewProjectButton } from "@/components/projects/new-project";
import { ProjectCard } from "@/components/projects/project-card";
import { projectStatusLabel, type ProjectStatus } from "@/lib/labels";

const GROUPS: ProjectStatus[] = ["active", "on_hold", "idea", "done", "cancelled"];

export default async function ProjectsPage() {
  const rows = await getProjects();

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="Projets"
        description="Un projet = un résultat précis avec une échéance. Une fois terminé, archive-le."
        actions={<NewProjectButton />}
      />
      {rows.length === 0 && <p className="text-sm text-muted-foreground">Aucun projet pour l&apos;instant.</p>}
      <div className="space-y-10">
        {GROUPS.map((status) => {
          const group = rows.filter((r) => r.project.status === status);
          if (!group.length) return null;
          return (
            <section key={status}>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {projectStatusLabel[status]} <span className="opacity-60">{group.length}</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.map((r) => (
                  <ProjectCard key={r.project.id} row={r} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
