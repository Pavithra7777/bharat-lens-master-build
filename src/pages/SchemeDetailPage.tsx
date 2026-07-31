import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '../lib/Router';
import { db } from '@doable/data';
import { useApp } from '../lib/AppContext';
import { ArrowLeft, ExternalLink, FileText, Loader2, Shield, Heart, Home, GraduationCap, Globe, Banknote, Info, FileCheck, Building, Globe2, Phone } from 'lucide-react';

// Interface matches actual database schema columns
interface Scheme {
  id: string;
  title: string;
  description: string | null;
  short_benefit: string | null;
  category: string;
  gender: string | null;
  min_age: number | null;
  max_age: number | null;
  income_limit: number | null;
  professions: string[] | null;
  domicile_required: boolean | null;
  applicable_states: string[] | null;
  coverage: string | null;
  benefit_type: string | null;
  benefit_amount_min: number | null;
  benefit_amount_max: number | null;
  benefit_amount_text: string | null;
  required_documents: string[] | null;
  application_mode: string[] | null;
  official_url: string | null;
  helpline: string | null;
  department: string | null;
  ministry: string | null;
  is_active: boolean;
  tags: string[] | null;
  apply_url: string | null;
  created_at: string;
}

const CATEGORY_ICONS: Record<string, any> = {
  education: GraduationCap,
  healthcare: Heart,
  housing: Home,
  agriculture: Globe,
  employment: Globe,
  finance: Banknote,
  welfare: Shield,
  infrastructure: Building,
  other: Globe2,
};

