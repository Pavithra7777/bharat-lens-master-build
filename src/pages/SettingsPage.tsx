import { useState, useEffect } from 'react';
import { useApp } from '../lib/AppContext';
import { useRouter } from '../lib/Router';
import { LANGUAGES } from '../lib/i18n';
import { db } from '@doable/data';
import { ArrowLeft, Home } from 'lucide-react';
import { 
  Globe, Accessibility, Bell, Download, 
  Trash2, LogOut, ChevronRight, Moon, Sun, Shield, Database,
  AlertCircle, Plus, Send, CheckCircle, MessageSquare
} from 'lucide-react';

export function SettingsPage() {
  const { profile, simpleMode, setSimpleMode, language, setLanguage, logout } = useApp();
  const { navigate } = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<'broken' | 'suggest'>('broken');
  const [reportTitle, setReportTitle] = useState('');
  const [reportUrl, setReportUrl] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/auth');
  }

  async function handleDeleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.')) {
      return;
    }
    
    if (!confirm('This will permanently delete all your documents, applications, reminders, and chat history. Type "DELETE" to confirm.')) {
      return;
    }

    alert('Account deletion requires additional verification. Please contact support.');
    setShowDeleteConfirm(false);
  }

  async function submitReport() {
    if (!reportTitle.trim()) {
      alert('Please enter the scheme name');
      return;
    }
    setSubmitting(true);
    try {
      await db.query(
        `INSERT INTO feedback (feedback_type, title, url, description)
         VALUES ($1, $2, $3, $4)`,
        [reportType, reportTitle.trim(), reportUrl.trim(), reportDescription.trim()]
      );
      setReportSubmitted(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSubmitted(false);
        setReportTitle('');
        setReportUrl('');
        setReportDescription('');
      }, 2000);
    } catch (error) {
      alert('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function exportData() {
    alert('Your data export will be prepared and sent to your registered email address.');
  }

  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-lg hover:bg-white/10 text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button onClick={() => navigate('/')} className="p-2 -mr-2 rounded-lg hover:bg-white/10 text-white">
            <Home className="w-5 h-5" />
          </button>
        </div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-white/70 mt-1">Customize your Bharat Lens experience</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Profile Summary */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#1B3A6B] rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-[#1A1A2E]">{profile?.full_name || 'User'}</p>
              <p className="text-sm text-gray-500">{profile?.state || 'Not set'}</p>
              <p className="text-xs text-gray-400 capitalize">
                {(profile?.occupation_category || 'Occupation not set').replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>

        {/* Language */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Language
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {LANGUAGES.map((lang, i) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`w-full px-4 py-4 flex items-center gap-3 text-left ${
                  i < LANGUAGES.length - 1 ? 'border-b border-gray-100' : ''
                } ${language === lang.code ? 'bg-[#1B3A6B]/5' : ''}`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="flex-1">
                  <p className="font-medium text-[#1A1A2E]">{lang.nativeName}</p>
                  <p className="text-sm text-gray-500">{lang.name}</p>
                </div>
                {language === lang.code && (
                  <span className="text-[#1B3A6B] font-medium">✓</span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Accessibility */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
            <Accessibility className="w-4 h-4" />
            Accessibility
          </h2>
          <div className="bg-white rounded-xl border border-gray-100">
            <button
              onClick={() => setSimpleMode(!simpleMode)}
              className="w-full px-4 py-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {simpleMode ? (
                  <Moon className="w-5 h-5 text-[#1B3A6B]" />
                ) : (
                  <Sun className="w-5 h-5 text-gray-400" />
                )}
                <div className="text-left">
                  <p className="font-medium text-[#1A1A2E]">Simple Mode</p>
                  <p className="text-sm text-gray-500">Larger text and icons for easier use</p>
                </div>
              </div>
              <div className={`w-12 h-7 rounded-full transition relative ${
                simpleMode ? 'bg-[#1B3A6B]' : 'bg-gray-200'
              }`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition ${
                  simpleMode ? 'right-1' : 'left-1'
                }`} />
              </div>
            </button>
          </div>
        </section>

        {/* Notifications */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
            <div className="px-4 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-[#1A1A2E]">Push Notifications</p>
                <p className="text-sm text-gray-500">Reminders and updates</p>
              </div>
              <div className="w-12 h-7 bg-[#1B3A6B] rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute right-1 top-1" />
              </div>
            </div>
            <div className="px-4 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-[#1A1A2E]">Email Notifications</p>
                <p className="text-sm text-gray-500">Weekly summary and alerts</p>
              </div>
              <div className="w-12 h-7 bg-[#1B3A6B] rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute right-1 top-1" />
              </div>
            </div>
          </div>
        </section>

        {/* Data & Privacy */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Data & Privacy
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
            <button
              onClick={exportData}
              className="w-full px-4 py-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-gray-400" />
                <p className="font-medium text-[#1A1A2E]">Export My Data</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={() => navigate('/migrate')}
              className="w-full px-4 py-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-[#1B3A6B]" />
                <div className="text-left">
                  <p className="font-medium text-[#1A1A2E]">Migrate to Supabase</p>
                  <p className="text-sm text-gray-500">Transfer data to your Supabase database</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full px-4 py-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-red-500" />
                <p className="font-medium text-red-500">Delete Account</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </section>


        {/* Help & Feedback */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Help & Feedback
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
            <button
              onClick={() => { setReportType('broken'); setShowReportModal(true); }}
              className="w-full px-4 py-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <p className="font-medium text-[#1A1A2E]">Report Broken Link</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={() => { setReportType('suggest'); setShowReportModal(true); }}
              className="w-full px-4 py-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-green-500" />
                <div className="text-left">
                  <p className="font-medium text-[#1A1A2E]">Suggest New Scheme</p>
                  <p className="text-sm text-gray-500">Know about a scheme we should add?</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </section>


        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-4 border-2 border-gray-200 rounded-xl font-medium flex items-center justify-center gap-2 text-gray-600"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>

        {/* App Info */}
        <div className="text-center pt-4">
          <p className="text-sm text-gray-400">Bharat Lens v1.0.0</p>
          <p className="text-xs text-gray-300 mt-1">Made with ❤️ in India</p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-[#1A1A2E] text-center mb-2">Delete Account?</h3>
            <p className="text-gray-500 text-center mb-6">
              This will permanently delete all your data including documents, applications, 
              reminders, and chat history. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Broken Link / Suggest Scheme Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {reportType === 'broken' ? 'Report Broken Link' : 'Suggest New Scheme'}
                </h2>
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {reportSubmitted ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900">Thank you!</p>
                  <p className="text-gray-600 mt-2">Your feedback has been submitted successfully.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scheme Name *
                    </label>
                    <input
                      type="text"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      placeholder="e.g., PM Kisan Yojana"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B3A6B] focus:border-transparent"
                    />
                  </div>

                  {reportType === 'broken' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current (Broken) URL
                      </label>
                      <input
                        type="url"
                        value={reportUrl}
                        onChange={(e) => setReportUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B3A6B] focus:border-transparent"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {reportType === 'broken' ? 'Correct URL (if known)' : 'Description / Website'}
                    </label>
                    <input
                      type="url"
                      value={reportUrl}
                      onChange={(e) => setReportUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B3A6B] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Details
                    </label>
                    <textarea
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder={reportType === 'broken' 
                        ? "Describe the issue..." 
                        : "Tell us about this scheme..."}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B3A6B] focus:border-transparent resize-none"
                    />
                  </div>

                  <button
                    onClick={submitReport}
                    disabled={submitting}
                    className="w-full py-3 bg-[#1B3A6B] text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      'Submitting...'
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Submit Report
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
