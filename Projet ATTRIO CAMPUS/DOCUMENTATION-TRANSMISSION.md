# DOCUMENTATION DE TRANSMISSION — ATTRIO CAMPUS

## 🧭 CONTEXTE

- **Objectif du produit**
  - ATTRIO CAMPUS est un simulateur de formation commerciale centré sur la vente d’ATTRIO.
  - Le produit ne cherche pas seulement à “faire discuter avec un prospect”, mais à entraîner un commercial à suivre un process de vente structuré.
  - La logique actuelle mélange :
    - montée en compétence commerciale,
    - découverte du produit ATTRIO,
    - entraînement guidé,
    - simulation de vente,
    - débrief et progression.

- **Type d’utilisateurs**
  - commerciaux ATTRIO débutants,
  - profils néophytes qui ne savent pas encore vendre ATTRIO,
  - commerciaux plus avancés qui veulent s’entraîner sur des cas plus exigeants,
  - à terme : équipe ATTRIO / ATTY pour reprise ou intégration dans l’écosystème produit.

- **Stade actuel**
  - **MVP web déployé**, déjà utilisable,
  - **test users / pré-prod légère**,
  - application pensée pour apprendre vite, tester vite, puis transmettre proprement.

---

## 🚀 LANCER LE PROJET

### Installation

```bash
npm install
```

### Variables d’environnement

Créer un fichier `.env.local` à la racine du projet :

```bash
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxx
```

Sans ces variables :

- l’app fonctionne quand même,
- mais en **mode local uniquement**,
- sans synchronisation cloud.

### Commandes principales

- **dev**

```bash
npm run dev
```

- **dev local strict**

```bash
npm run dev:local
```

- **build**

```bash
npm run build
```

- **preview**

```bash
npm run preview
```

- **desktop start**

```bash
npm run desktop:start
```

- **build lanceurs natifs**

```bash
npm run launcher:build
```

- **deploy**
  - pas de commande custom dans le repo,
  - le déploiement web actuel passe par **Vercel**,
  - le flux attendu est :
    - push GitHub,
    - build Vercel,
    - mise en ligne automatique.

---

## 🧱 ARCHITECTURE GLOBALE

- **Frontend**
  - application **Vite**,
  - JavaScript vanilla,
  - rendu piloté dans `src/main.js`,
  - pas de framework UI type React/Vue,
  - pas de router externe : navigation gérée par l’état applicatif.

- **Backend / API**
  - **aucun backend custom** à ce stade,
  - pas d’API Node, pas de serveur métier,
  - le front parle **directement à Supabase** quand la synchro cloud est activée.

- **Base de données**
  - **Supabase Postgres**,
  - une table métier principale aujourd’hui : `training_sessions`,
  - RLS activé sur cette table.

- **Auth**
  - **Supabase Auth**,
  - connexion Google OAuth,
  - connexion par email magic link encore possible,
  - fallback total en mode local sans compte.

### Flux principal

```text
Frontend Vite
   ↓
Simulation / scoring / progression locale dans le navigateur
   ↓
Supabase direct (si variables + auth actives)
   ↓
Table training_sessions
```

### Lecture simple du fonctionnement

- sans connexion : tout reste dans le navigateur,
- avec connexion : historique local + synchronisation d’un résumé de session dans Supabase,
- aucun serveur intermédiaire ne recalculent les scores ou ne filtre les accès.

---

## 📁 STRUCTURE DU CODE

### Dossiers importants

- **`/src`**
  - cœur de l’application web,
  - UI, état global, navigation, export PDF, auth, synchronisation, rendu des écrans.

- **`/src/data`**
  - contenus structurés de formation,
  - parcours,
  - scénarios,
  - personas,
  - modules d’initiation.

- **`/src/engines`**
  - moteurs métier de simulation, coaching, scoring, expression et adaptation des réponses prospect.

- **`/src/lib`**
  - intégration technique externe,
  - aujourd’hui : client Supabase.

- **`/supabase`**
  - SQL de création de la table cloud et des politiques RLS.

- **`/scripts`**
  - scripts utilitaires desktop / lanceurs natifs.

- **`/launchers`**
  - assets et artefacts liés aux lanceurs Mac / Windows.

### Fichiers clés

- `src/main.js`
  - point d’entrée réel de l’app,
  - gère l’état global,
  - la navigation,
  - les écrans,
  - l’historique local,
  - l’auth,
  - la synchro cloud,
  - l’export rapport.

- `src/engine.js`
  - simple point d’export vers le moteur principal.

- `src/engines/simulation-engine.js`
  - exécute la simulation,
  - avance d’étape en étape,
  - analyse la réponse utilisateur,
  - produit la réponse suivante du prospect,
  - fabrique le débrief final.

- `src/engines/conversation-engine.js`
  - choisit / adapte les réponses du prospect,
  - injecte de la variation,
  - tente de rendre la conversation plus cohérente avec le message commercial.

