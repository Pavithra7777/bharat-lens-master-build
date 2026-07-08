import { useState, Suspense, lazy } from 'react';
import { AppProvider, useApp } from './lib/AppContext';
import { RouterProvider, useRouter, Link } from './lib/Router';
import { 
  Home, Camera, MessageCircle, FolderOpen, Search, 
  Calendar, Shield, Users, Settings
} from 'lucide-react';

// Static imports for critical pages (needed immediately)
import { AuthPage } from './components/Auth';
import { HomePage } from './pages/HomePage';

// Lazy load all other pages for faster initial load
const OnboardingPage = lazy(() => import('./components/Onboarding').then(m => ({ default: m.OnboardingPage })));
const ScanPage = lazy(() => import('./pages/ScanPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const VaultPage = lazy(() => import('./pages/VaultPage'));
const SchemesPage = lazy(() => import('./pages/SchemesPage'));
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage'));
const RemindersPage = lazy(() => import('./pages/RemindersPage'));
const ScamPage = lazy(() => import('./pages/ScamPage'));
const FamilyPage = lazy(() => import('./pages/FamilyPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// Loading fallback
function PageLoader() {
  return (
    <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-3 border-[#1B3A6B]/20 border-t-[#1B3A6B] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}

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

  const navItems = showFullNav ? NAV_ITEMS_FULL : NAV_ITEMS;

  // Auth state is loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-[#1B3A6B]/20 border-t-[#1B3A6B] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Auth pages (no nav)
  if (!user) {
    return <AuthPage />;
  }

  // Onboarding
  if (!profile?.onboarding_completed) {
    return (
      <Suspense fallback={<PageLoader />}>
        <OnboardingPage />
      </Suspense>
    );
  }

  // Main app with bottom nav
  return (
    <div className={simpleMode ? 'simple-mode' : ''}>
      {/* Page Content */}
      <div className="pb-20">
        <PageRouter currentPath={currentPath} />
      </div>

      {/* Bottom Navigation */}
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

      {/* More Menu */}
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

      {/* Disclaimer Footer */}
      <footer className="disclaimer pb-4">
        Bharat Lens provides AI-assisted guidance and is not affiliated with the Government of India. 
        Always verify critical actions through official sources.
      </footer>
    </div>
  );
}

function PageRouter({ currentPath }: { currentPath: string }) {
  // Lazy-loaded pages with Suspense for smooth transitions
  const lazyPage = (Page: React.ComponentType) => (
    <Suspense fallback={<PageLoader />}>
      <Page />
    </Suspense>
  );

  switch (currentPath) {
    case '/':
      return <HomePage />;
    case '/scan':
      return lazyPage(ScanPage);
    case '/chat':
      return lazyPage(ChatPage);
    case '/vault':
      return lazyPage(VaultPage);
    case '/schemes':
      return lazyPage(SchemesPage);
    case '/apps':
      return lazyPage(ApplicationsPage);
    case '/reminders':
      return lazyPage(RemindersPage);
    case '/scam':
      return lazyPage(ScamPage);
    case '/family':
      return lazyPage(FamilyPage);
    case '/settings':
      return lazyPage(SettingsPage);
    case '/auth':
      return <AuthPage />;
    default:
      if (currentPath.startsWith('/schemes/')) {
        return lazyPage(SchemesPage);
      }
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
