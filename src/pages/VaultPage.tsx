import { useState, useEffect } from 'react';
import { db } from '@doable/data';
import { useApp } from '../lib/AppContext';
import { Link } from '../lib/Router';
import { FolderOpen, FileText, CreditCard, Car, Home, Trash2, Eye, Calendar, IdCard } from 'lucide-react';

interface Document {
  id: string;
  document_type: string;
  original_filename: string;
  ai_summary: string;
  expiry_date: string | null;
  created_at: string;
}

const DOC_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  aadhaar: CreditCard,
  pan: FileText,
  passport: IdCard,
  license: Car,
  certificate: FileText,
  land_record: Home,
  birth_certificate: FileText,
  other: FileText,
};

function getExpiryStatus(expiryDate: string | null): { className: string; label: string } | null {
  if (!expiryDate) return null;
  
  const daysUntil = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  if (daysUntil < 0) return { className: 'bg-red-100 text-red-600', label: 'Expired' };
  if (daysUntil <= 30) return { className: 'bg-red-100 text-red-600', label: `${daysUntil} days` };
  if (daysUntil <= 90) return { className: 'bg-amber-100 text-amber-600', label: `${daysUntil} days` };
  return { className: 'bg-green-100 text-green-600', label: `${daysUntil} days` };
}

export function VaultPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const { profile } = useApp();

  useEffect(() => {
    loadDocuments();
  }, [profile?.id]);

  async function loadDocuments() {
    if (!profile) return;
    setLoading(true);

    try {
      const r = await db.query<Document>(
        `SELECT id, document_type, original_filename, ai_summary, expiry_date, created_at 
         FROM documents WHERE owner_id = $1 ORDER BY created_at DESC`,
        [profile.id]
      );
      if (r.ok && r.rows) setDocuments(r.rows);
    } catch (error) {
      console.error('Load documents failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteDocument(id: string) {
    if (!confirm('Are you sure you want to delete this document? This cannot be undone.')) return;
    
    try {
      await db.query('DELETE FROM documents WHERE id = $1', [id]);
      setDocuments(prev => prev.filter(d => d.id !== id));
      setSelectedDoc(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-6 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white">Document Vault</h1>
        <p className="text-white/70 mt-1">Your important documents, organized and secure</p>
        
        {/* View Toggle */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setView('grid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              view === 'grid' ? 'bg-white text-[#1B3A6B]' : 'bg-white/20 text-white'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              view === 'list' ? 'bg-white text-[#1B3A6B]' : 'bg-white/20 text-white'
            }`}
          >
            List
          </button>
        </div>
      </div>

      <div className="px-6 py-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-xl skeleton" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-[#1A1A2E] mb-2">No documents yet</h3>
            <p className="text-gray-500 mb-6">Scan your first document to get started</p>
            <Link
              to="/scan"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1B3A6B] text-white rounded-xl font-medium"
            >
              Scan Document
            </Link>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 gap-4">
            {documents.map((doc) => {
              const Icon = DOC_ICONS[doc.document_type?.toLowerCase() || 'other'] || FileText;
              const expiryStatus = getExpiryStatus(doc.expiry_date);
              
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="bg-white rounded-xl p-4 border border-gray-100 text-left hover:border-[#1B3A6B]/30 transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-[#1B3A6B]/10 rounded-xl flex items-center justify-center">
                      <Icon className="w-6 h-6 text-[#1B3A6B]" />
                    </div>
                    {expiryStatus && (
                      <span className={`text-xs px-2 py-1 rounded-full ${expiryStatus.className}`}>
                        {expiryStatus.label}
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-[#1A1A2E] capitalize">
                    {doc.document_type?.replace('_', ' ') || 'Document'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(doc.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => {
              const Icon = DOC_ICONS[doc.document_type?.toLowerCase() || 'other'] || FileText;
              const expiryStatus = getExpiryStatus(doc.expiry_date);
              
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="w-full bg-white rounded-xl p-4 border border-gray-100 text-left hover:border-[#1B3A6B]/30 transition flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-[#1B3A6B]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-[#1B3A6B]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-[#1A1A2E] capitalize">
                        {doc.document_type?.replace('_', ' ') || 'Document'}
                      </h3>
                      {expiryStatus && (
                        <span className={`text-xs px-2 py-1 rounded-full ${expiryStatus.className}`}>
                          {expiryStatus.label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{doc.original_filename}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Document Detail Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1A1A2E] capitalize">
                {selectedDoc.document_type?.replace('_', ' ') || 'Document'}
              </h2>
              <button
                onClick={() => setSelectedDoc(null)}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {selectedDoc.ai_summary && (
                <div className="bg-[#1B3A6B]/5 rounded-xl p-4">
                  <h3 className="font-medium text-[#1B3A6B] mb-2">AI Summary</h3>
                  <p className="text-gray-600">{selectedDoc.ai_summary}</p>
                </div>
              )}
              
              {selectedDoc.expiry_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Expiry Date</p>
                    <p className="font-medium">{new Date(selectedDoc.expiry_date).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}</p>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3">
                <button className="flex-1 py-3 bg-[#1B3A6B] text-white rounded-xl font-medium flex items-center justify-center gap-2">
                  <Eye className="w-4 h-4" />
                  View Original
                </button>
                <button
                  onClick={() => deleteDocument(selectedDoc.id)}
                  className="w-14 h-14 border-2 border-red-200 text-red-500 rounded-xl flex items-center justify-center"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
