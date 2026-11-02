# Otaku Undercover — Web (mode en ligne)

Version web du jeu **Otaku Undercover**. On ne joue plus en se passant un seul écran : chaque
joueur crée ou rejoint un **salon** depuis son propre téléphone/ordinateur, via un **code à 5
caractères** ou un **lien d'invitation**, exactement comme sur des sites type AniGuessr/Skribbl.

## 1. Mode en ligne : ce qu'il faut savoir

Un vrai salon multijoueur en temps réel a besoin d'un petit service backend pour synchroniser
qui a rejoint, les rôles distribués, les votes, etc. entre tous les écrans connectés. Ce projet
utilise **Firebase Realtime Database** : un service gratuit de Google, aucune ligne de serveur
à écrire ou à héberger toi-même, tout se passe depuis le navigateur de chaque joueur.

### Créer ton projet Firebase (gratuit, 5 minutes)
1. Va sur [console.firebase.google.com](https://console.firebase.google.com) et crée un projet
   (nom libre, ex. "otaku-undercover").
2. Dans le menu de gauche : **Build → Realtime Database → Créer une base de données**.
   Choisis une région proche de tes joueurs, et démarre **en mode verrouillé** : les vraies
   règles sont à coller juste après (voir « Sécurité de la base » plus bas).
3. Toujours dans la console : icône ⚙️ → **Paramètres du projet** → en bas, section "Vos
   applications" → clique l'icône `</>` (Web) → donne un nom à l'app → **Enregistrer**.
   Firebase t'affiche alors un bloc `firebaseConfig = { apiKey: "...", ... }`.
4. Recopie ces valeurs dans un fichier `.env` à la racine du projet (duplique
   `.env.example` et renomme-le `.env`) :

```
VITE_FIREBASE_API_KEY=le apiKey fourni
VITE_FIREBASE_AUTH_DOMAIN=le authDomain fourni
VITE_FIREBASE_DATABASE_URL=le databaseURL fourni (commence par https://...)
VITE_FIREBASE_PROJECT_ID=le projectId fourni
VITE_FIREBASE_APP_ID=le appId fourni
```

Sans ce fichier `.env` rempli, le site affiche un message "Configuration requise" au lieu du
jeu — c'est normal, il manque juste ces clés.

### Sécurité de la base (obligatoire avant de publier)
Le mode test de Firebase laisse n'importe qui lire, modifier ou effacer la base pendant
30 jours, puis coupe tout l'accès. Le jeu utilise à la place des règles strictes, dans
`database.rules.json`, qui s'appuient sur une **connexion anonyme** (chaque visiteur reçoit
une identité Firebase invisible, sans compte ni e-mail) :

- il faut passer par le site (être connecté anonymement) pour lire ou écrire ;
- impossible de lister les salons ; sans en être membre, on ne voit d'un salon que sa
  phase (pour pouvoir le rejoindre), pas les joueurs ni la partie ;
- seuls les membres d'un salon peuvent lire et modifier sa partie ;
- chaque joueur ne peut créer ou modifier que sa propre fiche (pseudo de 24 caractères max) ;
- on ne peut rejoindre un salon que pendant qu'il est en attente (lobby) ;
- un salon ne peut être créé que par son hôte, et seul l'hôte peut le supprimer ;
- toute donnée qui ne fait pas partie de la structure du jeu est refusée.

Ménage automatique (pas de serveur nécessaire) : le dernier joueur qui quitte un salon le
supprime, et les salons abandonnés depuis plus de 12 h sont supprimés par le prochain
visiteur du site (index `roomAges`, qui ne contient que le code et la date de création).

À faire une fois dans la console Firebase :
1. **Build → Authentication → Commencer**, puis onglet **Sign-in method** → **Anonyme** →
   activer → **Enregistrer**.
2. **Build → Realtime Database → Règles** : remplace tout par le contenu de
   `database.rules.json`, puis **Publier**.

Pour tester ces règles en local avec les émulateurs Firebase (Java requis) : lance
`firebase emulators:start --only database,auth`, puis le site avec la variable
`VITE_FIREBASE_EMULATOR=1` (il se branche alors sur les émulateurs au lieu de la vraie base).

## 2. Lancer le projet en local

