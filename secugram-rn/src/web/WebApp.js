import React, { useState } from 'react';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { ThemeProvider, useTheme } from '../hooks/useTheme';
import Sidebar from './layout/Sidebar';
import LoginPage from './pages/LoginPage';
import FeedPage from './pages/FeedPage';
import MyPhotosPage from './pages/MyPhotosPage';
import SharedPage from './pages/SharedPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';

function AppShell() {
  const { session } = useAuth();
  const { colors, isDark } = useTheme();
  const [activePage, setActivePage] = useState('feed');

  if (!session) {
    return <LoginPage />;
  }

  const pages = {
    feed:    <FeedPage />,
    photos:  <MyPhotosPage />,
    shared:  <SharedPage />,
    history: <HistoryPage />,
    profile: <ProfilePage />,
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      backgroundColor: colors.bg,
      color: colors.textPri,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: 'hidden',
    }}>
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main style={{
        flex: 1,
        overflowY: 'auto',
        backgroundColor: colors.bg,
        scrollbarWidth: 'thin',
        scrollbarColor: `${colors.border} transparent`,
      }}>
        {pages[activePage] ?? pages.feed}
      </main>
    </div>
  );
}

export default function WebApp() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ThemeProvider>
  );
}
