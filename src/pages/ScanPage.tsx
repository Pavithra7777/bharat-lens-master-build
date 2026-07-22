import { useState, useRef } from 'react';
import { useRouter } from '../lib/Router';
import { Upload, FileText, X, Loader2, Save, AlertTriangle, ExternalLink, CheckCircle, AlertCircle, Camera, Sparkles, MessageCircle, Search, FileCheck, ChevronDown, ChevronUp, Eye } from 'lucide-react';
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
      
      // Use Groq Vision directly to analyze the image
      if (imageData) {
        setStage('Analyzing image with AI...');
        
        // Extract base64 data from data URL
        const base64Image = imageData.includes(',') ? imageData.split(',')[1] : imageData;
        
        const analysisPrompt = `You are an expert on Indian government schemes and document analysis. Analyze this image and:
1. Extract ALL text visible in the image
2. Identify any government schemes or programs mentioned
3. Determine if the document appears legitimate or suspicious

Return your response as a JSON object with this exact structure (ONLY the JSON, no other text):
{
  "is_scam": false,
  "document_type": "what type of document is this",
  "extracted_text": "ALL text transcribed from the image",
  "scam_warnings": [],
  "schemes_found": [
    {
      "name": "Official scheme name",
      "category": "education|health|housing|employment|agriculture|women|financial|skill|startup|social|general",
      "ministry": "Ministry name",
      "official_url": "official government website URL",
      "apply_url": "direct apply link",
      "eligibility": "Who can apply",
      "benefits": "What benefits",
      "documents_required": "Documents needed",
      "how_to_apply": "How to apply",
      "status": "Active",
      "description": "Brief description"
    }
  ],
  "recommendations": ["tips"]
}

If NO schemes are found, still return the JSON with empty schemes_found array. Extract ALL text visible.`;

        let visionResult;
        try {
          console.log('Starting Groq vision analysis...');
          visionResult = await doable.integrations.run('groq', 'ask-ai', {
            model: 'llama-3.2-11b-vision-preview',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: analysisPrompt },
                  { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                ]
              }
            ],
            temperature: 0.3
          });
          console.log('Groq response received:', typeof visionResult);
        } catch (apiErr: any) {
          console.error('Groq API call failed:', apiErr);
          setError('Failed to connect to AI service: ' + (apiErr?.message || apiErr?.toString() || 'Please check your internet connection.'));
          setProcessing(false);
          return;
        }
        
        console.log('Vision result:', visionResult);
        
        if ((visionResult.success !== false && visionResult.data)) {
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
                : 'Analysis complete - no government schemes detected');
              
              setResult({
                is_scam: parsed.is_scam || false,
                document_type: parsed.document_type || 'image',
                extracted_text: parsed.extracted_text || responseText,
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
              setExtractedText(responseText);
              setResult({
                is_scam: false,
                document_type: 'image',
                extracted_text: responseText,
                summary: 'Analysis complete - review the extracted content',
                scam_warnings: [],
                schemes_found: [],
                recommendations: []
              });
              setProcessing(false);
              return;
            }
          } else {
            setExtractedText(responseText);
            setResult({
              is_scam: false,
              document_type: 'image',
              extracted_text: responseText,
              summary: 'Analysis complete',
              scam_warnings: [],
              schemes_found: [],
              recommendations: []
            });
            setProcessing(false);
            return;
          }
        } else {
          let errorMsg = 'Failed to analyze image. Please try again.';
          if (visionResult) {
            errorMsg = (visionResult as any).error?.message || visionResult.error || JSON.stringify(visionResult);
          }
          console.error('Vision API error:', errorMsg);
          setError('Image analysis failed: ' + errorMsg);
        }
      }

      // If text input is provided, analyze it with Groq
      if (textData.trim()) {
        setStage('Finding schemes in text...');
        
        const analysisPrompt = `You are an expert on Indian government schemes. Analyze this text and identify any government schemes mentioned.

TEXT TO ANALYZE:
${textData}

Return your response as a JSON object:
{
  "is_scam": false,
  "document_type": "text",
  "extracted_text": "the text analyzed",
  "scam_warnings": [],
  "schemes_found": [
    {
      "name": "Official scheme name",
      "category": "education|health|housing|employment|agriculture|women|financial|skill|startup|social",
      "ministry": "Ministry name",
      "official_url": "official website",
      "apply_url": "apply link",
      "eligibility": "Who can apply",
      "benefits": "Benefits",
      "documents_required": "Documents needed",
      "how_to_apply": "How to apply",
      "status": "Active",
      "description": "Brief description"
    }
  ],
  "recommendations": ["tips"]
}`;

        try {
          const visionResult = await doable.integrations.run('groq', 'ask-ai', {
            model: 'llama-3.2-11b-vision-preview',
            messages: [{ role: 'user', content: analysisPrompt }],
            temperature: 0.3
          });
          
          if (visionResult.success !== false && visionResult.data) {
            let responseText = '';
            if (typeof visionResult.data === 'string') {
              responseText = visionResult.data;
            } else if (visionResult.data.choices && visionResult.data.choices[0]?.message?.content) {
              responseText = visionResult.data.choices[0].message.content;
            } else {
              responseText = JSON.stringify(visionResult.data);
            }
            
            setRawResponse(responseText);
            
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              const schemes = parsed.schemes_found || [];
              setResult({
                is_scam: parsed.is_scam || false,
                document_type: parsed.document_type || 'text',
                extracted_text: textData,
                summary: schemes.length > 0 
                  ? `Found ${schemes.length} government scheme${schemes.length > 1 ? 's' : ''}!` 
                  : 'No government schemes detected',
                scam_warnings: parsed.scam_warnings || [],
                schemes_found: schemes,
                recommendations: parsed.recommendations || []
              });
              setExtractedText(textData);
            }
          }
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
    }
    
    setProcessing(false);
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    setError('');
    setResult(null);
    const reader = new FileReader();
    reader.onload = (event) => setImage(event.target?.result as string);
    reader.onerror = () => setError('Failed to load image');
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      setError('Please drop an image file');
      return;
    }
    setError('');
    setResult(null);
    const reader = new FileReader();
    reader.onload = (event) => setImage(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = () => {
    if (mode === 'image' && !image) {
      setError('Please upload an image first');
      return;
    }
    if (mode === 'text' && !textInput.trim()) {
      setError('Please enter some text first');
      return;
    }
    setError('');
    analyzeWithAI(mode === 'image' ? image : null, mode === 'text' ? textInput : '');
  };

  const handleSave = async () => {
    if (!result) {
      setError('Nothing to save');
      return;
    }
    setSaving(true);
    setError('');
    setSaveSuccess('');
    try {
      const r = await db.query(
        `INSERT INTO vault (image_data, result_data, document_type, summary) VALUES ($1, $2, $3, $4)`,
        [image || null, JSON.stringify(result), result.document_type || 'unknown', result.summary || '']
      );
      if (r.ok) {
        setSaveSuccess('Saved to vault successfully!');
        setTimeout(() => setSaveSuccess(''), 3000);
      } else {
        setError('Save failed: ' + (r.error?.message || 'Database error'));
      }
    } catch (e: any) {
      console.error('Save failed:', e);
      setError('Save failed: ' + (e.message || 'Unknown error'));
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Scan & Analyze</h1>
          <button onClick={() => navigate('/chat')} className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg border hover:bg-gray-50">
            <MessageCircle className="w-5 h-5" /> AI Chat
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-1.5 mb-4 flex">
          <button onClick={() => setMode('image')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium ${mode === 'image' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Camera className="w-5 h-5" /> Image
          </button>
          <button onClick={() => setMode('text')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium ${mode === 'text' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <FileText className="w-5 h-5" /> Text
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          {mode === 'image' ? (
            <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              {image ? (
                <div className="relative">
                  <img src={image} alt="Uploaded" className="max-h-64 mx-auto rounded-lg shadow-md" />
                  <button onClick={(e) => { e.stopPropagation(); setImage(null); setResult(null); setError(''); }} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Drop your image here</h3>
                  <p className="text-gray-500 text-sm">or click to browse</p>
                </>
              )}
            </div>
          ) : (
            <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Paste text about government schemes here..." className="w-full h-48 p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500" />
          )}

          <button onClick={handleAnalyze} disabled={processing} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2">
            {processing ? <><Loader2 className="w-5 h-5 animate-spin" /> {stage || 'Analyzing...'}</> : <><Sparkles className="w-5 h-5" /> Analyze {mode === 'image' ? 'Image' : 'Text'}</>}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 font-medium text-sm">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>

        {result && (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Analysis Results</h2>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saveSuccess || (saving ? 'Saving...' : 'Save to Vault')}
              </button>
            </div>

            <div className={`p-4 rounded-xl border ${result.is_scam ? 'bg-red-50 border-red-200' : result.schemes_found?.length > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-start gap-3">
                {result.is_scam ? <AlertTriangle className="w-6 h-6 text-red-600" /> : result.schemes_found?.length > 0 ? <CheckCircle className="w-6 h-6 text-green-600" /> : <FileCheck className="w-6 h-6 text-gray-600" />}
                <div>
                  <h3 className="font-semibold text-gray-900">{result.summary}</h3>
                  <p className="text-sm text-gray-600 mt-1">Document type: <span className="font-medium">{result.document_type}</span></p>
                </div>
              </div>
            </div>

            {result.scam_warnings?.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <h4 className="font-semibold text-amber-900 flex items-center gap-2 mb-2"><AlertTriangle className="w-5 h-5" /> Scam Warnings</h4>
                <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
                  {result.scam_warnings.map((warning: string, i: number) => (<li key={i}>{warning}</li>))}
                </ul>
              </div>
            )}

            {result.extracted_text && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><Eye className="w-5 h-5" /> Extracted Text</h4>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">{result.extracted_text}</div>
              </div>
            )}

            {result.schemes_found?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Search className="w-5 h-5" /> Government Schemes Detected ({result.schemes_found.length})</h4>
                <div className="space-y-3">
                  {result.schemes_found.map((scheme: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                      <button onClick={() => setExpandedScheme(expandedScheme === index ? null : index)} className="w-full p-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${scheme.category === 'education' ? 'bg-blue-100' : scheme.category === 'health' ? 'bg-red-100' : scheme.category === 'financial' ? 'bg-green-100' : scheme.category === 'women' ? 'bg-pink-100' : 'bg-indigo-100'}`}>
                            <FileCheck className={`w-5 h-5 ${scheme.category === 'education' ? 'text-blue-600' : scheme.category === 'health' ? 'text-red-600' : scheme.category === 'financial' ? 'text-green-600' : scheme.category === 'women' ? 'text-pink-600' : 'text-indigo-600'}`} />
                          </div>
                          <div className="text-left">
                            <h5 className="font-semibold text-gray-900">{scheme.name}</h5>
                            <p className="text-sm text-gray-500">{scheme.category} • {scheme.ministry || 'Government of India'}</p>
                          </div>
                        </div>
                        {expandedScheme === index ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </button>
                      {expandedScheme === index && (
                        <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
                          {scheme.description && <div><span className="text-xs font-semibold text-gray-500 uppercase">Description</span><p className="text-sm text-gray-700 mt-1">{scheme.description}</p></div>}
                          {scheme.eligibility && <div><span className="text-xs font-semibold text-gray-500 uppercase">Eligibility</span><p className="text-sm text-gray-700 mt-1">{scheme.eligibility}</p></div>}
                          {scheme.benefits && <div><span className="text-xs font-semibold text-gray-500 uppercase">Benefits</span><p className="text-sm text-gray-700 mt-1">{scheme.benefits}</p></div>}
                          {scheme.documents_required && <div><span className="text-xs font-semibold text-gray-500 uppercase">Documents Required</span><p className="text-sm text-gray-700 mt-1">{scheme.documents_required}</p></div>}
                          {scheme.how_to_apply && <div><span className="text-xs font-semibold text-gray-500 uppercase">How to Apply</span><p className="text-sm text-gray-700 mt-1">{scheme.how_to_apply}</p></div>}
                          <div className="flex gap-2 pt-2">
                            {scheme.official_url && <a href={scheme.official_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">Official Website <ExternalLink className="w-4 h-4" /></a>}
                            {scheme.apply_url && <a href={scheme.apply_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">Apply Now <ExternalLink className="w-4 h-4" /></a>}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.schemes_found?.length === 0 && !result.is_scam && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><Search className="w-8 h-8 text-gray-400" /></div>
                <h4 className="font-semibold text-gray-900 mb-2">No Schemes Detected</h4>
                <p className="text-sm text-gray-500">Try uploading a clearer image or different document</p>
              </div>
            )}

            {result.recommendations?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Recommendations</h4>
                <ul className="space-y-2">
                  {result.recommendations.map((rec: string, i: number) => (<li key={i} className="flex items-start gap-2 text-sm text-gray-700"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />{rec}</li>))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!result && (
          <div className="mt-6 grid grid-cols-2 gap-4">
            <button onClick={() => navigate('/schemes')} className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md text-left">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-3"><FileCheck className="w-5 h-5 text-indigo-600" /></div>
              <h4 className="font-semibold text-gray-900">Browse All Schemes</h4>
              <p className="text-sm text-gray-500">Explore government programs</p>
            </button>
            <button onClick={() => navigate('/chat')} className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md text-left">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3"><MessageCircle className="w-5 h-5 text-green-600" /></div>
              <h4 className="font-semibold text-gray-900">Ask AI Assistant</h4>
              <p className="text-sm text-gray-500">Get personalized help</p>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
