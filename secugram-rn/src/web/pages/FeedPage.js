import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import * as API from '../../api';

// ── Encrypted Placeholder ─────────────────────────────────────────────────────

function EncryptedPlaceholder() {
  const { colors } = useTheme();
  const rows = Array.from({ length: 8 });
  return (
    <div style={{
      width: '100%',
      aspectRatio: '1',
      backgroundColor: '#080810',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '8px 8px 0 0',
    }}>
      {/* Hex pattern */}
      <div style={{ position: 'absolute', inset: 0, padding: 8 }}>
        {rows.map((_, i) => (
          <div key={i} style={{
            fontFamily: 'Courier New, monospace',
            fontSize: 8,
            color: 'rgba(255,107,0,0.07)',
            letterSpacing: 2,
            lineHeight: '16px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}>
            {'4A2F 8C1E B37D 9F56 2A4E 1C8B 5F3D 7E2A '.repeat(5)}
          </div>
        ))}
      </div>
      {/* Lock icon */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 18, height: 12,
            border: `3px solid rgba(255,255,255,0.4)`,
            borderBottom: 'none',
            borderRadius: '9px 9px 0 0',
            margin: '0 auto',
          }}/>
          <div style={{
            width: 28, height: 18,
            borderRadius: 4,
            backgroundColor: 'rgba(255,255,255,0.4)',
            margin: '0 auto',
          }}/>
        </div>
        <div style={{
          fontFamily: 'Courier New, monospace',
          fontSize: 9,
          letterSpacing: 3,
          color: 'rgba(255,255,255,0.35)',
        }}>
          AES-256-GCM
        </div>
      </div>
    </div>
  );
}

// ── Ephemeral Viewer ──────────────────────────────────────────────────────────

function EphemeralViewer({ uri, durationSec = 5, onClose }) {
  const [secondsLeft, setSecondsLeft] = useState(durationSec);
  const { colors } = useTheme();

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(interval); return 0; }
        return s - 1;
      });
    }, 1000);
    const timeout = setTimeout(onClose, durationSec * 1000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, []);

  const progress = ((durationSec - secondsLeft) / durationSec) * 100;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.97)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      {/* Progress bar */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.1)',
      }}>
        <div style={{
          height: 3,
          backgroundColor: colors.accent,
          width: `${100 - progress}%`,
          transition: 'width 1s linear',
        }}/>
      </div>

      {/* Timer */}
      <div style={{
        position: 'absolute',
        top: 18, right: 18,
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
      }}>
        {secondsLeft}s
      </div>

      {/* Image */}
      <img
        src={uri}
        alt="Déchiffré"
        style={{
          maxWidth: '80vw',
          maxHeight: '80vh',
          objectFit: 'contain',
          borderRadius: 12,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          bottom: 40,
          padding: '10px 28px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 22,
          color: '#fff',
          fontSize: 14,
          fontWeight: '600',
          cursor: 'pointer',
        }}
      >
        Fermer
      </button>
    </div>
  );
}

// ── Post Card ─────────────────────────────────────────────────────────────────

