import { useState, useRef } from 'react';
import { useRouter } from '../lib/Router';
import { Upload, FileText, X, Loader2, Save, AlertTriangle, ExternalLink, CheckCircle, AlertCircle, Camera, Sparkles, MessageCircle, Search, FileCheck } from 'lucide-react';
import { createDoableClient } from '@doable/sdk';
import { db } from '@doable/data';

export function ScanPage() {
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [extractedText, setExtractedText] = useState('');
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
    setExtractedText('');
    setStage('Reading your content...');

    try {
      const doable = createDoableClient();
      
      // STEP 1: Analyze image with Gemini Vision
      if (imageData) {
        setStage('Analyzing image with AI...');
        
        const visionPrompt = `You are an expert on Indian government schemes and documents. Analyze this image thoroughly.

TASK:
1. Read ALL text visible in this image
2. Identify any government schemes mentioned
3. Check if it looks like a scam or fraud
4. Provide complete details about any schemes found

Return ONLY valid JSON with this exact format (no other text):
{
  "is_scam": false,
  "document_type": "what type of document is this",
  "extracted_text": "all the text you can read from the image",
  "scam_warnings": ["any warning if suspicious"],
  "schemes_found": [
    {
      "name": "Official scheme name",
      "category": "education|health|housing|employment|agriculture|women|financial|skill|startup|social",
      "ministry": "Ministry name",
      "official_url": "https://...",
      "apply_url": "https://...",
      "eligibility": "Who can apply",
      "benefits": "What benefits you get",
      "documents_required": "Documents needed",
      "how_to_apply": "How to apply",
      "status": "Active",
      "description": "Full description"
    }
  ],
  "recommendations": ["helpful tips"]
}

If NO schemes are found, return: {"schemes_found": [], "summary": "No government schemes detected in this image"}`;

        try {
          const visionResult = await doable.integrations.run('google_gemini', 'generate_content_from_image', {
            prompt: visionPrompt,
            image: imageData,
            model: 'gemini-1.5-flash'
          });
          
          if (visionResult.success && visionResult.data) {
            const responseText = typeof visionResult.data === 'string' 
              ? visionResult.data 
              : JSON.stringify(visionResult.data);
            
            // Extract JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                const parsed = JSON.parse(jsonMatch[0]);
                
                // Handle both response formats
                const schemes = parsed.schemes_found || [];
                const summary = parsed.summary || (schemes.length > 0 
                  ? `Found ${schemes.length} scheme(s) in the image` 
                  : 'No government schemes detected');
                
                setResult({
                  is_scam: parsed.is_scam || false,
                  document_type: parsed.document_type || 'image',
                  extracted_text: parsed.extracted_text || '',
                  summary: summary,
                  scam_warnings: parsed.scam_warnings || [],
                  schemes_found: schemes,
                  recommendations: parsed.recommendations || []
                });
                
                setExtractedText(parsed.extracted_text || '');
                setProcessing(false);
                return;
              } catch (parseErr) {
                console.error('JSON parse error:', parseErr);
                setError('Failed to parse AI response');
              }
            } else {
              // No JSON found - try text analysis
              setExtractedText(responseText);
            }
          }
        } catch (e) {
          console.error('Vision error:', e);
          setError('Failed to analyze image. Please try again.');
        }
      }

      // STEP 2: If text input is provided, analyze it
      if (textData.trim()) {
        setStage('Finding schemes in text...');
        
        const analysisPrompt = `You are an expert on Indian government schemes. Analyze this text and identify any government schemes mentioned.

TEXT TO ANALYZE:
${textData}

Return ONLY valid JSON:
{
  "is_scam": false,
  "document_type": "what type of document",
  "extracted_text": "key text found",
  "scam_warnings": [],
  "schemes_found": [
    {
      "name": "Official scheme name",
      "category": "education|health|housing|employment|agriculture|women|financial|skill|startup|social",
      "ministry": "Ministry name",
      "official_url": "https://...",
      "apply_url": "https://...",
      "eligibility": "Who can apply",
      "benefits": "What you get",
      "documents_required": "Documents needed",
      "how_to_apply": "Application process",
      "status": "Active",
      "description": "Full description"
    }
  ],
  "recommendations": ["advice"]
}

If NO schemes are found: {"schemes_found": [], "summary": "No government schemes detected"}`;

        try {
          const res = await doable.integrations.run('google_gemini', 'chat', {
            prompt: analysisPrompt,
            model: 'gemini-pro'
          });
          
          if (res.success && res.data) {
            const responseText = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
            const match = responseText.match(/\{[\s\S]*\}/);
            if (match) {
              const parsed = JSON.parse(match[0]);
              const schemes = parsed.schemes_found || [];
              setResult({
                is_scam: parsed.is_scam || false,
                document_type: parsed.document_type || 'text',
                extracted_text: parsed.extracted_text || textData,
                summary: parsed.summary || (schemes.length > 0 ? `Found ${schemes.length} scheme(s)` : 'No schemes detected'),
                scam_warnings: parsed.scam_warnings || [],
                schemes_found: schemes,
                recommendations: parsed.recommendations || []
              });
              setProcessing(false);
              return;
            }
          }
        } catch (e) {
          console.error('Analysis error:', e);
        }
      }

      // Fallback result
      setResult({
        is_scam: false,
        document_type: imageData ? 'image' : 'text',
        extracted_text: extractedText || textData || '',
        summary: 'Analysis complete. Try browsing schemes or use Chat for detailed help.',
        scam_warnings: [],
        schemes_found: [],
        recommendations: ['Browse the Schemes page for government benefits', 'Use Chat for personalized scheme recommendations']
      });
      
    } catch (err) {
      console.error('Error:', err);
      setError('Analysis failed. Please try again.');
      setResult({ 
        is_scam: false, 
        document_type: 'error', 
        summary: 'Error occurred during analysis', 
        scam_warnings: [], 
        schemes_found: [], 
        recommendations: [] 
      });
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
    reader.onerror = () => { 
      setError('Failed to load image'); 
      setProcessing(false); 
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    try {
      const schemeCount = result.schemes_found?.length || 0;
      const title = schemeCount > 0 
        ? `Scan: ${schemeCount} scheme(s) found`
        : `Scan: ${result.document_type || 'Document'} analyzed`;
      
      const description = result.summary || result.extracted_text?.substring(0, 200) || 'Analyzed document';
      
      await db.query(
        `INSERT INTO vault_items (title, description, category, item_type, metadata) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          title,
          description,
          'scan',
          'scan_result',
          JSON.stringify({
            extracted_text: result.extracted_text,
            schemes_found: result.schemes_found,
            is_scam: result.is_scam,
            scam_warnings: result.scam_warnings,
            recommendations: result.recommendations,
            document_type: result.document_type,
            saved_at: new Date().toISOString()
          })
        ]
      );
      setSaveSuccess('Saved to Vault!');
      setTimeout(() => setSaveSuccess(''), 2000);
    } catch (e) {
      console.error('Save failed:', e);
      setError('Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold text-white">Scan & Analyze</h1>
        <p className="text-white/70 text-sm mt-1">Find schemes with apply links</p>
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
                <p className="font-semibold text-gray-800 text-lg">Upload Scheme Image</p>
                <p className="text-sm text-gray-500 mt-2">Screenshot, notice, or any document with scheme info</p>
              </div>
            )}

            {image && (
              <div className="relative rounded-2xl overflow-hidden bg-white shadow-lg">
                <img src={image} alt="Uploaded" className="w-full h-64 object-contain bg-gray-100" />
                <button onClick={() => { setImage(null); setResult(null); setExtractedText(''); }} className="absolute top-3 right-3 w-9 h-9 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70">
                  <X className="w-5 h-5" />
                </button>
                {processing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-6 text-center max-w-xs">
                      <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-3 animate-spin" />
                      <p className="font-semibold text-gray-800">{stage || 'Analyzing...'}</p>
                      <p className="text-sm text-gray-500 mt-1">This may take a few seconds</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Paste scheme text, notice, or description..." className="w-full p-4 border rounded-xl resize-none h-40 text-gray-800" />
            <button onClick={() => textInput.trim() && analyzeWithAI(null, textInput)} disabled={processing || !textInput.trim()} className="w-full py-3 bg-[#1B3A6B] text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Find Schemes
            </button>
          </>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Extracted Text */}
            {extractedText && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h3 className="font-bold text-gray-700 text-sm mb-2 flex items-center gap-2"><FileCheck className="w-4 h-4" /> Text Extracted from Image:</h3>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{extractedText.substring(0, 500)}{extractedText.length > 500 ? '...' : ''}</p>
              </div>
            )}

            {/* Status */}
            <div className={`p-4 rounded-xl ${result.is_scam ? 'bg-red-50 border-2 border-red-300' : 'bg-green-50 border-2 border-green-300'}`}>
              <div className="flex items-center gap-3">
                {result.is_scam ? <AlertTriangle className="w-12 h-12 text-red-500" /> : <CheckCircle className="w-12 h-12 text-green-500" />}
                <div>
                  <p className="font-bold text-lg">{result.is_scam ? '⚠️ Potential Scam Detected' : '✓ Analysis Complete'}</p>
                  <p className="text-sm text-gray-600">{result.schemes_found?.length || 0} schemes found</p>
                </div>
              </div>
            </div>

            {/* Warnings */}
            {result.scam_warnings?.length > 0 && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Warnings</h3>
                <ul className="space-y-1">{result.scam_warnings.map((w: string, i: number) => <li key={i} className="text-sm text-red-700">• {w}</li>)}</ul>
              </div>
            )}

            {/* Summary */}
            {result.summary && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-2">📋 Summary</h3>
                <p className="text-gray-700">{result.summary}</p>
              </div>
            )}

            {/* Schemes */}
            {result.schemes_found?.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500" /> Schemes Found ({result.schemes_found.length})</h3>
                
                {result.schemes_found.map((scheme: any, i: number) => (
                  <div key={i} className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-bold text-gray-900 text-lg">{scheme.name}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${scheme.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{scheme.status || 'Active'}</span>
                      </div>
                      {scheme.category && <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium mb-2">{scheme.category}</span>}
                      {scheme.ministry && <p className="text-sm text-gray-500 mb-2">🏛️ {scheme.ministry}</p>}
                      {scheme.description && <p className="text-gray-700 text-sm mb-2">{scheme.description}</p>}
                      {scheme.eligibility && <div className="mb-2"><h5 className="font-semibold text-sm">✅ Eligibility:</h5><p className="text-gray-600 text-sm">{scheme.eligibility}</p></div>}
                      {scheme.benefits && <div className="mb-2"><h5 className="font-semibold text-sm">🎁 Benefits:</h5><p className="text-gray-600 text-sm">{scheme.benefits}</p></div>}
                      {scheme.documents_required && <div className="mb-2"><h5 className="font-semibold text-sm">📄 Documents:</h5><p className="text-gray-600 text-sm">{scheme.documents_required}</p></div>}
                    </div>
                    <div className="bg-gray-50 p-4 border-t border-gray-200">
                      <div className="flex flex-col sm:flex-row gap-2">
                        {scheme.apply_url && <a href={scheme.apply_url} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2"><ExternalLink className="w-4 h-4" /> Apply Now</a>}
                        {scheme.official_url && <a href={scheme.official_url} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2"><ExternalLink className="w-4 h-4" /> Official Site</a>}
                        {!scheme.apply_url && !scheme.official_url && <a href="https://www.india.gov.in" target="_blank" rel="noopener noreferrer" className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2"><ExternalLink className="w-4 h-4" /> Find on India.gov.in</a>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
                <Search className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                <h3 className="font-bold text-yellow-800 mb-2">No Schemes Detected</h3>
                <p className="text-sm text-yellow-700 mb-4">Try a different image or paste text directly</p>
                <button onClick={() => navigate('/schemes')} className="py-2 px-4 bg-yellow-500 text-white rounded-xl font-medium text-sm hover:bg-yellow-600">Browse Schemes</button>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations?.length > 0 && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <h3 className="font-bold text-blue-800 mb-2">💡 Tips</h3>
                <ul className="space-y-1">{result.recommendations.map((r: string, i: number) => <li key={i} className="text-sm text-blue-700 flex items-center gap-2"><CheckCircle className="w-4 h-4" />{r}</li>)}</ul>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-[#1B3A6B] text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saveSuccess ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                {saveSuccess || 'Save to Vault'}
              </button>
              <button onClick={() => navigate('/chat')} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2">
                <MessageCircle className="w-5 h-5" /> Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
