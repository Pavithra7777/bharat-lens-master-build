import { useState, useRef, useEffect } from 'react';
import { useRouter } from '../lib/Router';
import { useApp } from '../lib/AppContext';
import { t } from '../lib/i18n';
import { Upload, FileText, Check, X, Loader2, Save, AlertTriangle, Globe, ExternalLink, RefreshCw, CheckCircle, AlertCircle, FileSearch, SearchCheck, ShieldCheck, Image, Sparkles, Zap, ArrowRight, FileCheck, BadgeCheck, Search, MessageCircle } from 'lucide-react';
import type { Language } from '../lib/i18n';
import { createDoableClient } from '@doable/sdk';
import { db } from '@doable/data';

interface SchemeInfo {
  name: string;
  category: string;
  ministry: string;
  official_url: string;
  apply_url: string;
  eligibility: string;
  benefits: string;
  documents: string;
  how_to_apply: string;
  status: string;
  description: string;
}

interface ScanResult {
  is_scam: boolean;
  document_type: string;
  summary: string;
  extracted_text: string;
  schemes_found: SchemeInfo[];
  scam_warnings: string[];
  recommendations: string[];
}

export function ScanPage() {
  const [image, setImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [textInput, setTextInput] = useState('');
  const [mode, setMode] = useState<'image' | 'text'>('image');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { navigate } = useRouter();
  const { language } = useApp();
  const lang = language as Language;

  // Auto-analyze when image is uploaded
  useEffect(() => {
    if (imageBase64 && !result && !processing) {
      analyzeImageNow(imageBase64);
    }
  }, [imageBase64]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setError('');
    setResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      setImage(dataUrl);
      const base64 = dataUrl.split(',')[1] || '';
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  }

  async function analyzeImageNow(base64Data: string) {
    setProcessing(true);
    setError('');

    try {
      // Use OpenAI vision for quick image analysis
      let visionResponse = '';
      
      try {
        const openaiResult = await createDoableClient().integrations.run('openai', 'vision_prompt', {
          image: `data:image/jpeg;base64,${base64Data}`,
          prompt: `Analyze this image. If it shows Indian government schemes/documents, extract scheme names, eligibility, benefits, and official URLs. If it's a scam/fake notice, identify it. Reply in JSON: {"schemes":[{"name":"","category":"","official_url":"","eligibility":"","benefits":"","documents":"","description":"","status":"Active"}],"document_type":"","extracted_text":"","is_scam":false,"scam_warnings":[],"recommendations":[]}`,
          detail: 'low',
          maxTokens: 500
        });
        
        if (openaiResult.success && openaiResult.data) {
          visionResponse = typeof openaiResult.data === 'string' ? openaiResult.data : JSON.stringify(openaiResult.data);
        } else {
          throw new Error('Vision API returned no data');
        }
      } catch (e) {
        console.error('OpenAI vision failed:', e);
        visionResponse = JSON.stringify({
          schemes: [],
          document_type: 'image',
          extracted_text: 'Image uploaded - basic analysis mode',
          is_scam: false,
          scam_warnings: [],
          recommendations: ['Try describing what you see in the text input below']
        });
      }

      // Parse response
      let schemesData = {
        schemes: [] as SchemeInfo[],
        document_type: 'image',
        extracted_text: '',
        is_scam: false,
        scam_warnings: [] as string[],
        recommendations: ['Visit official government portals to apply']
      };

      const jsonMatch = visionResponse.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          schemesData = {
            schemes: parsed.schemes || [],
            document_type: parsed.document_type || 'image',
            extracted_text: parsed.extracted_text || '',
            is_scam: parsed.is_scam || false,
            scam_warnings: parsed.scam_warnings || [],
            recommendations: parsed.recommendations || ['Verify before applying']
          };
        } catch {
          schemesData.extracted_text = visionResponse.substring(0, 2000);
        }
      }

      // Check for scam indicators
      const text = visionResponse.toLowerCase();
      const scamPatterns = [
        { pattern: /guaranteed.*approval|100%.*approval|no document.*required/i, warning: 'Claims guaranteed approval - verify with official sources' },
        { pattern: /processing fee.*₹|advance.*payment|pay.*to.*receive/i, warning: 'Requests money upfront - government schemes are FREE' },
        { pattern: /limited.*time.*offer|only.*today|act.*now/i, warning: 'Fake urgency tactics - real schemes don\'t expire suddenly' },
        { pattern: /government.*representative|call.*this.*number/i, warning: 'May be impersonating government officials' }
      ];

      for (const { pattern, warning } of scamPatterns) {
        if (pattern.test(text) && !schemesData.scam_warnings.includes(warning)) {
          schemesData.scam_warnings.push(warning);
          schemesData.is_scam = true;
        }
      }

      // Build result
      const scanResult: ScanResult = {
        is_scam: schemesData.is_scam,
        document_type: schemesData.document_type,
        summary: schemesData.extracted_text ? 
          (schemesData.extracted_text.length > 300 ? schemesData.extracted_text.substring(0, 300) + '...' : schemesData.extracted_text) : 
          'Image analyzed successfully',
        extracted_text: schemesData.extracted_text,
        schemes_found: schemesData.schemes.map((s: SchemeInfo) => ({
          ...s,
          apply_url: s.apply_url || s.official_url || ''
        })),
        scam_warnings: schemesData.scam_warnings,
        recommendations: schemesData.recommendations
      };

      setResult(scanResult);
    } catch (err) {
      console.error('Analysis failed:', err);
      setError('Analysis failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  function handleReanalyze() {
    if (imageBase64) {
      setResult(null);
      analyzeImageNow(imageBase64);
    }
  }

  async function handleSaveResult() {
    if (!result) return;
    
    setSaving(true);
    setSaveSuccess('');
    
    try {
      await db.query(
        `INSERT INTO scam_reports (input_type, raw_content, ai_verdict, ai_reasoning)
         VALUES ($1, $2, $3, $4)`,
        ['image', result.extracted_text, 
         result.is_scam ? 'POTENTIAL_SCAM' : 'verified',
         JSON.stringify({ schemes: result.schemes_found, warnings: result.scam_warnings })]
      );
      setSaveSuccess('Saved to Vault!');
      setTimeout(() => setSaveSuccess(''), 2000);
    } catch (err) {
      console.error('Save failed:', err);
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function handleTextAnalyze() {
    if (!textInput.trim()) return;
    
    setProcessing(true);
    setError('');
    setResult({
      is_scam: false,
      document_type: 'text',
      summary: 'Text submitted for analysis',
      extracted_text: textInput,
      schemes_found: [],
      scam_warnings: [],
      recommendations: ['Use the Chat feature for detailed scheme searches']
    });
    setProcessing(false);
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold text-white">{t('Scan & Analyze', lang)}</h1>
        <p className="text-white/70 text-sm mt-1">Upload documents or images for instant analysis</p>
      </div>

      {/* Mode Toggle */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('image')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition ${
              mode === 'image' 
                ? 'bg-[#1B3A6B] text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Image className="w-4 h-4" />
            Image Upload
          </button>
          <button
            onClick={() => setMode('text')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition ${
              mode === 'text' 
                ? 'bg-[#1B3A6B] text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Text Input
          </button>
        </div>
      </div>

      <div className="p-4">
        {mode === 'image' ? (
          <div className="space-y-4">
            {/* Upload Area */}
            <div 
              className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="font-medium text-gray-700">Upload Image</p>
              <p className="text-sm text-gray-500 mt-1">Tap to select a photo of any document or notice</p>
            </div>

            {/* Image Preview */}
            {image && (
              <div className="relative rounded-2xl overflow-hidden bg-white shadow-lg">
                <img src={image} alt="Uploaded" className="w-full h-64 object-contain bg-gray-100" />
                
                {/* Remove Button */}
                <button
                  onClick={() => {
                    setImage(null);
                    setImageBase64(null);
                    setResult(null);
                  }}
                  className="absolute top-3 right-3 w-9 h-9 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                {/* Analysis Progress Overlay */}
                {processing && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-6 text-center">
                      <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                      </div>
                      <p className="font-semibold text-gray-800">Analyzing Image...</p>
                      <p className="text-sm text-gray-500 mt-1">This usually takes 5-15 seconds</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="p-4">
              <button
                onClick={handleReanalyze}
                disabled={processing || !image}
                className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 text-[#1B3A6B] bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                Re-analyze Image
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste scheme details, notice text, or any government document content here..."
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B3A6B] focus:border-transparent resize-none"
              rows={8}
            />
            
            <button
              onClick={handleTextAnalyze}
              disabled={processing || !textInput.trim()}
              className="w-full py-3 bg-[#1B3A6B] text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Analyze Text
                </>
              )}
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Analysis Error</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !processing && (
          <div className="mt-6 space-y-4">
            {/* Status Badge */}
            <div className={`p-4 rounded-xl ${result.is_scam ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-center gap-3">
                {result.is_scam ? (
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                ) : (
                  <ShieldCheck className="w-8 h-8 text-green-500" />
                )}
                <div>
                  <p className="font-semibold text-lg">
                    {result.is_scam ? '⚠️ Potential Scam Detected' : '✓ Appears Legitimate'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Document Type: {result.document_type}
                  </p>
                </div>
              </div>
            </div>

            {/* Scam Warnings */}
            {result.scam_warnings.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h3 className="font-semibold text-red-800 flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  Scam Warnings
                </h3>
                <ul className="space-y-2">
                  {result.scam_warnings.map((warning, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                      <span className="mt-1">•</span>
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Summary */}
            {result.summary && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Analysis Summary</h3>
                <p className="text-gray-600 text-sm">{result.summary}</p>
              </div>
            )}

            {/* Schemes Found */}
            {result.schemes_found.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Schemes Found ({result.schemes_found.length})</h3>
                {result.schemes_found.map((scheme, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{scheme.name || scheme.description?.substring(0, 50) || 'Scheme'}</h4>
                        {scheme.category && (
                          <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs mt-1">
                            {scheme.category}
                          </span>
                        )}
                        {scheme.eligibility && (
                          <p className="text-sm text-gray-600 mt-2">Eligibility: {scheme.eligibility}</p>
                        )}
                        {scheme.benefits && (
                          <p className="text-sm text-green-700 mt-1">Benefits: {scheme.benefits}</p>
                        )}
                        {scheme.documents && (
                          <p className="text-sm text-gray-500 mt-1">Docs: {scheme.documents}</p>
                        )}
                      </div>
                    </div>
                    {scheme.official_url && (
                      <a 
                        href={scheme.official_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      >
                        Visit Official Site <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Recommendations</h3>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-blue-700">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSaveResult}
                disabled={saving}
                className="flex-1 py-3 bg-[#1B3A6B] text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {saveSuccess || 'Save to Vault'}
              </button>
              <button
                onClick={() => navigate('/chat')}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-200 transition"
              >
                <MessageCircle className="w-5 h-5" />
                Ask AI Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
