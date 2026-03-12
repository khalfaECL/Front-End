import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Radius, Spacing } from '../theme';
import { Avatar, DangerButton } from '../components/UI';
import { useAuth } from '../hooks/useAuth';

const SECURITY_ITEMS = [
  { icon: '🔑', label: 'Clé de chiffrement',  value: 'Stockée côté serveur uniquement' },
  { icon: '💾', label: 'Stockage token',        value: 'Mémoire vive (non-persistant)' },
  { icon: '🖼️', label: 'Tatouage numérique',   value: 'Watermark invisible sur chaque image' },
  { icon: '⏱️', label: 'Expiration session',   value: 'JWT valide 1 heure' },
];

export default function ProfileScreen({ photoCount = 0 }) {
  const { session, logout } = useAuth();

  const initials = (session?.username || 'U').slice(0, 2).toUpperCase();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <Avatar initials={initials} size={84} radius={28}/>
        </View>
        <Text style={styles.username}>{session?.username}</Text>
        <Text style={styles.handle}>@{session?.username}</Text>

        <View style={styles.secBadge}>
          <Text style={styles.secBadgeText}>🛡️  Session sécurisée · JWT actif · AES-256</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { value: photoCount, label: 'Photos' },
          { value: 'AES',      label: 'Chiffrement' },
          { value: 'JWT',      label: 'Auth' },
        ].map((s, i) => (
          <View key={i} style={[styles.statCell, i < 2 && styles.statCellBorder]}>
            <Text style={styles.statNum}>{s.value}</Text>
            <Text style={styles.statLbl}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Security section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SÉCURITÉ</Text>
        {SECURITY_ITEMS.map(item => (
          <View key={item.label} style={styles.secItem}>
            <View style={styles.secItemIcon}>
              <Text style={{ fontSize: 18 }}>{item.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.secItemLabel}>{item.label}</Text>
              <Text style={styles.secItemValue}>{item.value}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Session info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SESSION ACTIVE</Text>
        <View style={styles.sessionCard}>
          <View style={styles.sessionRow}>
            <Text style={styles.sessionKey}>user_id</Text>
            <Text style={styles.sessionVal} numberOfLines={1}>{session?.userId}</Text>
          </View>
          <View style={styles.sessionRow}>
            <Text style={styles.sessionKey}>token</Text>
            <Text style={styles.sessionVal} numberOfLines={1}>
              {session?.token?.slice(0, 16)}...
            </Text>
          </View>
          <View style={styles.sessionRow}>
            <Text style={styles.sessionKey}>stockage</Text>
            <Text style={[styles.sessionVal, { color: Colors.success }]}>mémoire vive</Text>
          </View>
        </View>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <DangerButton
          label="Se déconnecter & effacer session"
          icon="🚪"
          onPress={logout}
        />
        <Text style={styles.logoutNote}>
          La session sera définitivement effacée de la mémoire.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 40 },

  // Header
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: 'rgba(91,142,255,.04)',
  },
  avatarWrap: {
    marginBottom: 14,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  username: { fontSize: 22, fontWeight: '700', color: Colors.textPri, marginBottom: 2 },
  handle: { fontSize: 13, color: Colors.textSec, fontFamily: 'Courier New', marginBottom: 14 },
  secBadge: {
    backgroundColor: 'rgba(0,212,204,.07)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,204,.2)',
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  secBadgeText: { fontSize: 12, color: Colors.cyan, fontFamily: 'Courier New' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statCell: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statCellBorder: { borderRightWidth: 1, borderRightColor: Colors.border },
  statNum: { fontSize: 20, fontWeight: '700', color: Colors.accent },
  statLbl: { fontSize: 10, color: Colors.textSec, fontFamily: 'Courier New', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },

  // Section
  section: { padding: Spacing.lg },
  sectionTitle: {
    fontSize: 10, color: Colors.textSec,
    fontFamily: 'Courier New',
    letterSpacing: 1.5, textTransform: 'uppercase',
    marginBottom: 14,
  },

  // Security items
  secItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  secItemIcon: {
    width: 40, height: 40,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secItemLabel: { fontSize: 13, fontWeight: '500', color: Colors.textPri, marginBottom: 2 },
  secItemValue: { fontSize: 11, color: Colors.textSec, fontFamily: 'Courier New' },

  // Session card
  sessionCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 14,
    gap: 10,
  },
  sessionRow: { flexDirection: 'row', gap: 12 },
  sessionKey: { fontSize: 11, fontFamily: 'Courier New', color: Colors.textSec, width: 70 },
  sessionVal: { fontSize: 11, fontFamily: 'Courier New', color: Colors.textPri, flex: 1 },

  // Logout
  logoutNote: {
    fontSize: 11, color: Colors.textMut,
    textAlign: 'center', marginTop: 10,
    fontFamily: 'Courier New',
  },
});
