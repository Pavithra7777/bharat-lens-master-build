import { useState, useEffect, useMemo } from 'react';
import { db } from '@doable/data';
import { ai, type ChatMessage } from '@doable/ai';
import { useApp } from '../lib/AppContext';
import { Link } from '../lib/Router';
import { Search, Filter, ChevronRight, ExternalLink, CheckCircle, MapPin, Users, Briefcase, GraduationCap, Heart, Home, Sparkles, Loader2, Plus, X, SlidersHorizontal, Shield, FileText, Clock, Brain, Phone } from 'lucide-react';

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

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Sparkles },
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
      if (r.ok) {
        setSchemes(r.rows);
      }
    } catch (error) {
      console.error('Failed to load schemes:', error);
    } finally {
      setLoading(false);
    }
  }

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
        const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
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
      setAddingScheme(null);
    } catch (error) {
      console.error('Failed to add scheme:', error);
      setAddingScheme(null);
    }
  }

  function matchesCategorySingle(scheme: Scheme, categoryId: string): boolean {
    if (categoryId === 'all') return true;
    
    const categoryMap: Record<string, string[]> = {
      student: ['student', 'education', 'scholarship'],
      farmer: ['farmer', 'agriculture'],
      women: ['women', 'mother', 'child'],
      housing: ['housing', 'home', 'shelter'],
      health: ['health', 'medical', 'insurance'],
      business: ['business', 'entrepreneur', 'mudra', 'startup'],
      employment: ['employment', 'job', 'skill'],
      elderly: ['elderly', 'senior', 'pension'],
    };
    
    const keywords = categoryMap[categoryId] || [categoryId];
    const searchText = `${scheme.category} ${scheme.title} ${scheme.description}`.toLowerCase();
    return keywords.some(k => searchText.includes(k));
  }

  const filteredByTab = useMemo(() => {
    if (tab === 'for-you' && profile) {
      const profileKeywords: string[] = [];
      if (profile.occupation_category) profileKeywords.push(profile.occupation_category.toLowerCase());
      if (profile.state) profileKeywords.push(profile.state.toLowerCase());
      if (profile.category_eligible) profileKeywords.push(...profile.category_eligible.map(c => c.toLowerCase()));
      
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

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: displayedSchemes.length };
    CATEGORIES.forEach(cat => {
      if (cat.id !== 'all') {
        counts[cat.id] = schemes.filter(s => matchesCategorySingle(s, cat.id)).length;
      }
    });
    return counts;
  }, [schemes, displayedSchemes]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Schemes</h1>
            <p className="text-white/70 text-sm">Government benefits for you</p>
          </div>
          <button
            onClick={() => setShowAiPanel(true)}
            className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition"
          >
            <Sparkles className="w-6 h-6 text-white" />
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search schemes..."
            className="w-full pl-12 pr-4 py-3 bg-white rounded-xl outline-none"
          />
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="px-6 py-3 bg-white border-b border-gray-100">
        <div className="flex gap-2">
          <button
            onClick={() => setTab('for-you')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === 'for-you' 
                ? 'bg-[#1B3A6B] text-white' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            For You
          </button>
          <button
            onClick={() => setTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === 'all' 
                ? 'bg-[#1B3A6B] text-white' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            All Schemes
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="px-6 py-3 bg-white border-b border-gray-100 overflow-x-auto">
        <div className="flex gap-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count = categoryCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  if (cat.id === 'all') {
                    setSelectedCategories(['all']);
                  } else {
                    const newCats = selectedCategories.filter(c => c !== 'all');
                    if (newCats.includes(cat.id)) {
                      setSelectedCategories(newCats.filter(c => c !== cat.id));
                      if (newCats.filter(c => c !== cat.id).length === 0) {
                        setSelectedCategories(['all']);
                      }
                    } else {
                      setSelectedCategories([...newCats, cat.id]);
                    }
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
                  selectedCategories.includes(cat.id)
                    ? 'bg-[#1B3A6B] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
                <span className={`text-xs ${selectedCategories.includes(cat.id) ? 'text-white/70' : 'text-gray-400'}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

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
              {scheme.benefit_amount_text && (
                <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
                  <CheckCircle className="w-4 h-4" />
                  {scheme.benefit_amount_text}
                </div>
              )}
            </button>
          ))
        )}
      </div>

      {/* AI Search FAB */}
      <button
        onClick={() => setShowAiPanel(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center z-40 hover:scale-105 transition"
      >
        <Sparkles className="w-6 h-6 text-white" />
      </button>

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
              
              {/* AI Searching Animation - Shows while AI is thinking */}
              {aiSearching && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 text-center border border-purple-100">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <Brain className="w-10 h-10 text-white" />
                    </div>
                    {/* Animated dots */}
                    <div className="flex items-center justify-center gap-1 mb-4">
                      <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-[#1A1A2E] mb-2">Finding the best schemes for you...</h3>
                  <p className="text-sm text-gray-500 mb-4">Our AI is searching through government databases</p>
                  <div className="flex items-center justify-center gap-2 text-sm text-purple-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Please wait...</span>
                  </div>
                </div>
              )}
              
              {/* Quick Examples - Only show when not searching and no results */}
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
                          <p className="text-xs font-medium text-gray-500 mb-1">Eligibility:</p>
                          <div className="flex flex-wrap gap-1">
                            {result.eligibility.slice(0, 3).map((el, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                {el}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {result.documents.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-gray-500 mb-1">Documents needed:</p>
                          <div className="flex flex-wrap gap-1">
                            {result.documents.slice(0, 2).map((doc, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                {doc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {result.url && (
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-[#1B3A6B] hover:underline"
                        >
                          Visit Official Website
                          <ExternalLink className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setSelectedScheme(null)}>
          <div 
            className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1A1A2E]">Scheme Details</h2>
              <button
                onClick={() => setSelectedScheme(null)}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedScheme.tags?.map((tag) => (
                    <span key={tag} className="text-sm px-3 py-1 bg-[#1B3A6B]/10 text-[#1B3A6B] rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">{selectedScheme.title}</h1>
                <p className="text-gray-600">{selectedScheme.description}</p>
              </div>
              
              {selectedScheme.short_benefit && (
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-green-800">Key Benefit</p>
                  <p className="text-green-700">{selectedScheme.short_benefit}</p>
                </div>
              )}
              
              {selectedScheme.benefit_amount_text && (
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-purple-800">Benefit Amount</p>
                  <p className="text-purple-700">{selectedScheme.benefit_amount_text}</p>
                </div>
              )}
              
              <div>
                <h3 className="font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#1B3A6B]" />
                  Eligibility Criteria
                </h3>
                <div className="space-y-2">
                  {selectedScheme.category_eligible && selectedScheme.category_eligible.length > 0 && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Categories: {selectedScheme.category_eligible.join(', ')}</span>
                    </div>
                  )}
                  {selectedScheme.professions && selectedScheme.professions.length > 0 && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Professions: {selectedScheme.professions.join(', ')}</span>
                    </div>
                  )}
                  {selectedScheme.applicable_states && selectedScheme.applicable_states.length > 0 && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-500" />
                      <span>States: {selectedScheme.applicable_states.join(', ')}</span>
                    </div>
                  )}
                  {selectedScheme.income_limit && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Income Limit: ₹{selectedScheme.income_limit.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedScheme.required_documents && selectedScheme.required_documents.length > 0 && (
                <div>
                  <h3 className="font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#1B3A6B]" />
                    Required Documents
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedScheme.required_documents.map((doc, i) => (
                      <span key={i} className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm">
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedScheme.application_mode && selectedScheme.application_mode.length > 0 && (
                <div>
                  <h3 className="font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#1B3A6B]" />
                    Application Mode
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedScheme.application_mode.map((mode, i) => (
                      <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">
                        {mode}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex flex-col gap-3">
                {selectedScheme.official_url && (
                  <a
                    href={selectedScheme.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] text-white rounded-xl font-medium flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Apply on Official Website
                  </a>
                )}
                {selectedScheme.helpline && (
                  <a
                    href={`tel:${selectedScheme.helpline}`}
                    className="w-full py-3 bg-gray-100 text-[#1A1A2E] rounded-xl font-medium flex items-center justify-center gap-2"
                  >
                    <Phone className="w-5 h-5" />
                    Helpline: {selectedScheme.helpline}
                  </a>
                )}
              </div>
              
              {selectedScheme.department && (
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Department:</span> {selectedScheme.department}
                  {selectedScheme.ministry && ` • ${selectedScheme.ministry}`}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
