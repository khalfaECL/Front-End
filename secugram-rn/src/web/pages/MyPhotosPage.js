import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import * as API from '../../api';

const MOCK_MY_PHOTOS = [
  {
    image_id: 'img_001', owner_username: 'youssef', description: 'Vacances Nice 2025',
    date_creation: '26 fev. 2025',
    preview_uri: 'https://picsum.photos/seed/beach/400/400',
    authorized: ['khakfa_youssef', 'chammakhi_malak'], access_count: 3,
    ephemeralDuration: 5, maxViews: 2, blocked: true,
    history: [
      { viewer: 'khakfa_youssef',  date: '2 mars 14h23', type: 'app' },
      { viewer: 'chammakhi_malak', date: '4 mars 09h11', type: 'app' },
      { viewer: 'inconnu_device',  date: '5 mars 22h04', type: 'watermark' },
    ],
  },
  {
    image_id: 'img_002', owner_username: 'youssef', description: 'Randonnee Vercors',
    date_creation: '3 mars 2025',
    preview_uri: 'https://picsum.photos/seed/forest/400/400',
    authorized: ['krid_amani'], access_count: 1,
    ephemeralDuration: 8, maxViews: 1,
    history: [{ viewer: 'krid_amani', date: '5 mars 11h30', type: 'app' }],
  },
];

// ── Upload Modal ──────────────────────────────────────────────────────────────