export function SchemeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useApp();
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'eligibility' | 'benefits' | 'howtoapply'>('overview');
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    if (id) loadScheme(id);
  }, [id]);

  async function loadScheme(schemeId: string) {
    setLoading(true);
    setError('');
    try {
      const result = await db.query<Scheme>(
        `SELECT * FROM schemes WHERE id = $1 AND is_active = true`,
        [schemeId]
      );
      if (result.ok && result.rows && result.rows.length > 0) {
        setScheme(result.rows[0]);
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

  if (loading) return (
    <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#1B3A6B] animate-spin" />
    </div>
  );

  if (error || !scheme) return (
    <div className="min-h-screen bg-[#FAFBFC] flex flex-col items-center justify-center p-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-[#1A1A2E] mb-2">{error || 'Scheme not found'}</h2>
        <button onClick={() => navigate('/schemes')} className="mt-4 px-6 py-2 bg-[#1B3A6B] text-white rounded-lg">Back to Schemes</button>
      </div>
    </div>
  );

  const IconComponent = CATEGORY_ICONS[scheme.category?.toLowerCase()] || Globe2;
  const benefitAmount = scheme.benefit_amount_text 
    || (scheme.benefit_amount_min && scheme.benefit_amount_max 
      ? `₹${scheme.benefit_amount_min.toLocaleString()} - ₹${scheme.benefit_amount_max.toLocaleString()}`
      : scheme.benefit_amount_min 
        ? `₹${scheme.benefit_amount_min.toLocaleString()}+`
        : scheme.benefit_amount_max 
          ? `Up to ₹${scheme.benefit_amount_max.toLocaleString()}`
          : '—');

  const eligibilityText = buildEligibilityText(scheme);
  const benefitsText = buildBenefitsText(scheme);
  const howToApplyText = buildHowToApplyText(scheme);

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-20">
      {/* Header */}
      <div className="bg-[#1B3A6B] text-white px-4 pt-12 pb-6">
        <button onClick={() => navigate('/schemes')} className="flex items-center gap-2 mb-4 text-white/80 hover:text-white">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <IconComponent className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold leading-tight">{scheme.title}</h1>
            <p className="text-white/70 text-sm mt-1">{scheme.department || scheme.ministry || 'Government Scheme'}</p>
          </div>
        </div>
        {scheme.tags && scheme.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {scheme.tags.slice(0, 4).map((tag, i) => (
              <span key={i} className="px-2 py-1 bg-white/10 text-white/90 text-xs rounded-full">{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-around text-center">
            <div>
              <div className="text-2xl font-bold text-[#1B3A6B]">{benefitAmount}</div>
              <div className="text-xs text-gray-500 mt-1">Benefit</div>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div>
              <div className="text-2xl font-bold text-[#1B3A6B]">{scheme.benefit_type || '—'}</div>
              <div className="text-xs text-gray-500 mt-1">Type</div>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div>
              <div className="text-2xl font-bold text-[#1B3A6B]">{scheme.application_mode?.[0] || 'Online'}</div>
              <div className="text-xs text-gray-500 mt-1">Mode</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['overview', 'eligibility', 'benefits', 'howtoapply'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${activeTab === tab ? 'bg-[#1B3A6B] text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {tab === 'overview' ? 'Overview' : tab === 'eligibility' ? 'Eligibility' : tab === 'benefits' ? 'Benefits' : 'How to Apply'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 mt-4 space-y-4">
        {activeTab === 'overview' && (
          <>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-[#1A1A2E] mb-2">Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{scheme.description || 'No description available.'}</p>
            </div>
            {scheme.short_benefit && (
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h3 className="font-semibold text-[#1A1A2E] mb-2">Key Benefit</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{scheme.short_benefit}</p>
              </div>
            )}
            {scheme.required_documents && scheme.required_documents.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h3 className="font-semibold text-[#1A1A2E] mb-3">Required Documents</h3>
                <div className="space-y-2">
                  {scheme.required_documents.map((doc, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <FileCheck className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-[#1A1A2E] mb-3">Scheme Details</h3>
              <div className="grid grid-cols-2 gap-3">
                {scheme.department && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500">Department</div><div className="text-sm font-medium text-[#1A1A2E]">{scheme.department}</div></div>}
                {scheme.ministry && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500">Ministry</div><div className="text-sm font-medium text-[#1A1A2E]">{scheme.ministry}</div></div>}
                {scheme.helpline && <div className="bg-gray-50 rounded-lg p-3 col-span-2"><div className="text-xs text-gray-500">Helpline</div><div className="text-sm font-medium text-[#1B3A6B]">{scheme.helpline}</div></div>}
                {scheme.coverage && <div className="bg-gray-50 rounded-lg p-3 col-span-2"><div className="text-xs text-gray-500">Coverage</div><div className="text-sm font-medium text-[#1A1A2E]">{scheme.coverage}</div></div>}
              </div>
            </div>
          </>
        )}

        {activeTab === 'eligibility' && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#1A1A2E]">Eligibility Criteria</h3>
              <button onClick={() => setShowFull(!showFull)} className="text-sm text-[#1B3A6B] font-medium">{showFull ? 'Show Less' : 'Show More'}</button>
            </div>
            <p className={`text-sm text-gray-600 leading-relaxed ${!showFull && 'line-clamp-3'}`}>{eligibilityText}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {(scheme.min_age || scheme.max_age) && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500">Age</div><div className="text-sm font-medium text-[#1A1A2E]">{scheme.min_age || 0} - {scheme.max_age || 'Any'} years</div></div>}
              {scheme.income_limit && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500">Income Ceiling</div><div className="text-sm font-medium text-[#1A1A2E]">Up to Rs.{scheme.income_limit.toLocaleString()}</div></div>}
              {scheme.gender && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500">Gender</div><div className="text-sm font-medium text-[#1A1A2E]">{scheme.gender}</div></div>}
              {scheme.category && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500">Category</div><div className="text-sm font-medium text-[#1A1A2E] capitalize">{scheme.category}</div></div>}
              {scheme.domicile_required !== null && <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500">Domicile</div><div className="text-sm font-medium text-[#1A1A2E]">{scheme.domicile_required ? 'Required' : 'Not Required'}</div></div>}
            </div>
            {scheme.professions && scheme.professions.length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-gray-500 mb-2">Eligible Professions</div>
                <div className="flex flex-wrap gap-2">
                  {scheme.professions.map((prof, i) => <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">{prof}</span>)}
                </div>
              </div>
            )}
            {scheme.applicable_states && scheme.applicable_states.length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-gray-500 mb-2">Applicable States</div>
                <div className="flex flex-wrap gap-2">
                  {scheme.applicable_states.map((state, i) => <span key={i} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">{state}</span>)}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'benefits' && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#1A1A2E]">Benefits</h3>
              <button onClick={() => setShowFull(!showFull)} className="text-sm text-[#1B3A6B] font-medium">{showFull ? 'Show Less' : 'Show More'}</button>
            </div>
            <p className={`text-sm text-gray-600 leading-relaxed ${!showFull && 'line-clamp-3'}`}>{benefitsText}</p>
            {(scheme.benefit_amount_min || scheme.benefit_amount_max || scheme.benefit_amount_text) && (
              <div className="mt-4 bg-green-50 rounded-lg p-4">
                <div className="text-xs text-green-600 mb-1">Benefit Amount</div>
                <div className="text-2xl font-bold text-green-700">{benefitAmount}</div>
                {scheme.benefit_type && <div className="text-xs text-green-600 mt-1">Type: {scheme.benefit_type}</div>}
              </div>
            )}
          </div>
        )}

        {activeTab === 'howtoapply' && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#1A1A2E]">How to Apply</h3>
              <button onClick={() => setShowFull(!showFull)} className="text-sm text-[#1B3A6B] font-medium">{showFull ? 'Show Less' : 'Show More'}</button>
            </div>
            <p className={`text-sm text-gray-600 leading-relaxed ${!showFull && 'line-clamp-3'}`}>{howToApplyText}</p>
            {scheme.application_mode && scheme.application_mode.length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-gray-500 mb-2">Application Modes</div>
                <div className="flex flex-wrap gap-2">
                  {scheme.application_mode.map((mode, i) => <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">{mode}</span>)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Apply Buttons */}
      <div className="px-4 mt-6 space-y-3">
        {profile?.onboarding_completed ? (
          <div className="space-y-3">
            {scheme.apply_url && (
              <a href={scheme.apply_url} target="_blank" rel="noopener noreferrer" className="block w-full py-4 rounded-xl font-semibold text-lg text-center bg-[#FF7A00] hover:bg-[#FF9933] text-white transition">
                Apply Now
              </a>
            )}
            {scheme.official_url && (
              <a href={scheme.official_url} target="_blank" rel="noopener noreferrer" className="block w-full py-3 rounded-xl font-medium text-center bg-gray-100 hover:bg-gray-200 text-[#1A1A2E] transition flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" /> Official Website
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <button onClick={() => navigate('/onboarding')} className="w-full py-4 rounded-xl font-semibold text-lg text-center bg-[#1B3A6B] hover:bg-[#2A4A8B] text-white transition">
              Complete Profile to Apply
            </button>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800 text-center"><strong>Tip:</strong> Complete your profile first to see application options</p>
            </div>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="px-4 mt-6">
        {profile?.onboarding_completed && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" /> Need Help?
            </h3>
            <p className="text-sm text-gray-600 mb-3">Bharat Lens AI can guide you through the application process.</p>
            <button onClick={() => navigate('/chat')} className="w-full py-3 rounded-xl font-medium bg-blue-50 hover:bg-blue-100 text-[#1B3A6B] transition flex items-center justify-center gap-2">
              <Phone className="w-4 h-4" /> Chat with Bharat Lens
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function buildEligibilityText(scheme: Scheme): string {
  const parts: string[] = [];
  if (scheme.category) parts.push(`This scheme is for the ${scheme.category} sector.`);
  if (scheme.min_age || scheme.max_age) parts.push(`Age: ${scheme.min_age || 0} - ${scheme.max_age || 'any'} years.`);
  if (scheme.income_limit) parts.push(`Maximum annual income: Rs.${scheme.income_limit.toLocaleString()}.`);
  if (scheme.gender) parts.push(`Gender: ${scheme.gender}.`);
  if (scheme.domicile_required) parts.push("State domicile may be required.");
  if (scheme.professions && scheme.professions.length > 0) parts.push(`Eligible professions: ${scheme.professions.join(', ')}.`);
  if (scheme.applicable_states && scheme.applicable_states.length > 0) {
    if (scheme.applicable_states.includes('All India')) {
      parts.push("Applicable across all states of India.");
    } else {
      parts.push(`Applicable in: ${scheme.applicable_states.slice(0, 5).join(', ')}${scheme.applicable_states.length > 5 ? ' and more' : ''}.`);
    }
  }
  return parts.length > 0 ? parts.join(' ') : 'Please check the official website for detailed eligibility criteria.';
}

function buildBenefitsText(scheme: Scheme): string {
  const parts: string[] = [];
  if (scheme.short_benefit) parts.push(scheme.short_benefit);
  if (scheme.benefit_type) parts.push(`Benefit Type: ${scheme.benefit_type}.`);
  if (scheme.benefit_amount_text) parts.push(scheme.benefit_amount_text);
  else if (scheme.benefit_amount_min || scheme.benefit_amount_max) {
    const amount = [];
    if (scheme.benefit_amount_min) amount.push(`Minimum: Rs.${scheme.benefit_amount_min.toLocaleString()}`);
    if (scheme.benefit_amount_max) amount.push(`Maximum: Rs.${scheme.benefit_amount_max.toLocaleString()}`);
    parts.push(amount.join(', '));
  }
  if (scheme.coverage) parts.push(`Coverage: ${scheme.coverage}.`);
  return parts.length > 0 ? parts.join(' ') : 'Please check the official website for detailed benefit information.';
}

function buildHowToApplyText(scheme: Scheme): string {
  const parts: string[] = [];
  if (scheme.application_mode && scheme.application_mode.length > 0) parts.push(`Application Mode: ${scheme.application_mode.join(', ')}.`);
  parts.push("Visit the official website or nearest CSC (Common Service Centre) to apply.");
  if (scheme.apply_url) parts.push("Click the 'Apply Now' button above to start your application.");
  if (scheme.required_documents && scheme.required_documents.length > 0) {
    parts.push(`Documents needed: ${scheme.required_documents.slice(0, 5).join(', ')}${scheme.required_documents.length > 5 ? ', and more' : ''}.`);
  }
  if (scheme.helpline) parts.push(`Helpline: ${scheme.helpline}.`);
  return parts.length > 0 ? parts.join(' ') : 'Please visit the official website for application instructions.';
}
