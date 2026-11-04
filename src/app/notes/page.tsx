import { getNotes } from "@/db/queries";
import { PageHeader } from "@/components/layout/page-header";
import { NoteList } from "@/components/notes/note-list";
import { NewNoteButton } from "@/components/notes/new-note";

export default async function NotesPage() {
  const notes = await getNotes();
  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Notes"
        description="Toutes tes notes. Dans l'éditeur : « / » pour insérer un bloc, « @ » pour lier un projet, une tâche ou une note."
        actions={<NewNoteButton />}
      />
      <NoteList notes={notes} empty="Aucune note pour l'instant." />
    </div>
  );
}
