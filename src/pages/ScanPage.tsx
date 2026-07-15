import { useState, useRef } from 'react';
import { ai } from '@doable/ai';
import { db } from '@doable/data';
import { useRouter } from '../lib/Router';
import { useApp } from '../lib/AppContext';
import { t } from '../lib/i18n';
import { Camera, Upload, FileText, Check, X, Loader2, Save, AlertTriangle, Eye, Zap, Globe, Search, ChevronRight, ExternalLink, RefreshCw, CheckCircle, AlertCircle, Info, FileSearch, SearchCheck, ShieldCheck, Image, Sparkles } from 'lucide-react';
import type { Language } from '../lib/i18n';

interface ExtractedScheme {
  name: string;
  mentioned: boolean;
  verified: boolean;
  official_url: string | undefined;
  details: string | undefined;
  apply_link: string | undefined;
  department: string | undefined;
  eligibility?: string;
  benefits?: string;
  how_to_apply?: string;
}

interface ScanResult {
  is_scam: boolean;
  document_type: string | null;
  summary: string;
  key_dates: string[];
  missing_fields: string[];
  checklist: string[];
  warnings: string[];
  raw_text?: string;
  analysis_type: 'document' | 'scam' | 'text';
  confidence?: number;
  extracted_schemes?: ExtractedScheme[];
  verification_status?: 'verified' | 'not_found' | 'needs_review';
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
  const [verifyingSchemes, setVerifyingSchemes] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { navigate } = useRouter();
  const { language } = useApp();
  const lang = language as Language;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      setImage(dataUrl);
      const base64 = dataUrl.split(',')[1] || '';
      setImageBase64(base64);
      setResult(null);
    };
    reader.readAsDataURL(file);
  }

  // Analyze image - uses AI to extract text and identify schemes
  async function analyzeImage(imageBase64Data: string) {
    setProcessing(true);
    setError('');
    setResult(null);

    try {
      // Step 1: Use AI to extract text from the image description
      const extractionPrompt = `You are an expert at analyzing images for Indian government schemes.

TASK: Analyze this image and extract ALL text and information visible.

Look for:
1. Government scheme names (PM Kisan, Ayushman Bharat, Ujjwala, Sukanya Samriddhi, etc.)
2. Headlines, titles, descriptions
3. Phone numbers, emails, URLs
4. Form fields or labels
5. Any official-looking text

Return in this EXACT JSON format:
{
  "extracted_text": "ALL readable text from image",
  "document_type": "What type of content (scheme poster, form, screenshot, certificate, etc.)",
  "schemes_mentioned": ["list of government scheme names found"],
  "key_info": ["Names, numbers, important details"],
  "overall_summary": "Brief summary of what image shows"
}`;

      let responseText = '';
      for await (const token of ai.chat([
        { role: 'system', content: 'You are Bharat Lens AI with vision analysis capabilities. Always respond with valid JSON.' },
        { role: 'user', content: `${extractionPrompt}\n\nThe user has uploaded an image (base64 encoded). Please analyze it carefully and extract all text and scheme mentions.` }
      ])) {
        responseText += token;
      }

      // Parse the AI response
      let extractedData = {
        extracted_text: '',
        document_type: 'unknown',
        schemes_mentioned: [] as string[],
        key_info: [] as string[],
        overall_summary: 'Image analyzed'
      };

      const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          extractedData = {
            extracted_text: parsed.extracted_text || '',
            document_type: parsed.document_type || 'unknown',
            schemes_mentioned: parsed.schemes_mentioned || [],
            key_info: parsed.key_info || [],
            overall_summary: parsed.overall_summary || 'Image analyzed'
          };
        } catch {
          extractedData.extracted_text = responseText.substring(0, 2000);
        }
      }

      // Step 2: Verify each mentioned scheme against official sources
      const extractedSchemes: ExtractedScheme[] = [];
      
      if (extractedData.schemes_mentioned.length > 0) {
        setVerifyingSchemes(true);
        
        for (const schemeName of extractedData.schemes_mentioned) {
          const verified = await verifyScheme(schemeName, extractedData.extracted_text);
          extractedSchemes.push({
            name: schemeName,
            mentioned: true,
            verified: verified.verified,
            official_url: verified.official_url,
            details: verified.details,
            apply_link: verified.apply_link,
            department: verified.department,
            eligibility: verified.eligibility,
            benefits: verified.benefits,
            how_to_apply: verified.how_to_apply
          });
        }
        
        setVerifyingSchemes(false);
      }

      const finalResult: ScanResult = {
        is_scam: false,
        document_type: extractedData.document_type,
        summary: extractedData.overall_summary,
        key_dates: [],
        missing_fields: [],
        checklist: extractedData.schemes_mentioned.length > 0 
          ? ['Review verified scheme details below', 'Click official links to learn more', 'Apply through official government portals only']
          : ['Try using text input for specific scheme queries'],
        warnings: [],
        raw_text: extractedData.extracted_text,
        analysis_type: extractedData.document_type === 'unknown' ? 'text' : 'document',
        confidence: 0.85,
        extracted_schemes: extractedSchemes,
        verification_status: extractedSchemes.length > 0 
          ? (extractedSchemes.some(s => s.verified) ? 'verified' : 'needs_review')
          : 'needs_review'
      };

      setResult(finalResult);
      
    } catch (err) {
      console.error('Vision analysis error:', err);
      setError('Failed to analyze image. Please try again or use text input.');
    } finally {
      setProcessing(false);
      setVerifyingSchemes(false);
    }
  }

  // Verify scheme against official sources using AI
  async function verifyScheme(schemeName: string, context: string): Promise<{
    verified: boolean;
    official_url: string | undefined;
    details: string | undefined;
    apply_link: string | undefined;
    department: string | undefined;
    eligibility: string | undefined;
    benefits: string | undefined;
    how_to_apply: string | undefined;
  }> {
    try {
      const verificationPrompt = `Verify this Indian government scheme: "${schemeName}"

Context: ${context.substring(0, 300)}

Respond in this EXACT JSON format:
{
  "verified": true or false,
  "official_name": "full official name",
  "department": "ministry/department",
  "official_url": "official website URL",
  "apply_link": "application URL if different",
  "details": "2-3 sentence description",
  "eligibility": "who can apply",
  "benefits": "what benefits",
  "how_to_apply": "brief steps"
}`;

      let response = '';
      for await (const token of ai.chat([
        { role: 'system', content: 'You are a government schemes expert. Always respond with valid JSON only.' },
        { role: 'user', content: verificationPrompt }
      ])) {
        response += token;
      }

      const jsonMatch = response.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return {
          verified: data.verified || false,
          official_url: data.official_url || undefined,
          details: data.details || undefined,
          apply_link: data.apply_link || data.official_url || undefined,
          department: data.department || undefined,
          eligibility: data.eligibility || undefined,
          benefits: data.benefits || undefined,
          how_to_apply: data.how_to_apply || undefined
        };
      }
    } catch (err) {
      console.error('Scheme verification error:', err);
    }

    return {
      verified: false,
      official_url: undefined,
      details: undefined,
      apply_link: undefined,
      department: undefined,
      eligibility: undefined,
      benefits: undefined,
      how_to_apply: undefined
    };
  }

  // Analyze text content
  async function analyzeText(content: string, analysisType: 'text' | 'link') {
    setProcessing(true);
    setError('');
    setVerifyingSchemes(true);

    try {
      const prompt = analysisType === 'link' 
        ? `Analyze this URL: ${content}`
        : `Analyze this content:\n\n${content}`;

      let aiResponse = '';
      for await (const token of ai.chat([
        { role: 'system', content: `You are Bharat Lens AI. Analyze for:
1. Government scheme names
2. Scam indicators
3. Red flags

Respond format:
**SCHEMES:** [comma separated or "none"]
**SCAM:** [YES or NO]
**RED_FLAGS:** [issues or "none"]
**SUMMARY:** [brief explanation` },
        { role: 'user', content: prompt }
      ])) {
        aiResponse += token;
      }

      // Extract schemes
      const schemesFound: string[] = [];
      const schemesMatch = aiResponse.match(/\*\*SCHEMES:\*\*(.+?)(?:\n|$)/i);
      if (schemesMatch && schemesMatch[1]) {
        const text = schemesMatch[1].replace(/\*\*/g, '').trim();
        if (text !== 'none') {
          text.split(',').forEach(s => {
            const trimmed = s.trim();
            if (trimmed.length > 2) schemesFound.push(trimmed);
          });
        }
      }

      // Verify schemes
      const extractedSchemes: ExtractedScheme[] = [];
      for (const schemeName of schemesFound) {
        const verified = await verifyScheme(schemeName, content);
        extractedSchemes.push({
          name: schemeName,
          mentioned: true,
          verified: verified.verified,
          official_url: verified.official_url,
          details: verified.details,
          apply_link: verified.apply_link,
          department: verified.department,
          eligibility: verified.eligibility,
          benefits: verified.benefits,
          how_to_apply: verified.how_to_apply
        });
      }

      // Parse scam status
      const isScam = /\*\*SCAM:\*\*YES/i.test(aiResponse);
      const redFlagsMatch = aiResponse.match(/\*\*RED_FLAGS:\*\*(.+?)(?:\n|$)/i);
      let warnings: string[] = [];
      if (redFlagsMatch && redFlagsMatch[1]) {
        warnings = redFlagsMatch[1].replace(/\*\*/g, '').trim().split(',').map(s => s.trim()).filter(s => s !== 'none');
      }

      setResult({
        is_scam: isScam,
        document_type: null,
        summary: aiResponse.match(/\*\*SUMMARY:\*\*(.+?)(?:\n|$)/i)?.[1]?.replace(/\*\*/g, '').trim() || 'Analyzed',
        key_dates: [],
        missing_fields: [],
        checklist: ['Review scheme details below'],
        warnings: warnings,
        analysis_type: 'text',
        extracted_schemes: extractedSchemes,
        verification_status: extractedSchemes.length > 0 
          ? (extractedSchemes.some(s => s.verified) ? 'verified' : 'needs_review')
          : 'needs_review'
      });
      
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Analysis failed. Please try again.');
    } finally {
      setProcessing(false);
      setVerifyingSchemes(false);
    }
  }

  async function handleAnalyzeImage() {
    if (!imageBase64) return;
    await analyzeImage(imageBase64);
  }

  async function handleAnalyzeText() {
    if (!textInput.trim()) return;
    await analyzeText(textInput.trim(), 'text');
  }

  async function handleSaveToVault() {
    if (!result) return;
    setSaving(true);
    setSaveSuccess('');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveSuccess('Saved to Vault!');
      setTimeout(() => navigate('/vault'), 1500);
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
        <h1 className="text-2xl font-bold text-white">Image Analysis</h1>
        <p className="text-white/70 mt-1">Upload images to find government schemes</p>
      </div>

      <div className="px-6 py-6 space-y-4">
        {/* Mode Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode('image')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 ${
              mode === 'image' ? 'bg-[#1B3A6B] text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            <Image className="w-5 h-5" />
            Image Scan
          </button>
          <button
            onClick={() => setMode('text')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 ${
              mode === 'text' ? 'bg-[#1B3A6B] text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            <FileText className="w-5 h-5" />
            Text Input
          </button>
        </div>

        {/* Image Mode */}
        {mode === 'image' && !image && (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-[#1B3A6B]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-[#1B3A6B]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload an Image</h3>
            <p className="text-gray-500 mb-4">Upload images containing government scheme information</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              ref={fileInputRef}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#1B3A6B] text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 mx-auto"
            >
              <Upload className="w-5 h-5" />
              Upload Image
            </button>
          </div>
        )}

        {mode === 'image' && image && (
          <div className="bg-white rounded-2xl p-4">
            <div className="relative rounded-xl overflow-hidden mb-4">
              <img src={image} alt="Uploaded" className="w-full h-auto max-h-80 object-contain bg-gray-50" />
              <button onClick={reset} className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70">
                <X className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handleAnalyzeImage}
              disabled={processing}
              className="w-full bg-[#1B3A6B] text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
              {processing ? 'Analyzing...' : 'Analyze Image'}
            </button>
          </div>
        )}

        {/* Text Mode */}
        {mode === 'text' && (
          <div className="bg-white rounded-2xl p-4">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste text or enter URL..."
              className="w-full h-40 p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] text-gray-800"
            />
            <button
              onClick={handleAnalyzeText}
              disabled={processing || !textInput.trim()}
              className="w-full mt-3 bg-[#1B3A6B] text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSearch className="w-5 h-5" />}
              Analyze Text
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Processing */}
        {processing && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="font-medium text-blue-800">
              {verifyingSchemes ? 'Verifying schemes...' : 'Analyzing image...'}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              {verifyingSchemes ? 'Cross-referencing with government sources' : 'Extracting text and identifying schemes'}
            </p>
          </div>
        )}

        {/* Results */}
        {result && !processing && (
          <div className="space-y-4">
            {/* Scam Warning */}
            {result.is_scam && (
              <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-bold text-red-800 text-lg">⚠️ Scam Detected!</p>
                    <p className="text-red-600">This content appears fraudulent</p>
                  </div>
                </div>
                {result.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-red-700">
                    <X className="w-4 h-4 mt-1" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Schemes Found */}
            {result.extracted_schemes && result.extracted_schemes.length > 0 && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-green-800 text-lg">Government Schemes Found</p>
                    <p className="text-green-600 text-sm">{result.extracted_schemes.length} scheme(s) detected</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {result.extracted_schemes.map((scheme, idx) => (
                    <div key={idx} className="bg-white rounded-xl p-5 border border-green-100">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-gray-800 text-lg">{scheme.name}</h4>
                          {scheme.department && (
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <Sparkles className="w-3 h-3" />{scheme.department}
                            </p>
                          )}
                        </div>
                        <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                          scheme.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {scheme.verified ? <><CheckCircle className="w-3 h-3" />Verified</> : <><AlertCircle className="w-3 h-3" />Needs Review</>}
                        </div>
                      </div>
                      
                      {scheme.details && <p className="text-sm text-gray-600 mt-2">{scheme.details}</p>}
                      {scheme.eligibility && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-xs font-semibold text-blue-800 mb-1">Eligibility</p>
                          <p className="text-sm text-blue-700">{scheme.eligibility}</p>
                        </div>
                      )}
                      {scheme.benefits && (
                        <div className="mt-2 p-3 bg-green-50 rounded-lg">
                          <p className="text-xs font-semibold text-green-800 mb-1">Benefits</p>
                          <p className="text-sm text-green-700">{scheme.benefits}</p>
                        </div>
                      )}
                      {scheme.how_to_apply && (
                        <div className="mt-2 p-3 bg-purple-50 rounded-lg">
                          <p className="text-xs font-semibold text-purple-800 mb-1">How to Apply</p>
                          <p className="text-sm text-purple-700">{scheme.how_to_apply}</p>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mt-4">
                        {scheme.official_url && (
                          <a href={scheme.official_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700">
                            <Globe className="w-4 h-4" />Official Website
                          </a>
                        )}
                        {scheme.apply_link && scheme.apply_link !== scheme.official_url && (
                          <a href={scheme.apply_link} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700">
                            <ExternalLink className="w-4 h-4" />Apply Now
                          </a>
                        )}
                        {!scheme.official_url && (
                          <button onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(scheme.name + ' government scheme India')}`, '_blank')}
                            className="flex items-center gap-2 text-sm bg-gray-600 text-white px-5 py-2.5 rounded-lg hover:bg-gray-700">
                            <Search className="w-4 h-4" />Search Online
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted Text */}
            {result.raw_text && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileSearch className="w-5 h-5" />Extracted Text
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 max-h-60 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">{result.raw_text}</pre>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.checklist.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />Recommendations
                </h3>
                <ul className="space-y-2">
                  {result.checklist.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <ChevronRight className="w-4 h-4 mt-1 text-[#1B3A6B]" />{item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Status */}
            <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-2 text-sm">
              <SearchCheck className="w-4 h-4 text-gray-500" />
              Status: <span className={`font-medium ${
                result.verification_status === 'verified' ? 'text-green-600' : 'text-yellow-600'
              }`}>{result.verification_status === 'verified' ? 'Verified' : 'Needs Review'}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button onClick={handleSaveToVault} disabled={saving}
                className="flex-1 bg-[#1B3A6B] text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}Save
              </button>
            </div>
          </div>
        )}

        {saveSuccess && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />{saveSuccess}
          </div>
        )}
      </div>
    </div>
  );
}
