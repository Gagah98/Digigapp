"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Plus } from "lucide-react";
import { createArea, setAreaArchived, updateArea } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function NewArea() {
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const v = name;
        setName("");
        startTransition(() => createArea(v));
      }}
      className="flex items-center gap-2 rounded-xl border border-dashed px-3"
    >
      <Plus className="size-4 text-muted-foreground" />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={pending}
        placeholder="Nouvelle aire (ex. Administratif, Famille…)"
        className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </form>
  );
}

export function AreaTitle({ id, name, archived }: { id: string; name: string; archived: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(name);
  const [, startTransition] = useTransition();
  return (
    <div className="flex items-start gap-3">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => value.trim() && value !== name && startTransition(() => updateArea(id, { name: value.trim() }))}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        className="min-w-0 flex-1 bg-transparent text-2xl font-semibold tracking-tight outline-none md:text-3xl"
        aria-label="Nom de l'aire"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          startTransition(async () => {
            await setAreaArchived(id, !archived);
            if (!archived) router.push("/areas");
          })
        }
      >
        {archived ? <><ArchiveRestore /> Restaurer</> : <><Archive /> Archiver</>}
      </Button>
    </div>
  );
}
