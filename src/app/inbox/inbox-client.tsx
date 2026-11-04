"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, FileText, FolderPlus, Inbox, X } from "lucide-react";
import { addToInbox, processInboxItem } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function InboxAdd() {
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const value = text;
        setText("");
        startTransition(() => addToInbox(value));
      }}
      className="flex items-center gap-2 rounded-xl border px-3 focus-within:ring-3 focus-within:ring-ring/50"
    >
      <Inbox className="size-4 text-muted-foreground" />
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={pending}
        placeholder="Une idée, un truc à ne pas oublier…"
        className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        autoFocus
      />
    </form>
  );
}

export function InboxItem({ id, content, createdAt }: { id: string; content: string; createdAt: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const process = (as: "task" | "note" | "project" | "discard") =>
    startTransition(async () => {
      const createdId = await processInboxItem(id, as);
      if (as === "note" && createdId) router.push(`/notes/${createdId}`);
      if (as === "project" && createdId) router.push(`/projects/${createdId}`);
    });

  return (
    <li className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center ${pending ? "opacity-50" : ""}`}>
      <div className="min-w-0 flex-1">
        <p className="text-sm">{content}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(createdAt).toLocaleString("fr-CH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button size="sm" variant="outline" disabled={pending} onClick={() => process("task")}>
          <CheckSquare /> Tâche
        </Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => process("note")}>
          <FileText /> Note
        </Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => process("project")}>
          <FolderPlus /> Projet
        </Button>
        <Button size="icon-sm" variant="ghost" disabled={pending} onClick={() => process("discard")} aria-label="Supprimer">
          <X />
        </Button>
      </div>
    </li>
  );
}
