import Link from "next/link";
import { and, count, eq, isNull, lte, ne } from "drizzle-orm";
import { db } from "@/db";
import { areas, inboxItems, projects, tasks } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const today = new Date().toISOString().slice(0, 10);

  const [[inbox], [activeProjects], [openTasks], todayTasks, areaList] = await Promise.all([
    db.select({ n: count() }).from(inboxItems).where(isNull(inboxItems.processedAt)),
    db.select({ n: count() }).from(projects).where(and(eq(projects.status, "active"), isNull(projects.archivedAt))),
    db.select({ n: count() }).from(tasks).where(ne(tasks.status, "done")),
    db.select({ id: tasks.id, title: tasks.title, project: projects.title })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(ne(tasks.status, "done"), lte(tasks.scheduledDate, today))),
    db.select().from(areas).where(isNull(areas.archivedAt)).orderBy(areas.sortOrder),
  ]);

  const stats = [
    { label: "Inbox à trier", value: inbox.n, href: "/inbox" },
    { label: "Projets actifs", value: activeProjects.n, href: "/projects" },
    { label: "Tâches ouvertes", value: openTasks.n, href: "/today" },
  ];

  return (
    <div className="max-w-4xl space-y-10">
      <header>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("fr-CH", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Bonjour 👋</h1>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-xl border p-4 transition-colors hover:bg-muted/50">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{s.value}</p>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">Aujourd&apos;hui</h2>
        {todayTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Rien de prévu. Profite !</p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {todayTasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <span>{t.title}</span>
                {t.project && <span className="truncate text-xs text-muted-foreground">{t.project}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">Mes aires</h2>
        <div className="flex flex-wrap gap-2">
          {areaList.map((a) => (
            <span key={a.id} className="rounded-full border px-3 py-1 text-sm">{a.name}</span>
          ))}
        </div>
      </section>
    </div>
  );
}
