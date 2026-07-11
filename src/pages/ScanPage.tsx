import { useState, useRef } from 'react';
import { useRouter } from '../lib/Router';
import { Camera, Upload, FileText, Check, X, Loader2, Save } from 'lucide-react';

interface ScanResult {
  document_type: string;
  summary: string;
  key_dates: string[];
  missing_fields: string[];
  checklist: string[];
}

export function ScanPage() {
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { navigate } = useRouter();

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview image
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      processImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function processImage(imageData: string) {
    setProcessing(true);
    setError('');

    try {
      // Simulate OCR processing with AI explanation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock result based on document
      setResult({
        document_type: 'Aadhaar Card',
        summary: 'This is your Aadhaar Card issued by UIDAI. It contains your 12-digit unique identity number linked to your biometric and demographic data.',
        key_dates: ['Issued: 15/03/2018', 'Valid until: Lifetime'],
        missing_fields: [],
        checklist: ['Keep a copy for KYC', 'Update mobile number if changed', 'Check e-Aadhaar option for digital copy'],
      });
    } catch (err) {
      setError('Failed to process document. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleSaveToVault() {
    if (!result) return;
    setSaving(true);
    setSaveSuccess('');
    
    try {
      // In production, this would save the document to the database
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveSuccess('Document saved to vault successfully!');
      setTimeout(() => {
        navigate('/vault');
      }, 1500);
    } catch (err) {
      setError('Failed to save document. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateChecklist() {
    if (!result) return;
    setSaving(true);
    setSaveSuccess('');
    
    try {
      // In production, this would create a checklist in the database
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveSuccess('Checklist created successfully!');
      setTimeout(() => {
        navigate('/applications');
      }, 1500);
    } catch (err) {
      setError('Failed to create checklist. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setImage(null);
    setResult(null);
    setError('');
    setSaveSuccess('');
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-6 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white">Scan Document</h1>
        <p className="text-white/70 mt-1">Point your camera at any government document</p>
      </div>

      <div className="px-6 py-6">
        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 flex items-center gap-2">
            <Check className="w-5 h-5" />
            {saveSuccess}
          </div>
        )}

        {/* Camera/Upload Area */}
        {!image && !processing && (
          <div className="space-y-4">
            <div className="aspect-[4/3] bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-6">
              <FileText className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium mb-4 text-center">Take a photo or upload an image</p>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {/* Camera button - works on mobile */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-6 py-3 bg-[#1B3A6B] text-white rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Take Photo
                </button>
                
                {/* Upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-white border-2 border-[#1B3A6B] text-[#1B3A6B] rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
              </div>
              
              {/* Hidden file inputs */}
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

            {/* Supported Documents */}
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-3">Supported Documents</p>
              <div className="flex flex-wrap gap-2">
                {['Aadhaar', 'PAN', 'Passport', 'Driving License', 'Ration Card', 'Land Records', 'Certificates'].map((doc) => (
                  <span key={doc} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
                    {doc}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Processing State */}
        {processing && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-[#1B3A6B]/10 rounded-full flex items-center justify-center mb-6">
              <Loader2 className="w-10 h-10 text-[#1B3A6B] animate-spin" />
            </div>
            <p className="text-lg font-medium text-[#1A1A2E]">Processing document...</p>
            <p className="text-gray-500 mt-2">Extracting text and analyzing content</p>
          </div>
        )}

        {/* Image Preview */}
        {image && !processing && !result && (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden">
              <img src={image} alt="Scanned document" className="w-full" />
              <button
                onClick={reset}
                className="absolute top-3 right-3 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            {/* Document Type Badge */}
            <div className="flex items-center justify-between">
              <span className="px-4 py-2 bg-[#0F9D58]/10 text-[#0F9D58] rounded-xl font-medium">
                {result.document_type}
              </span>
              <button
                onClick={reset}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-medium"
              >
                Scan Another
              </button>
            </div>

            {/* Summary Card */}
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <h3 className="font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#1B3A6B]" />
                What we found
              </h3>
              <p className="text-gray-600 leading-relaxed">{result.summary}</p>
            </div>

            {/* Key Dates */}
            {result.key_dates.length > 0 && (
              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <h3 className="font-semibold text-[#1A1A2E] mb-3">Important Dates</h3>
                <div className="space-y-2">
                  {result.key_dates.map((date, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#FF7A00] rounded-full" />
                      <span className="text-gray-600">{date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Checklist */}
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <h3 className="font-semibold text-[#1A1A2E] mb-3">Next Steps</h3>
              <div className="space-y-2">
                {result.checklist.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 border-2 border-gray-300 rounded flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons - Now with working handlers */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleSaveToVault}
                disabled={saving}
                className="flex-1 py-4 bg-[#1B3A6B] text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save to Vault
              </button>
              <button
                onClick={handleCreateChecklist}
                disabled={saving}
                className="flex-1 py-4 border-2 border-[#1B3A6B] text-[#1B3A6B] rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Create Checklist
              </button>
            </div>
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
