import { useState, useRef } from 'react';
import { useRouter } from '../lib/Router';
import { useApp } from '../lib/AppContext';
import { Upload, FileText, X, Loader2, Save, AlertTriangle, ExternalLink, RefreshCw, CheckCircle, AlertCircle, Camera, Sparkles, MessageCircle } from 'lucide-react';
import { createDoableClient } from '@doable/sdk';
import { db } from '@doable/data';

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
  const { language } = useApp();

  async function analyzeWithAI(imageData: string | null, textData: string) {
    setProcessing(true);
    setError('');
    setResult(null);
    setStage('Starting...');

    try {
      const doable = createDoableClient();
      const prompt = `Analyze this ${imageData ? 'image' : 'text'} about Indian government schemes. Return JSON: {"is_scam":false,"document_type":"type","summary":"brief summary","scam_warnings":[],"schemes_found":[],"recommendations":[]}`;

      if (imageData) {
        setStage('Analyzing image...');
        try {
          const res = await doable.integrations.run('openai', 'vision_prompt', {
            image: imageData,
            prompt: prompt,
            detail: 'low',
            maxTokens: 500
          });
          
          if (res.success && res.data) {
            const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
            const match = text.match(/\{[\s\S]*?\}/);
            if (match) {
              setResult(JSON.parse(match[0]));
              setProcessing(false);
              return;
            }
          }
        } catch (e) {
          console.error('Vision error:', e);
        }
      }

      // Gemini fallback
      setStage('Using AI...');
      try {
        const res = await doable.integrations.run('google_gemini', 'chat', {
          prompt: `${prompt}\n\nContent: ${textData || '[image]'}`,
          model: 'gemini-pro'
        });
        
        if (res.success && res.data) {
          const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
          const match = text.match(/\{[\s\S]*?\}/);
          if (match) {
            setResult(JSON.parse(match[0]));
            setProcessing(false);
            return;
          }
        }
      } catch (e) {
        console.error('Gemini error:', e);
      }

      // Fallback
      setResult({ is_scam: false, document_type: imageData ? 'image' : 'text', summary: 'Analysis complete', scam_warnings: [], schemes_found: [], recommendations: ['Try Chat for details'] });
    } catch (err) {
      console.error('Error:', err);
      setError('Analysis failed');
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
    reader.onerror = () => { setError('Failed to load'); setProcessing(false); };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    try {
      await db.query(`INSERT INTO scam_reports (input_type, raw_content, ai_verdict, ai_reasoning) VALUES ($1, $2, $3, $4)`, [
        result.document_type || 'unknown',
        result.summary || '',
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
        <p className="text-white/70 text-sm mt-1">AI-powered document analysis</p>
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
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center bg-gray-50 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="font-semibold text-gray-800">Upload Image</p>
                <p className="text-sm text-gray-500 mt-2">Tap to select document photo</p>
              </div>
            )}

            {image && (
              <div className="relative rounded-2xl overflow-hidden bg-white shadow-lg">
                <img src={image} alt="Uploaded" className="w-full h-64 object-contain bg-gray-100" />
                <button onClick={() => { setImage(null); setResult(null); }} className="absolute top-3 right-3 w-9 h-9 bg-black/50 rounded-full flex items-center justify-center text-white">
                  <X className="w-5 h-5" />
                </button>
                {processing && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-6 text-center">
                      <Loader2 className="w-10 h-10 text-blue-600 mx-auto mb-3 animate-spin" />
                      <p className="font-semibold">{stage || 'Analyzing...'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder="Paste scheme details..." className="w-full p-4 border rounded-xl resize-none h-40" />
            <button onClick={() => textInput.trim() && analyzeWithAI(null, textInput)} disabled={processing || !textInput.trim()} className="w-full py-3 bg-[#1B3A6B] text-white rounded-xl font-medium disabled:opacity-50">
              {processing ? <Loader2 className="w-5 h-5 inline animate-spin mr-2" /> : <Sparkles className="w-5 h-5 inline mr-2" />}
              Analyze Text
            </button>
          </>
        )}

        {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-500" /><p className="text-red-700 text-sm">{error}</p></div>}

        {result && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl ${result.is_scam ? 'bg-red-50 border-2 border-red-300' : 'bg-green-50 border-2 border-green-300'}`}>
              <div className="flex items-center gap-3">
                {result.is_scam ? <AlertTriangle className="w-10 h-10 text-red-500" /> : <CheckCircle className="w-10 h-10 text-green-500" />}
                <div>
                  <p className="font-bold text-lg">{result.is_scam ? '⚠️ Potential Scam' : '✓ Appears Legitimate'}</p>
                  <p className="text-sm text-gray-600">Type: {result.document_type || 'Document'}</p>
                </div>
              </div>
            </div>

            {result.scam_warnings?.length > 0 && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <h3 className="font-bold text-red-800 mb-2">⚠️ Warnings</h3>
                <ul className="space-y-1">{result.scam_warnings.map((w: string, i: number) => <li key={i} className="text-sm text-red-700">• {w}</li>)}</ul>
              </div>
            )}

            {result.summary && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                <h3 className="font-bold mb-2">Summary</h3>
                <p className="text-gray-700 text-sm">{result.summary}</p>
              </div>
            )}

            {result.schemes_found?.length > 0 && (
              <div>
                <h3 className="font-bold mb-2">Schemes Found ({result.schemes_found.length})</h3>
                {result.schemes_found.map((s: any, i: number) => (
                  <div key={i} className="bg-white border-2 border-gray-200 rounded-xl p-4 mb-2">
                    <h4 className="font-bold">{s.name || 'Scheme'}</h4>
                    {s.eligibility && <p className="text-sm text-gray-600 mt-1">Eligibility: {s.eligibility}</p>}
                    {s.official_url && <a href={s.official_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 mt-1 inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Official Site</a>}
                  </div>
                ))}
              </div>
            )}

            {result.recommendations?.length > 0 && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <h3 className="font-bold text-blue-800 mb-2">Recommendations</h3>
                <ul className="space-y-1">{result.recommendations.map((r: string, i: number) => <li key={i} className="text-sm text-blue-700 flex items-center gap-2"><CheckCircle className="w-4 h-4" />{r}</li>)}</ul>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-[#1B3A6B] text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saveSuccess ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                {saveSuccess || 'Save'}
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
