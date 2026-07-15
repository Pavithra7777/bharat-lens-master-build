import { useState, useRef, useCallback } from 'react';
import { ai } from '@doable/ai';
import { db } from '@doable/data';
import { useRouter } from '../lib/Router';
import { useApp } from '../lib/AppContext';
import { t } from '../lib/i18n';
import { Camera, Upload, FileText, Check, X, Loader2, Save, AlertTriangle, Shield, MessageSquare, Link as LinkIcon, Eye, Zap, Globe, Search, ChevronRight, ExternalLink, RefreshCw, CheckCircle, AlertCircle, Info, FileSearch, SearchCheck, ShieldCheck } from 'lucide-react';
import type { Language } from '../lib/i18n';

// Gemini Vision API for real image analysis
import { createDoableClient } from '@doable/sdk';

interface ExtractedScheme {
  name: string;
  mentioned: boolean;
  verified: boolean;
  official_url: string | null;
  details: string | null;
  apply_link: string | null;
  department: string | null;
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

interface LiveSchemeUpdate {
  last_updated: string;
  source: string;
  new_schemes_count: number;
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
  const [liveUpdate, setLiveUpdate] = useState<LiveSchemeUpdate | null>(null);
  const [verifyingSchemes, setVerifyingSchemes] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { navigate } = useRouter();
  const { language, profile } = useApp();
  const lang = language as Language;

  // Handle file selection
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

  // Analyze image using Gemini Vision API
  async function analyzeWithGeminiVision(imageBase64Data: string) {
    setProcessing(true);
    setError('');
    setResult(null);

    try {
      const doable = createDoableClient();
      
      // Use Gemini Vision to extract text and analyze the image
      const visionPrompt = `You are Bharat Lens AI, an expert at analyzing images for Indian citizens.

TASK: Analyze this image thoroughly for ANY of the following:
1. Government scheme names or mentions (like PM Kisan, Ayushman Bharat, Ujjwala, Sukanya Samriddhi, etc.)
2. Any text visible in the image
3. Document type if it's a government document
4. Any links or URLs visible
5. Any phone numbers or contact information

IMPORTANT: Extract ALL text you can see. If multiple government schemes are mentioned, identify each one separately.

Respond in this EXACT JSON format (no markdown, just plain text):
{
  "type": "document|text_message|screenshot|link|form|certificate|scheme_list|unknown",
  "scam_status": "YES if suspicious, NO otherwise",
  "document_type": "specific type or null",
  "summary": "What is shown in this image - be detailed",
  "extracted_text": "ALL readable text transcribed exactly as shown",
  "key_information": ["list of important items found"],
  "schemes_mentioned": ["list of government scheme names mentioned, even if brief"],
  "urls_found": ["any URLs or links visible"],
  "phone_numbers": ["any phone numbers found"],
  "red_flags": ["any suspicious elements"],
  "recommendations": ["what user should do next"]
}`;

      // Call Gemini Vision API
      const result = await doable.integrations.run("google_gemini", "generate_text", {
        prompt: visionPrompt,
        image_base64: imageBase64Data,
      });

      if (result.success && result.data) {
        // Parse the response
        let analysis;
        try {
          // Try to extract JSON from the response
          const text = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0]);
          } else {
            analysis = {
              type: 'unknown',
              scam_status: 'NO',
              document_type: null,
              summary: text.substring(0, 500),
              extracted_text: text.substring(0, 2000),
              key_information: [],
              schemes_mentioned: [],
              urls_found: [],
              phone_numbers: [],
              red_flags: [],
              recommendations: []
            };
          }
        } catch {
          analysis = {
            type: 'unknown',
            scam_status: 'NO',
            document_type: null,
            summary: 'Analyzed image but could not parse details',
            extracted_text: '',
            key_information: [],
            schemes_mentioned: [],
            urls_found: [],
            phone_numbers: [],
            red_flags: [],
            recommendations: []
          };
        }

        // Now verify each mentioned scheme against official sources
        const extractedSchemes: ExtractedScheme[] = [];
        
