import { useNavigate, useRouter } from '../lib/Router';
import { Home, Search, Scan, MessageCircle, FolderOpen, MoreHorizontal, Shield, Settings, Users } from 'lucide-react';
import { useState, useEffect } from 'react';

export function BottomNav() {
  const navigate = useNavigate();
  const { currentPath } = useRouter();
  const [showMore, setShowMore] = useState(false);

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Schemes', path: '/schemes' },
    { icon: Scan, label: 'Scan', path: '/scan' },
    { icon: MessageCircle, label: 'Chat', path: '/chat' },
    { icon: FolderOpen, label: 'Vault', path: '/vault' },
  ];

  const moreItems = [
    { icon: Shield, label: 'Scam Shield', path: '/scam', color: 'text-red-500' },
    { icon: Users, label: 'Family', path: '/family', color: 'text-blue-500' },
    { icon: Settings, label: 'Settings', path: '/settings', color: 'text-gray-500' },
  ];

  function isActive(path: string): boolean {
    if (path === '/') {
      return currentPath === '/' || currentPath === '';
    }
    return currentPath.startsWith(path);
  }

  // Close more menu on route change
  useEffect(() => {
    setShowMore(false);
  }, [currentPath]);

  return (
    <>
      <div 
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-50"
        style={{ boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-around">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${
                  active
                    ? 'text-[#1B3A6B] bg-[#1B3A6B]/5'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon
                  className={`w-6 h-6 ${active ? 'stroke-[2.5]' : ''}`}
                  fill={active ? '#1B3A6B' : 'none'}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className={`text-[11px] font-medium ${active ? 'text-[#1B3A6B]' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
          
          {/* More button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${
              ['/scam', '/settings', '/family', '/applications', '/reminders'].some(p => currentPath.startsWith(p))
                ? 'text-[#1B3A6B] bg-[#1B3A6B]/5'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MoreHorizontal
              className="w-6 h-6"
              fill={['/scam', '/settings', '/family', '/applications', '/reminders'].some(p => currentPath.startsWith(p)) ? '#1B3A6B' : 'none'}
              strokeWidth={2}
            />
            <span className="text-[11px] font-medium">More</span>
          </button>
        </div>
      </div>

      {/* More Menu Overlay */}
      {showMore && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/20" 
            onClick={() => setShowMore(false)}
          />
          <div className="fixed bottom-[72px] right-4 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 w-56">
            <p className="text-xs font-semibold text-gray-400 uppercase px-3 py-2">More Options</p>
            {moreItems.map((item) => {
              const active = currentPath.startsWith(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setShowMore(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                    active ? 'bg-[#1B3A6B]/5' : 'hover:bg-gray-50'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${item.color || 'text-gray-500'}`} />
                  <span className={`text-sm font-medium ${active ? 'text-[#1B3A6B]' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
            {/* Additional quick links */}
            <div className="border-t border-gray-100 mt-2 pt-2">
              <button
                onClick={() => {
                  navigate('/applications');
                  setShowMore(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                  currentPath.startsWith('/applications') ? 'bg-[#1B3A6B]/5' : 'hover:bg-gray-50'
                }`}
              >
                <span className="w-5 h-5 text-center text-lg">📋</span>
                <span className={`text-sm font-medium ${currentPath.startsWith('/applications') ? 'text-[#1B3A6B]' : 'text-gray-700'}`}>
                  Applications
                </span>
              </button>
              <button
                onClick={() => {
                  navigate('/reminders');
                  setShowMore(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                  currentPath.startsWith('/reminders') ? 'bg-[#1B3A6B]/5' : 'hover:bg-gray-50'
                }`}
              >
                <span className="w-5 h-5 text-center text-lg">🔔</span>
                <span className={`text-sm font-medium ${currentPath.startsWith('/reminders') ? 'text-[#1B3A6B]' : 'text-gray-700'}`}>
                  Reminders
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
