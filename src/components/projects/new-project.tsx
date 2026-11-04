"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createProject } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, NativeSelect } from "@/components/form";
import { useOptions } from "@/components/options-provider";

export function NewProjectButton({ areaId }: { areaId?: string }) {
  const { areas } = useOptions();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [area, setArea] = useState(areaId ?? "");
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> Nouveau projet
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau projet</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim()) return;
              startTransition(async () => {
                const id = await createProject({ title, areaId: area || null });
                setOpen(false);
                setTitle("");
                router.push(`/projects/${id}`);
              });
            }}
          >
            <Field label="Titre">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Site web — Boulangerie Dupont" autoFocus />
            </Field>
            <Field label="Aire">
              <NativeSelect value={area} onChange={(e) => setArea(e.target.value)}>
                <option value="">— Aucune —</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </NativeSelect>
            </Field>
            <DialogFooter>
              <Button type="submit" disabled={pending || !title.trim()}>Créer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
