import {
  Inbox, Sun, FolderKanban, Layers, BookOpen, Archive, Users, Target, CalendarDays, LayoutDashboard, FileText,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };
export type NavSection = { title?: string; items: NavItem[] };

// Navigation principale : structure PARA + modules transverses
export const navSections: NavSection[] = [
  {
    items: [
      { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/inbox", label: "Inbox", icon: Inbox },
      { href: "/today", label: "Aujourd'hui", icon: Sun },
      { href: "/notes", label: "Notes", icon: FileText },
    ],
  },
  {
    title: "PARA",
    items: [
      { href: "/projects", label: "Projets", icon: FolderKanban },
      { href: "/areas", label: "Aires", icon: Layers },
      { href: "/resources", label: "Ressources", icon: BookOpen },
      { href: "/archives", label: "Archives", icon: Archive },
    ],
  },
  {
    title: "Modules",
    items: [
      { href: "/crm", label: "CRM", icon: Users },
      { href: "/calendar", label: "Agenda", icon: CalendarDays },
      { href: "/goals", label: "Objectifs", icon: Target },
    ],
  },
];
