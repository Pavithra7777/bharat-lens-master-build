import { useState, useEffect } from 'react';
import { db } from '@doable/data';
import { ai, type ChatMessage } from '@doable/ai';
import { useApp } from '../lib/AppContext';
import { Link } from '../lib/Router';
import { Search, Filter, ChevronRight, ExternalLink, CheckCircle, MapPin, Users, Briefcase, GraduationCap, Heart, Home, Sparkles, Loader2, Plus, X } from 'lucide-react';

interface Scheme {
  id: string;
  title: string;
  description: string;
  eligibility_criteria: any;
  required_documents: string[];
  applicable_states: string[];
  official_url: string;
  department: string;
  source_verified_at: string;
}

interface AISchemeSearchResult {
  title: string;
  description: string;
  eligibility: string[];
  documents: string[];
  url: string;
  department: string;
}

const CATEGORIES = [
  { id: 'all', icon: '🗂️', label: 'All' },
  { id: 'farmer', icon: '🌾', label: 'Farmers' },
  { id: 'student', icon: '🎓', label: 'Students' },
  { id: 'women', icon: '👩', label: 'Women' },
  { id: 'housing', icon: '🏠', label: 'Housing' },
  { id: 'health', icon: '🏥', label: 'Health' },
  { id: 'business', icon: '💼', label: 'Business' },
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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [tab, setTab] = useState<'for-you' | 'all'>('for-you');
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
  "department": "Department name"
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
      
      // Parse the JSON response
      try {
        // Try to extract JSON from the response
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed)) {
            setAiResults(parsed);
          }
        } else {
          // Try parsing the whole response
          const parsed = JSON.parse(responseText);
          if (Array.isArray(parsed)) {
            setAiResults(parsed);
          }
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        // Try to find schemes mentioned in the text even if JSON parsing failed
        const schemePatterns = responseText.split(/\n\d+\.\s+/).slice(1);
        if (schemePatterns.length > 0) {
          const extractedSchemes: AISchemeSearchResult[] = schemePatterns.map((pattern, idx) => ({
            title: `Scheme ${idx + 1}`,
            description: pattern.substring(0, 200),
            eligibility: [],
            documents: [],
            url: '',
            department: ''
          }));
          setAiResults(extractedSchemes);
        }
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
      // Determine eligibility criteria based on eligibility text
      const eligibilityCriteria: any = {};
      if (scheme.eligibility.some(e => e.toLowerCase().includes('farmer'))) {
        eligibilityCriteria.occupation = ['farmer'];
      } else if (scheme.eligibility.some(e => e.toLowerCase().includes('student'))) {
        eligibilityCriteria.occupation = ['student'];
      } else if (scheme.eligibility.some(e => e.toLowerCase().includes('entrepreneur') || e.toLowerCase().includes('business'))) {
        eligibilityCriteria.occupation = ['entrepreneur'];
      }
      if (scheme.eligibility.some(e => e.toLowerCase().includes('women'))) {
        eligibilityCriteria.category = ['women'];
      }
      if (scheme.eligibility.some(e => e.toLowerCase().includes('income'))) {
        eligibilityCriteria.income_limit = 300000; // Default
      }

      await db.query(
        `INSERT INTO schemes (title, description, eligibility_criteria, required_documents, applicable_states, official_url, department, source_verified_at, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, true)`,
        [
          scheme.title,
          scheme.description,
          JSON.stringify(eligibilityCriteria),
          scheme.documents,
          ['All India'],
          scheme.url,
          scheme.department
        ]
      );
      
      // Reload schemes
      await loadSchemes();
      
      // Remove from AI results
      setAiResults(prev => prev.filter(s => s.title !== scheme.title));
    } catch (error) {
      console.error('Failed to add scheme:', error);
    } finally {
      setAddingScheme(null);
    }
  }

  function matchesCategory(scheme: Scheme): boolean {
    if (selectedCategory === 'all') return true;
    
    const criteria = scheme.eligibility_criteria || {};
    const occ = criteria.occupation || [];
    
    switch (selectedCategory) {
      case 'farmer': return occ.includes('farmer');
      case 'student': return occ.includes('student');
      case 'women': return criteria.category?.includes('women');
      case 'business': return occ.includes('entrepreneur');
      default: return true;
    }
  }

  function matchesSearch(scheme: Scheme): boolean {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      scheme.title.toLowerCase().includes(query) ||
      scheme.description?.toLowerCase().includes(query) ||
      scheme.department?.toLowerCase().includes(query)
    );
  }

  function matchesProfile(scheme: Scheme): boolean {
    if (!profile) return true;
    
    const criteria = scheme.eligibility_criteria || {};
    
    if (criteria.occupation && profile.occupation_category) {
      const occ = Array.isArray(criteria.occupation) ? criteria.occupation : [criteria.occupation];
      if (!occ.includes(profile.occupation_category)) return false;
    }
    
    if (criteria.category && profile.occupation_category) {
      const cats = Array.isArray(criteria.category) ? criteria.category : [criteria.category];
    }
    
    return true;
  }

  const filteredSchemes = schemes.filter(s => 
    matchesCategory(s) && matchesSearch(s)
  );

  const forYouSchemes = filteredSchemes.filter(matchesProfile);

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Government Schemes</h1>
            <p className="text-white/70 text-sm mt-1">Verified schemes from official sources</p>
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
            className="w-full pl-12 pr-4 py-3 bg-white rounded-xl outline-none"
          />
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

      {/* Categories */}
      <div className="px-6 py-4 overflow-x-auto">
        <div className="flex gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-[#1B3A6B] text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-2">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-xl skeleton" />
            ))}
          </div>
        ) : (tab === 'for-you' ? forYouSchemes : filteredSchemes).length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No schemes found matching your criteria</p>
            <button
              onClick={() => setShowAiPanel(true)}
              className="mt-4 px-4 py-2 bg-[#1B3A6B] text-white rounded-lg text-sm font-medium"
            >
              Try AI Search
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {(tab === 'for-you' ? forYouSchemes : filteredSchemes).map((scheme) => (
              <button
                key={scheme.id}
                onClick={() => setSelectedScheme(scheme)}
                className="w-full bg-white rounded-xl p-4 border border-gray-100 text-left hover:border-[#1B3A6B]/30 transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="verified-badge verified">
                        ✓ Verified
                      </span>
                      <span className="text-xs text-gray-400">
                        {scheme.source_verified_at && new Date(scheme.source_verified_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </span>
                    </div>
                    <h3 className="font-semibold text-[#1A1A2E]">{scheme.title}</h3>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{scheme.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="px-2 py-1 bg-gray-100 rounded">{scheme.department}</span>
                  {scheme.applicable_states?.includes('All India') && (
                    <span className="px-2 py-1 bg-green-50 text-green-600 rounded">All India</span>
                  )}
                </div>
              </button>
            ))}
          </div>
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
                        {result.url && (
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#1B3A6B] flex items-center gap-1 hover:underline"
                          >
                            Visit <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
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
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
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
              
              {/* Eligibility */}
              <div>
                <h3 className="font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#0F9D58]" />
                  Who can apply?
                </h3>
                <div className="space-y-2">
                  {selectedScheme.eligibility_criteria?.occupation?.map((occ: string) => (
                    <div key={occ} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#0F9D58] rounded-full" />
                      <span className="text-gray-600 capitalize">{occ.replace('_', ' ')}</span>
                    </div>
                  ))}
                  {selectedScheme.applicable_states?.map((state: string) => (
                    <div key={state} className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{state}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Required Documents */}
              {selectedScheme.required_documents?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-[#1A1A2E] mb-3">Documents typically needed</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedScheme.required_documents.map((doc: string) => (
                      <span key={doc} className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600">
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* CTA */}
              <div className="space-y-3 pt-4">
                <a
                  href={selectedScheme.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-[#1B3A6B] text-white rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  Open Official Website
                  <ExternalLink className="w-4 h-4" />
                </a>
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
