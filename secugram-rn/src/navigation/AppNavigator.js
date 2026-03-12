import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Colors, Radius } from '../theme';
import { useAuth } from '../hooks/useAuth';

import LoginScreen   from '../screens/LoginScreen';
import FeedScreen    from '../screens/FeedScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

// ── Custom Tab Bar ────────────────────────────────────────────────────────────

function CustomTabBar({ state, descriptors, navigation }) {
  const TABS = [
    { name: 'Feed',    icon: '🏠', label: 'Galerie' },
    { name: 'Profile', icon: '👤', label: 'Profil'  },
  ];
  return (
    <View style={styles.tabBar}>
      {TABS.map((t, i) => {
        const focused = state.index === i;
        return (
          <TouchableOpacity
            key={t.name}
            style={styles.tabItem}
            onPress={() => navigation.navigate(t.name)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{t.icon}</Text>
            <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{t.label}</Text>
            {focused && <View style={styles.tabDot}/>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

function Header({ username }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerLogo}>Secugram</Text>
      <View style={styles.headerRight}>
        <Text style={styles.headerUsername}>{username}</Text>
        <View style={styles.headerAvatar}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
            {(username || 'U').slice(0, 2).toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── App Navigator ─────────────────────────────────────────────────────────────

export default function AppNavigator() {
  const { session } = useAuth();

  if (!session) return <LoginScreen/>;

  return (
    <NavigationContainer>
      <View style={{ flex: 1, backgroundColor: Colors.bg }}>
        <Header username={session.username}/>
        <Tab.Navigator
          tabBar={props => <CustomTabBar {...props}/>}
          screenOptions={{ headerShown: false }}
        >
          <Tab.Screen name="Feed"    component={FeedScreen}/>
          <Tab.Screen name="Profile" component={ProfileScreen}/>
        </Tab.Navigator>
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 0,
    paddingBottom: 12,
    backgroundColor: 'rgba(10,11,15,.96)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLogo: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: -0.5,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerUsername: { fontSize: 12, color: Colors.textSec, fontFamily: 'Courier New' },
  headerAvatar: {
    width: 36, height: 36,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(17,19,24,.97)',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 },
  tabIcon: { fontSize: 22, opacity: 0.4 },
  tabIconActive: { opacity: 1 },
  tabLabel: { fontSize: 10, color: Colors.textMut, fontFamily: 'Courier New', letterSpacing: 0.5 },
  tabLabelActive: { color: Colors.accent },
  tabDot: {
    position: 'absolute',
    bottom: -4,
    width: 4, height: 4,
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
});