function PostCard({ item, currentUsername, token, isPending, onRequestAccess }) {
  const { colors, viewCooldown } = useTheme();
  const isOwner      = item.owner_username === currentUsername;
  const isAuthorized = isOwner || (item.authorized ?? []).includes(currentUsername);
  const initials     = (item.owner_username || '?').slice(0, 2).toUpperCase();

  const [decryptedUri,  setDecryptedUri]  = useState(null);
  const [decrypting,    setDecrypting]    = useState(false);
  const [decryptErr,    setDecryptErr]    = useState('');
  const [ephemeralSecs, setEphemeralSecs] = useState(item.ephemeralDuration ?? 5);

  const handleDecrypt = async () => {
    if (!isAuthorized) return;
    if (decryptedUri) { setDecryptedUri(null); return; }
    setDecrypting(true);
    setDecryptErr('');
    try {
      const { signed_url, ephemeral_duration } = await API.recordAccess(token, item.image_id, currentUsername, viewCooldown);
      setEphemeralSecs(ephemeral_duration ?? item.ephemeralDuration ?? 5);
      setDecryptedUri(signed_url);
      if (!isOwner) {
        API.logAccess({
          imageId:          item.image_id,
          imageDescription: item.description ?? item.caption ?? '',
          viewerUsername:   currentUsername,
          ownerUsername:    item.owner_username,
          token,
        }).catch(() => {});
      }
    } catch (e) {
      setDecryptErr(e.message || 'Impossible de déchiffrer.');
    } finally {
      setDecrypting(false);
    }
  };

  return (
    <div style={{
      backgroundColor: colors.card,
      border: `1px solid ${colors.border}`,
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 14px',
      }}>
        <div style={{
          width: 38, height: 38,
          borderRadius: '50%',
          border: `2px solid ${colors.accent}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 12, fontWeight: '700', color: colors.accent }}>{initials}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: '700', color: colors.textPri }}>{item.owner_username}</div>
          <div style={{
            fontSize: 10,
            color: colors.textMut,
            fontFamily: 'Courier New, monospace',
          }}>{item.date_creation ?? ''}</div>
        </div>
        <div style={{
          backgroundColor: isAuthorized ? 'rgba(50,215,75,0.1)' : 'rgba(255,107,0,0.1)',
          borderRadius: 999,
          padding: '3px 10px',
          border: `1px solid ${isAuthorized ? 'rgba(50,215,75,0.25)' : 'rgba(255,107,0,0.25)'}`,
        }}>
          <span style={{
            fontSize: 9,
            fontFamily: 'Courier New, monospace',
            color: isAuthorized ? '#32D74B' : colors.accent,
          }}>
            {isAuthorized ? 'AUTORISE' : 'CHIFFRE'}
          </span>
        </div>
      </div>

      {/* Image area */}
      <div
        style={{ position: 'relative', cursor: isAuthorized ? 'pointer' : 'default' }}
        onClick={handleDecrypt}
      >
        <EncryptedPlaceholder />
        {isAuthorized && (
          <div style={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0,0,0,0.65)',
            borderRadius: 20,
            padding: '6px 18px',
            border: '1px solid rgba(255,255,255,0.15)',
            whiteSpace: 'nowrap',
          }}>
            <span style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
              {decrypting ? 'Déchiffrement...' : 'Cliquer pour déchiffrer'}
            </span>
          </div>
        )}
      </div>

      {/* Ephemeral viewer overlay */}
      {decryptedUri && (
        <EphemeralViewer uri={decryptedUri} durationSec={ephemeralSecs} onClose={() => setDecryptedUri(null)} />
      )}

      {/* Footer */}
      <div style={{ padding: '12px 14px' }}>
        {(item.description || item.caption) && (
          <p style={{ margin: '0 0 10px', fontSize: 13, color: colors.textPri, lineHeight: 1.5 }}>
            <strong>{item.owner_username} </strong>
            {item.description ?? item.caption}
          </p>
        )}

        {decryptErr && (
          <p style={{ margin: '0 0 8px', fontSize: 12, color: colors.danger }}>{decryptErr}</p>
        )}

        {!isOwner && !isAuthorized && (
          <button
            onClick={() => !isPending && onRequestAccess(item)}
            disabled={isPending}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: isPending ? 'transparent' : colors.accent,
              border: isPending ? `1px solid ${colors.border}` : 'none',
              borderRadius: 10,
              color: isPending ? colors.textSec : '#fff',
              fontSize: 13,
              fontWeight: '700',
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.65 : 1,
            }}
          >
            {isPending ? "En attente de reponse..." : "Demander l'acces"}
          </button>
        )}

        {!isOwner && isAuthorized && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#32D74B' }}/>
            <span style={{ fontSize: 11, color: '#32D74B', fontFamily: 'Courier New, monospace' }}>
              ACCES AUTORISE
            </span>
          </div>
        )}

        {isOwner && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: colors.accent }}/>
            <span style={{ fontSize: 11, color: colors.accent, fontFamily: 'Courier New, monospace' }}>
              VOTRE IMAGE
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [pendingIds, setPendingIds] = useState({});
  const [error, setError]           = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (session.isDemo) { setPosts([]); setLoading(false); return; }
      const { posts: p } = await API.fetchFeed(session.token, session.username);
      setPosts(p);
      const { photos: shared } = await API.fetchSharedPhotos(null, session.username).catch(() => ({ photos: [] }));
      const pending = {};
      shared.filter(s => s.status === 'pending').forEach(s => { pending[s.image_id] = true; });
      setPendingIds(pending);
    } catch (e) {
      setError(e.message || 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }, [session.username, session.isDemo]);

  useEffect(() => { load(); }, [load]);

  const handleRequestAccess = async (item) => {
    try {
      await API.requestImageAccess({
        imageId:           item.image_id,
        imageDescription:  item.description ?? item.caption ?? '',
        ownerUsername:     item.owner_username,
        requesterUsername: session.username,
        token:             session.token,
      });
      setPendingIds(p => ({ ...p, [item.image_id]: true }));
    } catch (e) {
      alert(e.message || "Impossible d'envoyer la demande.");
    }
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: '700', color: colors.textPri }}>Feed</h1>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: colors.textSec, fontFamily: 'Courier New, monospace', letterSpacing: 1 }}>
          PUBLICATIONS RECENTES
        </p>
      </div>

      {/* Refresh */}
      <button
        onClick={load}
        style={{
          marginBottom: 24,
          padding: '8px 18px',
          backgroundColor: colors.accentDim,
          border: `1px solid ${colors.accent}`,
          borderRadius: 8,
          color: colors.accent,
          fontSize: 12,
          fontWeight: '600',
          cursor: 'pointer',
          fontFamily: 'Courier New, monospace',
          letterSpacing: 1,
        }}
      >
        ACTUALISER
      </button>

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: colors.textSec }}>
          Chargement...
        </div>
      )}

      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(255,69,58,0.1)',
          border: '1px solid rgba(255,69,58,0.3)',
          borderRadius: 10,
          color: colors.danger,
          marginBottom: 20,
          fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {!loading && posts.length === 0 && !error && (
        <div style={{ textAlign: 'center', paddingTop: 80, color: colors.textSec }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>[ ]</div>
          <h3 style={{ color: colors.textPri, fontWeight: '700', margin: '0 0 8px' }}>Aucune publication</h3>
          <p style={{ fontSize: 13 }}>
            Deposez une image depuis "Photos" pour qu'elle apparaisse ici.
          </p>
        </div>
      )}

      {/* Grid */}
      {!loading && posts.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {posts.map(post => (
            <PostCard
              key={post.image_id}
              item={post}
              currentUsername={session.username}
              token={session.token}
              isPending={!!pendingIds[post.image_id]}
              onRequestAccess={handleRequestAccess}
            />
          ))}
        </div>
      )}
    </div>
  );
}
