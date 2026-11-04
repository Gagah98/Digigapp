# DiGiga App — Roadmap

> Ton second cerveau personnel : notes, tâches, projets, CRM, objectifs, agenda et IA, tout au même endroit et organisé selon la méthode **PARA** de Tiago Forte (*Building a Second Brain*).

---

## 1. Vision et principes

**Le problème :** tes informations sont réparties entre Notion, Obsidian et d'autres outils. Aucun ne colle exactement à ta façon de travailler d'indépendant.

**L'objectif :** une seule application, à toi, que tu peux modifier toi-même, et où tout est relié : un client (CRM) → ses projets → leurs tâches → les notes et les mails liés.

**Principes de conception**
1. **La capture d'abord** : noter une idée ou une tâche doit prendre moins de 3 secondes (raccourci, mobile, IA).
2. **Tout est relié** : chaque élément peut pointer vers un autre (liens, rétroliens).
3. **PARA comme squelette**, pas comme carcan.
4. **Tes données t'appartiennent** : auto-hébergée, export Markdown/JSON possible à tout moment.
5. **Construire petit, utiliser tout de suite** : chaque phase livre quelque chose que tu utilises au quotidien.

---

## 2. Le modèle PARA appliqué à DiGiga

| PARA | Définition | Dans DiGiga |
|---|---|---|
| **P**rojets | Un résultat précis, avec une échéance | « Site web — Boulangerie Dupont », avec ses tâches, ses notes, son client |
| **A**ires (Areas) | Responsabilités permanentes, sans fin | Clients, Finances, Marketing, Santé, Formation… |
| **R**essources | Sujets d'intérêt, documentation | Snippets de code, inspirations design, articles, procédures |
| **A**rchives | Tout ce qui est inactif | Projets terminés, anciens clients, ressources obsolètes |

Plus les éléments transverses : **Inbox** (capture rapide à trier), **Tâches**, **Notes**, **Contacts / Entreprises** (CRM), **Objectifs**, **Événements**, **Mails liés**.

```
Objectif ──► Aire ──► Projet ──► Tâches
                        │  ├──► Notes / Ressources
                        │  └──► Événements (agenda)
                        └──► Client (CRM) ──► Mails, Opportunités, Interactions
```

---

## 3. Stack technique recommandée

### Mon choix (et pourquoi)

