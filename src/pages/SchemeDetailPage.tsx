import { useState, useEffect } from 'react';
import { db } from '@doable/data';
import { Link } from '../lib/Router';
import { ArrowLeft, ExternalLink, CheckCircle, FileText, MapPin, Briefcase, Users, Calendar, Phone, Globe, Heart, Shield, Loader2, Sparkles, AlertCircle } from 'lucide-react';

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

interface SchemeDetailPageProps {
  schemeId: string;
}

export function SchemeDetailPage({ schemeId }: SchemeDetailPageProps) {
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schemeId || schemeId.trim() === '') {
      setError('Invalid scheme ID');
      setLoading(false);
      return;
    }
    loadScheme();
    window.scrollTo(0, 0);
  }, [schemeId]);

  async function loadScheme() {
    setLoading(true);
    setError(null);
    
    if (!schemeId || schemeId.trim() === '') {
      setError('Invalid scheme ID');
      setLoading(false);
      return;
    }
    
    try {
      // Try UUID comparison first
      let r = await db.query<Scheme>(
        'SELECT * FROM schemes WHERE id = $1',
        [schemeId]
      );
      
      // If no results, try text comparison (handles edge cases)
      if (r.ok && r.rows && r.rows.length === 0) {
        r = await db.query<Scheme>(
          "SELECT * FROM schemes WHERE id::text = $1",
          [schemeId]
        );
      }
      
      // If still no results, try ILIKE (for case-insensitive matching)
      if (r.ok && r.rows && r.rows.length === 0) {
        r = await db.query<Scheme>(
          "SELECT * FROM schemes WHERE LOWER(id::text) = LOWER($1)",
          [schemeId]
        );
      }
      
      if (!r.ok) {
        console.error('Database query failed:', r.error);
        setError('Failed to load scheme. Please try again.');
        setLoading(false);
        return;
      }
      
      if (r.rows && r.rows.length > 0) {
        setScheme(r.rows[0] as Scheme);
      } else {
        setError('Scheme not found. It may have been removed or the link is invalid.');
      }
    } catch (err: any) {
      console.error('Exception loading scheme:', err);
      setError('Failed to load scheme details. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (scheme?.official_url) {
      window.open(scheme.official_url, '_blank', 'noopener,noreferrer');
    } else {
      const searchQuery = `${scheme?.title || 'government scheme'} India official website apply online`;
      window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank', 'noopener,noreferrer');
    }
  }

  function getGoogleSearchUrl() {
    const query = `${scheme?.title || ''} India government scheme official website apply`;
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#1B3A6B] mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading scheme details...</p>
        </div>
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <div className="min-h-screen bg-[#FAFBFC]">
        <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-4 pt-12 pb-4">
          <Link to="/schemes" className="flex items-center gap-2 text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-5 h-5" />
            Back to Schemes
          </Link>
          <h1 className="text-xl font-bold text-white">Scheme Not Found</h1>
        </div>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 mb-4">{error || 'This scheme could not be found.'}</p>
          <Link to="/schemes" className="inline-block px-6 py-3 bg-[#1B3A6B] text-white rounded-xl font-medium">
            Browse All Schemes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-4 pt-12 pb-6">
        <Link to="/schemes" className="flex items-center gap-2 text-white/80 hover:text-white mb-4">
          <ArrowLeft className="w-5 h-5" />
          Back to Schemes
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-medium">
                {scheme.category}
              </span>
              {scheme.benefit_type && (
                <span className="px-3 py-1 bg-green-500/30 text-green-200 rounded-full text-xs font-medium">
                  {scheme.benefit_type}
                </span>
              )}
              {scheme.is_active !== false && (
                <span className="px-3 py-1 bg-blue-500/30 text-blue-200 rounded-full text-xs font-medium">
                  Active
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-white leading-tight">{scheme.title}</h1>
          </div>
        </div>
      </div>

      {/* Apply Now Button - Sticky */}
      <div className="px-4 -mt-4 relative z-10">
        <button
          onClick={handleApply}
          className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-lg shadow-lg flex items-center justify-center gap-3 transition"
        >
          <ExternalLink className="w-5 h-5" />
          {scheme.official_url ? 'Apply Now on Official Website' : 'Search to Apply'}
        </button>
        {scheme.official_url ? (
          <p className="text-center text-xs text-gray-500 mt-2 truncate">
            Opens: {scheme.official_url}
          </p>
        ) : (
          <p className="text-center text-xs text-gray-500 mt-2">
            Official link not available, will search for you
          </p>
        )}
      </div>

      {/* Quick Benefits */}
      {scheme.short_benefit && (
        <div className="px-4 mt-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h3 className="font-semibold text-green-800 flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" />
              Key Benefit
            </h3>
            <p className="text-green-700 font-medium">{scheme.short_benefit}</p>
          </div>
        </div>
      )}

      {/* Amount Details */}
      {(scheme.benefit_amount_min || scheme.benefit_amount_max || scheme.benefit_amount_text) && (
        <div className="px-4 mt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Financial Assistance</h3>
            {scheme.benefit_amount_text && (
              <p className="text-blue-700 font-medium">{scheme.benefit_amount_text}</p>
            )}
            {scheme.benefit_amount_min && scheme.benefit_amount_max && (
              <p className="text-blue-700">
                ₹{scheme.benefit_amount_min.toLocaleString()} - ₹{scheme.benefit_amount_max.toLocaleString()}
              </p>
            )}
            {scheme.benefit_amount_min && !scheme.benefit_amount_max && (
              <p className="text-blue-700">₹{scheme.benefit_amount_min.toLocaleString()}+</p>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="px-4 mt-4">
        <h2 className="text-lg font-bold text-gray-900 mb-2">About This Scheme</h2>
        <p className="text-gray-600 leading-relaxed">{scheme.description}</p>
      </div>

      {/* Eligibility */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Eligibility Criteria
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {scheme.category_eligible && scheme.category_eligible.length > 0 && (
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Category</p>
              <div className="flex flex-wrap gap-2">
                {scheme.category_eligible.map((cat, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}
          {scheme.gender && (
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Gender</p>
              <p className="text-gray-900 font-medium">{scheme.gender}</p>
            </div>
          )}
          {scheme.min_age !== undefined && (
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Age</p>
              <p className="text-gray-900">
                {scheme.min_age} - {scheme.max_age ? `${scheme.max_age} years` : 'and above'}
              </p>
            </div>
          )}
          {scheme.income_limit !== undefined && (
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Income Limit</p>
              <p className="text-gray-900">Up to ₹{scheme.income_limit.toLocaleString()} per annum</p>
            </div>
          )}
          {scheme.domicile_required !== undefined && (
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Domicile Required</p>
              <p className="text-gray-900">{scheme.domicile_required ? 'Yes' : 'No'}</p>
            </div>
          )}
          {scheme.professions && scheme.professions.length > 0 && (
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Professions</p>
              <div className="flex flex-wrap gap-2">
                {scheme.professions.map((prof, i) => (
                  <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {prof}
                  </span>
                ))}
              </div>
            </div>
          )}
          {scheme.student_levels && scheme.student_levels.length > 0 && (
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Student Level</p>
              <div className="flex flex-wrap gap-2">
                {scheme.student_levels.map((level, i) => (
                  <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    {level}
                  </span>
                ))}
              </div>
            </div>
          )}
          {scheme.employment_status && scheme.employment_status.length > 0 && (
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-1">Employment Status</p>
              <div className="flex flex-wrap gap-2">
                {scheme.employment_status.map((status, i) => (
                  <span key={i} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                    {status}
                  </span>
                ))}
              </div>
            </div>
          )}
          {(!scheme.category_eligible && !scheme.gender && scheme.min_age === undefined && 
           scheme.income_limit === undefined && scheme.domicile_required === undefined &&
           (!scheme.professions || scheme.professions.length === 0) &&
           (!scheme.student_levels || scheme.student_levels.length === 0) &&
           (!scheme.employment_status || scheme.employment_status.length === 0)) && (
            <div className="p-4 text-gray-500 text-sm">
              Specific eligibility criteria not available. Please visit the official website for details.
            </div>
          )}
        </div>
      </div>

      {/* Coverage */}
      {scheme.coverage && (
        <div className="px-4 mt-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Coverage
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-gray-700">{scheme.coverage}</p>
            {scheme.applicable_states && scheme.applicable_states.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {scheme.applicable_states.slice(0, 10).map((state, i) => (
                  <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                    {state}
                  </span>
                ))}
                {scheme.applicable_states.length > 10 && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                    +{scheme.applicable_states.length - 10} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Required Documents */}
      {scheme.required_documents && scheme.required_documents.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Required Documents
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <ul className="space-y-3">
              {scheme.required_documents.map((doc, i) => (
                <li key={i} className="flex items-start gap-3">
                  <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{doc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Application Mode */}
      {scheme.application_mode && scheme.application_mode.length > 0 && (
        <div className="px-4 mt-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-600" />
            How to Apply
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex flex-wrap gap-2">
              {scheme.application_mode.map((mode, i) => (
                <span key={i} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium">
                  {mode}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Scheme Info */}
      <div className="px-4 mt-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Scheme Information</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {scheme.department && (
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="text-gray-900 font-medium">{scheme.department}</p>
              </div>
            </div>
          )}
          {scheme.ministry && (
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Ministry</p>
                <p className="text-gray-900 font-medium">{scheme.ministry}</p>
              </div>
            </div>
          )}
          {scheme.helpline && (
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Helpline</p>
                <a href={`tel:${scheme.helpline}`} className="text-blue-600 font-medium hover:underline">
                  {scheme.helpline}
                </a>
              </div>
            </div>
          )}
          {scheme.official_url ? (
            <div className="p-4 flex items-center gap-3">
              <Globe className="w-5 h-5 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500">Official Website</p>
                <a 
                  href={scheme.official_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 font-medium hover:underline truncate block"
                >
                  {scheme.official_url}
                </a>
              </div>
            </div>
          ) : (
            <div className="p-4 flex items-center gap-3">
              <Globe className="w-5 h-5 text-gray-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500">Official Website</p>
                <a 
                  href={getGoogleSearchUrl()}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 font-medium hover:underline"
                >
                  Search for official website →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Apply Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
        <button
          onClick={handleApply}
          className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition"
        >
          <ExternalLink className="w-5 h-5" />
          {scheme.official_url ? 'Apply Now on Official Website' : 'Search to Apply'}
        </button>
      </div>
    </div>
  );
}
