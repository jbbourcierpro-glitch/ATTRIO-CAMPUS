# DOCUMENTATION FONCTIONNELLE — ATTRIO CAMPUS

## 1. Vue d’ensemble

ATTRIO CAMPUS est une application web de formation organisée autour de trois grandes briques visibles pour l’utilisateur :

- **apprendre**,
- **simuler**,
- **suivre sa progression**.

L’application fonctionne même sans compte, puis peut être enrichie par une connexion cloud.

---

## 2. Parcours utilisateur global

### Cas 1 — utilisateur non connecté

1. Il arrive sur la home.
2. Il choisit soit :
   - l’initiation,
   - un scénario de simulation.
3. Il réalise ses modules ou sa simulation.
4. Son historique est conservé localement dans le navigateur.
5. Il peut relire les rapports récents sur le même appareil.

### Cas 2 — utilisateur connecté

1. Il arrive sur la home.
2. Il se connecte avec Google ou par lien magique email.
3. Il garde l’historique local.
4. Ses sessions sont aussi synchronisées dans le cloud.
5. Il peut retrouver sa progression sur un autre appareil.

---

## 3. Écrans principaux

## 3.1 Accueil

### Rôle

- point d’entrée du produit,
- orientation vers le bon niveau,
- mise en avant de la progression,
- accès rapide aux derniers cas ou à l’initiation.

### Contenus attendus

- identité ATTRIO CAMPUS,
- brief ATTY,
- carte compte / progression,
- résumé des niveaux,
- scénarios disponibles,
- progression récente.

### Fonction métier

L’écran doit aider l’utilisateur à comprendre immédiatement :

- où il en est,
- quoi faire maintenant,
- quelle est la prochaine marche logique.

---

## 3.2 Initiation

### Rôle

- faire entrer le débutant dans le système,
- proposer des capsules courtes,
- proposer des micro exercices simples.

### Types de contenu

- capsule texte,
- drill / QCM,
- enchaînement progressif.

### Attendu utilisateur

- apprendre sans stress,
- comprendre le terrain ATTRIO,
- comprendre les 8 étapes,
- découvrir le produit en langage simple.

---

## 3.3 Simulation

### Rôle

- mettre l’utilisateur en situation de vente.

### Composants principaux

- zone de message prospect,
- zone de saisie utilisateur,
- bouton d’aide,
- panneau coach ATTY,
- rappel de l’étape en cours.

### Fonctionnement

- le prospect expose une situation,
- l’utilisateur répond,
- le moteur analyse la réponse,
- l’étape suivante avance,
- le prospect répond,
- le cycle continue jusqu’au débrief final.

---

## 3.4 Débrief / rapport

### Rôle

- restituer la performance,
- expliquer les points forts,
- montrer les étapes à renforcer,
- proposer la suite logique.

### Contenus

- score global,
- score process,
- score expression,
- feedback global,
- historique étape par étape,
- recommandation de suite.

### Actions disponibles

- exporter en PDF,
- revenir à l’accueil,
- rejouer la simulation,
- rouvrir un rapport récent plus tard.

---

## 3.5 Progression / historique

### Rôle

- montrer l’activité passée,
- permettre de reprendre une session récente,
- visualiser l’avancement.

### Informations visibles

- nombre de sessions,
- score moyen,
- cas travaillés,
- derniers rapports récents,
- état de la synchronisation cloud.

---

## 4. Fonctionnement des niveaux

## 4.1 Niveau 0 — Initiation

### Type d’interaction

- capsules,
- QCM,
- drills.

### Guidage

- très fort.

### Objectif fonctionnel

- apprendre les bases avant toute simulation plus ouverte.

---

## 4.2 Niveau 1 — Fondations

### Type d’interaction

- chat guidé,
- amorces / prompts,
- premiers cas simples.

### Guidage

- fort.

### Objectif fonctionnel

- habituer l’utilisateur à dérouler le process sans le noyer.

---

## 4.3 Niveau 2 — Consolidation

### Type d’interaction

- chat plus libre,
- prospect avec premier frein réaliste.

