import { useState, useEffect, useRef } from 'react';
import { AppProvider, useApp } from './lib/AppContext';
import { RouterProvider, useRouter, Link } from './lib/Router';
import { 
  Home, Camera, MessageCircle, FolderOpen, Search, 
  Calendar, Shield, Users, Settings
} from 'lucide-react';

// Static imports
import { AuthPage } from './components/Auth';
import { OnboardingPage } from './components/Onboarding';
import { HomePage } from './pages/HomePage';
import { ScanPage } from './pages/ScanPage';
import { ChatPage } from './pages/ChatPage';
import { VaultPage } from './pages/VaultPage';
import { SchemesPage } from './pages/SchemesPage';
import { SchemeDetailPage } from './pages/SchemeDetailPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { RemindersPage } from './pages/RemindersPage';
import { ScamPage } from './pages/ScamPage';
import { FamilyPage } from './pages/FamilyPage';
import { SettingsPage } from './pages/SettingsPage';
import { MigrationPage } from './pages/MigrationPage';
import UrlReport from './pages/UrlReport';

// Bottom Navigation Items
const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/scan', icon: Camera, label: 'Scan' },
  { path: '/chat', icon: MessageCircle, label: 'Chat' },
  { path: '/vault', icon: FolderOpen, label: 'Vault' },
  { path: '/schemes', icon: Search, label: 'Schemes' },
];

const NAV_ITEMS_FULL = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/scan', icon: Camera, label: 'Scan' },
  { path: '/chat', icon: MessageCircle, label: 'AI Chat' },
  { path: '/vault', icon: FolderOpen, label: 'Vault' },
  { path: '/schemes', icon: Search, label: 'Schemes' },
  { path: '/apps', icon: Calendar, label: 'Apps' },
  { path: '/reminders', icon: Calendar, label: 'Reminders' },
  { path: '/scam', icon: Shield, label: 'Scam' },
  { path: '/family', icon: Users, label: 'Family' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

// Loading component - simple spinner
function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FAFBFC',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48,
          height: 48,
          border: '4px solid rgba(27, 58, 107, 0.2)',
          borderTopColor: '#1B3A6B',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 12px'
        }} />
        <p style={{ color: '#6B7280', fontSize: 14 }}>Loading...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, isLoading, profile, simpleMode } = useApp();
  const { currentPath } = useRouter();
  const [showFullNav, setShowFullNav] = useState(false);
  const prevUserRef = useRef<typeof user>(null);

  // Check if current page should show bottom nav (hide on detail pages)
  const isDetailPage = currentPath.startsWith('/schemes/') && currentPath.length > 9;
  
  // Redirect to home when user logs in
  useEffect(() => {
    if (prevUserRef.current === null && user !== null) {
      window.location.hash = '/';
    }
    prevUserRef.current = user;
  }, [user]);

  const navItems = showFullNav ? NAV_ITEMS_FULL : NAV_ITEMS;

  // Show loading while checking auth
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show auth page if not logged in
  if (!user) {
    return <AuthPage />;
  }

  // Show onboarding if profile not completed
  if (!profile?.onboarding_completed) {
    return <OnboardingPage />;
  }

  // Main app
  return (
    <div className={simpleMode ? 'simple-mode' : ''}>
      <div className={isDetailPage ? '' : 'pb-20'}>
        <PageRouter currentPath={currentPath} />
      </div>

      {!isDetailPage && (
        <>
          <nav className="bottom-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path || 
                (item.path !== '/' && currentPath.startsWith(item.path));
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon className="w-6 h-6" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            
            {!showFullNav && (
              <button
                onClick={() => setShowFullNav(true)}
                className="bottom-nav-item"
              >
                <span className="text-xl">⋯</span>
                <span>More</span>
              </button>
            )}
          </nav>

          {showFullNav && (
            <div 
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowFullNav(false)}
            >
              <div 
                className="absolute bottom-20 left-0 right-0 bg-white rounded-t-3xl p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[#1A1A2E]">More Options</h3>
                  <button
                    onClick={() => setShowFullNav(false)}
                    className="text-gray-400 text-2xl"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {NAV_ITEMS_FULL.slice(5).map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPath === item.path;
                    
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setShowFullNav(false)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl ${
                          isActive ? 'bg-[#1B3A6B]/10 text-[#1B3A6B]' : 'text-gray-500'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-xs font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <footer className="disclaimer pb-4">
            Bharat Lens provides AI-assisted guidance and is not affiliated with the Government of India. 
            Always verify critical actions through official sources.
          </footer>
        </>
      )}
    </div>
  );
}

function PageRouter({ currentPath }: { currentPath: string }) {
  if (currentPath.startsWith('/schemes/') && currentPath.length > 9) {
    return <SchemeDetailPage />;
  }

  switch (currentPath) {
    case '/':
      return <HomePage />;
    case '/scan':
      return <ScanPage />;
    case '/chat':
      return <ChatPage />;
    case '/vault':
      return <VaultPage />;
    case '/schemes':
      return <SchemesPage />;
    case '/apps':
      return <ApplicationsPage />;
    case '/reminders':
      return <RemindersPage />;
    case '/scam':
      return <ScamPage />;
    case '/family':
      return <FamilyPage />;
    case '/settings':
      return <SettingsPage />;
    case '/urls':
      return <UrlReport />;
    case '/migrate':
      return <MigrationPage />;
    case '/auth':
      return <AuthPage />;
    default:
      return <HomePage />;
  }
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
