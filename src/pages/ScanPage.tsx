import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from '../lib/Router';
import { useApp } from '../lib/AppContext';
import { t } from '../lib/i18n';
import { Upload, FileText, Check, X, Loader2, Save, AlertTriangle, Globe, ExternalLink, RefreshCw, CheckCircle, AlertCircle, Image, Sparkles, MessageCircle, Camera } from 'lucide-react';
import type { Language } from '../lib/i18n';
import { createDoableClient } from '@doable/sdk';
import { db } from '@doable/data';
import { useIntegration } from '@doable/sdk/react';

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
  const [analyzingStage, setAnalyzingStage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { navigate } = useRouter();
  const { language, profile } = useApp();
  const lang = language as Language;

  const openaiVision = useIntegration('openai', 'vision_prompt');
  const geminiChat = useIntegration('google_gemini', 'chat');

  const analyzeWithAI = useCallback(async (imageData: string, textData?: string) => {
    setProcessing(true);
    setError('');
    setResult(null);
    setAnalyzingStage('Initializing AI analysis...');

    try {
      // Try OpenAI Vision first
      if (imageData && openaiVision) {
        setAnalyzingStage('Analyzing image with AI vision...');
        
        try {
          const openaiResult = await openaiVision.run({
            image: imageData,
            prompt: `You are an expert at analyzing Indian government documents and detecting scams. 

Analyze this image and respond with ONLY a valid JSON object (no markdown, no explanation):
{
  "document_type": "scheme_notice|document|image|screenshot|other",
  "extracted_text": "Extract all readable text from the image",
  "is_scam": true|false,
  "scam_warnings": ["list of specific scam indicators found"],
  "schemes_found": [{
    "name": "scheme name if found",
    "category": "education|health|housing|employment|agriculture|women|sc|st|obc|minority|general",
    "official_url": "official government URL if mentioned",
    "eligibility": "who can apply",
    "benefits": "what benefits are mentioned",
    "documents": "required documents mentioned",
    "description": "brief description"
  }],
  "recommendations": ["helpful advice for the user"],
  "summary": "brief summary of what the image shows"
}

Be thorough and accurate. If it's a scam, set is_scam to true and add specific warnings.`,
            detail: 'low',
            maxTokens: 800
          });

          if (openaiResult) {
            setAnalyzingStage('Processing AI results...');
            
            let responseText = '';
            if (typeof openaiResult === 'string') {
              responseText = openaiResult;
            } else if (openaiResult && typeof openaiResult === 'object') {
              responseText = JSON.stringify(openaiResult);
            }

            // Parse JSON response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                const parsed = JSON.parse(jsonMatch[0]);
                
                // Additional scam pattern checks
                const text = responseText.toLowerCase();
                const scamPatterns = [
                  { pattern: /guaranteed.*approval|100%.*approval|no document.*required/i, warning: 'Claims guaranteed approval - verify with official sources' },
                  { pattern: /processing fee.*₹|advance.*payment|pay.*to.*receive|₹.*to.*start/i, warning: 'Requests money upfront - government schemes are FREE to apply' },
                  { pattern: /limited.*time.*offer|only.*today|act.*now|expires.*today/i, warning: 'Fake urgency tactics - real schemes don\'t expire suddenly' },
                  { pattern: /government.*representative|call.*this.*number|visit.*office.*to.*pay/i, warning: 'May be impersonating government officials' },
                  { pattern: /whatsapp.*join|telegram.*group|sms.*this/i, warning: 'Unofficial communication channels detected' }
                ];

                const scamWarnings = [...(parsed.scam_warnings || [])];
                for (const { pattern, warning } of scamPatterns) {
                  if (pattern.test(text) && !scamWarnings.includes(warning)) {
                    scamWarnings.push(warning);
                  }
                }

                const finalResult: ScanResult = {
                  is_scam: parsed.is_scam || scamWarnings.length > 0,
                  document_type: parsed.document_type || 'image',
                  summary: parsed.summary || parsed.extracted_text?.substring(0, 300) || 'Analysis complete',
                  extracted_text: parsed.extracted_text || '',
                  schemes_found: (parsed.schemes_found || []).map((s: SchemeInfo) => ({
                    ...s,
                    apply_url: s.apply_url || s.official_url || ''
                  })),
                  scam_warnings: scamWarnings,
                  recommendations: parsed.recommendations || ['Always verify scheme details on official government portals']
                };

                setResult(finalResult);
                setProcessing(false);
                setAnalyzingStage('');
                return;
              } catch (parseErr) {
                console.error('JSON parse error:', parseErr);
              }
            }
          }
        } catch (err) {
          console.error('OpenAI vision error:', err);
        }
      }

      // Fallback to text analysis with Gemini or text input
      if (textData && geminiChat) {
        setAnalyzingStage('Analyzing text with AI...');
        
        try {
          const analysisPrompt = `You are an expert at analyzing Indian government schemes and detecting scams. 

Analyze this text and respond with ONLY a valid JSON object:
{
  "document_type": "scheme_notice|document|text|other",
  "extracted_text": "key information extracted",
  "is_scam": true|false,
  "scam_warnings": ["specific warnings if any"],
  "schemes_found": [{"name": "", "category": "", "official_url": "", "eligibility": "", "benefits": "", "documents": "", "description": ""}],
  "recommendations": ["helpful advice"],
  "summary": "brief summary"
}

Text to analyze: ${textData}`;

          const geminiResult = await geminiChat.run({
            prompt: analysisPrompt,
            model: 'gemini-pro'
          });

          if (geminiResult) {
            let responseText = '';
            if (typeof geminiResult === 'string') {
              responseText = geminiResult;
            } else if (geminiResult && typeof geminiResult === 'object') {
              responseText = JSON.stringify(geminiResult);
            }

            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              setResult({
                is_scam: parsed.is_scam || false,
                document_type: parsed.document_type || 'text',
                summary: parsed.summary || parsed.extracted_text?.substring(0, 300) || 'Analysis complete',
                extracted_text: parsed.extracted_text || textData,
                schemes_found: parsed.schemes_found || [],
                scam_warnings: parsed.scam_warnings || [],
                recommendations: parsed.recommendations || ['Verify with official sources']
              });
              setProcessing(false);
              setAnalyzingStage('');
              return;
            }
          }
        } catch (err) {
          console.error('Gemini error:', err);
        }
      }

      // Final fallback - basic analysis
      setAnalyzingStage('Completing analysis...');
      const basicResult: ScanResult = {
        is_scam: false,
        document_type: textData ? 'text' : 'image',
        summary: textData 
          ? `Text submitted for analysis: ${textData.substring(0, 200)}...`
          : 'Image uploaded for analysis',
        extracted_text: textData || 'Image content detected',
        schemes_found: [],
        scam_warnings: [],
        recommendations: [
          'Try using the Chat feature for more detailed scheme analysis',
          'Include more details about the document for better results'
        ]
      };
      setResult(basicResult);

    } catch (err) {
      console.error('Analysis failed:', err);
      setError('Analysis failed. Please try again or use the Chat feature.');
    } finally {
      setProcessing(false);
      setAnalyzingStage('');
    }
  }, [openaiVision, geminiChat]);

  // Auto-analyze when image is uploaded
  useEffect(() => {
    if (imageBase64 && !result && !processing) {
      const imageUrl = `data:image/jpeg;base64,${imageBase64}`;
      analyzeWithAI(imageUrl);
    }
  }, [imageBase64, result, processing, analyzeWithAI]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setError('');
    setResult(null);
    setAnalyzingStage('Loading image...');

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      setImage(dataUrl);
      const base64 = dataUrl.split(',')[1] || '';
      setImageBase64(base64);
    };
    reader.onerror = () => {
      setError('Failed to load image. Please try again.');
      setProcessing(false);
    };
    reader.readAsDataURL(file);
  }

  function handleReanalyze() {
    if (imageBase64) {
      setResult(null);
      const imageUrl = `data:image/jpeg;base64,${imageBase64}`;
      analyzeWithAI(imageUrl);
    }
  }

  async function handleSaveResult() {
    if (!result) return;
    
    setSaving(true);
    setSaveSuccess('');
    setError('');
    
    try {
      const r = await db.query(
        `INSERT INTO scam_reports (input_type, raw_content, ai_verdict, ai_reasoning)
         VALUES ($1, $2, $3, $4)`,
        [
          result.document_type,
          result.extracted_text || result.summary,
          result.is_scam ? 'POTENTIAL_SCAM' : 'verified',
          JSON.stringify({
            schemes: result.schemes_found,
            warnings: result.scam_warnings,
            recommendations: result.recommendations,
            analyzed_at: new Date().toISOString()
          })
        ]
      );
      
      if (r.ok) {
        setSaveSuccess('Saved to Vault!');
        setTimeout(() => setSaveSuccess(''), 3000);
      } else {
        throw new Error(r.error?.message || 'Save failed');
      }
    } catch (err) {
      console.error('Save failed:', err);
      setError('Failed to save result. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleTextAnalyze() {
    if (!textInput.trim()) return;
    analyzeWithAI('', textInput);
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold text-white">{t('Scan & Analyze', lang)}</h1>
        <p className="text-white/70 text-sm mt-1">Upload documents or images for instant AI analysis</p>
      </div>

      {/* Mode Toggle */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('image')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition ${
              mode === 'image' 
                ? 'bg-[#1B3A6B] text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            Image Upload
          </button>
          <button
            onClick={() => setMode('text')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition ${
              mode === 'text' 
                ? 'bg-[#1B3A6B] text-white shadow-md' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Text Input
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {mode === 'image' ? (
          <div className="space-y-4">
            {/* Upload Area */}
            {!image && (
              <div 
                className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center bg-gray-50 hover:bg-blue-50 hover:border-blue-300 transition cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-blue-500" />
                </div>
                <p className="font-semibold text-gray-800 text-lg">Upload Image</p>
                <p className="text-sm text-gray-500 mt-2">
                  Tap to select a photo of any government document, scheme notice, or screenshot
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <span className="px-3 py-1 bg-white rounded-full text-xs text-gray-600 border">Schemes</span>
                  <span className="px-3 py-1 bg-white rounded-full text-xs text-gray-600 border">Notices</span>
                  <span className="px-3 py-1 bg-white rounded-full text-xs text-gray-600 border">Screenshots</span>
                </div>
              </div>
            )}

            {/* Image Preview */}
            {image && (
              <div className="relative rounded-2xl overflow-hidden bg-white shadow-lg border border-gray-200">
                <img src={image} alt="Uploaded" className="w-full h-72 object-contain bg-gray-100" />
                
                {/* Remove Button */}
                <button
                  onClick={() => {
                    setImage(null);
                    setImageBase64(null);
                    setResult(null);
                    setError('');
                  }}
                  className="absolute top-3 right-3 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                {/* Processing Overlay */}
                {processing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-6 text-center max-w-xs mx-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      </div>
                      <p className="font-semibold text-gray-800 text-lg">AI Analyzing...</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {analyzingStage || 'Processing your image'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Re-analyze Button */}
            {image && !processing && (
              <button
                onClick={handleReanalyze}
                className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 text-[#1B3A6B] bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Re-analyze Image
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-4 mb-2">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Paste scheme details, notice text, or any government document content for analysis.
              </p>
            </div>
            
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste scheme details, notice text, or any government document content here..."
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B3A6B] focus:border-transparent resize-none text-gray-800"
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
                  <Sparkles className="w-5 h-5" />
                  Analyze Text
                </>
              )}
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800">Error</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !processing && (
          <div className="mt-6 space-y-4 animate-fade-in">
            {/* Status Badge */}
            <div className={`p-4 rounded-xl ${result.is_scam ? 'bg-red-50 border-2 border-red-300' : 'bg-green-50 border-2 border-green-300'}`}>
              <div className="flex items-center gap-3">
                {result.is_scam ? (
                  <AlertTriangle className="w-10 h-10 text-red-500" />
                ) : (
                  <CheckCircle className="w-10 h-10 text-green-500" />
                )}
                <div>
                  <p className="font-bold text-lg">
                    {result.is_scam ? '⚠️ Potential Scam Detected' : '✓ Appears Legitimate'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Document Type: <span className="font-medium">{result.document_type}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Scam Warnings */}
            {result.scam_warnings.length > 0 && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <h3 className="font-bold text-red-800 flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5" />
                  Scam Warnings ({result.scam_warnings.length})
                </h3>
                <ul className="space-y-2">
                  {result.scam_warnings.map((warning, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                      <span className="mt-1 text-red-500">•</span>
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Summary */}
            {result.summary && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Analysis Summary
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">{result.summary}</p>
              </div>
            )}

            {/* Schemes Found */}
            {result.schemes_found.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  Schemes Found ({result.schemes_found.length})
                </h3>
                {result.schemes_found.map((scheme, i) => (
                  <div key={i} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg">{scheme.name || 'Government Scheme'}</h4>
                        {scheme.category && (
                          <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium mt-2">
                            {scheme.category}
                          </span>
                        )}
                        {scheme.eligibility && (
                          <p className="text-sm text-gray-600 mt-3">
                            <span className="font-medium text-gray-800">Eligibility:</span> {scheme.eligibility}
                          </p>
                        )}
                        {scheme.benefits && (
                          <p className="text-sm text-green-700 mt-2">
                            <span className="font-medium">Benefits:</span> {scheme.benefits}
                          </p>
                        )}
                        {scheme.documents && (
                          <p className="text-sm text-gray-500 mt-2">
                            <span className="font-medium">Documents:</span> {scheme.documents}
                          </p>
                        )}
                        {scheme.description && (
                          <p className="text-sm text-gray-600 mt-2">{scheme.description}</p>
                        )}
                      </div>
                    </div>
                    {scheme.official_url && (
                      <a 
                        href={scheme.official_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Visit Official Site <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Recommendations
                </h3>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-blue-700">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleSaveResult}
                disabled={saving}
                className="flex-1 py-3 bg-[#1B3A6B] text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#2A4A8B] transition"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : saveSuccess ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
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
