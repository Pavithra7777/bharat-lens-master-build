import { useState, useEffect } from 'react';
import { db } from '@doable/data';
import { Calendar, List, Plus, Bell, Check, Trash2 } from 'lucide-react';

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
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');

  useEffect(() => {
    loadReminders();
  }, []);

  async function loadReminders() {
    setLoading(true);
    try {
      // Query all reminders - RLS handles owner filtering
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
  }

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

  async function toggleComplete(id: string) {
    try {
      await db.query(
        'UPDATE reminders SET is_completed = NOT is_completed WHERE id = $1',
        [id]
      );
      setReminders(prev => prev.map(r => 
        r.id === id ? { ...r, is_completed: !r.is_completed } : r
      ));
    } catch (error) {
      console.error('Toggle failed:', error);
    }
  }

  async function deleteReminder(id: string) {
    if (!confirm('Delete this reminder?')) return;
    try {
      await db.query('DELETE FROM reminders WHERE id = $1', [id]);
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }

  function getDaysUntil(date: string): number {
    return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  function groupByDate(remindersList: Reminder[]) {
    const groups: Record<string, Reminder[]> = {};
    remindersList.forEach(r => {
      const date = r.due_date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(r);
    });
    return groups;
  }

  const upcomingReminders = reminders.filter(r => !r.is_completed && new Date(r.due_date) >= new Date());
  const completedReminders = reminders.filter(r => r.is_completed);
  const grouped = groupByDate(upcomingReminders);

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-6 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Reminders</h1>
            <p className="text-white/70 mt-1">Never miss a deadline</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView('list')}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition ${
                view === 'list' ? 'bg-white text-[#1B3A6B]' : 'bg-white/20 text-white'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition ${
                view === 'calendar' ? 'bg-white text-[#1B3A6B]' : 'bg-white/20 text-white'
              }`}
            >
              <Calendar className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl skeleton" />
            ))}
          </div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-[#1A1A2E] mb-2">No reminders yet</h3>
            <p className="text-gray-500 mb-6">Add reminders for important deadlines</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1B3A6B] text-white rounded-xl font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Reminder
            </button>
          </div>
        ) : (
          <>
            {/* Upcoming */}
            {Object.entries(grouped).map(([date, items]) => {
              const days = getDaysUntil(date);
              return (
                <div key={date} className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      days <= 3 ? 'bg-red-100 text-red-600' :
                      days <= 7 ? 'bg-amber-100 text-amber-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days`}
                    </div>
                    <span className="text-gray-400">
                      {new Date(date).toLocaleDateString('en-IN', {
                        weekday: 'long', day: 'numeric', month: 'short'
                      })}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {items.map((reminder) => (
                      <div
                        key={reminder.id}
                        className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-4"
                      >
                        <button
                          onClick={() => toggleComplete(reminder.id)}
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition ${
                            reminder.is_completed
                              ? 'bg-[#0F9D58] border-[#0F9D58]'
                              : 'border-gray-300 hover:border-[#1B3A6B]'
                          }`}
                        >
                          {reminder.is_completed && <Check className="w-4 h-4 text-white" />}
                        </button>
                        <div className="flex-1">
                          <p className={`font-medium ${reminder.is_completed ? 'line-through text-gray-400' : 'text-[#1A1A2E]'}`}>
                            {reminder.title}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteReminder(reminder.id)}
                          className="w-8 h-8 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Completed */}
            {completedReminders.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-400 mb-3">Completed</h3>
                <div className="space-y-2">
                  {completedReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="bg-gray-50 rounded-xl p-4 flex items-center gap-4 opacity-60"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#0F9D58] flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <p className="flex-1 line-through text-gray-400">{reminder.title}</p>
                      <button
                        onClick={() => deleteReminder(reminder.id)}
                        className="w-8 h-8 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <button 
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#FF7A00] text-white rounded-full shadow-lg flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white rounded-t-3xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#1A1A2E]">Add Reminder</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Aadhaar card renewal"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                />
              </div>
              <button
                onClick={addReminder}
                disabled={!newTitle.trim() || !newDate}
                className="w-full py-4 bg-[#1B3A6B] text-white rounded-xl font-medium disabled:opacity-50"
              >
                Add Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
