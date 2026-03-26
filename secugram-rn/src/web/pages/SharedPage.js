import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import * as API from '../../api';

export default function SharedPage() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.fetchSharedPhotos(session.token, session.username)
      .then(({ photos: p }) => setPhotos(p))
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  }, [session.username]);

  const statusColor = (status) => {
    if (status === 'pending')  return colors.warning;
    if (status === 'active')   return colors.success;
    if (status === 'granted')  return colors.success;
    return colors.textSec;
  };

  const statusLabel = (status) => {
    if (status === 'pending') return 'EN ATTENTE';
    if (status === 'active')  return 'ACTIF';
    if (status === 'granted') return 'ACCORDE';
    return 'INCONNU';
  };

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: '700', color: colors.textPri }}>Partagees</h1>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: colors.textSec, fontFamily: 'Courier New, monospace', letterSpacing: 1 }}>
          IMAGES PARTAGEES AVEC MOI ({photos.length})
        </p>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: colors.textSec }}>
          Chargement...
        </div>
      )}

      {!loading && photos.length === 0 && (
        <div style={{ textAlign: 'center', paddingTop: 80, color: colors.textSec }}>
          <div style={{ fontSize: 48, marginBottom: 16, color: colors.textMut }}>[ ]</div>
          <h3 style={{ color: colors.textPri, fontWeight: '700', margin: '0 0 8px' }}>Aucune image partagee</h3>
          <p style={{ fontSize: 13 }}>
            Les images que d'autres utilisateurs partagent avec vous apparaissent ici.
          </p>
        </div>
      )}

      {!loading && photos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 680 }}>
          {photos.map((photo) => (
            <div
              key={photo.image_id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              {/* Thumbnail */}
              <div style={{
                width: 80, height: 80, flexShrink: 0,
                backgroundColor: '#080810',
                overflow: 'hidden',
              }}>
                {photo.preview_uri ? (
                  <img
                    src={photo.preview_uri}
                    alt={photo.description}
                    style={{ width: 80, height: 80, objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{
                    width: 80, height: 80,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: colors.textMut, fontSize: 10, fontFamily: 'Courier New, monospace',
                  }}>
                    [lock]
                  </div>
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, padding: '12px 0', minWidth: 0 }}>
                <div style={{
                  fontSize: 14, fontWeight: '600', color: colors.textPri,
                  marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {photo.description || 'Sans titre'}
                </div>
                <div style={{ fontSize: 12, color: colors.textSec, marginBottom: 4 }}>
                  De :{' '}
                  <span style={{ fontWeight: '600', color: colors.textPri }}>
                    {photo.owner_username}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: colors.textMut, fontFamily: 'Courier New, monospace' }}>
                  {photo.date_shared || ''}
                </div>
              </div>

              {/* Status badge */}
              <div style={{ paddingRight: 16 }}>
                <div style={{
                  borderRadius: 999,
                  padding: '4px 10px',
                  backgroundColor: `${statusColor(photo.status)}20`,
                  border: `1px solid ${statusColor(photo.status)}50`,
                }}>
                  <span style={{
                    fontSize: 9,
                    fontFamily: 'Courier New, monospace',
                    fontWeight: '700',
                    color: statusColor(photo.status),
                    letterSpacing: 1,
                  }}>
                    {statusLabel(photo.status)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
