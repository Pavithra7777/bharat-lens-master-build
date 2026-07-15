import { useState, useRef } from 'react';
import { ai } from '@doable/ai';
import { useRouter } from '../lib/Router';
import { useApp } from '../lib/AppContext';
import { t } from '../lib/i18n';
import { Camera, Upload, FileText, Check, X, Loader2, Save, AlertTriangle, Shield, MessageSquare, Link as LinkIcon } from 'lucide-react';
import type { Language } from '../lib/i18n';

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
}

export function ScanPage() {
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [textInput, setTextInput] = useState('');
  const [mode, setMode] = useState<'image' | 'text'>('text');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { navigate } = useRouter();
  const { language } = useApp();
  const lang = language as Language;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function analyzeWithAI(content: string, analysisType: 'image_text' | 'direct_text' | 'link') {
    setProcessing(true);
    setError('');

    try {
      const systemPrompt = `You are Bharat Lens AI, an expert at analyzing content for Indian citizens.

Analyze this content thoroughly and provide a detailed analysis. The content could be:
1. A government document text (Aadhaar, PAN, Passport, Ration Card, Driving License, etc.)
2. A text message or screenshot content (possibly a scam/spam message)
3. A website link or URL
4. Any other type of text content

Your task:
1. First, determine what type of content this is
2. If it appears to be a scam/spam message or suspicious link, mark it as dangerous and explain why clearly
3. If it's a document, summarize what's in it and provide relevant information
4. Identify any key dates, numbers, or important information
5. Provide clear warnings if anything seems suspicious

IMPORTANT: Be direct and clear. If it's a scam, say "SCAM: YES" and explain exactly why. Don't be diplomatic about scams - citizens need to know clearly.

Respond in this EXACT format (don't skip any fields, use | as separator):
TYPE: [document|text_message|link|unknown]
SCAM_STATUS: [YES|NO]
DOCUMENT_TYPE: [if it's a document, what type|not_applicable]
SUMMARY: [detailed explanation of what's in the content in simple language, be specific]
RAW_TEXT: [the original text as provided|empty]
KEY_INFO: [any important numbers, dates, names found, comma separated|empty]
RECOMMENDATIONS: [what to do with this, comma separated|empty]
MISSING_INFO: [any missing information if document|empty]
WARNING_DETAILS: [if SCAM_STATUS is YES, list ALL red flags found, comma separated|not_applicable]
WHY_SCAM: [if SCAM_STATUS is YES, explain clearly in 1-2 sentences why this is a scam]`;

      let aiResponse = '';
      
      try {
        let userContent = '';
        
        if (analysisType === 'link') {
          userContent = `Please analyze this link/URL: ${content}`;
        } else {
          userContent = `Please analyze this content:\n\n${content}`;
        }

        for await (const token of ai.chat([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ])) {
          aiResponse += token;
        }
      } catch (aiError) {
        console.error('AI analysis failed:', aiError);
        throw new Error('Failed to analyze content');
      }

      const parsed = parseAIResponse(aiResponse);
      setResult(parsed);
      
    } catch (err) {
      console.error('Process error:', err);
      setError(t('common.error', lang));
    } finally {
      setProcessing(false);
    }
  }

  function parseAIResponse(response: string): ScanResult {
    const lines = response.split('\n');
    const result: ScanResult = {
      is_scam: false,
      document_type: null,
      summary: '',
      key_dates: [],
      missing_fields: [],
      checklist: [],
      warnings: [],
      analysis_type: 'text',
    };

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('TYPE:')) {
        const val = trimmed.replace('TYPE:', '').trim().toLowerCase();
        if (val.includes('document')) {
          result.analysis_type = 'document';
        } else if (val.includes('message') || val.includes('text')) {
          result.analysis_type = 'text';
        } else if (val.includes('link')) {
          result.analysis_type = 'scam';
        }
      } else if (trimmed.startsWith('SCAM_STATUS:')) {
        result.is_scam = trimmed.toUpperCase().includes('YES');
      } else if (trimmed.startsWith('DOCUMENT_TYPE:')) {
        const val = trimmed.replace('DOCUMENT_TYPE:', '').trim();
        if (val && val !== 'not_applicable') result.document_type = val;
      } else if (trimmed.startsWith('SUMMARY:')) {
        result.summary = trimmed.replace('SUMMARY:', '').trim();
      } else if (trimmed.startsWith('RAW_TEXT:')) {
        const val = trimmed.replace('RAW_TEXT:', '').trim();
        if (val && val !== 'empty') result.raw_text = val;
      } else if (trimmed.startsWith('KEY_INFO:')) {
        const val = trimmed.replace('KEY_INFO:', '').trim();
        if (val && val !== 'empty') {
          result.key_dates = val.split(',').map(s => s.trim()).filter(Boolean);
        }
      } else if (trimmed.startsWith('RECOMMENDATIONS:')) {
        const val = trimmed.replace('RECOMMENDATIONS:', '').trim();
        if (val && val !== 'empty') {
          result.checklist = val.split(',').map(s => s.trim()).filter(Boolean);
        }
      } else if (trimmed.startsWith('MISSING_INFO:')) {
        const val = trimmed.replace('MISSING_INFO:', '').trim();
        if (val && val !== 'empty') {
          result.missing_fields = val.split(',').map(s => s.trim()).filter(Boolean);
        }
      } else if (trimmed.startsWith('WARNING_DETAILS:')) {
        const val = trimmed.replace('WARNING_DETAILS:', '').trim();
        if (val && val !== 'not_applicable') {
          result.warnings = val.split(',').map(s => s.trim()).filter(Boolean);
        }
      } else if (trimmed.startsWith('WHY_SCAM:')) {
        const val = trimmed.replace('WHY_SCAM:', '').trim();
        if (val && val !== 'not_applicable') {
          result.warnings.unshift(val);
        }
      }
    }

    // If it's marked as scam
    if (result.is_scam && result.warnings.length === 0) {
      result.warnings.push('This content has been identified as potentially fraudulent');
    }

    return result;
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
      setTimeout(() => {
        navigate('/vault');
      }, 1500);
    } catch (err) {
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
      setTimeout(() => {
        navigate('/applications');
      }, 1500);
    } catch (err) {
      setError(t('common.error', lang));
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setImage(null);
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
        <p className="text-white/70 mt-1">Analyze documents, messages, or links for scams</p>
      </div>

      <div className="px-6 py-6">
        {/* Mode Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setMode('text'); reset(); }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition ${
              mode === 'text' ? 'bg-white text-[#1B3A6B] shadow' : 'text-gray-600'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Text / Message
          </button>
          <button
            onClick={() => { setMode('image'); reset(); }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition ${
              mode === 'image' ? 'bg-white text-[#1B3A6B] shadow' : 'text-gray-600'
            }`}
          >
            <Camera className="w-4 h-4 inline mr-2" />
            Image
          </button>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 flex items-center gap-2">
            <Check className="w-5 h-5" />
            {saveSuccess}
          </div>
        )}

        {/* Scam Warning Banner */}
        {result?.is_scam && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-600">⚠️ SCAM DETECTED!</p>
              <p className="text-red-600/80 text-sm mt-1">
                This content appears to be a scam or spam. Do not respond, click any links, or share any personal information.
              </p>
            </div>
          </div>
        )}

        {/* Text Input Mode */}
        {mode === 'text' && !result && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <h3 className="font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#1B3A6B]" />
                Check for Scams
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                Paste a suspicious message, link, or any text you want to check
              </p>
              
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={`Paste suspicious message or link here...\n\nExamples:\n• "Congratulations! You've won ₹5,00,000. Click here to claim: bit.ly/fake123"\n• "Your Aadhaar has been blocked. Call immediately: 9876543210"\n• "KYC update required. Submit within 24 hours or account will be closed."`}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl resize-none outline-none focus:ring-2 focus:ring-[#1B3A6B] transition"
                rows={6}
              />
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleAnalyzeText}
                  disabled={!textInput.trim() || processing}
                  className="flex-1 py-3 bg-[#1B3A6B] text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  {processing ? 'Analyzing...' : 'Analyze Text'}
                </button>
                <button
                  onClick={handleAnalyzeLink}
                  disabled={!textInput.trim() || processing}
                  className="flex-1 py-3 border-2 border-[#1B3A6B] text-[#1B3A6B] rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                  {processing ? 'Checking...' : 'Check Link'}
                </button>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <h4 className="font-semibold text-amber-800 mb-2">🔍 Common Scam Types</h4>
              <ul className="text-amber-700 text-sm space-y-1">
                <li>• Prize/Lottery scams asking for processing fees</li>
                <li>• Fake KYC/Aadhaar update threats</li>
                <li>• Impersonation of banks or government officials</li>
                <li>• Job scam requiring upfront payment</li>
                <li>• Fake investment schemes with high returns</li>
              </ul>
            </div>
          </div>
        )}

        {/* Image Mode */}
        {mode === 'image' && !result && (
          <div className="space-y-4">
            <div className="aspect-[4/3] bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-6">
              {image ? (
                <div className="relative w-full rounded-xl overflow-hidden">
                  <img src={image} alt="Uploaded" className="w-full" />
                  <button
                    onClick={() => setImage(null)}
                    className="absolute top-3 right-3 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              ) : (
                <>
                  <FileText className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-gray-600 font-medium mb-4 text-center">Take a photo or upload an image</p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-6 py-3 bg-[#1B3A6B] text-white rounded-xl font-medium flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      {t('scan.takePhoto', lang)}
                    </button>
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-white border-2 border-[#1B3A6B] text-[#1B3A6B] rounded-xl font-medium flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {t('scan.uploadFile', lang)}
                    </button>
                  </div>
                </>
              )}
              
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {image && (
              <button
                onClick={() => analyzeWithAI('Image uploaded for analysis', 'image_text')}
                disabled={processing}
                className="w-full py-3 bg-[#1B3A6B] text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                {processing ? 'Analyzing...' : 'Analyze Image'}
              </button>
            )}

            <p className="text-gray-500 text-sm text-center">
              Note: For best results, paste the text from screenshots below
            </p>
          </div>
        )}

        {/* Processing State */}
        {processing && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-[#1B3A6B]/10 rounded-full flex items-center justify-center mb-6">
              <Loader2 className="w-10 h-10 text-[#1B3A6B] animate-spin" />
            </div>
            <p className="text-lg font-medium text-[#1A1A2E]">{t('scan.processing', lang)}</p>
            <p className="text-gray-500 mt-2">Analyzing content with AI...</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            {/* Type Badge */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              {result.is_scam ? (
                <span className="px-4 py-2 bg-red-100 text-red-600 rounded-xl font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  SCAM DETECTED
                </span>
              ) : result.document_type ? (
                <span className="px-4 py-2 bg-[#0F9D58]/10 text-[#0F9D58] rounded-xl font-medium">
                  {result.document_type}
                </span>
              ) : (
                <span className="px-4 py-2 bg-blue-100 text-blue-600 rounded-xl font-medium">
                  {result.analysis_type === 'document' ? 'Document' : 'Message Analyzed'}
                </span>
              )}
              <button
                onClick={reset}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-medium"
              >
                Check Another
              </button>
            </div>

            {/* Summary Card */}
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <h3 className="font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#1B3A6B]" />
                Analysis Result
              </h3>
              <p className="text-gray-600 leading-relaxed">{result.summary}</p>
            </div>

            {/* Warnings (for scams) */}
            {result.warnings.length > 0 && (
              <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                <h3 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Red Flags Found
                </h3>
                <ul className="space-y-2">
                  {result.warnings.map((warning, i) => (
                    <li key={i} className="flex items-start gap-2 text-red-600/80">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key Info */}
            {result.key_dates.length > 0 && (
              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <h3 className="font-semibold text-[#1A1A2E] mb-3">Key Information Found</h3>
                <div className="space-y-2">
                  {result.key_dates.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#FF7A00] rounded-full" />
                      <span className="text-gray-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.checklist.length > 0 && (
              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <h3 className="font-semibold text-[#1A1A2E] mb-3">Recommendations</h3>
                <div className="space-y-2">
                  {result.checklist.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 border-2 border-gray-300 rounded flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Info */}
            {result.missing_fields.length > 0 && (
              <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
                <h3 className="font-semibold text-amber-600 mb-3">Missing Information</h3>
                <ul className="space-y-2">
                  {result.missing_fields.map((field, i) => (
                    <li key={i} className="flex items-start gap-2 text-amber-600/80">
                      <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                      {field}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Raw Text */}
            {result.raw_text && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-600 text-sm mb-2">Original Text:</h3>
                <p className="text-gray-500 text-sm whitespace-pre-wrap font-mono">{result.raw_text}</p>
              </div>
            )}

            {/* Action Buttons */}
            {!result.is_scam && (
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleSaveToVault}
                  disabled={saving}
                  className="flex-1 py-4 bg-[#1B3A6B] text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {t('scan.saveToVault', lang)}
                </button>
                <button
                  onClick={handleCreateChecklist}
                  disabled={saving}
                  className="flex-1 py-4 border-2 border-[#1B3A6B] text-[#1B3A6B] rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {t('scan.createChecklist', lang)}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-2">
            <X className="w-5 h-5" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
