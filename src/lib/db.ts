import { createClient } from '@supabase/supabase-js';

// Use environment variables or fallback to constants
const supabaseUrl = (() => {
  const val = import.meta.env.VITE_SUPABASE_URL;
  if (val && val.startsWith('http')) return val;
  return 'https://uvtedewjjkulnkthwcmk.supabase.co';
})();
const supabaseAnonKey = (() => {
  const val = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (val && val.length > 10) return val;
  return 'sb_publishable_ythzGuzXHUW_T8vPqEONBA_C3au-5Je';
})();

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase && supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, detectSessionInUrl: false },
    });
  }
  return supabase;
}

// ─────────────────────────────────────────────────────────────
// Types (matching Supabase schema)
// ─────────────────────────────────────────────────────────────

export interface Scheme {
  id: string;
  name: string;
  description: string;
  eligibility: string;
  benefits: string;
  how_to_apply: string;
  official_url: string;
  apply_url: string;
  department: string;
  category: string;
  state?: string | null;
  income_max?: number | null;
  age_min?: number | null;
  age_max?: number | null;
  gender?: string | null;
  caste_category?: string | null;
  disability_required?: boolean | null;
  documents_required?: string[] | null;
  application_fee?: number | null;
  scholarship_amount?: number | null;
  scholarship_frequency?: string | null;
  application_deadline?: string | null;
  renewal_process?: string | null;
  grievance_mechanism?: string | null;
  scheme_duration?: string | null;
  ngos?: string | null;
  Faq?: string | null;
  is_active?: boolean | null;
  created_at: string;
  updated_at?: string | null;
}

export interface VaultItem {
  id?: string;
  created_by?: string;
  created_at?: string;
  title: string;
  description: string;
  category: string;
  item_type: string;
  metadata?: Record<string, unknown> | null;
}

export interface Reminder {
  id?: string;
  owner_id?: string;
  created_at?: string;
  title: string;
  due_date: string;
  is_completed?: boolean;
  description?: string | null;
  priority?: string | null;
  related_document_id?: string | null;
  related_application_id?: string | null;
  notified_at?: string | null;
}

export interface Application {
  id?: string;
  owner_id?: string;
  created_at?: string;
  scheme_id?: string | null;
  custom_title?: string | null;
  status: string;
  applied_on?: string | null;
  submitted_docs?: string[] | null;
  reference_number?: string | null;
  last_updated?: string | null;
  notes?: string | null;
}

export interface ChecklistItem {
  id?: string;
  owner_id?: string;
  created_at?: string;
  application_id?: string | null;
  title: string;
  is_completed?: boolean | null;
  due_date?: string | null;
  category?: string | null;
}

export interface FamilyGroup {
  id?: string;
  owner_id?: string;
  created_at?: string;
  name: string;
  created_by?: string;
}

export interface FamilyMember {
  id?: string;
  owner_id?: string;
  created_at?: string;
  group_id?: string;
  name: string;
  relationship?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  occupation?: string | null;
  annual_income?: number | null;
  disability_status?: string | null;
  bank_account_linked?: boolean | null;
  aadhar_linked?: boolean | null;
  voter_id_linked?: boolean | null;
  permissions?: Record<string, unknown> | null;
}

export interface Profile {
  id?: string;
  created_by?: string;
  created_at?: string;
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  state?: string | null;
  city?: string | null;
  occupation_category?: string | null;
  annual_income?: number | null;
  disability_status?: string | null;
  preferred_language?: string | null;
  aadhar_verified?: boolean | null;
  onboarding_completed?: boolean | null;
  family_group_id?: string | null;
  updated_at?: string | null;
  simple_mode_enabled?: boolean;
}

export interface Document {
  id?: string;
  created_by?: string;
  created_at?: string;
  title: string;
  doc_type: string;
  file_url?: string | null;
  expiry_date?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ChatSession {
  id?: string;
  owner_id?: string;
  created_at?: string;
  title?: string | null;
  updated_at?: string | null;
}

export interface ChatMessage {
  id?: string;
  owner_id?: string;
  created_at?: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ScamReport {
  id?: string;
  created_by?: string;
  created_at?: string;
  title: string;
  description: string;
  url?: string | null;
  scam_type?: string | null;
  reported_by?: string | null;
  status?: string | null;
}

export interface Feedback {
  id?: string;
  created_by?: string;
  created_at?: string;
  feedback_type: string;
  title?: string | null;
  url?: string | null;
  description?: string | null;
  email?: string | null;
  resolved?: boolean | null;
}

export interface LiveSchemeUpdate {
  id?: string;
  created_by?: string;
  created_at?: string;
  last_fetched_at?: string;
  status?: string;
  schemes_found_count?: number;
  new_schemes_count?: number;
  source_name?: string;
}

// ─────────────────────────────────────────────────────────────
// Supabase helpers
// ─────────────────────────────────────────────────────────────

const db = {
  // ── Schemes (public read) ──────────────────────────────────

  async getSchemes(state?: string): Promise<Scheme[]> {
    const client = getSupabase();
    if (!client) return [];
    let q = client.from('schemes').select('*').order('created_at', { ascending: false });
    if (state) q = q.or(`state.ilike.%${state}%,state.is.null`);
    const { data, error } = await q;
    if (error) { console.error('getSchemes error:', error); return []; }
    return (data as Scheme[]) || [];
  },

  async getSchemeById(id: string): Promise<Scheme | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client.from('schemes').select('*').eq('id', id).single();
    if (error) { console.error('getSchemeById error:', error); return null; }
    return data as Scheme | null;
  },

