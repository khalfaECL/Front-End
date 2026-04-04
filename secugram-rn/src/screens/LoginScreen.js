import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar, ScrollView,
} from 'react-native';
import { Radius } from '../theme';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

// ── Geometric lock icon (no emoji) ────────────────────────────────────────

function LockMark({ color, accentDim, size = 64 }) {
  const stroke = Math.round(size * 0.088);
  const archW  = size * 0.46;
  const archH  = size * 0.34;
  const bodyW  = size * 0.72;
  const bodyH  = size * 0.44;
  return (
    <View style={{ alignItems: 'center', width: size }}>
      {/* Arch */}
      <View style={{
        width: archW, height: archH,
        borderTopWidth: stroke, borderLeftWidth: stroke, borderRightWidth: stroke,
        borderTopLeftRadius: archW * 0.52, borderTopRightRadius: archW * 0.52,
        borderColor: color,
        marginBottom: -1,
      }}/>
      {/* Body */}
      <View style={{
        width: bodyW, height: bodyH,
        backgroundColor: color,
        borderRadius: size * 0.1,
        alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Keyhole */}
        <View style={{
          width: size * 0.16, height: size * 0.16,
          borderRadius: size, backgroundColor: accentDim,
        }}/>
      </View>
    </View>
  );
}

// ── Input field ───────────────────────────────────────────────────────────

function Field({ label, placeholder, value, onChangeText, secureTextEntry, keyboardType, colors }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMut, letterSpacing: 1.2 }}>
        {label}
      </Text>
      <TextInput
        style={{
          backgroundColor: colors.surface,
          borderRadius: Radius.lg,
          paddingVertical: 15, paddingHorizontal: 18,
          fontSize: 15, color: colors.textPri,
          borderWidth: 1.5,
          borderColor: focused ? colors.accent : colors.border,
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.textMut}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const { login, register } = useAuth();
  const { colors, isDark } = useTheme();
  const [tab,      setTab]      = useState('login');
  const [username, setUsername] = useState('youssef');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('12345');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // ── Password strength ──────────────────────────────────────────────────
  const strength = (() => {
    if (!password) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (password.length >= 8)            score++;
    if (/[A-Z]/.test(password))          score++;
    if (/[0-9]/.test(password))          score++;
    if (/[^A-Za-z0-9]/.test(password))  score++;
    const labels = ['', 'Faible', 'Moyen', 'Bon', 'Fort'];
    const colors = ['transparent', '#FF453A', '#FF9F0A', '#30D158', '#30D158'];
    return { score, label: labels[score], color: colors[score] };
  })();

  const validateRegister = () => {
    if (username.trim().length < 3)   return "L'identifiant doit contenir au moins 3 caractères.";
    if (username.includes(' '))        return "L'identifiant ne peut pas contenir d'espaces.";
    if (password.length < 8)           return 'Le mot de passe doit contenir au moins 8 caractères.';
    if (!/[A-Z]/.test(password))       return 'Le mot de passe doit contenir au moins une majuscule.';
    if (!/[0-9]/.test(password))       return 'Le mot de passe doit contenir au moins un chiffre.';
    if (!/[^A-Za-z0-9]/.test(password)) return 'Le mot de passe doit contenir au moins un caractère spécial.';
    if (password !== confirm)          return 'Les mots de passe ne correspondent pas.';
    return null;
  };

  const handleSubmit = async () => {
    setError('');
    if (!username.trim() || !password.trim()) { setError('Tous les champs sont requis.'); return; }
    if (tab === 'register') {
      const err = validateRegister();
      if (err) { setError(err); return; }
    }
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), email.trim(), password);
      }
    } catch (e) {
      setError(e.message || 'Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg}/>

      {/* Background decoration — large soft circles */}
      <View style={{ ...StyleSheet_abs, overflow: 'hidden' }} pointerEvents="none">
        <View style={{
          position: 'absolute', top: -110, right: -90,
          width: 280, height: 280, borderRadius: 140,
          backgroundColor: colors.accentDim, opacity: 0.55,
        }}/>
        <View style={{
          position: 'absolute', bottom: 60, left: -100,
          width: 220, height: 220, borderRadius: 110,
          backgroundColor: colors.accentDim, opacity: 0.35,
        }}/>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 30, paddingVertical: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Brand ─────────────────────────────────────────────────────── */}
        <View style={{ alignItems: 'center', marginBottom: 56 }}>
          <LockMark color={colors.accent} accentDim={colors.bg} size={70}/>
          <Text style={{
            fontSize: 38, fontWeight: '900',
            color: colors.textPri,
            letterSpacing: 3.5,
            marginTop: 22, marginBottom: 6,
          }}>
            SECUGRAM
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ height: 1, width: 28, backgroundColor: colors.border }}/>
            <Text style={{ fontSize: 9, fontWeight: '600', color: colors.accent, letterSpacing: 2.5 }}>
              SECURE VAULT
            </Text>
            <View style={{ height: 1, width: 28, backgroundColor: colors.border }}/>
          </View>
        </View>

        {/* ── Card ──────────────────────────────────────────────────────── */}
        <View style={{
          backgroundColor: colors.card,
          borderRadius: Radius.xl,
          borderWidth: 1, borderColor: colors.border,
          padding: 24,
          shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
          shadowOpacity: isDark ? 0.4 : 0.08, shadowRadius: 28, elevation: 10,
        }}>

          {/* Segment */}
          <View style={{
            flexDirection: 'row', backgroundColor: colors.surface,
            borderRadius: Radius.full, padding: 3, marginBottom: 28,
          }}>
            {['login', 'register'].map(t => (
              <TouchableOpacity
                key={t}
                style={[
                  { flex: 1, paddingVertical: 11, borderRadius: Radius.full, alignItems: 'center' },
                  tab === t && { backgroundColor: colors.accent },
                ]}
                onPress={() => { setTab(t); setError(''); setConfirm(''); setPassword(''); }}
                activeOpacity={0.8}
              >
                <Text style={{
                  fontSize: 13, fontWeight: '700', letterSpacing: 0.4,
                  color: tab === t ? '#fff' : colors.textSec,
                }}>
                  {t === 'login' ? 'CONNEXION' : 'INSCRIPTION'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Error */}
          {!!error && (
            <View style={{
              backgroundColor: 'rgba(255,69,58,0.08)', borderWidth: 1,
              borderColor: 'rgba(255,69,58,0.25)', borderRadius: Radius.md,
              paddingVertical: 11, paddingHorizontal: 14, marginBottom: 18,
            }}>
              <Text style={{ color: colors.danger, fontSize: 13, textAlign: 'center' }}>{error}</Text>
            </View>
          )}

          {/* Fields */}
          <View style={{ gap: 16, marginBottom: 24 }}>
            <Field
              label="IDENTIFIANT"
              placeholder="nom d'utilisateur"
              value={username}
              onChangeText={setUsername}
              colors={colors}
            />
            {tab === 'register' && (
              <Field
                label="EMAIL"
                placeholder="votre@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                colors={colors}
              />
            )}
            <View style={{ gap: 6 }}>
              <Field
                label="MOT DE PASSE"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                colors={colors}
              />
              {tab === 'register' && password.length > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 2 }}>
                  {[1,2,3,4].map(i => (
                    <View key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      backgroundColor: i <= strength.score ? strength.color : colors.border,
                    }}/>
                  ))}
                  <Text style={{ fontSize: 10, color: strength.color, fontWeight: '700', minWidth: 34 }}>
                    {strength.label}
                  </Text>
                </View>
              )}
            </View>
            {tab === 'register' && (
              <Field
                label="CONFIRMER LE MOT DE PASSE"
                placeholder="••••••••"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                colors={colors}
              />
            )}
          </View>

          {/* Hint */}
          {tab === 'login' && (
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 6, marginBottom: 22,
            }}>
              <Text style={{ fontSize: 10, color: colors.textMut, letterSpacing: 0.5 }}>Compte de test :</Text>
              <Text style={{ fontSize: 10, color: colors.accent, fontWeight: '600', letterSpacing: 0.5 }}>
                youssef / 12345
              </Text>
            </View>
          )}

          {/* CTA */}
          <TouchableOpacity
            style={{
              backgroundColor: colors.accent,
              borderRadius: Radius.xl,
              paddingVertical: 17,
              alignItems: 'center', justifyContent: 'center',
              flexDirection: 'row', gap: 10,
              opacity: loading ? 0.55 : 1,
              shadowColor: colors.accent,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.45, shadowRadius: 18, elevation: 10,
            }}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small"/>
            ) : (
              <>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 1 }}>
                  {tab === 'login' ? 'SE CONNECTER' : 'CRÉER MON COMPTE'}
                </Text>
                <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)' }}>›</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 30 }}>
          {['JWT', 'AES-256', 'Aucun stockage local'].map((tag, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: i === 0 ? 0 : 12 }}>
              {i > 0 && <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: colors.border }}/>}
              <Text style={{ fontSize: 9, color: colors.textMut, fontWeight: '600', letterSpacing: 1 }}>{tag}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const StyleSheet_abs = {
  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
};
