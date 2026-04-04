import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

export default function LoginPage() {
  const { login, register, demoLogin } = useAuth();
  const { colors } = useTheme();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('youssef');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('12345');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const strength = (() => {
    if (!password) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (password.length >= 8)             score++;
    if (/[A-Z]/.test(password))           score++;
    if (/[0-9]/.test(password))           score++;
    if (/[^A-Za-z0-9]/.test(password))   score++;
    const labels = ['', 'Faible', 'Moyen', 'Bon', 'Fort'];
    const clrs   = ['transparent', '#FF453A', '#FF9F0A', '#30D158', '#30D158'];
    return { score, label: labels[score], color: clrs[score] };
  })();

  const validateRegister = () => {
    if (username.trim().length < 3)        return "L'identifiant doit contenir au moins 3 caractères.";
    if (username.includes(' '))             return "L'identifiant ne peut pas contenir d'espaces.";
    if (password.length < 8)               return 'Le mot de passe doit contenir au moins 8 caractères.';
    if (!/[A-Z]/.test(password))           return 'Le mot de passe doit contenir au moins une majuscule.';
    if (!/[0-9]/.test(password))           return 'Le mot de passe doit contenir au moins un chiffre.';
    if (!/[^A-Za-z0-9]/.test(password))   return 'Le mot de passe doit contenir au moins un caractère spécial.';
    if (password !== confirm)              return 'Les mots de passe ne correspondent pas.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isRegister) {
      const err = validateRegister();
      if (err) { setError(err); return; }
    }
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
          <div style={{ marginBottom: isRegister ? 10 : 24 }}>
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
            {/* Indicateur de force */}
            {isRegister && password.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{
                    flex: 1, height: 3, borderRadius: 2,
                    backgroundColor: i <= strength.score ? strength.color : colors.border,
                    transition: 'background-color 0.2s',
                  }}/>
                ))}
                <span style={{ fontSize: 10, fontWeight: '700', color: strength.color, minWidth: 34 }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm password (register only) */}
          {isRegister && (
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>CONFIRMER LE MOT DE PASSE</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                style={{
                  ...inputStyle,
                  borderColor: confirm && confirm !== password ? 'rgba(255,69,58,0.6)' : colors.border,
                }}
              />
              {confirm && confirm !== password && (
                <div style={{ fontSize: 11, color: colors.danger, marginTop: 5 }}>
                  Les mots de passe ne correspondent pas.
                </div>
              )}
            </div>
          )}

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
            onClick={() => { setIsRegister(r => !r); setError(''); setConfirm(''); setPassword(''); }}
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
