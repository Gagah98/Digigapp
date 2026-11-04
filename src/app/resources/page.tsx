import { getNotes } from "@/db/queries";
import { PageHeader } from "@/components/layout/page-header";
import { NoteList } from "@/components/notes/note-list";
import { NewNoteButton } from "@/components/notes/new-note";

export default async function ResourcesPage() {
  const notes = await getNotes({ type: "resource" });
  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Ressources"
        description="Ce qui peut servir un jour : procédures, snippets, inspirations, checklists, documentation."
        actions={<NewNoteButton type="resource" label="Nouvelle ressource" />}
      />
      <NoteList notes={notes} empty="Aucune ressource. Astuce : toute note peut devenir une ressource via son type." />
    </div>
  );
}
