import { useState, useEffect } from 'react';
import db from '../lib/db';
import { useApp } from '../lib/AppContext';
import { Plus, CheckCircle, Clock, Send, XCircle, Trash2 } from 'lucide-react';

interface Application {
  id: string;
  scheme_id: string | null;
  custom_title: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  is_completed: boolean;
}

const STATUS_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  not_started: { icon: Clock, label: 'Not Started', color: 'status-not-started' },
  in_progress: { icon: Clock, label: 'In Progress', color: 'status-in-progress' },
  submitted: { icon: Send, label: 'Submitted', color: 'status-submitted' },
  approved: { icon: CheckCircle, label: 'Approved', color: 'status-approved' },
  rejected: { icon: XCircle, label: 'Rejected', color: 'status-rejected' },
};

export function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const { profile } = useApp();

  useEffect(() => {
    loadApplications();
  }, [profile]);

  async function loadApplications() {
    if (!profile) return;
    setLoading(true);
    try {
      const data = await db.getApplications();
      setApplications(data.filter(app => app.owner_id === profile.id || app.owner_id === profile?.id));
    } catch (error) {
      if (error?.code !== 'PGRST205') console.error('Load applications failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadChecklist(appId: string) {
    try {
      const data = await db.getChecklistItems(appId);
      setChecklist(data);
    } catch (error) {
      if (error?.code !== 'PGRST205') console.error('Load checklist failed:', error);
    }
  }

  async function toggleChecklistItem(itemId: string) {
    const item = checklist.find(i => i.id === itemId);
    if (!item) return;
    try {
      await db.updateChecklistItem(itemId, { is_completed: !item.is_completed });
      setChecklist(prev => prev.map(i => i.id === itemId ? { ...i, is_completed: !i.is_completed } : i));
    } catch (error) {
      if (error?.code !== 'PGRST205') console.error('Toggle failed:', error);
    }
  }

  async function updateStatus(appId: string, newStatus: string) {
    try {
      await db.updateApplication(appId, { status: newStatus });
      setApplications(prev => prev.map(app =>
        app.id === appId ? { ...app, status: newStatus, updated_at: new Date().toISOString() } : app
      ));
      if (selectedApp) setSelectedApp({ ...selectedApp, status: newStatus });
    } catch (error) {
      if (error?.code !== 'PGRST205') console.error('Update status failed:', error);
    }
  }

  async function deleteApplication(appId: string) {
    if (!confirm('Are you sure you want to delete this application?')) return;
    try {
      await db.deleteApplication(appId);
      setApplications(prev => prev.filter(a => a.id !== appId));
      setSelectedApp(null);
    } catch (error) {
      if (error?.code !== 'PGRST205') console.error('Delete failed:', error);
    }
  }

  const groupedApps = {
    not_started: applications.filter(a => a.status === 'not_started'),
    in_progress: applications.filter(a => a.status === 'in_progress'),
    submitted: applications.filter(a => a.status === 'submitted'),
    completed: applications.filter(a => ['approved', 'rejected'].includes(a.status)),
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-24">
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-6 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white">My Applications</h1>
        <p className="text-white/70 mt-1">Track your government scheme applications</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl skeleton" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📋</span>
            </div>
            <h3 className="text-lg font-medium text-[#1A1A2E] mb-2">No applications yet</h3>
            <p className="text-gray-500">Start tracking your government applications</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(groupedApps).map(([key, apps]) => (
                <div key={key} className="bg-white rounded-xl p-3 text-center border border-gray-100">
                  <p className="text-2xl font-bold text-[#1B3A6B]">{apps.length}</p>
                  <p className="text-xs text-gray-500">{STATUS_CONFIG[key]?.label || key}</p>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              {Object.entries(groupedApps).map(([status, apps]) => (
                apps.length > 0 && (
                  <div key={status}>
                    <h3 className="font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2">
                      {status === 'in_progress' && <Clock className="w-4 h-4 text-[#1B3A6B]" />}
                      {status === 'submitted' && <Send className="w-4 h-4 text-[#FF7A00]" />}
                      {status === 'completed' && <CheckCircle className="w-4 h-4 text-[#0F9D58]" />}
                      {STATUS_CONFIG[status]?.label || status}
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">{apps.length}</span>
                    </h3>
                    <div className="space-y-3">
                      {apps.map((app) => {
                        const Icon = STATUS_CONFIG[app.status]?.icon || Clock;
                        return (
                          <button
                            key={app.id}
                            onClick={() => { setSelectedApp(app); loadChecklist(app.id); }}
                            className="w-full bg-white rounded-xl p-4 border border-gray-100 text-left hover:border-[#1B3A6B]/30 transition"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${app.status === 'approved' ? 'bg-green-100' : app.status === 'rejected' ? 'bg-red-100' : app.status === 'submitted' ? 'bg-amber-100' : 'bg-gray-100'}`}>
                                  <Icon className={`w-5 h-5 ${app.status === 'approved' ? 'text-green-600' : app.status === 'rejected' ? 'text-red-600' : app.status === 'submitted' ? 'text-amber-600' : 'text-gray-500'}`} />
                                </div>
                                <div>
                                  <h4 className="font-medium text-[#1A1A2E]">{app.custom_title || 'Government Application'}</h4>
                                  <p className="text-xs text-gray-500">Updated {new Date(app.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                </div>
                              </div>
                              <span className={`status-pill ${STATUS_CONFIG[app.status]?.color}`}>{STATUS_CONFIG[app.status]?.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )
              ))}
            </div>
          </>
        )}
      </div>

      <button className="fixed bottom-24 right-6 w-14 h-14 bg-[#FF7A00] text-white rounded-full shadow-lg flex items-center justify-center">
        <Plus className="w-6 h-6" />
      </button>

      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#1A1A2E]">{selectedApp.custom_title || 'Application'}</h2>
                <span className={`status-pill ${STATUS_CONFIG[selectedApp.status]?.color}`}>{STATUS_CONFIG[selectedApp.status]?.label}</span>
              </div>
              <button onClick={() => setSelectedApp(null)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">✕</button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-[#1A1A2E] mb-3">Update Status</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => updateStatus(selectedApp.id, key)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${selectedApp.status === key ? 'bg-[#1B3A6B] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-[#1A1A2E] mb-3">Checklist</h3>
                {checklist.length > 0 ? (
                  <div className="space-y-2">
                    {checklist.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => toggleChecklistItem(item.id)}
                        className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-left"
                      >
                        <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${item.is_completed ? 'bg-[#0F9D58] border-[#0F9D58]' : 'border-gray-300'}`}>
                          {item.is_completed && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                        <span className={item.is_completed ? 'line-through text-gray-400' : 'text-gray-700'}>{item.label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No checklist items</p>
                )}
              </div>

              <button onClick={() => deleteApplication(selectedApp.id)} className="w-full py-3 border-2 border-red-200 text-red-500 rounded-xl font-medium flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
