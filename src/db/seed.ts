// Données de départ : quelques aires + un projet exemple. Lancer : npm run db:seed
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { db } = await import("./index");
  const { areas, projects, tasks, inboxItems } = await import("./schema");

  const existing = await db.select().from(areas).limit(1);
  if (existing.length) { console.log("Déjà initialisé, rien à faire."); process.exit(0); }

  const [clients] = await db.insert(areas).values([
    { name: "Clients", icon: "briefcase", sortOrder: 0 },
    { name: "Marketing", icon: "megaphone", sortOrder: 1 },
    { name: "Finances", icon: "wallet", sortOrder: 2 },
    { name: "Formation", icon: "graduation-cap", sortOrder: 3 },
    { name: "Santé", icon: "heart", sortOrder: 4 },
  ]).returning();

  const [site] = await db.insert(projects).values({
    areaId: clients.id, title: "Exemple — Site web client", priority: "high",
  }).returning();

  const today = new Date().toISOString().slice(0, 10);
  await db.insert(tasks).values([
    { projectId: site.id, title: "Brief client", scheduledDate: today, priority: "high" },
    { projectId: site.id, title: "Arborescence du site" },
    { projectId: site.id, title: "Maquette page d'accueil" },
  ]);
  await db.insert(inboxItems).values({ content: "Idée : tester DiGiga App au quotidien 🎉" });

  console.log("Seed terminé ✔");
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
