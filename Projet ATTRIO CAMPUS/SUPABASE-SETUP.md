# Supabase — mise en place rapide

## 1. Variables locales

Créer un fichier `.env.local` dans `Projet ATTRIO CAMPUS/` :

```bash
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxx
```

## 2. Table de progression

Dans Supabase :

1. Ouvre `SQL Editor`
2. Crée une nouvelle requête
3. Copie le contenu de `supabase/training_sessions.sql`
4. Clique sur `Run`

## 3. Auth email magique

Dans Supabase :

1. Ouvre `Authentication`
2. Vérifie que `Email` est activé
3. Laisse le mode magic link actif

## 4. Variables Vercel

Dans Vercel > projet `attrio-campus` > `Settings` > `Environment Variables` :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Puis redéploie.

## 5. Comportement prévu

- Sans connexion : historique local uniquement
- Avec connexion : historique local + synchro cloud
- Si Supabase n'est pas prêt : l'app continue de fonctionner en local