        if (analysis.schemes_mentioned && analysis.schemes_mentioned.length > 0) {
          setVerifyingSchemes(true);
          
          for (const schemeName of analysis.schemes_mentioned) {
            const verified = await verifySchemeWithAI(schemeName, analysis.extracted_text || '');
            extractedSchemes.push({
              name: schemeName,
              mentioned: true,
              verified: verified.verified,
              official_url: verified.official_url,
              details: verified.details,
              apply_link: verified.apply_link,
              department: verified.department
            });
          }
          
          setVerifyingSchemes(false);
        }

        const finalResult: ScanResult = {
          is_scam: analysis.scam_status === 'YES',
          document_type: analysis.document_type,
          summary: analysis.summary,
          key_dates: [],
          missing_fields: [],
          checklist: analysis.recommendations || [],
          warnings: analysis.red_flags || [],
          raw_text: analysis.extracted_text,
          analysis_type: analysis.type === 'document' ? 'document' : analysis.type === 'scheme_list' ? 'text' : 'text',
          confidence: 0.9,
          extracted_schemes: extractedSchemes,
          verification_status: extractedSchemes.length > 0 ? 'verified' : 'needs_review'
        };

        setResult(finalResult);
      } else {
        throw new Error('Vision analysis returned no result');
      }
    } catch (err) {
      console.error('Vision analysis error:', err);
      // Fallback to AI chat if Gemini fails
      await analyzeWithVisionFallback();
    } finally {
      setProcessing(false);
      setVerifyingSchemes(false);
    }
  }

  // Verify scheme against official sources using AI
  async function verifySchemeWithAI(schemeName: string, context: string): Promise<{
    verified: boolean;
    official_url: string | null;
    details: string | null;
    apply_link: string | null;
    department: string | null;
  }> {
    try {
      const verificationPrompt = `You are a government schemes verification expert for India.

A user has an image/text that mentions: "${schemeName}"

Context from the image: ${context.substring(0, 500)}

TASK: Verify if this is a real Indian government scheme and provide official details.

Respond in this EXACT JSON format:
{
  "verified": true or false,
  "official_name": "full official name of the scheme",
  "department": "relevant ministry/department",
  "official_url": "official website URL",
  "apply_link": "direct application URL if different",
  "details": "brief description of what the scheme offers",
  "eligibility": "who can apply",
  "benefits": "what benefits are provided"
}`;

      let response = '';
      for await (const token of ai.chat([
        { role: 'system', content: 'You are a government schemes expert. Always respond with valid JSON.' },
        { role: 'user', content: verificationPrompt }
      ])) {
        response += token;
      }

      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return {
          verified: data.verified || false,
          official_url: data.official_url || data.apply_link || null,
          details: data.details ? `${data.official_name || schemeName}: ${data.details}\n\nEligibility: ${data.eligibility || 'Check official website'}\nBenefits: ${data.benefits || 'Check official website'}` : null,
          apply_link: data.apply_link || data.official_url || null,
          department: data.department || null
        };
      }
    } catch (err) {
      console.error('Scheme verification error:', err);
    }

    return {
      verified: false,
      official_url: null,
      details: null,
      apply_link: null,
      department: null
    };
  }

  // Fallback analysis using AI chat
  async function analyzeWithVisionFallback() {
    if (!imageBase64) return;

    try {
      const visionPrompt = `You are Bharat Lens AI. Analyze this image and respond with:

**TYPE:** [document|text_message|screenshot|link|form|certificate|unknown]
**SCAM_STATUS:** [YES or NO]
**DOCUMENT_TYPE:** [type or not_applicable]
**SUMMARY:** [detailed description of what you see in the image]
**EXTRACTED_TEXT:** [ALL readable text from the image, transcribed exactly]
**SCHEMES_FOUND:** [any government scheme names mentioned - comma separated or "none"]
**RED_FLAGS:** [any suspicious elements - comma separated or "none"]
**RECOMMENDATIONS:** [what user should do - comma separated or "none"]`;

      let aiResponse = '';
      
      // Since we can't send images to ai.chat, analyze the context
      for await (const token of ai.chat([
        { role: 'system', content: 'You are Bharat Lens AI with vision capabilities. When asked to analyze images, carefully examine ALL content.' },
        { role: 'user', content: `${visionPrompt}\n\nNote: The user has uploaded an image that needs analysis. Since I cannot see the image directly, please ask them to describe what they see or use the text input option for now.` }
      ])) {
        aiResponse += token;
      }

      // Show message about image analysis
      setResult({
        is_scam: false,
        document_type: null,
        summary: 'Image uploaded. For best results with text extraction, please also describe what you see or use the Text tab to paste any text from the image.',
        key_dates: [],
        missing_fields: [],
        checklist: ['Try using the Text tab to paste text from the image', 'Describe the image contents for better analysis'],
        warnings: [],
        analysis_type: 'text',
        verification_status: 'needs_review'
      });
    } catch (err) {
      console.error('Fallback analysis error:', err);
      setError('Failed to analyze image. Please try again or use text input.');
    }
  }

  // Analyze text content
  async function analyzeWithAI(content: string, analysisType: 'direct_text' | 'link') {
    setProcessing(true);
    setError('');
    setVerifyingSchemes(true);

    try {
      const systemPrompt = `You are Bharat Lens AI, an expert at analyzing content for Indian citizens.

Analyze this content and look for:
1. Any government scheme names mentioned
2. Whether it appears to be a scam
3. Any red flags or suspicious elements

Respond in this EXACT format:
**TYPE:** [document|text_message|link|scheme_list|unknown]
**SCAM_STATUS:** [YES if scam, NO otherwise]
**DOCUMENT_TYPE:** [type or not_applicable]
**SUMMARY:** [clear explanation]
**EXTRACTED_TEXT:** [original text or empty]
**SCHEMES_FOUND:** [government schemes mentioned - comma separated or "none"]
**RED_FLAGS:** [warning signs - comma separated or "none"]
**RECOMMENDATIONS:** [action items - comma separated or "none"]
**WHY_SCAM_IF_YES:** [brief explanation if scam]`;

      let aiResponse = '';
      
      const userContent = analysisType === 'link' 
        ? `Analyze this link/URL: ${content}`
        : `Analyze this content:\n\n${content}`;

      for await (const token of ai.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ])) {
        aiResponse += token;
      }

      // Parse response for schemes
      const schemesFound = extractSchemesFromResponse(aiResponse);
      const extractedSchemes: ExtractedScheme[] = [];

      for (const schemeName of schemesFound) {
        const verified = await verifySchemeWithAI(schemeName, content);
        extractedSchemes.push({
          name: schemeName,
          mentioned: true,
          verified: verified.verified,
          official_url: verified.official_url,
          details: verified.details,
          apply_link: verified.apply_link,
          department: verified.department
        });
      }

      const parsed = parseAIResponse(aiResponse);
      parsed.extracted_schemes = extractedSchemes;
      parsed.verification_status = extractedSchemes.length > 0 ? 'verified' : 'needs_review';
      
      setResult(parsed);
      
    } catch (err) {
      console.error('Analysis error:', err);
      setError(t('common.error', lang));
    } finally {
      setProcessing(false);
      setVerifyingSchemes(false);
    }
  }

  function extractSchemesFromResponse(response: string): string[] {
    const schemes: string[] = [];
    const schemesMatch = response.match(/\*\*SCHEMES_FOUND:\*\*(.+?)(?:\n|$)/i);
    
    if (schemesMatch) {
      const schemesText = schemesMatch[1].replace(/\*\*/g, '').trim();
      if (schemesText !== 'none' && schemesText !== 'not_applicable') {
        schemesText.split(',').forEach(s => {
          const trimmed = s.trim();
          if (trimmed && trimmed.length > 2) {
            schemes.push(trimmed);
          }
        });
      }
    }
    
    return schemes;
  }

  function parseAIResponse(response: string): ScanResult {
    const result: ScanResult = {
      is_scam: false,
      document_type: null,
      summary: 'Unable to analyze content.',
      key_dates: [],
      missing_fields: [],
      checklist: [],
      warnings: [],
      analysis_type: 'text',
    };

    const lines = response.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('**TYPE:**')) {
        const val = trimmed.replace('**TYPE:**', '').replace(/\*\*/g, '').trim().toLowerCase();
        if (val.includes('document') || val.includes('certificate') || val.includes('form')) {
          result.analysis_type = 'document';
        }
      } 
      else if (trimmed.startsWith('**SCAM_STATUS:**')) {
        result.is_scam = trimmed.replace('**SCAM_STATUS:**', '').replace(/\*\*/g, '').trim().toUpperCase().includes('YES');
      }
      else if (trimmed.startsWith('**DOCUMENT_TYPE:**')) {
        const val = trimmed.replace('**DOCUMENT_TYPE:**', '').replace(/\*\*/g, '').trim();
        if (val && val !== 'not_applicable') result.document_type = val;
      }
      else if (trimmed.startsWith('**SUMMARY:**')) {
        result.summary = trimmed.replace('**SUMMARY:**', '').replace(/\*\*/g, '').trim();
      }
      else if (trimmed.startsWith('**EXTRACTED_TEXT:**')) {
        const val = trimmed.replace('**EXTRACTED_TEXT:**', '').replace(/\*\*/g, '').trim();
        if (val && val !== 'empty' && val !== 'none') result.raw_text = val;
      }
      else if (trimmed.startsWith('**KEY_INFORMATION:**')) {
        const val = trimmed.replace('**KEY_INFORMATION:**', '').replace(/\*\*/g, '').trim();
        if (val && val !== 'none') {
          result.key_dates = val.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
      else if (trimmed.startsWith('**RED_FLAGS:**')) {
        const val = trimmed.replace('**RED_FLAGS:**', '').replace(/\*\*/g, '').trim();
        if (val && val !== 'none') {
          result.warnings = val.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
      else if (trimmed.startsWith('**RECOMMENDATIONS:**')) {
        const val = trimmed.replace('**RECOMMENDATIONS:**', '').replace(/\*\*/g, '').trim();
        if (val && val !== 'none') {
          result.checklist = val.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
      else if (trimmed.startsWith('**WHY_SCAM_IF_YES:**')) {
        const val = trimmed.replace('**WHY_SCAM_IF_YES:**', '').replace(/\*\*/g, '').trim();
        if (val && val !== 'not_applicable' && val !== 'none') {
          result.warnings.unshift(val);
        }
      }
    }

    if (result.is_scam && result.warnings.length === 0) {
      result.warnings.push('This content has been identified as potentially fraudulent');
    }

    return result;
  }

  // Fetch live scheme updates from government sources
  async function fetchLiveSchemeUpdates() {
    setProcessing(true);
    setError('');

    try {
      const updatePrompt = `You are a government schemes expert. Search your knowledge for the LATEST Indian government schemes announced in 2024-2025.

Focus on:
1. New schemes announced by central government
2. New state-specific schemes
3. Recently updated benefits or eligibility criteria
4. New digital initiatives for citizens

Provide a list of NEW schemes not widely known, with:
- Scheme name
- Official website URL
- Brief description
- Who is eligible
- How to apply

Respond in this EXACT JSON format:
{
  "update_time": "current timestamp",
  "source": "official government sources",
  "new_schemes": [
    {
      "name": "scheme name",
      "url": "official website",
      "description": "brief description",
      "eligibility": "who can apply",
      "benefits": "what you get",
      "how_to_apply": "application process"
    }
  ],
  "total_new_schemes": number
}`;

      let response = '';
      for await (const token of ai.chat([
        { role: 'system', content: 'You are a government schemes expert with up-to-date knowledge. Always respond with valid JSON.' },
        { role: 'user', content: updatePrompt }
      ])) {
        response += token;
      }

      // Parse and save to database
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        
        if (data.new_schemes && data.new_schemes.length > 0) {
          // Save new schemes to database
          for (const scheme of data.new_schemes) {
            await saveSchemeToDatabase(scheme);
          }
          
          setLiveUpdate({
            last_updated: new Date().toISOString(),
            source: 'Official Government Sources',
            new_schemes_count: data.new_schemes.length
          });
        }
      }
    } catch (err) {
      console.error('Live update error:', err);
      setError('Failed to fetch latest schemes. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  async function saveSchemeToDatabase(scheme: {
    name: string;
    url?: string;
    description?: string;
    eligibility?: string;
    benefits?: string;
    how_to_apply?: string;
  }) {
    try {
      // Check if scheme already exists
      const existing = await db.query(
        'SELECT id FROM schemes WHERE LOWER(title) = LOWER($1) LIMIT 1',
        [scheme.name]
      );

      if (existing.ok && existing.rows.length === 0) {
        // Insert new scheme
        await db.query(
          `INSERT INTO schemes (title, description, category, official_url, required_documents, source_verified_at, is_active)
           VALUES ($1, $2, $3, $4, $5, NOW(), true)`,
          [
            scheme.name,
            `${scheme.description || ''}\n\nEligibility: ${scheme.eligibility || 'Check website'}\nBenefits: ${scheme.benefits || 'Check website'}\nHow to Apply: ${scheme.how_to_apply || 'Check website'}`,
            'General',
            scheme.url || null,
            ['Aadhaar Card', 'Bank Account']
          ]
        );
      }
    } catch (err) {
      console.error('Error saving scheme:', err);
    }
  }

  async function handleAnalyzeImage() {
    if (!imageBase64) return;
    await analyzeWithGeminiVision(imageBase64);
  }

  async function handleAnalyzeText() {
    if (!textInput.trim()) return;
    await analyzeWithAI(textInput.trim(), 'direct_text');
  }

  async function handleAnalyzeLink() {
    if (!textInput.trim()) return;
    await analyzeWithAI(textInput.trim(), 'link');
  }

  async function handleSaveToVault() {
    if (!result) return;
    setSaving(true);
    setSaveSuccess('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveSuccess(t('vault.title', lang) + '!');
      setTimeout(() => navigate('/vault'), 1500);
    } catch {
      setError(t('common.error', lang));
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateChecklist() {
    if (!result) return;
    setSaving(true);
    setSaveSuccess('');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveSuccess(t('apps.progress', lang) + '!');
      setTimeout(() => navigate('/applications'), 1500);
    } catch {
      setError(t('common.error', lang));
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
        <h1 className="text-2xl font-bold text-white">{t('scan.title', lang)}</h1>
        <p className="text-white/70 mt-1">Analyze images for government schemes, documents, or scams</p>
      </div>

      <div className="px-6 py-6">
        {/* Live Updates Banner */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-800">Live Scheme Updates</p>
                <p className="text-sm text-green-600">
                  {liveUpdate 
                    ? `${liveUpdate.new_schemes_count} new schemes fetched`
                    : 'Auto-updates from government sources'}
                </p>
              </div>
            </div>
            <button
              onClick={fetchLiveSchemeUpdates}
              disabled={processing}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Check Updates
            </button>
          </div>
          {liveUpdate && (
            <p className="text-xs text-green-600 mt-2">
              Last updated: {new Date(liveUpdate.last_updated).toLocaleString()}
            </p>
          )}
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('image')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 ${
              mode === 'image'
                ? 'bg-[#1B3A6B] text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            <Camera className="w-5 h-5" />
            Image Scan
          </button>
          <button
            onClick={() => setMode('text')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 ${
              mode === 'text'
                ? 'bg-[#1B3A6B] text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            <FileText className="w-5 h-5" />
            Text Input
          </button>
        </div>

        {/* Image Mode */}
        {mode === 'image' && (
          <div className="space-y-4">
            {/* Upload Area */}
            {!image ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-[#1B3A6B]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-[#1B3A6B]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload an Image</h3>
                <p className="text-gray-500 mb-4">Scan documents, screenshots, or images containing scheme information</p>
                
                <div className="flex gap-3 justify-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-[#1B3A6B] text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    Upload Image
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-4">
                <div className="relative rounded-xl overflow-hidden mb-4">
                  <img src={image} alt="Uploaded" className="w-full h-auto max-h-80 object-contain bg-gray-50" />
                  <button
                    onClick={reset}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <button
                  onClick={handleAnalyzeImage}
                  disabled={processing}
                  className="w-full bg-[#1B3A6B] text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing Image...
                    </>
                  ) : (
                    <>
                      <Eye className="w-5 h-5" />
                      Analyze Image
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Text Mode */}
        {mode === 'text' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste text, message content, or enter a URL to analyze..."
                className="w-full h-40 p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] text-gray-800"
              />
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleAnalyzeText}
                  disabled={processing || !textInput.trim()}
                  className="flex-1 bg-[#1B3A6B] text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <FileSearch className="w-5 h-5" />
                  )}
                  Analyze Text
                </button>
                <button
                  onClick={handleAnalyzeLink}
                  disabled={processing || !textInput.trim()}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Globe className="w-5 h-5" />
                  Check Link
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">What can I analyze?</p>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>• Text messages claiming to be from government</li>
                    <li>• URLs claiming to be official government sites</li>
                    <li>• Descriptions of government schemes</li>
                    <li>• Any suspicious government-related content</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Processing Indicator */}
        {processing && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-4 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="font-medium text-blue-800">
              {verifyingSchemes ? 'Verifying schemes with official sources...' : 'Analyzing content...'}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              {verifyingSchemes 
                ? 'Cross-referencing with government databases'
                : 'Extracting text and identifying schemes'}
            </p>
          </div>
        )}

        {/* Results */}
        {result && !processing && (
          <div className="space-y-4 mt-6">
            {/* Scam Warning */}
            {result.is_scam && (
              <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-bold text-red-800 text-lg">⚠️ Scam Detected!</p>
                    <p className="text-red-600">This content appears to be fraudulent</p>
                  </div>
                </div>
                {result.warnings.map((warning, i) => (
                  <div key={i} className="flex items-start gap-2 text-red-700 mb-2">
                    <X className="w-4 h-4 mt-1 flex-shrink-0" />
                    <span>{warning}</span>
                  </div>
                ))}
                <div className="mt-4 p-3 bg-red-100 rounded-lg">
                  <p className="text-sm font-medium text-red-800">What to do:</p>
                  <ul className="text-sm text-red-700 mt-1 space-y-1">
                    <li>• Do NOT click any links</li>
                    <li>• Do NOT share personal information</li>
                    <li>• Report to cyber crime helpline: 1930</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Extracted Schemes */}
            {result.extracted_schemes && result.extracted_schemes.length > 0 && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-green-800 text-lg">Government Schemes Found</p>
                    <p className="text-green-600 text-sm">{result.extracted_schemes.length} scheme(s) detected and verified</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {result.extracted_schemes.map((scheme, index) => (
                    <div key={index} className="bg-white rounded-xl p-4 border border-green-100">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-800">{scheme.name}</h4>
                          {scheme.department && (
                            <p className="text-sm text-gray-500">{scheme.department}</p>
                          )}
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          scheme.verified 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {scheme.verified ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              Needs Review
                            </>
                          )}
                        </div>
                      </div>
                      
                      {scheme.details && (
                        <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{scheme.details}</p>
                      )}
                      
                      <div className="flex gap-2 mt-3">
                        {scheme.official_url && (
                          <a
                            href={scheme.official_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Official Website
                          </a>
                        )}
                        {scheme.apply_link && scheme.apply_link !== scheme.official_url && (
                          <a
                            href={scheme.apply_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Apply Now
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Document Analysis */}
            {result.document_type && !result.is_scam && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Document Type: {result.document_type}</p>
                    <p className="text-sm text-gray-500">{result.summary}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Extracted Text */}
            {result.raw_text && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileSearch className="w-5 h-5 text-gray-600" />
                  Extracted Text
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 max-h-60 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">{result.raw_text}</pre>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.checklist.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Recommendations
                </h3>
                <ul className="space-y-2">
                  {result.checklist.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <ChevronRight className="w-4 h-4 mt-1 text-[#1B3A6B]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Verification Status */}
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <SearchCheck className="w-4 h-4" />
                Verification Status: 
                <span className={`font-medium ${
                  result.verification_status === 'verified' ? 'text-green-600' : 
                  result.verification_status === 'needs_review' ? 'text-yellow-600' : 
                  'text-gray-600'
                }`}>
                  {result.verification_status === 'verified' ? 'Verified' : 
                   result.verification_status === 'needs_review' ? 'Needs Manual Review' : 
                   'Complete'}
                </span>
              </div>
              <button
                onClick={() => result.extracted_schemes?.[0]?.official_url && 
                  window.open(result.extracted_schemes[0].official_url, '_blank')}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Visit Official Source
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSaveToVault}
                disabled={saving}
                className="flex-1 bg-[#1B3A6B] text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save to Vault
              </button>
              <button
                onClick={handleCreateChecklist}
                disabled={saving}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                Create Checklist
              </button>
            </div>
          </div>
        )}

        {/* Save Success */}
        {saveSuccess && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {saveSuccess}
          </div>
        )}
      </div>
    </div>
  );
}
