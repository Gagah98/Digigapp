"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { navSections } from "./nav";

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside className="border-b bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:h-dvh md:w-60 md:shrink-0 md:border-r md:border-b-0">
      <div className="flex items-center justify-between px-4 py-3 md:py-5">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Brain className="size-5" /> DiGiga
        </Link>
        <button
          className="rounded-md p-1.5 hover:bg-sidebar-accent md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <nav className={cn("space-y-5 px-2 pb-4", open ? "block" : "hidden md:block")}>
        {navSections.map((section, i) => (
          <div key={i}>
            {section.title && (
              <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent",
                      isActive(href) && "bg-sidebar-accent font-medium",
                    )}
                  >
                    <Icon className="size-4 text-muted-foreground" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
