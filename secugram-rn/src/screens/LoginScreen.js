import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Colors, Radius, Spacing } from '../theme';
import { PrimaryButton, InputField, ErrorBox } from '../components/UI';
import { useAuth } from '../hooks/useAuth';

export default function LoginScreen() {
  const { login, register } = useAuth();

  const [tab,      setTab]      = useState('login');
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Tous les champs sont requis.');
      return;
    }
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(username.trim(), password);
      } else {
        if (!email.trim()) { setError("L'email est requis."); setLoading(false); return; }
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
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoZone}>
          <View style={styles.logoIcon}>
            <Text style={{ fontSize: 32 }}>🔒</Text>
          </View>
          <Text style={styles.logoName}>Secugram</Text>
          <Text style={styles.logoTagline}>ENCRYPTED · PRIVATE · YOURS</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {['login', 'register'].map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => { setTab(t); setError(''); }}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'login' ? 'Connexion' : 'Inscription'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ErrorBox message={error}/>

        <InputField
          label="Nom d'utilisateur"
          icon="👤"
          placeholder="alice_dupont"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {tab === 'register' && (
          <InputField
            label="Email"
            icon="✉️"
            placeholder="alice@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        )}

        <InputField
          label="Mot de passe"
          icon="🔑"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <PrimaryButton
          label={tab === 'login' ? 'Se connecter' : 'Créer mon compte'}
          icon="🛡️"
          onPress={handleSubmit}
          loading={loading}
          style={{ marginTop: 8 }}
        />

        {/* Security footer */}
        <View style={styles.securityNote}>
          <Text style={styles.securityNoteText}>
            🔐  Token JWT · Chiffrement AES-256 · Aucun stockage local
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },

  // Logo
  logoZone: { alignItems: 'center', marginBottom: 40 },
  logoIcon: {
    width: 72, height: 72,
    backgroundColor: Colors.accent,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  logoName: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: -1,
    marginBottom: 4,
  },
  logoTagline: {
    fontSize: 10,
    color: Colors.textSec,
    letterSpacing: 2.5,
    fontFamily: 'Courier New',
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 4,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1, paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: { fontSize: 14, fontWeight: '500', color: Colors.textSec },
  tabTextActive: { color: Colors.textPri },

  // Footer
  securityNote: {
    marginTop: 28,
    alignItems: 'center',
  },
  securityNoteText: {
    fontSize: 11,
    color: Colors.textMut,
    fontFamily: 'Courier New',
    textAlign: 'center',
  },
});
