import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Modal, ScrollView,
  TouchableOpacity, Image, FlatList, Alert,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Colors, Radius, Spacing } from '../theme';
import { PrimaryButton, SecondaryButton, SectionLabel, Chip, Avatar, ErrorBox } from '../components/UI';
import { useAuth } from '../hooks/useAuth';
import * as API from '../api';

const STEPS = { IMAGE: 1, AUTH: 2, UPLOADING: 3, DONE: 4 };

export default function UploadModal({ visible, onClose, onSuccess, users }) {
  const { session } = useAuth();

  const [step,     setStep]     = useState(STEPS.IMAGE);
  const [image,    setImage]    = useState(null);   // { uri, base64, fileName }
  const [desc,     setDesc]     = useState('');
  const [selected, setSelected] = useState([]);     // usernames autorisés
  const [progress, setProgress] = useState(0);
  const [error,    setError]    = useState('');

  const reset = () => {
    setStep(STEPS.IMAGE); setImage(null); setDesc('');
    setSelected([]); setProgress(0); setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  // ── Sélection image ──────────────────────────────────────────────
  const pickImage = useCallback(async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.85,
      maxWidth: 1920,
      maxHeight: 1920,
    });
    if (result.didCancel || result.errorCode) return;
    const asset = result.assets?.[0];
    if (asset) setImage({ uri: asset.uri, base64: asset.base64, fileName: asset.fileName });
  }, []);

  // ── Toggle user ──────────────────────────────────────────────────
  const toggleUser = (username) =>
    setSelected(s => s.includes(username) ? s.filter(u => u !== username) : [...s, username]);

  // ── Upload flow ──────────────────────────────────────────────────
  const handleUpload = async () => {
    setError('');
    setStep(STEPS.UPLOADING);
    try {
      const imageId = `img_${Date.now()}`;

      // Simulate progress while real upload happens
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 8, 90));
      }, 200);

      // 1. Upload image en clair → Tiers chiffre + watermark
      await API.uploadPhoto(session.token, {
        imageData:   image.base64,
        imageId,
        description: desc,
      });

      // 2. Définir autorisations (si des users sélectionnés)
      if (selected.length > 0) {
        await API.authorizePhoto(session.token, imageId, selected);
      }

      clearInterval(progressInterval);
      setProgress(100);
      await new Promise(r => setTimeout(r, 400));
      setStep(STEPS.DONE);
    } catch (e) {
      setError(e.message || 'Erreur lors de l\'upload.');
      setStep(STEPS.AUTH);
    }
  };

  // ── Render steps ─────────────────────────────────────────────────

  const renderImageStep = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SectionLabel label="Sélectionner une image"/>
      <TouchableOpacity style={styles.dropZone} onPress={pickImage} activeOpacity={0.8}>
        {image
          ? <Image source={{ uri: image.uri }} style={styles.preview}/>
          : <View style={styles.dropPlaceholder}>
              <Text style={{ fontSize: 40, marginBottom: 10 }}>📷</Text>
              <Text style={styles.dropLabel}>Appuyer pour choisir</Text>
              <Text style={styles.dropSub}>JPG · PNG · WEBP</Text>
            </View>
        }
      </TouchableOpacity>

      {image && (
        <TouchableOpacity style={styles.changeBtn} onPress={pickImage}>
          <Text style={styles.changeBtnText}>Changer l'image</Text>
        </TouchableOpacity>
      )}

      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>DESCRIPTION (OPTIONNEL)</Text>
        <View style={styles.inputWrap}>
          <Text style={styles.inputIcon}>📝</Text>
          <TouchableOpacity style={styles.textInputTouchable} activeOpacity={1}>
            <Text style={[styles.inputText, !desc && { color: Colors.textMut }]}>
              {desc || 'Vacances Nice 2025...'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.actionRow}>
        <SecondaryButton label="Annuler" icon="✕" onPress={handleClose} style={{ flex: 0.4 }}/>
        <PrimaryButton
          label="Suivant"
          icon="🔐"
          onPress={() => setStep(STEPS.AUTH)}
          disabled={!image}
          style={{ flex: 1, marginLeft: 10 }}
        />
      </View>
    </ScrollView>
  );

  const renderAuthStep = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SectionLabel label="Qui peut voir cette image ?"/>

      <ErrorBox message={error}/>

      {selected.length > 0 && (
        <View style={styles.chips}>
          {selected.map(u => (
            <Chip key={u} label={u} onRemove={() => toggleUser(u)}/>
          ))}
        </View>
      )}

      <FlatList
        data={users.filter(u => u.username !== session?.username)}
        keyExtractor={u => u.user_id || u.username}
        scrollEnabled={false}
        renderItem={({ item: u }) => {
          const isSelected = selected.includes(u.username);
          return (
            <TouchableOpacity
              style={[styles.userItem, isSelected && styles.userItemSelected]}
              onPress={() => toggleUser(u.username)}
              activeOpacity={0.8}
            >
              <Avatar
                initials={(u.username || 'U').slice(0, 2).toUpperCase()}
                size={42}
                radius={14}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.userName}>{u.display || u.username}</Text>
                <Text style={styles.userHandle}>@{u.username}</Text>
              </View>
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }}/>}
        style={{ marginBottom: 20 }}
      />

      <View style={styles.actionRow}>
        <SecondaryButton label="Retour" icon="←" onPress={() => setStep(STEPS.IMAGE)} style={{ flex: 0.4 }}/>
        <PrimaryButton
          label={selected.length > 0 ? `Partager (${selected.length})` : 'Déposer'}
          icon="⬆️"
          onPress={handleUpload}
          style={{ flex: 1, marginLeft: 10 }}
        />
      </View>
    </ScrollView>
  );

  const renderUploadingStep = () => (
    <View style={styles.centerContent}>
      <Text style={{ fontSize: 48, marginBottom: 20 }}>⬆️</Text>
      <Text style={styles.uploadTitle}>Sécurisation en cours...</Text>
      <Text style={styles.uploadSub}>Tatouage invisible · Chiffrement AES-256</Text>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]}/>
      </View>
      <Text style={styles.progressText}>{progress}%</Text>

      {progress >= 50 && (
        <View style={styles.encryptBadge}>
          <Text style={styles.encryptBadgeText}>🔒  Clé AES-256 appliquée</Text>
        </View>
      )}
    </View>
  );

  const renderDoneStep = () => (
    <View style={styles.centerContent}>
      <Text style={{ fontSize: 64, marginBottom: 16 }}>🎉</Text>
      <Text style={styles.doneTitle}>Image sécurisée !</Text>
      <Text style={styles.doneSub}>Tatouage invisible · Chiffrée AES-256</Text>
      {selected.length > 0 && (
        <Text style={styles.sharedWith}>
          Partagée avec {selected.length} utilisateur{selected.length > 1 ? 's' : ''}
        </Text>
      )}
      <View style={styles.chips}>
        {selected.map(u => <Chip key={u} label={u}/>)}
      </View>
      <PrimaryButton
        label="Parfait !"
        icon="✓"
        onPress={() => { onSuccess(); handleClose(); }}
        style={{ marginTop: 28, width: '100%' }}
      />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose}/>
      <View style={styles.sheet}>
        <View style={styles.handle}/>
        <Text style={styles.sheetTitle}>
          {step === STEPS.IMAGE      && '📸 Déposer une image'}
          {step === STEPS.AUTH       && '🔐 Autorisations d\'accès'}
          {step === STEPS.UPLOADING  && '⬆️  Envoi en cours...'}
          {step === STEPS.DONE       && '✅ Succès'}
        </Text>
        <View style={styles.sheetBody}>
          {step === STEPS.IMAGE     && renderImageStep()}
          {step === STEPS.AUTH      && renderAuthStep()}
          {step === STEPS.UPLOADING && renderUploadingStep()}
          {step === STEPS.DONE      && renderDoneStep()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,.6)',
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '92%',
    paddingBottom: 32,
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 14,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPri,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.md,
  },
  sheetBody: { paddingHorizontal: Spacing.lg },

  // Drop zone
  dropZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: Colors.surface,
  },
  dropPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  dropLabel: { fontSize: 14, color: Colors.textSec, marginBottom: 4 },
  dropSub: { fontSize: 11, color: Colors.textMut, fontFamily: 'Courier New' },
  preview: { width: '100%', height: 180, resizeMode: 'cover' },

  changeBtn: { alignItems: 'center', marginBottom: 16 },
  changeBtnText: { fontSize: 12, color: Colors.accent, fontFamily: 'Courier New' },

  // Field
  fieldWrap: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 10, color: Colors.textSec,
    fontFamily: 'Courier New',
    letterSpacing: 1.5, marginBottom: 6,
  },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 14 },
  inputIcon: { fontSize: 16, marginRight: 10 },
  textInputTouchable: { flex: 1 },
  inputText: { fontSize: 15, color: Colors.textPri },

  // Action row
  actionRow: { flexDirection: 'row', marginTop: 8, marginBottom: 8 },

  // Users
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 12,
  },
  userItemSelected: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(91,142,255,.07)',
  },
  userName: { fontSize: 14, fontWeight: '500', color: Colors.textPri, marginBottom: 2 },
  userHandle: { fontSize: 11, color: Colors.textSec, fontFamily: 'Courier New' },
  checkbox: {
    width: 24, height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: Colors.accent, borderColor: Colors.accent },

  // Chips
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },

  // Progress
  centerContent: { alignItems: 'center', paddingVertical: 20 },
  uploadTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPri, marginBottom: 6 },
  uploadSub: { fontSize: 13, color: Colors.textSec, marginBottom: 20, fontFamily: 'Courier New' },
  progressBar: { width: '100%', height: 6, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 4 },
  progressText: { fontSize: 12, color: Colors.accent, fontFamily: 'Courier New', marginBottom: 16 },
  encryptBadge: {
    backgroundColor: 'rgba(0,212,204,.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,204,.2)',
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  encryptBadgeText: { color: Colors.cyan, fontFamily: 'Courier New', fontSize: 12 },

  // Done
  doneTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPri, marginBottom: 6 },
  doneSub: { fontSize: 13, color: Colors.textSec, fontFamily: 'Courier New', marginBottom: 10 },
  sharedWith: { fontSize: 13, color: Colors.accent, fontFamily: 'Courier New', marginBottom: 8 },
});
