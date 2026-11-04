// Récurrence simple au format RRULE : "FREQ=WEEKLY" ou "FREQ=DAILY;INTERVAL=2"
import { addDays } from "./dates";

export const RECURRENCE_OPTIONS = [
  { value: "", label: "Aucune" },
  { value: "FREQ=DAILY", label: "Chaque jour" },
  { value: "FREQ=WEEKLY", label: "Chaque semaine" },
  { value: "FREQ=WEEKLY;INTERVAL=2", label: "Toutes les 2 semaines" },
  { value: "FREQ=MONTHLY", label: "Chaque mois" },
  { value: "FREQ=YEARLY", label: "Chaque année" },
];

const pad = (n: number) => String(n).padStart(2, "0");

export function nextOccurrence(rule: string, fromISO: string): string | null {
  const parts = Object.fromEntries(rule.split(";").map((p) => p.split("=")));
  const n = Number(parts.INTERVAL ?? 1);
  const [y, m, d] = fromISO.split("-").map(Number);
  switch (parts.FREQ) {
    case "DAILY":
      return addDays(fromISO, n);
    case "WEEKLY":
      return addDays(fromISO, 7 * n);
    case "MONTHLY": {
      const first = new Date(y, m - 1 + n, 1);
      const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate(); // évite le 31 → mois suivant
      return `${first.getFullYear()}-${pad(first.getMonth() + 1)}-${pad(Math.min(d, lastDay))}`;
    }
    case "YEARLY":
      return `${y + n}-${pad(m)}-${pad(d)}`;
    default:
      return null;
  }
}
