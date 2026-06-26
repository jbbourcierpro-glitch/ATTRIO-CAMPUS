# DOCUMENTATION TECHNIQUE — ATTRIO CAMPUS

## 1. Stack actuelle

- **Frontend**
  - Vite
  - JavaScript ES modules
  - CSS custom

- **Backend**
  - aucun backend applicatif dédié

- **Base de données**
  - Supabase Postgres

- **Auth**
  - Supabase Auth
  - Google OAuth
  - Email OTP / magic link

- **Déploiement**
  - Vercel

---

## 2. Architecture technique

### Architecture réelle

```text
Navigateur
  ├── rendu UI
  ├── logique métier
  ├── scoring
  ├── historique local
  ├── export rapport
  └── appel direct à Supabase
         ├── auth
         └── training_sessions
```

### Conséquence technique

Le projet repose aujourd’hui sur une architecture **frontend-first** :

- pas de serveur Node métier,
- pas d’API proxy,
- pas de validation backend des scores.

---

## 3. Point d’entrée

- `src/main.js`

Ce fichier concentre aujourd’hui :

- l’état global,
- les écrans,
- le rendu,
- l’auth,
- la synchro cloud,
- l’historique local,
- le reporting,
- les handlers UI.

### Remarque

`src/main.js` joue à la fois un rôle :

- de contrôleur UI,
- de store,
- d’orchestrateur métier.

Pour un MVP, c’est acceptable. Pour une V2 plus lourde, il faudra le découper.

---

## 4. Structure technique du code

### `src/data`

Rôle :

- stocker le contenu structuré et déclaratif.

Fichiers clés :

- `training-paths.js`
  - définit les niveaux,
  - interaction,
  - guidage,
  - difficulté,
  - liens scénario ↔ parcours.

- `learning-modules.js`
  - définit les capsules et drills de l’initiation.

- `scenarios.js`
  - contient les scénarios conversationnels.

- `personas.js`
  - contient les personas prospects.

- `sales-process.js`
  - contient les 8 étapes métier du process ATTRIO.

### `src/engines`

Rôle :

- isoler la logique métier centrale.

Fichiers clés :

- `simulation-engine.js`
  - moteur principal de session,
  - enchaîne les étapes,
  - appelle les moteurs d’analyse,
  - produit le débrief final.

- `conversation-engine.js`
  - adapte la réponse du prospect,
  - exploite des signaux conversationnels,
  - tente de sélectionner la variante la plus cohérente.

- `scoring-engine.js`
  - transforme les tours en scores,
  - consolide les résultats,
  - génère forces / watchouts / headline.

- `expression-engine.js`
  - mesure la forme du message utilisateur :
    - ton,
    - clarté,
    - précision.

- `coach-engine.js`
  - génère le brief ATTY,
  - les aides contextuelles,
  - les rappels d’étapes.

### `src/lib`

- `supabase.js`
  - initialise le client Supabase à partir de :
    - `VITE_SUPABASE_URL`
    - `VITE_SUPABASE_PUBLISHABLE_KEY`

### `src/engine.js`

- simple ré-export du moteur de simulation.

---

## 5. Gestion d’état

L’état principal vit dans `src/main.js` via un objet `state`.

### Exemples de responsabilités stockées dans `state`

- écran courant,
- scénario sélectionné,
- module d’apprentissage sélectionné,
- messages chat,
- débrief,
- historique des sessions,
- état d’auth,
- état de synchronisation,
- progression des modules d’initiation.

### Stockage local

Deux clés `localStorage` structurent le stockage principal :

- `attrio-campus-session-history-v1`
- `attrio-campus-learning-progress-v1`

### Limite

L’application reste très dépendante du navigateur courant si l’utilisateur ne se connecte pas.

---

## 6. Flux technique d’une simulation

### Démarrage

1. sélection d’un scénario,
2. `SimulationEngine.startScenario(scenario)`,
3. choix d’une variante de message prospect,
4. affichage de la première situation.

### Tour utilisateur

1. utilisateur envoie sa réponse,
2. `analyzeResponse(userText)` :
   - règles de l’étape,
   - scoring process,
   - scoring expression,
   - extraction de signaux conversationnels.

3. `commitTurn()` :
   - push dans l’historique,
   - score cumulé,
   - adaptation de la prochaine réponse prospect.

### Fin de simulation

1. `getDebriefing()`
2. génération du résumé,
3. stockage local,
4. synchro cloud si utilisateur connecté.

---

## 7. Adaptation du prospect

La logique actuelle n’est pas une IA générative.

Elle repose sur :

- messages de base par étape,
- variantes,
- signaux extraits du message utilisateur,
- sélection de la prochaine formulation la plus adaptée.

### Intérêt

- simple,
- lisible,
- pilotable,
- facilement transmissible.

### Limite

- la cohérence reste partielle,
- la réponse peut encore sembler “à côté de la plaque” quand l’utilisateur répond de manière plus subtile.

