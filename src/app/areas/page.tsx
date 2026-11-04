import Link from "next/link";
import { Layers } from "lucide-react";
import { getAreas } from "@/db/queries";
import { PageHeader } from "@/components/layout/page-header";
import { NewArea } from "./areas-client";

export default async function AreasPage() {
  const rows = await getAreas();
  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Aires"
        description="Tes responsabilités permanentes, sans date de fin. Chaque projet, note ou tâche peut y être rattaché."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ area, projectCount, noteCount }) => (
          <Link key={area.id} href={`/areas/${area.id}`} className="rounded-xl border p-4 transition-colors hover:bg-muted/40">
            <div className="flex items-center gap-2 font-medium">
              <Layers className="size-4 text-muted-foreground" /> {area.name}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {projectCount} projet{projectCount > 1 ? "s" : ""} · {noteCount} note{noteCount > 1 ? "s" : ""}
            </p>
          </Link>
        ))}
      </div>
      <div className="mt-4 max-w-md">
        <NewArea />
      </div>
    </div>
  );
}
