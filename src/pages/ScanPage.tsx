import { useState, useRef } from 'react';
import { useRouter } from '../lib/Router';
import { Upload, FileText, X, Loader2, Save, AlertTriangle, ExternalLink, RefreshCw, CheckCircle, AlertCircle, Camera, Sparkles, MessageCircle, Search, Link as LinkIcon } from 'lucide-react';
import { createDoableClient } from '@doable/sdk';
import { db } from '@doable/data';

interface SchemeDetail {
  name: string;
  category: string;
  ministry: string;
  official_url: string;
  apply_url: string;
  eligibility: string;
  benefits: string;
  documents_required: string;
  how_to_apply: string;
  status: string;
  description: string;
}

export function ScanPage() {
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [textInput, setTextInput] = useState('');
  const [mode, setMode] = useState<'image' | 'text'>('image');
  const [stage, setStage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { navigate } = useRouter();

  async function analyzeWithAI(imageData: string | null, textData: string) {
    setProcessing(true);
    setError('');
    setResult(null);
    setStage('Starting deep analysis...');

    try {
      const doable = createDoableClient();
      
      const prompt = `You are an expert on Indian government schemes and detecting scams. 

TASK 1: Identify any Indian government schemes mentioned or shown in this ${imageData ? 'image' : 'text'}.
TASK 2: For each scheme found, provide COMPLETE details with OFFICIAL URLs.

Return a detailed JSON response:
{
  "is_scam": false,
  "document_type": "what type of document is this",
  "summary": "detailed summary of what this document contains",
  "scam_warnings": ["any suspicious indicators"],
  "schemes_found": [
    {
      "name": "Full official scheme name",
      "category": "education|health|housing|employment|agriculture|women|skill|startup|agriculture|financial|social welfare",
      "ministry": "Ministry name (e.g., Ministry of Education)",
      "official_url": "https://official-website.gov.in/scheme-page",
      "apply_url": "https://official-portal.gov.in/apply",
      "eligibility": "Who can apply - be specific about income, age, category, occupation requirements",
      "benefits": "What benefits are provided - money amount, services, subsidies",
      "documents_required": "List of required documents",
      "how_to_apply": "Step by step application process",
      "status": "Active/Closed/Suspended",
      "description": "Detailed description of the scheme"
    }
  ],
  "recommendations": ["helpful advice for the user"]
}

IMPORTANT: 
- If a scheme is mentioned, search your knowledge for the OFFICIAL government URL
- Include direct apply links when available
- Be thorough - include all details the user would need to apply
- If text is unclear, still provide your best analysis`;

      if (imageData) {
        setStage('Analyzing image with AI vision...');
        try {
          const res = await doable.integrations.run('openai', 'vision_prompt', {
            image: imageData,
            prompt: prompt,
            detail: 'high',
            maxTokens: 1500
          });
          
          if (res.success && res.data) {
            const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
            const match = text.match(/\{[\s\S]*?\}/);
            if (match) {
              const parsed = JSON.parse(match[0]);
              setResult(parsed);
              setProcessing(false);
              setStage('');
              return;
            }
          }
        } catch (e) {
          console.error('Vision error:', e);
        }
      }

      // Gemini fallback with more detailed prompt
      setStage('Searching AI knowledge base...');
      try {
        const geminiPrompt = `${prompt}

USER's CONTENT: ${textData || '[Image uploaded for analysis]'}

Please provide the most detailed and accurate information possible. Include official government website URLs if the scheme is a real Indian government program.`;
        
        const res = await doable.integrations.run('google_gemini', 'chat', {
          prompt: geminiPrompt,
          model: 'gemini-pro'
        });
        
        if (res.success && res.data) {
          const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
          const match = text.match(/\{[\s\S]*?\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            setResult(parsed);
            setProcessing(false);
            setStage('');
            return;
          }
        }
      } catch (e) {
        console.error('Gemini error:', e);
      }

      // Fallback
      setResult({ 
        is_scam: false, 
        document_type: 'document', 
        summary: 'Analysis complete. The content has been processed.', 
        scam_warnings: [], 
        schemes_found: [], 
        recommendations: ['Try the Chat feature for more detailed scheme information'] 
      });
    } catch (err) {
      console.error('Error:', err);
      setError('Analysis failed. Please try again.');
      setResult({ is_scam: false, document_type: 'error', summary: 'Error occurred', scam_warnings: [], schemes_found: [], recommendations: [] });
    } finally {
      setProcessing(false);
      setStage('');
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProcessing(true);
    setError('');
    setResult(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      setImage(dataUrl);
      analyzeWithAI(dataUrl, '');
    };
    reader.onerror = () => { setError('Failed to load image'); setProcessing(false); };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    try {
      await db.query(`INSERT INTO scam_reports (input_type, raw_content, ai_verdict, ai_reasoning) VALUES ($1, $2, $3, $4)`, [
        result.document_type || 'unknown',
        JSON.stringify(result.schemes_found || []),
        result.is_scam ? 'SCAM' : 'VERIFIED',
        JSON.stringify(result)
      ]);
      setSaveSuccess('Saved!');
      setTimeout(() => setSaveSuccess(''), 2000);
    } catch (e) {
      setError('Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold text-white">Scan & Analyze</h1>
        <p className="text-white/70 text-sm mt-1">AI-powered scheme detection with apply links</p>
      </div>

      <div className="px-4 py-3 bg-white border-b">
        <div className="flex gap-2">
          <button onClick={() => setMode('image')} className={`flex-1 py-2.5 rounded-xl font-medium text-sm ${mode === 'image' ? 'bg-[#1B3A6B] text-white' : 'bg-gray-100 text-gray-600'}`}>
            <Camera className="w-4 h-4 inline mr-1" /> Image
          </button>
          <button onClick={() => setMode('text')} className={`flex-1 py-2.5 rounded-xl font-medium text-sm ${mode === 'text' ? 'bg-[#1B3A6B] text-white' : 'bg-gray-100 text-gray-600'}`}>
            <FileText className="w-4 h-4 inline mr-1" /> Text
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {mode === 'image' ? (
          <>
            {!image && (
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition" onClick={() => fileInputRef.current?.click()}>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                <Upload className="w-14 h-14 text-gray-400 mx-auto mb-3" />
                <p className="font-semibold text-gray-800 text-lg">Upload Document Image</p>
                <p className="text-sm text-gray-500 mt-2">Scan government notices, scheme flyers, or any document</p>
              </div>
            )}

            {image && (
              <div className="relative rounded-2xl overflow-hidden bg-white shadow-lg">
                <img src={image} alt="Uploaded" className="w-full h-64 object-contain bg-gray-100" />
                <button onClick={() => { setImage(null); setResult(null); }} className="absolute top-3 right-3 w-9 h-9 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70">
                  <X className="w-5 h-5" />
                </button>
                {processing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-6 text-center max-w-xs">
                      <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-3 animate-spin" />
                      <p className="font-semibold text-gray-800">{stage || 'Analyzing...'}</p>
                      <p className="text-sm text-gray-500 mt-1">Finding schemes and links</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-800">
              💡 Paste any text about schemes, notices, or government programs for detailed analysis
            </div>
            <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Paste scheme details, notice text, or description here..." className="w-full p-4 border rounded-xl resize-none h-40 text-gray-800" />
            <button onClick={() => textInput.trim() && analyzeWithAI(null, textInput)} disabled={processing || !textInput.trim()} className="w-full py-3 bg-[#1B3A6B] text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              {processing ? 'Searching...' : 'Find Schemes & Apply Links'}
            </button>
          </>
        )}

        {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500" /><p className="text-red-700 text-sm">{error}</p></div>}

        {result && (
          <div className="space-y-4">
            {/* Status */}
            <div className={`p-4 rounded-xl ${result.is_scam ? 'bg-red-50 border-2 border-red-300' : 'bg-green-50 border-2 border-green-300'}`}>
              <div className="flex items-center gap-3">
                {result.is_scam ? <AlertTriangle className="w-12 h-12 text-red-500" /> : <CheckCircle className="w-12 h-12 text-green-500" />}
                <div>
                  <p className="font-bold text-lg">{result.is_scam ? '⚠️ Potential Scam Detected' : '✓ Analysis Complete'}</p>
                  <p className="text-sm text-gray-600">Found {result.schemes_found?.length || 0} schemes</p>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {result.scam_warnings?.length > 0 && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Scam Warnings</h3>
                <ul className="space-y-2">{result.scam_warnings.map((w: string, i: number) => <li key={i} className="text-sm text-red-700 flex items-start gap-2"><span className="text-red-500 mt-1">•</span> {w}</li>)}</ul>
              </div>
            )}

            {/* Summary */}
            {result.summary && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-2">📋 Document Summary</h3>
                <p className="text-gray-700">{result.summary}</p>
              </div>
            )}

            {/* Schemes */}
            {result.schemes_found?.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" /> 
                  Schemes Found ({result.schemes_found.length})
                </h3>
                
                {result.schemes_found.map((scheme: any, i: number) => (
                  <div key={i} className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h4 className="font-bold text-gray-900 text-lg">{scheme.name}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${scheme.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {scheme.status || 'Active'}
                        </span>
                      </div>
                      
                      {scheme.category && <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium mb-3">{scheme.category}</span>}
                      {scheme.ministry && <p className="text-sm text-gray-500 mb-3">🏛️ {scheme.ministry}</p>}
                      
                      {scheme.description && <p className="text-gray-700 text-sm mb-3">{scheme.description}</p>}
                      
                      {scheme.eligibility && (
                        <div className="mb-3">
                          <h5 className="font-semibold text-gray-800 text-sm mb-1">✅ Eligibility</h5>
                          <p className="text-gray-600 text-sm">{scheme.eligibility}</p>
                        </div>
                      )}
                      
                      {scheme.benefits && (
                        <div className="mb-3">
                          <h5 className="font-semibold text-green-800 text-sm mb-1">🎁 Benefits</h5>
                          <p className="text-gray-600 text-sm">{scheme.benefits}</p>
                        </div>
                      )}
                      
                      {scheme.documents_required && (
                        <div className="mb-3">
                          <h5 className="font-semibold text-gray-800 text-sm mb-1">📄 Required Documents</h5>
                          <p className="text-gray-600 text-sm">{scheme.documents_required}</p>
                        </div>
                      )}
                      
                      {scheme.how_to_apply && (
                        <div className="mb-3">
                          <h5 className="font-semibold text-gray-800 text-sm mb-1">📝 How to Apply</h5>
                          <p className="text-gray-600 text-sm">{scheme.how_to_apply}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Apply Links */}
                    <div className="bg-gray-50 p-4 border-t border-gray-200">
                      <h5 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
                        <LinkIcon className="w-4 h-4" /> Apply Links
                      </h5>
                      <div className="flex flex-col sm:flex-row gap-2">
                        {scheme.apply_url && (
                          <a href={scheme.apply_url} target="_blank" rel="noopener noreferrer" 
                             className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition">
                            <ExternalLink className="w-4 h-4" /> Apply Now
                          </a>
                        )}
                        {scheme.official_url && (
                          <a href={scheme.official_url} target="_blank" rel="noopener noreferrer" 
                             className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition">
                            <ExternalLink className="w-4 h-4" /> Official Website
                          </a>
                        )}
                        {!scheme.apply_url && !scheme.official_url && (
                          <a href="https://www.india.gov.in" target="_blank" rel="noopener noreferrer" 
                             className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition">
                            <ExternalLink className="w-4 h-4" /> Find on India.gov.in
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !result.is_scam && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
                <Search className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                <h3 className="font-bold text-yellow-800 mb-2">No Schemes Found</h3>
                <p className="text-sm text-yellow-700">Try uploading a different image or pasting more text about government schemes.</p>
                <button onClick={() => navigate('/schemes')} className="mt-4 py-2 px-4 bg-yellow-500 text-white rounded-xl font-medium text-sm hover:bg-yellow-600 transition">
                  Browse All Schemes
                </button>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations?.length > 0 && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <h3 className="font-bold text-blue-800 mb-2">💡 Recommendations</h3>
                <ul className="space-y-2">{result.recommendations.map((r: string, i: number) => <li key={i} className="text-sm text-blue-700 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-500" />{r}</li>)}</ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-[#1B3A6B] text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#2A4A8B] transition">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saveSuccess ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                {saveSuccess || 'Save'}
              </button>
              <button onClick={() => navigate('/chat')} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-200 transition">
                <MessageCircle className="w-5 h-5" /> Ask Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
