import { desc, isNull } from "drizzle-orm";
import { db } from "@/db";
import { inboxItems } from "@/db/schema";
import { PageHeader } from "@/components/layout/page-header";
import { InboxAdd, InboxItem } from "./inbox-client";

export default async function InboxPage() {
  const items = await db.select().from(inboxItems).where(isNull(inboxItems.processedAt)).orderBy(desc(inboxItems.createdAt));

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Inbox"
        description="Capture tout ici sans réfléchir, puis trie : chaque élément devient une tâche, une note, un projet, ou disparaît."
      />
      <InboxAdd />
      {items.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed p-10 text-center">
          <p className="text-lg">Inbox vide ✨</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Astuce : <kbd className="rounded border px-1 font-mono text-xs">Ctrl K</kbd> puis{" "}
            <kbd className="rounded border px-1 font-mono text-xs">Ctrl ↵</kbd> pour capturer depuis n&apos;importe où.
          </p>
        </div>
      ) : (
        <ul className="mt-6 divide-y rounded-xl border">
          {items.map((item) => (
            <InboxItem key={item.id} id={item.id} content={item.content} createdAt={item.createdAt.toISOString()} />
          ))}
        </ul>
      )}
    </div>
  );
}
