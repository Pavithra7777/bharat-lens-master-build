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
      setAiResults(prev => prev.filter(r => r.title !== scheme.title));
    } catch (error) {
      console.error('Failed to add scheme:', error);
    } finally {
      setAddingScheme(null);
    }
  }

  function matchesCategorySingle(scheme: Scheme, categoryId: string): boolean {
    if (categoryId === 'all') return true;
    
    // Map UI category IDs to actual database category values
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
    // Only match against the category field, not title/description
    const schemeCategory = scheme.category?.toLowerCase() || '';
    return keywords.some(k => schemeCategory === k || schemeCategory.includes(k));
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
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-[#1B3A6B]/10 text-[#1B3A6B] text-xs rounded-full capitalize">
                      {scheme.category}
                    </span>
                    {scheme.benefit_amount_text && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        {scheme.benefit_amount_text}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{scheme.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{scheme.description}</p>
                  {scheme.required_documents && scheme.required_documents.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      Docs: {scheme.required_documents.slice(0, 3).join(', ')}
                      {scheme.required_documents.length > 3 && ` +${scheme.required_documents.length - 3} more`}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 ml-2" />
              </div>
            </button>
          ))
        )}
      </div>

      {/* AI Search Panel */}
      {showAiPanel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">AI Scheme Finder</h2>
                <button
                  onClick={() => setShowAiPanel(false)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="relative">
                <Brain className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1B3A6B]" />
                <input
                  type="text"
                  value={aiSearchQuery}
                  onChange={(e) => setAiSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchSchemesWithAI(aiSearchQuery)}
                  placeholder="Describe what you're looking for..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[#1B3A6B]/20"
                />
              </div>
              <button
                onClick={() => searchSchemesWithAI(aiSearchQuery)}
                disabled={aiSearching || !aiSearchQuery.trim()}
                className="w-full mt-3 py-3 bg-[#1B3A6B] text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {aiSearching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Finding schemes...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Find Schemes with AI
                  </>
                )}
              </button>
            </div>

            {aiSearching && (
              <div className="px-6 py-8 text-center">
                <div className="w-12 h-12 bg-[#1B3A6B]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-6 h-6 text-[#1B3A6B] animate-spin" />
                </div>
                <p className="text-gray-500">Searching official government sources...</p>
              </div>
            )}

            {aiResults.length > 0 && (
              <div className="px-6 py-4 space-y-4">
                <p className="text-sm text-gray-500">{aiResults.length} schemes found</p>
                {aiResults.map((result, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-[#1B3A6B]/10 text-[#1B3A6B] text-xs rounded-full capitalize">
                        {result.category}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{result.title}</h3>
                    <p className="text-sm text-gray-500 mb-3">{result.description}</p>
                    <div className="text-xs text-gray-400 mb-3">
                      <p className="font-medium text-gray-500 mb-1">Eligibility:</p>
                      <ul className="list-disc list-inside">
                        {result.eligibility.slice(0, 3).map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex gap-2">
                      {result.url && (
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 bg-[#1B3A6B] text-white text-center rounded-lg text-sm flex items-center justify-center gap-1"
                        >
                          Website
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <button
                        onClick={() => addSchemeToDatabase(result)}
                        disabled={addingScheme === result.title}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        {addingScheme === result.title ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Add
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!aiSearching && aiResults.length === 0 && aiSearchQuery && (
              <div className="px-6 py-8 text-center">
                <p className="text-gray-500">Click search to find relevant schemes</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scheme Detail Modal */}
      {selectedScheme && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedScheme(null)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex gap-2">
                  {selectedScheme.official_url && (
                    <a
                      href={selectedScheme.official_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-[#1B3A6B] rounded-full flex items-center justify-center"
                    >
                      <ExternalLink className="w-5 h-5 text-white" />
                    </a>
                  )}
                  <button className="w-10 h-10 bg-[#1B3A6B] rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-6 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-[#1B3A6B]/10 text-[#1B3A6B] text-sm rounded-full capitalize">
                    {selectedScheme.category}
                  </span>
                  {selectedScheme.coverage && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                      {selectedScheme.coverage}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedScheme.title}</h2>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-700">{selectedScheme.description}</p>
              </div>

              {selectedScheme.short_benefit && (
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-green-800 font-medium">💰 {selectedScheme.short_benefit}</p>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Benefits</h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedScheme.benefit_type && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Type</p>
                      <p className="text-sm font-medium capitalize">{selectedScheme.benefit_type}</p>
                    </div>
                  )}
                  {selectedScheme.benefit_amount_text && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Amount</p>
                      <p className="text-sm font-medium">{selectedScheme.benefit_amount_text}</p>
                    </div>
                  )}
                  {selectedScheme.benefit_amount_min && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Min Amount</p>
                      <p className="text-sm font-medium">₹{selectedScheme.benefit_amount_min.toLocaleString()}</p>
                    </div>
                  )}
                  {selectedScheme.benefit_amount_max && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Max Amount</p>
                      <p className="text-sm font-medium">₹{selectedScheme.benefit_amount_max.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Eligibility</h3>
                <div className="space-y-2">
                  {selectedScheme.gender && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">Gender: <span className="font-medium capitalize">{selectedScheme.gender}</span></span>
                    </div>
                  )}
                  {selectedScheme.min_age !== undefined && selectedScheme.max_age !== undefined && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">Age: <span className="font-medium">{selectedScheme.min_age} - {selectedScheme.max_age} years</span></span>
                    </div>
                  )}
                  {selectedScheme.income_limit && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">Income Limit: <span className="font-medium">₹{selectedScheme.income_limit.toLocaleString()}/year</span></span>
                    </div>
                  )}
                  {selectedScheme.category_eligible && selectedScheme.category_eligible.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">Categories: <span className="font-medium capitalize">{selectedScheme.category_eligible.join(', ')}</span></span>
                    </div>
                  )}
                  {selectedScheme.professions && selectedScheme.professions.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">Professions: <span className="font-medium capitalize">{selectedScheme.professions.join(', ')}</span></span>
                    </div>
                  )}
                  {selectedScheme.employment_status && selectedScheme.employment_status.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">Employment: <span className="font-medium capitalize">{selectedScheme.employment_status.join(', ')}</span></span>
                    </div>
                  )}
                  {selectedScheme.domicile_required && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">Domicile certificate required</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedScheme.applicable_states && selectedScheme.applicable_states.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Applicable States</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedScheme.applicable_states.map((state, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                        {state}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedScheme.required_documents && selectedScheme.required_documents.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Required Documents</h3>
                  <ul className="space-y-2">
                    {selectedScheme.required_documents.map((doc, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-sm">{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedScheme.application_mode && selectedScheme.application_mode.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">How to Apply</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedScheme.application_mode.map((mode, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full capitalize">
                        {mode}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(selectedScheme.department || selectedScheme.ministry) && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Scheme Details</h3>
                  <div className="space-y-2">
                    {selectedScheme.department && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">Department: <span className="font-medium">{selectedScheme.department}</span></span>
                      </div>
                    )}
                    {selectedScheme.ministry && (
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">Ministry: <span className="font-medium">{selectedScheme.ministry}</span></span>
                      </div>
                    )}
                    {selectedScheme.helpline && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">Helpline: <span className="font-medium">{selectedScheme.helpline}</span></span>
                      </div>
                    )}
                    {selectedScheme.source_verified_at && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">Verified: <span className="font-medium">{new Date(selectedScheme.source_verified_at).toLocaleDateString()}</span></span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedScheme.official_url && (
                <a
                  href={selectedScheme.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-4 bg-[#1B3A6B] text-white text-center rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  Apply Now
                  <ExternalLink className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}