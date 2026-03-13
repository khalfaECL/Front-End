# Secugram — Frontend React Native

Interface Android-first pour le système décentralisé de gestion d'images chiffrées.

---

## Architecture

```
secugram-rn/
├── App.js                          ← Point d'entrée, FLAG_SECURE (anti-screenshot)
├── src/
│   ├── config.js                   ← API_BASE_URL, API_TIMEOUT_MS
│   ├── api/
│   │   └── index.js                ← Tous les appels API (/api/*) + normaliseurs
│   ├── hooks/
│   │   ├── useAuth.js              ← Contexte auth (token JWT en mémoire uniquement)
│   │   └── useTheme.js             ← Thème + viewCooldown (intervalle entre vues)
│   ├── navigation/
│   │   └── AppNavigator.js         ← Tab nav + Auth gate + menu info
│   ├── screens/
│   │   ├── LoginScreen.js          ← Connexion / Inscription
│   │   ├── MyPhotosScreen.js       ← Galerie personnelle (dépôt, blocage, historique)
│   │   ├── SharedScreen.js         ← Images partagées avec moi + viewer éphémère
│   │   ├── HistoryScreen.js        ← Historique accès (mes images / mes accès)
│   │   └── ProfileScreen.js        ← Session + intervalle entre vues
│   ├── components/
│   │   ├── UI.js                   ← Composants réutilisables
│   │   └── UploadModal.js          ← Bottom sheet : image → autorisations → dépôt
│   └── theme/
│       └── index.js                ← Couleurs, radius, espacement
└── package.json
```

---

## Installation

### Prérequis
- Node.js ≥ 18
- Android Studio + SDK (API 33+)
- JDK 17

### 1. Initialiser le projet React Native

```bash
npx react-native init secugram --version 0.76.5
cd secugram
```

### 2. Copier les fichiers source

Remplacer `App.js` et copier le dossier `src/` dans le projet.

### 3. Installer les dépendances

```bash
npm install react-native-image-picker
```

### 4. Configuration Android

Dans `android/app/src/main/AndroidManifest.xml` :

```xml
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES"/>
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
    android:maxSdkVersion="32"/>
<uses-permission android:name="android.permission.INTERNET"/>
```

### 5. Lancer

```bash
npm start          # Metro bundler
npm run android    # Dans un autre terminal
```

---

## Configuration API

Modifier `src/config.js` :

```js
// Émulateur Android → hôte machine
export const API_BASE_URL = 'http://10.0.2.2:3000/api';

// Appareil physique → IP de votre machine sur le réseau local
export const API_BASE_URL = 'http://192.168.1.XX:3000/api';

// Production
export const API_BASE_URL = 'https://api.secugram.io/api';

// Timeout (le Tiers de Confiance peut être lent)
export const API_TIMEOUT_MS = 30_000;
```

---

## Mode démo

Toutes les actions réseau sont bypassées si `session.isDemo === true`.
Pour activer : utiliser les identifiants `demo` / `demo` sur l'écran de connexion.
Les données mock sont définies en tête de chaque écran (`MOCK_*`).

---

## Sécurité implémentée (côté frontend)

| Mesure | Implémentation |
|--------|----------------|
| Pas de persistance du token | JWT stocké en mémoire React (`useState`) uniquement |
| Token JWT 1h | Vérification `expiresAt` dans `useAuth` |
| Anti-screenshot | `FLAG_SECURE` activé dans `App.js` (Android) |
| Image jamais stockée en clair | `base64` envoyé → le Tiers chiffre AES-256 |
| Viewer éphémère | Auto-fermeture + barre de compte à rebours |
| Quota de vues | Vérifié localement et côté serveur |
| Cooldown entre vues | Configurable dans Profil (1–60 min, défaut 10 min) |
| Blocage filigrane | Détection watermark → blocage auto, levée par le propriétaire |

---

## Écrans

### LoginScreen
- Tabs Connexion / Inscription
- `POST /api/auth/login` · `POST /api/auth/register`
- Retour : `{ token, user_id, username, expires_in }`

### MyPhotosScreen — Galerie personnelle
- `GET /api/photos` au chargement
- Upload via `UploadModal` → `POST /api/photos/upload`
- Gestion des autorisés : `PATCH /api/photos/:id/authorize`
- Blocage / déblocage : `PATCH /api/photos/:id/block`
- Suppression : `DELETE /api/photos/:id`
- Historique d'accès par image (onglet dans la modal détail)

### SharedScreen — Images partagées
- `GET /api/photos/shared` au chargement
- Clic sur une image → vérification quota / cooldown / blocage
- Accès confirmé → `POST /api/photos/:id/access` → retourne `signed_url`
- Le viewer éphémère affiche `signed_url` et se ferme automatiquement

### HistoryScreen — Historique
- `GET /api/history/my-images` — accès reçus sur mes images (APP + FILIGRANE)
- `GET /api/history/my-accesses` — images auxquelles j'ai accédé

### ProfileScreen
- Informations de session (token partiel, user_id)
- Contrôle de l'intervalle minimum entre deux vues (viewCooldown)
- Déconnexion → efface le contexte mémoire

---

---

## Guide d'intégration — Équipe Backend / API

> Ce guide s'adresse aux membres travaillant sur l'API REST, la base MongoDB,
> et le Tiers de Confiance. Le frontend est prêt — il suffit de respecter
> les contrats ci-dessous.

### URL de base

Configurer dans `src/config.js`. En développement avec l'émulateur Android :
```
http://10.0.2.2:3000/api
```

### Authentification

Toutes les routes protégées reçoivent un header :
```
Authorization: Bearer <jwt_token>
```

---

### Endpoints attendus

#### Auth