- `src/engines/scoring-engine.js`
  - calcule score global,
  - score process,
  - score expression,
  - forces / points à renforcer,
  - débrief final.

- `src/engines/expression-engine.js`
  - note la qualité de formulation,
  - ton,
  - clarté,
  - précision.

- `src/engines/coach-engine.js`
  - gère le brief ATTY,
  - les conseils contextuels,
  - l’aide liée à l’étape en cours.

- `src/data/training-paths.js`
  - définit les niveaux de progression.

- `src/data/learning-modules.js`
  - définit les capsules et drills de l’initiation.

- `src/data/scenarios.js`
  - définit les cas de simulation.

- `src/data/personas.js`
  - définit les personas prospects.

- `src/lib/supabase.js`
  - instancie le client Supabase côté front.

- `supabase/training_sessions.sql`
  - référence SQL à rejouer pour remettre la base cloud.

---

## 🧠 LOGIQUE MÉTIER

### Parcours utilisateur

Le parcours est organisé en **5 niveaux** :

1. **Niveau 0 • Initiation**
   - capsules,
   - QCM,
   - drills très guidés,
   - découverte du terrain et du produit.

2. **Niveau 1 • Fondations**
   - chat guidé + choix,
   - prospect ouvert,
   - douleur visible.

3. **Niveau 2 • Consolidation**
   - chat structuré,
   - existant déjà en place,
   - adoption plus difficile.

4. **Niveau 3 • Avancé**
   - chat avec réticence,
   - peur du changement,
   - continuité d’exploitation.

5. **Niveau 4 • Expert**
   - décideur exigeant,
   - ROI,
   - gouvernance,
   - crédibilité du déploiement.

### Fonctionnement du simulateur

Le simulateur suit les **8 étapes du process ATTRIO** :

1. Contexte
2. Problème
3. Impact
4. Objectif & Besoins
5. Transition
6. Solution
7. Objections
8. Next Step

Pour chaque étape :

- le scénario contient une consigne,
- le prospect possède un message de base,
- l’utilisateur répond,
- des règles détectent si la réponse est bonne / trop vague / trop tôt / trop promotionnelle,
- un score process est calculé,
- un score expression est calculé,
- le moteur choisit ensuite la prochaine réponse prospect.

### Règles importantes

- le produit cherche à **empêcher le pitch trop tôt**,
- le scoring valorise le respect de la séquence commerciale,
- le ton pro compte aussi, mais moins que la logique commerciale,
- le prospect varie légèrement d’une session à l’autre,
- l’initiation est conçue comme un sas d’entrée avant les simulations.

---

## ⚙️ FONCTIONNEL

### Features actuelles

- home avec entrée dans le parcours,
- niveaux de formation visibles,
- niveau 0 en mode capsules + QCM / drills,
- simulations chat multi-niveaux,
- aide contextuelle ATTY,
- scoring process,
- scoring expression,
- débrief détaillé,
- historique local,
- réouverture de rapports récents,
- export rapport via génération HTML + impression navigateur,
- connexion cloud,
- synchronisation des sessions,
- connexion Google,
- connexion email magique,
- fonctionnement possible sans compte.

### Ce qui a été récemment ajouté

- architecture de parcours par niveaux,
- **niveau 0 initiation**,
- premiers modules de découverte produit,
- premiers drills/QCM,
- progression cloud avec Supabase,
- authentification Google,
- badges / éléments de progression sur l’accueil,
- amélioration partielle de la variation du prospect,
- réouverture des sessions récentes.

---

## 🗄️ BASE DE DONNÉES

### Tables

- **`training_sessions`**
  - **rôle**
    - stocker une version cloud simplifiée des sessions,
    - permettre de retrouver sa progression sur plusieurs appareils.
  - **champs clés**
    - `id`
    - `user_id`
    - `client_entry_id`
    - `saved_at`
    - `scenario_id`
    - `scenario_title`
    - `persona_name`
    - `persona_title`
    - `training_path_id`
    - `training_path_title`
    - `difficulty`
    - `score`
    - `max_score`
    - `percentage`
    - `process_percentage`
    - `expression_percentage`
    - `grade`
    - `attempts`
    - `help_requests_count`
    - `created_at`
    - `updated_at`

### Relations

- `training_sessions.user_id` → `auth.users.id`
- unicité métier : `user_id + client_entry_id`

### Ce que le front envoie réellement

Le frontend envoie aujourd’hui **un résumé de session**, pas la totalité du rapport.

Le payload cloud contient notamment :

- identifiants de scénario,
- persona,
- niveau,
- scores,
- pourcentage,
- nombre de tentatives,
- nombre d’aides demandées.

### Ce qui n’est pas stocké en cloud aujourd’hui

- le rapport complet,
- l’historique détaillé tour par tour,
- le contenu intégral du debrief,
- les réponses texte complètes de la conversation.

Ces éléments restent surtout **dans le navigateur** via `localStorage`.

---

## 🔐 SÉCURITÉ

