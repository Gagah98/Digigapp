"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createNote } from "@/app/actions";
import { Button } from "@/components/ui/button";
import type { NoteType } from "@/lib/labels";

export function NewNoteButton({
  type = "note",
  projectId,
  areaId,
  label = "Nouvelle note",
  variant = "default",
}: {
  type?: NoteType;
  projectId?: string;
  areaId?: string;
  label?: string;
  variant?: "default" | "outline";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant={variant}
      size={variant === "outline" ? "sm" : "default"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const id = await createNote({ type, projectId, areaId });
          router.push(`/notes/${id}`);
        })
      }
    >
      <Plus /> {label}
    </Button>
  );
}
