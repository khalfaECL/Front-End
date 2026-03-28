/**
 * Secugram API Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Toutes les requêtes vers /api/*.
 * Le token JWT est passé en paramètre (jamais stocké dans ce module).
 *
 * CONVENTION DE NOMMAGE :
 *   • Le backend renvoie du JSON snake_case (MongoDB/Node.js convention).
 *   • Ce module normalise vers camelCase avant de retourner les données
 *     aux écrans React Native.
 *   • Les corps de requêtes sont envoyés en snake_case vers l'API.
 *
 * SCHÉMAS MONGODB ATTENDUS (à transmettre à l'équipe backend) :
 * ─────────────────────────────────────────────────────────────
 * Collection "users"     → { _id, username, email, created_at }
 * Collection "photos"    → { _id, owner_id, description, preview_url,
 *                            authorized_users[], ephemeral_duration,
 *                            max_views, blocked, access_count,
 *                            created_at, history[] }
 * Collection "accesses"  → { _id, image_id, viewer_id, viewer_username,
 *                            type: 'app'|'watermark', accessed_at }
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_TIMEOUT_MS } from '../config';

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Le Tiers de Confiance attend le token dans le body (pas Bearer header).
// authHeaders est gardé pour compatibilité future avec un backend intermédiaire.
function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// Headers pour les routes Tiers de Confiance (token dans body, pas header).
function tdcHeaders() {
  return { 'Content-Type': 'application/json' };
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // FastAPI utilise "detail", certains backends "message"
    const detail = data.detail ?? data.message;
    const msg = typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail.map(e => e.msg || JSON.stringify(e)).join(', ')
        : `Erreur ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

/**
 * fetch() avec timeout.
 * Le Tiers de Confiance peut prendre du temps pour chiffrer/watermarker.
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Normaliseurs (snake_case → camelCase) ───────────────────────────────────

/**
 * Photo appartenant à l'utilisateur connecté (galerie personnelle).
 * Champ MongoDB "_id" → "image_id" côté frontend.
 */
function normalizeMyPhoto(p) {
  return {
    image_id:          p._id ?? p.image_id,
    description:       p.description ?? '',
    date_creation:     p.created_at ?? p.date_creation ?? '',
    preview_uri:       p.preview_url ?? p.preview_uri ?? '',
    authorized:        p.authorized_users ?? p.authorized ?? [],
    access_count:      p.access_count ?? 0,
    ephemeralDuration: p.ephemeral_duration ?? p.ephemeralDuration ?? 5,
    maxViews:          p.max_views ?? p.maxViews ?? 3,
    blocked:           p.blocked ?? false,
    history:           (p.history ?? []).map(normalizeHistoryEntry),
  };
}

/**
 * Image partagée avec l'utilisateur connecté.
 */
function normalizeSharedPhoto(p) {
  return {
    image_id:          p._id ?? p.image_id,
    owner_username:    p.owner_username,
    description:       p.description ?? '',
    date_shared:       p.shared_at ?? p.date_shared ?? '',
    preview_uri:       p.preview_url ?? p.preview_uri ?? '',
    ephemeralDuration: p.ephemeral_duration ?? p.ephemeralDuration ?? 5,
    maxViews:          p.max_views ?? p.maxViews ?? 3,
    blocked:           p.blocked ?? false,
  };
}

function normalizeHistoryEntry(h) {
  return {
    viewer:  h.viewer_username ?? h.viewer,
    date:    h.accessed_at     ?? h.date,
    type:    h.type,             // 'app' | 'watermark'
  };
}

function normalizeAccessEntry(a) {
  return {
    id:                a._id ?? a.id,
    image_id:          a.image_id,
    image_description: a.image_description ?? a.description ?? '',
    preview_uri:       a.preview_url ?? a.preview_uri ?? '',
    viewer:            a.viewer_username ?? a.viewer,
    owner:             a.owner_username  ?? a.owner,
    date:              a.accessed_at     ?? a.date,
    type:              a.type,
  };
}

