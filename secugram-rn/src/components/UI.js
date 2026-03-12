import React from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  ActivityIndicator, StyleSheet, Animated,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../theme';

// ─── Button ─────────────────────────────────────────────────────────────────

export function PrimaryButton({ label, onPress, loading, disabled, icon, style }) {
  return (
    <TouchableOpacity
      style={[styles.btnPrimary, (loading || disabled) && styles.btnDisabled, style]}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.85}
    >
      {loading
        ? <ActivityIndicator color="#fff" size="small"/>
        : <>
            {icon && <Text style={{ marginRight: 8, fontSize: 16 }}>{icon}</Text>}
            <Text style={styles.btnPrimaryText}>{label}</Text>
          </>
      }
    </TouchableOpacity>
  );
}

export function SecondaryButton({ label, onPress, icon, style }) {
  return (
    <TouchableOpacity style={[styles.btnSecondary, style]} onPress={onPress} activeOpacity={0.8}>
      {icon && <Text style={{ marginRight: 6, fontSize: 14 }}>{icon}</Text>}
      <Text style={styles.btnSecondaryText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function DangerButton({ label, onPress, icon }) {
  return (
    <TouchableOpacity style={styles.btnDanger} onPress={onPress} activeOpacity={0.8}>
      {icon && <Text style={{ marginRight: 6 }}>{icon}</Text>}
      <Text style={styles.btnDangerText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────

export function InputField({ label, icon, ...props }) {
  return (
    <View style={styles.fieldWrap}>
      {label && <Text style={styles.fieldLabel}>{label}</Text>}
      <View style={styles.inputWrap}>
        {icon && <Text style={styles.inputIcon}>{icon}</Text>}
        <TextInput
          style={[styles.input, icon && { paddingLeft: 44 }]}
          placeholderTextColor={Colors.textMut}
          {...props}
        />
      </View>
    </View>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ─── Badge ───────────────────────────────────────────────────────────────────

export function Badge({ label, type = 'default' }) {
  const typeStyle = {
    success: { bg: 'rgba(46,204,113,.12)', text: Colors.success, border: 'rgba(46,204,113,.25)' },
    locked:  { bg: 'rgba(255,71,87,.12)',  text: Colors.danger,  border: 'rgba(255,71,87,.25)' },
    accent:  { bg: 'rgba(91,142,255,.12)', text: Colors.accent,  border: 'rgba(91,142,255,.25)' },
    default: { bg: Colors.surface,         text: Colors.textSec, border: Colors.border },
  }[type];
  return (
    <View style={[styles.badge, { backgroundColor: typeStyle.bg, borderColor: typeStyle.border }]}>
      <Text style={[styles.badgeText, { color: typeStyle.text }]}>{label}</Text>
    </View>
  );
}

// ─── Chip ────────────────────────────────────────────────────────────────────

export function Chip({ label, onRemove }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
      {onRemove && (
        <TouchableOpacity onPress={onRemove} style={{ marginLeft: 4 }}>
          <Text style={[styles.chipText, { fontSize: 14 }]}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

export function Avatar({ initials, size = 40, radius = 13 }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: radius }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
}

// ─── SectionLabel ────────────────────────────────────────────────────────────

export function SectionLabel({ label }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionText}>{label}</Text>
      <View style={styles.sectionLine}/>
    </View>
  );
}

// ─── ErrorBox ────────────────────────────────────────────────────────────────

export function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>⚠  {message}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Buttons
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  btnDisabled: { opacity: 0.5 },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  btnSecondaryText: { color: Colors.textPri, fontSize: 14, fontWeight: '500' },
  btnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,71,87,.08)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,71,87,.25)',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  btnDangerText: { color: Colors.danger, fontSize: 14, fontWeight: '600' },

  // Input
  fieldWrap: { marginBottom: 16 },
  fieldLabel: {
    ...Typography.mono,
    fontSize: 10,
    color: Colors.textSec,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  inputWrap: { position: 'relative', justifyContent: 'center' },
  inputIcon: {
    position: 'absolute',
    left: 14,
    fontSize: 16,
    zIndex: 1,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: Colors.textPri,
    fontSize: 15,
  },

  // Card
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },

  // Badge
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    ...Typography.mono,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Chip
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(91,142,255,.1)',
    borderWidth: 1,
    borderColor: 'rgba(91,142,255,.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    ...Typography.mono,
    fontSize: 11,
    color: Colors.accent,
  },

  // Avatar
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
  },

  // Section label
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionText: {
    ...Typography.mono,
    fontSize: 10,
    color: Colors.textSec,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginRight: 10,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: Colors.border },

  // Error
  errorBox: {
    backgroundColor: 'rgba(255,71,87,.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,71,87,.2)',
    borderRadius: Radius.sm,
    padding: 12,
    marginBottom: 14,
  },
  errorText: { color: Colors.danger, fontSize: 13 },
});
