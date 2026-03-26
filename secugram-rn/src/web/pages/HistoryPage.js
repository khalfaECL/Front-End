import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import * as API from '../../api';

const MOCK_MY_IMAGE_ACCESSES = [
  { id: 'h1', image_id: 'img_001', image_description: 'Vacances Nice 2025', preview_uri: 'https://picsum.photos/seed/beach/80/80', viewer: 'khakfa_youssef', date: '2 mars 14h23', type: 'app' },
  { id: 'h2', image_id: 'img_001', image_description: 'Vacances Nice 2025', preview_uri: 'https://picsum.photos/seed/beach/80/80', viewer: 'chammakhi_malak', date: '4 mars 09h11', type: 'app' },
  { id: 'h3', image_id: 'img_001', image_description: 'Vacances Nice 2025', preview_uri: 'https://picsum.photos/seed/beach/80/80', viewer: 'inconnu_device_3F2A', date: '5 mars 22h04', type: 'watermark' },
];

const MOCK_MY_ACCESSES = [
  { id: 'a1', image_id: 'img_010', image_description: 'Conference Paris 2025', preview_uri: 'https://picsum.photos/seed/conf/80/80', owner: 'khakfa_youssef', date: '16 fev. 10h05' },
  { id: 'a2', image_id: 'img_012', image_description: 'Prototype V2', preview_uri: 'https://picsum.photos/seed/tech/80/80', owner: 'chammakhi_malak', date: '6 mars 15h40' },
];

function TypeBadge({ type, colors }) {
  const isWm = type === 'watermark';
  return (
    <div style={{
      borderRadius: 999, padding: '4px 10px',
      backgroundColor: isWm ? 'rgba(255,107,0,0.12)' : 'rgba(0,207,255,0.1)',
      border: `1px solid ${isWm ? 'rgba(255,107,0,0.3)' : 'rgba(0,207,255,0.2)'}`,
    }}>
      <span style={{
        fontSize: 9, fontWeight: '700', fontFamily: 'Courier New, monospace',
        color: isWm ? colors.accent : colors.cyan,
        letterSpacing: 1,
      }}>
        {isWm ? 'FILIGRANE' : 'APP'}
      </span>
    </div>
  );
}

export default function HistoryPage() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const [tab, setTab] = useState('my_images');
  const [myImageAccesses, setMyImageAccesses] = useState(session.isDemo ? MOCK_MY_IMAGE_ACCESSES : []);
  const [myAccesses, setMyAccesses]           = useState(session.isDemo ? MOCK_MY_ACCESSES : []);

  useEffect(() => {
    if (session.isDemo) return;
    API.fetchMyImageHistory(session.token, session.username)
      .then(({ accesses }) => setMyImageAccesses(accesses))
      .catch(() => setMyImageAccesses([]));
    API.fetchMyAccesses(session.token, session.username)
      .then(({ accesses }) => setMyAccesses(accesses))
      .catch(() => setMyAccesses([]));
  }, [session.username]);

  const data = tab === 'my_images' ? myImageAccesses : myAccesses;

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: '700', color: colors.textPri }}>Historique</h1>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: colors.textSec, fontFamily: 'Courier New, monospace', letterSpacing: 1 }}>
          JOURNAL DES ACCES
        </p>
      </div>

      {/* Segment control */}
      <div style={{
        display: 'flex',
        backgroundColor: colors.surface,
        borderRadius: 999,
        padding: 3,
        maxWidth: 400,
        marginBottom: 24,
        gap: 2,
      }}>
        {[['my_images', 'Acces a mes images'], ['my_access', 'Mes acces']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: 999,
              border: 'none',
              backgroundColor: tab === key ? colors.card : 'transparent',
              color: tab === key ? colors.textPri : colors.textSec,
              fontSize: 13,
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Info banner */}
      {tab === 'my_images' ? (
        <div style={{
          marginBottom: 20,
          padding: '10px 14px',
          backgroundColor: 'rgba(0,207,255,0.06)',
          border: '1px solid rgba(0,207,255,0.15)',
          borderRadius: 10,
          maxWidth: 680,
        }}>
          <p style={{ margin: 0, fontSize: 11, color: colors.cyan, fontFamily: 'Courier New, monospace', lineHeight: 1.6 }}>
            APP — acces via Secugram (utilisateur autorise){'\n'}
            FILIGRANE — detecte via tatouage numerique invisible
          </p>
        </div>
      ) : (
        <div style={{
          marginBottom: 20,
          padding: '10px 14px',
          backgroundColor: 'rgba(255,107,0,0.06)',
          border: '1px solid rgba(255,107,0,0.15)',
          borderRadius: 10,
          maxWidth: 680,
        }}>
          <p style={{ margin: 0, fontSize: 11, color: colors.accent, fontFamily: 'Courier New, monospace', lineHeight: 1.6 }}>
            Images consultees via Secugram lorsque vous etiez autorise.{'\n'}
            Votre acces a ete enregistre chez le proprietaire.
          </p>
        </div>
      )}

      {/* List */}
      {data.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 60, color: colors.textSec }}>
          <div style={{ fontSize: 40, marginBottom: 14, color: colors.textMut }}>[--]</div>
          <h3 style={{ color: colors.textPri, fontWeight: '700', margin: '0 0 8px' }}>Aucun historique</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 680 }}>
          {data.map(item => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 0,
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              {/* Thumbnail */}
              <div style={{ width: 64, height: 64, flexShrink: 0 }}>
                {item.preview_uri ? (
                  <img src={item.preview_uri} alt="" style={{ width: 64, height: 64, objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{
                    width: 64, height: 64,
                    backgroundColor: '#080810',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: colors.textMut, fontSize: 9, fontFamily: 'Courier New, monospace',
                  }}>
                    [img]
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, padding: '10px 14px' }}>
                <div style={{
                  fontSize: 13, fontWeight: '600', color: colors.textPri,
                  marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {item.image_description}
                </div>

                {tab === 'my_images' ? (
                  <div style={{ fontSize: 12, color: colors.textSec, marginBottom: 4 }}>
                    {item.type === 'watermark' ? (
                      <>
                        <span style={{ color: colors.accent }}>Acces non autorise — </span>
                        <span style={{ fontWeight: '500', color: colors.accent }}>{item.viewer}</span>
                      </>
                    ) : (
                      <>
                        Consulte par{' '}
                        <span style={{ fontWeight: '500', color: colors.textPri }}>{item.viewer}</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: colors.textSec, marginBottom: 4 }}>
                    De :{' '}
                    <span style={{ fontWeight: '500', color: colors.textPri }}>{item.owner}</span>
                  </div>
                )}

                <div style={{ fontSize: 10, color: colors.textMut, fontFamily: 'Courier New, monospace' }}>
                  {item.date}
                </div>
              </div>

              {/* Badge */}
              {tab === 'my_images' && (
                <div style={{ paddingRight: 14 }}>
                  <TypeBadge type={item.type} colors={colors} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
