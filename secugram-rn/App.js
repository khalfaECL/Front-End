import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/hooks/useAuth';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0A0B0F"/>
      <AppNavigator/>
    </AuthProvider>
  );
}
