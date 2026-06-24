# Déploiement web Vercel

## Statut actuel

Le projet `ATTRIO CAMPUS` est déjà compatible avec un déploiement web statique :

- build de production OK via `npm run build`
- preview HTTP local OK via `npm run preview`
- aucune dépendance backend obligatoire pour l'expérience actuelle
- aucune dépendance Electron, Tauri ou serveur Node dans `src/`

## Important

Le dépôt contient des lanceurs desktop à la racine, mais l'application web à déployer se trouve dans :

`Projet ATTRIO CAMPUS`

Dans Vercel, il faudra donc définir :

- **Root Directory** : `Projet ATTRIO CAMPUS`
- **Framework Preset** : `Vite`
- **Build Command** : `npm run build`
- **Output Directory** : `dist`

## Déploiement via GitHub + Vercel

1. pousser le dépôt sur GitHub
2. créer un nouveau projet sur Vercel
3. connecter le dépôt GitHub
4. sélectionner le bon dossier racine : `Projet ATTRIO CAMPUS`
5. lancer le déploiement

## Ce qui est déjà 100% web

- choix du parcours de formation
- sélection de scénarios
- simulation conversationnelle
- coaching ATTY
- scoring
- aide contextuelle
- export PDF via impression navigateur
- variantes de réponses prospect
- stockage local léger via `localStorage`

## Ce qui manque pour un vrai produit SaaS

Le MVP actuel fonctionne en web, mais reste un front-end autonome.

À prévoir ensuite si vous voulez un produit complet :

- authentification utilisateur
- sauvegarde cloud des sessions et scores
- historique multi-appareils
- dashboard manager / formateur
- analytics de progression
- moteur ATTY branché sur une vraie IA distante si souhaité
- base de données scénarios / résultats

## Limites actuelles en mode full web

- les résultats sont locaux au navigateur actuel
- l'export PDF dépend du `print` du navigateur
- pas de compte utilisateur
- pas de synchronisation entre commerciaux

## Recommandation MVP

Étape 1 :

- déployer tel quel sur Vercel pour tester l'usage réel

Étape 2 :

- brancher une brique backend légère pour persister les résultats

Étape 3 :

- faire évoluer ATTY vers un coach IA connecté si besoin
