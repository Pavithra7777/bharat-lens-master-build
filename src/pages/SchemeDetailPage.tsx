import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '../lib/Router';
import db from '../lib/db';
import { useApp } from '../lib/AppContext';
import { translations } from '../lib/i18n';
import { 
  ArrowLeft, ExternalLink, CheckCircle, FileText, MapPin, Users, 
  Briefcase, Calendar, Phone, Loader2, Shield, Heart, Home, 
  GraduationCap, Globe, Banknote, Clock, Target, Award, ChevronDown,
  ChevronUp, Info, FileCheck, Building, Globe2, Ban
} from 'lucide-react';

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
  const [linkStatus, setLinkStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    eligibility: true,
    benefits: true,
    documents: false,
    howToApply: false,
  });
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
      const scheme = await db.getSchemeById(id);
      if (scheme) {
        setScheme(scheme);
        
        // Check if the apply URL is accessible
        const applyUrl = scheme.apply_url;
        if (applyUrl) {
          setLinkStatus('checking');
          checkUrlAccessibility(applyUrl);
        }
      } else {
        setError('Scheme not found');
      }
    } catch (err) {
      if (err?.code !== 'PGRST205') console.error('Failed to load scheme:', err);
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

  // Check URL accessibility
  async function checkUrlAccessibility(url: string): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      setLinkStatus('valid');
    } catch (error) {
      console.log('URL validation failed:', url);
      setLinkStatus('invalid');
    }
  }

  function getMainDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.origin;
    } catch {
      return '';
    }
  }

  function toggleSection(section: string) {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }

  async function handleApply() {
    const rawUrl = scheme?.apply_url || scheme?.official_url;

    if (!rawUrl) {
      alert('No official application link available for this scheme. Please visit the official government portal.');
      return;
    }

    let url = rawUrl;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    if (!isValidUrl(url)) {
      alert('The application link for this scheme appears to be invalid. Please visit the official government portal directly.');
      return;
    }

    setLinkStatus('checking');
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      setLinkStatus('invalid');
      alert('Could not open the application page. Please copy this link and paste it in your browser: ' + url);
    } else {
      setLinkStatus('idle');
    }
  }

  function getCategoryIcon(category: string) {
    const Icon = CATEGORY_ICONS[category.toLowerCase()] || Shield;
    return <Icon className="w-5 h-5" />;
  }

  const formatBenefitAmount = () => {
    if (!scheme) return null;
    if (scheme.benefit_amount_text) return scheme.benefit_amount_text;
    if (scheme.benefit_amount_min && scheme.benefit_amount_max) {
      return `₹${scheme.benefit_amount_min.toLocaleString()} - ₹${scheme.benefit_amount_max.toLocaleString()}`;
    }
    if (scheme.benefit_amount_min) {
      return `₹${scheme.benefit_amount_min.toLocaleString()}${scheme.benefit_type === 'loan' ? ' loan' : ''}`;
    }
    return null;
  };

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

  const applyUrl = scheme.apply_url || scheme.official_url;
  const mainPortal = applyUrl ? getMainDomain(applyUrl) : '';
  const benefitAmount = formatBenefitAmount();

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
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded-full">
                {scheme.category}
              </span>
              {scheme.benefit_type && (
                <span className="px-2 py-0.5 bg-green-500/80 text-white text-xs rounded-full capitalize">
                  {scheme.benefit_type.replace(/_/g, ' ')}
                </span>
              )}
              {scheme.coverage && (
                <span className="px-2 py-0.5 bg-blue-500/80 text-white text-xs rounded-full">
                  {scheme.coverage}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-white leading-tight">{scheme.title}</h1>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-5">
        
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          {benefitAmount && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 shadow-sm border border-green-100">
              <div className="flex items-center gap-2 text-green-600 text-xs mb-1">
                <Banknote className="w-3 h-3" />
                Benefit Amount
              </div>
              <p className="font-semibold text-green-700 text-sm">{benefitAmount}</p>
            </div>
          )}
          {scheme.benefit_type && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 shadow-sm border border-blue-100">
              <div className="flex items-center gap-2 text-blue-600 text-xs mb-1">
                <Award className="w-3 h-3" />
                Type
              </div>
              <p className="font-semibold text-blue-700 text-sm capitalize">{scheme.benefit_type.replace(/_/g, ' ')}</p>
            </div>
          )}
        </div>

        {/* Ministry & Department */}
        <div className="grid grid-cols-2 gap-3">
          {scheme.department && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <Building className="w-3 h-3" />
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
        </div>

        {/* Detailed About Section */}
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-[#1B3A6B]">
          <h2 className="font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-[#1B3A6B]" />
            About This Scheme
          </h2>
          <p className="text-gray-700 leading-relaxed text-sm mb-3">
            {scheme.description}
          </p>
          {scheme.short_benefit && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
              <p className="text-green-800 font-medium text-sm flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Key Benefit: {scheme.short_benefit}</span>
              </p>
            </div>
          )}
        </div>

        {/* Key Highlights */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-5 shadow-sm border border-amber-100">
          <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Key Highlights
          </h3>
          <ul className="space-y-2">
            {scheme.category_eligible && scheme.category_eligible.length > 0 && (
              <li className="flex items-start gap-2 text-sm text-amber-800">
                <span className="text-amber-600 mt-0.5">•</span>
                <span><strong>Who can apply:</strong> {scheme.category_eligible.join(', ')}</span>
              </li>
            )}
            {scheme.professions && scheme.professions.length > 0 && (
              <li className="flex items-start gap-2 text-sm text-amber-800">
                <span className="text-amber-600 mt-0.5">•</span>
                <span><strong>Professions:</strong> {scheme.professions.join(', ')}</span>
              </li>
            )}
            {scheme.student_levels && scheme.student_levels.length > 0 && (
              <li className="flex items-start gap-2 text-sm text-amber-800">
                <span className="text-amber-600 mt-0.5">•</span>
                <span><strong>Student Levels:</strong> {scheme.student_levels.join(', ')}</span>
              </li>
            )}
            {scheme.student_streams && scheme.student_streams.length > 0 && (
              <li className="flex items-start gap-2 text-sm text-amber-800">
                <span className="text-amber-600 mt-0.5">•</span>
                <span><strong>Streams:</strong> {scheme.student_streams.join(', ')}</span>
              </li>
            )}
            {scheme.business_type && scheme.business_type.length > 0 && (
              <li className="flex items-start gap-2 text-sm text-amber-800">
                <span className="text-amber-600 mt-0.5">•</span>
                <span><strong>Business Types:</strong> {scheme.business_type.join(', ')}</span>
              </li>
            )}
            {scheme.employment_status && scheme.employment_status.length > 0 && (
              <li className="flex items-start gap-2 text-sm text-amber-800">
                <span className="text-amber-600 mt-0.5">•</span>
                <span><strong>Employment Status:</strong> {scheme.employment_status.join(', ')}</span>
              </li>
            )}
          </ul>
        </div>

        {/* Expandable Eligibility Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('eligibility')}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
          >
            <h2 className="font-semibold text-[#1A1A2E] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#1B3A6B]" />
              Eligibility Criteria
            </h2>
            {expandedSections.eligibility ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {expandedSections.eligibility && (
            <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
              {scheme.income_limit && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Banknote className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <span className="text-gray-500 text-xs">Annual Income Limit </span>
                    <p className="text-gray-800 font-medium">Up to ₹{scheme.income_limit.toLocaleString()}</p>
                  </div>
                </div>
              )}
              
              {(scheme.min_age !== undefined || scheme.max_age !== undefined) && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <span className="text-gray-500 text-xs">Age Requirement</span>
                    <p className="text-gray-800 font-medium">
                      {scheme.min_age !== undefined ? `${scheme.min_age}+ years` : 'No minimum'}
                      {scheme.max_age !== undefined ? ` to ${scheme.max_age} years` : ' and above'}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <span className="text-gray-500 text-xs">Domicile Requirement</span>
                  <p className="text-gray-800 font-medium">
                    {scheme.domicile_required ? 'State domicile certificate required' : 'No domicile restriction - Open to all'}
                  </p>
                </div>
              </div>

              {scheme.education_percentage_min !== undefined && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <GraduationCap className="w-4 h-4 text-amber-600 mt-1 flex-shrink-0" />
                  <div>
                    <span className="text-gray-500 text-xs">Minimum Education</span>
                    <p className="text-gray-800 font-medium">{scheme.education_percentage_min}% aggregate or above</p>
                  </div>
                </div>
              )}

              {scheme.applicable_states && scheme.applicable_states.length > 0 && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Globe2 className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
                  <div>
                    <span className="text-gray-500 text-xs">Applicable States</span>
                    <p className="text-gray-800 font-medium">{scheme.applicable_states.join(', ')}</p>
                  </div>
                </div>
              )}

              {scheme.gender && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Users className="w-4 h-4 text-pink-600 mt-1 flex-shrink-0" />
                  <div>
                    <span className="text-gray-500 text-xs">Gender</span>
                    <p className="text-gray-800 font-medium capitalize">{scheme.gender}</p>
                  </div>
                </div>
              )}

              {(!scheme.income_limit && scheme.min_age === undefined && !scheme.education_percentage_min) && (
                <p className="text-gray-500 text-sm italic">Check official website for detailed eligibility criteria</p>
              )}
            </div>
          )}
        </div>

        {/* Expandable Benefits Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('benefits')}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
          >
            <h2 className="font-semibold text-[#1A1A2E] flex items-center gap-2">
              <Award className="w-4 h-4 text-green-600" />
              Benefits Provided
            </h2>
            {expandedSections.benefits ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {expandedSections.benefits && (
            <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
              {benefitAmount && (
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                  <Banknote className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <span className="text-green-600 text-xs font-medium">Financial Benefit</span>
                    <p className="text-green-800 font-semibold text-lg">{benefitAmount}</p>
                  </div>
                </div>
              )}

              {scheme.short_benefit && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="text-blue-600 text-xs font-medium">Additional Benefits</span>
                  <p className="text-blue-800 text-sm mt-1">{scheme.short_benefit}</p>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Globe className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
                <div>
                  <span className="text-gray-500 text-xs">Coverage</span>
                  <p className="text-gray-800 font-medium">{scheme.coverage || 'All India'}</p>
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  <span className="text-purple-800 text-xs font-medium">Benefits Include</span>
                </div>
                <ul className="space-y-1 text-sm text-purple-700">
                  {scheme.benefit_type && <li>• {scheme.benefit_type.replace(/_/g, ' ')} support</li>}
                  {scheme.required_documents && scheme.required_documents.length > 0 && (
                    <li>• Document assistance</li>
                  )}
                  <li>• Government authorized benefits</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Expandable Required Documents Section */}
        {scheme.required_documents && scheme.required_documents.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection('documents')}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
            >
              <h2 className="font-semibold text-[#1A1A2E] flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-orange-600" />
                Required Documents
              </h2>
              {expandedSections.documents ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedSections.documents && (
              <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
                <p className="text-gray-600 text-sm mb-3">Prepare these documents before applying:</p>
                <div className="grid gap-2">
                  {scheme.required_documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-orange-600" />
                      </div>
                      <span className="text-gray-700 font-medium">{doc}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg mt-3">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-blue-700 text-xs">Additional documents may be required based on your specific situation. Check the official website for complete list.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Expandable How to Apply Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('howToApply')}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
          >
            <h2 className="font-semibold text-[#1A1A2E] flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              How to Apply
            </h2>
            {expandedSections.howToApply ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {expandedSections.howToApply && (
            <div className="px-5 pb-5 space-y-3 border-t border-gray-100 pt-4">
              {scheme.application_mode && scheme.application_mode.length > 0 ? (
                <>
                  <p className="text-gray-600 text-sm mb-3">Available application modes:</p>
                  <div className="space-y-2">
                    {scheme.application_mode.map((mode, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                          <span className="text-teal-600 font-bold text-sm">{idx + 1}</span>
                        </div>
                        <span className="text-gray-700 font-medium capitalize">{mode.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-teal-50 rounded-lg mt-3">
                    <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                    <p className="text-teal-700 text-xs">Applications are processed through official government portals</p>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-sm italic">Visit official website for application details</p>
              )}
            </div>
          )}
        </div>

        {/* Helpline Section */}
        {scheme.helpline && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 shadow-sm border border-blue-100">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Helpline & Support
            </h3>
            <div className="flex items-center gap-3">
              <a href={`tel:${scheme.helpline}`} className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium text-center hover:bg-blue-700 transition-colors">
                📞 {scheme.helpline}
              </a>
            </div>
            <p className="text-blue-600 text-xs mt-3 text-center">
              Available during government working hours
            </p>
          </div>
        )}

        {/* Tags Section */}
        {scheme.tags && scheme.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-gray-500 text-sm">Related Tags:</span>
            {scheme.tags.map((tag, idx) => (
              <span key={idx} className="px-3 py-1 bg-[#E8F0FE] text-[#1B3A6B] rounded-full text-xs font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Source Info */}
        {scheme.source_verified_at && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <CheckCircle className="w-3 h-3 text-green-500" />
            Verified on {new Date(scheme.source_verified_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        )}
      </div>

      {/* Fixed Bottom Apply Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
        {isValidUrl(applyUrl || '') ? (
          <>
            {linkStatus === 'checking' && (
              <button
                disabled
                className="w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition bg-yellow-500 text-white cursor-wait"
              >
                <Loader2 className="w-5 h-5 animate-spin" />
                Checking registration status...
              </button>
            )}
            {linkStatus === 'valid' && (
              <>
                <button
                  onClick={handleApply}
                  className="w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition bg-green-600 hover:bg-green-700 text-white"
                >
                  <ExternalLink className="w-5 h-5" />
                  Apply on Official Website
                </button>
                {mainPortal && (
                  <a
                    href={mainPortal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 mt-2 text-sm text-[#1B3A6B] hover:underline"
                  >
                    <Globe className="w-4 h-4" />
                    Or visit main portal: {mainPortal}
                  </a>
                )}
              </>
            )}
            {linkStatus === 'invalid' && (
              <div className="space-y-3">
                <div className="w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 bg-red-100 border border-red-300 text-red-700">
                  <Ban className="w-5 h-5" />
                  Registration Closed
                </div>
                <p className="text-xs text-gray-500 text-center">
                  The online application portal is currently unavailable. Please check back later or visit the official website for updates.
                </p>
                {mainPortal && (
                  <a
                    href={mainPortal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-sm text-[#1B3A6B] hover:underline"
                  >
                    <Globe className="w-4 h-4" />
                    Visit official website for updates
                  </a>
                )}
              </div>
            )}
            {linkStatus === 'idle' && (
              <>
                <button
                  onClick={handleApply}
                  className="w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition bg-green-600 hover:bg-green-700 text-white"
                >
                  <ExternalLink className="w-5 h-5" />
                  Apply on Official Website
                </button>
                {mainPortal && (
                  <a
                    href={mainPortal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 mt-2 text-sm text-[#1B3A6B] hover:underline"
                  >
                    <Globe className="w-4 h-4" />
                    Or visit main portal: {mainPortal}
                  </a>
                )}
              </>
            )}
          </>
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
    </div>
  );
}

