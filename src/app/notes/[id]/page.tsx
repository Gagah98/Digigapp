import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notes } from "@/db/schema";
import { getBacklinks } from "@/db/queries";
import { NoteView } from "@/components/notes/note-meta";

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [note] = await db.select().from(notes).where(eq(notes.id, id));
  if (!note) notFound();
  const backlinks = await getBacklinks("note", id);

  return (
    <div className="pb-16">
      <NoteView key={note.id} note={note} />
      {backlinks.length > 0 && (
        <aside className="mx-auto mt-16 max-w-3xl border-t pt-6">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Rétroliens</h2>
          <ul className="flex flex-wrap gap-2">
            {backlinks.map((b) => (
              <li key={b.id}>
                <Link href={`/notes/${b.id}`} className="rounded-full border px-3 py-1 text-sm hover:bg-muted">
                  📝 {b.title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