  async searchSchemes(query: string, category?: string): Promise<Scheme[]> {
    const client = getSupabase();
    if (!client) return [];
    let q = client.from('schemes').select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,eligibility.ilike.%${query}%`);
    if (category) q = q.eq('category', category);
    const { data, error } = await q;
    if (error) { console.error('searchSchemes error:', error); return []; }
    return (data as Scheme[]) || [];
  },

  // ── Vault Items ────────────────────────────────────────────

  async getVaultItems(): Promise<VaultItem[]> {
    const client = getSupabase();
    if (!client) return [];
    const { data, error } = await client
      .from('vault_items')
      .select('id, title, description, category, item_type, metadata, created_at')
      .order('created_at', { ascending: false });
    if (error) { console.error('getVaultItems error:', error); return []; }
    return (data as VaultItem[]) || [];
  },

  async addVaultItem(item: Partial<VaultItem>): Promise<VaultItem | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client
      .from('vault_items')
      .insert(item as VaultItem)
      .select('id, title, description, category, item_type, metadata, created_at')
      .single();
    if (error) { console.error('addVaultItem error:', error); return null; }
    return data as VaultItem | null;
  },

  async deleteVaultItem(id: string): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;
    const { error } = await client.from('vault_items').delete().eq('id', id);
    if (error) { console.error('deleteVaultItem error:', error); return false; }
    return true;
  },

  // ── Reminders ──────────────────────────────────────────────

  async getReminders(): Promise<Reminder[]> {
    const client = getSupabase();
    if (!client) return [];
    const { data, error } = await client.from('reminders').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getReminders error:', error); return []; }
    return (data as Reminder[]) || [];
  },

  async addReminder(reminder: Partial<Reminder>): Promise<Reminder | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client.from('reminders').insert(reminder as Reminder).select().single();
    if (error) { console.error('addReminder error:', error); return null; }
    return data as Reminder | null;
  },

  async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client.from('reminders').update(updates as Reminder).eq('id', id).select().single();
    if (error) { console.error('updateReminder error:', error); return null; }
    return data as Reminder | null;
  },

  async deleteReminder(id: string): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;
    const { error } = await client.from('reminders').delete().eq('id', id);
    if (error) { console.error('deleteReminder error:', error); return false; }
    return true;
  },

  // ── Applications ──────────────────────────────────────────

  async getApplications(): Promise<Application[]> {
    const client = getSupabase();
    if (!client) return [];
    const { data, error } = await client.from('applications').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getApplications error:', error); return []; }
    return (data as Application[]) || [];
  },

  async addApplication(application: Partial<Application>): Promise<Application | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client.from('applications').insert(application as Application).select().single();
    if (error) { console.error('addApplication error:', error); return null; }
    return data as Application | null;
  },

  async updateApplication(id: string, updates: Partial<Application>): Promise<Application | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client.from('applications').update(updates as Application).eq('id', id).select().single();
    if (error) { console.error('updateApplication error:', error); return null; }
    return data as Application | null;
  },

  async deleteApplication(id: string): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;
    const { error } = await client.from('applications').delete().eq('id', id);
    if (error) { console.error('deleteApplication error:', error); return false; }
    return true;
  },

  // ── Checklist Items ───────────────────────────────────────

  async getChecklistItems(applicationId?: string): Promise<ChecklistItem[]> {
    const client = getSupabase();
    if (!client) return [];
    let q = client.from('checklist_items').select('*').order('created_at', { ascending: false });
    if (applicationId) q = q.eq('application_id', applicationId);
    const { data, error } = await q;
    if (error) { console.error('getChecklistItems error:', error); return []; }
    return (data as ChecklistItem[]) || [];
  },

  async addChecklistItem(item: Partial<ChecklistItem>): Promise<ChecklistItem | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client.from('checklist_items').insert(item as ChecklistItem).select().single();
    if (error) { console.error('addChecklistItem error:', error); return null; }
    return data as ChecklistItem | null;
  },

  async updateChecklistItem(id: string, updates: Partial<ChecklistItem>): Promise<ChecklistItem | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client.from('checklist_items').update(updates as ChecklistItem).eq('id', id).select().single();
    if (error) { console.error('updateChecklistItem error:', error); return null; }
    return data as ChecklistItem | null;
  },

  // ── Family Groups ─────────────────────────────────────────

  async getFamilyGroups(): Promise<FamilyGroup[]> {
    const client = getSupabase();
    if (!client) return [];
    const { data, error } = await client.from('family_groups').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getFamilyGroups error:', error); return []; }
    return (data as FamilyGroup[]) || [];
  },

  async addFamilyGroup(group: Partial<FamilyGroup>): Promise<FamilyGroup | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client.from('family_groups').insert(group as FamilyGroup).select().single();
    if (error) { console.error('addFamilyGroup error:', error); return null; }
    return data as FamilyGroup | null;
  },

  async getFamilyGroupByOwner(ownerId: string): Promise<FamilyGroup | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client.from('family_groups').select('*').eq('owner_id', ownerId).limit(1).single();
    if (error) { console.error('getFamilyGroupByOwner error:', error); return null; }
    return data as FamilyGroup | null;
  },

  // ── Family Members ────────────────────────────────────────

  async getFamilyMembers(groupId?: string): Promise<FamilyMember[]> {
    const client = getSupabase();
    if (!client) return [];
    let q = client.from('family_members').select('*').order('created_at', { ascending: false });
    if (groupId) q = q.eq('group_id', groupId);
    const { data, error } = await q;
    if (error) { console.error('getFamilyMembers error:', error); return []; }
    return (data as FamilyMember[]) || [];
  },

  async addFamilyMember(member: Partial<FamilyMember>): Promise<FamilyMember | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client.from('family_members').insert(member as FamilyMember).select().single();
    if (error) { console.error('addFamilyMember error:', error); return null; }
    return data as FamilyMember | null;
  },

  async deleteFamilyMember(id: string): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;
    const { error } = await client.from('family_members').delete().eq('id', id);
    if (error) { console.error('deleteFamilyMember error:', error); return false; }
    return true;
  },

  // ── Documents ──────────────────────────────────────────────

  async getDocuments(): Promise<Document[]> {
    const client = getSupabase();
    if (!client) return [];
    const { data, error } = await client.from('documents').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getDocuments error:', error); return []; }
    return (data as Document[]) || [];
  },

  async addDocument(doc: Partial<Document>): Promise<Document | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client.from('documents').insert(doc as Document).select().single();
    if (error) { console.error('addDocument error:', error); return null; }
    return data as Document | null;
  },

  async deleteDocument(id: string): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;
    const { error } = await client.from('documents').delete().eq('id', id);
    if (error) { console.error('deleteDocument error:', error); return false; }
    return true;
  },

  // ── Profile ────────────────────────────────────────────────

  async getProfile(id: string): Promise<Profile | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client.from('profiles').select('*').eq('id', id).single();
    if (error) { console.error('getProfile error:', error); return null; }
    return data as Profile | null;
  },

  async upsertProfile(profile: Partial<Profile>): Promise<Profile | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client.from('profiles').upsert(profile as Profile).select().single();
    if (error) { console.error('upsertProfile error:', error); return null; }
    return data as Profile | null;
  },

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile | null> {
    const client = getSupabase();
    if (!client) return null;
    const updatesWithTs = { ...updates, updated_at: new Date().toISOString() };
    const { data, error } = await client.from('profiles').update(updatesWithTs as Profile).eq('id', id).select().single();
    if (error) { console.error('updateProfile error:', error); return null; }
    return data as Profile | null;
  },

  // ── Chat ──────────────────────────────────────────────────

  async getChatSessions(): Promise<ChatSession[]> {
    const client = getSupabase();
    if (!client) return [];
    const { data, error } = await client.from('chat_sessions').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getChatSessions error:', error); return []; }
    return (data as ChatSession[]) || [];
  },

  async addChatSession(session: Partial<ChatSession>): Promise<ChatSession | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client.from('chat_sessions').insert(session as ChatSession).select().single();
    if (error) { console.error('addChatSession error:', error); return null; }
    return data as ChatSession | null;
  },

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    const client = getSupabase();
    if (!client) return [];
    const { data, error } = await client
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (error) { console.error('getChatMessages error:', error); return []; }
    return (data as ChatMessage[]) || [];
  },

  async addChatMessage(message: Partial<ChatMessage>): Promise<ChatMessage | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client.from('chat_messages').insert(message as ChatMessage).select().single();
    if (error) { console.error('addChatMessage error:', error); return null; }
    return data as ChatMessage | null;
  },

  // ── Reports / Feedback ────────────────────────────────────

  async addScamReport(report: Partial<ScamReport>): Promise<ScamReport | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client.from('scam_reports').insert(report as ScamReport).select().single();
    if (error) { console.error('addScamReport error:', error); return null; }
    return data as ScamReport | null;
  },

  async addFeedback(feedback: Partial<Feedback>): Promise<Feedback | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client.from('feedback').insert(feedback as Feedback).select().single();
    if (error) { console.error('addFeedback error:', error); return null; }
    return data as Feedback | null;
  },

  // ── Live Scheme Updates ───────────────────────────────────

  async getLastLiveUpdate(): Promise<LiveSchemeUpdate | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client
      .from('live_scheme_updates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error) return null;
    return data as LiveSchemeUpdate | null;
  },

  async addLiveSchemeUpdate(update: Partial<LiveSchemeUpdate>): Promise<LiveSchemeUpdate | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client.from('live_scheme_updates').insert(update as LiveSchemeUpdate).select().single();
    if (error) { console.error('addLiveSchemeUpdate error:', error); return null; }
    return data as LiveSchemeUpdate | null;
  },
};

export default db;
