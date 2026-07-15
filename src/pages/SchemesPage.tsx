import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@doable/data';
import { ai, type ChatMessage } from '@doable/ai';
import { useApp } from '../lib/AppContext';
import { Link } from '../lib/Router';
import { Search, Filter, ChevronRight, ExternalLink, CheckCircle, MapPin, Users, Briefcase, GraduationCap, Heart, Home, Sparkles, Loader2, Plus, X, SlidersHorizontal, Shield, FileText, Clock, Brain, Phone, RefreshCw, Zap, Globe, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

interface LiveUpdateRecord {
  id: string;
  last_fetched_at: string;
  schemes_found_count: number;
  new_schemes_count: number;
  status: string;
  source_name: string;
}

interface NewScheme {
  name: string;
  url: string;
  description: string;
  eligibility: string;
  benefits: string;
  how_to_apply: string;
  department: string;
  category: string;
}

interface Scheme {
  id: string;
  title: string;
  description: string;
  short_benefit?: string;
  category: string;
  gender?: string;
  min_age?: number;
  max_age?: number;
  category_eligible?: string[];
  income_limit?: number;
  professions?: string[];
  student_levels?: string[];
  student_streams?: string[];
  education_percentage_min?: number;
  employment_status?: string[];
  business_type?: string[];
  domicile_required?: boolean;
  applicable_states?: string[];
  coverage?: string;
  benefit_type?: string;
  benefit_amount_min?: number;
  benefit_amount_max?: number;
  benefit_amount_text?: string;
  required_documents?: string[];
  application_mode?: string[];
  official_url?: string;
  helpline?: string;
  department?: string;
  ministry?: string;
  source_verified_at?: string;
  is_active?: boolean;
  created_at?: string;
  tags?: string[];
}

interface AISchemeSearchResult {
  title: string;
  description: string;
  eligibility: string[];
  documents: string[];
  url: string;
  department: string;
  category: string;
}

// Comprehensive category mapping - UI filters to DB categories/keywords
const CATEGORY_MAP: Record<string, string[]> = {
  student: ['student', 'education', 'scholarship', 'school', 'college', 'university'],
  farmer: ['farmer', 'agriculture', 'kisan', 'krishi', 'crop', 'land', 'farming'],
  women: ['women', 'mother', 'child', 'widow', 'pregnant', 'girl', 'beti', 'stree'],
  housing: ['housing', 'home', 'shelter', 'gratuity', 'house', 'bhavan', 'awas'],
  health: ['health', 'medical', 'insurance', 'ayush', 'hospital', 'disease', 'swasthya'],
  business: ['business', 'entrepreneur', 'mudra', 'startup', 'enterprise', 'udyami', 'udyog'],
  employment: ['employment', 'job', 'skill', 'training', 'work', 'rozgar', 'naukri'],
  elderly: ['elderly', 'senior', 'pension', 'old', 'vridha', 'retired'],
  general: ['general', 'citizen', 'all', 'common', 'everyone', 'service', 'infra'],
};

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'general', label: 'General', icon: Globe },
  { id: 'student', label: 'Students', icon: GraduationCap },
  { id: 'farmer', label: 'Farmers', icon: Home },
  { id: 'women', label: 'Women', icon: Heart },
  { id: 'housing', label: 'Housing', icon: Home },
  { id: 'health', label: 'Health', icon: Heart },
  { id: 'business', label: 'Business', icon: Briefcase },
  { id: 'employment', label: 'Employment', icon: Briefcase },
  { id: 'elderly', label: 'Elderly', icon: Users },
];

