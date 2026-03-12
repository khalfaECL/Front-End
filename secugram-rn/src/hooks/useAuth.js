/**
 * AuthContext
 * - Stockage du token en mémoire uniquement (pas AsyncStorage = pas de persistance)
 * - Conforme aux specs : session éphémère, token JWT
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import * as API from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // ⚠️  État en mémoire uniquement — disparaît à la fermeture de l'app
  const [session, setSession] = useState(null);
  // session = { token, userId, username, expiresAt }

  const login = useCallback(async (username, password) => {
    const data = await API.login(username, password);
    const sess = {
      token:     data.token,
      userId:    data.user_id,
      username:  data.username,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    setSession(sess);
    return sess;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const data = await API.register(username, email, password);
    const sess = {
      token:     data.token,
      userId:    data.user_id,
      username:  data.username,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    setSession(sess);
    return sess;
  }, []);

  const logout = useCallback(() => {
    setSession(null); // efface tout de la mémoire
  }, []);

  const isTokenValid = useCallback(() => {
    if (!session) return false;
    return Date.now() < session.expiresAt;
  }, [session]);

  return (
    <AuthContext.Provider value={{ session, login, register, logout, isTokenValid }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
