import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '../lib/Router';
import { db } from '@doable/data';
import { useApp } from '../lib/AppContext';
import { translations } from '../lib/i18n';
import { ArrowLeft, ExternalLink, CheckCircle, FileText, MapPin, Users, Briefcase, Calendar, Phone, Loader2, Shield, Heart, Home, GraduationCap } from 'lucide-react';

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
  apply_url?: string;
  helpline?: string;
  department?: string;
  ministry?: string;
  source_verified_at?: string;
  is_active?: boolean;
  created_at?: string;
  tags?: string[];
}

const CATEGORY_ICONS: Record<string, typeof Shield> = {
  student: GraduationCap,
  farmer: Home,
  women: Heart,
  housing: Home,
  health: Heart,
  business: Briefcase,
  employment: Briefcase,
  elderly: Users,
  general: Shield,
};

export function SchemeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { simpleMode, language } = useApp();
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = translations[language];

  useEffect(() => {
    if (!id) {
      setError('No scheme ID provided');
      setLoading(false);
      return;
    }
    loadScheme();
  }, [id]);

  async function loadScheme() {
    setLoading(true);
    setError(null);
    try {
      const r = await db.query<Scheme>(
        'SELECT * FROM schemes WHERE id = $1 AND is_active IS NOT FALSE',
        [id]
      );
      if (r.ok && r.rows && r.rows.length > 0) {
        setScheme(r.rows[0] as Scheme);
      } else {
        setError('Scheme not found');
      }
    } catch (err) {
      console.error('Failed to load scheme:', err);
      setError('Failed to load scheme details');
    } finally {
      setLoading(false);
    }
  }

  function isValidUrl(string: string): boolean {
    if (!string) return false;
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function handleApply() {
    // Prefer apply_url; fall back to official_url
    const rawUrl = scheme?.apply_url || scheme?.official_url;

    if (!rawUrl) {
      alert('No official application link available for this scheme. Please visit the official government portal.');
      return;
    }

    // Ensure the URL has a valid protocol
    let url = rawUrl;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Final validation: reject malformed URLs (e.g., containing spaces or unencoded chars)
    if (!isValidUrl(url)) {
      alert('The application link for this scheme appears to be invalid. Please visit the official government portal directly.');
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function getCategoryIcon(category: string) {
    const Icon = CATEGORY_ICONS[category.toLowerCase()] || Shield;
    return <Icon className="w-5 h-5" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1B3A6B] animate-spin" />
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="bg-[#1B3A6B] px-5 pt-10 pb-6">
          <button
            onClick={() => navigate('/schemes')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Schemes
          </button>
          <h1 className="text-xl font-bold text-white">Scheme Not Found</h1>
        </div>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 mb-4">{error || 'This scheme could not be found.'}</p>
          <button
            onClick={() => navigate('/schemes')}
            className="px-6 py-3 bg-[#1B3A6B] text-white rounded-xl font-medium"
          >
            Browse All Schemes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-5 pt-10 pb-6">
        <button
          onClick={() => navigate('/schemes')}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            {getCategoryIcon(scheme.category)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded-full">
                {scheme.category}
              </span>
              {scheme.benefit_type && (
                <span className="px-2 py-0.5 bg-green-500/80 text-white text-xs rounded-full">
                  {scheme.benefit_type}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-white leading-tight">{scheme.title}</h1>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-3">
          {scheme.department && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <Briefcase className="w-3 h-3" />
                Department
              </div>
              <p className="font-medium text-[#1A1A2E] text-sm">{scheme.department}</p>
            </div>
          )}
          {scheme.ministry && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <Shield className="w-3 h-3" />
                Ministry
              </div>
              <p className="font-medium text-[#1A1A2E] text-sm">{scheme.ministry}</p>
            </div>
          )}
          {scheme.coverage && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <MapPin className="w-3 h-3" />
                Coverage
              </div>
              <p className="font-medium text-[#1A1A2E] text-sm">{scheme.coverage}</p>
            </div>
          )}
          {scheme.benefit_amount_text && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <CheckCircle className="w-3 h-3" />
                Benefit
              </div>
              <p className="font-medium text-green-600 text-sm">{scheme.benefit_amount_text}</p>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-[#1A1A2E] mb-3">About This Scheme</h2>
          <p className="text-gray-600 leading-relaxed">{scheme.description}</p>
          {scheme.short_benefit && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-green-700 font-medium text-sm">
                ✓ {scheme.short_benefit}
              </p>
            </div>
          )}
        </div>

        {/* Eligibility */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-[#1A1A2E] mb-3">Eligibility Criteria</h2>
          <div className="space-y-3">
            {scheme.category_eligible && scheme.category_eligible.length > 0 && (
              <div className="flex items-start gap-2">
                <Users className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-500 text-sm">Categories: </span>
                  <span className="text-gray-700 text-sm">{scheme.category_eligible.join(', ')}</span>
                </div>
              </div>
            )}
            {scheme.professions && scheme.professions.length > 0 && (
              <div className="flex items-start gap-2">
                <Briefcase className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-500 text-sm">Professions: </span>
                  <span className="text-gray-700 text-sm">{scheme.professions.join(', ')}</span>
                </div>
              </div>
            )}
            {scheme.student_levels && scheme.student_levels.length > 0 && (
              <div className="flex items-start gap-2">
                <GraduationCap className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-500 text-sm">Student Levels: </span>
                  <span className="text-gray-700 text-sm">{scheme.student_levels.join(', ')}</span>
                </div>
              </div>
            )}
            {scheme.income_limit && (
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-500 text-sm">Income Limit: </span>
                  <span className="text-gray-700 text-sm">₹{scheme.income_limit.toLocaleString()}/year</span>
                </div>
              </div>
            )}
            {scheme.min_age !== undefined && scheme.max_age !== undefined && (
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-500 text-sm">Age: </span>
                  <span className="text-gray-700 text-sm">{scheme.min_age} - {scheme.max_age} years</span>
                </div>
              </div>
            )}
            {scheme.domicile_required !== undefined && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-500 text-sm">Domicile: </span>
                  <span className="text-gray-700 text-sm">
                    {scheme.domicile_required ? 'State domicile required' : 'No domicile restriction'}
                  </span>
                </div>
              </div>
            )}
            {scheme.applicable_states && scheme.applicable_states.length > 0 && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-500 text-sm">States: </span>
                  <span className="text-gray-700 text-sm">{scheme.applicable_states.join(', ')}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Required Documents */}
        {scheme.required_documents && scheme.required_documents.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-[#1A1A2E] mb-3">Required Documents</h2>
            <ul className="space-y-2">
              {scheme.required_documents.map((doc, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">{doc}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Application Mode */}
        {scheme.application_mode && scheme.application_mode.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-[#1A1A2E] mb-3">How to Apply</h2>
            <ul className="space-y-2">
              {scheme.application_mode.map((mode, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm capitalize">{mode.replace(/_/g, ' ')}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Helpline */}
        {scheme.helpline && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h2 className="font-semibold text-[#1A1A2E] mb-3">Helpline</h2>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{scheme.helpline}</span>
            </div>
          </div>
        )}

        {/* Tags */}
        {scheme.tags && scheme.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {scheme.tags.map((tag, idx) => (
              <span key={idx} className="px-3 py-1 bg-[#E8F0FE] text-[#1B3A6B] rounded-full text-xs font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Apply Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
        <button
          onClick={handleApply}
          disabled={!isValidUrl(scheme.apply_url || scheme.official_url || '')}
          className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition ${
            isValidUrl(scheme.apply_url || scheme.official_url || '')
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          <ExternalLink className="w-5 h-5" />
          {isValidUrl(scheme.apply_url || scheme.official_url || '') ? 'Apply on Official Website' : 'No Application Link Available'}
        </button>
        {!isValidUrl(scheme.apply_url || scheme.official_url || '') && (
          <p className="text-xs text-gray-400 text-center mt-2">
            Official application link is currently unavailable
          </p>
        )}
      </div>
    </div>
  );
}
