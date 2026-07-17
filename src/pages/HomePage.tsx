import { useState, useEffect } from 'react';
import { db } from '@doable/data';
import { useApp } from '../lib/AppContext';
import { useRouter } from '../lib/Router';
import { t, getGreeting } from '../lib/i18n';
import { Link } from '../lib/Router';
import { 
  Camera, MessageCircle, FolderOpen, Search, 
  Calendar, ChevronRight, Bell, Shield, Users,
  Sparkles
} from 'lucide-react';
import type { Language } from '../lib/i18n';

interface Reminder {
  id: string;
  title: string;
  due_date: string;
}

interface Scheme {
  id: string;
  title: string;
  department: string;
  source_verified_at: string;
}

export function HomePage() {
  const { profile, language } = useApp();
  const lang = language as Language;
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [profile]);

  async function loadData() {
    if (!profile) return;
    setLoading(true);

    try {
      // Load upcoming reminders - RLS handles owner filtering via created_by
      const remindersR = await db.query<Reminder>(
        `SELECT id, title, due_date FROM reminders 
         WHERE is_completed = false AND due_date >= CURRENT_DATE 
         ORDER BY due_date ASC LIMIT 3`
      );
      if (remindersR.ok) setReminders(remindersR.rows);

      // Load recommended schemes based on occupation
      let schemesQuery = 'SELECT id, title, department, source_verified_at FROM schemes WHERE is_active = true';
      const params: string[] = [];
      
      if (profile.occupation_category) {
        schemesQuery += ` ORDER BY title ASC LIMIT 3`;
      } else {
        schemesQuery += ` ORDER BY created_at DESC LIMIT 3`;
      }
      
      const schemesR = await db.query<Scheme>(schemesQuery, params);
      if (schemesR.ok) setSchemes(schemesR.rows);
    } catch (error) {
      console.error('Load home data failed:', error);
    } finally {
      setLoading(false);
    }
  }

  function getDaysUntil(date: string): number {
    const diff = new Date(date).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  const greeting = getGreeting(lang);
  const userName = profile?.full_name || t('home.greeting', lang);

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-6 pt-12 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/70 text-sm">{greeting}</p>
            <h1 className="text-2xl font-bold text-white">
              {userName} 🙏
            </h1>
          </div>
          <Link to="/settings" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-xl">⚙️</span>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3">
          <Link
            to="/scan"
            className="flex flex-col items-center gap-2 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition"
          >
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <Camera className="w-6 h-6 text-[#1B3A6B]" />
            </div>
            <span className="text-white text-xs font-medium">{t('nav.scan', lang)}</span>
          </Link>
          
          <Link
            to="/chat"
            className="flex flex-col items-center gap-2 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition"
          >
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-[#1B3A6B]" />
            </div>
            <span className="text-white text-xs font-medium">{t('nav.chat', lang)}</span>
          </Link>
          
          <Link
            to="/vault"
            className="flex flex-col items-center gap-2 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition"
          >
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-[#1B3A6B]" />
            </div>
            <span className="text-white text-xs font-medium">{t('nav.vault', lang)}</span>
          </Link>
          
          <Link
            to="/schemes"
            className="flex flex-col items-center gap-2 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition"
          >
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
              <Search className="w-6 h-6 text-[#1B3A6B]" />
            </div>
            <span className="text-white text-xs font-medium">{t('nav.schemes', lang)}</span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Upcoming Reminders */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#1A1A2E] flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#FF7A00]" />
              {t('home.upcomingReminders', lang)}
            </h2>
            <Link to="/reminders" className="text-[#1B3A6B] text-sm font-medium flex items-center gap-1">
              {t('home.viewAll', lang)} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl skeleton" />
              ))}
            </div>
          ) : reminders.length > 0 ? (
            <div className="space-y-3">
              {reminders.map((reminder) => {
                const days = getDaysUntil(reminder.due_date);
                return (
                  <Link
                    key={reminder.id}
                    to={`/reminders`}
                    className="block p-4 bg-white rounded-xl border border-gray-100 hover:border-[#1B3A6B]/20 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#FF7A00]/10 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-[#FF7A00]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#1A1A2E]">{reminder.title}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(reminder.due_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        days <= 3 
                          ? 'bg-red-100 text-red-600' 
                          : days <= 7 
                            ? 'bg-amber-100 text-amber-600' 
                            : 'bg-green-100 text-green-600'
                      }`}>
                        {days === 0 ? t('home.today', lang) : days === 1 ? t('home.tomorrow', lang) : `${days} ${t('home.days', lang)}`}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-6 bg-white rounded-xl border border-gray-100 text-center">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">{t('home.noReminders', lang)}</p>
              <Link 
                to="/reminders" 
                className="inline-block mt-3 text-[#1B3A6B] font-medium text-sm"
              >
                {t('home.addReminder', lang)}
              </Link>
            </div>
          )}
        </section>

        {/* Recommended Schemes */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#1A1A2E] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#0F9D58]" />
              {t('home.recommendedSchemes', lang)}
            </h2>
            <Link to="/schemes" className="text-[#1B3A6B] text-sm font-medium flex items-center gap-1">
              {t('home.viewAll', lang)} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-xl skeleton" />
              ))}
            </div>
          ) : schemes.length > 0 ? (
            <div className="space-y-3">
              {schemes.map((scheme) => (
                <Link
                  key={scheme.id}
                  to={`/schemes/${scheme.id}`}
                  className="block p-4 bg-white rounded-xl border border-gray-100 hover:border-[#1B3A6B]/20 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="verified-badge verified">
                          {t('home.verified', lang)}
                        </span>
                      </div>
                      <h3 className="font-medium text-[#1A1A2E]">{scheme.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{scheme.department}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-white rounded-xl border border-gray-100 text-center">
              <Search className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">{t('home.noSchemes', lang)}</p>
            </div>
          )}
        </section>

        {/* Other Actions */}
        <section>
          <h2 className="text-lg font-semibold text-[#1A1A2E] mb-4">{t('home.quickActions', lang)}</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/apps"
              className="p-4 bg-white rounded-xl border border-gray-100 hover:border-[#1B3A6B]/20 transition"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <span className="text-xl">📋</span>
              </div>
              <p className="font-medium text-[#1A1A2E]">{t('home.myApplications', lang)}</p>
              <p className="text-sm text-gray-500">{t('home.trackProgress', lang)}</p>
            </Link>
            
            <Link
              to="/scam"
              className="p-4 bg-white rounded-xl border border-gray-100 hover:border-[#1B3A6B]/20 transition"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <Shield className="w-5 h-5 text-[#0F9D58]" />
              </div>
              <p className="font-medium text-[#1A1A2E]">{t('home.scamShield', lang)}</p>
              <p className="text-sm text-gray-500">{t('home.checkMessages', lang)}</p>
            </Link>
            
            <Link
              to="/family"
              className="p-4 bg-white rounded-xl border border-gray-100 hover:border-[#1B3A6B]/20 transition"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-[#1B3A6B]" />
              </div>
              <p className="font-medium text-[#1A1A2E]">{t('home.familyMode', lang)}</p>
              <p className="text-sm text-gray-500">{t('home.manageDocs', lang)}</p>
            </Link>
            
            <Link
              to="/settings"
              className="p-4 bg-white rounded-xl border border-gray-100 hover:border-[#1B3A6B]/20 transition"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                <span className="text-xl">⚙️</span>
              </div>
              <p className="font-medium text-[#1A1A2E]">{t('home.settings', lang)}</p>
              <p className="text-sm text-gray-500">{t('home.languageNotifications', lang)}</p>
            </Link>
          </div>
        </section>
      </div>

      {/* Disclaimer */}
      <div className="disclaimer">
        {t('disclaimer.text', lang)}
      </div>
    </div>
  );
}
