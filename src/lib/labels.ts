// Libellés français et couleurs des enums de la base.

export const PRIORITIES = ["urgent", "high", "medium", "low"] as const;
export type Priority = (typeof PRIORITIES)[number];
export const priorityLabel: Record<Priority, string> = {
  urgent: "Urgente", high: "Haute", medium: "Moyenne", low: "Basse",
};
export const priorityClass: Record<Priority, string> = {
  urgent: "text-red-600 border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900",
  high: "text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-950/40 dark:border-orange-900",
  medium: "text-muted-foreground",
  low: "text-muted-foreground opacity-70",
};

export const TASK_STATUSES = ["todo", "in_progress", "waiting", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number] | "cancelled";
export const taskStatusLabel: Record<TaskStatus, string> = {
  todo: "À faire", in_progress: "En cours", waiting: "En attente", done: "Terminé", cancelled: "Annulé",
};

export const PROJECT_STATUSES = ["active", "idea", "on_hold", "done", "cancelled"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export const projectStatusLabel: Record<ProjectStatus, string> = {
  active: "Actif", idea: "Idée", on_hold: "En pause", done: "Terminé", cancelled: "Annulé",
};

export const NOTE_TYPES = ["note", "resource", "meeting", "journal"] as const;
export type NoteType = (typeof NOTE_TYPES)[number];
export const noteTypeLabel: Record<NoteType, string> = {
  note: "Note", resource: "Ressource", meeting: "Réunion", journal: "Journal",
};
