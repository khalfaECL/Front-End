# 📱 Secugram — Frontend React Native

Interface Android-first pour le système décentralisé de gestion d'images chiffrées.

---

## 🏗️ Architecture

```
secugram-rn/
├── App.js                          ← Point d'entrée
├── src/
│   ├── api/
│   │   └── index.js                ← Tous les appels API (/api/*)
│   ├── hooks/
│   │   └── useAuth.js              ← Contexte auth (token en mémoire)
│   ├── navigation/
│   │   └── AppNavigator.js         ← Tab nav + Auth gate
│   ├── screens/
│   │   ├── LoginScreen.js          ← Connexion / Inscription
│   │   ├── FeedScreen.js           ← Galerie photos
│   │   └── ProfileScreen.js        ← Profil + sécurité
│   ├── components/
│   │   ├── UI.js                   ← Composants réutilisables
│   │   └── UploadModal.js          ← Bottom sheet upload + autorisations
│   └── theme/
│       └── index.js                ← Couleurs, typo, espacement
└── package.json
```

---

## ⚡ Installation

### Prérequis
- Node.js ≥ 18
- Android Studio + SDK (ou Xcode pour iOS)
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
npm install @react-navigation/native @react-navigation/bottom-tabs \
            react-native-screens react-native-safe-area-context \
            react-native-image-picker
```

### 4. Configuration Android

Dans `android/app/src/main/AndroidManifest.xml`, ajouter :

```xml
<!-- Accès aux médias -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES"/>
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
    android:maxSdkVersion="32"/>

<!-- Accès réseau -->
<uses-permission android:name="android.permission.INTERNET"/>
```

### 5. Lancer sur Android

```bash
# Démarrer Metro bundler
npm start

# Dans un autre terminal
npm run android
```

---

## 🔌 Configuration API

Dans `src/api/index.js`, modifier `BASE_URL` :

```js
// Émulateur Android → localhost de la machine hôte
const BASE_URL = 'http://10.0.2.2:3000/api';

// Appareil physique → IP de votre machine
const BASE_URL = 'http://192.168.1.XX:3000/api';

// Production
const BASE_URL = 'https://api.secugram.fr/api';
```

---

## 🔐 Sécurité implémentée

| Spec | Implémentation |
|------|----------------|
| Pas de localStorage | Token stocké en mémoire React (`useState`) uniquement |
| Token JWT 1h | Vérification `expiresAt` dans `useAuth` |
| Image en clair sur le front | `base64` envoyé → le Tiers chiffre AES-256 |
| sessionStorage | Non disponible sur mobile → mémoire vive équivalente |

---

## 📺 Écrans

### 1. Auth (`LoginScreen`)
- Tabs Connexion / Inscription
- `POST /api/auth/login` ou `POST /api/auth/register`
- Token stocké **uniquement en mémoire** (`AuthContext`)

### 2. Galerie (`FeedScreen`)
- `GET /api/photos` au chargement
- Pull-to-refresh
- Images chiffrées = overlay flou 🔒
- FAB → `UploadModal`

### 3. Upload (`UploadModal`) — 4 étapes
1. Sélection image (galerie ou caméra)
2. Formulaire autorisations — `GET /api/users`
3. Upload `POST /api/photos/upload` + `POST /api/photos/:id/authorize`
4. Confirmation

### 4. Profil (`ProfileScreen`)
- Infos session (token partiel, user_id)
- Récap sécurité
- Déconnexion → efface le contexte mémoire

---

## 🌐 Version Web

Pour la version web, réutiliser les fichiers `src/api/` et `src/hooks/` dans un projet Vite + React.
Remplacer les composants `react-native` par leurs équivalents HTML/CSS.
