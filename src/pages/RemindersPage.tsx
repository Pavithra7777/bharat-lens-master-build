import { useState, useEffect, useCallback } from 'react';
import { db } from '@doable/data';
import { useApp } from '../lib/AppContext';
import { Calendar, List, Plus, Bell, Check, Trash2, Loader2 } from 'lucide-react';
import { translations } from '../lib/i18n';

interface Reminder {
  id: string;
  title: string;
  due_date: string;
  is_completed: boolean;
  related_document_id: string | null;
  related_application_id: string | null;
  created_at: string;
}

export function RemindersPage() {
  const { user, language } = useApp();
  const t = translations[language || 'en'];
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');

  const loadReminders = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      // Query reminders filtered by current user via RLS
      const r = await db.query<Reminder>(
        'SELECT * FROM reminders ORDER BY due_date ASC'
      );
      if (r.ok && r.rows) {
        setReminders(r.rows);
      }
    } catch (error) {
      console.error('Load reminders failed:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  async function addReminder() {
    if (!newTitle.trim() || !newDate) return;
    
    try {
      const r = await db.query<Reminder>(
        'INSERT INTO reminders (title, due_date) VALUES ($1, $2) RETURNING *',
        [newTitle.trim(), newDate]
      );
      if (r.ok && r.rows.length > 0 && r.rows[0]) {
        const newReminder = r.rows[0];
        setReminders(prev => {
          const updated = [...prev, newReminder];
          return updated.sort((a, b) => 
            new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
          );
        });
        setNewTitle('');
        setNewDate('');
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Add reminder failed:', error);
    }
  }

  async function toggleComplete(id: string, currentStatus: boolean) {
    try {
      const r = await db.query(
        'UPDATE reminders SET is_completed = $1 WHERE id = $2 RETURNING *',
        [!currentStatus, id]
      );
      if (r.ok && r.rows.length > 0) {
        setReminders(prev =>
          prev.map(rem =>
            rem.id === id ? { ...rem, is_completed: !currentStatus } : rem
          )
        );
      }
    } catch (error) {
      console.error('Toggle complete failed:', error);
    }
  }

  async function deleteReminder(id: string) {
    try {
      await db.query('DELETE FROM reminders WHERE id = $1', [id]);
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Delete reminder failed:', error);
    }
  }

  // Group reminders by status
  const upcomingReminders = reminders.filter(r => !r.is_completed);
  const completedReminders = reminders.filter(r => r.is_completed);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const reminderDate = new Date(date);
    reminderDate.setHours(0, 0, 0, 0);

    if (reminderDate.getTime() === today.getTime()) return 'Today';
    if (reminderDate.getTime() === tomorrow.getTime()) return 'Tomorrow';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const isOverdue = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr) < today;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#1B3A6B] animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading reminders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <header className="bg-[#1B3A6B] text-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Reminders</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg hover:bg-white/30 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">Add</span>
          </button>
        </div>
      </header>

      <div className="p-4">
        {reminders.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Reminders Yet</h2>
            <p className="text-gray-500 mb-4">Create your first reminder to stay on track</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#1B3A6B] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#2a4a8a] transition-colors"
            >
              Create Reminder
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upcoming Reminders */}
            {upcomingReminders.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-[#1A1A2E] mb-3 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#1B3A6B]" />
                  Upcoming ({upcomingReminders.length})
                </h2>
                <div className="space-y-2">
                  {upcomingReminders.map(reminder => (
                    <div
                      key={reminder.id}
                      className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${
                        isOverdue(reminder.due_date) ? 'border-l-red-500' : 'border-l-[#1B3A6B]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleComplete(reminder.id, reminder.is_completed)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            reminder.is_completed
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-300 hover:border-[#1B3A6B]'
                          }`}
                        >
                          {reminder.is_completed && <Check className="w-4 h-4" />}
                        </button>
                        <div className="flex-1">
                          <p className={`font-medium ${isOverdue(reminder.due_date) ? 'text-red-600' : 'text-[#1A1A2E]'}`}>
                            {reminder.title}
                          </p>
                          <p className={`text-sm ${isOverdue(reminder.due_date) ? 'text-red-400' : 'text-gray-500'}`}>
                            {formatDate(reminder.due_date)}
                            {isOverdue(reminder.due_date) && ' • Overdue'}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteReminder(reminder.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Completed Reminders */}
            {completedReminders.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-500 mb-3 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Completed ({completedReminders.length})
                </h2>
                <div className="space-y-2">
                  {completedReminders.map(reminder => (
                    <div
                      key={reminder.id}
                      className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-l-gray-300 opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleComplete(reminder.id, reminder.is_completed)}
                          className="w-6 h-6 rounded-full border-2 bg-green-500 border-green-500 text-white flex items-center justify-center"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <div className="flex-1">
                          <p className="font-medium text-gray-500 line-through">{reminder.title}</p>
                          <p className="text-sm text-gray-400">
                            {formatDate(reminder.due_date)}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteReminder(reminder.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-[#1A1A2E] mb-4">New Reminder</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g., Submit application for PM Kisan"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1B3A6B] focus:ring-2 focus:ring-[#1B3A6B]/20 outline-none transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addReminder}
                disabled={!newTitle.trim() || !newDate}
                className="flex-1 px-4 py-3 rounded-xl bg-[#1B3A6B] text-white font-medium hover:bg-[#2a4a8a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