```
POST /api/auth/login
Body:    { "username": "...", "password": "..." }
Retour:  { "token": "...", "user_id": "...", "username": "...", "expires_in": 3600 }

POST /api/auth/register
Body:    { "username": "...", "email": "...", "password": "..." }
Retour:  { "token": "...", "user_id": "...", "username": "...", "expires_in": 3600 }
```

#### Utilisateurs

```
GET /api/users
Retour:  { "users": [{ "_id": "...", "username": "...", "display_name": "..." }] }
```

#### Photos — Galerie personnelle

```
GET /api/photos
Retour:  {
  "photos": [{
    "_id": "...",
    "description": "...",
    "preview_url": "...",           ← URL publique ou signée de la préview
    "authorized_users": ["user1"],
    "ephemeral_duration": 5,        ← secondes (1–10)
    "max_views": 3,                 ← (1–20)
    "blocked": false,
    "access_count": 2,
    "created_at": "...",
    "history": [{
      "viewer_username": "...",
      "accessed_at": "...",
      "type": "app" | "watermark"
    }]
  }]
}

POST /api/photos/upload
Body:    {
  "image_data": "<base64>",
  "description": "...",
  "authorized_users": ["user1", "user2"],
  "ephemeral_duration": 5,
  "max_views": 3
}
Retour:  { "_id": "...", "preview_url": "..." }
⚠  Ne pas attendre d'image_id côté client — c'est le _id MongoDB retourné ici.

PATCH /api/photos/:id/authorize
Body:    { "authorized_users": ["user1", "user2"] }
Retour:  { "success": true }

PATCH /api/photos/:id/settings
Body:    { "ephemeral_duration": 7, "max_views": 5, "description": "..." }
Retour:  { "success": true }

PATCH /api/photos/:id/block
Body:    { "blocked": true }   ← ou false pour lever le blocage
Retour:  { "success": true }

DELETE /api/photos/:id
Retour:  { "success": true }
```

#### Photos — Partagées avec moi

```
GET /api/photos/shared
Retour:  {
  "photos": [{
    "_id": "...",
    "owner_username": "...",
    "description": "...",
    "shared_at": "...",
    "preview_url": "...",           ← préview floue ou non-déchiffrée
    "ephemeral_duration": 5,
    "max_views": 3,
    "blocked": false
  }]
}

POST /api/photos/:id/access
(Pas de body)
Logique serveur :
  1. Vérifier que le viewer est dans authorized_users
  2. Vérifier que access_count < max_views
  3. Logger l'accès dans la collection "accesses"
  4. Retourner une URL signée et temporaire vers l'image déchiffrée

Retour OK :  { "access_id": "...", "signed_url": "..." }
Retour KO :  HTTP 4xx + { "message": "...", "reason": "quota" | "cooldown" | "blocked", "remain_min": N }

⚠  signed_url est l'URL que le frontend affiche dans le viewer éphémère.
   Elle doit être temporaire (TTL = ephemeral_duration + quelques secondes).
```

#### Historique

```
GET /api/history/my-images
Retour:  {
  "accesses": [{
    "_id": "...",
    "image_id": "...",
    "image_description": "...",
    "preview_url": "...",
    "viewer_username": "...",
    "accessed_at": "...",
    "type": "app" | "watermark"
  }]
}

GET /api/history/my-accesses
Retour:  {
  "accesses": [{
    "_id": "...",
    "image_id": "...",
    "image_description": "...",
    "preview_url": "...",
    "owner_username": "...",
    "accessed_at": "..."
  }]
}
```

---

### Schémas MongoDB

```
Collection "users"
  { _id, username, email, display_name, created_at }

Collection "photos"
  { _id, owner_id, description, preview_url,
    authorized_users[],
    ephemeral_duration,   ← entier, secondes
    max_views,            ← entier
    blocked,              ← booléen
    access_count,         ← entier
    created_at,
    history[] }           ← sous-documents { viewer_username, accessed_at, type }

Collection "accesses"
  { _id, image_id, viewer_id, viewer_username,
    owner_username,
    image_description,
    preview_url,
    type: 'app' | 'watermark',
    accessed_at }
```

---

### Convention de nommage

Le backend envoie du **snake_case** — le frontend normalise vers camelCase en interne.
Ne pas modifier cette convention : la couche de normalisation est dans `src/api/index.js`.

| Backend (MongoDB / JSON) | Frontend (React state) |
|--------------------------|------------------------|
| `_id` | `image_id` |
| `preview_url` | `preview_uri` |
| `authorized_users` | `authorized` |
| `ephemeral_duration` | `ephemeralDuration` |
| `max_views` | `maxViews` |
| `accessed_at` | `date` |
| `viewer_username` | `viewer` |
| `owner_username` | `owner` |

---

### Gestion des erreurs

Pour toute erreur métier (quota atteint, image bloquée, cooldown), retourner :
```json
HTTP 4xx
{
  "message": "Message lisible par l'utilisateur",
  "reason": "quota" | "cooldown" | "blocked",
  "remain_min": 8
}
```
Le frontend affiche `message` directement dans une alerte.

---

### Tiers de Confiance — flux attendu

```
Client → POST /photos/upload (base64)
           ↓
       Backend → Tiers de Confiance
                   ├── Applique watermark invisible
                   └── Chiffre AES-256
           ↓
       Backend stocke preview_url (image préview, non chiffrée)
       Backend retourne { _id, preview_url }

Client → POST /photos/:id/access
           ↓
       Backend → Tiers de Confiance
                   └── Déchiffre + génère URL signée temporaire (TTL court)
           ↓
       Backend retourne { signed_url }
       Client affiche signed_url dans le viewer éphémère
```