Il te faut [Node.js](https://nodejs.org) (version 18 ou plus).

```bash
npm install       # installe les dépendances (une seule fois)
npm run dev        # lance le site en local sur http://localhost:5173
```

Pour préparer la version finale à mettre en ligne :

```bash
npm run build       # crée le dossier dist/ avec le site prêt à publier
npm run preview      # pour vérifier dist/ en local avant de publier
```

Teste avec deux onglets/navigateurs différents (ou ton téléphone + ton ordi) pour simuler
plusieurs joueurs dans le même salon.

## 3. Publier le site sur internet

### Option A — Vercel (recommandé, le plus simple)
1. Crée un compte sur [vercel.com](https://vercel.com) (connexion via GitHub).
2. Mets ce projet sur GitHub (`git init`, `git add .`, `git commit`, `git push`).
3. Sur Vercel : "Add New Project" → choisis ton dépôt (Vite détecté automatiquement).
4. **Important** : dans les réglages du projet Vercel → "Environment Variables", ajoute les
   5 mêmes variables `VITE_FIREBASE_...` que dans ton `.env` local (le fichier `.env` n'est
   jamais envoyé sur GitHub par sécurité, il faut les redonner à Vercel séparément).
5. Clique "Deploy". Ton site est en ligne en 1-2 minutes.

### Option B — Netlify
Même principe sur [netlify.com](https://netlify.com) : commande de build `npm run build`,
dossier à publier `dist`, et penser à ajouter les variables d'environnement `VITE_FIREBASE_...`
dans les réglages du site.

### Ton propre nom de domaine
Une fois en ligne, tu peux brancher un nom de domaine acheté chez OVH/Gandi/etc. (10-15 €/an)
dans les réglages "Domains" de Vercel/Netlify.

## 4. Monétisation avec des publicités

Le site garde ses deux colonnes publicitaires (gauche/droite sur ordinateur, bannière en bas
sur mobile), gérées dans `src/components/AdSlot.jsx`.

1. Le site doit être en ligne avec un vrai nom de domaine (AdSense n'accepte pas localhost).
2. Crée un compte sur [adsense.google.com](https://adsense.google.com), ajoute ton site.
3. Colle le script fourni par Google dans `index.html`, à l'endroit indiqué par le commentaire.
4. Google relit le site (jusqu'à 2 semaines) avant validation. Garde le site stable et
   accessible pendant ce temps. Comme il est en français, complète l'expérience avec des
   mentions légales et une politique de confidentialité si tu veux maximiser tes chances.
5. Une fois validé, crée tes blocs d'annonces (Rectangle 300×250 pour les colonnes, Bannière
   728×90 pour mobile) et colle leur code dans `AdSlot.jsx` à la place des emplacements
   d'exemple.
6. **RGPD** : dès que les pubs sont personnalisées, un bandeau de consentement aux cookies est
   obligatoire en France/UE. Le plus simple : activer **Google Funding Choices**, gratuit,
   directement dans ton compte AdSense.
7. Paiement mensuel par Google à partir de 70 € cumulés, par virement.

## 5. Structure du projet

```
src/
  App.jsx               -> orchestre : accueil / créer / rejoindre / salon / partie
  firebase.js            -> connexion à ta base Firebase (clés lues depuis .env)
  index.css              -> tous les styles (thème sombre façon portail de jeu)
  components/            -> boutons, stepper, avatar joueur, AdSlot...
  screens/
    HomeScreen            -> page d'accueil (Créer un salon / Rejoindre un salon)
    CreateRoomScreen       -> saisie du pseudo pour créer un salon
    JoinRoomScreen          -> saisie du code + pseudo pour rejoindre
    LobbyScreen              -> salon d'attente : code, lien d'invitation, joueurs, réglages hôte
    AnimeSelectionScreen      -> choix des univers d'animés (hôte uniquement)
    RoleRevealScreen           -> révélation privée du rôle, sur son propre écran
    ClueOrderScreen              -> ordre de passage pour les indices
    VoteScreen                    -> vote en direct, tally live
    EliminationScreen              -> résultat du vote + tentative de Mr. White
    GameOverScreen                  -> résultats finaux, rejouer / retour au salon
  data/animeDatabase.js -> base des animés (paires civil/undercover)
  utils/
    gameLogic.js        -> distribution des rôles, condition de victoire
    room.js               -> toutes les opérations de salon (créer, rejoindre, voter...)
```

Tout l'état de partie (joueurs, rôles, votes, phase) vit dans Firebase Realtime Database, sous
`rooms/{code}`, et se synchronise en direct sur l'écran de chaque joueur connecté au salon.
Un salon n'est jamais automatiquement supprimé pour l'instant — si tu veux un nettoyage
automatique des vieux salons plus tard, on peut ajouter une petite règle d'expiration, dis-le
moi.
