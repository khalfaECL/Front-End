import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

export default function LoginPage() {
  const { login, register, demoLogin } = useAuth();
  const { colors } = useTheme();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(username, email, password);
      } else {
        await login(username, password);
      }
    } catch (err) {
      setError(err.message || 'Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    color: colors.textPri,
    fontSize: 14,
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'inherit',
  };

  const labelStyle = {
    fontSize: 11,
    fontFamily: 'Courier New, monospace',
    letterSpacing: 2,
    color: colors.textSec,
    display: 'block',
    marginBottom: 6,
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bg,
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        backgroundColor: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: 20,
        padding: '40px 36px',
        boxSizing: 'border-box',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            fontFamily: 'Courier New, monospace',
            fontSize: 24,
            fontWeight: '800',
            color: colors.textPri,
            letterSpacing: 4,
            marginBottom: 4,
          }}>
            SECUGRAM
          </div>
          <div style={{
            fontFamily: 'Courier New, monospace',
            fontSize: 9,
            fontWeight: '600',
            color: colors.accent,
            letterSpacing: 5,
          }}>
            SECURE VAULT
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>IDENTIFIANT</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Votre identifiant"
              required
              autoComplete="username"
              style={inputStyle}
            />
          </div>

          {/* Email (register only) */}
          {isRegister && (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com"
                style={inputStyle}
              />
            </div>
          )}

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>MOT DE PASSE</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              style={inputStyle}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 16,
              padding: '10px 14px',
              backgroundColor: 'rgba(255,69,58,0.1)',
              border: '1px solid rgba(255,69,58,0.3)',
              borderRadius: 8,
              color: colors.danger,
              fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {/* Primary action */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? colors.accentDim : colors.accent,
              border: 'none',
              borderRadius: 12,
              color: '#fff',
              fontSize: 15,
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: 12,
              letterSpacing: 0.5,
            }}
          >
            {loading ? 'Chargement...' : isRegister ? "S'inscrire" : 'Se connecter'}
          </button>

          {/* Demo login */}
          {!isRegister && (
            <button
              type="button"
              onClick={demoLogin}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'transparent',
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                color: colors.textSec,
                fontSize: 13,
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: 12,
                fontFamily: 'Courier New, monospace',
                letterSpacing: 1,
              }}
            >
              DEMO LOGIN
            </button>
          )}
        </form>

        {/* Toggle */}
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <span style={{ fontSize: 13, color: colors.textSec }}>
            {isRegister ? 'Déjà un compte ?' : 'Pas encore inscrit ?'}
          </span>{' '}
          <button
            onClick={() => { setIsRegister(r => !r); setError(''); }}
            style={{
              background: 'none',
              border: 'none',
              color: colors.accent,
              fontSize: 13,
              fontWeight: '700',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {isRegister ? 'Se connecter' : "S'inscrire"}
          </button>
        </div>
      </div>
    </div>
  );
}
