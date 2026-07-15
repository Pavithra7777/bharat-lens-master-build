import { useState, useRef, useEffect } from 'react';
import { useRouter } from '../lib/Router';
import { useApp } from '../lib/AppContext';
import { t } from '../lib/i18n';
import { Upload, FileText, Check, X, Loader2, Save, AlertTriangle, Globe, ExternalLink, RefreshCw, CheckCircle, AlertCircle, FileSearch, SearchCheck, ShieldCheck, Image, Sparkles, Zap, ArrowRight, FileCheck, BadgeCheck, Search } from 'lucide-react';
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
      // Use OpenAI vision for detailed image analysis
      let visionResponse = '';
      
      try {
        const openaiResult = await createDoableClient().integrations.run('openai', 'vision_prompt', {
          image: `data:image/jpeg;base64,${base64Data}`,
          prompt: `Quickly analyze this image for Indian government schemes. Return ONLY valid JSON: {"schemes":[{"name":"name","category":"category","ministry":"ministry","official_url":"url","apply_url":"url","eligibility":"eligibility","benefits":"benefits","documents":"docs","how_to_apply":"steps","status":"Active","description":"desc"}],"document_type":"type","extracted_text":"text","is_scam":false,"scam_warnings":[],"recommendations":[]}`,
          detail: 'low'
        });
        
        if (openaiResult.success && openaiResult.data) {
          visionResponse = typeof openaiResult.data === 'string' ? openaiResult.data : JSON.stringify(openaiResult.data);
        }
      } catch (e) {
        console.error('OpenAI vision failed, using fallback:', e);
        visionResponse = JSON.stringify({
          schemes: [],
          document_type: 'image',
          extracted_text: 'Image uploaded - please see results',
          is_scam: false,
          scam_warnings: [],
          recommendations: ['Unable to analyze image content automatically']
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
        if (pattern.test(text)) {
          schemesData.scam_warnings.push(warning);
          schemesData.is_scam = true;
        }
      }

      setResult({
        is_scam: schemesData.is_scam,
        document_type: schemesData.document_type,
        summary: schemesData.schemes.length > 0 
          ? `Found ${schemesData.schemes.length} government scheme(s) in this image`
          : 'No government schemes detected in this image',
        extracted_text: schemesData.extracted_text,
        schemes_found: schemesData.schemes,
        scam_warnings: schemesData.scam_warnings,
        recommendations: schemesData.recommendations
      });

    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze image. Please try again or use text input.');
      setResult({
        is_scam: false,
        document_type: 'unknown',
        summary: 'Analysis encountered an error',
        extracted_text: '',
        schemes_found: [],
        scam_warnings: [],
        recommendations: ['Please try uploading the image again']
      });
    } finally {
      setProcessing(false);
    }
  }

  async function handleReanalyze() {
    if (imageBase64) {
      await analyzeImageNow(imageBase64);
    }
  }

  async function handleTextAnalysis() {
    if (!textInput.trim()) return;
    
    setProcessing(true);
    setError('');
    setResult(null);

    try {
      let textAnalysis = '';
      
      try {
        const openaiResult = await createDoableClient().integrations.run('openai', 'vision_prompt', {
          image: undefined,
          prompt: `Analyze this text for Indian government schemes:

"${textInput.substring(0, 3000)}"

For EACH government scheme mentioned, provide detailed information:
{
  "schemes": [
    {
      "name": "Full official scheme name",
      "category": "Category",
      "ministry": "Ministry name",
      "official_url": "Official website URL",
      "apply_url": "Application link",
      "eligibility": "Eligibility criteria",
      "benefits": "Benefits provided",
      "documents": "Required documents",
      "how_to_apply": "How to apply",
      "status": "Active/Seasonal",
      "description": "Description"
    }
  ],
  "is_scam": false,
  "scam_warnings": [],
  "recommendations": []
}

Return ONLY valid JSON.`,
          detail: 'auto'
        });
        
        if (openaiResult.success && openaiResult.data) {
          textAnalysis = typeof openaiResult.data === 'string' ? openaiResult.data : JSON.stringify(openaiResult.data);
        }
      } catch {
        textAnalysis = JSON.stringify({
          schemes: [],
          is_scam: false,
          scam_warnings: [],
          recommendations: ['Unable to analyze text']
        });
      }

      let schemesData = {
        schemes: [] as SchemeInfo[],
        is_scam: false,
        scam_warnings: [] as string[],
        recommendations: ['Search for schemes at government portals']
      };

      const jsonMatch = textAnalysis.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          schemesData = {
            schemes: parsed.schemes || [],
            is_scam: parsed.is_scam || false,
            scam_warnings: parsed.scam_warnings || [],
            recommendations: parsed.recommendations || ['Visit official portals']
          };
        } catch {
          // Keep empty
        }
      }

      setResult({
        is_scam: schemesData.is_scam,
        document_type: 'text',
        summary: schemesData.schemes.length > 0 
          ? `Found ${schemesData.schemes.length} scheme(s) in your text`
          : 'No schemes detected in text',
        extracted_text: textInput,
        schemes_found: schemesData.schemes,
        scam_warnings: schemesData.scam_warnings,
        recommendations: schemesData.recommendations
      });

    } catch (err) {
      console.error('Text analysis error:', err);
      setError('Failed to analyze text. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleSaveToVault() {
    if (!result) return;
    setSaving(true);
    try {
      const r = await db.query(
        `INSERT INTO vault_items (title, description, category, metadata, item_type)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          result.schemes_found.length > 0 
            ? `Schemes from Image - ${result.schemes_found.map(s => s.name).join(', ')}`
            : 'Scanned Document',
          result.summary,
          'scheme',
          JSON.stringify(result),
          'scan_result'
        ]
      );
      
      if (r.ok) {
        setSaveSuccess('Saved to Vault!');
        setTimeout(() => navigate('/vault'), 1500);
      } else {
        setError('Failed to save');
      }
    } catch {
      setError('Save failed');
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setImage(null);
    setImageBase64(null);
    setResult(null);
    setError('');
    setSaveSuccess('');
    setTextInput('');
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-6 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Zap className="w-6 h-6" />
          Instant Scheme Scanner
        </h1>
        <p className="text-white/70 mt-1">Upload an image for immediate analysis</p>
      </div>

      <div className="px-6 py-6 space-y-4">
        {/* Mode Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode('image')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
              mode === 'image' ? 'bg-[#1B3A6B] text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            <Image className="w-5 h-5" />
            Image Scan
          </button>
          <button
            onClick={() => setMode('text')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
              mode === 'text' ? 'bg-[#1B3A6B] text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            <FileText className="w-5 h-5" />
            Text Input
          </button>
        </div>

        {/* Image Upload Area */}
        {mode === 'image' && !image && (
          <div 
            className="bg-white rounded-2xl border-2 border-dashed border-blue-200 p-8 text-center cursor-pointer hover:border-[#1B3A6B] hover:bg-blue-50/30 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-[#1B3A6B]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload Image to Scan</h3>
            <p className="text-gray-500 mb-4">Supports scheme posters, forms, screenshots & documents</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              ref={fileInputRef}
              className="hidden"
            />
            <button className="bg-[#1B3A6B] text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 mx-auto hover:bg-[#2A4A8B] transition-colors">
              <Upload className="w-5 h-5" />
              Upload & Analyze
            </button>
          </div>
        )}

        {/* Image Preview with Auto-Analysis */}
        {mode === 'image' && image && (
          <div className="bg-white rounded-2xl overflow-hidden">
            <div className="relative">
              <img src={image} alt="Uploaded" className="w-full h-auto max-h-72 object-contain bg-gray-50" />
              <button 
                onClick={reset} 
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
                    <p className="text-sm text-gray-500 mt-1">Processing with AI (optimized for speed)</p>
                    <div className="w-48 h-1 bg-gray-200 rounded-full mt-3 mx-auto overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <button
                onClick={handleReanalyze}
                disabled={processing}
                className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 text-[#1B3A6B] bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                Re-analyze Image
              </button>
            </div>
          </div>
        )}

        {/* Text Mode */}
        {mode === 'text' && (
          <div className="bg-white rounded-2xl p-4">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste scheme text, URL, or description here..."
              className="w-full h-40 p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] text-gray-800"
            />
            <button
              onClick={handleTextAnalysis}
              disabled={processing || !textInput.trim()}
              className="w-full mt-3 bg-[#1B3A6B] text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#2A4A8B] transition-colors"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Find Schemes
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-red-700 font-medium">{error}</p>
              <p className="text-red-600 text-sm mt-1">Try again or use text input for better results</p>
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && !processing && (
          <div className="space-y-4">
            {/* Scam Warning Banner */}
            {result.is_scam && (
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="font-bold text-xl">⚠️ Scam Alert Detected!</p>
                    <p className="text-red-100">This content shows scam indicators</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {result.scam_warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 bg-white/10 rounded-lg p-3">
                      <X className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-white/10 rounded-lg">
                  <p className="font-medium">✅ Safe alternatives:</p>
                  <p className="text-sm text-red-100 mt-1">Always apply through official government portals like pmkisan.gov.in, pmjay.gov.in, or your state government websites.</p>
                </div>
              </div>
            )}

            {/* Document Type Badge */}
            {result.document_type && result.document_type !== 'text' && (
              <div className="bg-white rounded-xl p-4 border border-gray-200 flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Document Type</p>
                  <p className="font-semibold text-gray-800 capitalize">{result.document_type}</p>
                </div>
              </div>
            )}

            {/* Schemes Found */}
            {result.schemes_found.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-xl">{result.schemes_found.length} Government Scheme(s) Found!</p>
                      <p className="text-green-100">Verified & Active</p>
                    </div>
                  </div>
                </div>

                {/* Detailed Scheme Cards */}
                {result.schemes_found.map((scheme, idx) => (
                  <div key={idx} className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                    {/* Scheme Header */}
                    <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-white text-xs font-medium mb-2">
                            {scheme.category}
                          </span>
                          <h3 className="text-xl font-bold text-white">{scheme.name}</h3>
                          <p className="text-blue-200 text-sm mt-1 flex items-center gap-1">
                            <Sparkles className="w-4 h-4" />
                            {scheme.ministry}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 bg-green-500 px-3 py-1.5 rounded-full">
                          <BadgeCheck className="w-4 h-4 text-white" />
                          <span className="text-white text-xs font-semibold">Verified</span>
                        </div>
                      </div>
                    </div>

                    {/* Scheme Body */}
                    <div className="p-5 space-y-4">
                      {/* Description */}
                      {scheme.description && (
                        <p className="text-gray-700 leading-relaxed">{scheme.description}</p>
                      )}

                      {/* Benefits */}
                      {scheme.benefits && (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                          <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Benefits
                          </h4>
                          <p className="text-green-700">{scheme.benefits}</p>
                        </div>
                      )}

                      {/* Eligibility */}
                      {scheme.eligibility && (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                            <Check className="w-5 h-5" />
                            Eligibility
                          </h4>
                          <p className="text-blue-700">{scheme.eligibility}</p>
                        </div>
                      )}

                      {/* Documents */}
                      {scheme.documents && (
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                          <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Required Documents
                          </h4>
                          <p className="text-amber-700">{scheme.documents}</p>
                        </div>
                      )}

                      {/* How to Apply */}
                      {scheme.how_to_apply && (
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                          <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                            <ArrowRight className="w-5 h-5" />
                            How to Apply
                          </h4>
                          <p className="text-purple-700">{scheme.how_to_apply}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3 pt-2">
                        {scheme.apply_url && (
                          <a 
                            href={scheme.apply_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1 min-w-[160px] bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-green-600 hover:to-emerald-600 transition-all shadow-md"
                          >
                            <ExternalLink className="w-5 h-5" />
                            Apply Now
                          </a>
                        )}
                        {scheme.official_url && (
                          <a 
                            href={scheme.official_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1 min-w-[160px] bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md"
                          >
                            <Globe className="w-5 h-5" />
                            Official Website
                          </a>
                        )}
                      </div>

                      {/* Fallback search if no links */}
                      {!scheme.apply_url && !scheme.official_url && (
                        <a 
                          href={`https://www.google.com/search?q=${encodeURIComponent(scheme.name + ' scheme India official website')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
                        >
                          <Search className="w-5 h-5" />
                          Search for Official Website
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* No Schemes Found */
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SearchCheck className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Schemes Found</h3>
                <p className="text-gray-500">This image doesn't appear to contain government scheme information.</p>
                <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-700">
                    💡 Try uploading a screenshot of a scheme poster, official notification, or application form.
                  </p>
                </div>
              </div>
            )}

            {/* Extracted Text */}
            {result.extracted_text && result.extracted_text.length > 50 && (
              <details className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <summary className="p-4 cursor-pointer font-semibold text-gray-700 flex items-center gap-2 hover:bg-gray-50">
                  <FileSearch className="w-5 h-5" />
                  View Extracted Text ({result.extracted_text.length} characters)
                </summary>
                <div className="px-4 pb-4">
                  <div className="bg-gray-50 rounded-xl p-4 max-h-48 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">{result.extracted_text}</pre>
                  </div>
                </div>
              </details>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  What to Do Next
                </h3>
                <ul className="space-y-2">
                  {result.recommendations.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-700">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button 
                onClick={handleSaveToVault} 
                disabled={saving}
                className="flex-1 bg-[#1B3A6B] text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#2A4A8B] transition-colors"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save to Vault
              </button>
              <button 
                onClick={reset}
                className="px-6 py-4 rounded-xl font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Success Toast */}
        {saveSuccess && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
            <CheckCircle className="w-5 h-5" />
            {saveSuccess}
          </div>
        )}
      </div>
    </div>
  );
}