function normalizeUser(u) {
  return {
    user_id:  u._id ?? u.user_id,
    username: u.username,
    display:  u.display_name ?? u.username,
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * POST /auth/login  (Tiers de Confiance)
 * @returns {{ token: string, user_id: string, username: string, expires_in: number }}
 */
export async function login(username, password) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await handleResponse(res);
  // Le TdC retourne expires_at (ISO string), on calcule expires_in en secondes.
  const expiresIn = data.expires_at
    ? Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000)
    : (data.expires_in ?? 86400);
  return {
    token:      data.token,
    user_id:    data.user_id ?? data._id,
    username:   data.username,
    expires_in: expiresIn,
  };
}

/**
 * POST /auth/register  (Tiers de Confiance)
 * Le TdC ne retourne PAS de token à l'inscription → on enchaîne un login automatique.
 * @returns {{ token: string, user_id: string, username: string, expires_in: number }}
 */
export async function register(username, _email, password) {
  // email ignoré : le TdC ne l'accepte pas dans /auth/register
  const res = await fetchWithTimeout(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  await handleResponse(res); // { message, user_id } — pas de token
  // Auto-login pour obtenir le token de session.
  return login(username, password);
}

/**
 * POST /auth/logout  (Tiers de Confiance)
 * Invalide le token côté serveur.
 */
export async function logout(token) {
  await fetchWithTimeout(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: tdcHeaders(),
    body: JSON.stringify({ token }),
  }).catch(() => {}); // erreur silencieuse — la session mémoire est effacée de toute façon
}

// ─── Users ────────────────────────────────────────────────────────────────────

/**
 * GET /api/users
 * Liste des utilisateurs connus (pour le formulaire d'autorisations).
 * @returns {{ users: Array<{ user_id, username, display }> }}
 */
