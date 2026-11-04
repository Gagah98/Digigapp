"use client";

import dynamic from "next/dynamic";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore } from "lucide-react";
import { setNoteArchived, updateNote } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/form";
import { useOptions } from "@/components/options-provider";
import { NOTE_TYPES, noteTypeLabel, type NoteType } from "@/lib/labels";

// L'éditeur ne fonctionne que dans le navigateur
const NoteEditor = dynamic(() => import("./editor"), {
  ssr: false,
  loading: () => <div className="min-h-[50vh] animate-pulse rounded-lg bg-muted/40" />,
});

type Note = {
  id: string; title: string; type: NoteType; projectId: string | null; areaId: string | null;
  content: unknown; archivedAt: Date | null;
};

export function NoteView({ note }: { note: Note }) {
  const { projects, areas } = useOptions();
  const router = useRouter();
  const [title, setTitle] = useState(note.title === "Sans titre" ? "" : note.title);
  const [, startTransition] = useTransition();
  const save = (patch: Parameters<typeof updateNote>[1]) => startTransition(() => updateNote(note.id, patch));

  return (
    <article className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
        <NativeSelect className="h-8 w-auto" defaultValue={note.type} onChange={(e) => save({ type: e.target.value as NoteType })}>
          {NOTE_TYPES.map((t) => (
            <option key={t} value={t}>{noteTypeLabel[t]}</option>
          ))}
        </NativeSelect>
        <NativeSelect
          className="h-8 w-auto max-w-[45%]"
          defaultValue={note.projectId ?? ""}
          onChange={(e) => save({ projectId: e.target.value || null })}
        >
          <option value="">Sans projet</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>📁 {p.title}</option>
          ))}
        </NativeSelect>
        <NativeSelect className="h-8 w-auto" defaultValue={note.areaId ?? ""} onChange={(e) => save({ areaId: e.target.value || null })}>
          <option value="">Sans aire</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </NativeSelect>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() =>
            startTransition(async () => {
              await setNoteArchived(note.id, !note.archivedAt);
              if (!note.archivedAt) router.back();
            })
          }
        >
          {note.archivedAt ? <><ArchiveRestore /> Restaurer</> : <><Archive /> Archiver</>}
        </Button>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => save({ title: title.trim() || "Sans titre" })}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        placeholder="Sans titre"
        autoFocus={!title}
        className="mb-10 w-full bg-transparent text-3xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/50 md:text-4xl"
      />
      <NoteEditor noteId={note.id} initialContent={note.content} />
    </article>
  );
}
