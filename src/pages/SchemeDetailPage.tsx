import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '../lib/Router';
import { db } from '@doable/data';
import { useApp } from '../lib/AppContext';
import { translations } from '../lib/i18n';
import { 
  ArrowLeft, ExternalLink, CheckCircle, FileText, MapPin, Users, 
  Briefcase, Calendar, Phone, Loader2, Shield, Heart, Home, 
  GraduationCap, Globe, Banknote, Clock, Target, Award, ChevronDown,
  ChevronUp, Info, FileCheck, Building, Globe2, Ban, Smartphone
} from 'lucide-react';

interface Scheme {
  id: string;
  title: string;
  description: string;
  eligibility: string;
  benefits: string;
  how_to_apply: string;
  official_url: string | null;
  apply_url: string | null;
  department: string;
  category: string;
  state: string | null;
  income_max: number | null;
  age_min: number | null;
  age_max: number | null;
  gender: string | null;
  caste_category: string | null;
  disability_required: boolean | null;
  documents_required: string[] | null;
  application_fee: number | null;
  scholarship_amount: number | null;
  scholarship_frequency: string | null;
  application_deadline: string | null;
  renewal_process: string | null;
  grievance_mechanism: string | null;
  scheme_duration: string | null;
  created_at: string;
  is_active: boolean;
  tags: string[];
}

const CATEGORY_ICONS: Record<string, any> = {
  education: GraduationCap,
  healthcare: Heart,
  housing: Home,
  agriculture: Globe,
  employment: Briefcase,
  finance: Banknote,
  welfare: Shield,
  infrastructure: Building,
  other: Globe2,
};

