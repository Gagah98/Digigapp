// Dates "calendrier" au format ISO local (YYYY-MM-DD), sans fuseau horaire.

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return toISODate(new Date(y, m - 1, d + n));
}

/** "Aujourd'hui", "Demain", "Hier", "lun. 10 nov." … */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "";
  const today = todayISO();
  if (iso === today) return "Aujourd'hui";
  if (iso === addDays(today, 1)) return "Demain";
  if (iso === addDays(today, -1)) return "Hier";
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const sameYear = y === new Date().getFullYear();
  return date.toLocaleDateString("fr-CH", {
    weekday: "short", day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }),
  });
}
