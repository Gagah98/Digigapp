# DiGiga App — instructions pour Claude

Second cerveau personnel (méthode PARA : Projets, Aires, Ressources, Archives) : tâches, notes, CRM, agenda, objectifs, IA.
Utilisateur unique (indépendant, Suisse romande). **Interface et commentaires en français.**
La vision et les phases sont dans `ROADMAP.md` : s'y référer avant d'ajouter une fonctionnalité.

## Stack
- Next.js 15 (App Router, `src/`), React 19, TypeScript, Tailwind v4, shadcn/ui (style base-nova, `@base-ui/react`)
- PostgreSQL 16 + pgvector (Docker, port **5433** en local), Drizzle ORM (`src/db/schema.ts`)
- Icônes : lucide-react

## Commandes
- `npm run db:up` — démarrer Postgres (Docker Desktop doit tourner)
- `npm run dev` — serveur de dev sur http://localhost:3000
- `npm run db:generate` puis `npm run db:migrate` — après toute modification du schéma
- `npm run db:seed` — données de départ · `npm run db:studio` — explorer la base
- `npm run lint` et `npx tsc --noEmit` avant de considérer une tâche finie

## Conventions
- Pages serveur par défaut ; lecture directe via `db` (`@/db`) ; mutations via Server Actions.
- Archivage = champ `archivedAt` (jamais de suppression définitive par défaut).
- Liens entre éléments : table `links` (from/to type + id) → sert aux rétroliens.
- Navigation : `src/components/layout/nav.ts`.
- Aucun secret dans le code : tout passe par `.env.local` (modèle dans `.env.example`).
- Les intégrations (agenda Google, mails IMAP Infomaniak, Bexio) passent par des connecteurs génériques configurables, pour pouvoir changer de fournisseur.
