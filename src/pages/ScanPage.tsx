import { useState, useRef } from 'react';
import { useRouter } from '../lib/Router';
import { Upload, FileText, X, Loader2, Save, AlertTriangle, ExternalLink, CheckCircle, AlertCircle, Camera, Sparkles, MessageCircle, Search, FileCheck, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { createDoableClient } from '@doable/sdk';
import { db } from '@doable/data';

interface SchemeResult {
  name: string;
  category: string;
  ministry?: string;
  official_url?: string;
  apply_url?: string;
  eligibility?: string;
  benefits?: string;
  documents_required?: string;
  how_to_apply?: string;
  status?: string;
  description?: string;
}

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
  const [expandedScheme, setExpandedScheme] = useState<number | null>(null);
  const [rawResponse, setRawResponse] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { navigate } = useRouter();

  async function analyzeWithAI(imageData: string | null, textData: string) {
    setProcessing(true);
    setError('');
    setResult(null);
    setExtractedText('');
    setExpandedScheme(null);
    setRawResponse('');
    setStage('Reading your content...');

    try {
      const doable = createDoableClient();
      
      // STEP 1: Analyze image with OpenAI Vision
      if (imageData) {
        setStage('Analyzing image with AI vision...');
        
        const visionPrompt = `You are an expert on Indian government schemes and documents. Look at this image carefully and:
1. Read ALL text visible in this image
2. Identify ANY government scheme mentioned - look for names like PM-KISAN, Ujjwala, Ayushman Bharat, Digital India, Skill India, Stand Up India, Mudra Yojana, Sukanya Samriddhi, etc.
3. Check if it looks like a scam or fraud
4. Provide complete details about any schemes found

Be thorough - even partial mentions of schemes count!

Return your response as a JSON object with this exact structure (ONLY the JSON, no other text):
{
  "is_scam": false,
  "document_type": "what type of document is this",
  "extracted_text": "all the text you can read from the image word by word",
  "scam_warnings": ["any warning if suspicious"],
  "schemes_found": [
    {
      "name": "Official scheme name",
      "category": "education|health|housing|employment|agriculture|women|financial|skill|startup|social",
      "ministry": "Ministry name",
      "official_url": "official government website URL",
      "apply_url": "direct apply link if available",
      "eligibility": "Who can apply for this scheme",
      "benefits": "What benefits you get from this scheme",
      "documents_required": "List of documents needed",
      "how_to_apply": "How to apply step by step",
      "status": "Active",
      "description": "Brief description of what this scheme does"
    }
  ],
  "recommendations": ["helpful tips for the user"]
}

If NO schemes are found, still return the JSON with empty schemes_found array. Always include the extracted_text field with everything you can read.`;

        try {
          // Use OpenAI Vision for image analysis
          const visionResult = await doable.integrations.run('openai', 'vision_prompt', {
            image: imageData,
            prompt: visionPrompt,
            detail: 'high'
          });
          
          console.log('Vision result:', visionResult);
          
          if (visionResult.success && visionResult.data) {
            const responseText = typeof visionResult.data === 'string' 
              ? visionResult.data 
              : JSON.stringify(visionResult.data);
            
            setRawResponse(responseText);
            
            // Extract JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                const parsed = JSON.parse(jsonMatch[0]);
                
                const schemes = parsed.schemes_found || [];
                const summary = parsed.summary || (schemes.length > 0 
                  ? `Found ${schemes.length} government scheme${schemes.length > 1 ? 's' : ''} in the image!` 
                  : 'No government schemes detected in this image');
                
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
                setError('Could not understand AI response. Please try again.');
              }
            } else {
              // No JSON found - show raw response
              setExtractedText(responseText);
              setResult({
                is_scam: false,
                document_type: 'image',
                extracted_text: responseText,
                summary: 'Analysis complete - see extracted text below',
                scam_warnings: [],
                schemes_found: [],
                recommendations: []
              });
              setProcessing(false);
              return;
            }
          } else {
            setError(visionResult.error || 'Failed to analyze image');
          }
        } catch (e: any) {
          console.error('Vision error:', e);
          setError('Failed to analyze image: ' + (e.message || 'Unknown error'));
        }
      }

      // STEP 2: If text input is provided, analyze it with Gemini
      if (textData.trim()) {
        setStage('Finding schemes in text...');
        
        const analysisPrompt = `You are an expert on Indian government schemes. Analyze this text and identify any government schemes mentioned.

TEXT TO ANALYZE:
${textData}

Return your response as a JSON object:
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
      "official_url": "official website",
      "apply_url": "apply link",
      "eligibility": "Who can apply",
      "benefits": "What you get",
      "documents_required": "Documents needed",
      "how_to_apply": "Application process",
      "status": "Active",
      "description": "Brief description"
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
      
    } catch (err: any) {
      console.error('Error:', err);
      setError('Analysis failed: ' + (err.message || 'Please try again.'));
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

  const toggleScheme = (index: number) => {
    setExpandedScheme(expandedScheme === index ? null : index);
  };

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
              <div className="relative rounded-2xl overflow-hidden bg-white shadow-sm">
                <img src={image} alt="Uploaded" className="w-full max-h-64 object-contain" />
                <button onClick={() => { setImage(null); setResult(null); setError(''); setRawResponse(''); }} className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {processing && (
              <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                <Loader2 className="w-10 h-10 text-[#1B3A6B] mx-auto mb-3 animate-spin" />
                <p className="font-medium text-gray-800">{stage || 'Processing...'}</p>
                <p className="text-sm text-gray-500 mt-1">Our AI is analyzing your content</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
          </>
        ) : (
          <>
            <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Paste scheme text here..." className="w-full h-40 p-4 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] text-sm" />
            <button onClick={() => textInput.trim() && analyzeWithAI(null, textInput)} disabled={processing || !textInput.trim()} className="w-full py-3 bg-[#1B3A6B] text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Analyze Text
            </button>
          </>
        )}

        {/* Debug Response - Hidden by default */}
        {rawResponse && !result?.schemes_found?.length && (
          <details className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <summary className="cursor-pointer font-medium text-yellow-800 text-sm">Debug: Raw AI Response</summary>
            <pre className="mt-2 text-xs text-yellow-700 whitespace-pre-wrap overflow-auto max-h-60">{rawResponse}</pre>
          </details>
        )}

        {/* SCHEMES FOUND - MAIN DISPLAY */}
        {result && !processing && result.schemes_found && result.schemes_found.length > 0 && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{result.schemes_found.length} Scheme{result.schemes_found.length > 1 ? 's' : ''} Found!</h2>
                  <p className="text-white/80 text-sm">Tap each scheme to see details</p>
                </div>
              </div>
            </div>

            {/* Scam Warning */}
            {result.is_scam && (
              <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4">
                <h3 className="font-bold text-red-800 flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5" /> Warning - Potential Scam!
                </h3>
                {result.scam_warnings?.map((warning: string, i: number) => (
                  <p key={i} className="text-red-700 text-sm">• {warning}</p>
                ))}
              </div>
            )}

            {/* Schemes List - Interactive */}
            <div className="space-y-3">
              {result.schemes_found.map((scheme: SchemeResult, index: number) => (
                <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Scheme Header - Always Visible */}
                  <button 
                    onClick={() => toggleScheme(index)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <div className="w-10 h-10 bg-[#1B3A6B]/10 rounded-full flex items-center justify-center shrink-0">
                        <FileCheck className="w-5 h-5 text-[#1B3A6B]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 text-left">{scheme.name}</h4>
                        {scheme.category && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full capitalize">
                            {scheme.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {expandedScheme === index ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {expandedScheme === index && (
                    <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
                      {scheme.description && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">About</p>
                          <p className="text-sm text-gray-700">{scheme.description}</p>
                        </div>
                      )}
                      
                      {scheme.ministry && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Ministry</p>
                          <p className="text-sm text-gray-700">{scheme.ministry}</p>
                        </div>
                      )}
                      
                      {scheme.eligibility && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Who Can Apply</p>
                          <p className="text-sm text-gray-700">{scheme.eligibility}</p>
                        </div>
                      )}
                      
                      {scheme.benefits && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Benefits</p>
                          <p className="text-sm text-gray-700">{scheme.benefits}</p>
                        </div>
                      )}
                      
                      {scheme.documents_required && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Documents Needed</p>
                          <p className="text-sm text-gray-700">{scheme.documents_required}</p>
                        </div>
                      )}
                      
                      {scheme.how_to_apply && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">How to Apply</p>
                          <p className="text-sm text-gray-700">{scheme.how_to_apply}</p>
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        {scheme.official_url && (
                          <a href={scheme.official_url} target="_blank" rel="noopener noreferrer" className="flex-1 py-2.5 px-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-200 transition">
                            <ExternalLink className="w-4 h-4" /> Official Site
                          </a>
                        )}
                        {scheme.apply_url && (
                          <a href={scheme.apply_url} target="_blank" rel="noopener noreferrer" className="flex-1 py-2.5 px-3 bg-green-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-green-700 transition">
                            Apply Now <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No schemes found message */}
        {result && !processing && result.schemes_found?.length === 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-800 text-lg mb-2">No Schemes Found</h3>
            <p className="text-sm text-gray-500 mb-4">{result.summary}</p>
            {result.extracted_text && (
              <details className="text-left mt-4">
                <summary className="cursor-pointer text-sm text-[#1B3A6B] font-medium">View what was read from image</summary>
                <p className="mt-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl whitespace-pre-wrap">{result.extracted_text}</p>
              </details>
            )}
            <p className="text-xs text-gray-400 mt-4">Try uploading a different image or browse schemes manually</p>
          </div>
        )}

        {/* Extracted Text - Full Display */}
        {result && !processing && result.extracted_text && result.schemes_found?.length === 0 && (
          <details className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <summary className="p-4 cursor-pointer font-medium text-gray-700 flex items-center gap-2 hover:bg-gray-50">
              <Eye className="w-4 h-4" /> View Extracted Text
            </summary>
            <div className="px-4 pb-4">
              <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-xl">{result.extracted_text}</p>
            </div>
          </details>
        )}

        {/* Recommendations */}
        {result && !processing && result.recommendations?.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> Tips
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              {result.recommendations.map((tip: string, i: number) => (
                <li key={i}>• {tip}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Save Button */}
        {result && !processing && (
          <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-green-600 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Saving...' : 'Save to Vault'}
          </button>
        )}
        
        {saveSuccess && (
          <p className="text-center text-green-600 font-medium text-sm">{saveSuccess}</p>
        )}
      </div>
    </div>
  );
}
