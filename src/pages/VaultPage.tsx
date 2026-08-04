import { useState, useEffect } from 'react';
import { db } from '@doable/data';
import { useApp } from '../lib/AppContext';
import { Link } from '../lib/Router';
import { FolderOpen, FileText, CreditCard, Car, Home, Trash2, Eye, Calendar, IdCard, Sparkles, AlertTriangle, FileCheck, ExternalLink, Info, Plus, X, Save, ChevronRight } from 'lucide-react';

interface vaultItem {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  item_type: string | null;
  metadata: any;
  created_at: string;
}

interface NewItemForm {
  title: string;
  description: string;
  category: string;
  notes: string;
}

// Helper function to check if a string is a valid URL
function isValidUrl(string: string): boolean {
  if (!string) return false;
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const CATEGORIES = [
  { value: 'document', label: 'General Document', icon: FileText },
  { value: 'aadhaar', label: 'Aadhaar Card', icon: CreditCard },
  { value: 'pan', label: 'PAN Card', icon: FileText },
  { value: 'passport', label: 'Passport', icon: IdCard },
  { value: 'license', label: 'License', icon: Car },
  { value: 'certificate', label: 'Certificate', icon: FileText },
  { value: 'land_record', label: 'Land Record', icon: Home },
  { value: 'ration', label: 'Ration Card', icon: FileText },
  { value: 'voter_id', label: 'Voter ID', icon: IdCard },
  { value: 'bank', label: 'Bank Document', icon: FileText },
  { value: 'insurance', label: 'Insurance', icon: FileText },
  { value: 'other', label: 'Other', icon: FileText },
];

export function VaultPage() {
  const [items, setItems] = useState<vaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedItem, setSelectedItem] = useState<vaultItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const { profile } = useApp();

  const [newItem, setNewItem] = useState<NewItemForm>({
    title: '',
    description: '',
    category: 'document',
    notes: '',
  });

  useEffect(() => {
    loadItems();
  }, [profile?.id]);

  async function loadItems() {
    setLoading(true);
    try {
      const r = await db.query<vaultItem>(
        `SELECT id, title, description, category, item_type, metadata, created_at 
         FROM vault_items ORDER BY created_at DESC`
      );
      if (r.ok && r.rows) {
        setItems(r.rows);
      }
    } catch (error) {
      console.error('Load vault items failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddItem() {
    if (!newItem.title.trim()) {
      alert('Please enter a title');
      return;
    }

    setSaving(true);
    try {
      const metadata = newItem.notes ? { notes: newItem.notes } : {};
      
      const r = await db.query<{ id: string }>(
        `INSERT INTO vault_items (title, description, category, item_type, metadata) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, title, description, category, item_type, metadata, created_at`,
        [
          newItem.title.trim(),
          newItem.description.trim() || null,
          newItem.category,
          'manual',
          JSON.stringify(metadata),
        ]
      );

      if (r.ok && r.rows && r.rows.length > 0) {
        // Reload to get complete item
        await loadItems();
        setShowAddModal(false);
        setNewItem({ title: '', description: '', category: 'document', notes: '' });
      }
    } catch (error) {
      console.error('Add item failed:', error);
      alert('Failed to save item. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Are you sure you want to delete this item? This cannot be undone.')) return;
    
    try {
      await db.query('DELETE FROM vault_items WHERE id = $1', [id]);
      setItems(prev => prev.filter(item => item.id !== id));
      setSelectedItem(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }

  function getItemIcon(item: vaultItem) {
    if (item.item_type === 'scan_result') {
      const meta = item.metadata || {};
      if (meta.is_scam) return AlertTriangle;
      if (meta.schemes_found?.length > 0) return Sparkles;
      return FileCheck;
    }
    const cat = CATEGORIES.find(c => c.value === item.category);
    return cat?.icon || FileText;
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
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-6 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Vault</h1>
            <p className="text-white/70 mt-1">Your saved documents and scans</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg"
          >
            <Plus className="w-6 h-6 text-[#1B3A6B]" />
          </button>
        </div>
        
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
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-[#1A1A2E] mb-2">Vault is empty</h3>
            <p className="text-gray-500 mb-6">Add documents or scan to save them here</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1B3A6B] text-white rounded-xl font-medium"
            >
              <Plus className="w-5 h-5" /> Add Document
            </button>
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
                  <h3 className="font-medium text-[#1A1A2E] line-clamp-2 text-sm">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(item.created_at).toLocaleDateString('en-IN', {
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
                      <h3 className="font-medium text-[#1A1A2E] line-clamp-1">
                        {item.title}
                      </h3>
                      {schemeCount > 0 && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          {schemeCount} schemes
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {item.description || 'No description'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      {items.length > 0 && (
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-[#1B3A6B] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#2A4A8B] transition z-40"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1A1A2E]">
                Add Document
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., My Aadhaar Card"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30 focus:border-[#1B3A6B]"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setNewItem(prev => ({ ...prev, category: cat.value }))}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition ${
                          newItem.category === cat.value
                            ? 'border-[#1B3A6B] bg-[#1B3A6B]/5'
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${newItem.category === cat.value ? 'text-[#1B3A6B]' : 'text-gray-400'}`} />
                        <span className={`text-xs text-center ${newItem.category === cat.value ? 'text-[#1B3A6B] font-medium' : 'text-gray-500'}`}>
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the document..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30 focus:border-[#1B3A6B] resize-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={newItem.notes}
                  onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes or details..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/30 focus:border-[#1B3A6B] resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  disabled={saving || !newItem.title.trim()}
                  className="flex-1 py-3 bg-[#1B3A6B] text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1A1A2E]">
                {selectedItem.title}
              </h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Category badge */}
              {selectedItem.category && (
                <div className="flex items-center gap-2">
                  {(() => {
                    const cat = CATEGORIES.find(c => c.value === selectedItem.category);
                    const Icon = cat?.icon || FileText;
                    return (
                      <>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1B3A6B]/10 text-[#1B3A6B] rounded-full text-sm font-medium">
                          <Icon className="w-4 h-4" />
                          {cat?.label || selectedItem.category}
                        </span>
                        {selectedItem.item_type === 'manual' && (
                          <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            Manual Entry
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {selectedItem.description && (
                <div className="bg-[#1B3A6B]/5 rounded-xl p-4">
                  <h3 className="font-medium text-[#1B3A6B] mb-2">Description</h3>
                  <p className="text-gray-600">{selectedItem.description}</p>
                </div>
              )}

              {/* Notes */}
              {selectedItem.metadata?.notes && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-medium text-gray-700 mb-2">Notes</h3>
                  <p className="text-gray-600">{selectedItem.metadata.notes}</p>
                </div>
              )}

              {/* Scan-specific content */}
              {selectedItem.item_type === 'scan_result' && selectedItem.metadata && (
                <>
                  {/* Schemes found */}
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
                            
                            {/* Apply Link */}
                            {scheme.apply_url && (
                              <div className="mt-3">
                                {isValidUrl(scheme.apply_url) ? (
                                  <a 
                                    href={scheme.apply_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                                  >
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
                            
                            {/* Official URL */}
                            {scheme.official_url && isValidUrl(scheme.official_url) && (
                              <div className="mt-2">
                                <a 
                                  href={scheme.official_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 hover:underline"
                                >
                                  <ExternalLink className="w-3 h-3" /> Official Website
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extracted text */}
                  {selectedItem.metadata.extracted_text && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FileCheck className="w-4 h-4" /> Extracted Text
                      </h3>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {selectedItem.metadata.extracted_text}
                      </p>
                    </div>
                  )}

                  {/* Warnings */}
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

                  {/* Recommendations */}
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
                Saved on {new Date(selectedItem.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
              
              <div className="flex gap-3">
                <Link to="/scan" className="flex-1 py-3 bg-[#1B3A6B] text-white rounded-xl font-medium flex items-center justify-center gap-2">
                  <Eye className="w-4 h-4" />
                  Scan New
                </Link>
                <button
                  onClick={() => deleteItem(selectedItem.id)}
                  className="w-14 h-14 border-2 border-red-200 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-50 transition"
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
