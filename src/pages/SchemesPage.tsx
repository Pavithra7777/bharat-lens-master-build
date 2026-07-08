import { useState, useEffect, useMemo } from 'react';
import { db } from '@doable/data';
import { ai, type ChatMessage } from '@doable/ai';
import { useApp } from '../lib/AppContext';
import { Link } from '../lib/Router';
import { Search, Filter, ChevronRight, ExternalLink, CheckCircle, MapPin, Users, Briefcase, GraduationCap, Heart, Home, Sparkles, Loader2, Plus, X, SlidersHorizontal, Shield, FileText, Clock } from 'lucide-react';

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
  category?: string;
}

const CATEGORIES = [
  { id: 'all', icon: '🗂️', label: 'All Schemes' },
  { id: 'farmer', icon: '🌾', label: 'Farmers' },
  { id: 'student', icon: '🎓', label: 'Students' },
  { id: 'women', icon: '👩', label: 'Women' },
  { id: 'housing', icon: '🏠', label: 'Housing' },
  { id: 'health', icon: '🏥', label: 'Health' },
  { id: 'business', icon: '💼', label: 'Business' },
  { id: 'elderly', icon: '👴', label: 'Senior Citizens' },
  { id: 'sc_st', icon: '🛡️', label: 'SC/ST' },
  { id: 'minority', icon: '🌍', label: 'Minority' },
  { id: 'disability', icon: '♿', label: 'Disability' },
  { id: 'employment', icon: '💻', label: 'Employment' },
  { id: 'agriculture', icon: '🌱', label: 'Agriculture' },
  { id: 'education', icon: '📚', label: 'Education' },
];

