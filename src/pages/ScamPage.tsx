import { useState } from 'react';
import { useRouter } from '../lib/Router';
import { Shield, AlertTriangle, CheckCircle, HelpCircle, Upload, FileText, Link as LinkIcon, Loader2 } from 'lucide-react';

type Verdict = 'safe' | 'suspicious' | 'danger' | 'review';

interface ScamCheckResult {
  verdict: Verdict;
  reasoning: string;
  redFlags: string[];
  recommendations: string[];
}

const SCAM_PATTERNS = [
  { pattern: /urgent.*action|account.*suspend|kYC.*update/i, flag: 'Creates false urgency about account safety' },
  { pattern: /click.*link|verify.*account|update.*details/i, flag: 'Requests clicking external links' },
  { pattern: /prize.*winner|lottery|congratulations.*win/i, flag: 'Claims you won a prize or lottery' },
  { pattern: /government.*official|Aadhaar.*verify|i[nf]o.*gov/i, flag: 'Impersonates government officials' },
  { pattern: /sbi|hdfc|icici|axis.*bank.*update/i, flag: 'Impersonates banking institutions' },
  { pattern: /paytm|phonepe|gpay.*verify/i, flag: 'Impersonates UPI/digital payment apps' },
  { pattern: /₹[\d,]+|rs\.?\s*[\d,]+|upi.*transfer/i, flag: 'Mentions money transfers or fees' },
  { pattern: /share.*otp|never.*share.*otp/i, flag: 'Requests OTP sharing (legitimate services never ask)' },
];

