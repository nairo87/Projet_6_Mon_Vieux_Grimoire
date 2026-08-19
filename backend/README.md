# Mon Vieux Grimoire

Application web de notation de livres — projet "Mon Vieux Grimoire" (parcours
Développeur Web, OpenClassrooms, projet 7).

L'application est composée de deux parties séparées :
- **`backend/`** : une API REST en Node.js / Express / MongoDB (ce dépôt/dossier).
- **`frontend/`** : une interface React fournie par OpenClassrooms
  ([dépôt officiel](https://github.com/OpenClassrooms-Student-Center/P7-Dev-Web-livres)).

Ce README explique comment faire tourner **les deux** sur n'importe quel
ordinateur, de zéro.

---

## Sommaire

1. [Prérequis](#1-prérequis)
2. [Récupérer le projet](#2-récupérer-le-projet)
3. [Installer et configurer le backend](#3-installer-et-configurer-le-backend)
4. [Installer et lancer le frontend](#4-installer-et-lancer-le-frontend)
5. [Vérifier que tout fonctionne](#5-vérifier-que-tout-fonctionne)
6. [Structure du projet (backend)](#6-structure-du-projet-backend)
7. [Routes de l'API](#7-routes-de-lapi)
8. [Dépannage (FAQ)](#8-dépannage-faq)

---

## 1. Prérequis

À installer une seule fois sur la machine :

| Outil | Version conseillée | Vérifier avec |
|---|---|---|
| [Node.js](https://nodejs.org/) (inclut npm) | 18 LTS ou plus récent | `node -v` |
| [Git](https://git-scm.com/) | dernière version | `git -v` |
| Un compte [MongoDB Atlas](https://www.mongodb.com/atlas) (gratuit) | — | — |

Aucune installation locale de MongoDB n'est nécessaire : le projet utilise un
cluster **MongoDB Atlas** (cloud, gratuit) plutôt qu'une base installée sur la
machine.

---

## 2. Récupérer le projet

```bash
git clone <url-de-votre-dépôt> mon-vieux-grimoire
cd mon-vieux-grimoire
```

Le dossier doit contenir (au minimum) un dossier `backend/`. Si le frontend
n'est pas déjà inclus, voir l'[étape 4](#4-installer-et-lancer-le-frontend)
pour le récupérer séparément.

---

## 3. Installer et configurer le backend

### 3.1 Installer les dépendances

```bash
cd backend
npm install
```

### 3.2 Créer une base de données MongoDB Atlas

Si ce n'est pas déjà fait :

1. Créez un compte gratuit sur [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Créez un nouveau **cluster gratuit** (M0).
3. Dans **Database Access**, créez un utilisateur (identifiant + mot de passe).
   ⚠️ Évitez les caractères spéciaux (`@`, `#`, `%`, `/`...) dans le mot de
   passe, ou encodez-les en URL si nécessaire.
4. Dans **Network Access**, autorisez votre IP (ou `0.0.0.0/0` pendant le
   développement, pour autoriser toutes les IP).
5. Dans **Database → Connect → Drivers**, copiez la chaîne de connexion.
   Elle ressemble à :
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```

### 3.3 Configurer les variables d'environnement

```bash
cp .env.example .env
```

Ouvrez le fichier `.env` créé et complétez-le :

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/monvieuxgrimoire?retryWrites=true&w=majority
JWT_SECRET=une_chaine_secrete_longue_et_aleatoire_a_vous
PORT=4000
```

- Remplacez `<user>`, `<password>` et `<cluster>` par vos vraies valeurs Atlas.
- `JWT_SECRET` peut être n'importe quelle chaîne de caractères longue et
  aléatoire (elle sert à signer les tokens de connexion). Exemple pour en
  générer une rapidement :
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- Ne commitez jamais ce fichier `.env` (il est déjà ignoré par `.gitignore`).

### 3.4 Démarrer le serveur

```bash
npm start
```

Vous devriez voir dans le terminal :
```
Connexion à MongoDB réussie !
Serveur en écoute sur port 4000
```

L'API est maintenant disponible sur `http://localhost:4000`.

---

## 4. Installer et lancer le frontend

Si le frontend n'est pas déjà dans le projet, récupérez-le dans un dossier
séparé (à côté de `backend/`, pas dedans) :

```bash
git clone https://github.com/OpenClassrooms-Student-Center/P7-Dev-Web-livres.git frontend
cd frontend
npm install
npm start
```

Cela ouvre automatiquement l'application dans le navigateur sur
`http://localhost:3000`, qui communique avec l'API backend sur le port 4000.

**Le backend doit être démarré avant (ou en même temps que) le frontend**,
sinon les appels à l'API échoueront.

---

## 5. Vérifier que tout fonctionne

1. Le terminal du backend affiche `Connexion à MongoDB réussie !` et
   `Serveur en écoute sur port 4000`.
2. `http://localhost:3000` affiche la page de connexion de l'application.
3. Créez un compte (Sign Up), connectez-vous (Login).
4. Ajoutez un livre avec une image, un titre, un auteur, une année, un genre
   et une note.
5. Le livre apparaît sur la page d'accueil avec son image, sa note moyenne
   s'affiche, et vous pouvez le modifier/supprimer (bouton visible
   uniquement sur les livres que vous avez créés).

---

## 6. Structure du projet (backend)

```
backend/
├── app.js                   # configuration Express, CORS, connexion Mongo
├── server.js                 # création du serveur HTTP, gestion du port
├── models/
│   ├── User.js                # schéma Mongoose des utilisateurs
│   └── Book.js                # schéma Mongoose des livres (+ notations)
├── routes/
│   ├── auth.js                 # /api/auth/signup, /api/auth/login
│   └── books.js                 # /api/books/*
├── controllers/
│   ├── auth.js                 # logique inscription/connexion
│   └── books.js                 # logique CRUD livres + notation
├── middleware/
│   ├── auth.js                  # vérification du token JWT
│   └── multer-config.js         # réception des images uploadées
├── images/                    # images optimisées (.webp), générées au runtime
├── .env                       # vos variables d'environnement (non commité)
├── .env.example                # modèle à copier
└── package.json
```

---

## 7. Routes de l'API

Base URL locale : `http://localhost:4000/api`

| Méthode | Route | Auth requise | Description |
|---|---|---|---|
| POST | `/auth/signup` | non | Créer un compte |
| POST | `/auth/login` | non | Se connecter, renvoie `{ userId, token }` |
| GET | `/books` | non | Liste de tous les livres |
| GET | `/books/bestrating` | non | Les 3 livres les mieux notés |
| GET | `/books/:id` | non | Détail d'un livre |
| POST | `/books` | oui | Créer un livre (image + note initiale) |
| PUT | `/books/:id` | oui (auteur uniquement) | Modifier un livre |
| DELETE | `/books/:id` | oui (auteur uniquement) | Supprimer un livre |
| POST | `/books/:id/rating` | oui | Noter un livre (une fois par utilisateur) |

Les routes protégées attendent un en-tête :
```
Authorization: Bearer <token>
```

---

## 8. Dépannage (FAQ)

### `Connexion à MongoDB échouée : ... got "undefined"`
Le fichier `.env` est absent, mal placé, ou `MONGODB_URI` n'y est pas défini.
→ Vérifiez qu'il existe bien un fichier nommé exactement `.env` (pas
`.env.txt`) directement dans `backend/`, avec `MONGODB_URI=...` sans espaces
ni guillemets autour du `=`.

### `querySrv ECONNREFUSED _mongodb._tcp....mongodb.net`
Le résolveur DNS de votre machine (souvent sous Windows, réseaux
d'entreprise/école, ou certaines box internet) n'arrive pas à résoudre les
enregistrements DNS SRV utilisés par les URI `mongodb+srv://`.
→ `app.js` force déjà un résolveur DNS public (`1.1.1.1`, `8.8.8.8`) au
démarrage pour contourner ce problème. Si l'erreur persiste malgré tout,
utilisez la chaîne de connexion "non-SRV" fournie par Atlas (option
**"Standard connection string"** au lieu de **"SRV"** dans l'écran Connect).
