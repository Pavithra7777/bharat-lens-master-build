import { useState, useEffect } from 'react';
import db from '../lib/db';
import { useApp } from '../lib/AppContext';
import { Link } from '../lib/Router';
import { FolderOpen, FileText, CreditCard, Car, Home, Trash2, Eye, IdCard, Sparkles, AlertTriangle, FileCheck, ExternalLink, Info } from 'lucide-react';

interface vaultItem {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  item_type: string | null;
  metadata: any;
  created_at: string;
}

function isValidUrl(string: string): boolean {
  if (!string) return false;
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function VaultPage() {
  const [items, setItems] = useState<vaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedItem, setSelectedItem] = useState<vaultItem | null>(null);
  const { profile } = useApp();

  useEffect(() => {
    loadItems();
  }, [profile?.id]);

  async function loadItems() {
    setLoading(true);
    try {
      const data = await db.getVaultItems();
      setItems(data.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        item_type: item.item_type,
        metadata: item.metadata,
        created_at: item.created_at,
      })));
    } catch (error) {
      if (error?.code !== 'PGRST205') console.error('Load vault items failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Are you sure you want to delete this item? This cannot be undone.')) return;
    try {
      await db.deleteVaultItem(id);
      setItems(prev => prev.filter(item => item.id !== id));
      setSelectedItem(null);
    } catch (error) {
      if (error?.code !== 'PGRST205') console.error('Delete failed:', error);
    }
  }

  function getItemIcon(item: vaultItem) {
    if (item.item_type === 'scan_result') {
      const meta = item.metadata || {};
      if (meta.is_scam) return AlertTriangle;
      if (meta.schemes_found?.length > 0) return Sparkles;
      return FileCheck;
    }
    switch (item.category) {
      case 'document': return FileText;
      case 'aadhaar': return CreditCard;
      case 'pan': return FileText;
      case 'passport': return IdCard;
      case 'license': return Car;
      case 'certificate': return FileText;
      case 'land_record': return Home;
      default: return FileText;
    }
  }

  function getItemColor(item: vaultItem) {
    if (item.item_type === 'scan_result') {
      const meta = item.metadata || {};
      if (meta.is_scam) return 'bg-red-100 text-red-600';
      if (meta.schemes_found?.length > 0) return 'bg-purple-100 text-purple-600';
      return 'bg-blue-100 text-blue-600';
    }
    return 'bg-[#1B3A6B]/10 text-[#1B3A6B]';
  }

  function getSchemeCount(item: vaultItem): number {
    if (item.item_type === 'scan_result' && item.metadata?.schemes_found) {
      return item.metadata.schemes_found.length;
    }
    return 0;
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-24">
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-6 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white">My Vault</h1>
        <p className="text-white/70 mt-1">Your saved scans and documents</p>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setView('grid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${view === 'grid' ? 'bg-white text-[#1B3A6B]' : 'bg-white/20 text-white'}`}
          >
            Grid
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${view === 'list' ? 'bg-white text-[#1B3A6B]' : 'bg-white/20 text-white'}`}
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
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-[#1A1A2E] mb-2">Vault is empty</h3>
            <p className="text-gray-500 mb-6">Scan documents or analyze schemes to save them here</p>
            <Link to="/scan" className="inline-flex items-center gap-2 px-6 py-3 bg-[#1B3A6B] text-white rounded-xl font-medium">
              Scan Document
            </Link>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 gap-4">
            {items.map((item) => {
              const Icon = getItemIcon(item);
              const colorClass = getItemColor(item);
              const schemeCount = getSchemeCount(item);
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="bg-white rounded-xl p-4 border border-gray-100 text-left hover:border-[#1B3A6B]/30 transition"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    {schemeCount > 0 && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        {schemeCount} schemes
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-[#1A1A2E] line-clamp-2 text-sm">{item.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const Icon = getItemIcon(item);
              const colorClass = getItemColor(item);
              const schemeCount = getSchemeCount(item);
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="w-full bg-white rounded-xl p-4 border border-gray-100 text-left hover:border-[#1B3A6B]/30 transition flex items-center gap-4"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-[#1A1A2E] line-clamp-1">{item.title}</h3>
                      {schemeCount > 0 && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          {schemeCount} schemes
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{item.description || 'No description'}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1A1A2E]">{selectedItem.title}</h2>
              <button onClick={() => setSelectedItem(null)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">✕</button>
            </div>
            <div className="p-6 space-y-6">
              {selectedItem.description && (
                <div className="bg-[#1B3A6B]/5 rounded-xl p-4">
                  <h3 className="font-medium text-[#1B3A6B] mb-2">Description</h3>
                  <p className="text-gray-600">{selectedItem.description}</p>
                </div>
              )}

              {selectedItem.item_type === 'scan_result' && selectedItem.metadata && (
                <>
                  {selectedItem.metadata.schemes_found?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Schemes Found ({selectedItem.metadata.schemes_found.length})</h3>
                      <div className="space-y-3">
                        {selectedItem.metadata.schemes_found.map((scheme: any, idx: number) => (
                          <div key={idx} className="bg-white border rounded-xl p-4">
                            <h4 className="font-semibold text-gray-900">{scheme.name}</h4>
                            {scheme.ministry && <p className="text-sm text-gray-500 mt-1">{scheme.ministry}</p>}
                            {scheme.benefits && <p className="text-sm text-gray-600 mt-2">{scheme.benefits}</p>}
                            {scheme.eligibility && <p className="text-sm text-gray-500 mt-2">Eligibility: {scheme.eligibility}</p>}
                            {scheme.apply_url && (
                              <div className="mt-3">
                                {isValidUrl(scheme.apply_url) ? (
                                  <a href={scheme.apply_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                                    Apply Now <ExternalLink className="w-4 h-4" />
                                  </a>
                                ) : (
                                  <div className="inline-flex items-start gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                                    <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-blue-800">{scheme.apply_url}</span>
                                  </div>
                                )}
                              </div>
                            )}
                            {scheme.official_url && isValidUrl(scheme.official_url) && (
                              <div className="mt-2">
                                <a href={scheme.official_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 hover:underline">
                                  <ExternalLink className="w-3 h-3" /> Official Website
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedItem.metadata.extracted_text && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FileCheck className="w-4 h-4" /> Extracted Text
                      </h3>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedItem.metadata.extracted_text}</p>
                    </div>
                  )}

                  {selectedItem.metadata.scam_warnings?.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <h3 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Warnings
                      </h3>
                      <ul className="list-disc list-inside text-sm text-red-700">
                        {selectedItem.metadata.scam_warnings.map((w: string, i: number) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedItem.metadata.recommendations?.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h3 className="font-medium text-blue-800 mb-2">💡 Tips</h3>
                      <ul className="list-disc list-inside text-sm text-blue-700">
                        {selectedItem.metadata.recommendations.map((r: string, i: number) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              <p className="text-sm text-gray-400">
                Saved on {new Date(selectedItem.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>

              <div className="flex gap-3">
                <Link to="/scan" className="flex-1 py-3 bg-[#1B3A6B] text-white rounded-xl font-medium flex items-center justify-center gap-2">
                  <Eye className="w-4 h-4" /> Scan New
                </Link>
                <button
                  onClick={() => deleteItem(selectedItem.id)}
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