export async function fetchUsers(token) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/users`, {
    headers: authHeaders(token),
  });
  const data = await handleResponse(res);
  return { users: (data.users ?? []).map(normalizeUser) };
}

// ─── Photos (galerie personnelle) ─────────────────────────────────────────────

// Clé AsyncStorage par user : "photos_<username>"
const photosKey = (username) => `photos_${username}`;

export async function addToSessionPhotos(photo, username) {
  const key = photosKey(username);
  const raw = await AsyncStorage.getItem(key);
  const list = raw ? JSON.parse(raw) : [];
  if (!list.find(p => p.image_id === photo.image_id)) {
    list.unshift(photo);
    await AsyncStorage.setItem(key, JSON.stringify(list));
  }
}

// Met à jour les champs d'une photo existante dans le cache local
export async function updateSessionPhoto(imageId, updates, username) {
  const key = photosKey(username);
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return;
  const list = JSON.parse(raw).map(p =>
    p.image_id === imageId ? { ...p, ...updates } : p
  );
  await AsyncStorage.setItem(key, JSON.stringify(list));
}

export async function removeFromSessionPhotos(imageId, username) {
  const key = photosKey(username);
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return;
  const list = JSON.parse(raw).filter(p => p.image_id !== imageId);
  await AsyncStorage.setItem(key, JSON.stringify(list));
}

// clearSessionPhotos n'efface plus rien au logout — chaque user garde ses photos.
export function clearSessionPhotos() {}

// ─── Preview cache (local URI per image_id) ───────────────────────────────────
const previewCacheKey = (username) => `preview_cache_${username}`;

export async function savePreviewCache(imageId, localUri, username) {
  const key = previewCacheKey(username);
  const raw = await AsyncStorage.getItem(key);
  const cache = raw ? JSON.parse(raw) : {};
  cache[imageId] = localUri;
  await AsyncStorage.setItem(key, JSON.stringify(cache));
}

export async function getPreviewCache(username) {
  const raw = await AsyncStorage.getItem(previewCacheKey(username));
  return raw ? JSON.parse(raw) : {};
}

// ─── Photos partagées (cache local) ──────────────────────────────────────────

const sharedKey = (username) => `shared_${username}`;

export async function addToSharedPhotos(photo, authorizedUsernames) {
  for (const username of authorizedUsernames) {
    const key = sharedKey(username);
    const raw = await AsyncStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    if (!list.find(p => p.image_id === photo.image_id)) {
      list.unshift(photo);
      await AsyncStorage.setItem(key, JSON.stringify(list));
    }
  }
}

export async function fetchSharedPhotos(_token, username) {
  if (!username) return { photos: [] };
  const raw = await AsyncStorage.getItem(sharedKey(username));
  return { photos: raw ? JSON.parse(raw) : [] };
}

export async function saveSharedPhotos(photos, username) {
  await AsyncStorage.setItem(sharedKey(username), JSON.stringify(photos));
}

/**
 * GET /api/photos — endpoint non disponible sur le TdC.
 * Retourne les photos persistées localement pour ce user.
 * @returns {{ photos: Array<object> }}
 */
export async function fetchMyPhotos(token, username) {
  if (!token || !username) return { photos: [] };
  const res = await fetchWithTimeout(`${API_BASE_URL}/my_posts`, {
    method: 'POST',
    headers: tdcHeaders(),
    body: JSON.stringify({ username, token }),
  });
  const data = await handleResponse(res);
  const cache = await getPreviewCache(username);
  const photos = (data.photos ?? []).map(p => ({
    ...p,
    preview_uri: cache[p.image_id] ?? p.preview_uri ?? null,
  }));
  return { photos };
}

/**
 * POST /api/photos/upload
 * Envoi de l'image brute (base64) vers le Tiers de Confiance via le backend.
 * Le Tiers applique : watermark invisible + chiffrement AES-256.
 *
 * Payload envoyé :
 * {
 *   image_data:          string (base64),
 *   description:         string,
 *   authorized_users:    string[] (usernames),
 *   ephemeral_duration:  number (secondes, 1–10),
 *   max_views:           number (1–20),
 * }
 *
 * IMPORTANT : Ne pas inclure d'image_id côté client.
 * Le _id MongoDB est généré par le backend et retourné dans la réponse.
 *
 * @returns {{ image_id: string, preview_url: string }}
 */
/**
 * Flux complet d'upload vers le Tiers de Confiance :
 *   1. POST /set_key   — crée la clé AES-256 pour l'image
 *   2. POST /add_post  — chiffre + watermark + stocke l'image
 *
 * @param {{ uri, fileName?, type? }} imageAsset
 * @param {{ description, authorizedUsers, ephemeralDuration, maxViews }} opts
 * @param {{ userId, username }} session
 * @returns {{ image_id: string, preview_uri: string|null }}
 */
/**
 * POST /trust/watermark  (Tiers de Confiance)
 * Applique un filigrane DCT invisible sur l'image avec le username du déposeur.
 * Retourne un objet { uri, name, type } utilisable directement dans FormData RN.
 */
export async function watermarkImage(imageAsset, username) {
  const formData = new FormData();
  formData.append('image', {
    uri:  imageAsset.uri,
    name: imageAsset.fileName ?? 'photo.jpg',
    type: imageAsset.type     ?? 'image/jpeg',
  });
  formData.append('username', username);
  const res = await fetchWithTimeout(`${API_BASE_URL}/trust/watermark`, {
    method: 'POST',
    body:   formData,
  });
  if (!res.ok) throw new Error(`Filigrane échoué : ${res.status}`);
  const blob = await res.blob();
  // React Native : reconstruire l'URI blob pour l'utiliser dans le prochain FormData
  const d = blob._data;
  if (!d?.blobId) throw new Error('Blob URI indisponible');
  const blobUri = `blob:${d.blobId}?offset=${d.offset ?? 0}&size=${d.size ?? blob.size}`;
  return { uri: blobUri, name: `watermarked_${username}.png`, type: 'image/png' };
}

/**
 * POST /trust/extract  (Tiers de Confiance)
 * Compare l'image originale et une image suspecte pour extraire le filigrane DCT.
 * @param {{ uri, fileName?, type? }} originalAsset   — image originale (avant filigrane)
 * @param {{ uri, fileName?, type? }} suspectedAsset  — image suspecte (avec filigrane potentiel)
 * @returns {{ message: string }}  Le username extrait, ou { error: string }
 */
export async function extractWatermark(originalAsset, suspectedAsset) {
  const formData = new FormData();
  formData.append('original', {
    uri:  originalAsset.uri,
    name: originalAsset.fileName ?? 'original.jpg',
    type: originalAsset.type     ?? 'image/jpeg',
  });
  formData.append('watermarked', {
    uri:  suspectedAsset.uri,
    name: suspectedAsset.fileName ?? 'suspected.jpg',
    type: suspectedAsset.type     ?? 'image/jpeg',
  });
  const res = await fetchWithTimeout(`${API_BASE_URL}/trust/extract`, {
    method: 'POST',
    body:   formData,
  });
  return handleResponse(res);
}

/**
 * POST /add_post  (Tiers de Confiance)
 * Chiffrement AES-256 + stockage de l'image.
 * Le filigrane DCT est disponible via watermarkImage() de façon indépendante.
 *
 * @returns {{ image_id: string, preview_uri: null, authorized: string[] }}
 */
export async function uploadPhoto(token, { imageAsset, description, authorizedUsers, ephemeralDuration, maxViews }, session) {
  const formData = new FormData();
  formData.append('user_id',            session.userId);
  formData.append('owner_username',     session.username);
  formData.append('token',              token);
  formData.append('caption',            description ?? '');
  formData.append('ephemeral_duration', String(ephemeralDuration ?? 5));
  formData.append('max_views',          String(maxViews ?? 3));
  if (imageAsset.file instanceof Blob) {
    formData.append('image', imageAsset.file, imageAsset.fileName ?? 'photo.jpg');
  } else {
    formData.append('image', {
      uri:  imageAsset.uri,
      name: imageAsset.fileName ?? 'photo.jpg',
      type: imageAsset.type     ?? 'image/jpeg',
    });
  }
  if (authorizedUsers && authorizedUsers.length > 0) {
    formData.append('authorized_users', authorizedUsers.join(','));
  }

  const res = await fetchWithTimeout(`${API_BASE_URL}/add_post`, {
    method: 'POST',
    body:   formData,
  });
  const data = await handleResponse(res);
  return {
    image_id:    data.image_id,
    preview_uri: null,
    authorized:  data.autorisations ?? authorizedUsers ?? [],
  };
}

/**
 * POST /posts/{image_id}  (Tiers de Confiance)
 * Récupère une image. Si l'utilisateur est autorisé → image déchiffrée (base64).
 * Sinon → image chiffrée + decrypted:false.
 *
 * @returns {{ image_id, caption, image: string (base64), decrypted: boolean }}
 */
export async function getPost(token, username, imageId) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/posts/${imageId}`, {
    method:  'POST',
    headers: tdcHeaders(),
    body:    JSON.stringify({ username, token }),
  });
  return handleResponse(res);
}

