# Secugram — Frontend

Application mobile sécurisée de partage de photos éphémères, construite avec **React Native 0.76** (Android) et une version **web** via Webpack + react-native-web.

Le frontend communique exclusivement avec le **Tiers de Confiance (TdC)** — serveur FastAPI déployé sur Render, connecté à MongoDB Atlas.

---

## Architecture

```
secugram-rn/
├── App.js                        ← Point d'entrée (ThemeProvider + AuthProvider)
├── webpack.config.js             ← Config version web (react-native-web)
├── src/
│   ├── config.js                 ← API_BASE_URL + timeout
│   ├── api/
│   │   └── index.js              ← Tous les appels vers le TdC + normaliseurs
│   ├── hooks/
│   │   ├── useAuth.js            ← Session JWT (mémoire uniquement, éphémère)
│   │   └── useTheme.js           ← Thème dark/light + viewCooldown (persisté)
│   ├── navigation/
│   │   └── AppNavigator.js       ← Navigation par onglets + Auth gate
│   ├── screens/                  ← Écrans React Native (Android)
│   │   ├── LoginScreen.js
│   │   ├── FeedScreen.js
│   │   ├── MyPhotosScreen.js
│   │   ├── SharedScreen.js
│   │   └── ProfileScreen.js
│   ├── components/
│   │   ├── UI.js                 ← Composants réutilisables
│   │   └── UploadModal.js        ← Modal de dépôt d'image
│   ├── stubs/                    ← Polyfills pour la version web
│   │   ├── async-storage.js      ← AsyncStorage → localStorage
│   │   ├── image-picker.js       ← ImagePicker → <input type="file">
│   │   └── safe-area-context.js
│   ├── theme.js                  ← Couleurs, radius, espacements
│   └── web/
│       └── pages/                ← Équivalents web des écrans natifs
│           ├── FeedPage.js
│           ├── LoginPage.js
│           ├── MyPhotosPage.js
│           ├── ProfilePage.js
│           └── SharedPage.js
└── package.json
```

---

## Prérequis

| Outil | Version min | Notes |
|-------|-------------|-------|
| Node.js | 18+ | |
| JDK | 17 | Pour le build Android |
| Android SDK | API 33+ | Via Android Studio |
| ADB | — | Inclus dans Android SDK |

> Configuration complète React Native : [React Native Environment Setup](https://reactnative.dev/docs/environment-setup)

---

## Installation

```bash
cd secugram-rn
npm install
```

---

## Configuration

L'URL du backend est centralisée dans `src/config.js` :

```js
export const API_BASE_URL = 'https://tdc-server.onrender.com';
export const API_TIMEOUT_MS = 30_000;
```

Aucune variable d'environnement requise.

> Le backend étant sur le **free tier Render**, le premier appel après inactivité peut prendre ~30 secondes (cold start). Patienter et réessayer.

---

## Lancer l'application

### App Android (device physique)

**Terminal 1 — Metro bundler**
```bash
npx @react-native-community/cli start
```

**Terminal 2 — Device + lancement**
```bash
# Vérifier que le device est reconnu (USB + débogage USB activé)
adb devices

# Rediriger le port Metro vers le device
adb reverse tcp:8081 tcp:8081

# Installer et lancer l'app
npx @react-native-community/cli run-android
```

> Si l'APK est déjà installé : `adb reverse tcp:8081 tcp:8081` puis relancer l'app manuellement.

### Version Web (second utilisateur)

```bash
npx webpack serve --config webpack.config.js
```

Accéder à : **`http://localhost:8080`**

---

## Mode démo (sans compte)

Identifiants : `alice_dupont` / `demo1234`

Toutes les actions réseau sont bypassées — les données mock sont utilisées pour la démonstration.

---

## Fonctionnalités de sécurité

| Paramètre | Où le régler | Plage |
|-----------|-------------|-------|
| Durée d'affichage éphémère | Au dépôt de l'image | 1–10 secondes |
| Nombre de vues max | Au dépôt de l'image | 1–20 vues par utilisateur |
| Intervalle entre vues | Profil utilisateur | 1–60 minutes |

| Mesure | Détail |
|--------|--------|
| Token éphémère | Stocké en mémoire React uniquement, perdu à la fermeture |
| Chiffrement | AES-256 appliqué côté serveur (TdC) |
| Filigrane invisible | DCT avec username du déposeur, extractible pour traçabilité |
| Viewer éphémère | Auto-fermeture après N secondes avec barre de progression |
| Quota de vues | Bloque l'accès une fois le quota atteint (côté serveur) |
| Cooldown entre vues | Délai minimum entre deux vues, vérifié côté serveur |
| Blocage d'image | Le propriétaire peut bloquer tous les accès à tout moment |

---

## Endpoints TdC utilisés

| Action | Méthode | Route |
|--------|---------|-------|
| Inscription | POST | `/auth/register` |
| Connexion | POST | `/auth/login` |
| Déconnexion | POST | `/auth/logout` |
| Déposer image | POST | `/add_post` |
| Récupérer image + déchiffrer | POST | `/posts/{image_id}` |
| Feed (toutes les images) | POST | `/feed` |
| Mes images | POST | `/my_posts` |
| Autoriser un viewer | POST | `/authorize/{image_id}` |
| Révoquer un accès | DELETE | `/revoke/{image_id}/{username}` |
| Supprimer une image | DELETE | `/delete_post/{image_id}` |
| Historique de mes images | POST | `/get_history` |
| Mes accès (viewer) | POST | `/get_my_accesses` |
| Demande d'accès | POST | `/add_request` |
| Voir les demandes | POST | `/get_requests` |
| Accorder une demande | POST | `/grant_request` |
| Filigrane (appliquer) | POST | `/trust/watermark` |
| Filigrane (extraire) | POST | `/trust/extract` |

> Documentation Swagger : `https://tdc-server.onrender.com/docs`

---

## Convention de nommage API → Frontend

Le TdC renvoie du `snake_case` — normalisé automatiquement dans `src/api/index.js`.

| TdC (JSON) | Frontend |
|------------|----------|
| `_id` / `image_id` | `image_id` |
| `preview_url` | `preview_uri` |
| `authorized_users` | `authorized` |
| `ephemeral_duration` | `ephemeralDuration` |
| `max_views` | `maxViews` |
| `accessed_at` | `date` |
| `viewer_username` | `viewer` |
| `owner_username` | `owner` |
| `expires_at` (ISO) | `expiresAt` (timestamp ms) |

---

## Dépannage

**Metro port 8081 déjà utilisé**
```bash
netstat -ano | findstr :8081
taskkill /PID <PID> /F
```

**Device non reconnu par ADB**
```bash
adb kill-server
adb start-server
adb devices
```

**INSTALL_FAILED_UPDATE_INCOMPATIBLE** (conflit debug/release)
```bash
adb uninstall com.secugram
npx @react-native-community/cli run-android
```

**Arrêter tous les processus**
```bash
taskkill /F /IM node.exe
adb kill-server
```
