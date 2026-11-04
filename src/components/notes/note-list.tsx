import Link from "next/link";
import { FileText, BookOpen, Users, NotebookPen } from "lucide-react";
import type { getNotes } from "@/db/queries";
import { noteTypeLabel } from "@/lib/labels";

const icons = { note: FileText, resource: BookOpen, meeting: Users, journal: NotebookPen };

export function NoteList({
  notes,
  empty = "Aucune note.",
  showProject = true,
}: {
  notes: Awaited<ReturnType<typeof getNotes>>;
  empty?: string;
  showProject?: boolean;
}) {
  if (!notes.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="divide-y rounded-xl border">
      {notes.map((n) => {
        const Icon = icons[n.type];
        return (
          <li key={n.id}>
            <Link href={`/notes/${n.id}`} className="flex gap-3 px-4 py-3 hover:bg-muted/40">
              <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{n.title}</p>
                {n.excerpt && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{n.excerpt}</p>}
              </div>
              <div className="shrink-0 text-right text-xs text-muted-foreground">
                <p>{n.updatedAt.toLocaleDateString("fr-CH", { day: "numeric", month: "short" })}</p>
                {showProject && n.projectTitle ? (
                  <p className="max-w-[18ch] truncate">{n.projectTitle}</p>
                ) : (
                  n.type !== "note" && <p>{noteTypeLabel[n.type]}</p>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
