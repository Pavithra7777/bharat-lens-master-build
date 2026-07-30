import { useState } from 'react';
import { db } from '@doable/data';
import { useApp } from '../lib/AppContext';
import { useNavigate } from '../lib/Router';
import { LANGUAGES, type Language } from '../lib/i18n';
import { ArrowRight, ArrowLeft, Check, User, MapPin, Briefcase, Languages } from 'lucide-react';

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry'
];

const OCCUPATIONS = [
  { id: 'student', icon: '🎓', label: 'Student' },
  { id: 'farmer', icon: '🌾', label: 'Farmer' },
  { id: 'professional', icon: '💼', label: 'Professional' },
  { id: 'entrepreneur', icon: '🚀', label: 'Entrepreneur' },
  { id: 'senior_citizen', icon: '👴', label: 'Senior Citizen' },
  { id: 'other', icon: '👤', label: 'Other' },
];

const STEPS = ['name', 'state', 'occupation', 'language'];

export function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [occupation, setOccupation] = useState('');
  const [language, setLanguage] = useState<Language>('en');
  const [loading, setLoading] = useState(false);
  
  const { profile, setProfile, setLanguage: setAppLanguage } = useApp();
  const navigate = useNavigate();

  async function handleComplete() {
    if (!profile || !name.trim()) return;
    setLoading(true);

    try {
      await db.query(
        'UPDATE profiles SET full_name = $1, state = $2, occupation_category = $3, preferred_language = $4, onboarding_completed = true, updated_at = now() WHERE id = $5',
        [name.trim(), state, occupation, language, profile.id]
      );
      
      setProfile({
        ...profile,
        full_name: name.trim(),
        state,
        occupation_category: occupation,
        preferred_language: language,
        onboarding_completed: true,
      });
      
      setAppLanguage(language);
      navigate('/');
      window.location.reload();
    } catch (error) {
      console.error('Onboarding update failed:', error);
      setLoading(false);
    }
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  }

  function back() {
    if (step > 0) {
      setStep(step - 1);
    }
  }

  function canProceed(): boolean {
    switch (step) {
      case 0: return name.trim().length >= 2;
      case 1: return state.length > 0;
      case 2: return occupation.length > 0;
      case 3: return true;
      default: return false;
    }
  }

  function getStepClass(idx: number) {
    return idx <= step ? 'bg-white text-[#1B3A6B]' : 'bg-white/20 text-white';
  }

  function getDividerClass(idx: number) {
    return idx < step ? 'bg-white' : 'bg-white/20';
  }

  function getStateButtonClass(s: string) {
    return state === s ? 'border-[#1B3A6B] bg-[#1B3A6B]/5' : 'border-gray-200 hover:border-gray-300';
  }

  function getOccButtonClass(occ: { id: string }) {
    return occupation === occ.id ? 'border-[#1B3A6B] bg-[#1B3A6B]/5' : 'border-gray-200 hover:border-gray-300';
  }

  function getLangButtonClass(langCode: string) {
    return language === langCode ? 'border-[#1B3A6B] bg-[#1B3A6B]/5' : 'border-gray-200 hover:border-gray-300';
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B3A6B] to-[#2A4A8B] flex flex-col">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((_, i) => (
            <div key={i} className="flex items-center">
              <div className={'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition ' + getStepClass(i)}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={'w-12 h-0.5 mx-1 ' + getDividerClass(i)} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-t-3xl p-6">
        {step === 0 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <User className="w-12 h-12 text-[#1B3A6B] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[#1A1A2E]">What should we call you?</h2>
              <p className="text-gray-500 mt-2">Enter your name or a nickname</p>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-[#1B3A6B] focus:ring-0 outline-none transition"
              autoFocus
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <MapPin className="w-12 h-12 text-[#1B3A6B] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[#1A1A2E]">Select your state</h2>
              <p className="text-gray-500 mt-2">This helps us show relevant schemes</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto">
              {STATES.map((s) => (
                <button
                  key={s}
                  onClick={() => setState(s)}
                  className={'p-3 rounded-xl border-2 text-left transition ' + getStateButtonClass(s)}
                >
                  <span className="text-sm font-medium text-[#1A1A2E]">{s}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Briefcase className="w-12 h-12 text-[#1B3A6B] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[#1A1A2E]">What is your occupation?</h2>
              <p className="text-gray-500 mt-2">We'll personalize schemes for you</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {OCCUPATIONS.map((occ) => (
                <button
                  key={occ.id}
                  onClick={() => setOccupation(occ.id)}
                  className={'p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ' + getOccButtonClass(occ)}
                >
                  <span className="text-3xl">{occ.icon}</span>
                  <span className="text-sm font-medium text-[#1A1A2E]">{occ.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Languages className="w-12 h-12 text-[#1B3A6B] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[#1A1A2E]">Choose your language</h2>
              <p className="text-gray-500 mt-2">Bharat Lens will speak to you in this language</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={'p-4 rounded-xl border-2 flex items-center gap-3 transition ' + getLangButtonClass(lang.code)}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="text-sm font-medium text-[#1A1A2E]">{lang.nativeName}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <button
              onClick={back}
              className="flex-1 py-4 border-2 border-gray-200 rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <button
            onClick={next}
            disabled={!canProceed() || loading}
            className="flex-1 py-4 bg-[#1B3A6B] text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : step === STEPS.length - 1 ? (
              <>
                Get Started
                <Check className="w-4 h-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
