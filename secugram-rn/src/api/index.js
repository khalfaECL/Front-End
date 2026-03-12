/**
 * Secugram API Service
 * Toutes les requêtes vers /api/*
 * Le token JWT est lu depuis le contexte d'auth (passé en paramètre).
 */

const BASE_URL = 'http://10.0.2.2:3000/api'; // Android emulator → localhost

// ─── Helpers ────────────────────────────────────────────────────────────────

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * @returns {{ token, user_id, username, expires_in }}
 */
export async function login(username, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
}

/**
 * POST /api/auth/register
 * @returns {{ token, user_id, username, expires_in }}
 */
export async function register(username, email, password) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  return handleResponse(res);
}

// ─── Users ───────────────────────────────────────────────────────────────────

/**
 * GET /api/users
 * Liste des utilisateurs pour le formulaire d'autorisations.
 * @returns {{ users: Array<{ user_id, username }> }}
 */
export async function fetchUsers(token) {
  const res = await fetch(`${BASE_URL}/users`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

// ─── Photos ──────────────────────────────────────────────────────────────────

/**
 * GET /api/photos
 * Galerie de l'utilisateur connecté.
 * @returns {{ photos: Array<Photo> }}
 */
export async function fetchMyPhotos(token) {
  const res = await fetch(`${BASE_URL}/photos`, {
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

/**
 * POST /api/photos/upload
 * Envoi image en clair en base64 → le Tiers chiffre + watermark.
 *
 * @param {string} token
 * @param {{ imageData: string, imageId: string, description: string }} payload
 * @returns {{ success: boolean, url: string, image_id: string }}
 */
export async function uploadPhoto(token, { imageData, imageId, description }) {
  const res = await fetch(`${BASE_URL}/photos/upload`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      image_data: imageData,   // base64 image EN CLAIR
      image_id: imageId,
      description,
    }),
  });
  return handleResponse(res);
}

/**
 * POST /api/photos/:imageId/authorize
 * Définit les utilisateurs autorisés à voir l'image.
 *
 * @param {string} token
 * @param {string} imageId
 * @param {string[]} authorizedUsers  - liste de usernames
 * @returns {{ success: boolean }}
 */
export async function authorizePhoto(token, imageId, authorizedUsers) {
  const res = await fetch(`${BASE_URL}/photos/${imageId}/authorize`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ authorized_users: authorizedUsers }),
  });
  return handleResponse(res);
}

/**
 * DELETE /api/photos/:imageId
 */
export async function deletePhoto(token, imageId) {
  const res = await fetch(`${BASE_URL}/photos/${imageId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return handleResponse(res);
}