### Guidage

- moyen.

### Objectif fonctionnel

- apprendre à conserver la structure malgré un existant ou une adoption fragile.

---

## 4.4 Niveau 3 — Avancé

### Type d’interaction

- chat avec vraie réticence.

### Guidage

- léger.

### Objectif fonctionnel

- gérer le changement, la prudence, la continuité d’exploitation.

---

## 4.5 Niveau 4 — Expert

### Type d’interaction

- chat expert face à un décideur exigeant.

### Guidage

- minimal.

### Objectif fonctionnel

- défendre une approche crédible face à des questions de ROI, gouvernance et déploiement.

---

## 5. Règles fonctionnelles clés

### 5.1 Règle de progression pédagogique

- un débutant doit pouvoir commencer par l’initiation,
- puis aller vers des simulations plus ouvertes,
- puis vers des cas plus tendus.

### 5.2 Règle de simulation

- chaque scénario suit les 8 étapes du process,
- chaque étape doit être visible et comprise,
- l’aide doit rester disponible si l’utilisateur bloque.

### 5.3 Règle d’évaluation

- la note reflète à la fois :
  - le respect du process,
  - la qualité d’expression.

### 5.4 Règle d’historique

- toute session terminée doit être conservée localement,
- un compte connecté peut en plus synchroniser la session en cloud.

### 5.5 Règle de récupération

- un rapport récent doit pouvoir être rouvert sans rejouer immédiatement le scénario,
- tant qu’il existe encore dans l’historique disponible.

---

## 6. Authentification et expérience utilisateur

### Modes disponibles

- **sans connexion**
  - mode local,
  - aucune dépendance cloud.

- **connexion Google**
  - recommandée,
  - plus fluide pour les testeurs.

- **connexion email**
  - secours,
  - plus fragile à cause des limites d’envoi.

### Ce que voit l’utilisateur

- état du compte,
- message de synchronisation,
- bouton de connexion / déconnexion,
- bouton de synchronisation manuelle.

---

## 7. Export de rapport

### Fonction

- permettre à l’utilisateur de repartir avec un compte-rendu de session.

### Comportement actuel

- génération d’un document HTML imprimable,
- ouverture du dialogue d’impression navigateur,
- export PDF piloté côté navigateur.

### Limite fonctionnelle

- selon le navigateur, un message sur les pop-ups ou l’impression peut apparaître.

---

## 8. Gestion des erreurs côté utilisateur

L’application doit rester utilisable même si :

- Supabase n’est pas configuré,
- le compte cloud ne répond pas,
- l’auth email est limitée,
- la synchro échoue.

### Comportement attendu

- ne jamais bloquer la simulation locale,
- afficher un message simple,
- conserver un mode dégradé propre.

---

## 9. Ce qui est déjà bien couvert fonctionnellement

- simulation complète,
- niveaux identifiés,
- progression locale,
- réouverture de sessions récentes,
- synchronisation cloud basique,
- authentification,
- initiation de base,
- feedback détaillé.

---

## 10. Limites fonctionnelles actuelles

- les réponses prospect ne réagissent pas encore assez finement à l’entrée utilisateur,
- la home peut encore mieux orienter le premier choix,
- la progression n’est pas encore matérialisée comme un vrai système de badges ou de déblocage fort,
- le rapport exporté n’a pas encore un niveau premium suffisant,
- la récupération cloud ne couvre pas encore le rapport détaillé complet.

---

## 11. Priorités fonctionnelles recommandées

1. améliorer la cohérence conversationnelle,
2. renforcer la lisibilité du parcours dès l’accueil,
3. mieux matérialiser la progression,
4. enrichir l’initiation,
5. améliorer la qualité du rapport exporté,
6. mieux couvrir le mobile.

---

## 12. Résumé fonctionnel en une phrase

ATTRIO CAMPUS permet aujourd’hui d’apprendre, de s’entraîner, de simuler et de suivre sa progression dans un parcours commercial ATTRIO, avec une logique locale d’abord, puis cloud en option.
