import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

const NAV_ITEMS = [
  { id: 'feed',    label: 'Feed',       icon: '[FEED]' },
  { id: 'photos',  label: 'Photos',     icon: '[IMG]'  },
  { id: 'shared',  label: 'Partagées',  icon: '[SHR]'  },
  { id: 'history', label: 'Historique', icon: '[LOG]'  },
  { id: 'profile', label: 'Profil',     icon: '[USR]'  },
];

export default function Sidebar({ activePage, onNavigate }) {
  const { session, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const [hovered, setHovered] = useState(null);

  const handleLogout = () => {
    logout(session?.token);
  };

  return (
    <aside style={{
      width: 220,
      minWidth: 220,
      height: '100vh',
      backgroundColor: colors.surface,
      borderRight: `1px solid ${colors.border}`,
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      boxSizing: 'border-box',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '28px 20px 22px',
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <div style={{
          fontFamily: 'Courier New, monospace',
          fontSize: 18,
          fontWeight: '800',
          color: colors.textPri,
          letterSpacing: 3,
          marginBottom: 3,
        }}>
          SECUGRAM
        </div>
        <div style={{
          fontFamily: 'Courier New, monospace',
          fontSize: 9,
          fontWeight: '600',
          color: colors.accent,
          letterSpacing: 4,
        }}>
          SECURE VAULT
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.id;
          const isHov = hovered === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '11px 20px',
                background: isActive
                  ? colors.accentDim
                  : isHov
                    ? colors.border
                    : 'transparent',
                border: 'none',
                borderLeft: isActive
                  ? `3px solid ${colors.accent}`
                  : '3px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                boxSizing: 'border-box',
                transition: 'background 0.15s',
              }}
            >
              <span style={{
                fontFamily: 'Courier New, monospace',
                fontSize: 9,
                fontWeight: '700',
                color: isActive ? colors.accent : colors.textMut,
                letterSpacing: 1,
                minWidth: 36,
              }}>
                {item.icon}
              </span>
              <span style={{
                fontSize: 13,
                fontWeight: isActive ? '700' : '500',
                color: isActive ? colors.accent : colors.textSec,
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom: user info + controls */}
      <div style={{
        borderTop: `1px solid ${colors.border}`,
        padding: '14px 16px',
      }}>
        {/* Username */}
        {session && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 12,
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: colors.accentDim,
              border: `2px solid ${colors.accent}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.accent,
              }}>
                {(session.username || '?').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <span style={{
              fontSize: 12,
              fontWeight: '600',
              color: colors.textPri,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {session.username}
            </span>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={{
            width: '100%',
            padding: '8px 12px',
            marginBottom: 8,
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            cursor: 'pointer',
            color: colors.textSec,
            fontSize: 12,
            fontFamily: 'Courier New, monospace',
            letterSpacing: 1,
            textAlign: 'center',
          }}
        >
          {isDark ? 'MODE CLAIR' : 'MODE SOMBRE'}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'rgba(255,69,58,0.07)',
            border: '1px solid rgba(255,69,58,0.25)',
            borderRadius: 8,
            cursor: 'pointer',
            color: colors.danger,
            fontSize: 12,
            fontWeight: '600',
            fontFamily: 'Courier New, monospace',
            letterSpacing: 1,
            textAlign: 'center',
          }}
        >
          DECONNEXION
        </button>
      </div>
    </aside>
  );
}