export function SchemesPage() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiSearching, setAiSearching] = useState(false);
  const [aiResults, setAiResults] = useState<AISchemeSearchResult[]>([]);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [addingScheme, setAddingScheme] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all']);
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [tab, setTab] = useState<'for-you' | 'all'>('for-you');
  const [showFilters, setShowFilters] = useState(false);
  const { profile } = useApp();

  useEffect(() => {
    loadSchemes();
  }, [profile]);

  async function loadSchemes() {
    setLoading(true);
    try {
      const r = await db.query<Scheme>(
        'SELECT * FROM schemes WHERE is_active = true ORDER BY source_verified_at DESC'
      );
      if (r.ok) setSchemes(r.rows);
    } catch (error) {
      console.error('Load schemes failed:', error);
    } finally {
      setLoading(false);
    }
  }

  // Map database category to filter category
  function mapCategoryToFilter(category: string): string {
    const cat = category.toLowerCase();
    if (cat.includes('farm') || cat.includes('agri')) return 'farmer';
    if (cat.includes('student') || cat.includes('scholarship') || cat.includes('education')) return 'student';
    if (cat.includes('women') || cat.includes('gender')) return 'women';
    if (cat.includes('housing') || cat.includes('home')) return 'housing';
    if (cat.includes('health') || cat.includes('medical') || cat.includes('insurance')) return 'health';
    if (cat.includes('business') || cat.includes('entrepreneur') || cat.includes('mudra') || cat.includes('startup')) return 'business';
    if (cat.includes('elderly') || cat.includes('senior') || cat.includes('pension')) return 'elderly';
    if (cat.includes('minority') || cat.includes('minorities')) return 'minority';
    if (cat.includes('disability') || cat.includes('disabled')) return 'disability';
    if (cat.includes('employment') || cat.includes('job') || cat.includes('skill')) return 'employment';
    return cat;
  }

  // Check if a scheme belongs to a category
  function matchesCategorySingle(scheme: Scheme, categoryId: string): boolean {
    if (categoryId === 'all') return true;
    
    const category = (scheme.category || '').toLowerCase();
    const professions = scheme.professions || [];
    const categoryEligible = scheme.category_eligible || [];
    const tags = scheme.tags || [];
    const title = scheme.title.toLowerCase();
    const description = scheme.description?.toLowerCase() || '';
    
    // Check category field
    if (mapCategoryToFilter(category) === categoryId) return true;
    
    // Check professions array
    if (professions.some(p => p.toLowerCase().includes(categoryId))) return true;
    
    // Check category_eligible array
    if (categoryEligible.some(c => c.toLowerCase().includes(categoryId))) return true;
    
    // Check tags array
    if (tags.some(t => t.toLowerCase().includes(categoryId))) return true;
    
    // Check title/description for keyword matches
    const keywords: Record<string, string[]> = {
      'farmer': ['farmer', 'kisan', 'agriculture', 'crop', 'farming'],
      'student': ['student', 'scholarship', 'education', 'college', 'school'],
      'women': ['women', 'girl', 'mother', 'widow'],
      'housing': ['housing', 'home', '住', 'gruh'],
      'health': ['health', 'medical', 'hospital', 'ayushman', 'insurance'],
      'business': ['business', 'entrepreneur', 'mudra', 'startup', 'loan'],
      'elderly': ['elderly', 'senior', 'pension', 'old age'],
      'minority': ['minority', 'muslim', 'christian', 'sikh', 'budhist'],
      'disability': ['disability', 'disabled', 'handicap'],
      'employment': ['employment', 'job', 'skill', 'training', 'rojgar'],
      'agriculture': ['agriculture', 'farmer', 'crop', 'kisan', 'fasal'],
      'education': ['education', 'student', 'scholarship', 'college'],
    };
    
    const kws = keywords[categoryId] || [];
    if (kws.some(kw => title.includes(kw) || description.includes(kw))) return true;
    
    return false;
  }

  // Calculate scheme counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: schemes.length };
    CATEGORIES.forEach(cat => {
      if (cat.id !== 'all') {
        counts[cat.id] = schemes.filter(s => matchesCategorySingle(s, cat.id)).length;
      }
    });
    return counts;
  }, [schemes]);

  async function searchSchemesWithAI(query: string) {
    if (!query.trim()) return;
    
    setAiSearching(true);
    setAiResults([]);
    
    try {
      const userProfile = profile ? `
        User Profile:
        - Name: ${profile.full_name || 'Not set'}
        - State: ${profile.state || 'Not set'}
        - District: ${profile.district || 'Not set'}
        - Occupation: ${profile.occupation_category || 'Not set'}
      ` : 'No profile information available';
      
      const systemPrompt = `You are a government schemes expert for India. Based on the user's query and profile, find relevant Indian government schemes from official sources (like pmkisan.gov.in, pmjay.gov.in, scholarships.gov.in, mudra.org.in, etc.).

Return ONLY a valid JSON array with no other text. Up to 5 schemes with this exact format:
[{
  "title": "Scheme Name",
  "description": "Brief description of the scheme",
  "eligibility": ["eligibility criterion 1", "eligibility criterion 2"],
  "documents": ["required document 1", "required document 2"],
  "url": "official website URL",
  "department": "Department name",
  "category": "primary category (farmer, student, women, housing, health, business, elderly, sc_st, minority, disability, employment)"
}]

Only include schemes that are:
1. Actually from Indian government sources
2. Currently active/applicable
3. Relevant to the user's query and profile

If no specific schemes match, return an empty array [].`;

      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `User Query: ${query}\n${userProfile}\n\nFind relevant government schemes for this person.` }
      ];

      let responseText = '';
      for await (const token of ai.chat(messages)) {
        responseText += token;
      }
      
      try {
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed)) {
            setAiResults(parsed);
          }
        } else {
          const parsed = JSON.parse(responseText);
          if (Array.isArray(parsed)) {
            setAiResults(parsed);
          }
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
      }
    } catch (error) {
      console.error('AI search failed:', error);
    } finally {
      setAiSearching(false);
    }
  }

  async function addSchemeToDatabase(scheme: AISchemeSearchResult) {
    setAddingScheme(scheme.title);
    
    try {
      const cat = scheme.category?.toLowerCase() || '';
      let professions: string[] = [];
      let categoryEligible: string[] = [];
      
      if (cat.includes('farmer') || scheme.eligibility.some(e => e.toLowerCase().includes('farmer'))) {
        professions = ['farmer'];
      } else if (cat.includes('student') || scheme.eligibility.some(e => e.toLowerCase().includes('student'))) {
        professions = ['student'];
      } else if (cat.includes('entrepreneur') || cat.includes('business')) {
        professions = ['entrepreneur'];
      }
      
      if (cat.includes('women')) categoryEligible.push('women');
      if (cat.includes('sc') || cat.includes('st')) categoryEligible.push('sc_st');
      if (cat.includes('minority')) categoryEligible.push('minority');

      await db.query(
        `INSERT INTO schemes (title, description, category, professions, category_eligible, required_documents, applicable_states, official_url, department, source_verified_at, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE, true)`,
        [
          scheme.title,
          scheme.description,
          cat,
          professions,
          categoryEligible,
          scheme.documents,
          ['All India'],
          scheme.url,
          scheme.department,
        ]
      );
      
      await loadSchemes();
      setAiResults(prev => prev.filter(s => s.title !== scheme.title));
    } catch (error) {
      console.error('Failed to add scheme:', error);
    } finally {
      setAddingScheme(null);
    }
  }

  function matchesCategories(scheme: Scheme): boolean {
    if (selectedCategories.includes('all')) return true;
    return selectedCategories.some(cat => matchesCategorySingle(scheme, cat));
  }

  function matchesSearch(scheme: Scheme): boolean {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      scheme.title.toLowerCase().includes(query) ||
      scheme.description?.toLowerCase().includes(query) ||
      scheme.department?.toLowerCase().includes(query) ||
      scheme.category?.toLowerCase().includes(query)
    );
  }

  function matchesProfile(scheme: Scheme): boolean {
    if (!profile) return true;
    
    // Check occupation match
    if (scheme.professions && profile.occupation_category) {
      const occ = scheme.professions.map(p => p.toLowerCase());
      const userOcc = profile.occupation_category.toLowerCase();
      if (!occ.some(o => o.includes(userOcc) || userOcc.includes(o))) {
        return false;
      }
    }
    
    // Check state eligibility
    if (scheme.applicable_states && profile.state) {
      const states = scheme.applicable_states.map(s => s.toLowerCase());
      const userState = profile.state.toLowerCase();
      if (!states.some(s => s.includes('all') || s.includes(userState))) {
        return false;
      }
    }
    
    return true;
  }

  function toggleCategory(categoryId: string) {
    if (categoryId === 'all') {
      setSelectedCategories(['all']);
    } else {
      const newCategories = selectedCategories.filter(c => c !== 'all');
      if (newCategories.includes(categoryId)) {
        const filtered = newCategories.filter(c => c !== categoryId);
        setSelectedCategories(filtered.length === 0 ? ['all'] : filtered);
      } else {
        setSelectedCategories([...newCategories, categoryId]);
      }
    }
  }

  const filteredSchemes = schemes.filter(s => 
    matchesCategories(s) && matchesSearch(s)
  );

  const forYouSchemes = filteredSchemes.filter(matchesProfile);
  const displayedSchemes = tab === 'for-you' ? forYouSchemes : filteredSchemes;

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Government Schemes</h1>
            <p className="text-white/70 text-sm mt-1">{schemes.length} verified schemes from official sources</p>
          </div>
          <button
            onClick={() => setShowAiPanel(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white transition"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI Search</span>
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search schemes..."
            className="w-full pl-12 pr-12 py-3 bg-white rounded-xl outline-none"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition ${
              showFilters || !selectedCategories.includes('all')
                ? 'bg-[#1B3A6B] text-white'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setTab('for-you')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === 'for-you' ? 'bg-white text-[#1B3A6B]' : 'bg-white/20 text-white'
            }`}
          >
            For You
          </button>
          <button
            onClick={() => setTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === 'all' ? 'bg-white text-[#1B3A6B]' : 'bg-white/20 text-white'
            }`}
          >
            All Schemes
          </button>
        </div>
      </div>

      {/* Category Quick Filters */}
      <div className="px-6 py-3 overflow-x-auto bg-white border-b border-gray-100">
        <div className="flex gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setShowFilters(false);
                toggleCategory(cat.id);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                selectedCategories.includes(cat.id)
                  ? 'bg-[#1B3A6B] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              {categoryCounts[cat.id] > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  selectedCategories.includes(cat.id)
                    ? 'bg-white/20'
                    : 'bg-gray-200'
                }`}>
                  {categoryCounts[cat.id]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Active Filters Display */}
      {!selectedCategories.includes('all') && (
        <div className="px-6 py-2 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">Active filters:</span>
          {selectedCategories.map(catId => {
            const cat = CATEGORIES.find(c => c.id === catId);
            return cat ? (
              <span
                key={catId}
                className="inline-flex items-center gap-1 px-2 py-1 bg-[#1B3A6B]/10 text-[#1B3A6B] rounded-full text-xs"
              >
                {cat.icon} {cat.label}
                <button
                  onClick={() => toggleCategory(catId)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ) : null;
          })}
          <button
            onClick={() => setSelectedCategories(['all'])}
            className="text-xs text-[#1B3A6B] hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <div className="px-6 py-4 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-[#1A1A2E]">Filter by Category</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-between ${
                  selectedCategories.includes(cat.id)
                    ? 'bg-[#1B3A6B] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  selectedCategories.includes(cat.id)
                    ? 'bg-white/20'
                    : 'bg-gray-200'
                }`}>
                  {categoryCounts[cat.id]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scheme Count */}
      <div className="px-6 py-3 bg-white">
        <p className="text-sm text-gray-500">
          Showing {displayedSchemes.length} scheme{displayedSchemes.length !== 1 ? 's' : ''}
          {tab === 'for-you' && profile && ' based on your profile'}
        </p>
      </div>

      {/* Schemes List */}
      <div className="px-6 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#1B3A6B] animate-spin" />
          </div>
        ) : displayedSchemes.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-600 mb-2">No schemes found</h3>
            <p className="text-sm text-gray-400">Try adjusting your filters or search query</p>
          </div>
        ) : (
          displayedSchemes.map((scheme) => (
            <button
              key={scheme.id}
              onClick={() => setSelectedScheme(scheme)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-1 mb-1">
                    {scheme.tags?.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 bg-[#1B3A6B]/10 text-[#1B3A6B] rounded-full">
                        {tag}
                      </span>
                    ))}
                    {scheme.professions?.slice(0, 2).map((prof) => (
                      <span key={prof} className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                        {prof}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-semibold text-[#1A1A2E]">{scheme.title}</h3>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{scheme.description}</p>
              
              {/* Quick Info */}
              <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-3">
                {scheme.department && (
                  <span className="px-2 py-1 bg-gray-100 rounded flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    {scheme.department}
                  </span>
                )}
                {scheme.benefit_type && (
                  <span className="px-2 py-1 bg-green-50 text-green-600 rounded flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    {scheme.benefit_type}
                  </span>
                )}
                {scheme.required_documents && scheme.required_documents.length > 0 && (
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {scheme.required_documents.length} docs
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  {scheme.applicable_states?.includes('All India') ? (
                    <span className="px-2 py-1 bg-green-50 text-green-600 rounded flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      All India
                    </span>
                  ) : scheme.applicable_states && scheme.applicable_states.length > 0 ? (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {scheme.applicable_states.slice(0, 2).join(', ')}
                      {scheme.applicable_states.length > 2 && ` +${scheme.applicable_states.length - 2}`}
                    </span>
                  ) : null}
                </div>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {scheme.source_verified_at && new Date(scheme.source_verified_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* AI Search Panel */}
      {showAiPanel && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div 
            className="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#1A1A2E]">AI Scheme Finder</h2>
                  <p className="text-sm text-gray-500">Describe your situation to find relevant schemes</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAiPanel(false);
                  setAiResults([]);
                  setAiSearchQuery('');
                }}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={aiSearchQuery}
                  onChange={(e) => setAiSearchQuery(e.target.value)}
                  placeholder="E.g., I am a farmer from Maharashtra looking for schemes..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-[#1B3A6B]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !aiSearching) {
                      searchSchemesWithAI(aiSearchQuery);
                    }
                  }}
                />
              </div>
              
              <button
                onClick={() => searchSchemesWithAI(aiSearchQuery)}
                disabled={aiSearching || !aiSearchQuery.trim()}
                className="w-full py-3 bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {aiSearching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Find Schemes with AI
                  </>
                )}
              </button>
              
              {/* Quick Examples */}
              {!aiSearching && aiResults.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm mb-3">Try these examples:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[
                      'I am a student from UP',
                      'I am a pregnant woman',
                      'I need housing scheme',
                      'I am a small business owner'
                    ].map((example) => (
                      <button
                        key={example}
                        onClick={() => {
                          setAiSearchQuery(example);
                          searchSchemesWithAI(example);
                        }}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-600"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* AI Results */}
              {aiResults.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Found {aiResults.length} scheme(s)
                  </div>
                  
                  {aiResults.map((result, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-[#1B3A6B]/5 to-[#2A4A8B]/5 rounded-xl p-4 border border-[#1B3A6B]/10">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-[#1A1A2E] flex-1">{result.title}</h3>
                        <button
                          onClick={() => addSchemeToDatabase(result)}
                          disabled={addingScheme === result.title}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#1B3A6B] text-white rounded-lg text-sm font-medium hover:bg-[#2A4A8B] transition disabled:opacity-50"
                        >
                          {addingScheme === result.title ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                          Add
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{result.description}</p>
                      
                      {result.eligibility.length > 0 && (
                        <div className="mb-2">
                          <span className="text-xs font-medium text-[#1B3A6B]">Eligibility: </span>
                          <span className="text-xs text-gray-500">
                            {result.eligibility.join(', ')}
                          </span>
                        </div>
                      )}
                      
                      {result.documents.length > 0 && (
                        <div className="mb-2">
                          <span className="text-xs font-medium text-[#1B3A6B]">Documents: </span>
                          <span className="text-xs text-gray-500">
                            {result.documents.join(', ')}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{result.department}</span>
                        {result.category && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                            {CATEGORIES.find(c => c.id === result.category?.toLowerCase())?.icon} {result.category}
                          </span>
                        )}
                      </div>
                      {result.url && (
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#1B3A6B] flex items-center gap-1 hover:underline mt-2"
                        >
                          Visit <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scheme Detail Modal */}
      {selectedScheme && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#1A1A2E]">{selectedScheme.title}</h2>
                <p className="text-sm text-gray-500">{selectedScheme.department}</p>
              </div>
              <button
                onClick={() => setSelectedScheme(null)}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Category Tags */}
              <div className="flex flex-wrap gap-2">
                {selectedScheme.tags?.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-[#1B3A6B]/10 text-[#1B3A6B] rounded-full text-sm">
                    {tag}
                  </span>
                ))}
                {selectedScheme.professions?.map(prof => (
                  <span key={prof} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {prof}
                  </span>
                ))}
              </div>
              
              {/* Benefit Type */}
              {selectedScheme.benefit_type && (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">{selectedScheme.benefit_type}</span>
                  {selectedScheme.benefit_amount_text && (
                    <span className="text-green-600">- {selectedScheme.benefit_amount_text}</span>
                  )}
                </div>
              )}
              
              {/* Verification Badge */}
              <div className="flex items-center gap-2">
                <span className="verified-badge verified">
                  ✓ Source Verified
                </span>
                <span className="text-sm text-gray-500">
                  Last checked: {selectedScheme.source_verified_at && new Date(selectedScheme.source_verified_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </span>
              </div>
              
              {/* Description */}
              <div>
                <h3 className="font-semibold text-[#1A1A2E] mb-2">About this scheme</h3>
                <p className="text-gray-600 leading-relaxed">{selectedScheme.description}</p>
              </div>
              
              {/* Short Benefit */}
              {selectedScheme.short_benefit && (
                <div className="p-4 bg-[#1B3A6B]/5 rounded-xl">
                  <h3 className="font-medium text-[#1B3A6B] mb-1">Key Benefit</h3>
                  <p className="text-gray-700">{selectedScheme.short_benefit}</p>
                </div>
              )}
              
              {/* Eligibility */}
              <div>
                <h3 className="font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#0F9D58]" />
                  Who can apply?
                </h3>
                <div className="space-y-2">
                  {selectedScheme.professions && selectedScheme.professions.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Professions: {selectedScheme.professions.join(', ')}</span>
                    </div>
                  )}
                  {selectedScheme.category_eligible && selectedScheme.category_eligible.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Categories: {selectedScheme.category_eligible.join(', ')}</span>
                    </div>
                  )}
                  {selectedScheme.applicable_states && selectedScheme.applicable_states.map((state: string) => (
                    <div key={state} className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{state}</span>
                    </div>
                  ))}
                  {selectedScheme.income_limit && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">₹</span>
                      <span className="text-gray-600">Income limit: ₹{selectedScheme.income_limit.toLocaleString('en-IN')}/year</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Required Documents */}
              {selectedScheme.required_documents && selectedScheme.required_documents.length > 0 && (
                <div>
                  <h3 className="font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Documents typically needed
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedScheme.required_documents.map((doc: string) => (
                      <span key={doc} className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600">
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Application Mode */}
              {selectedScheme.application_mode && selectedScheme.application_mode.length > 0 && (
                <div>
                  <h3 className="font-semibold text-[#1A1A2E] mb-2">How to apply</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedScheme.application_mode.map((mode: string) => (
                      <span key={mode} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
                        {mode}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Helpline */}
              {selectedScheme.helpline && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Helpline:</span>
                  <a href={`tel:${selectedScheme.helpline}`} className="text-[#1B3A6B] hover:underline">
                    {selectedScheme.helpline}
                  </a>
                </div>
              )}
              
              {/* CTA */}
              <div className="space-y-3 pt-4">
                {selectedScheme.official_url && (
                  <a
                    href={selectedScheme.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-[#1B3A6B] text-white rounded-xl font-medium flex items-center justify-center gap-2"
                  >
                    Apply on Official Website
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <Link
                  to="/applications"
                  className="w-full py-4 bg-green-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Track This Application
                </Link>
                <p className="text-xs text-gray-400 text-center">
                  You will be redirected to the official government portal
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
