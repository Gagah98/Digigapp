"use server";
/**
 * Server Actions : toutes les écritures de l'application.
 * Chaque action revalide la mise en page complète (petite app, mono-utilisateur).
 */
import { revalidatePath } from "next/cache";
import { and, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { areas, inboxItems, itemTags, links, notes, projects, tags, tasks } from "@/db/schema";
import { parseCapture } from "@/lib/quick-parse";
import { todayISO } from "@/lib/dates";
import { nextOccurrence } from "@/lib/recurrence";
import type { Priority, ProjectStatus, TaskStatus, NoteType } from "@/lib/labels";

const refresh = () => revalidatePath("/", "layout");
const now = () => new Date();

// ---------- Tags ----------
async function setTaskTags(taskId: string, names: string[]) {
  if (!names.length) return;
  const unique = [...new Set(names)];
  await db.insert(tags).values(unique.map((name) => ({ name }))).onConflictDoNothing();
  const rows = await db.select().from(tags).where(inArray(tags.name, unique));
  await db
    .insert(itemTags)
    .values(rows.map((t) => ({ tagId: t.id, itemType: "task" as const, itemId: taskId })))
    .onConflictDoNothing();
}

async function findProjectByHint(hint: string | null) {
  if (!hint) return null;
  const [p] = await db
    .select({ id: projects.id, areaId: projects.areaId })
    .from(projects)
    .where(and(isNull(projects.archivedAt), ilike(projects.title, `%${hint}%`)))
    .orderBy(desc(projects.updatedAt))
    .limit(1);
  return p ?? null;
}

// ---------- Inbox ----------
export async function addToInbox(content: string) {
  if (!content.trim()) return;
  await db.insert(inboxItems).values({ content: content.trim() });
  refresh();
}

export async function processInboxItem(id: string, as: "task" | "note" | "project" | "discard") {
  const [item] = await db.select().from(inboxItems).where(eq(inboxItems.id, id));
  if (!item) return null;
  let createdId: string | null = null;
  if (as === "task") createdId = (await createTaskFromText(item.content)).id;
  if (as === "note") createdId = await createNote({ title: item.content.slice(0, 120) });
  if (as === "project") createdId = await createProject({ title: item.content.slice(0, 120) });
  await db.update(inboxItems).set({ processedAt: now() }).where(eq(inboxItems.id, id));
  refresh();
  return createdId;
}

// ---------- Tâches ----------
export async function createTaskFromText(
  text: string,
  defaults: { projectId?: string | null; areaId?: string | null; scheduledDate?: string | null } = {},
) {
  const p = parseCapture(text);
  const project = defaults.projectId ? null : await findProjectByHint(p.projectHint);
  const [task] = await db
    .insert(tasks)
    .values({
      title: p.title || text.trim(),
      priority: p.priority ?? "medium",
      scheduledDate: p.date ?? defaults.scheduledDate ?? null,
      projectId: defaults.projectId ?? project?.id ?? null,
      areaId: defaults.areaId ?? project?.areaId ?? null,
    })
    .returning();
  await setTaskTags(task.id, p.tags);
  refresh();
  return task;
}

export type TaskPatch = Partial<{
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  scheduledDate: string | null;
  projectId: string | null;
  areaId: string | null;
  estimateMinutes: number | null;
  recurrence: string | null;
  kanbanOrder: number;
}>;

export async function updateTask(id: string, patch: TaskPatch) {
  const values: Record<string, unknown> = { ...patch };
  if (patch.status) values.completedAt = patch.status === "done" ? now() : null;
  if (patch.projectId && patch.areaId === undefined) {
    const [p] = await db.select({ areaId: projects.areaId }).from(projects).where(eq(projects.id, patch.projectId));
    if (p) values.areaId = p.areaId;
  }
  const [before] = await db.select().from(tasks).where(eq(tasks.id, id));
  await db.update(tasks).set(values).where(eq(tasks.id, id));

  // Tâche récurrente terminée → créer l'occurrence suivante
  if (patch.status === "done" && before && before.status !== "done" && before.recurrence) {
    const rule = before.recurrence;
    const shift = (d: string | null) => (d ? nextOccurrence(rule, d) : null);
    const hasDate = before.scheduledDate || before.dueDate;
    await db.insert(tasks).values({
      title: before.title,
      notes: before.notes,
      priority: before.priority,
      projectId: before.projectId,
      areaId: before.areaId,
      estimateMinutes: before.estimateMinutes,
      recurrence: rule,
      scheduledDate: hasDate ? shift(before.scheduledDate) : nextOccurrence(rule, todayISO()),
      dueDate: shift(before.dueDate),
    });
  }
  refresh();
}

export async function toggleTask(id: string, done: boolean) {
  await updateTask(id, { status: done ? "done" : "todo" });
}

export async function deleteTask(id: string) {
  await db.delete(itemTags).where(and(eq(itemTags.itemType, "task"), eq(itemTags.itemId, id)));
  await db.delete(tasks).where(eq(tasks.id, id));
  refresh();
}

// ---------- Projets ----------
export async function createProject(data: { title: string; areaId?: string | null; status?: ProjectStatus }) {
  const [p] = await db
    .insert(projects)
    .values({ title: data.title.trim() || "Nouveau projet", areaId: data.areaId ?? null, status: data.status ?? "active" })
    .returning({ id: projects.id });
  refresh();
  return p.id;
}

export async function updateProject(
  id: string,
  patch: Partial<{
    title: string;
    description: string | null;
    status: ProjectStatus;
    priority: Priority;
    areaId: string | null;
    startDate: string | null;
    dueDate: string | null;
  }>,
) {
  await db.update(projects).set(patch).where(eq(projects.id, id));
  refresh();
}

export async function setProjectArchived(id: string, archived: boolean) {
  await db.update(projects).set({ archivedAt: archived ? now() : null }).where(eq(projects.id, id));
  refresh();
}

// ---------- Aires ----------
export async function createArea(name: string) {
  if (!name.trim()) return;
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${areas.sortOrder}), -1)` }).from(areas);
  await db.insert(areas).values({ name: name.trim(), sortOrder: Number(max) + 1 });
  refresh();
}

export async function updateArea(id: string, patch: Partial<{ name: string }>) {
  await db.update(areas).set(patch).where(eq(areas.id, id));
  refresh();
}

export async function setAreaArchived(id: string, archived: boolean) {
  await db.update(areas).set({ archivedAt: archived ? now() : null }).where(eq(areas.id, id));
  refresh();
}

// ---------- Notes ----------
export async function createNote(
  data: { title?: string; type?: NoteType; projectId?: string | null; areaId?: string | null } = {},
) {
  const [n] = await db
    .insert(notes)
    .values({
      title: data.title?.trim() || "Sans titre",
      type: data.type ?? "note",
      projectId: data.projectId ?? null,
      areaId: data.areaId ?? null,
    })
    .returning({ id: notes.id });
  refresh();
  return n.id;
}

export type LinkRef = { type: "note" | "project" | "task" | "area"; id: string };

export async function updateNote(
  id: string,
  patch: Partial<{
    title: string;
    type: NoteType;
    projectId: string | null;
    areaId: string | null;
    content: unknown;
    contentText: string;
  }>,
  linkRefs?: LinkRef[],
) {
  await db.update(notes).set(patch).where(eq(notes.id, id));
  if (linkRefs) {
    // Resynchronise les liens sortants de la note (mentions @)
    await db.delete(links).where(and(eq(links.fromType, "note"), eq(links.fromId, id)));
    const unique = [...new Map(linkRefs.map((l) => [`${l.type}:${l.id}`, l])).values()];
    if (unique.length) {
      await db
        .insert(links)
        .values(unique.map((l) => ({ fromType: "note" as const, fromId: id, toType: l.type, toId: l.id })))
        .onConflictDoNothing();
    }
  }
  // Pas de revalidation globale à chaque frappe : seulement si les métadonnées changent
  if (patch.title !== undefined || patch.type || patch.projectId !== undefined || patch.areaId !== undefined) refresh();
}

export async function setNoteArchived(id: string, archived: boolean) {
  await db.update(notes).set({ archivedAt: archived ? now() : null }).where(eq(notes.id, id));
  refresh();
}

// ---------- Recherche globale ----------
export type SearchResult = {
  type: "project" | "task" | "note" | "area";
  id: string;
  href: string;
  title: string;
  subtitle?: string;
};

export async function search(q: string): Promise<SearchResult[]> {
  const term = q.trim();
  if (term.length < 2) return [];
  const like = `%${term}%`;
  const [p, t, n, a] = await Promise.all([
    db.select({ id: projects.id, title: projects.title, archivedAt: projects.archivedAt }).from(projects)
      .where(ilike(projects.title, like)).limit(6),
    db.select({ id: tasks.id, title: tasks.title, projectId: tasks.projectId, project: projects.title, status: tasks.status })
      .from(tasks).leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(or(ilike(tasks.title, like), ilike(tasks.notes, like)))
      .orderBy(desc(tasks.updatedAt)).limit(8),
    db.select({ id: notes.id, title: notes.title, type: notes.type }).from(notes)
      .where(or(ilike(notes.title, like), ilike(notes.contentText, like)))
      .orderBy(desc(notes.updatedAt)).limit(8),
    db.select({ id: areas.id, name: areas.name }).from(areas).where(ilike(areas.name, like)).limit(4),
  ]);
  return [
    ...a.map((x) => ({ type: "area" as const, id: x.id, href: `/areas/${x.id}`, title: x.name })),
    ...p.map((x) => ({
      type: "project" as const, id: x.id, href: `/projects/${x.id}`, title: x.title,
      subtitle: x.archivedAt ? "Archivé" : undefined,
    })),
    ...t.map((x) => ({
      type: "task" as const, id: x.id, href: x.projectId ? `/projects/${x.projectId}?task=${x.id}` : `/today?task=${x.id}`,
      title: x.title,
      subtitle: [x.project, x.status === "done" ? "terminée" : null].filter(Boolean).join(" · ") || undefined,
    })),
    ...n.map((x) => ({
      type: "note" as const, id: x.id, href: `/notes/${x.id}`, title: x.title,
      subtitle: x.type === "resource" ? "Ressource" : undefined,
    })),
  ];
}