export function ScamPage() {
  const { navigate } = useRouter();
  const [inputType, setInputType] = useState<'text' | 'image'>('text');
  const [input, setInput] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<ScamCheckResult | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  function analyzeContent(content: string): ScamCheckResult {
    const redFlags: string[] = [];
    let suspicionScore = 0;

    // Check for scam patterns
    SCAM_PATTERNS.forEach(({ pattern, flag }) => {
      if (pattern.test(content)) {
        redFlags.push(flag);
        suspicionScore += 1;
      }
    });

    // Check for suspicious indicators
    if (content.includes('http://') && !content.includes('https://')) {
      redFlags.push('Uses insecure HTTP link (secure sites use HTTPS)');
      suspicionScore += 1;
    }

    if (/\d{10,}/.test(content) && content.includes('call')) {
      redFlags.push('Asks you to call a phone number');
      suspicionScore += 1;
    }

    // Check for misspellings common in scams
    const misspellings = ['recieve', 'yoou', 'verfy', 'ur', 'dhan'];
    misspellings.forEach(word => {
      if (content.toLowerCase().includes(word)) {
        redFlags.push(`Possible typo: "${word}" (often seen in scam messages)`);
        suspicionScore += 1;
      }
    });

    // Determine verdict
    let verdict: Verdict;
    if (suspicionScore === 0) {
      verdict = 'safe';
    } else if (suspicionScore <= 2) {
      verdict = 'review';
    } else if (suspicionScore <= 4) {
      verdict = 'suspicious';
    } else {
      verdict = 'danger';
    }

    const reasoning = {
      safe: 'This message does not show obvious signs of being a scam. However, always verify unexpected requests through official channels.',
      review: 'Some elements of this message warrant attention. Review the red flags below carefully before taking any action.',
      suspicious: 'This message has several characteristics commonly found in scam messages. We recommend extreme caution.',
      danger: 'This message exhibits strong indicators of being a scam. Do not respond, click any links, or share any personal information.',
    }[verdict];

    const recommendations = {
      safe: [
        'Always verify unexpected requests through official channels',
        'Never share OTP with anyone',
        'When in doubt, contact the organization directly',
      ],
      review: [
        'Verify the sender through official contact numbers',
        'Do not click links directly - go to the official website instead',
        'Check the URL carefully before entering any information',
      ],
      suspicious: [
        'Do not respond to this message',
        'Block the sender and report as spam',
        'Never share personal or financial information',
        'Verify any claims through official government or bank channels',
      ],
      danger: [
        'Delete this message immediately',
        'Do not respond, click links, or call any numbers',
        'Block and report the sender',
        'If you have already responded, contact your bank immediately',
        'File a complaint at cybercrime.gov.in',
      ],
    }[verdict];

    return { verdict, reasoning, redFlags, recommendations };
  }

  async function handleCheck() {
    if (!input.trim()) return;
    setChecking(true);
    setResult(null);

    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const analysisResult = analyzeContent(input);
    setResult(analysisResult);
    setChecking(false);
  }

  function reset() {
    setInput('');
    setResult(null);
    setUploadedImage(null);
  }

  const VERDICT_CONFIG = {
    safe: {
      icon: CheckCircle,
      title: 'Appears Safe',
      description: 'No obvious scam indicators found',
      class: 'verdict-safe',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
      textColor: 'text-green-700',
      iconColor: 'text-green-600',
    },
    review: {
      icon: HelpCircle,
      title: 'Needs Verification',
      description: 'Some elements require caution',
      class: 'verdict-suspicious',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-500',
      textColor: 'text-amber-700',
      iconColor: 'text-amber-600',
    },
    suspicious: {
      icon: AlertTriangle,
      title: 'Suspicious',
      description: 'Multiple red flags detected',
      class: 'verdict-suspicious',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-500',
      textColor: 'text-orange-700',
      iconColor: 'text-orange-600',
    },
    danger: {
      icon: AlertTriangle,
      title: 'Likely Scam',
      description: 'Strong scam indicators detected',
      class: 'verdict-danger',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-500',
      textColor: 'text-red-700',
      iconColor: 'text-red-600',
    },
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-lg hover:bg-white/10 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <a href="#/" className="p-2 -mr-2 rounded-lg hover:bg-white/10 text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          </a>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-white" />
          <h1 className="text-2xl font-bold text-white">Scam Shield</h1>
        </div>
        <p className="text-white/70">Check if a message, link, or notice is safe</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Input Type Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setInputType('text')}
            className={`flex-1 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
              inputType === 'text' ? 'bg-[#1B3A6B] text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <FileText className="w-4 h-4" />
            Paste Text
          </button>
          <button
            onClick={() => setInputType('image')}
            className={`flex-1 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
              inputType === 'image' ? 'bg-[#1B3A6B] text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload Image
          </button>
        </div>

        {/* Input Area */}
        {inputType === 'text' && (
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste the suspicious message, SMS, or link here..."
            className="w-full h-40 p-4 bg-white border border-gray-200 rounded-xl resize-none outline-none focus:ring-2 focus:ring-[#1B3A6B]"
          />
        )}

        {inputType === 'image' && (
          <div className="aspect-video bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
            {uploadedImage ? (
              <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-contain rounded-xl" />
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-gray-600 font-medium">Upload a screenshot</p>
                <p className="text-gray-400 text-sm mt-1">of the suspicious message or notice</p>
              </>
            )}
          </div>
        )}

        {/* Check Button */}
        <button
          onClick={handleCheck}
          disabled={checking || (!input.trim() && !uploadedImage)}
          className="w-full py-4 bg-[#1B3A6B] text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {checking ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Shield className="w-5 h-5" />
              Check for Scams
            </>
          )}
        </button>

        {/* Result */}
        {result && (
          <div className={`rounded-xl border-2 p-6 ${VERDICT_CONFIG[result.verdict].class}`}>
            <div className="flex items-center gap-4 mb-4">
              {(() => {
                const Icon = VERDICT_CONFIG[result.verdict].icon;
                return <Icon className={`w-12 h-12 ${VERDICT_CONFIG[result.verdict].iconColor}`} />;
              })()}
              <div>
                <h3 className={`text-xl font-bold ${VERDICT_CONFIG[result.verdict].textColor}`}>
                  {VERDICT_CONFIG[result.verdict].title}
                </h3>
                <p className="text-gray-600">{VERDICT_CONFIG[result.verdict].description}</p>
              </div>
            </div>

            <p className="text-gray-700 mb-4">{result.reasoning}</p>

            {result.redFlags.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-[#1A1A2E] mb-2">Red Flags Detected:</h4>
                <ul className="space-y-2">
                  {result.redFlags.map((flag, i) => (
                    <li key={i} className="flex items-start gap-2 text-amber-700">
                      <span className="text-amber-500 mt-1">⚠️</span>
                      <span className="text-sm">{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-white/50 rounded-lg p-4">
              <h4 className="font-semibold text-[#1A1A2E] mb-2">Recommendations:</h4>
              <ul className="space-y-1">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-[#1B3A6B]">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="p-4 bg-gray-100 rounded-xl">
          <p className="text-sm text-gray-600">
            <strong>Note:</strong> This is AI guidance, not a legal verdict. When in doubt, verify via official 
            government department contacts. Report scams at{' '}
            <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="text-[#1B3A6B] underline">
              cybercrime.gov.in
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