/**
 * DELETE /revoke/{image_id}/{target_username}  (Tiers de Confiance)
 * Révoque l'accès d'un utilisateur à une image.
 *
 * @returns {{ message, image_id, autorisations: string[] }}
 */
export async function revokeAccess(token, imageId, targetUsername, ownerUsername) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/revoke/${imageId}/${targetUsername}`, {
    method:  'DELETE',
    headers: tdcHeaders(),
    body:    JSON.stringify({ owner_username: ownerUsername, token }),
  });
  return handleResponse(res);
}

/**
 * PATCH /api/photos/:imageId/authorize
 * Met à jour la liste complète des utilisateurs autorisés.
 * Remplace la liste existante (pas d'ajout incrémental côté API).
 *
 * @param {string[]} authorizedUsers  - liste de usernames
 * @returns {{ success: boolean }}
 */
/**
 * POST /authorize/{image_id}  (Tiers de Confiance)
 * Token dans le body (pas en header).
 */
export async function authorizePhoto(token, imageId, authorizedUsers, ownerUsername) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/authorize/${imageId}`, {
    method: 'POST',
    headers: tdcHeaders(),
    body: JSON.stringify({
      owner_username:   ownerUsername,
      token:            token,
      authorized_users: authorizedUsers,
    }),
  });
  return handleResponse(res);
}