| Couche | Techno | Pourquoi |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | Front et API dans un seul projet, énorme écosystème, facile à faire évoluer avec l'aide de l'IA |
| UI | **Tailwind CSS + shadcn/ui** | Composants propres que tu possèdes et modifies (pas une boîte noire) |
| Éditeur de notes | **BlockNote** (basé sur TipTap) | Éditeur par blocs façon Notion : `/` commandes, glisser-déposer, checklists, export Markdown |
| Base de données | **PostgreSQL 16** | Robuste, recherche plein texte native, relations, et **pgvector** pour la recherche IA |
| ORM | **Drizzle ORM** | Typé, léger, migrations simples |
| Auth | **Better Auth** (passkey ou mot de passe + 2FA) | Tu es seul utilisateur au début, mais c'est prêt pour un assistant ou un client plus tard |
| Tâches de fond | **pg-boss** (file d'attente dans Postgres) | Synchro agenda/mails, embeddings, rappels, sans Redis |
| Kanban / glisser-déposer | **dnd-kit** | Standard React, accessible |
| Calendrier | **FullCalendar** ou **Schedule-X** | Vues jour, semaine et mois, time-blocking |
| IA | **API Claude (Anthropic)** avec *tool use* | Assistant capable de chercher, créer des tâches, résumer ; embeddings via Voyage AI ou un modèle local |
| Mobile | **PWA** (installable sur téléphone) | Capture rapide et notifications sans développer d'app native |
| Fichiers | Disque local du serveur ou stockage S3 (Infomaniak Swiss Backup, Cloudflare R2…) | Pièces jointes, images dans les notes |

**Alternative si tu préfères PHP** (plus facile sur un hébergement mutualisé) : **Laravel + Livewire/Filament + MySQL**. Plus simple à déployer, mais moins adapté à un éditeur riche façon Notion et à la recherche vectorielle.

### Hébergement

Un **hébergement mutualisé** classique convient mal : pas de processus Node permanent, pas de tâches de fond, pas de pgvector.

**Recommandation : un petit VPS** (environ 5 à 15 €/mois), par exemple Infomaniak VPS Lite (données en Suisse), Hetzner ou OVH.

- **Coolify** (ou Dokploy) installé sur le VPS : un « Heroku perso ». Tu pousses sur GitHub et l'app se déploie toute seule, avec HTTPS automatique.
- **Docker Compose** : `app` + `postgres` + `worker`.
- **Sauvegardes** : `pg_dump` chaque nuit vers un stockage externe, plus un export Markdown hebdomadaire.
- Ton hébergement actuel peut rester pour le nom de domaine (`app.digiga.ch` par exemple, en DNS vers le VPS).

---

## 4. Modèle de données (v1)

Une approche « tout est un élément » avec des types, comme Notion :

```
areas          id, nom, icône, couleur, archivée
projects       id, area_id, client_id, titre, statut, priorité, date_début, échéance, template_id, archivé
tasks          id, project_id?, parent_id?, titre, statut, priorité, échéance, date_prévue,
               estimation, énergie, récurrence, ordre_kanban, terminé_le
notes          id, titre, contenu (JSON blocs + markdown), type (note|ressource|journal|réunion)
contacts       id, prénom, nom, email, téléphone, entreprise_id, source, tags
companies      id, nom, site, secteur, adresse
deals          id, contact_id, company_id, titre, montant, étape (prospect→devis→gagné/perdu)
interactions   id, contact_id, type (appel|mail|rdv|note), date, résumé
goals          id, titre, horizon (année|trimestre|mois), indicateur, valeur_cible, valeur_actuelle
events         id, source (google|caldav|local), external_id, début, fin, lié_à
emails         id, message_id, de, objet, extrait, date, lié_à (contact/projet/tâche)
templates      id, nom, type (projet|note|tâche), contenu JSON (tâches, notes, délais relatifs)
tags / item_tags
links          from_type, from_id, to_type, to_id    ← liens et rétroliens universels
embeddings     item_type, item_id, vecteur (pgvector)  ← recherche IA
inbox          id, contenu brut, source (web|mobile|mail|IA), traité
```

---

## 5. Roadmap par phases

> Durées indicatives pour un développement en solo, à temps partiel, avec l'aide de l'IA (Claude Code).

### Phase 0 — Fondations (1 à 2 semaines)
- [ ] Repo Git + projet Next.js + Tailwind + shadcn/ui
- [ ] PostgreSQL via Docker en local, Drizzle, premières migrations
- [ ] Authentification (toi seul)
- [ ] Mise en page : barre latérale PARA (Inbox, Aujourd'hui, Projets, Aires, Ressources, Archives, CRM, Objectifs)
- [ ] VPS + Coolify + domaine + HTTPS + sauvegardes automatiques
- **Livrable :** l'app est en ligne, vide mais sécurisée et sauvegardée.

### Phase 1 — Le cœur PARA : MVP (3 à 5 semaines) ⭐
- [ ] **Aires et projets** : création, statut, échéance, archivage en un clic
- [ ] **Tâches** : sous-tâches, échéance, date prévue, priorité, tâches récurrentes
- [ ] **Notes** : éditeur par blocs BlockNote, liens `[[...]]` vers n'importe quel élément, rétroliens
- [ ] **Inbox et capture rapide** : `Ctrl+K` pour une note ou une tâche depuis n'importe où, avec une syntaxe naturelle (`Appeler Marc demain #client !haute`)
- [ ] **Vues** : liste, **Kanban** (par statut ou priorité), tableau
- [ ] **Vue « Aujourd'hui »** : tâches du jour, en retard, à venir
- [ ] **Recherche globale** (plein texte PostgreSQL) et palette de commandes
- [ ] Tags, favoris, glisser-déposer
- **Livrable :** tu peux quitter Notion et Obsidian pour tes tâches et tes notes.

### Phase 2 — Modèles et productivité (2 semaines)
- [ ] **Modèles de projet** : par exemple « Création site web » qui génère automatiquement :
  - les tâches avec des échéances relatives (J+0 Brief, J+3 Arborescence, J+7 Maquette, J+14 Intégration, J+21 Recette, J+25 Mise en ligne)
  - les notes pré-remplies (brief client, cahier des charges, accès, checklist SEO et mise en ligne)
  - la liaison au client choisi
- [ ] Modèles de notes (compte rendu de réunion, journal, revue hebdo)
- [ ] **Priorisation** : matrice d'Eisenhower (urgent/important), score de priorité, niveau d'énergie, estimation de durée
- [ ] Rappels et notifications (PWA)

### Phase 3 — CRM d'indépendant (2 à 3 semaines)
- [ ] Contacts et entreprises, fiche client 360° (projets, tâches, notes, mails, interactions)
- [ ] **Pipeline d'opportunités** en Kanban : Prospect → Contacté → Devis envoyé → Négociation → Gagné/Perdu
- [ ] Historique des interactions, relances automatiques (« pas de nouvelles depuis 14 jours »)
- [ ] Gagner une opportunité crée le projet à partir du bon modèle
- [ ] *(plus tard)* lien avec Bexio pour les devis et factures (voir la phase 9)

### Phase 4 — Agenda (2 semaines)
- [ ] Synchronisation **Google Calendar** (OAuth) et/ou **CalDAV** (Infomaniak, iCloud, Nextcloud)
- [ ] Vue calendrier avec les événements et les tâches planifiées
- [ ] **Time-blocking** : glisser une tâche dans l'agenda pour bloquer un créneau
- [ ] Lier un rendez-vous à un client ou un projet, et créer automatiquement une note de réunion

### Phase 5 — Assistant IA (3 semaines) 🤖
- [ ] **Recherche sémantique** : embeddings de toutes les notes, tâches et projets (pgvector), pour demander par exemple « où avais-je noté les accès FTP du client X ? »
- [ ] **Chat assistant** avec l'API Claude et des outils : `search`, `create_task`, `create_note`, `update_project`, `get_calendar`… Exemple : « Prépare-moi la semaine »
- [ ] **Tri automatique de l'Inbox** : l'IA propose le projet, l'aire, les tags et la priorité
- [ ] Résumés : d'un projet, d'un client, revue hebdomadaire générée
- [ ] Transformer une note de réunion en liste de tâches
- [ ] *(option)* serveur **MCP** DiGiga pour piloter ton second cerveau depuis Claude Desktop ou Claude Code

### Phase 6 — Objectifs et revues (1 à 2 semaines)
- [ ] Objectifs annuels, trimestriels et mensuels liés aux aires et aux projets, avec progression automatique
- [ ] **Revue hebdomadaire guidée** (méthode GTD/PARA) : vider l'Inbox, revoir les projets, archiver
- [ ] Tableau de bord : projets actifs, tâches en retard, pipeline CRM, progression des objectifs

### Phase 7 — Mails (2 à 3 semaines)
- [ ] Connexion **IMAP** (Infomaniak, Gmail…), en lecture seule pour commencer
- [ ] Mails d'un contact affichés automatiquement sur sa fiche CRM
- [ ] « Mail → tâche » ou « mail → note » en un clic, ou en transférant à une adresse dédiée (`inbox@…`)
- [ ] L'IA détecte les demandes clients dans les mails et propose des tâches

### Phase 8 — Bonus et confort (continu)
- [ ] **Import** Notion (export Markdown/CSV) et Obsidian (dossier `.md`)
- [ ] **Web clipper** (extension de navigateur ou bookmarklet) vers Ressources
- [ ] Suivi du temps par tâche et par projet (utile pour facturer)
- [ ] Vues personnalisées enregistrées (filtres et tris), « bases de données » configurables façon Notion
- [ ] Graphe des liens entre notes (façon Obsidian)
- [ ] Mode hors ligne (PWA et stockage local)
- [ ] Portail client en lecture seule (avancement du projet)
- [ ] Thème clair/sombre, raccourcis clavier partout

---

## 6. Priorités : ce qu'il faut faire en premier

1. **Phases 0 et 1** : sans un bon noyau tâches, notes et capture, le reste ne sert à rien.
2. **Phase 2 (modèles)** : c'est ce qui te fera gagner le plus de temps comme indépendant.
3. **Phase 3 (CRM)**, puis **4 (agenda)**.
4. **Phase 5 (IA)** : plus l'app contient de données, plus l'IA est utile. Il vaut donc mieux l'ajouter une fois que tu l'utilises vraiment.
5. Ensuite, selon ton usage réel : objectifs, mails, bonus.

**Règle d'or :** utilise l'app chaque jour dès la fin de la phase 1, et laisse tes frustrations réelles décider de la suite.

---

## 7. Budget mensuel estimé

| Poste | Coût |
|---|---|
| VPS (2 à 4 Go de RAM) | 5 à 15 €/mois |
| Nom de domaine | ~1 €/mois |
| API Claude + embeddings (usage perso) | 2 à 15 €/mois selon l'usage |
| Stockage de sauvegardes | 0 à 3 €/mois |
| **Total** | **~10 à 30 €/mois** |

---

## 8. Décisions prises (4 novembre 2026)

| Sujet | Décision | Conséquence technique |
|---|---|---|
| Hébergement | **Infomaniak VPS Lite**, sous **Linux (Ubuntu 24.04 LTS)** | Docker et Coolify y tournent nativement ; c'est moins cher que Windows (pas de licence) |
| Base de données | **PostgreSQL sur le VPS** (pas Supabase pour l'instant) | Plus léger, gratuit, rien n'est mis en pause. Supabase étant du Postgres, on pourra migrer plus tard si besoin |
| Agenda | **Google Agenda** (agenda principal) | API Google Calendar avec OAuth et synchro dans les deux sens. Le connecteur reste générique pour pouvoir passer à CalDAV (Infomaniak) plus tard |
| Mails | **Infomaniak** en IMAP/SMTP | Les comptes mail sont configurés dans les réglages, sans adresse écrite en dur dans le code. Changer d'adresse ou de fournisseur se fait dans la configuration |
| Développement | **Tout est codé avec Claude Code** | Code TypeScript lisible, bien structuré et documenté (un `CLAUDE.md` dans le repo) |
| Mobile | **PWA uniquement** | Installable sur iPhone et Android, avec capture rapide et notifications |
| Factures | **Bexio reste l'outil de facturation** | Phase ultérieure : intégration de l'API Bexio (voir les factures et paiements sur la fiche client, synchro des contacts) |

### Points d'attention
- **Google OAuth** : en mode « Test », Google fait expirer la connexion tous les 7 jours. Il faut passer l'app en mode « Production » (non vérifiée, ce qui est acceptable pour un usage personnel). Tu verras simplement un avertissement « app non vérifiée » à la première connexion.
- **VPS Lite** : prendre au moins **4 Go de RAM** pour faire tourner confortablement l'app, Postgres, le worker et Coolify.

### Ajouts à la roadmap
- **Phase 9 — Intégration Bexio** : lecture des factures et de leur statut sur la fiche client, synchro des contacts. Plus tard : créer un devis Bexio depuis une opportunité du CRM.
