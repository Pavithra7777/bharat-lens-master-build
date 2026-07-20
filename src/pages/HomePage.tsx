import { useState, useEffect } from 'react';
import { useNavigate } from '../lib/Router';
import { useApp } from '../lib/AppContext';
import { db } from '@doable/data';
import { translations } from '../lib/i18n';
import { Bell, Search, Shield, ChevronRight, Mic, Camera, FileText, Users, AlertTriangle, Loader2, Bookmark, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Reminder {
  id: string;
  title: string;
  due_date: string;
  scheme_name: string | null;
  category: string;
  status: string;
  description: string | null;
}

interface Scheme {
  id: string;
  name: string;
  category: string;
  description: string;
  benefits: string;
  eligibility: string;
  deadline: string | null;
  tag: string[];
  official_link: string | null;
}

export function HomePage() {
  const navigate = useNavigate();
  const { user, profile, simpleMode, language } = useApp();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const t = translations[language];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const remindersRes = await db.query<Reminder>(
        `SELECT * FROM reminders WHERE created_by = $1 AND is_completed = false ORDER BY due_date ASC LIMIT 5`,
        [user.id]
      );
      const schemesRes = await db.query<Scheme>(
        `SELECT id, title as name, category, description, short_benefit as benefits, null as deadline, tags as tag, official_url as official_link FROM schemes WHERE is_active = true ORDER BY created_at DESC LIMIT 6`,
        []
      );
      if (remindersRes.ok && remindersRes.rows) setReminders(remindersRes.rows);
      if (schemesRes.ok && schemesRes.rows) setSchemes(schemesRes.rows);
    } catch (error) {
      console.error('Home data load failed:', error);
    } finally {
      setLoading(false);
    }
  }

  const greeting = getGreeting();

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return language === 'hi' ? 'सुप्रभात' : language === 'ta' ? 'காலை வணக்கம்' : 'Good Morning';
    if (hour < 17) return language === 'hi' ? 'नमस्ते' : language === 'ta' ? 'மதிய வணக்கம்' : 'Good Afternoon';
    return language === 'hi' ? 'शुभ संध्या' : language === 'ta' ? 'இரவு வணக்கம்' : 'Good Evening';
  }

  return (
    <div className={`min-h-screen ${simpleMode ? 'bg-blue-50' : 'bg-[#F8FAFC]'}`}>
      <div className="bg-[#1B3A6B] text-white px-5 pt-10 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/70 text-sm">{greeting}</p>
            <h1 className="text-xl font-semibold mt-1">{profile?.full_name || (simpleMode ? 'नमस्ते' : 'Hello')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/reminders')} className="relative p-2 rounded-full bg-white/10 hover:bg-white/20">
              <Bell className="w-5 h-5" />
              {reminders.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  {reminders.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={simpleMode ? (language === 'hi' ? 'यहाँ खोजें...' : language === 'ta' ? 'தேடவும்...' : 'Search here...') : 'Search schemes, documents...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                navigate(`/schemes?search=${encodeURIComponent(searchQuery)}`);
              }
            }}
            className="w-full pl-10 pr-4 py-3 rounded-xl text-[#1A1A2E] text-sm placeholder-gray-400 outline-none"
          />
        </div>
      </div>

      <div className="px-5 -mt-4 space-y-6 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#1B3A6B] animate-spin" />
          </div>
        ) : (
          <>
            {reminders.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-5 -mt-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-[#1A1A2E]">Upcoming Reminders</h2>
                  <button onClick={() => navigate('/reminders')} className="text-[#1B3A6B] text-sm font-medium flex items-center gap-1">
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {reminders.slice(0, 3).map(reminder => (
                    <div key={reminder.id} className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl">
                      <div className="w-10 h-10 bg-[#FFF3CD] rounded-full flex items-center justify-center flex-shrink-0">
                        <Bell className="w-5 h-5 text-[#856404]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1A1A2E] truncate">{reminder.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {reminder.due_date ? new Date(reminder.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Camera, label: simpleMode ? (language === 'hi' ? 'स्कैन करें' : language === 'ta' ? 'ஸ்கேன்' : 'Scan') : 'AI Scan', desc: simpleMode ? (language === 'hi' ? 'दस्तावेज़ या छवि' : language === 'ta' ? 'ஆவணம்/படம்' : 'Doc/Image') : 'Analyze any document', color: 'bg-purple-50', iconColor: 'text-purple-600', path: '/scan' },
                { icon: Shield, label: simpleMode ? (language === 'hi' ? 'घोटाला' : language === 'ta' ? 'மோசடி' : 'Scam') : 'Scam Shield', desc: simpleMode ? (language === 'hi' ? 'जालसाज़ी से बचाव' : language === 'ta' ? 'மோசடியில் இருந்து பாதுகாப்பு' : 'Stay protected') : 'Verify schemes', color: 'bg-red-50', iconColor: 'text-red-600', path: '/scam' },
                { icon: Mic, label: simpleMode ? (language === 'hi' ? 'बात करें' : language === 'ta' ? 'அரட்டை' : 'Chat') : 'AI Chat', desc: simpleMode ? (language === 'hi' ? 'अपनी भाषा में बात करें' : language === 'ta' ? 'உங்கள் மொழியில் பேசுங்கள்' : 'In your language') : 'Ask anything', color: 'bg-blue-50', iconColor: 'text-blue-600', path: '/chat' },
                { icon: FileText, label: simpleMode ? (language === 'hi' ? 'वाउचर' : language === 'ta' ? 'வவுச்சர்' : 'Vault') : 'Document Vault', desc: simpleMode ? (language === 'hi' ? 'आपके दस्तावेज़' : language === 'ta' ? 'உங்கள் ஆவணங்கள்' : 'Your docs') : 'Store & organize', color: 'bg-green-50', iconColor: 'text-green-600', path: '/vault' },
              ].map((item, i) => (
                <button key={i} onClick={() => navigate(item.path)} className={`${item.color} rounded-2xl p-4 text-left active:scale-95 transition`}>
                  <item.icon className={`w-6 h-6 ${item.iconColor} mb-2`} />
                  <p className="font-semibold text-[#1A1A2E] text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </button>
              ))}
            </div>

            {schemes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-[#1A1A2E]">Recommended for You</h2>
                  <button onClick={() => navigate('/schemes')} className="text-[#1B3A6B] text-sm font-medium flex items-center gap-1">
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {schemes.slice(0, 4).map(scheme => (
                    <Link key={scheme.id} to={`/schemes/${scheme.id}`} className="block bg-white rounded-2xl shadow-sm p-4 active:scale-[0.99] transition">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-[#E8F0FE] rounded-xl flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-[#1B3A6B]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium text-[#1A1A2E] text-sm leading-tight">{scheme.name}</h3>
                            {scheme.deadline && (
                              <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                                {new Date(scheme.deadline) < new Date() ? 'Expired' : new Date(scheme.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{scheme.description}</p>
                          {scheme.tag && scheme.tag.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {scheme.tag.slice(0, 3).map((tag, i) => (
                                <span key={i} className="text-xs bg-[#F0F4FF] text-[#1B3A6B] px-2 py-0.5 rounded-full">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
