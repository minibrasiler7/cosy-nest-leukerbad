# Cosy Nest – Leukerbad

Site d'accueil des voyageurs du studio (QR code dans le cadre photo).

- `index.html` : page voyageurs. Détecte la langue du téléphone (FR, DE, EN, IT, ES). Affiche les prénoms du séjour en cours.
- `admin.html` : espace hôte, protégé par mot de passe. Séjours (prénoms, langue, dates) et réglages (Wi‑Fi, heures, téléphone, place de parc).
- `Code.gs` : script Google (Apps Script) à installer une fois. Il stocke les données dans une feuille Google Sheets et vérifie le mot de passe.
- `config.js` : adresse du script Google.

Adresses une fois GitHub Pages activé :
- Voyageurs : `https://minibrasiler7.github.io/cosy-nest-leukerbad/`
- Espace hôte : `https://minibrasiler7.github.io/cosy-nest-leukerbad/admin.html`

## Installation du script Google (une seule fois, environ 5 minutes)

1. Ouvrir [sheets.new](https://sheets.new). Nommer la feuille « Cosy Nest – séjours ».
2. Menu **Extensions → Apps Script**. Un éditeur s'ouvre avec un fichier `Code.gs`.
3. Effacer tout le contenu de `Code.gs`. Coller le contenu du fichier `Code.gs` de ce dépôt. Enregistrer (icône disquette ou Ctrl+S).
4. En haut à droite : **Déployer → Nouveau déploiement**. Cliquer sur la roue dentée, choisir **Application Web**.
   - Description : `Cosy Nest`
   - Exécuter en tant que : **Moi**
   - Qui a accès : **Tout le monde**
5. **Déployer**, puis **Autoriser l'accès**. Choisir le compte Google. Si Google affiche « Cette application n'est pas validée » : **Paramètres avancés → Accéder à Cosy Nest (non sécurisé) → Autoriser**. C'est normal : le script est le vôtre.
6. Copier l'**URL de l'application Web** (elle se termine par `/exec`).
7. Dans ce dépôt, ouvrir `config.js` et coller l'URL entre les guillemets : `api: "https://script.google.com/macros/s/.../exec"`. Valider la modification (commit).

Ensuite, ouvrir `admin.html`, entrer le mot de passe, saisir le premier séjour et les réglages, puis **Enregistrer**.

## Changer le mot de passe

Dans l'éditeur Apps Script : modifier la ligne `var ADMIN_PASSWORD = '...';`, enregistrer, puis **Déployer → Gérer les déploiements → crayon → Version : Nouvelle version → Déployer**. Sans nouvelle version, l'ancien code reste actif.

## Tester l'accueil sans enregistrer

Ajouter `?nom=Marie,Thomas&lang=de` à l'adresse de la page voyageurs.

## Activer GitHub Pages

Dans le dépôt : **Settings → Pages → Build and deployment → Source : Deploy from a branch → Branch : main, dossier / (root) → Save**. La page est en ligne une à deux minutes plus tard.