export function SchemesPage() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiSearching, setAiSearching] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResults, setAiResults] = useState<AISchemeSearchResult[]>([]);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [addingScheme, setAddingScheme] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all']);
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [tab, setTab] = useState<'for-you' | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [liveUpdating, setLiveUpdating] = useState(false);
  const [lastLiveUpdate, setLastLiveUpdate] = useState<LiveUpdateRecord | undefined>(undefined);
  const [newSchemesFromUpdate, setNewSchemesFromUpdate] = useState<NewScheme[]>([]);
  const { profile } = useApp();

  useEffect(() => {
    loadSchemes();
    loadLastUpdateInfo();
  }, [profile]);

  async function loadLastUpdateInfo() {
    try {
      const r = await db.query<LiveUpdateRecord>(
        'SELECT * FROM live_scheme_updates ORDER BY last_fetched_at DESC LIMIT 1'
      );
      if (r.ok && r.rows.length > 0) {
        setLastLiveUpdate(r.rows[0] as LiveUpdateRecord);
      }
    } catch (error) {
      console.error('Failed to load update info:', error);
    }
  }

  async function loadSchemes() {
    setLoading(true);
    try {
      const r = await db.query<Scheme>('SELECT * FROM schemes WHERE is_active IS NOT FALSE ORDER BY created_at DESC');
      if (r.ok) {
        setSchemes(r.rows as Scheme[]);
      }
    } catch (error) {
      console.error('Failed to load schemes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLiveSchemeUpdates() {
    setLiveUpdating(true);
    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: `You are a government scheme researcher for India. Search for any NEW government schemes launched or updated in the last 6 months (2024-2025). Focus on: central government schemes, state-specific schemes, and employment/generation programs. Return a JSON array with this exact format:
[{"name": "Scheme Name", "url": "official URL or N/A", "description": "Brief description", "eligibility": "Who can apply", "benefits": "What you get", "how_to_apply": "Application process", "department": "Ministry/Department", "category": "student/farmer/women/health/housing/business/employment/elderly/general"}] 
Return 5-10 most important new schemes. If no new schemes found, return an empty array. Only return valid JSON array, no markdown or explanation.` },
        { role: 'user', content: 'Find the latest government schemes announced or updated in 2024-2025 in India, especially any new employment, farmer support, women welfare, or education schemes. List them in the specified JSON format.' }
      ];

      let response = '';
      for await (const token of ai.chat(messages)) {
        response += token;
      }

      // Parse the AI response
      try {
        const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const schemes = JSON.parse(cleaned);
        
        if (Array.isArray(schemes) && schemes.length > 0) {
          await db.query(
            'INSERT INTO live_scheme_updates (status, schemes_found_count, new_schemes_count, source_name) VALUES ($1, $2, $3, $4)',
            ['success', schemes.length, schemes.length, 'AI Research']
          );
          setNewSchemesFromUpdate(schemes);
          setLastLiveUpdate({
            id: '',
            last_fetched_at: new Date().toISOString(),
            schemes_found_count: schemes.length,
            new_schemes_count: schemes.length,
            status: 'success',
            source_name: 'AI Research'
          });
        }
      } catch (e) {
        console.error('Failed to parse AI response:', e);
        await db.query(
          'INSERT INTO live_scheme_updates (status, schemes_found_count, source_name) VALUES ($1, $2, $3)',
          ['failed', 0, 'AI Research']
        );
      }
    } catch (error) {
      console.error('Failed to fetch live updates:', error);
    } finally {
      setLiveUpdating(false);
    }
  }

  // Enhanced category matching - check if ANY keyword from category matches the scheme
  function matchesCategorySingle(scheme: Scheme | AISchemeSearchResult, categoryId: string): boolean {
    if (categoryId === 'all') return true;
    
    // Get the keywords for this category
    const keywords = CATEGORY_MAP[categoryId] || [categoryId];
    
    // Build scheme text from category, professions, and title/description
    const schemeCategory = (scheme as Scheme).category?.toLowerCase() || (scheme as AISchemeSearchResult).category?.toLowerCase() || '';
    const schemeProfessions = ((scheme as Scheme).professions || []).map((p: string) => p.toLowerCase());
    const schemeTitle = (scheme as Scheme).title?.toLowerCase() || (scheme as AISchemeSearchResult).title?.toLowerCase() || '';
    const schemeDesc = (scheme as AISchemeSearchResult).description?.toLowerCase() || '';
    const schemeTags = ((scheme as Scheme).tags || []).map((t: string) => t.toLowerCase());
    const schemeText = [schemeCategory, ...schemeProfessions, schemeTitle, schemeDesc, ...schemeTags].join(' ');
    
    // Check if ANY keyword appears in the scheme text (partial match)
    return keywords.some(k => schemeText.includes(k));
  }

  const filteredByTab = useMemo(() => {
    if (tab === 'for-you' && profile) {
      const profileKeywords: string[] = [];
      if (profile.occupation_category) profileKeywords.push(profile.occupation_category.toLowerCase());
      if (profile.state) profileKeywords.push(profile.state.toLowerCase());
      
      return schemes.filter(scheme => {
        const schemeText = `${scheme.category} ${scheme.title} ${scheme.professions?.join(' ') || ''} ${scheme.category_eligible?.join(' ') || ''} ${scheme.applicable_states?.join(' ') || ''}`.toLowerCase();
        return profileKeywords.some(k => schemeText.includes(k)) || profileKeywords.length === 0;
      });
    }
    return schemes;
  }, [schemes, tab, profile]);

  const displayedSchemes = useMemo(() => {
    let filtered = filteredByTab;
    
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(s => 
        s.title.toLowerCase().includes(searchLower) ||
        s.description.toLowerCase().includes(searchLower) ||
        s.category.toLowerCase().includes(searchLower)
      );
    }
    
    if (!selectedCategories.includes('all')) {
      filtered = filtered.filter(s => selectedCategories.some(cat => matchesCategorySingle(s, cat)));
    }
    
    return filtered;
  }, [filteredByTab, search, selectedCategories]);

  // Fixed category counts - count schemes matching each category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: schemes.length };
    
    CATEGORIES.forEach(cat => {
      if (cat.id !== 'all') {
        // Count all schemes that match this category filter
        counts[cat.id] = schemes.filter(s => matchesCategorySingle(s, cat.id)).length;
      }
    });
    
    return counts;
  }, [schemes, CATEGORIES]);

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">Government Schemes</h1>
            <p className="text-white/70 text-sm">{schemes.length}+ schemes for citizens</p>
          </div>
          <button
            onClick={() => setShowAiPanel(true)}
            className="px-4 py-2 bg-white/20 rounded-full text-white text-sm font-medium flex items-center gap-2 hover:bg-white/30 transition"
          >
            <Brain className="w-4 h-4" />
            AI Finder
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              tab === 'all'
                ? 'bg-white text-[#1B3A6B]'
                : 'bg-white/20 text-white'
            }`}
          >
            All Schemes
          </button>
          <button
            onClick={() => setTab('for-you')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              tab === 'for-you'
                ? 'bg-white text-[#1B3A6B]'
                : 'bg-white/20 text-white'
            }`}
          >
            For You
          </button>
        </div>
      </div>

      {/* Live Scheme Updates Banner */}
      <div className="px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Zap className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800">
                {lastLiveUpdate ? `Live: ${lastLiveUpdate.new_schemes_count || 0} new schemes found` : 'Live Scheme Updates'}
              </p>
              {lastLiveUpdate?.last_fetched_at && (
                <p className="text-xs text-green-600">
                  Last updated: {new Date(lastLiveUpdate.last_fetched_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={fetchLiveSchemeUpdates}
            disabled={liveUpdating}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {liveUpdating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Refresh
              </>
            )}
          </button>
        </div>
      </div>

      {/* New Schemes from Live Update */}
      {newSchemesFromUpdate.length > 0 && (
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <h3 className="text-sm font-semibold text-blue-800 mb-3">New Schemes Discovered</h3>
          <div className="space-y-2">
            {newSchemesFromUpdate.slice(0, 5).map((scheme, idx) => (
              <div key={idx} className="bg-white rounded-lg p-3 shadow-sm">
                <p className="font-medium text-gray-900">{scheme.name}</p>
                <p className="text-xs text-gray-500 mt-1">{scheme.description}</p>
                {scheme.url && scheme.url !== 'N/A' && (
                  <a href={scheme.url} target="_blank" rel="noopener noreferrer" 
                     className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                    Learn more →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search schemes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-[#1B3A6B] focus:bg-white transition"
          />
        </div>
        
        {/* Category Pills */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const count = categoryCounts[cat.id] || 0;
            const isSelected = selectedCategories.includes(cat.id);
            
            return (
              <button
                key={cat.id}
                onClick={() => {
                  if (cat.id === 'all') {
                    setSelectedCategories(['all']);
                  } else {
                    const newCats = selectedCategories.filter(c => c !== 'all');
                    if (isSelected) {
                      setSelectedCategories(newCats.filter(c => c !== cat.id));
                    } else {
                      setSelectedCategories([...newCats, cat.id]);
                    }
                    if (selectedCategories.length === 0 && !isSelected) {
                      setSelectedCategories([cat.id]);
                    }
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  isSelected
                    ? 'bg-[#1B3A6B] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  isSelected ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div className="px-6 py-4">
        <p className="text-sm text-gray-600 mb-4">
          {displayedSchemes.length} scheme{displayedSchemes.length !== 1 ? 's' : ''} found
        </p>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#1B3A6B]" />
          </div>
        ) : displayedSchemes.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600">No schemes found matching your criteria</p>
            <button 
              onClick={() => { setSearch(''); setSelectedCategories(['all']); }}
              className="mt-4 text-[#1B3A6B] font-medium"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedSchemes.map(scheme => (
              <Link key={scheme.id} to={`/schemes/${scheme.id}`}>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {scheme.category}
                        </span>
                        {scheme.benefit_type && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                            {scheme.benefit_type}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{scheme.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{scheme.description}</p>
                      {scheme.short_benefit && (
                        <p className="text-sm text-green-700 font-medium mt-2">
                          ✓ {scheme.short_benefit}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                  </div>
                  
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                    {scheme.department && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Briefcase className="w-3 h-3" />
                        {scheme.department}
                      </div>
                    )}
                    {scheme.coverage && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        {scheme.coverage}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* AI Scheme Finder Panel */}
      {showAiPanel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">AI Scheme Finder</h2>
              <button
                onClick={() => setShowAiPanel(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-gray-600 mb-4">
                Describe your profile or needs and I'll find the most relevant government schemes for you.
              </p>
              
              <textarea
                value={aiSearchQuery}
                onChange={(e) => setAiSearchQuery(e.target.value)}
                placeholder="e.g., I'm a pregnant woman in Bihar looking for financial assistance..."
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B3A6B] focus:border-transparent resize-none"
                rows={4}
              />
              
              {aiError && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                  {aiError}
                </div>
              )}
              
              {aiResults.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h3 className="font-semibold text-gray-900">Found {aiResults.length} matching schemes:</h3>
                  {aiResults.map((result, idx) => (
                    <div key={idx} className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">{result.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{result.description}</p>
                      {result.url && (
                        <a href={result.url} target="_blank" rel="noopener noreferrer" 
                           className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                          Learn more →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={searchWithAI}
                disabled={aiSearching || !aiSearchQuery.trim()}
                className="w-full py-3 bg-[#1B3A6B] text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {aiSearching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Finding schemes...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5" />
                    Find Schemes with AI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  async function searchWithAI() {
    if (!aiSearchQuery.trim() || aiSearching) return;
    
    setAiSearching(true);
    setAiError(null);
    setAiResults([]);
    
    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: `You are a helpful assistant that finds Indian government schemes based on user descriptions. Search from these known schemes and return the most relevant ones in JSON format:
        
Known schemes database:
- PM Kisan Samman Nidhi: For farmers, Rs 6000/year
- Sukanya Samriddhi Yojana: For girl child education
- PM Awas Yojana: For housing
- Ayushman Bharat: Health insurance
- PM Mudra Yojana: Business loans
- PM Fasal Bima Yojana: Crop insurance
- PM Vishwakarma: Artisan support
- PM Jan Dhan: Banking for all
- PM Ujjwala: Free gas connection
- PM Awas Gramin: Rural housing
- Startup India: Business support
- Stand Up India: SC/ST/Women entrepreneurship
- Beti Bachao Beti Padhao: Girl child welfare
- PM Matru Vandana: Maternity benefit
- Soil Health Card: Farmer support
- Kisan Credit Card: Farm credit

Return a JSON array of best matching schemes (max 5) with this format:
[{"title": "Scheme Name", "description": "Brief description", "eligibility": ["eligibility criteria"], "documents": ["required documents"], "url": "official URL or N/A", "department": "Department", "category": "student/farmer/women/health/housing/business/employment/elderly/general"}]

Only return valid JSON, no markdown or explanation.` },
        { role: 'user', content: aiSearchQuery }
      ];

      let response = '';
      for await (const token of ai.chat(messages)) {
        response += token;
      }

      // Parse response
      try {
        const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const results = JSON.parse(cleaned);
        setAiResults(Array.isArray(results) ? results : []);
      } catch (e) {
        setAiError('Failed to parse AI response. Please try again.');
      }
    } catch (error) {
      setAiError('Failed to search. Please check your connection and try again.');
    } finally {
      setAiSearching(false);
    }
  }
}