export function SchemeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, language } = useApp();
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'eligibility' | 'benefits' | 'howtoapply'>('overview');
  const [showFullEligibility, setShowFullEligibility] = useState(false);
  const [showFullBenefits, setShowFullBenefits] = useState(false);
  const [showFullHowToApply, setShowFullHowToApply] = useState(false);
  const t = translations[language];

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1B3A6B] animate-spin" />
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-[#1A1A2E] mb-2">{error || 'Scheme not found'}</h2>
          <button
            onClick={() => navigate('/schemes')}
            className="mt-4 px-6 py-2 bg-[#1B3A6B] text-white rounded-lg"
          >
            Back to Schemes
          </button>
        </div>
      </div>
    );
  }

  const IconComponent = CATEGORY_ICONS[scheme.category?.toLowerCase()] || Globe2;
  const isDeadlinePassed = scheme.application_deadline && new Date(scheme.application_deadline) < new Date();
  const userProfile = profile;

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-20">
      {/* Header */}
      <div className="bg-[#1B3A6B] text-white px-4 pt-12 pb-6">
        <button
          onClick={() => navigate('/schemes')}
          className="flex items-center gap-2 mb-4 text-white/80 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <IconComponent className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold leading-tight">{scheme.title}</h1>
            <p className="text-white/70 text-sm mt-1">{scheme.department}</p>
          </div>
        </div>

        {scheme.application_deadline && (
          <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
            isDeadlinePassed ? 'bg-red-500/20 text-red-200' : 'bg-white/10 text-white/90'
          }`}>
            <Clock className="w-4 h-4" />
            {isDeadlinePassed ? 'Deadline passed' : `Deadline: ${new Date(scheme.application_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-around text-center">
            <div>
              <div className="text-2xl font-bold text-[#1B3A6B]">₹{scheme.scholarship_amount?.toLocaleString() || '—'}</div>
              <div className="text-xs text-gray-500 mt-1">Benefit Amount</div>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div>
              <div className="text-2xl font-bold text-[#1B3A6B]">{scheme.application_fee || '₹0'}</div>
              <div className="text-xs text-gray-500 mt-1">Application Fee</div>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div>
              <div className="text-2xl font-bold text-[#1B3A6B]">{scheme.scheme_duration || '—'}</div>
              <div className="text-xs text-gray-500 mt-1">Duration</div>
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
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                activeTab === tab ? 'bg-[#1B3A6B] text-white' : 'bg-gray-100 text-gray-600'
              }`}
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
              <p className="text-sm text-gray-600 leading-relaxed">{scheme.description}</p>
            </div>

            {scheme.documents_required && scheme.documents_required.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h3 className="font-semibold text-[#1A1A2E] mb-3">Required Documents</h3>
                <div className="space-y-2">
                  {scheme.documents_required.map((doc, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <FileCheck className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {scheme.grievance_mechanism && (
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h3 className="font-semibold text-[#1A1A2E] mb-2">Grievance Redressal</h3>
                <p className="text-sm text-gray-600">{scheme.grievance_mechanism}</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'eligibility' && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#1A1A2E]">Eligibility Criteria</h3>
              <button
                onClick={() => setShowFullEligibility(!showFullEligibility)}
                className="text-sm text-[#1B3A6B] font-medium"
              >
                {showFullEligibility ? 'Show Less' : 'Show More'}
              </button>
            </div>
            <p className={`text-sm text-gray-600 leading-relaxed ${!showFullEligibility && 'line-clamp-3'}`}>
              {scheme.eligibility}
            </p>
            
            <div className="mt-4 grid grid-cols-2 gap-3">
              {scheme.age_min && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Age</div>
                  <div className="text-sm font-medium text-[#1A1A2E]">{scheme.age_min} - {scheme.age_max || 'Any'} years</div>
                </div>
              )}
              {scheme.income_max && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Income Ceiling</div>
                  <div className="text-sm font-medium text-[#1A1A2E]">Up to ₹{scheme.income_max.toLocaleString()}</div>
                </div>
              )}
              {scheme.gender && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Gender</div>
                  <div className="text-sm font-medium text-[#1A1A2E]">{scheme.gender}</div>
                </div>
              )}
              {scheme.caste_category && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Category</div>
                  <div className="text-sm font-medium text-[#1A1A2E]">{scheme.caste_category}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'benefits' && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#1A1A2E]">Benefits</h3>
              <button
                onClick={() => setShowFullBenefits(!showFullBenefits)}
                className="text-sm text-[#1B3A6B] font-medium"
              >
                {showFullBenefits ? 'Show Less' : 'Show More'}
              </button>
            </div>
            <p className={`text-sm text-gray-600 leading-relaxed ${!showFullBenefits && 'line-clamp-3'}`}>
              {scheme.benefits}
            </p>
            
            {scheme.scholarship_amount && (
              <div className="mt-4 bg-green-50 rounded-lg p-4">
                <div className="text-xs text-green-600 mb-1">Scholarship Amount</div>
                <div className="text-2xl font-bold text-green-700">₹{scheme.scholarship_amount.toLocaleString()}</div>
                {scheme.scholarship_frequency && (
                  <div className="text-xs text-green-600 mt-1">per {scheme.scholarship_frequency}</div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'howtoapply' && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#1A1A2E]">How to Apply</h3>
              <button
                onClick={() => setShowFullHowToApply(!showFullHowToApply)}
                className="text-sm text-[#1B3A6B] font-medium"
              >
                {showFullHowToApply ? 'Show Less' : 'Show More'}
              </button>
            </div>
            <p className={`text-sm text-gray-600 leading-relaxed ${!showFullHowToApply && 'line-clamp-3'}`}>
              {scheme.how_to_apply}
            </p>
          </div>
        )}
      </div>

      {/* Apply Buttons */}
      <div className="px-4 mt-6 space-y-3">
        {userProfile?.onboarding_completed ? (
          <div className="space-y-3">
            {scheme.apply_url ? (
              <a
                href={scheme.apply_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-4 rounded-xl font-semibold text-lg text-center bg-[#FF7A00] hover:bg-[#FF9933] text-white transition"
              >
                Apply Now
              </a>
            ) : null}
            
            {scheme.official_url && (
              <a
                href={scheme.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 rounded-xl font-medium text-center bg-gray-100 hover:bg-gray-200 text-[#1A1A2E] transition flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Official Website
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => navigate('/onboarding')}
              className="w-full py-4 rounded-xl font-semibold text-lg text-center bg-[#1B3A6B] hover:bg-[#2A4A8B] text-white transition"
            >
              Complete Profile to Apply
            </button>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800 text-center">
                <strong>Tip:</strong> Complete your profile first to see application options
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="px-4 mt-6">
        {userProfile?.onboarding_completed ? (
          <div className="space-y-3">
            {scheme.apply_url ? (
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h3 className="font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  Need Help?
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  If you need assistance with your application, Bharat Lens AI can guide you through the process.
                </p>
                <button
                  onClick={() => navigate('/chat')}
                  className="w-full py-3 rounded-xl font-medium bg-blue-50 hover:bg-blue-100 text-[#1B3A6B] transition flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Chat with Bharat Lens
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/scan')}
                  className="w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 bg-[#1B3A6B] hover:bg-[#2A4A8B] text-white transition"
                >
                  <Smartphone className="w-5 h-5" />
                  Get Help Applying
                </button>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-800 text-center">
                    <strong>Tip:</strong> Visit nearest CSC, bank branch, or post office for offline application
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
