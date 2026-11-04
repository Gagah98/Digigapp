/**
 * Analyse de la saisie rapide (langage naturel, en français).
 *
 *   "Appeler Marc demain #client !haute +Boulangerie"
 *   → { title: "Appeler Marc", date: <demain>, tags: ["client"], priority: "high", projectHint: "Boulangerie" }
 *
 * Syntaxe :
 *   #tag              tag (plusieurs possibles)
 *   !urgent !haute !moyenne !basse  (ou !u !h !m !b, ou !1 à !4)
 *   +projet           rattache au projet dont le titre contient ce mot (+"nom long" accepté)
 *   dates : aujourd'hui/auj, demain/dem, après-demain, lundi…dimanche (prochain),
 *           "dans 3 jours", "semaine prochaine", 15.11, 15.11.2026, 15/11
 */
import { addDays, todayISO, toISODate } from "./dates";
import type { Priority } from "./labels";

export type ParsedCapture = {
  title: string;
  date: string | null;
  priority: Priority | null;
  tags: string[];
  projectHint: string | null;
};

const PRIORITY_WORDS: Record<string, Priority> = {
  urgent: "urgent", urgente: "urgent", u: "urgent", "1": "urgent",
  haute: "high", haut: "high", h: "high", "2": "high",
  moyenne: "medium", moyen: "medium", m: "medium", "3": "medium",
  basse: "low", bas: "low", b: "low", "4": "low",
};

const WEEKDAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

function strip(text: string, re: RegExp): [string, RegExpMatchArray | null] {
  const m = text.match(re);
  return m ? [text.replace(m[0], " "), m] : [text, null];
}

export function parseCapture(input: string, now = new Date()): ParsedCapture {
  let text = ` ${input} `;
  const today = todayISO();
  let date: string | null = null;
  let priority: Priority | null = null;
  let projectHint: string | null = null;
  const tags: string[] = [];

  // Tags
  text = text.replace(/\s#([\p{L}\p{N}_-]+)/gu, (_, t: string) => { tags.push(t.toLowerCase()); return " "; });

  // Priorité
  let m: RegExpMatchArray | null;
  [text, m] = strip(text, /\s!(\p{L}+|\d)(?=\s)/u);
  if (m) priority = PRIORITY_WORDS[m[1].toLowerCase()] ?? null;

  // Projet : +"nom long" ou +mot
  [text, m] = strip(text, /\s\+"([^"]+)"/);
  if (!m) [text, m] = strip(text, /\s\+([\p{L}\p{N}_-]+)/u);
  if (m) projectHint = m[1];

  // Dates
  const rules: [RegExp, (m: RegExpMatchArray) => string | null][] = [
    [/\s(?:après-demain|apres-demain)(?=\s)/i, () => addDays(today, 2)],
    [/\s(?:aujourd'hui|aujourd’hui|auj)(?=\s)/i, () => today],
    [/\s(?:demain|dem)(?=\s)/i, () => addDays(today, 1)],
    [/\sdans\s(\d{1,3})\s?(?:jours?|j)(?=\s)/i, (m) => addDays(today, Number(m[1]))],
    [/\s(?:la\s)?semaine\sprochaine(?=\s)/i, () => {
      const dow = now.getDay(); const toMonday = ((8 - dow) % 7) || 7;
      return addDays(today, toMonday);
    }],
    [/\s(?:le\s)?(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?(?=\s)/, (m) => {
      const d = Number(m[1]), mo = Number(m[2]);
      let y = m[3] ? Number(m[3]) : now.getFullYear();
      if (y < 100) y += 2000;
      if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
      let iso = toISODate(new Date(y, mo - 1, d));
      if (!m[3] && iso < today) iso = toISODate(new Date(y + 1, mo - 1, d));
      return iso;
    }],
    [new RegExp(String.raw`\s(?:ce\s|le\s)?(${WEEKDAYS.join("|")})(?:\sprochain)?(?=\s)`, "i"), (m) => {
      const target = WEEKDAYS.indexOf(m[1].toLowerCase());
      const diff = ((target - now.getDay() + 7) % 7) || 7;
      return addDays(today, diff);
    }],
  ];
  for (const [re, fn] of rules) {
    const [t, mm] = strip(text, re);
    if (mm) { const d = fn(mm); if (d) { date = d; text = t; break; } }
  }

  const title = text.replace(/\s+/g, " ").trim();
  return { title, date, priority, tags, projectHint };
}
