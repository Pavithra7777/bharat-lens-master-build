import { useNavigate, useRouter } from '../lib/Router';
import { Home, Search, Scan, MessageCircle, FolderOpen } from 'lucide-react';

export function BottomNav() {
  const navigate = useNavigate();
  const { currentPath } = useRouter();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Schemes', path: '/schemes' },
    { icon: Scan, label: 'Scan', path: '/scan' },
    { icon: MessageCircle, label: 'Chat', path: '/chat' },
    { icon: FolderOpen, label: 'Vault', path: '/vault' },
  ];

  function isActive(path: string): boolean {
    if (path === '/') {
      return currentPath === '/' || currentPath === '';
    }
    return currentPath.startsWith(path);
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-2 z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
                active
                  ? 'text-[#1B3A6B]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <item.icon
                className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`}
                fill={active ? '#1B3A6B' : 'none'}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={`text-[10px] font-medium ${active ? 'text-[#1B3A6B]' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