/**
 * PATCH /api/photos/:imageId/settings
 * Modifie les paramètres de sécurité d'une image existante
 * (durée éphémère, nombre de vues max).
 *
 * @param {{ ephemeralDuration?: number, maxViews?: number, description?: string }} updates
 * @returns {{ success: boolean }}
 */
export async function updatePhotoSettings(token, imageId, updates) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/photos/${imageId}/settings`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({
      ephemeral_duration: updates.ephemeralDuration,
      max_views:          updates.maxViews,
      description:        updates.description,
    }),
  });
  return handleResponse(res);
}

/**
 * PATCH /api/photos/:imageId/block
 * Bloque ou débloque l'accès à une image suite à une détection de filigrane.
 *
 * @param {boolean} blocked
 * @returns {{ success: boolean }}
 */
export async function setPhotoBlocked(token, imageId, blocked) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/photos/${imageId}/block`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ blocked }),
  });
  return handleResponse(res);
}

export async function deletePhoto(token, username, imageId) {
  // 1. Supprimer de MongoDB (posts + keys)
  const res = await fetchWithTimeout(`${API_BASE_URL}/delete_post/${imageId}`, {
    method: 'DELETE',
    headers: tdcHeaders(),
    body: JSON.stringify({ username, token }),
  });
  await handleResponse(res);

  // 2. Supprimer du cache local photos_<username>
  await removeFromSessionPhotos(imageId, username);

  // 3. Supprimer du feed_all
  const feedRaw = await AsyncStorage.getItem('feed_all');
  if (feedRaw) {
    const filtered = JSON.parse(feedRaw).filter(p => p.image_id !== imageId);
    await AsyncStorage.setItem('feed_all', JSON.stringify(filtered));
  }
}


/**
 * POST /api/photos/:imageId/access
 * Enregistre un accès éphémère côté serveur.
 * Le backend :
 *   1. Vérifie que le viewer est autorisé.
 *   2. Vérifie le quota (max_views) et le cooldown.
 *   3. Logue l'accès dans la collection "accesses".
 *   4. Renvoie une URL signée temporaire pour afficher l'image déchiffrée.
 *
 * @returns {{ success: boolean, access_id: string, signed_url: string }}
 *   signed_url : URL valable uniquement le temps de l'affichage éphémère.
 *   En cas de quota/cooldown/blocage, une erreur HTTP est renvoyée avec
 *   { message, reason: 'quota'|'cooldown'|'blocked', remain_min? }
 */
export async function recordAccess(token, imageId, username, cooldownMinutes = 0) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/posts/${imageId}`, {
    method: 'POST',
    headers: tdcHeaders(),
    body: JSON.stringify({ username, token, cooldown_minutes: cooldownMinutes }),
  });
  const data = await handleResponse(res);
  if (!data.decrypted) throw new Error("Accès non autorisé à cette image.");
  return {
    signed_url:         `data:image/jpeg;base64,${data.image}`,
    ephemeral_duration: data.ephemeral_duration ?? 5,
  };
}

// ─── Historique (cache local AsyncStorage) ────────────────────────────────────

const historyKey   = (username) => `history_${username}`;
const myAccessKey  = (username) => `myaccess_${username}`;

// Access is now recorded server-side in get_post — no client-side logging needed.
export async function logAccess(_params) {}

/**
 * Enregistre une détection de filigrane dans l'historique du propriétaire (type 'watermark').
 */
export async function logWatermarkDetection({ imageId, imageDescription, detectedUsername, ownerUsername }) {
  const entry = {
    id:                `wm_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    image_id:          imageId,
    image_description: imageDescription,
    preview_uri:       null,
    viewer:            detectedUsername,
    owner:             ownerUsername,
    date:              new Date().toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    type:              'watermark',
  };
  const hKey = historyKey(ownerUsername);
  const hRaw = await AsyncStorage.getItem(hKey);
  const hList = hRaw ? JSON.parse(hRaw) : [];
  hList.unshift(entry);
  await AsyncStorage.setItem(hKey, JSON.stringify(hList));
}

