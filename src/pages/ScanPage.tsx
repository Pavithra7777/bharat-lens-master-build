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

    try {
      const doable = createDoableClient();
      
      // STEP 1: Analyze image with Groq Vision (using chat completion with vision model)
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
          // Use Groq for vision analysis - pass image as base64 in messages
          const messages = [
            {
              role: 'user',
              content: [
                { type: 'text', text: visionPrompt },
                { type: 'image_url', image_url: { url: imageData } }
              ]
            }
          ];

          const visionResult = await doable.integrations.run('groq', 'chat_completion', {
            messages,
            model: 'llama-3.2-11b-vision-preview'
          });
          
          console.log('Vision result:', visionResult);
          
          if (visionResult.success && visionResult.data) {
            let responseText = '';
            
            if (typeof visionResult.data === 'string') {
              responseText = visionResult.data;
            } else if (visionResult.data.choices && visionResult.data.choices[0]?.message?.content) {
              responseText = visionResult.data.choices[0].message.content;
            } else {
              responseText = JSON.stringify(visionResult.data);
            }
            
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
                // Try to extract just the text
                setExtractedText(responseText);
                setResult({
                  is_scam: false,
                  document_type: 'image',
                  extracted_text: responseText,
                  summary: 'Analysis complete - review the extracted content below',
                  scam_warnings: [],
                  schemes_found: [],
                  recommendations: []
                });
                setProcessing(false);
                return;
              }
            } else {
              // No JSON found - show raw response
              setExtractedText(responseText);
              setResult({
                is_scam: false,
                document_type: 'image',
                extracted_text: responseText,
                summary: 'Analysis complete - see extracted content below',
                scam_warnings: [],
                schemes_found: [],
                recommendations: []
              });
              setProcessing(false);
              return;
            }
          } else {
            setError(visionResult.error || 'Failed to analyze image. Please try again.');
          }
        } catch (e: any) {
          console.error('Vision error:', e);
          setError('Failed to analyze image: ' + (e.message || 'Unknown error. Please try again.'));
        }
      }

      // STEP 2: If text input is provided, analyze it with Groq
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
}`;

        try {
          const res = await doable.integrations.run('groq', 'chat_completion', {
            messages: [{ role: 'user', content: analysisPrompt }],
            model: 'llama-3.2-11b-vision-preview'
          });
          
          if (res.success && res.data) {
            let responseText = '';
            
            if (typeof res.data === 'string') {
              responseText = res.data;
            } else if (res.data.choices && res.data.choices[0]?.message?.content) {
              responseText = res.data.choices[0].message.content;
            } else {
              responseText = JSON.stringify(res.data);
            }
            
            const match = responseText.match(/\{[\s\S]*\}/);
            if (match) {
              const parsed = JSON.parse(match[0]);
              const schemes = parsed.schemes_found || [];
              
              setResult({
                is_scam: parsed.is_scam || false,
                document_type: parsed.document_type || 'text',
                extracted_text: parsed.extracted_text || textData,
                summary: schemes.length > 0 
                  ? `Found ${schemes.length} scheme${schemes.length > 1 ? 's' : ''}!` 
                  : 'No government schemes found in the text',
                scam_warnings: parsed.scam_warnings || [],
                schemes_found: schemes,
                recommendations: parsed.recommendations || []
              });
              setProcessing(false);
              return;
            }
          }
          
          setResult({
            is_scam: false,
            document_type: 'text',
            extracted_text: textData,
            summary: 'Could not analyze text. Please try again.',
            scam_warnings: [],
            schemes_found: [],
            recommendations: []
          });
        } catch (e: any) {
          console.error('Text analysis error:', e);
          setError('Failed to analyze text: ' + (e.message || 'Unknown error'));
        }
      }
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

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImage(base64);
      setResult(null);
      setError('');
      setSaveSuccess('');
    };
    reader.onerror = () => {
      setError('Failed to load image');
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      setError('Please drop an image file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImage(base64);
      setResult(null);
      setError('');
      setSaveSuccess('');
    };
    reader.readAsDataURL(file);
  }

  async function handleAnalyze() {
    if (mode === 'image' && !image) {
      setError('Please upload an image first');
      return;
    }
    if (mode === 'text' && !textInput.trim()) {
      setError('Please enter some text first');
      return;
    }
    
    await analyzeWithAI(mode === 'image' ? image : null, mode === 'text' ? textInput : '');
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    setError('');
    try {
      const schemeCount = result.schemes_found?.length || 0;
      const title = schemeCount > 0 
        ? `Scan: ${schemeCount} scheme(s) found`
        : `Scan: ${result.document_type || 'Document'} analyzed`;
      
      const description = result.summary || result.extracted_text?.substring(0, 200) || 'Analyzed document';
      
      const r = await db.query(
        `INSERT INTO vault_items (title, description, category, item_type, metadata) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
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
      
      if (r.ok) {
        setSaveSuccess('Saved to Vault!');
        setTimeout(() => setSaveSuccess(''), 3000);
      } else {
        setError('Save failed: ' + (r.error?.message || 'Database error'));
      }
    } catch (e: any) {
      console.error('Save failed:', e);
      setError('Save failed: ' + (e.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  }

  const toggleScheme = (index: number) => {
    setExpandedScheme(expandedScheme === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-4 pt-12 pb-6">
        <h1 className="text-xl font-bold text-white mb-1">AI Document Scanner</h1>
        <p className="text-white/70 text-sm">Upload any document to find applicable schemes</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Mode Toggle */}
        <div className="bg-white rounded-2xl p-1 shadow-sm flex">
          <button
            onClick={() => setMode('image')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
              mode === 'image' 
                ? 'bg-[#1B3A6B] text-white shadow-md' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Camera className="w-4 h-4 inline mr-2" />
            Image
          </button>
          <button
            onClick={() => setMode('text')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
              mode === 'text' 
                ? 'bg-[#1B3A6B] text-white shadow-md' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Text
          </button>
        </div>

        {/* Image Upload */}
        {mode === 'image' && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="relative"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            {image ? (
              <div className="relative">
                <img 
                  src={image} 
                  alt="Uploaded" 
                  className="w-full h-64 object-cover rounded-2xl shadow-sm" 
                />
                <button
                  onClick={() => { setImage(null); setResult(null); setError(''); setRawResponse(''); }}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-[#1B3A6B] hover:bg-[#1B3A6B]/5 transition-all cursor-pointer"
              >
                <Upload className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium mb-1">Tap to upload or drag & drop</p>
                <p className="text-gray-400 text-sm">Screenshot, photo of document, form, or notice</p>
              </div>
            )}
          </div>
        )}

        {/* Text Input */}
        {mode === 'text' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste document text, scheme name, or any government program details here..."
              className="w-full h-40 p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 focus:border-[#1B3A6B] text-sm"
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 font-medium text-sm">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={processing || (mode === 'image' ? !image : !textInput.trim())}
          className="w-full py-4 bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] text-white rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#1B3A6B]/20"
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {stage || 'Analyzing...'}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Analyze with AI
            </>
          )}
        </button>

        {/* Results */}
        {processing && (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <div className="w-16 h-16 border-4 border-[#1B3A6B]/20 border-t-[#1B3A6B] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 font-medium">{stage || 'Analyzing your document...'}</p>
            <p className="text-gray-400 text-sm mt-1">This may take a few moments</p>
          </div>
        )}

        {/* Scam Warning */}
        {result && !processing && result.is_scam && (
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-red-800">Scam Alert!</h3>
                <p className="text-red-600 text-sm">This appears to be a fraud scheme</p>
              </div>
            </div>
            {result.scam_warnings?.length > 0 && (
              <ul className="text-sm text-red-700 space-y-1 ml-3">
                {result.scam_warnings.map((warning: string, i: number) => (
                  <li key={i}>⚠️ {warning}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Summary */}
        {result && !processing && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-800">Analysis Complete</h3>
            </div>
            <p className="text-gray-600 text-sm">{result.summary}</p>
            {result.document_type && result.document_type !== 'image' && (
              <p className="text-xs text-gray-400 mt-1">Document type: {result.document_type}</p>
            )}
          </div>
        )}

        {/* Schemes Found */}
        {result && !processing && result.schemes_found?.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#1B3A6B]" />
              Schemes Found ({result.schemes_found.length})
            </h3>
            
            {result.schemes_found.map((scheme: any, index: number) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleScheme(index)}
                  className="w-full p-4 text-left hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 mb-1">{scheme.name}</h4>
                      <span className="inline-block px-2 py-0.5 bg-[#1B3A6B]/10 text-[#1B3A6B] text-xs rounded-full capitalize">
                        {scheme.category}
                      </span>
                    </div>
                    {expandedScheme === index ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>
                
                {expandedScheme === index && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                    {scheme.description && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Description</p>
                        <p className="text-sm text-gray-700">{scheme.description}</p>
                      </div>
                    )}
                    
                    {scheme.eligibility && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Eligibility</p>
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
