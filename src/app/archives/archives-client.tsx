"use client";

import { useTransition } from "react";
import { ArchiveRestore } from "lucide-react";
import { setAreaArchived, setNoteArchived, setProjectArchived } from "@/app/actions";
import { Button } from "@/components/ui/button";

const actions = { project: setProjectArchived, area: setAreaArchived, note: setNoteArchived };

export function RestoreButton({ type, id }: { type: keyof typeof actions; id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button size="sm" variant="ghost" disabled={pending} onClick={() => startTransition(() => actions[type](id, false))}>
      <ArchiveRestore /> Restaurer
    </Button>
  );
}
