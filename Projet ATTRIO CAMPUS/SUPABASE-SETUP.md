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

## 3. Auth Google recommandée

### Côté Google Cloud

1. Créer un projet dans `Google Cloud`
2. Ouvrir `Google Auth Platform`
3. Configurer l'écran de consentement
4. Créer un client OAuth `Web application`
5. Ajouter :
   - `Authorized JavaScript origins`
     - `https://attrio-campus.vercel.app`
     - `http://localhost:5173`
   - `Authorized redirect URIs`
     - `https://rhrgsooqlwgnbpegbytm.supabase.co/auth/v1/callback`
6. Récupérer le `Client ID` et le `Client Secret`

### Côté Supabase

1. Ouvrir `Authentication`
2. Ouvrir `Providers`
3. Activer `Google`
4. Coller le `Client ID`
5. Coller le `Client Secret`
6. Dans `URL Configuration`, vérifier :
   - `Site URL` = `https://attrio-campus.vercel.app`
   - ajouter aussi `http://localhost:5173` dans les URLs autorisées si besoin

## 4. Auth email magique (secours)

Dans Supabase :

1. Ouvre `Authentication`
2. Vérifie que `Email` est activé
3. Laisse le mode magic link actif

⚠️ Avec le provider email intégré de Supabase, les envois sont très limités sur le plan gratuit. Google est donc la meilleure option pour plusieurs testeurs.

## 5. Variables Vercel

Dans Vercel > projet `attrio-campus` > `Settings` > `Environment Variables` :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Puis redéploie.

## 6. Comportement prévu

- Sans connexion : historique local uniquement
- Avec connexion Google ou email : historique local + synchro cloud
- Si Supabase n'est pas prêt : l'app continue de fonctionner en local
