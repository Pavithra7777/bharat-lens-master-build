import { useState, useEffect } from 'react';
import { db } from '@doable/data';
import { useApp } from '../lib/AppContext';
import { Users, Plus, Copy, Trash2 } from 'lucide-react';

interface FamilyMember {
  id: string;
  family_group_id: string;
  profile_id: string | null;
  relation: string;
  display_name: string;
  permissions: {
    view_documents: boolean;
    manage_reminders: boolean;
  };
  invited_at: string;
  accepted_at: string | null;
}

const RELATIONS = [
  { id: 'self', icon: '👤', label: 'Self' },
  { id: 'spouse', icon: '💑', label: 'Spouse' },
  { id: 'child', icon: '👶', label: 'Child' },
  { id: 'parent', icon: '👴', label: 'Parent' },
  { id: 'grandparent', icon: '🧓', label: 'Grandparent' },
  { id: 'other', icon: '👥', label: 'Other' },
];

export function FamilyPage() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [newMember, setNewMember] = useState({ relation: '', display_name: '' });
  const { profile, setActiveFamilyMember, activeFamilyMemberId } = useApp();

  useEffect(() => {
    loadFamilyData();
  }, [profile?.id]);

  async function loadFamilyData() {
    if (!profile) return;
    setLoading(true);

    try {
      const groupR = await db.query<{ id: string }>(
        'SELECT id FROM family_groups WHERE owner_id = $1 LIMIT 1',
        [profile.id]
      );

      if (groupR.ok && groupR.rows.length > 0 && groupR.rows[0]) {
        const membersR = await db.query<FamilyMember>(
          'SELECT * FROM family_members WHERE family_group_id = $1 ORDER BY invited_at',
          [groupR.rows[0].id]
        );
        if (membersR.ok && membersR.rows) {
          setFamilyMembers(membersR.rows);
        }
        setInviteCode(generateInviteCode());
      } else {
        const newGroupR = await db.query<{ id: string }>(
          'INSERT INTO family_groups (owner_id, group_name) VALUES ($1, $2) RETURNING id',
          [profile.id, `${profile.full_name || 'User'}'s Family`]
        );
        
        if (newGroupR.ok && newGroupR.rows.length > 0 && newGroupR.rows[0]) {
          await db.query(
            'INSERT INTO family_members (family_group_id, profile_id, relation, display_name) VALUES ($1, $2, $3, $4)',
            [newGroupR.rows[0].id, profile.id, 'self', profile.full_name || 'Me']
          );
          setInviteCode(generateInviteCode());
          loadFamilyData();
        }
      }
    } catch (error) {
      console.error('Load family data failed:', error);
    } finally {
      setLoading(false);
    }
  }

  function generateInviteCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async function addMember() {
    if (!newMember.relation || !newMember.display_name || !profile) return;

    try {
      const groupR = await db.query<{ id: string }>(
        'SELECT id FROM family_groups WHERE owner_id = $1 LIMIT 1',
        [profile.id]
      );

      if (!groupR.ok || groupR.rows.length === 0 || !groupR.rows[0]) return;

      const r = await db.query<FamilyMember>(
        `INSERT INTO family_members (family_group_id, relation, display_name) 
         VALUES ($1, $2, $3) RETURNING *`,
        [groupR.rows[0].id, newMember.relation, newMember.display_name]
      );

      if (r.ok && r.rows.length > 0) {
        const insertedMember = r.rows[0];
        if (insertedMember) {
          setFamilyMembers(prev => [...prev, insertedMember]);
          setNewMember({ relation: '', display_name: '' });
          setShowAddModal(false);
        }
      }
    } catch (error) {
      console.error('Add member failed:', error);
    }
  }

  async function removeMember(id: string) {
    if (!confirm('Remove this family member?')) return;

    try {
      await db.query('DELETE FROM family_members WHERE id = $1', [id]);
      setFamilyMembers(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Remove member failed:', error);
    }
  }

  async function copyInviteCode() {
    await navigator.clipboard.writeText(inviteCode);
    alert('Invite code copied! Share this with family members to join your family group.');
  }

  const getRelationInfo = (relId: string) => {
    return RELATIONS.find(r => r.id === relId) || RELATIONS[5];
  };

  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2A4A8B] px-6 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-white">Family Mode</h1>
        <p className="text-white/70 mt-1">Manage documents for your whole family</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Invite Code */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Family Invite Code</p>
              <p className="text-2xl font-bold tracking-widest text-[#1B3A6B]">{inviteCode || '------'}</p>
            </div>
            <button
              onClick={copyInviteCode}
              className="w-12 h-12 bg-[#1B3A6B]/10 rounded-xl flex items-center justify-center"
            >
              <Copy className="w-5 h-5 text-[#1B3A6B]" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Share this code with family members to let them join
          </p>
        </div>

        {/* Active User */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500 mb-3">Currently viewing as</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#1B3A6B] rounded-full flex items-center justify-center text-white font-bold">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-[#1A1A2E]">{profile?.full_name || 'You'}</p>
              <p className="text-sm text-gray-500">Account Owner</p>
            </div>
          </div>
        </div>

        {/* Family Members */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#1A1A2E] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#1B3A6B]" />
              Family Members
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#1B3A6B] text-white rounded-lg text-sm font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl skeleton" />
              ))}
            </div>
          ) : familyMembers.length <= 1 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No additional family members yet</p>
              <p className="text-sm text-gray-400">Use the invite code to add family</p>
            </div>
          ) : (
            <div className="space-y-3">
              {familyMembers.map((member) => {
                const relation = getRelationInfo(member.relation);
                const isActive = activeFamilyMemberId === member.id;
                
                return (
                  <button
                    key={member.id}
                    onClick={() => setActiveFamilyMember(member.id)}
                    className={`w-full bg-white rounded-xl p-4 border text-left flex items-center gap-4 transition ${
                      isActive ? 'border-[#1B3A6B] bg-[#1B3A6B]/5' : 'border-gray-100'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                      member.relation === 'self' ? 'bg-[#1B3A6B] text-white' : 'bg-gray-100'
                    }`}>
                      {relation?.icon || '👥'}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[#1A1A2E]">{member.display_name}</p>
                      <p className="text-sm text-gray-500 capitalize">{relation?.label || 'Other'}</p>
                    </div>
                    {member.relation === 'self' && (
                      <span className="px-2 py-1 bg-[#FF7A00]/10 text-[#FF7A00] rounded text-xs font-medium">
                        Owner
                      </span>
                    )}
                    {isActive && (
                      <span className="text-[#1B3A6B]">✓</span>
                    )}
                    {member.relation !== 'self' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMember(member.id);
                        }}
                        className="w-8 h-8 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Permissions Info */}
        <div className="bg-blue-50 rounded-xl p-4">
          <h3 className="font-semibold text-[#1B3A6B] mb-2">About Family Mode</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Each family member has their own document vault</li>
            <li>• Documents can be shared with family based on permissions</li>
            <li>• Only the account owner can manage family settings</li>
          </ul>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white rounded-t-3xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#1A1A2E]">Add Family Member</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relation</label>
                <div className="grid grid-cols-3 gap-2">
                  {RELATIONS.filter(r => r.id !== 'self').map((rel) => (
                    <button
                      key={rel.id}
                      onClick={() => setNewMember(prev => ({ ...prev, relation: rel.id }))}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition ${
                        newMember.relation === rel.id
                          ? 'border-[#1B3A6B] bg-[#1B3A6B]/5'
                          : 'border-gray-200'
                      }`}
                    >
                      <span className="text-2xl">{rel.icon}</span>
                      <span className="text-xs font-medium">{rel.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                <input
                  type="text"
                  value={newMember.display_name}
                  onChange={(e) => setNewMember(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="e.g., Father, Mother"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                />
              </div>

              <button
                onClick={addMember}
                disabled={!newMember.relation || !newMember.display_name}
                className="w-full py-4 bg-[#1B3A6B] text-white rounded-xl font-medium disabled:opacity-50"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
