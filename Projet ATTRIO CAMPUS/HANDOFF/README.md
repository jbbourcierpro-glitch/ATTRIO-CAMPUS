# HANDOFF — ATTRIO CAMPUS

Ce dossier décrit la logique de transmission du POC vers un dossier partagé métier / produit.

## Objectif

Pouvoir mettre à disposition de Fab :

- une version propre du code utile,
- la documentation de reprise,
- les éléments nécessaires si le POC doit devenir une vraie app.

## Principe

Le projet reste la source de vérité locale.

Le dossier partagé reçoit un **export propre** :

- sans secrets,
- sans `node_modules`,
- sans build local inutile,
- avec la documentation à jour.

## Commande

Depuis le projet :

```bash
npm run handoff:export
```

## Cible actuelle

Le script exporte vers :

`/Users/jb/Library/Mobile Documents/com~apple~CloudDocs/Attrio/POC JB/CAMPUS`

## Contenu exporté

- `documentation/`
- `source/`
- `README-PARTAGE.md`

## Contenu exclu

- `.env.local`
- `node_modules`
- `dist`
- `.git`
- fichiers système macOS

## Idée de réutilisation

Pour les autres projets POC, on pourra reprendre exactement la même mécanique :

- un script d’export,
- un dossier partagé dédié,
- une documentation structurée.
