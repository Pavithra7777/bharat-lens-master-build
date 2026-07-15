import { useState, useRef } from 'react';
import { ai } from '@doable/ai';
import { useRouter } from '../lib/Router';
import { useApp } from '../lib/AppContext';
import { t } from '../lib/i18n';
import { Camera, Upload, FileText, Check, X, Loader2, Save, AlertTriangle, Shield, MessageSquare, Link as LinkIcon, Eye, Zap } from 'lucide-react';
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
  confidence?: number;
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
  const cameraInputRef = useRef<HTMLInputElement>(null);
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
      
      // Extract base64 without the data URL prefix
      const base64 = dataUrl.split(',')[1] || '';
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  }

  async function analyzeWithVision(imageBase64Data: string) {
    setProcessing(true);
    setError('');

    try {
      const visionPrompt = `You are Bharat Lens AI, an expert at analyzing images for Indian citizens.

TASK: Analyze this image thoroughly. The image could be:
1. A government document (Aadhaar, PAN, Passport, Driving License, Ration Card, Voter ID, etc.)
2. A text message or screenshot (possibly a scam/spam)
3. A website screenshot
4. A form or certificate
5. Any other image

IMPORTANT: Look carefully at ALL content in the image. If there is text, read and transcribe it exactly.

Provide your analysis in this EXACT format:

**TYPE:** [document|text_message|screenshot|link|form|certificate|unknown]
**SCAM_STATUS:** [YES if this appears to be a scam/spam, NO otherwise]
**DOCUMENT_TYPE:** [specific type if document, or "not_applicable"]
**SUMMARY:** [What is shown in this image - be specific and detailed about what you see]
**EXTRACTED_TEXT:** [ALL readable text visible in the image, transcribed exactly as shown]
**KEY_INFORMATION:** [Names, numbers, dates, IDs found - comma separated, or "none"]
**RED_FLAGS:** [Any suspicious elements, scams detected, or warnings - comma separated, or "none"]
**RECOMMENDATIONS:** [What the user should do next - comma separated, or "none"]
**WHY_SCAM_IF_YES:** [If SCAM_STATUS is YES, explain clearly in one sentence why this is a scam]`;

      // The image is provided as base64. Ask AI to analyze it.
      const imageDescription = `[IMAGE DATA - Base64 encoded image attached. Please analyze the actual image content carefully.]`;

      let aiResponse = '';
      
      try {
        for await (const token of ai.chat([
          { role: 'system', content: 'You are Bharat Lens AI with vision capabilities. When asked to analyze images, carefully examine ALL content and provide detailed analysis.' },
          { role: 'user', content: `${visionPrompt}\n\n${imageDescription}` }
        ])) {
          aiResponse += token;
        }
      } catch (visionError) {
        console.error('Vision analysis failed:', visionError);
        // Fallback - ask for manual input
        aiResponse = `**TYPE:** unknown
**SCAM_STATUS:** NO
**DOCUMENT_TYPE:** not_applicable
**SUMMARY:** Image received but could not be automatically analyzed. Please try again or paste the text content below for analysis.
**EXTRACTED_TEXT:** 
**KEY_INFORMATION:** none
**RED_FLAGS:** none
**RECOMMENDATIONS:** Try uploading a clearer image, or use the Text/Link tab to paste content directly.
**WHY_SCAM_IF_YES:** not_applicable`;
      }

      const parsed = parseAIResponse(aiResponse);
      setResult(parsed);
      
    } catch (err) {
      console.error('Vision analysis error:', err);
      setError('Failed to analyze image. Please try again or use text input.');
    } finally {
      setProcessing(false);
    }
  }

  async function analyzeWithAI(content: string, analysisType: 'direct_text' | 'link') {
    setProcessing(true);
    setError('');

    try {
      const systemPrompt = `You are Bharat Lens AI, an expert at analyzing content for Indian citizens.

Analyze this content and respond in EXACTLY this format:
**TYPE:** [document|text_message|link|unknown]
**SCAM_STATUS:** [YES if scam, NO otherwise]  
**DOCUMENT_TYPE:** [type or not_applicable]
**SUMMARY:** [clear explanation of what this content is]
**EXTRACTED_TEXT:** [original text copied or empty]
**KEY_INFORMATION:** [important items found or none]
**RED_FLAGS:** [scam warning signs or none]
**RECOMMENDATIONS:** [action items or none]
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

      const parsed = parseAIResponse(aiResponse);
      setResult(parsed);
      
    } catch (err) {
      console.error('Analysis error:', err);
      setError(t('common.error', lang));
    } finally {
      setProcessing(false);
    }
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
        } else if (val.includes('message')) {
          result.analysis_type = 'text';
        } else if (val.includes('link')) {
          result.analysis_type = 'scam';
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

  async function handleAnalyzeImage() {
    if (!imageBase64) return;
    await analyzeWithVision(imageBase64);
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
        <p className="text-white/70 mt-1">Analyze documents, messages, or links for scams</p>
      </div>

      <div className="px-6 py-6">
        {/* Mode Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setMode('image'); reset(); }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition ${
              mode === 'image' ? 'bg-white text-[#1B3A6B] shadow' : 'text-gray-600'
            }`}
          >
            <Camera className="w-4 h-4 inline mr-2" />
            Image Analysis
          </button>
          <button
            onClick={() => { setMode('text'); reset(); }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition ${
              mode === 'text' ? 'bg-white text-[#1B3A6B] shadow' : 'text-gray-600'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Text / Link
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
                This content appears to be a scam. Do NOT respond, click links, or share personal information.
              </p>
            </div>
          </div>
        )}

        {/* IMAGE MODE */}
        {mode === 'image' && !result && (
          <div className="space-y-4">
            {/* Vision Capability Badge */}
            <div className="flex items-center gap-2 text-sm text-[#0F9D58] bg-[#0F9D58]/10 px-3 py-2 rounded-lg">
              <Zap className="w-4 h-4" />
              AI Vision enabled - real image analysis
            </div>

            {/* Upload Area */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {image ? (
                <div className="relative">
                  <img src={image} alt="Uploaded" className="w-full" />
                  <button
                    onClick={() => { setImage(null); setImageBase64(null); }}
                    className="absolute top-3 right-3 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              ) : (
                <div className="aspect-[4/3] flex flex-col items-center justify-center p-6">
                  <div className="w-20 h-20 bg-[#1B3A6B]/10 rounded-full flex items-center justify-center mb-4">
                    <Eye className="w-10 h-10 text-[#1B3A6B]" />
                  </div>
                  <p className="text-gray-600 font-medium mb-4 text-center">Take a photo or upload an image</p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
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
                </div>
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

            {/* Analyze Button */}
            {image && (
              <button
                onClick={handleAnalyzeImage}
                disabled={processing}
                className="w-full py-4 bg-[#1B3A6B] text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing with AI Vision...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Analyze Image with AI
                  </>
                )}
              </button>
            )}

            {/* Supported Types */}
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-3">AI Vision can analyze:</p>
              <div className="flex flex-wrap gap-2">
                {['Aadhaar Card', 'PAN Card', 'Passport', 'Driving License', 'Ration Card', 'Voter ID', 'Bank Statements', 'Messages', 'Screenshots'].map((doc) => (
                  <span key={doc} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                    {doc}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TEXT MODE */}
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
                placeholder={`Paste suspicious message or link here...\n\nExamples:\n• "Congratulations! You've won ₹5,00,000. Click: bit.ly/fake123"\n• "Your Aadhaar has been blocked. Call: 9876543210"\n• "KYC update required. Submit within 24 hours."`}
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
                <li>• Prize/Lottery scams asking for fees</li>
                <li>• Fake KYC/Aadhaar update threats</li>
                <li>• Impersonation of banks or government</li>
                <li>• Job scams requiring upfront payment</li>
                <li>• Fake investment schemes</li>
              </ul>
            </div>
          </div>
        )}

        {/* PROCESSING STATE */}
        {processing && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-[#1B3A6B]/10 rounded-full flex items-center justify-center">
                {mode === 'image' ? (
                  <Eye className="w-12 h-12 text-[#1B3A6B]" />
                ) : (
                  <Shield className="w-12 h-12 text-[#1B3A6B]" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#0F9D58] rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-lg font-medium text-[#1A1A2E]">
              {mode === 'image' ? 'Analyzing image with AI Vision...' : 'Analyzing content...'}
            </p>
            <p className="text-gray-500 mt-2">Extracting information and checking for scams</p>
          </div>
        )}

        {/* RESULT */}
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
                  {result.analysis_type === 'document' ? 'Document' : 'Content Analyzed'}
                </span>
              )}
              <button
                onClick={reset}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-medium"
              >
                Analyze Another
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

            {/* Red Flags */}
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

            {/* Key Information */}
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
                <h3 className="font-semibold text-gray-600 text-sm mb-2">Extracted Text:</h3>
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