---

## 8. Scoring technique

Le score final combine :

- **score process**
  - basé sur les règles métier de l’étape,

- **score expression**
  - basé sur la forme du message.

### Pondérations actuelles

Les pondérations changent selon le niveau du scénario.

Exemple :

- fondations : plus de poids au process,
- expert : équilibre plus marqué entre fond et forme.

### Conséquence

Le scoring est volontairement pédagogique, pas “scientifique”.

---

## 9. Authentification

### Implémentation

Le client Supabase est configuré avec :

- `persistSession: true`
- `autoRefreshToken: true`
- `detectSessionInUrl: true`

### Parcours supportés

- Google OAuth,
- email OTP / magic link.

### Comportement

- si session détectée :
  - l’utilisateur est considéré connecté,
  - la synchro cloud peut démarrer.

- si aucune session :
  - le mode local continue normalement.

---

## 10. Synchronisation cloud

### Table utilisée

- `public.training_sessions`

### Ce qui est envoyé

Le front envoie aujourd’hui un objet réduit via `mapHistoryEntryToCloudRow()`.

Champs envoyés :

- score,
- pourcentages,
- titre du scénario,
- niveau,
- persona,
- attempts,
- help requests,
- métadonnées de session.

### Ce qui n’est pas envoyé

- contenu détaillé du rapport,
- détail complet de l’historique des tours,
- transcript complet.

### Conséquence

Le cloud sert surtout de **sauvegarde de progression**, pas encore d’archive complète.

---

## 11. Base Supabase

Le script de référence est :

- `supabase/training_sessions.sql`

### Ce qu’il fait

- crée la table `training_sessions`,
- ajoute un index métier sur `user_id` et `saved_at`,
- crée un trigger `updated_at`,
- active RLS,
- crée les policies CRUD par utilisateur authentifié.

### Dépendance

Le schéma dépend de `auth.users`.

---

## 12. Sécurité technique

### Ce qui est propre

- publishable key côté front seulement,
- RLS activé,
- accès filtré par `auth.uid()`,
- secret Google stocké côté Supabase, pas dans le front.

### Ce qui est fragile ou limité

- aucune validation serveur du score,
- historique local modifiable par l’utilisateur avancé,
- rapport complet non protégé s’il reste en local sur une machine partagée,
- beaucoup de logique métier dans `main.js`,
- architecture très front-heavy.

---

## 13. Export de rapport

### Mécanisme actuel

- génération HTML complète du rapport,
- injection dans un `iframe` caché,
- appel à `print()` du navigateur,
- fallback de téléchargement HTML si besoin.

### Avantages

- zéro dépendance serveur,
- rapide à itérer.

### Limites

- qualité visuelle dépend du navigateur,
- pas un vrai moteur PDF,
- peut déclencher des messages navigateur autour de l’impression.

---

## 14. Scripts et utilitaires

### `scripts/desktop-start.mjs`

- lancement desktop local.

### `scripts/build-native-launchers.sh`

- build des lanceurs natifs.

### `scripts/build-windows-launcher.ps1`

- script Windows.

### `scripts/make_icns.py` / `scripts/make_ico.py`

- génération des icônes lanceurs.

---

## 15. Déploiement

### Local

- `npm run dev`
- `npm run build`
- `npm run preview`

### Web

- dépôt GitHub,
- build Vercel,
- variables d’environnement Vercel :
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`

### Auth Google

Nécessite :

- Google Cloud client OAuth,
- callback Supabase,
- Google provider activé dans Supabase.

---

## 16. Dette technique actuelle

### Dette modérée

- `main.js` trop central,
- séparation partielle seulement entre UI et logique applicative,
- documentation technique encore jeune,
- home / mobile encore en itération.

### Dette forte

- moteur conversationnel encore heuristique,
- transcript détaillé non synchronisé,
- export PDF encore artisanal,
- pas de couche d’abstraction prête pour brancher un vrai provider IA.

---

## 17. Recommandations techniques naturelles

### Court terme

- extraire un `progression-engine`,
- extraire un `report-engine`,
- stocker aussi le rapport complet si besoin de reprise multi-appareil,
- fiabiliser l’adaptation conversationnelle.

### Moyen terme

- introduire une abstraction de provider conversationnel,
- préparer un provider coaching séparé,
- découper `main.js` par domaine :
  - auth,
  - progression,
  - rendu accueil,
  - rendu simulation,
  - reporting.

### Long terme

- décider si ATTRIO CAMPUS reste un front autonome,
- ou devient une brique intégrée à l’écosystème ATTRIO / ATTY.

---

## 18. Résumé technique en une phrase

ATTRIO CAMPUS est aujourd’hui une SPA Vite sans backend métier, avec logique de simulation et de scoring côté frontend, synchronisation cloud résumée via Supabase, et une architecture simple mais encore très centralisée autour de `src/main.js`.
