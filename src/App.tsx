import { useState, useEffect } from 'react';
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

function AppContent() {
  const { user, isLoading, profile, simpleMode } = useApp();
  const { currentPath } = useRouter();
  const [showFullNav, setShowFullNav] = useState(false);

  // Check if current page should show bottom nav (hide on detail pages)
  const isDetailPage = currentPath.match(/^\/schemes\/[^/]+$/);
  
  // Redirect to home when user logs in
  useEffect(() => {
    if (user && currentPath === '/auth') {
      window.location.hash = '/';
    }
  }, [user, currentPath]);

  const navItems = showFullNav ? NAV_ITEMS_FULL : NAV_ITEMS;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1B3A6B]/20 border-t-[#1B3A6B] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (!profile?.onboarding_completed) {
    return <OnboardingPage />;
  }

  return (
    <div className={simpleMode ? 'simple-mode' : ''}>
      <div className={isDetailPage ? '' : 'pb-20'}>
        <PageRouter currentPath={currentPath} />
      </div>

      {/* Hide bottom nav on detail pages */}
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
  // Handle scheme detail route
  const schemeMatch = currentPath.match(/^\/schemes\/([^/]+)$/);
  if (schemeMatch && schemeMatch[1]) {
    return <SchemeDetailPage schemeId={schemeMatch[1]} />;
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
