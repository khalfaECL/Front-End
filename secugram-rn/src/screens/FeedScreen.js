import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  Image, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Colors, Radius, Spacing } from '../theme';
import { Avatar, Badge, Chip, Card } from '../components/UI';
import UploadModal from '../components/UploadModal';
import { useAuth } from '../hooks/useAuth';
import * as API from '../api';

// ─── Mock fallback data ──────────────────────────────────────────────────────
const MOCK_PHOTOS = [
  {
    image_id: 'img_001',
    owner_username: 'alice_dupont',
    description: 'Vacances Nice 2025',
    date_creation: '2025-02-26',
    locked: true,
    authorized: ['bob_martin', 'charlie_durand'],
  },
  {
    image_id: 'img_002',
    owner_username: 'alice_dupont',
    description: 'Réunion équipe Lyon',
    date_creation: '2025-03-01',
    locked: false,
    authorized: ['charlie_durand', 'dave_leclerc'],
  },
];

const MOCK_USERS = [
  { user_id: 'u2', username: 'bob_martin',     display: 'Bob Martin' },
  { user_id: 'u3', username: 'charlie_durand', display: 'Charlie Durand' },
  { user_id: 'u4', username: 'dave_leclerc',   display: 'Dave Leclerc' },
  { user_id: 'u5', username: 'emma_rousseau',  display: 'Emma Rousseau' },
  { user_id: 'u6', username: 'felix_moreau',   display: 'Félix Moreau' },
];

// ─── PhotoCard ───────────────────────────────────────────────────────────────

function PhotoCard({ photo }) {
  const initials = (photo.owner_username || 'U').slice(0, 2).toUpperCase();

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Avatar initials={initials} size={38} radius={12}/>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.ownerName}>{photo.owner_username}</Text>
          <Text style={styles.ownerDate}>{photo.date_creation}</Text>
        </View>
        <Badge
          label={photo.locked ? '🔒 Chiffrée' : '🔓 Visible'}
          type={photo.locked ? 'locked' : 'success'}
        />
      </View>

      {/* Image zone */}
      <View style={styles.imgWrap}>
        {photo.preview_uri
          ? <Image source={{ uri: photo.preview_uri }} style={styles.img}/>
          : <View style={styles.imgPlaceholder}/>
        }
        {photo.locked && (
          <View style={styles.lockedOverlay}>
            <Text style={{ fontSize: 40 }}>🔒</Text>
            <Text style={styles.lockedLabel}>CONTENU CHIFFRÉ</Text>
            <Text style={styles.lockedSub}>AES-256-GCM</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.authCount}>
          <Text style={styles.authCountText}>
            👥  {photo.authorized?.length ?? 0} autorisé{(photo.authorized?.length ?? 0) > 1 ? 's' : ''}
          </Text>
        </View>
        <Text style={styles.descText} numberOfLines={1}>{photo.description}</Text>
      </View>

      {/* Chips */}
      {(photo.authorized?.length ?? 0) > 0 && (
        <View style={styles.chipsRow}>
          {photo.authorized.map(u => <Chip key={u} label={u}/>)}
        </View>
      )}
    </Card>
  );
}

// ─── FeedScreen ──────────────────────────────────────────────────────────────

export default function FeedScreen() {
  const { session } = useAuth();

  const [photos,      setPhotos]      = useState([]);
  const [users,       setUsers]       = useState(MOCK_USERS);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [showUpload,  setShowUpload]  = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [photosData, usersData] = await Promise.all([
        API.fetchMyPhotos(session.token),
        API.fetchUsers(session.token),
      ]);
      setPhotos(photosData.photos ?? []);
      setUsers(usersData.users ?? MOCK_USERS);
    } catch {
      // API non disponible → données de démo
      setPhotos(MOCK_PHOTOS);
      setUsers(MOCK_USERS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const handleUploadSuccess = () => {
    loadData(); // Recharge la galerie
  };

  if (loading) return (
    <View style={styles.loadingWrap}>
      <ActivityIndicator color={Colors.accent} size="large"/>
      <Text style={styles.loadingText}>Chargement sécurisé...</Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={photos}
        keyExtractor={p => p.image_id}
        renderItem={({ item }) => <PhotoCard photo={item}/>}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 52, marginBottom: 14 }}>🔒</Text>
            <Text style={styles.emptyTitle}>Aucune image déposée</Text>
            <Text style={styles.emptySub}>Appuyez sur + pour partager votre première photo</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowUpload(true)}
        activeOpacity={0.85}
      >
        <Text style={{ color: '#fff', fontSize: 28, lineHeight: 32 }}>+</Text>
      </TouchableOpacity>

      <UploadModal
        visible={showUpload}
        onClose={() => setShowUpload(false)}
        onSuccess={handleUploadSuccess}
        users={users}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  list: { padding: Spacing.md, gap: 12, paddingBottom: 100 },

  // Card
  card: { marginBottom: 0 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  ownerName:  { fontSize: 14, fontWeight: '500', color: Colors.textPri },
  ownerDate:  { fontSize: 11, color: Colors.textSec, fontFamily: 'Courier New' },

  // Image
  imgWrap:     { width: '100%', aspectRatio: 4/3, backgroundColor: Colors.surface },
  img:         { width: '100%', height: '100%', resizeMode: 'cover' },
  imgPlaceholder: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,11,15,.78)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedLabel: {
    fontSize: 11, color: Colors.textSec,
    fontFamily: 'Courier New',
    letterSpacing: 2, textTransform: 'uppercase', marginTop: 8,
  },
  lockedSub: { fontSize: 10, color: Colors.textMut, fontFamily: 'Courier New', marginTop: 2 },

  // Footer
  cardFooter: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  authCount: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  authCountText: { fontSize: 11, color: Colors.textSec, fontFamily: 'Courier New' },
  descText:  { flex: 1, fontSize: 13, color: Colors.textSec, marginLeft: 10 },
  chipsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12, paddingBottom: 12 },

  // FAB
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 60, height: 60,
    backgroundColor: Colors.accent,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },

  // States
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  loadingText: { marginTop: 12, fontSize: 13, color: Colors.textSec, fontFamily: 'Courier New' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.textSec },
  emptySub: { fontSize: 13, color: Colors.textMut, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 },
});
