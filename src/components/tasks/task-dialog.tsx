"use client";

import { useEffect, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteTask, updateTask, type TaskPatch } from "@/app/actions";
import type { TaskView } from "@/db/queries";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateInput, Field, NativeSelect } from "@/components/form";
import { useOptions } from "@/components/options-provider";
import { PRIORITIES, priorityLabel, TASK_STATUSES, taskStatusLabel } from "@/lib/labels";
import { RECURRENCE_OPTIONS } from "@/lib/recurrence";

export function TaskDialog({ task, onClose }: { task: TaskView | null; onClose: () => void }) {
  const { projects, areas } = useOptions();
  const [form, setForm] = useState<TaskView | null>(task);
  const [pending, startTransition] = useTransition();

  useEffect(() => setForm(task), [task]);
  if (!form) return null;

  const set = <K extends keyof TaskView>(key: K, value: TaskView[K]) => setForm({ ...form, [key]: value });

  const save = () =>
    startTransition(async () => {
      const patch: TaskPatch = {
        title: form.title.trim() || task!.title,
        notes: form.notes?.trim() || null,
        status: form.status === "cancelled" ? "cancelled" : form.status,
        priority: form.priority,
        scheduledDate: form.scheduledDate || null,
        dueDate: form.dueDate || null,
        projectId: form.projectId || null,
        areaId: form.areaId || null,
        estimateMinutes: form.estimateMinutes || null,
        recurrence: form.recurrence || null,
      };
      await updateTask(form.id, patch);
      onClose();
    });

  const remove = () =>
    startTransition(async () => {
      if (!confirm("Supprimer définitivement cette tâche ?")) return;
      await deleteTask(form.id);
      onClose();
    });

  return (
    <Dialog open={!!task} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="sr-only">Modifier la tâche</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className="h-10 border-none px-0 text-base font-medium shadow-none focus-visible:ring-0"
            aria-label="Titre"
          />
          <Textarea
            value={form.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Notes, détails, liens…"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Statut">
              <NativeSelect value={form.status} onChange={(e) => set("status", e.target.value as TaskView["status"])}>
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>{taskStatusLabel[s]}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Priorité">
              <NativeSelect value={form.priority} onChange={(e) => set("priority", e.target.value as TaskView["priority"])}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{priorityLabel[p]}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Prévue le">
              <DateInput value={form.scheduledDate ?? ""} onChange={(e) => set("scheduledDate", e.target.value || null)} />
            </Field>
            <Field label="Échéance">
              <DateInput value={form.dueDate ?? ""} onChange={(e) => set("dueDate", e.target.value || null)} />
            </Field>
            <Field label="Projet">
              <NativeSelect value={form.projectId ?? ""} onChange={(e) => set("projectId", e.target.value || null)}>
                <option value="">— Aucun —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Aire">
              <NativeSelect value={form.areaId ?? ""} onChange={(e) => set("areaId", e.target.value || null)}>
                <option value="">— Aucune —</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Estimation (min)">
              <Input
                type="number"
                min={0}
                step={5}
                value={form.estimateMinutes ?? ""}
                onChange={(e) => set("estimateMinutes", e.target.value ? Number(e.target.value) : null)}
              />
            </Field>
            <Field label="Répétition">
              <NativeSelect value={form.recurrence ?? ""} onChange={(e) => set("recurrence", e.target.value || null)}>
                {RECURRENCE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <DialogFooter className="flex-row items-center justify-between sm:justify-between">
            <Button type="button" variant="ghost" size="sm" onClick={remove} disabled={pending} className="text-red-600">
              <Trash2 /> Supprimer
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
              <Button type="submit" disabled={pending}>Enregistrer</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
