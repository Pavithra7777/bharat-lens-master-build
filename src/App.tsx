import { AppProvider, useApp } from './lib/AppContext';
import { RouterProvider, useRouter } from './lib/Router';
import { AuthPage } from './components/Auth';
import { OnboardingPage } from './components/Onboarding';
import { HomePage } from './pages/HomePage';
import { SchemesPage } from './pages/SchemesPage';
import { SchemeDetailPage } from './pages/SchemeDetailPage';
import { ScanPage } from './pages/ScanPage';
import { ChatPage } from './pages/ChatPage';
import { VaultPage } from './pages/VaultPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { RemindersPage } from './pages/RemindersPage';
import { ScamPage } from './pages/ScamPage';
import { SettingsPage } from './pages/SettingsPage';
import { FamilyPage } from './pages/FamilyPage';
import { BottomNav } from './components/BottomNav';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { isLoading, user, profile } = useApp();
  const { currentPath } = useRouter();

  // Show loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1B3A6B] to-[#2A4A8B] flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <span className="text-3xl">🇮🇳</span>
        </div>
        <Loader2 className="w-8 h-8 text-white animate-spin" />
        <p className="text-white/70 mt-4 text-sm">Loading...</p>
      </div>
    );
  }

  // Show auth page if not logged in
  if (!user) {
    return <AuthPage />;
  }

  // Show onboarding if profile not completed
  if (!profile?.onboarding_completed) {
    return <OnboardingPage />;
  }

  // Routes that should have bottom nav
  const bottomNavRoutes = ['/', '/schemes', '/scan', '/chat', '/vault'];

  const hasBottomNav = bottomNavRoutes.includes(currentPath) || 
    currentPath.startsWith('/schemes');

  // Pages with their own built-in headers
  const ownHeaderPages = ['/settings', '/scam'];

  // Main authenticated app
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Main content */}
      <div className={`flex-1 ${hasBottomNav ? 'pb-20' : ''}`}>
        <MainContent />
      </div>

      {/* Bottom Navigation */}
      {hasBottomNav && <BottomNav />}
    </div>
  );
}

function MainContent() {
  const { currentPath } = useRouter();

  // Home
  if (currentPath === '/' || currentPath === '') {
    return <HomePage />;
  }

  // Schemes list
  if (currentPath === '/schemes' || currentPath.startsWith('/schemes?')) {
    return <SchemesPage />;
  }

  // Scheme detail
  if (currentPath.match(/^\/schemes\/[^/]+$/) || currentPath.match(/^\/schemes\/[^/]+\?/)) {
    return <SchemeDetailPage />;
  }

  // Scan
  if (currentPath === '/scan') {
    return <ScanPage />;
  }

  // Chat
  if (currentPath === '/chat') {
    return <ChatPage />;
  }

  // Vault
  if (currentPath === '/vault') {
    return <VaultPage />;
  }

  // Applications
  if (currentPath === '/applications') {
    return <ApplicationsPage />;
  }

  // Reminders
  if (currentPath === '/reminders') {
    return <RemindersPage />;
  }

  // Scam
  if (currentPath === '/scam') {
    return <ScamPage />;
  }

  // Settings
  if (currentPath === '/settings') {
    return <SettingsPage />;
  }

  // Family
  if (currentPath === '/family') {
    return <FamilyPage />;
  }

  // Default to home
  return <HomePage />;
}

export default function App() {
  return (
    <AppProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </AppProvider>
  );
}