export async function fetchMyImageHistory(token, username) {
  if (!token || !username) return { accesses: [] };
  const res = await fetchWithTimeout(`${API_BASE_URL}/get_history`, {
    method: 'POST',
    headers: tdcHeaders(),
    body: JSON.stringify({ owner_username: username, token }),
  });
  const data = await handleResponse(res);
  return { accesses: (data.accesses ?? []).map(a => ({
    id:                a._id ?? `${a.image_id}_${a.accessed_at}`,
    image_id:          a.image_id,
    image_description: a.image_description ?? '',
    preview_uri:       null,
    viewer:            a.viewer_username,
    owner:             a.owner_username,
    date:              a.accessed_at,
    type:              a.type,
  })) };
}

export async function fetchMyAccesses(token, username) {
  if (!token || !username) return { accesses: [] };
  const res = await fetchWithTimeout(`${API_BASE_URL}/get_my_accesses`, {
    method: 'POST',
    headers: tdcHeaders(),
    body: JSON.stringify({ viewer_username: username, token }),
  });
  const data = await handleResponse(res);
  return { accesses: (data.accesses ?? []).map(a => ({
    id:                a._id ?? `${a.image_id}_${a.accessed_at}`,
    image_id:          a.image_id,
    image_description: a.image_description ?? '',
    preview_uri:       null,
    viewer:            a.viewer_username,
    owner:             a.owner_username,
    date:              a.accessed_at,
    type:              a.type,
  })) };
}

// ─── Feed ─────────────────────────────────────────────────────────────────────

const FEED_KEY      = 'feed_all';
const requestsKey   = (username) => `requests_${username}`;

// Feed is now server-side — no local caching needed.
export async function addToFeed(_post) {}

export async function fetchFeed(token, username) {
  if (!token || !username) return { posts: [] };
  const res = await fetchWithTimeout(`${API_BASE_URL}/feed`, {
    method: 'POST',
    headers: tdcHeaders(),
    body: JSON.stringify({ username, token }),
  });
  const data = await handleResponse(res);
  return { posts: data.posts ?? [] };
}

// Écrase le cache feed avec une liste filtrée (supprime les posts inexistants)
export async function syncFeed(posts) {
  await AsyncStorage.setItem(FEED_KEY, JSON.stringify(posts));
}

// Met à jour la liste authorized d'un post dans le feed cache
export async function updateFeedAuthorized(imageId, authorizedUsernames) {
  const raw = await AsyncStorage.getItem(FEED_KEY);
  if (!raw) return;
  const list = JSON.parse(raw).map(p =>
    p.image_id === imageId ? { ...p, authorized: authorizedUsernames } : p
  );
  await AsyncStorage.setItem(FEED_KEY, JSON.stringify(list));
}

export async function requestImageAccess({ imageId, imageDescription, ownerUsername, requesterUsername, token }) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/add_request`, {
    method: 'POST',
    headers: tdcHeaders(),
    body: JSON.stringify({
      image_id:           imageId,
      image_description:  imageDescription,
      owner_username:     ownerUsername,
      requester_username: requesterUsername,
      token,
    }),
  });
  await handleResponse(res);
}

export async function fetchAccessRequests(ownerUsername, token) {
  if (!ownerUsername || !token) return { requests: [] };
  const res = await fetchWithTimeout(`${API_BASE_URL}/get_requests`, {
    method: 'POST',
    headers: tdcHeaders(),
    body: JSON.stringify({ owner_username: ownerUsername, token }),
  });
  const data = await handleResponse(res);
  return { requests: data.requests ?? [] };
}

export async function grantAccessRequest(token, ownerUsername, imageId, requesterUsername) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/grant_request`, {
    method: 'POST',
    headers: tdcHeaders(),
    body: JSON.stringify({
      owner_username:     ownerUsername,
      token,
      image_id:           imageId,
      requester_username: requesterUsername,
    }),
  });
  await handleResponse(res);
}
