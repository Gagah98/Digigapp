/**
 * Schéma DiGiga App — v1 (cœur PARA)
 * Projets · Aires · Ressources (notes de type "resource") · Archives (champ archivedAt)
 * Les modules CRM, agenda, objectifs et mails seront ajoutés dans les phases suivantes.
 */
import {
  pgTable, pgEnum, uuid, text, timestamp, integer, jsonb, date, primaryKey, index,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
    .$onUpdate(() => new Date()),
};

// ---------- Enums ----------
export const projectStatus = pgEnum("project_status", ["idea", "active", "on_hold", "done", "cancelled"]);
export const taskStatus = pgEnum("task_status", ["todo", "in_progress", "waiting", "done", "cancelled"]);
export const priority = pgEnum("priority", ["low", "medium", "high", "urgent"]);
export const noteType = pgEnum("note_type", ["note", "resource", "journal", "meeting"]);
export const itemType = pgEnum("item_type", ["area", "project", "task", "note"]);

// ---------- Aires (responsabilités permanentes) ----------
export const areas = pgTable("areas", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  icon: text("icon"),
  color: text("color"),
  sortOrder: integer("sort_order").default(0).notNull(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  ...timestamps,
});

// ---------- Projets (résultat + échéance) ----------
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  areaId: uuid("area_id").references(() => areas.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  status: projectStatus("status").default("active").notNull(),
  priority: priority("priority").default("medium").notNull(),
  startDate: date("start_date"),
  dueDate: date("due_date"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  ...timestamps,
}, (t) => [index("projects_area_idx").on(t.areaId)]);

// ---------- Tâches ----------
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  areaId: uuid("area_id").references(() => areas.id, { onDelete: "set null" }),
  parentId: uuid("parent_id"), // sous-tâches
  title: text("title").notNull(),
  notes: text("notes"),
  status: taskStatus("status").default("todo").notNull(),
  priority: priority("priority").default("medium").notNull(),
  dueDate: date("due_date"),          // échéance
  scheduledDate: date("scheduled_date"), // quand je prévois de la faire
  estimateMinutes: integer("estimate_minutes"),
  recurrence: text("recurrence"),     // règle RRULE (iCal), ex. "FREQ=WEEKLY;BYDAY=MO"
  kanbanOrder: integer("kanban_order").default(0).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  ...timestamps,
}, (t) => [
  index("tasks_project_idx").on(t.projectId),
  index("tasks_scheduled_idx").on(t.scheduledDate),
]);

// ---------- Notes & ressources ----------
export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  areaId: uuid("area_id").references(() => areas.id, { onDelete: "set null" }),
  title: text("title").notNull().default("Sans titre"),
  type: noteType("type").default("note").notNull(),
  content: jsonb("content"),        // blocs de l'éditeur (BlockNote)
  contentText: text("content_text"), // texte brut pour la recherche
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  ...timestamps,
});

// ---------- Inbox (capture rapide, à trier) ----------
export const inboxItems = pgTable("inbox_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  source: text("source").default("web").notNull(), // web | mobile | mail | ia
  processedAt: timestamp("processed_at", { withTimezone: true }),
  ...timestamps,
});

// ---------- Tags ----------
export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  color: text("color"),
});

export const itemTags = pgTable("item_tags", {
  tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  itemType: itemType("item_type").notNull(),
  itemId: uuid("item_id").notNull(),
}, (t) => [primaryKey({ columns: [t.tagId, t.itemType, t.itemId] })]);

// ---------- Liens universels (liens & rétroliens) ----------
export const links = pgTable("links", {
  fromType: itemType("from_type").notNull(),
  fromId: uuid("from_id").notNull(),
  toType: itemType("to_type").notNull(),
  toId: uuid("to_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.fromType, t.fromId, t.toType, t.toId] }),
  index("links_to_idx").on(t.toType, t.toId),
]);
