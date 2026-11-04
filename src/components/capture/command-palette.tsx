"use client";
/**
 * Palette Ctrl+K (ou Cmd+K) : capture rapide + recherche globale + navigation.
 *  - Entrée          → crée une tâche (syntaxe : demain, !haute, #tag, +projet)
 *  - Ctrl/Cmd+Entrée → envoie dans l'Inbox
 *  - les résultats de recherche apparaissent en dessous
 */
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckSquare, FileText, FolderKanban, Inbox, Layers, Plus, Search, Sun, BookOpen, LayoutDashboard, Archive,
} from "lucide-react";
import { addToInbox, createNote, createProject, createTaskFromText, search, type SearchResult } from "@/app/actions";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { parseCapture } from "@/lib/quick-parse";
import { formatRelative } from "@/lib/dates";
import { priorityLabel } from "@/lib/labels";

const typeIcon = { project: FolderKanban, task: CheckSquare, note: FileText, area: Layers };

const NAV = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/today", label: "Aujourd'hui", icon: Sun },
  { href: "/projects", label: "Projets", icon: FolderKanban },
  { href: "/areas", label: "Aires", icon: Layers },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/resources", label: "Ressources", icon: BookOpen },
  { href: "/archives", label: "Archives", icon: Archive },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Raccourci global + événement personnalisé (bouton mobile, barre latérale)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("digiga:capture", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("digiga:capture", onOpen);
    };
  }, []);

  // Recherche avec un léger délai
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const id = setTimeout(() => search(query).then(setResults), 150);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const run = (fn: () => Promise<unknown>, message: string) => {
    close();
    startTransition(async () => {
      await fn();
      setToast(message);
      router.refresh();
    });
  };

  const go = (href: string) => {
    close();
    router.push(href);
  };

  const text = query.trim();
  const parsed = text ? parseCapture(text) : null;
  const details = parsed
    ? [
        parsed.date && formatRelative(parsed.date),
        parsed.priority && priorityLabel[parsed.priority],
        ...parsed.tags.map((t) => `#${t}`),
        parsed.projectHint && `→ ${parsed.projectHint}`,
      ].filter(Boolean).join(" · ")
    : "";
  const navMatches = NAV.filter((n) => !text || n.label.toLowerCase().includes(text.toLowerCase()));

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
        <DialogContent className="top-[15%] translate-y-0 overflow-hidden p-0 sm:max-w-xl" showCloseButton={false}>
          <DialogHeader className="sr-only">
            <DialogTitle>Capture rapide et recherche</DialogTitle>
            <DialogDescription>Tape une tâche, une idée ou un mot à rechercher.</DialogDescription>
          </DialogHeader>
          <Command
            shouldFilter={false}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && text) {
                e.preventDefault();
                run(() => addToInbox(text), "Ajouté à l'Inbox");
              }
            }}
          >
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Tâche, idée, recherche…  (ex. Envoyer devis vendredi !haute)"
              autoFocus
            />
            <CommandList className="max-h-[60vh]">
              <CommandEmpty>Aucun résultat.</CommandEmpty>
              {text && (
                <CommandGroup heading="Créer">
                  <CommandItem value="create-task" onSelect={() => run(() => createTaskFromText(text), "Tâche créée ✔")}>
                    <CheckSquare />
                    <span className="truncate">
                      Tâche : <strong>{parsed?.title || text}</strong>
                      {details && <span className="ml-2 text-xs text-muted-foreground">{details}</span>}
                    </span>
                    <CommandShortcut>↵</CommandShortcut>
                  </CommandItem>
                  <CommandItem value="create-inbox" onSelect={() => run(() => addToInbox(text), "Ajouté à l'Inbox")}>
                    <Inbox />
                    <span className="truncate">Inbox : {text}</span>
                    <CommandShortcut>Ctrl ↵</CommandShortcut>
                  </CommandItem>
                  <CommandItem
                    value="create-note"
                    onSelect={() => {
                      close();
                      startTransition(async () => router.push(`/notes/${await createNote({ title: text })}`));
                    }}
                  >
                    <FileText />
                    <span className="truncate">Note : {text}</span>
                  </CommandItem>
                  <CommandItem
                    value="create-project"
                    onSelect={() => {
                      close();
                      startTransition(async () => router.push(`/projects/${await createProject({ title: text })}`));
                    }}
                  >
                    <Plus />
                    <span className="truncate">Projet : {text}</span>
                  </CommandItem>
                </CommandGroup>
              )}
              {results.length > 0 && (
                <CommandGroup heading="Résultats">
                  {results.map((r) => {
                    const Icon = typeIcon[r.type];
                    return (
                      <CommandItem key={`${r.type}-${r.id}`} value={`${r.type}-${r.id}`} onSelect={() => go(r.href)}>
                        <Icon />
                        <span className="truncate">{r.title}</span>
                        {r.subtitle && <span className="ml-auto truncate text-xs text-muted-foreground">{r.subtitle}</span>}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
              {navMatches.length > 0 && (
                <CommandGroup heading="Aller à">
                  {navMatches.map((n) => (
                    <CommandItem key={n.href} value={`nav-${n.href}`} onSelect={() => go(n.href)}>
                      <n.icon />
                      {n.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
            <div className="flex items-center gap-3 border-t px-3 py-2 text-xs text-muted-foreground">
              <Search className="size-3" /> Recherche dans les projets, tâches et notes
              <span className="ml-auto hidden sm:inline">Échap pour fermer</span>
            </div>
          </Command>
        </DialogContent>
      </Dialog>

      {/* Bouton flottant de capture (surtout pour mobile / PWA) */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Capture rapide"
        className="fixed right-5 bottom-5 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 md:hidden"
      >
        <Plus className="size-6" />
      </button>

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg"
        >
          {toast}
        </div>
      )}
    </>
  );
}