- **Auth**
  - Supabase Auth,
  - Google OAuth configuré,
  - magic link email disponible en secours.

- **Gestion des accès**
  - chaque utilisateur authentifié ne peut accéder qu’à ses propres lignes cloud.

- **RLS**
  - **oui**,
  - activé sur `training_sessions`,
  - politiques `select / insert / update / delete` basées sur `auth.uid() = user_id`.

- **Points sensibles**
  - l’app est **frontend-only** : beaucoup de logique métier vit côté navigateur,
  - le **publishable key Supabase** est côté front, ce qui est normal, mais impose que les règles RLS restent propres,
  - le rapport complet n’est pas sécurisé côté navigateur si la machine est partagée,
  - le scoring peut théoriquement être manipulé côté client,
  - pas de couche serveur pour valider ou resigner les résultats.

---

## ⚠️ CHOIX VOLONTAIRES (IMPORTANT)

Compromis assumés à ce stade :

- **scoring côté frontend**
  - rapide à faire évoluer,
  - parfait pour un MVP,
  - pas suffisant si demain les scores ont un enjeu RH ou certification.

- **pas de backend custom**
  - très simple à déployer,
  - faible coût,
  - mais moins robuste pour des règles métier avancées.

- **rapport complet non synchronisé**
  - aujourd’hui la synchro cloud couvre surtout la progression,
  - pas encore l’archive intégrale des conversations et débriefs.

- **PDF basé sur impression navigateur**
  - simple,
  - sans dépendance serveur,
  - mais qualité visuelle et constance encore limitées.

- **conversation “semi-scriptée”**
  - pas de gros agent IA,
  - la logique repose sur des variantes, signaux et heuristiques,
  - volontaire pour rester simple et transmissible.

- **contenus en fichiers JS**
  - pratique pour itérer vite,
  - mais pas encore outillé pour un back-office de contenu.

---

## ❗ LIMITES ACTUELLES

- les réponses prospect ne sont **pas encore assez intelligentes** par rapport à ce que répond l’utilisateur,
- la cohérence conversationnelle est meilleure qu’au début, mais **reste parfois décalée**,
- la home reste un sujet UX important : onboarding encore perfectible,
- le rapport exporté est exploitable, mais **pas encore assez premium / brandé**,
- mobile encore à renforcer,
- pas de rôles utilisateurs métier,
- pas de gestion admin,
- pas de console de contenus,
- pas de suivi détaillé cloud des modules d’initiation,
- pas de stockage cloud du rapport complet,
- le magic link Supabase gratuit est vite limité,
- Google OAuth peut nécessiter des réglages supplémentaires si l’audience Google sort du mode test.

---

## 🎯 CE QUI EST ATTENDU ENSUITE

Priorités les plus logiques :

1. **améliorer fortement la cohérence des réponses prospect**
   - sans forcément basculer tout de suite sur un vrai agent IA.

2. **mieux articuler les niveaux**
   - niveau 0 : capsules / QCM,
   - niveau 1 : mix guidé,
   - niveau 2 : chat structuré,
   - niveau 3 : réticence réelle,
   - niveau 4 : expert / décideur exigeant.

3. **rendre le parcours plus lisible dès l’accueil**
   - savoir quoi faire dès l’arrivée,
   - mieux montrer l’avancement.

4. **améliorer le rapport**
   - design,
   - charte ATTRIO,
   - lisibilité,
   - valeur de transmission.

5. **préparer la transmission vers le vrai ATTY**
   - garder la séparation contenu / moteur / scoring,
   - éviter de durcir trop tôt un faux moteur conversationnel.

---

## 🧩 ZONES À DISCUTER / DÉCIDER

- **Faut-il stocker le rapport complet en cloud ?**
  - utile pour audit, relecture, coaching, reprise multi-device.

- **Faut-il garder la conversation locale/scriptée ou préparer déjà un provider conversationnel remplaçable ?**
  - recommandation : préparer une abstraction claire avant d’aller plus loin.

- **Faut-il conserver l’email magic link comme option principale ?**
  - probablement non,
  - Google est plus confortable pour les testeurs,
  - l’email peut rester en secours.

- **Faut-il introduire des rôles ?**
  - pas nécessaire pour le MVP,
  - probablement utile plus tard pour :
    - apprenant,
    - manager,
    - admin formation.

- **Faut-il sortir les contenus de formation du code ?**
  - pas urgent,
  - mais à envisager si l’équipe métier doit éditer souvent sans passer par un dev.

- **Faut-il brancher rapidement le vrai ATTY ?**
  - pas forcément,
  - l’enjeu court terme est surtout de laisser une base propre à transmettre.

---

## Résumé de transmission en une phrase

ATTRIO CAMPUS est aujourd’hui un **MVP web de formation commerciale structurée**, sans backend custom, avec logique métier majoritairement côté frontend, synchronisation cloud résumée via Supabase, et une architecture suffisamment claire pour être reprise, renforcée ou branchée plus tard au vrai ATTY.
