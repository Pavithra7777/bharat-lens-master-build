import { useState, useEffect } from 'react';
import { useApp } from '../lib/AppContext';
import db from '../lib/db';
import { Plus, Users, Crown, Trash2, Loader2, X } from 'lucide-react';

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  date_of_birth: string | null;
  occupation: string | null;
  annual_income: number | null;
  category: string | null;
  created_at: string;
  created_by: string;
  owner_id?: string | null;
}

interface FamilyGroup {
  id: string;
  group_name: string;
  created_by: string;
  created_at: string;
}

const RELATIONSHIPS = ['Self', 'Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister', 'Other'];
const OCCUPATIONS = ['Student', 'Farmer', 'Salaried', 'Business', 'Self-Employed', 'Unemployed', 'Senior Citizen', 'Homemaker', 'Other'];
const CATEGORIES = ['General', 'SC', 'ST', 'OBC', 'Minority', 'BPL', 'Disabled'];

export function FamilyPage() {
  const { profile } = useApp();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberRelation, setMemberRelation] = useState('Self');
  const [memberDob, setMemberDob] = useState('');
  const [memberOccupation, setMemberOccupation] = useState('');
  const [memberIncome, setMemberIncome] = useState('');
  const [memberCategory, setMemberCategory] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) loadMembers();
  }, [profile]);

  async function loadMembers() {
    if (!profile) return;
    setLoading(true);
    try {
      const group = await db.getFamilyGroupByOwner();
      if (group) {
        const data = await db.getFamilyMembers(group.id);
        setMembers(data);
      }
    } catch (error) {
      console.error('Load members failed:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addMember() {
    if (!memberName.trim() || !profile) return;
    setSaving(true);
    try {
      let group = await db.getFamilyGroupByOwner();
      if (!group) {
        group = await db.addFamilyGroup({ group_name: profile.full_name ? `${profile.full_name}'s Family` : 'My Family' });
      }
      if (group) {
        const newMember = await db.addFamilyMember({
          name: memberName.trim(),
          relationship: memberRelation,
          date_of_birth: memberDob || null,
          occupation: memberOccupation || null,
          annual_income: memberIncome ? parseFloat(memberIncome) : null,
          category: memberCategory || null,
          family_group_id: group.id,
          owner_id: profile.id,
        });
        if (newMember) {
          setMembers(prev => [...prev, newMember]);
        }
      }
      resetForm();
    } catch (error) {
      console.error('Add member failed:', error);
    } finally {
      setSaving(false);
    }
  }

  async function deleteMember(id: string) {
    if (!confirm('Remove this family member?')) return;
    try {
      await db.deleteFamilyMember(id);
      setMembers(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }

  function resetForm() {
    setMemberName('');
    setMemberRelation('Self');
    setMemberDob('');
    setMemberOccupation('');
    setMemberIncome('');
    setMemberCategory('');
    setShowAddModal(false);
    setEditingMember(null);
  }

  function openEdit(member: FamilyMember) {
    setEditingMember(member);
    setMemberName(member.name);
    setMemberRelation(member.relationship);
    setMemberDob(member.date_of_birth || '');
    setMemberOccupation(member.occupation || '');
    setMemberIncome(member.annual_income?.toString() || '');
    setMemberCategory(member.category || '');
    setShowAddModal(true);
  }

  const getQualifyingSchemes = (member: FamilyMember) => {
    if (!profile) return 0;
    return 3;
  };

  const memberAge = (dob: string) => {
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#1B3A6B] animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading family...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-24">
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-6 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white">Family Members</h1>
        <p className="text-white/70 mt-1">Manage your family details for better scheme matching</p>
      </div>

      <div className="px-6 py-6">
        {members.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-[#1A1A2E] mb-2">No family members added</h3>
            <p className="text-gray-500 mb-4">Add family members to find schemes they qualify for</p>
            <button onClick={() => setShowAddModal(true)} className="bg-[#1B3A6B] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#2a4a8a] transition-colors flex items-center gap-2 mx-auto">
              <Plus className="w-5 h-5" /> Add Family Member
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
                <p className="text-3xl font-bold text-[#1B3A6B]">{members.length}</p>
                <p className="text-xs text-gray-500">Members</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
                <p className="text-3xl font-bold text-green-600">{members.filter(m => m.occupation === 'Student').length}</p>
                <p className="text-xs text-gray-500">Students</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
                <p className="text-3xl font-bold text-amber-600">{members.filter(m => m.occupation === 'Farmer').length}</p>
                <p className="text-xs text-gray-500">Farmers</p>
              </div>
            </div>

            <div className="space-y-3">
              {members.map(member => (
                <div key={member.id} className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-[#1B3A6B]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-semibold text-[#1B3A6B]">{member.name[0].toUpperCase()}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[#1A1A2E]">{member.name}</h3>
                        {member.relationship === 'Self' && <Crown className="w-4 h-4 text-amber-500" />}
                      </div>
                      <p className="text-sm text-gray-500">{member.relationship}{member.date_of_birth ? ` • ${memberAge(member.date_of_birth)} years` : ''}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {member.occupation && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">{member.occupation}</span>}
                        {member.category && <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs">{member.category}</span>}
                        {member.annual_income != null && <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs">₹{member.annual_income.toLocaleString('en-IN')}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => openEdit(member)} className="text-xs text-[#1B3A6B] font-medium px-3 py-1.5 bg-[#1B3A6B]/5 rounded-lg hover:bg-[#1B3A6B]/10">Edit</button>
                      {member.relationship !== 'Self' && (
                        <button onClick={() => deleteMember(member.id)} className="text-xs text-red-500 font-medium px-3 py-1.5 bg-red-50 rounded-lg hover:bg-red-100 flex items-center gap-1">
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setShowAddModal(true)} className="fixed bottom-24 right-6 w-14 h-14 bg-[#1B3A6B] text-white rounded-full shadow-lg flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-[#1A1A2E]">{editingMember ? 'Edit Member' : 'Add Family Member'}</h2>
              <button onClick={resetForm} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" value={memberName} onChange={e => setMemberName(e.target.value)} placeholder="Full name" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B3A6B] focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship *</label>
                <select value={memberRelation} onChange={e => setMemberRelation(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B3A6B] focus:border-transparent">
                  {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input type="date" value={memberDob} onChange={e => setMemberDob(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B3A6B] focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                <select value={memberOccupation} onChange={e => setMemberOccupation(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B3A6B] focus:border-transparent">
                  <option value="">Select</option>
                  {OCCUPATIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Annual Income (₹)</label>
                <input type="number" value={memberIncome} onChange={e => setMemberIncome(e.target.value)} placeholder="e.g., 250000" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B3A6B] focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={memberCategory} onChange={e => setMemberCategory(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1B3A6B] focus:border-transparent">
                  <option value="">Select</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={addMember} disabled={saving || !memberName.trim()} className="w-full py-3 bg-[#1B3A6B] text-white rounded-xl font-medium hover:bg-[#2a4a8a] disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : <>{editingMember ? 'Update' : 'Add'} Member</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
