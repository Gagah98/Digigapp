"use client";
/**
 * Éditeur de notes par blocs (BlockNote), façon Notion :
 *  - "/" pour insérer un bloc (titre, liste, checklist, tableau, image…)
 *  - "@" pour mentionner un projet, une tâche, une note ou une aire → crée un lien + rétrolien
 *  - enregistrement automatique
 */
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BlockNoteSchema, defaultInlineContentSpecs, filterSuggestionItems, type PartialBlock,
} from "@blocknote/core";
import { fr } from "@blocknote/core/locales";
import {
  createReactInlineContentSpec, getDefaultReactSlashMenuItems, SuggestionMenuController, useCreateBlockNote,
  type DefaultReactSuggestionItem,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { search, updateNote, type LinkRef } from "@/app/actions";
import { useIsDark } from "@/components/theme";

const typeEmoji: Record<string, string> = { project: "📁", task: "☑️", note: "📝", area: "🗂️" };

// Mention "@" : référence vers un autre élément de DiGiga
const Mention = createReactInlineContentSpec(
  {
    type: "mention",
    propSchema: {
      itemType: { default: "note" },
      itemId: { default: "" },
      title: { default: "" },
      href: { default: "" },
    },
    content: "none",
  },
  {
    render: ({ inlineContent }) => {
      const p = inlineContent.props;
      return (
        <a
          href={p.href}
          className="rounded bg-sky-100 px-1 text-sky-800 no-underline hover:bg-sky-200 dark:bg-sky-950 dark:text-sky-300"
        >
          {typeEmoji[p.itemType] ?? "🔗"} {p.title}
        </a>
      );
    },
  },
);

const schema = BlockNoteSchema.create({
  inlineContentSpecs: { ...defaultInlineContentSpecs, mention: Mention },
});

type Doc = (typeof schema.BlockNoteEditor)["document"];

/** Extrait le texte brut (pour la recherche) et les mentions (pour les liens). */
function analyse(doc: Doc) {
  const text: string[] = [];
  const refs: LinkRef[] = [];
  const walk = (blocks: Doc) => {
    for (const b of blocks) {
      if (Array.isArray(b.content)) {
        const line = b.content
          .map((c) => {
            if (c.type === "text") return c.text;
            if (c.type === "link") return c.content.map((x) => x.text).join("");
            if (c.type === "mention") {
              const { itemType, itemId, title } = c.props as { itemType: LinkRef["type"]; itemId: string; title: string };
              if (itemId) refs.push({ type: itemType, id: itemId });
              return title;
            }
            return "";
          })
          .join("");
        if (line) text.push(line);
      }
      if (b.children?.length) walk(b.children as Doc);
    }
  };
  walk(doc);
  return { text: text.join("\n"), refs };
}

export default function NoteEditor({ noteId, initialContent }: { noteId: string; initialContent: unknown }) {
  const [status, setStatus] = useState<"saved" | "saving" | "dirty">("saved");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Suit le thème choisi dans l'app (et non directement celui du système)
  const dark = useIsDark();

  const content = useMemo(
    () => (Array.isArray(initialContent) && initialContent.length ? (initialContent as PartialBlock[]) : undefined),
    [initialContent],
  );

  const editor = useCreateBlockNote({
    schema,
    dictionary: fr,
    initialContent: content as never,
  });

  const save = async () => {
    setStatus("saving");
    const doc = editor.document;
    const { text, refs } = analyse(doc);
    await updateNote(noteId, { content: doc, contentText: text }, refs);
    setStatus("saved");
  };

  // Sauvegarde à la fermeture de la page si besoin
  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        void save();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mentionItems = async (query: string): Promise<DefaultReactSuggestionItem[]> => {
    const results = await search(query.length >= 2 ? query : "");
    return results
      .filter((r) => !(r.type === "note" && r.id === noteId))
      .map((r) => ({
        title: r.title,
        subtext: r.subtitle,
        icon: <span>{typeEmoji[r.type]}</span>,
        onItemClick: () =>
          editor.insertInlineContent([
            { type: "mention", props: { itemType: r.type, itemId: r.id, title: r.title, href: r.href } },
            " ",
          ]),
      }));
  };

  return (
    <div className="relative">
      <p className="absolute -top-7 right-0 text-xs text-muted-foreground" aria-live="polite">
        {status === "saving" ? "Enregistrement…" : status === "dirty" ? "Modifié" : "Enregistré"}
      </p>
      <BlockNoteView
        editor={editor}
        theme={dark ? "dark" : "light"}
        className="-mx-[54px] min-h-[50vh]"
        onChange={() => {
          setStatus("dirty");
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => {
            timer.current = null;
            void save();
          }, 700);
        }}
        slashMenu={false}
      >
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) => filterSuggestionItems(getDefaultReactSlashMenuItems(editor), query)}
        />
        <SuggestionMenuController
          triggerCharacter="@"
          getItems={async (query) => {
            if (query.length < 2) return [];
            return mentionItems(query);
          }}
        />
      </BlockNoteView>
    </div>
  );
}
