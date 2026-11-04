// Requêtes de lecture réutilisables (côté serveur uniquement).
import "server-only";
import { and, asc, desc, eq, gt, inArray, isNotNull, isNull, lt, lte, ne, notInArray, sql } from "drizzle-orm";
import { db } from ".";
import { areas, itemTags, links, notes, projects, tags, tasks } from "./schema";
import { addDays, todayISO } from "@/lib/dates";

export type TaskView = typeof tasks.$inferSelect & {
  projectTitle: string | null;
  tags: string[];
};

const taskSelect = {
  task: tasks,
  projectTitle: projects.title,
};

const openStatus = notInArray(tasks.status, ["done", "cancelled"]);
const taskOrder = [desc(tasks.priority), asc(tasks.kanbanOrder), asc(tasks.createdAt)];

async function withTags(rows: { task: typeof tasks.$inferSelect; projectTitle: string | null }[]): Promise<TaskView[]> {
  const ids = rows.map((r) => r.task.id);
  const tagRows = ids.length
    ? await db.select({ itemId: itemTags.itemId, name: tags.name }).from(itemTags)
        .innerJoin(tags, eq(itemTags.tagId, tags.id))
        .where(and(eq(itemTags.itemType, "task"), inArray(itemTags.itemId, ids)))
    : [];
  return rows.map((r) => ({
    ...r.task,
    projectTitle: r.projectTitle,
    tags: tagRows.filter((t) => t.itemId === r.task.id).map((t) => t.name),
  }));
}

function taskQuery() {
  return db.select(taskSelect).from(tasks).leftJoin(projects, eq(tasks.projectId, projects.id));
}

// ---------- Tâches ----------
export async function getTodayView() {
  const today = todayISO();
  const in7 = addDays(today, 7);
  const dateExpr = sql`coalesce(${tasks.scheduledDate}, ${tasks.dueDate})`;
  const [overdue, todayTasks, upcoming, unscheduled, doneToday] = await Promise.all([
    taskQuery().where(and(openStatus, lt(dateExpr, today))).orderBy(asc(dateExpr), ...taskOrder),
    taskQuery().where(and(openStatus, eq(dateExpr, today))).orderBy(...taskOrder),
    taskQuery().where(and(openStatus, gt(dateExpr, today), lte(dateExpr, in7))).orderBy(asc(dateExpr), ...taskOrder),
    taskQuery().where(and(openStatus, isNull(tasks.scheduledDate), isNull(tasks.dueDate), isNull(tasks.parentId)))
      .orderBy(...taskOrder).limit(30),
    taskQuery().where(and(eq(tasks.status, "done"), sql`${tasks.completedAt}::date = current_date`))
      .orderBy(desc(tasks.completedAt)),
  ]);
  return {
    overdue: await withTags(overdue),
    today: await withTags(todayTasks),
    upcoming: await withTags(upcoming),
    unscheduled: await withTags(unscheduled),
    doneToday: await withTags(doneToday),
  };
}

export async function getProjectTasks(projectId: string) {
  const rows = await taskQuery().where(and(eq(tasks.projectId, projectId), ne(tasks.status, "cancelled")))
    .orderBy(...taskOrder);
  return withTags(rows);
}

export async function getAreaLooseTasks(areaId: string) {
  const rows = await taskQuery().where(and(eq(tasks.areaId, areaId), isNull(tasks.projectId), openStatus))
    .orderBy(...taskOrder);
  return withTags(rows);
}

// ---------- Projets ----------
export async function getProjects({ archived = false } = {}) {
  const counts = db.select({
    projectId: tasks.projectId,
    total: sql<number>`count(*)::int`.as("total"),
    done: sql<number>`count(*) filter (where ${tasks.status} = 'done')::int`.as("done"),
  }).from(tasks).groupBy(tasks.projectId).as("counts");

  return db.select({
    project: projects,
    areaName: areas.name,
    total: sql<number>`coalesce(${counts.total}, 0)`,
    done: sql<number>`coalesce(${counts.done}, 0)`,
  })
    .from(projects)
    .leftJoin(areas, eq(projects.areaId, areas.id))
    .leftJoin(counts, eq(counts.projectId, projects.id))
    .where(archived ? isNotNull(projects.archivedAt) : isNull(projects.archivedAt))
    .orderBy(desc(projects.priority), asc(projects.dueDate), desc(projects.updatedAt));
}

export async function getProject(id: string) {
  const [row] = await db.select({ project: projects, areaName: areas.name })
    .from(projects).leftJoin(areas, eq(projects.areaId, areas.id)).where(eq(projects.id, id));
  return row ?? null;
}

// ---------- Aires ----------
export async function getAreas({ archived = false } = {}) {
  return db.select({
    area: areas,
    projectCount: sql<number>`(select count(*)::int from ${projects} p where p.area_id = ${areas.id} and p.archived_at is null)`,
    noteCount: sql<number>`(select count(*)::int from ${notes} n where n.area_id = ${areas.id} and n.archived_at is null)`,
  }).from(areas)
    .where(archived ? isNotNull(areas.archivedAt) : isNull(areas.archivedAt))
    .orderBy(asc(areas.sortOrder), asc(areas.name));
}

// ---------- Notes ----------
const noteListSelect = {
  id: notes.id, title: notes.title, type: notes.type, updatedAt: notes.updatedAt,
  archivedAt: notes.archivedAt, projectId: notes.projectId, projectTitle: projects.title,
  excerpt: sql<string>`left(coalesce(${notes.contentText}, ''), 160)`,
};

export async function getNotes(filter: {
  type?: "note" | "resource" | "meeting" | "journal"; projectId?: string; areaId?: string; archived?: boolean;
} = {}) {
  const conds = [filter.archived ? isNotNull(notes.archivedAt) : isNull(notes.archivedAt)];
  if (filter.type) conds.push(eq(notes.type, filter.type));
  if (filter.projectId) conds.push(eq(notes.projectId, filter.projectId));
  if (filter.areaId) conds.push(eq(notes.areaId, filter.areaId));
  return db.select(noteListSelect).from(notes).leftJoin(projects, eq(notes.projectId, projects.id))
    .where(and(...conds)).orderBy(desc(notes.updatedAt));
}

/** Éléments qui pointent vers cet élément (rétroliens). */
export async function getBacklinks(toType: "note" | "project" | "task" | "area", toId: string) {
  return db.select({ id: notes.id, title: notes.title, type: notes.type })
    .from(links).innerJoin(notes, eq(links.fromId, notes.id))
    .where(and(eq(links.toType, toType), eq(links.toId, toId), eq(links.fromType, "note")))
    .orderBy(desc(notes.updatedAt));
}

// ---------- Options pour les sélecteurs (projets & aires) ----------
export async function getOptions() {
  const [p, a] = await Promise.all([
    db.select({ id: projects.id, title: projects.title, areaId: projects.areaId }).from(projects)
      .where(and(isNull(projects.archivedAt), notInArray(projects.status, ["done", "cancelled"])))
      .orderBy(asc(projects.title)),
    db.select({ id: areas.id, name: areas.name }).from(areas).where(isNull(areas.archivedAt))
      .orderBy(asc(areas.sortOrder)),
  ]);
  return { projects: p, areas: a };
}
export type Options = Awaited<ReturnType<typeof getOptions>>;
