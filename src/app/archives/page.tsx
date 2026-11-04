import Link from "next/link";
import { getAreas, getNotes, getProjects } from "@/db/queries";
import { PageHeader } from "@/components/layout/page-header";
import { RestoreButton } from "./archives-client";

const fmt = (d: Date | null) => (d ? d.toLocaleDateString("fr-CH", { day: "numeric", month: "short", year: "numeric" }) : "");

export default async function ArchivesPage() {
  const [projects, areas, notes] = await Promise.all([
    getProjects({ archived: true }),
    getAreas({ archived: true }),
    getNotes({ archived: true }),
  ]);
  const sections = [
    {
      title: "Projets",
      type: "project" as const,
      items: projects.map((r) => ({ id: r.project.id, title: r.project.title, href: `/projects/${r.project.id}`, date: r.project.archivedAt })),
    },
    {
      title: "Aires",
      type: "area" as const,
      items: areas.map((r) => ({ id: r.area.id, title: r.area.name, href: `/areas/${r.area.id}`, date: r.area.archivedAt })),
    },
    {
      title: "Notes & ressources",
      type: "note" as const,
      items: notes.map((n) => ({ id: n.id, title: n.title, href: `/notes/${n.id}`, date: n.archivedAt })),
    },
  ];
  const empty = sections.every((s) => !s.items.length);

  return (
    <div className="max-w-3xl">
      <PageHeader title="Archives" description="Tout ce qui est inactif. Rien n'est perdu : tout reste cherchable et restaurable." />
      {empty && <p className="text-sm text-muted-foreground">Aucun élément archivé.</p>}
      <div className="space-y-10">
        {sections.map((s) =>
          s.items.length ? (
            <section key={s.type}>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {s.title} <span className="opacity-60">{s.items.length}</span>
              </h2>
              <ul className="divide-y rounded-xl border">
                {s.items.map((i) => (
                  <li key={i.id} className="flex items-center gap-3 px-4 py-2">
                    <Link href={i.href} className="min-w-0 flex-1 truncate text-sm hover:underline">{i.title}</Link>
                    <span className="text-xs text-muted-foreground">{fmt(i.date)}</span>
                    <RestoreButton type={s.type} id={i.id} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null,
        )}
      </div>
    </div>
  );
}
