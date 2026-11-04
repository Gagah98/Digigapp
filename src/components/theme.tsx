"use client";
/**
 * Thème de l'app : "system" (suit Windows/macOS/téléphone), "light" ou "dark".
 * Le choix est mémorisé dans le navigateur ; la classe `.dark` est posée sur <html>.
 */
import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

export type ThemeChoice = "system" | "light" | "dark";
const KEY = "digiga-theme";

/** Script exécuté avant l'affichage pour éviter un flash de la mauvaise couleur. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${KEY}")||"system";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

function apply(choice: ThemeChoice) {
  const dark = choice === "dark" || (choice === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

function read(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

const OPTIONS: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "Système", icon: Monitor },
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
];

export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>("system");

  useEffect(() => {
    setChoice(read());
    // En mode "Système", suivre les changements du système en direct
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => read() === "system" && apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const select = (value: ThemeChoice) => {
    setChoice(value);
    try {
      localStorage.setItem(KEY, value);
    } catch {}
    apply(value);
  };

  return (
    <div className="flex rounded-lg border p-0.5" role="radiogroup" aria-label="Thème">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          role="radio"
          aria-checked={choice === value}
          title={label}
          onClick={() => select(value)}
          className={`flex flex-1 items-center justify-center gap-1 rounded-md px-1.5 py-1 text-xs transition-colors ${
            choice === value ? "bg-sidebar-accent font-medium text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon className="size-3.5" />
          <span className="hidden lg:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

/** Indique si l'app est actuellement en sombre (suit la classe `.dark` de <html>). */
export function useIsDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const update = () => setDark(el.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}