function UploadModal({ onClose, onSuccess, colors }) {
  const { session } = useAuth();
  const { viewCooldown } = useTheme();
  const [description, setDescription] = useState('');
  const [authorizedInput, setAuthorizedInput] = useState('');
  const [authorizedList, setAuthorizedList] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [ephemeralDuration, setEphemeralDuration] = useState(5);
  const [maxViews, setMaxViews] = useState(3);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUri, setPreviewUri] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    API.getSavedContacts(session.username).then(setContacts).catch(() => {});
  }, []);

  const toggleContact = (u) =>
    setAuthorizedList(prev => prev.includes(u) ? prev.filter(x => x !== u) : [...prev, u]);

  const addFromInput = () => {
    const users = authorizedInput.split(',').map(u => u.trim().toLowerCase()).filter(Boolean);
    if (!users.length) return;
    setAuthorizedList(prev => Array.from(new Set([...prev, ...users])));
    setAuthorizedInput('');
  };

  const EPHEM_MIN = 1; const EPHEM_MAX = 10;
  const VIEWS_MIN = 1; const VIEWS_MAX = 20;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPreviewUri(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile && !previewUri) { setError('Choisissez une image.'); return; }
    setUploading(true);
    setError('');
    try {
      const extra = authorizedInput.split(',').map(u => u.trim().toLowerCase()).filter(Boolean);
      const authorizedUsers = Array.from(new Set([...authorizedList, ...extra]));

      let imageId, uri;
      if (session.isDemo) {
        imageId = `img_demo_${Date.now()}`;
        uri = previewUri;
      } else {
        const imageAsset = {
          uri: previewUri,
          fileName: selectedFile?.name ?? 'photo.jpg',
          type: selectedFile?.type ?? 'image/jpeg',
          file: selectedFile,
        };
        const data = await API.uploadPhoto(
          session.token,
          { imageAsset, description, authorizedUsers, ephemeralDuration, maxViews, viewCooldown },
          { userId: session.userId, username: session.username }
        );
        imageId = data.image_id;
        uri = previewUri;
      }

      onSuccess({
        imageId,
        uri,
        description,
        authorized: authorizedUsers,
        ephemeralDuration,
        maxViews,
      });
    } catch (e) {
      setError(e.message || 'Erreur lors du depot.');
    } finally {
      setUploading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    color: colors.textPri,
    fontSize: 13,
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    outline: 'none',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        backgroundColor: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: 18,
        padding: '28px 28px 24px',
        width: '100%', maxWidth: 440,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: '700', color: colors.textPri }}>
            Deposer une image
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: colors.textSec, cursor: 'pointer', fontSize: 18 }}
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* File picker */}
          <div
            onClick={() => fileRef.current.click()}
            style={{
              width: '100%',
              aspectRatio: '16/9',
              backgroundColor: colors.surface,
              border: `2px dashed ${selectedFile ? colors.accent : colors.border}`,
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginBottom: 16,
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}
          >
            {previewUri ? (
              <img src={previewUri} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="preview" />
            ) : (
              <>
                <div style={{ fontSize: 28, marginBottom: 8, color: colors.textMut }}>[ + ]</div>
                <span style={{ fontSize: 12, color: colors.textSec, fontFamily: 'Courier New, monospace' }}>
                  CHOISIR UNE IMAGE
                </span>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />

          {/* Description */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 10, fontFamily: 'Courier New, monospace', letterSpacing: 2, color: colors.textSec, marginBottom: 5 }}>
              DESCRIPTION
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description de l'image..."
              style={inputStyle}
            />
          </div>

          {/* Authorized users */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 10, fontFamily: 'Courier New, monospace', letterSpacing: 2, color: colors.textSec, marginBottom: 8 }}>
              UTILISATEURS AUTORISES
            </label>
            {/* Contacts sauvegardés */}
            {contacts.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {contacts.map(u => {
                  const active = authorizedList.includes(u);
                  return (
                    <button key={u} onClick={() => toggleContact(u)} type="button" style={{
                      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: '600', cursor: 'pointer',
                      backgroundColor: active ? colors.accent : colors.surface,
                      color: active ? '#fff' : colors.textSec,
                      border: `1px solid ${active ? colors.accent : colors.border}`,
                    }}>{u}</button>
                  );
                })}
              </div>
            )}
            {/* Chips sélectionnés */}
            {authorizedList.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {authorizedList.map(u => (
                  <span key={u} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 8px', borderRadius: 20, fontSize: 11,
                    backgroundColor: colors.accentDim, color: colors.accent,
                    border: '1px solid rgba(255,107,0,0.3)',
                  }}>
                    {u}
                    <span onClick={() => toggleContact(u)} style={{ cursor: 'pointer', fontWeight: '700', marginLeft: 2 }}>×</span>
                  </span>
                ))}
              </div>
            )}
            {/* Saisie manuelle */}
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                value={authorizedInput}
                onChange={e => setAuthorizedInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFromInput())}
                placeholder="Ajouter un identifiant..."
                style={{ ...inputStyle, flex: 1 }}
              />
              <button type="button" onClick={addFromInput} style={{
                padding: '0 14px', backgroundColor: colors.surface, border: `1px solid ${colors.border}`,
                borderRadius: 8, color: colors.textSec, cursor: 'pointer', fontSize: 18, fontWeight: '300',
              }}>+</button>
            </div>
          </div>

          {/* Durée d'affichage */}
          <div style={{ marginBottom: 14, backgroundColor: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: '600', color: colors.textPri }}>Durée d'affichage</div>
                <div style={{ fontSize: 11, color: colors.textSec, marginTop: 2 }}>Secondes avant fermeture auto</div>
              </div>
              <div style={{ backgroundColor: colors.accentDim, borderRadius: 8, padding: '4px 10px', border: '1px solid rgba(255,107,0,0.25)' }}>
                <span style={{ fontSize: 15, fontWeight: '800', color: colors.accent }}>{ephemeralDuration}s</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button type="button" onClick={() => setEphemeralDuration(v => Math.max(EPHEM_MIN, v - 1))} disabled={ephemeralDuration <= EPHEM_MIN}
                style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${ephemeralDuration <= EPHEM_MIN ? colors.border : colors.accent}`, backgroundColor: ephemeralDuration <= EPHEM_MIN ? 'transparent' : colors.accent, color: ephemeralDuration <= EPHEM_MIN ? colors.textMut : '#fff', fontSize: 18, fontWeight: '700', cursor: ephemeralDuration <= EPHEM_MIN ? 'not-allowed' : 'pointer' }}>−</button>
              <div style={{ flex: 1, height: 5, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 3, backgroundColor: colors.accent, width: `${((ephemeralDuration - EPHEM_MIN) / (EPHEM_MAX - EPHEM_MIN)) * 100}%`, transition: 'width 0.15s' }}/>
              </div>
              <button type="button" onClick={() => setEphemeralDuration(v => Math.min(EPHEM_MAX, v + 1))} disabled={ephemeralDuration >= EPHEM_MAX}
                style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${ephemeralDuration >= EPHEM_MAX ? colors.border : colors.accent}`, backgroundColor: ephemeralDuration >= EPHEM_MAX ? 'transparent' : colors.accent, color: ephemeralDuration >= EPHEM_MAX ? colors.textMut : '#fff', fontSize: 18, fontWeight: '700', cursor: ephemeralDuration >= EPHEM_MAX ? 'not-allowed' : 'pointer' }}>+</button>
            </div>
            <div style={{ marginTop: 6, fontSize: 10, color: colors.textMut, fontFamily: 'Courier New, monospace', textAlign: 'center', letterSpacing: 1 }}>
              Spectre : {EPHEM_MIN}s — {EPHEM_MAX}s
            </div>
          </div>

          {/* Nombre max de vues */}
          <div style={{ marginBottom: 18, backgroundColor: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: '600', color: colors.textPri }}>Nb de visualisations max</div>
                <div style={{ fontSize: 11, color: colors.textSec, marginTop: 2 }}>Par utilisateur autorisé</div>
              </div>
              <div style={{ backgroundColor: colors.accentDim, borderRadius: 8, padding: '4px 10px', border: '1px solid rgba(255,107,0,0.25)' }}>
                <span style={{ fontSize: 15, fontWeight: '800', color: colors.accent }}>{maxViews}×</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button type="button" onClick={() => setMaxViews(v => Math.max(VIEWS_MIN, v - 1))} disabled={maxViews <= VIEWS_MIN}
                style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${maxViews <= VIEWS_MIN ? colors.border : colors.accent}`, backgroundColor: maxViews <= VIEWS_MIN ? 'transparent' : colors.accent, color: maxViews <= VIEWS_MIN ? colors.textMut : '#fff', fontSize: 18, fontWeight: '700', cursor: maxViews <= VIEWS_MIN ? 'not-allowed' : 'pointer' }}>−</button>
              <div style={{ flex: 1, height: 5, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 3, backgroundColor: colors.accent, width: `${((maxViews - VIEWS_MIN) / (VIEWS_MAX - VIEWS_MIN)) * 100}%`, transition: 'width 0.15s' }}/>
              </div>
              <button type="button" onClick={() => setMaxViews(v => Math.min(VIEWS_MAX, v + 1))} disabled={maxViews >= VIEWS_MAX}
                style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${maxViews >= VIEWS_MAX ? colors.border : colors.accent}`, backgroundColor: maxViews >= VIEWS_MAX ? 'transparent' : colors.accent, color: maxViews >= VIEWS_MAX ? colors.textMut : '#fff', fontSize: 18, fontWeight: '700', cursor: maxViews >= VIEWS_MAX ? 'not-allowed' : 'pointer' }}>+</button>
            </div>
            <div style={{ marginTop: 6, fontSize: 10, color: colors.textMut, fontFamily: 'Courier New, monospace', textAlign: 'center', letterSpacing: 1 }}>
              Limite : {VIEWS_MIN} — {VIEWS_MAX} visualisations
            </div>
          </div>

          {error && (
            <div style={{ marginBottom: 14, padding: '8px 12px', backgroundColor: 'rgba(255,69,58,0.1)', border: '1px solid rgba(255,69,58,0.3)', borderRadius: 8, color: colors.danger, fontSize: 12 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={uploading}
            style={{
              width: '100%',
              padding: '13px',
              backgroundColor: uploading ? colors.accentDim : colors.accent,
              border: 'none',
              borderRadius: 12,
              color: '#fff',
              fontSize: 14,
              fontWeight: '700',
              cursor: uploading ? 'not-allowed' : 'pointer',
            }}
          >
            {uploading ? 'Depot en cours...' : 'Deposer'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Photo Detail Panel ────────────────────────────────────────────────────────

function PhotoDetailPanel({ photo, token, ownerUsername, onClose, onDelete, onAddUser, onRemoveUser, onToggleBlock, onGrantRequest, onUpdateCount, colors }) {
  const [tab, setTab] = useState('auth');
  const [authorized, setAuthorized] = useState(photo?.authorized ?? []);
  const [history, setHistory] = useState(photo?.history ?? []);
  const [requests, setRequests] = useState([]);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerInput, setPickerInput] = useState('');
  const [decryptedUri, setDecryptedUri] = useState(null);
  const [decrypting, setDecrypting] = useState(false);
  const [contacts, setContacts] = useState([]);
  const loadedForRef = useRef(null);

  useEffect(() => {
    API.getSavedContacts(ownerUsername).then(setContacts).catch(() => {});
  }, [ownerUsername]);

  useEffect(() => {
    if (!photo) return;
    if (photo.image_id === loadedForRef.current) return;
    loadedForRef.current = photo.image_id;
    setAuthorized(photo.authorized ?? []);
    setHistory([]);
    setRequests([]);
    setDecryptedUri(null);
    setTab('auth');
    setShowPicker(false);
    setPickerInput('');

    API.fetchMyImageHistory(token, ownerUsername)
      .then(({ accesses }) => {
        const photoAccesses = accesses.filter(a => a.image_id === photo.image_id);
        if (photoAccesses.length > 0) {
          setHistory(photoAccesses.map(a => ({ viewer: a.viewer, date: a.date, type: a.type })));
          onUpdateCount?.(photo.image_id, photoAccesses.length);
        } else {
          setHistory(photo.history ?? []);
        }
      })
      .catch(() => { setHistory(photo.history ?? []); });

    API.fetchAccessRequests(ownerUsername, token)
      .then(({ requests: r }) => setRequests(r.filter(req => req.image_id === photo.image_id && req.status === 'pending')))
      .catch(() => {});
  }, [photo]);

  if (!photo) return null;

  const addUser = async (u) => {
    const username = (u ?? pickerInput).trim().toLowerCase();
    if (!username || authorized.includes(username)) {
      if (!u) setPickerInput('');
      return;
    }
    setAddLoading(true);
    setAddError('');
    try {
      await onAddUser(photo.image_id, username);
      setAuthorized(prev => [...prev, username]);
      setContacts(prev => prev.includes(username) ? prev : [...prev, username]);
      API.addSavedContacts(ownerUsername, [username]).catch(() => {});
      setPickerInput('');
      setShowPicker(false);
    } catch (e) {
      setAddError(e.message || 'Utilisateur introuvable.');
    } finally {
      setAddLoading(false);
    }
  };

  const removeUser = (u) => {
    setAuthorized(prev => prev.filter(x => x !== u));
    onRemoveUser(photo.image_id, u);
  };

  const TABS = [
    ['auth', 'Autorisations'],
    ['history', 'Consultations'],
    ['requests', `Demandes${requests.length > 0 ? ` (${requests.length})` : ''}`],
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(0,0,0,0.65)',
      display: 'flex',
      alignItems: 'stretch',
      justifyContent: 'flex-end',
      zIndex: 500,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%',
        maxWidth: 460,
        backgroundColor: colors.card,
        borderLeft: `1px solid ${colors.border}`,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 20px 0',
          position: 'sticky', top: 0,
          backgroundColor: colors.card,
          zIndex: 1,
          borderBottom: `1px solid ${colors.border}`,
          paddingBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: '700', color: colors.textPri, flex: 1 }}>
              {photo.description}
            </h2>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: colors.textSec, cursor: 'pointer', fontSize: 18, marginLeft: 12 }}
            >
              x
            </button>
          </div>
          <div style={{ fontSize: 11, color: colors.textSec, fontFamily: 'Courier New, monospace' }}>
            {photo.date_creation}
          </div>
        </div>

        {/* Preview / Déchiffrement owner */}
        {decryptedUri ? (
          <div style={{ position: 'relative' }}>
            <img
              src={decryptedUri}
              alt={photo.description}
              style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
            />
            <button
              onClick={() => setDecryptedUri(null)}
              style={{
                position: 'absolute', top: 8, right: 8,
                background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 6,
                color: '#fff', fontSize: 11, padding: '4px 8px', cursor: 'pointer',
              }}
            >Masquer</button>
          </div>
        ) : (
          <div style={{
            width: '100%', height: 200, backgroundColor: '#080810',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 32, color: 'rgba(255,255,255,0.15)' }}>[lock]</span>
            <button
              onClick={async () => {
                setDecrypting(true);
                try {
                  const { signed_url } = await API.recordAccess(token, photo.image_id, ownerUsername);
                  setDecryptedUri(signed_url);
                } catch (e) { /* silently ignore */ }
                finally { setDecrypting(false); }
              }}
              disabled={decrypting}
              style={{
                padding: '6px 16px', fontSize: 11, fontWeight: '700',
                backgroundColor: colors.accent, color: '#fff',
                border: 'none', borderRadius: 8, cursor: decrypting ? 'wait' : 'pointer',
                fontFamily: 'Courier New, monospace', letterSpacing: 1,
              }}
            >{decrypting ? 'Dechiffrement...' : 'Voir'}</button>
          </div>
        )}

        <div style={{ padding: '16px 20px', flex: 1 }}>
          {/* Security params */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {[
              ['DUREE', `${photo.ephemeralDuration ?? 5}s`],
              ['MAX VUES', `${photo.maxViews ?? 3}x`],
              ['ACCES', `${photo.access_count ?? 0}`],
            ].map(([label, val]) => (
              <div key={label} style={{
                flex: 1,
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 10,
                padding: 10,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 9, color: colors.textMut, fontFamily: 'Courier New, monospace', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: '800', color: colors.accent }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            backgroundColor: colors.surface,
            borderRadius: 999,
            padding: 3,
            marginBottom: 18,
            gap: 2,
          }}>
            {TABS.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  borderRadius: 999,
                  border: 'none',
                  backgroundColor: tab === key
                    ? (key === 'requests' && requests.length > 0 ? colors.accent : colors.card)
                    : 'transparent',
                  color: tab === key
                    ? (key === 'requests' && requests.length > 0 ? '#fff' : colors.textPri)
                    : colors.textSec,
                  fontSize: 11,
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Auth tab */}
          {tab === 'auth' && (
            <div>
              {/* Bouton ajouter + picker */}
              <div style={{ marginBottom: 12 }}>
                {!showPicker ? (
                  <button
                    onClick={() => { setShowPicker(true); setAddError(''); }}
                    style={{
                      width: '100%', padding: '10px', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: 8,
                      backgroundColor: colors.accentDim,
                      border: `1px solid ${colors.accent}`,
                      borderRadius: 10, cursor: 'pointer', color: colors.accent,
                      fontSize: 13, fontWeight: '600', fontFamily: 'inherit',
                    }}
                  >
                    <span style={{ fontSize: 16, fontWeight: '300' }}>+</span>
                    Ajouter une personne
                  </button>
                ) : (
                  <div style={{
                    backgroundColor: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 12, padding: '14px',
                  }}>
                    {/* Contacts sauvegardés */}
                    {contacts.filter(u => !authorized.includes(u)).length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 10, color: colors.textSec, fontFamily: 'Courier New, monospace', letterSpacing: 2, marginBottom: 8 }}>
                          CONTACTS ENREGISTRÉS
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {contacts.filter(u => !authorized.includes(u)).map(u => (
                            <button
                              key={u} type="button"
                              onClick={() => addUser(u)}
                              disabled={addLoading}
                              style={{
                                padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: '600',
                                cursor: 'pointer', backgroundColor: colors.accentDim, color: colors.accent,
                                border: `1px solid ${colors.accent}`, fontFamily: 'inherit',
                              }}
                            >{u}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Saisie manuelle */}
                    <div style={{ fontSize: 10, color: colors.textSec, fontFamily: 'Courier New, monospace', letterSpacing: 2, marginBottom: 8 }}>
                      PAR IDENTIFIANT
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        autoFocus
                        value={pickerInput}
                        onChange={e => { setPickerInput(e.target.value); setAddError(''); }}
                        placeholder="Identifiant..."
                        onKeyDown={e => e.key === 'Enter' && addUser()}
                        style={{
                          flex: 1, padding: '8px 12px',
                          backgroundColor: colors.card,
                          border: `1px solid ${addError ? 'rgba(255,69,58,0.5)' : colors.border}`,
                          borderRadius: 8, color: colors.textPri, fontSize: 13,
                          outline: 'none', fontFamily: 'inherit',
                        }}
                      />
                      <button
                        onClick={() => addUser()}
                        disabled={!pickerInput.trim() || addLoading}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: pickerInput.trim() && !addLoading ? colors.accent : colors.border,
                          border: 'none', borderRadius: 8, color: '#fff',
                          fontWeight: '700', fontSize: 14, fontFamily: 'inherit',
                          cursor: !pickerInput.trim() || addLoading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {addLoading ? '...' : '+'}
                      </button>
                    </div>
                    {addError && <p style={{ fontSize: 11, color: colors.danger, margin: '6px 0 0' }}>{addError}</p>}
                    <button
                      onClick={() => { setShowPicker(false); setPickerInput(''); setAddError(''); }}
                      style={{
                        marginTop: 10, width: '100%', padding: '6px', background: 'none',
                        border: 'none', color: colors.textSec, fontSize: 12, cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >Annuler</button>
                  </div>
                )}
              </div>

              {authorized.length === 0 ? (
                <p style={{ color: colors.textMut, fontFamily: 'Courier New, monospace', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
                  Aucun acces accorde
                </p>
              ) : authorized.map(u => (
                <div key={u} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 10, padding: '10px 12px', marginBottom: 8,
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    backgroundColor: colors.accentDim,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: '700', color: colors.accent }}>
                      {u[0].toUpperCase()}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: '500', color: colors.textPri }}>{u}</div>
                    <div style={{ fontSize: 10, color: colors.success, fontFamily: 'Courier New, monospace' }}>
                      Acces accorde
                    </div>
                  </div>
                  <button
                    onClick={() => removeUser(u)}
                    style={{ background: 'none', border: 'none', color: colors.danger, cursor: 'pointer', fontSize: 15 }}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* History tab */}
          {tab === 'history' && (
            <div>
              {history.length === 0 ? (
                <p style={{ color: colors.textMut, fontFamily: 'Courier New, monospace', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>
                  Aucun acces enregistre
                </p>
              ) : history.map((h, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 10, padding: '10px 12px', marginBottom: 8,
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    backgroundColor: h.type === 'watermark' ? 'rgba(255,107,0,0.15)' : 'rgba(0,207,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 13 }}>{h.type === 'watermark' ? 'W' : 'A'}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: '500', color: colors.textPri }}>{h.viewer}</div>
                    <div style={{ fontSize: 10, color: colors.textSec, fontFamily: 'Courier New, monospace' }}>{h.date}</div>
                  </div>
                  <div style={{
                    borderRadius: 999, padding: '3px 9px',
                    backgroundColor: h.type === 'watermark' ? 'rgba(255,107,0,0.12)' : 'rgba(0,207,255,0.1)',
                    border: `1px solid ${h.type === 'watermark' ? 'rgba(255,107,0,0.3)' : 'rgba(0,207,255,0.2)'}`,
                  }}>
                    <span style={{
                      fontSize: 9, fontFamily: 'Courier New, monospace', fontWeight: '700',
                      color: h.type === 'watermark' ? colors.accent : colors.cyan,
                    }}>
                      {h.type === 'watermark' ? 'FILIGRANE' : 'APP'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Requests tab */}
          {tab === 'requests' && (
            <div>
              {requests.length === 0 ? (
                <p style={{ color: colors.textSec, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                  Aucune demande en attente.
                </p>
              ) : requests.map(req => (
                <div key={req.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 10, padding: '10px 12px', marginBottom: 8,
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    backgroundColor: colors.accentDim,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: '700', color: colors.accent }}>
                      {req.requester_username.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: '600', color: colors.textPri }}>{req.requester_username}</div>
                    <div style={{ fontSize: 10, color: colors.textMut, fontFamily: 'Courier New, monospace' }}>{req.date}</div>
                  </div>
                  <button
                    onClick={() => {
                      onGrantRequest(photo.image_id, req.requester_username);
                      setRequests(r => r.filter(x => x.id !== req.id));
                    }}
                    style={{
                      padding: '7px 14px',
                      backgroundColor: colors.accent,
                      border: 'none', borderRadius: 8,
                      color: '#fff', fontWeight: '700', fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Accorder
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Block status */}
          {photo.blocked && (
            <div style={{
              marginTop: 16, padding: '12px 14px',
              backgroundColor: 'rgba(255,69,58,0.07)',
              border: '1px solid rgba(255,69,58,0.25)',
              borderRadius: 10,
            }}>
              <div style={{ fontSize: 12, fontWeight: '700', color: colors.danger, marginBottom: 4 }}>
                Acces suspendu
              </div>
              <div style={{ fontSize: 11, color: colors.textSec, fontFamily: 'Courier New, monospace', lineHeight: 1.6 }}>
                Un acces via filigrane a ete detecte. Image bloquee pour tous les autorises.
              </div>
            </div>
          )}

          <button
            onClick={() => onToggleBlock(photo.image_id)}
            style={{
              width: '100%', marginTop: 12, padding: '12px',
              backgroundColor: photo.blocked ? 'rgba(50,215,75,0.07)' : 'rgba(255,69,58,0.07)',
              border: `1px solid ${photo.blocked ? 'rgba(50,215,75,0.25)' : 'rgba(255,69,58,0.2)'}`,
              borderRadius: 12, cursor: 'pointer',
              color: photo.blocked ? colors.success : colors.danger,
              fontSize: 13, fontWeight: '600',
            }}
          >
            {photo.blocked ? 'Lever le blocage' : "Bloquer l'acces"}
          </button>

          <button
            onClick={() => { if (window.confirm('Supprimer definitivement cette image ?')) { onDelete(photo.image_id); onClose(); } }}
            style={{
              width: '100%', marginTop: 8, padding: '12px',
              backgroundColor: 'rgba(255,69,58,0.07)',
              border: '1px solid rgba(255,69,58,0.2)',
              borderRadius: 12, cursor: 'pointer',
              color: colors.danger, fontSize: 13, fontWeight: '600',
            }}
          >
            Supprimer cette image
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Photo Card ────────────────────────────────────────────────────────────────

function PhotoCard({ photo, onClick, colors }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => onClick(photo)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: colors.card,
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid ${photo.blocked ? 'rgba(255,69,58,0.35)' : colors.border}`,
        cursor: 'pointer',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'transform 0.15s, box-shadow 0.15s',
        boxShadow: hovered ? `0 6px 20px ${colors.overlay}` : 'none',
      }}
    >
      <div style={{ position: 'relative' }}>
        {photo.preview_uri ? (
          <img
            src={photo.preview_uri}
            alt={photo.description}
            style={{
              width: '100%', height: 180, objectFit: 'cover', display: 'block',
              opacity: photo.blocked ? 0.4 : 1,
            }}
          />
        ) : (
          <div style={{
            width: '100%', height: 180,
            backgroundColor: '#080810',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 28, color: colors.textMut }}>[lock]</span>
          </div>
        )}
        {photo.blocked && (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundColor: 'rgba(255,69,58,0.15)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 11, fontWeight: '700', color: colors.danger, fontFamily: 'Courier New, monospace', letterSpacing: 1 }}>
              BLOQUE
            </span>
          </div>
        )}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 12, fontWeight: '600', color: colors.textPri, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {photo.description}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, color: colors.accent, fontFamily: 'Courier New, monospace' }}>
            [{photo.authorized?.length ?? 0} auth]
          </span>
          <span style={{ fontSize: 10, color: photo.access_count > 0 ? colors.cyan : colors.textMut, fontFamily: 'Courier New, monospace' }}>
            [{photo.access_count ?? 0} vues]
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MyPhotosPage() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const [photos, setPhotos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    if (session.isDemo) { setPhotos(MOCK_MY_PHOTOS); return; }
    API.fetchMyPhotos(session.token, session.username)
      .then(({ photos: p }) => {
        setPhotos(p);
        // Pre-populate saved contacts from all existing authorized lists
        const allAuthorized = p.flatMap(ph => ph.authorized ?? []).filter(Boolean);
        if (allAuthorized.length) API.addSavedContacts(session.username, allAuthorized).catch(() => {});
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected) return;
    const updated = photos.find(p => p.image_id === selected.image_id);
    if (updated) setSelected(updated);
  }, [photos]);

  const handleDelete = (imageId) => {
    API.removeFromSessionPhotos(imageId, session.username);
    setPhotos(p => p.filter(x => x.image_id !== imageId));
    if (!session.isDemo) API.deletePhoto(session.token, session.username, imageId).catch(() => {});
  };

  const handleAddUser = async (imageId, username) => {
    await API.authorizePhoto(session.token, imageId, [username], session.username);
    setPhotos(p => p.map(x => {
      if (x.image_id !== imageId) return x;
      const updated = [...(x.authorized ?? []), username];
      API.addToSharedPhotos({ ...x, owner_username: session.username, authorized: updated }, [username]).catch(() => {});
      API.updateFeedAuthorized(imageId, updated).catch(() => {});
      API.updateSessionPhoto(imageId, { authorized: updated }, session.username).catch(() => {});
      return { ...x, authorized: updated };
    }));
  };

  const handleRemoveUser = (imageId, username) => {
    setPhotos(p => p.map(x => {
      if (x.image_id !== imageId) return x;
      const updated = (x.authorized ?? []).filter(u => u !== username);
      API.updateSessionPhoto(imageId, { authorized: updated }, session.username).catch(() => {});
      return { ...x, authorized: updated };
    }));
    if (!session.isDemo) API.revokeAccess(session.token, imageId, username, session.username).catch(() => {});
  };

  const handleGrantRequest = (imageId, requesterUsername) => {
    if (!session.isDemo) {
      API.grantAccessRequest(session.token, session.username, imageId, requesterUsername).catch(() => {});
    }
    setPhotos(p => p.map(x => {
      if (x.image_id !== imageId) return x;
      const updated = [...(x.authorized ?? []), requesterUsername];
      API.updateFeedAuthorized(imageId, updated).catch(() => {});
      return { ...x, authorized: updated };
    }));
  };

  const handleToggleBlock = (imageId) => {
    const current = photos.find(x => x.image_id === imageId);
    const newBlocked = !(current?.blocked ?? false);
    setPhotos(p => p.map(x => x.image_id === imageId ? { ...x, blocked: newBlocked } : x));
    setSelected(s => s ? { ...s, blocked: newBlocked } : s);
    if (!session.isDemo) API.setPhotoBlocked(session.token, imageId, newBlocked).catch(() => {});
  };

  const handleUpdateCount = (imageId, count) => {
    setPhotos(p => p.map(x => x.image_id === imageId ? { ...x, access_count: count } : x));
  };

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: '700', color: colors.textPri }}>Mes Photos</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: colors.textSec, fontFamily: 'Courier New, monospace', letterSpacing: 1 }}>
            MES IMAGES ({photos.length})
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 22px',
            backgroundColor: colors.accent,
            border: 'none', borderRadius: 12,
            color: '#fff', fontSize: 14, fontWeight: '700',
            cursor: 'pointer',
            boxShadow: `0 4px 16px ${colors.accentGlow}`,
          }}
        >
          <span style={{ fontSize: 20, fontWeight: '300' }}>+</span>
          Deposer une image
        </button>
      </div>

      {photos.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 80, color: colors.textSec }}>
          <div style={{ fontSize: 48, marginBottom: 16, color: colors.textMut }}>[ ]</div>
          <h3 style={{ color: colors.textPri, fontWeight: '700', margin: '0 0 8px' }}>Aucune image deposee</h3>
          <p style={{ fontSize: 13 }}>Deposez votre premiere image securisee</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16,
        }}>
          {photos.map(photo => (
            <PhotoCard key={photo.image_id} photo={photo} onClick={setSelected} colors={colors} />
          ))}
        </div>
      )}

      {/* Detail Panel */}
      {selected && (
        <PhotoDetailPanel
          photo={selected}
          token={session.token}
          ownerUsername={session.username}
          onClose={() => setSelected(null)}
          onDelete={handleDelete}
          onAddUser={handleAddUser}
          onRemoveUser={handleRemoveUser}
          onToggleBlock={handleToggleBlock}
          onGrantRequest={handleGrantRequest}
          onUpdateCount={handleUpdateCount}
          colors={colors}
        />
      )}

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          colors={colors}
          onSuccess={({ imageId, uri, description, authorized, ephemeralDuration, maxViews }) => {
            const newPhoto = {
              image_id: imageId,
              owner_username: session.username,
              description: description || 'Image sans titre',
              date_creation: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
              preview_uri: uri,
              authorized,
              ephemeralDuration: ephemeralDuration ?? 5,
              maxViews: maxViews ?? 3,
              blocked: false,
              access_count: 0,
              history: [],
            };
            API.addToSessionPhotos(newPhoto, session.username);
            API.addToFeed({ ...newPhoto, owner_username: session.username }).catch(() => {});
            setPhotos(prev => [newPhoto, ...prev]);
            setShowUpload(false);
          }}
        />
      )}
    </div>
  );
}
