import { useNavigate } from '../lib/Router';
import { ArrowLeft, Settings, Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showSettings?: boolean;
  showNotifications?: boolean;
}

export function Header({ title, showBack = false, showSettings = false, showNotifications = false }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-[#1B3A6B] text-white px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-white/10 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {showNotifications && (
            <button
              onClick={() => navigate('/reminders')}
              className="p-2 rounded-lg hover:bg-white/10 transition relative"
            >
              <Bell className="w-5 h-5" />
            </button>
          )}
          {showSettings && (
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-lg hover:bg-white/10 transition"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
