import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

export default function ProfilePage() {
  const { session, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();

  const initials = (session?.username || '?').slice(0, 2).toUpperCase();

  const handleLogout = () => {
    logout(session?.token);
  };

  const infoRow = (label, value) => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 0',
      borderBottom: `1px solid ${colors.border}`,
    }}>
      <span style={{
        fontSize: 11,
        fontFamily: 'Courier New, monospace',
        letterSpacing: 2,
        color: colors.textSec,
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPri,
      }}>
        {value}
      </span>
    </div>
  );

  return (
    <div style={{ padding: '24px 28px', maxWidth: 560 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: '700', color: colors.textPri }}>Profil</h1>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: colors.textSec, fontFamily: 'Courier New, monospace', letterSpacing: 1 }}>
          INFORMATIONS DU COMPTE
        </p>
      </div>

      {/* Avatar card */}
      <div style={{
        backgroundColor: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: 18,
        padding: '28px 24px',
        marginBottom: 16,
      }}>
        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64,
            borderRadius: '50%',
            backgroundColor: colors.accentDim,
            border: `3px solid ${colors.accent}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 22, fontWeight: '800', color: colors.accent }}>
              {initials}
            </span>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: '700', color: colors.textPri, marginBottom: 4 }}>
              {session?.username}
            </div>
            {session?.isDemo && (
              <div style={{
                display: 'inline-block',
                padding: '3px 10px',
                backgroundColor: colors.accentDim,
                borderRadius: 999,
                border: `1px solid ${colors.accent}`,
              }}>
                <span style={{ fontSize: 9, fontFamily: 'Courier New, monospace', color: colors.accent, letterSpacing: 2, fontWeight: '700' }}>
                  MODE DEMO
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Info rows */}
        {infoRow('IDENTIFIANT', session?.username ?? '—')}
        {infoRow('USER ID', session?.userId ?? '—')}
        {infoRow('SESSION', session?.isDemo ? 'Demo' : 'Authentifiee')}
        <div style={{ padding: '14px 0', borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontFamily: 'Courier New, monospace', letterSpacing: 2, color: colors.textSec }}>
              EXPIRATION
            </span>
            <span style={{ fontSize: 12, color: colors.textPri, fontFamily: 'Courier New, monospace' }}>
              {session?.expiresAt
                ? new Date(session.expiresAt).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
                : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Theme card */}
      <div style={{
        backgroundColor: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: 18,
        padding: '20px 24px',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: '600', color: colors.textPri, marginBottom: 3 }}>
              Theme de l'interface
            </div>
            <div style={{ fontSize: 12, color: colors.textSec }}>
              {isDark ? 'Mode sombre actif' : 'Mode clair actif'}
            </div>
          </div>
          <button
            onClick={toggleTheme}
            style={{
              padding: '10px 20px',
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              color: colors.textPri,
              fontSize: 12,
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'Courier New, monospace',
              letterSpacing: 1,
            }}
          >
            {isDark ? 'MODE CLAIR' : 'MODE SOMBRE'}
          </button>
        </div>
      </div>

      {/* Logout card */}
      <div style={{
        backgroundColor: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: 18,
        padding: '20px 24px',
      }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: '600', color: colors.textPri, marginBottom: 3 }}>
            Deconnexion
          </div>
          <div style={{ fontSize: 12, color: colors.textSec }}>
            La session sera effacee. Le token sera invalide cote serveur.
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '12px 24px',
            backgroundColor: 'rgba(255,69,58,0.07)',
            border: '1px solid rgba(255,69,58,0.3)',
            borderRadius: 12,
            color: colors.danger,
            fontSize: 13,
            fontWeight: '700',
            cursor: 'pointer',
            fontFamily: 'Courier New, monospace',
            letterSpacing: 1,
          }}
        >
          SE DECONNECTER
        </button>
      </div>
    </div>
  );
}
