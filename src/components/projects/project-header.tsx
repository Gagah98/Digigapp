"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore } from "lucide-react";
import { setProjectArchived, updateProject } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { DateInput, Field, NativeSelect } from "@/components/form";
import { useOptions } from "@/components/options-provider";
import { PRIORITIES, priorityLabel, PROJECT_STATUSES, projectStatusLabel, type Priority, type ProjectStatus } from "@/lib/labels";

type Project = {
  id: string; title: string; description: string | null; status: ProjectStatus; priority: Priority;
  areaId: string | null; startDate: string | null; dueDate: string | null; archivedAt: Date | null;
};

/** En-tête éditable d'un projet : chaque champ s'enregistre dès qu'il change. */
export function ProjectHeader({ project }: { project: Project }) {
  const { areas } = useOptions();
  const router = useRouter();
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description ?? "");
  const [, startTransition] = useTransition();

  const save = (patch: Parameters<typeof updateProject>[1]) => startTransition(() => updateProject(project.id, patch));

  return (
    <header className="mb-8 space-y-4">
      <div className="flex items-start gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title.trim() && title !== project.title && save({ title: title.trim() })}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className="min-w-0 flex-1 bg-transparent text-2xl font-semibold tracking-tight outline-none md:text-3xl"
          aria-label="Titre du projet"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            startTransition(async () => {
              await setProjectArchived(project.id, !project.archivedAt);
              if (!project.archivedAt) router.push("/projects");
            })
          }
        >
          {project.archivedAt ? <><ArchiveRestore /> Restaurer</> : <><Archive /> Archiver</>}
        </Button>
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() => description !== (project.description ?? "") && save({ description: description.trim() || null })}
        placeholder="Objectif du projet, résultat attendu…"
        rows={1}
        className="field-sizing-content w-full resize-none bg-transparent text-sm text-muted-foreground outline-none placeholder:text-muted-foreground/60"
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Statut">
          <NativeSelect defaultValue={project.status} onChange={(e) => save({ status: e.target.value as ProjectStatus })}>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>{projectStatusLabel[s]}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Priorité">
          <NativeSelect defaultValue={project.priority} onChange={(e) => save({ priority: e.target.value as Priority })}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{priorityLabel[p]}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Aire">
          <NativeSelect defaultValue={project.areaId ?? ""} onChange={(e) => save({ areaId: e.target.value || null })}>
            <option value="">— Aucune —</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Échéance">
          <DateInput defaultValue={project.dueDate ?? ""} onChange={(e) => save({ dueDate: e.target.value || null })} />
        </Field>
      </div>
    </header>
  );
}
