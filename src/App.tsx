import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { AppProvider, useApp } from './lib/AppContext';
import { RouterProvider, useRouter, Link, useNavigate } from './lib/Router';
import { 
  Home, Camera, MessageCircle, FolderOpen, Search, 
  Calendar, Shield, Users, Settings
} from 'lucide-react';
import { Loader2 } from 'lucide-react';

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
import UrlReportPage from './pages/UrlReport';

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

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B3A6B] to-[#2A4A8B] flex items-center justify-center">
      <div className="text-center text-white">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
        <p className="text-white/70">Loading...</p>
      </div>
    </div>
  );
}

// Error fallback component
function ErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B3A6B] to-[#2A4A8B] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-6 max-w-sm text-center shadow-xl">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-semibold text-[#1A1A2E] mb-2">Something went wrong</h2>
        <p className="text-gray-500 text-sm mb-4">{error.message || 'An unexpected error occurred'}</p>
        <button
          onClick={reset}
          className="w-full py-3 bg-[#1B3A6B] text-white rounded-xl font-medium hover:bg-[#2A4A8B] transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, isLoading, profile, simpleMode } = useApp();
  const { currentPath } = useRouter();
  const navigate = useNavigate();
  const [showFullNav, setShowFullNav] = useState(false);
  const prevUserRef = useRef<typeof user>(null);
  const [hasError, setHasError] = useState(false);

  // Check if current page should show bottom nav (hide on detail pages)
  const isDetailPage = currentPath.startsWith('/schemes/') && currentPath.length > 9;
  
  // Redirect to home when user logs in (more robust tracking)
  useEffect(() => {
    if (prevUserRef.current === null && user !== null) {
      navigate('/');
    }
    prevUserRef.current = user;
  }, [user, navigate]);

  const navItems = showFullNav ? NAV_ITEMS_FULL : NAV_ITEMS;

  // Handle error state
  if (hasError) {
    return (
      <ErrorFallback 
        error={new Error('An error occurred while loading the app')} 
        reset={() => {
          setHasError(false);
          window.location.reload();
        }} 
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1B3A6B] to-[#2A4A8B] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading Bharat Lens...</p>
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
      return <UrlReportPage />;
    case '/migrate':
      return <MigrationPage />;
    case '/auth':
      return <AuthPage />;
    default:
      return <HomePage />;
  }
}

// Wrap AppContent with error handling
function AppWithErrorBoundary() {
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    return (
      <ErrorFallback 
        error={error} 
        reset={() => {
          setError(null);
          window.location.reload();
        }} 
      />
    );
  }

  return (
    <AppProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </AppProvider>
  );
}

export default function App() {
  return <AppWithErrorBoundary />;
}
