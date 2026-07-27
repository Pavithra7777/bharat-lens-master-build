import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Use environment variables or fallback to empty strings
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uvtedewjjkulnkthwcmk.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ythzGuzXHUW_T8vPqEONBA_C3au-5Je';

let supabase: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> | null {
  if (!supabase) {
    try {
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          detectSessionInUrl: false,
        },
      });
    } catch (e) {
      console.error('Failed to create Supabase client:', e);
      return null;
    }
  }
  return supabase;
}

export function isSupabaseConfigured(): boolean {
  return !!supabase && !!supabaseUrl && !!supabaseAnonKey;
}

// Type definitions for database tables
export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  preferred_language: string | null;
  state: string | null;
  district: string | null;
  date_of_birth: string | null;
  occupation_category: string | null;
  simple_mode_enabled: boolean | null;
  onboarding_completed: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
}

export interface Scheme {
  id: string;
  title: string;
  description: string | null;
  short_benefit: string | null;
  category: string;
  gender: string | null;
  min_age: number | null;
  max_age: number | null;
  category_eligible: string[] | null;
  income_limit: number | null;
  professions: string[] | null;
  student_levels: string[] | null;
  student_streams: string[] | null;
  education_percentage_min: number | null;
  employment_status: string[] | null;
  business_type: string[] | null;
  domicile_required: boolean | null;
  applicable_states: string[] | null;
  coverage: string | null;
  benefit_type: string | null;
  benefit_amount_min: number | null;
  benefit_amount_max: number | null;
  benefit_amount_text: string | null;
  required_documents: string[] | null;
  application_mode: string[] | null;
  official_url: string | null;
  helpline: string | null;
  department: string | null;
  ministry: string | null;
  source_verified_at: string | null;
  is_active: boolean | null;
  created_at: string | null;
  tags: string[] | null;
  apply_url: string | null;
}

export interface VaultItem {
  id: string;
  created_by: string;
  created_at: string;
  title: string;
  description: string | null;
  category: string | null;
  metadata: Record<string, unknown> | null;
  item_type: string | null;
}

export interface FamilyGroup {
  id: string;
  owner_id: string | null;
  group_name: string | null;
  created_at: string | null;
}

export interface FamilyMember {
  id: string;
  family_group_id: string | null;
  profile_id: string | null;
  relation: string | null;
  display_name: string | null;
  permissions: Record<string, unknown> | null;
  invited_at: string | null;
  accepted_at: string | null;
}

export interface Document {
  id: string;
  owner_id: string | null;
  family_member_id: string | null;
  document_type: string | null;
  file_path: string;
  original_filename: string | null;
  ocr_extracted_text: string | null;
  ai_summary: string | null;
  expiry_date: string | null;
  reminder_days_before: number | null;
  is_verified_by_user: boolean | null;
  created_at: string | null;
}

export interface Reminder {
  id: string;
  owner_id: string | null;
  related_document_id: string | null;
  related_application_id: string | null;
  title: string;
  due_date: string;
  notify_via: string[] | null;
  is_completed: boolean | null;
  created_at: string | null;
  created_by: string;
}

export interface Application {
  id: string;
  owner_id: string | null;
  scheme_id: string | null;
  custom_title: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ChecklistItem {
  id: string;
  application_id: string | null;
  label: string;
  is_completed: boolean | null;
  linked_document_id: string | null;
  sort_order: number | null;
}

export interface ChatSession {
  id: string;
  owner_id: string | null;
  title: string | null;
  created_at: string | null;
}

export interface ChatMessage {
  id: string;
  session_id: string | null;
  role: string;
  content: string;
  attached_document_id: string | null;
  created_at: string | null;
}

export interface ScamReport {
  id: string;
  owner_id: string | null;
  input_type: string | null;
  raw_content: string | null;
  file_path: string | null;
  ai_verdict: string | null;
  ai_reasoning: string | null;
  url_safety_check: Record<string, unknown> | null;
  created_at: string | null;
}

export interface Feedback {
  id: string;
  created_by: string;
  created_at: string;
  feedback_type: string;
  title: string;
  url: string | null;
  description: string | null;
  status: string | null;
}

export interface LiveSchemeUpdate {
  id: string;
  source_url: string | null;
  source_name: string | null;
  last_fetched_at: string;
  schemes_found_count: number | null;
  new_schemes_count: number | null;
  status: string | null;
  error_message: string | null;
  created_at: string;
}

// Database helper functions
export const db = {
  // Schemes - public read
  async getSchemes(limit = 1000): Promise<Scheme[]> {
    const client = getSupabase();
    if (!client) return [];
    const { data, error } = await client
      .from('schemes')
      .select('*')
      .eq('is_active', true)
      .limit(limit);
    if (error) {
      console.error('Error fetching schemes:', error);
      return [];
    }
    return data || [];
  },

  async getSchemeById(id: string): Promise<Scheme | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client
      .from('schemes')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      console.error('Error fetching scheme:', error);
      return null;
    }
    return data;
  },

  async searchSchemes(query: string, category?: string): Promise<Scheme[]> {
    const client = getSupabase();
    if (!client) return [];
    let q = client
      .from('schemes')
      .select('*')
      .eq('is_active', true)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    if (category) {
      q = q.eq('category', category);
    }
    const { data, error } = await q.limit(50);
    if (error) {
      console.error('Error searching schemes:', error);
      return [];
    }
    return data || [];
  },

  // Vault items - private
  async getVaultItems(): Promise<VaultItem[]> {
    const client = getSupabase();
    if (!client) return [];
    const { data, error } = await client
      .from('vault_items')
      .select('id, title, description, category, item_type, metadata, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching vault items:', error);
      return [];
    }
    return (data || []).map(row => ({
      ...row,
      created_by: '',
    }));
  },

  async addVaultItem(item: Partial<VaultItem>): Promise<VaultItem | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client
      .from('vault_items')
      .insert(item)
      .select('id, title, description, category, item_type, metadata, created_at')
      .single();
    if (error) {
      console.error('Error adding vault item:', error);
      return null;
    }
    return data ? { ...data, created_by: '' } : null;
  },

  async deleteVaultItem(id: string): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;
    const { error } = await client
      .from('vault_items')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting vault item:', error);
      return false;
    }
    return true;
  },

  // Reminders - private
  async getReminders(): Promise<Reminder[]> {
    const client = getSupabase();
    if (!client) return [];
    const { data, error } = await client
      .from('reminders')
      .select('*')
      .order('due_date', { ascending: true });
    if (error) {
      console.error('Error fetching reminders:', error);
      return [];
    }
    return data || [];
  },

  async addReminder(reminder: Partial<Reminder>): Promise<Reminder | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client
      .from('reminders')
      .insert(reminder)
      .select()
      .single();
    if (error) {
      console.error('Error adding reminder:', error);
      return null;
    }
    return data;
  },

  async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client
      .from('reminders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Error updating reminder:', error);
      return null;
    }
    return data;
  },

  async deleteReminder(id: string): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;
    const { error } = await client
      .from('reminders')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting reminder:', error);
      return false;
    }
    return true;
  },

  // Applications - private
  async getApplications(): Promise<Application[]> {
    const client = getSupabase();
    if (!client) return [];
    const { data, error } = await client
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching applications:', error);
      return [];
    }
    return data || [];
  },

  async addApplication(application: Partial<Application>): Promise<Application | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client
      .from('applications')
      .insert(application)
      .select()
      .single();
    if (error) {
      console.error('Error adding application:', error);
      return null;
    }
    return data;
  },

  async updateApplication(id: string, updates: Partial<Application>): Promise<Application | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client
      .from('applications')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Error updating application:', error);
      return null;
    }
    return data;
  },

  async deleteApplication(id: string): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;
    const { error } = await client
      .from('applications')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting application:', error);
      return false;
    }
    return true;
  },

  // Family groups - private
  async getFamilyGroups(): Promise<FamilyGroup[]> {
    const client = getSupabase();
    if (!client) return [];
    const { data, error } = await client
      .from('family_groups')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching family groups:', error);
      return [];
    }
    return data || [];
  },

  async addFamilyGroup(group: Partial<FamilyGroup>): Promise<FamilyGroup | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client
      .from('family_groups')
      .insert(group)
      .select()
      .single();
    if (error) {
      console.error('Error adding family group:', error);
      return null;
    }
    return data;
  },

  async getFamilyGroupByOwner(ownerId: string): Promise<FamilyGroup | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client
      .from('family_groups')
      .select('*')
      .eq('owner_id', ownerId)
      .limit(1)
      .single();
    if (error) return null;
    return data;
  },

  async getFamilyMembers(groupId: string): Promise<FamilyMember[]> {
    const client = getSupabase();
    if (!client) return [];
    const { data, error } = await client
      .from('family_members')
      .select('*')
      .eq('family_group_id', groupId);
    if (error) {
      console.error('Error fetching family members:', error);
      return [];
    }
    return data || [];
  },

  async addFamilyMember(member: Partial<FamilyMember>): Promise<FamilyMember | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client
      .from('family_members')
      .insert(member)
      .select()
      .single();
    if (error) {
      console.error('Error adding family member:', error);
      return null;
    }
    return data;
  },

  async deleteFamilyMember(id: string): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;
    const { error } = await client
      .from('family_members')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting family member:', error);
      return false;
    }
    return true;
  },

  // Documents - private
  async getDocuments(): Promise<Document[]> {
    const client = getSupabase();
    if (!client) return [];
    const { data, error } = await client
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
    return data || [];
  },

  async addDocument(doc: Partial<Document>): Promise<Document | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client
      .from('documents')
      .insert(doc)
      .select()
      .single();
    if (error) {
      console.error('Error adding document:', error);
      return null;
    }
    return data;
  },

  async deleteDocument(id: string): Promise<boolean> {
    const client = getSupabase();
    if (!client) return false;
    const { error } = await client
      .from('documents')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting document:', error);
      return false;
    }
    return true;
  },

  // Profile - private
  async getProfile(userId: string): Promise<Profile | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('created_by', userId)
      .single();
    if (error) {
      // Profile doesn't exist yet - return null (not an error)
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  },

  async upsertProfile(profile: Partial<Profile>): Promise<Profile | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client
      .from('profiles')
      .upsert({
        ...profile,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) {
      console.error('Error upserting profile:', error);
      return null;
    }
    return data;
  },

  async updateProfile(id: string, updates: Partial<Profile>): Promise<Profile | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }
    return data;
  },

  // Chat sessions - private
  async getChatSessions(): Promise<ChatSession[]> {
    const client = getSupabase();
    if (!client) return [];
    const { data, error } = await client
      .from('chat_sessions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching chat sessions:', error);
      return [];
    }
    return data || [];
  },

  async addChatSession(session: Partial<ChatSession>): Promise<ChatSession | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client
      .from('chat_sessions')
      .insert(session)
      .select()
      .single();
    if (error) {
      console.error('Error adding chat session:', error);
      return null;
    }
    return data;
  },

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    const client = getSupabase();
    if (!client) return [];
    const { data, error } = await client
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching chat messages:', error);
      return [];
    }
    return data || [];
  },

  async addChatMessage(message: Partial<ChatMessage>): Promise<ChatMessage | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client
      .from('chat_messages')
      .insert(message)
      .select()
      .single();
    if (error) {
      console.error('Error adding chat message:', error);
      return null;
    }
    return data;
  },

  // Scam reports - private
  async addScamReport(report: Partial<ScamReport>): Promise<ScamReport | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client
      .from('scam_reports')
      .insert(report)
      .select()
      .single();
    if (error) {
      console.error('Error adding scam report:', error);
      return null;
    }
    return data;
  },

  // Feedback - private
  async addFeedback(feedback: Partial<Feedback>): Promise<Feedback | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client
      .from('feedback')
      .insert(feedback)
      .select()
      .single();
    if (error) {
      console.error('Error adding feedback:', error);
      return null;
    }
    return data;
  },

  // Checklist items
  async getChecklistItems(applicationId: string): Promise<ChecklistItem[]> {
    const client = getSupabase();
    if (!client) return [];
    const { data, error } = await client
      .from('checklist_items')
      .select('*')
      .eq('application_id', applicationId)
      .order('sort_order', { ascending: true });
    if (error) {
      console.error('Error fetching checklist items:', error);
      return [];
    }
    return data || [];
  },

  async addChecklistItem(item: Partial<ChecklistItem>): Promise<ChecklistItem | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client
      .from('checklist_items')
      .insert(item)
      .select()
      .single();
    if (error) {
      console.error('Error adding checklist item:', error);
      return null;
    }
    return data;
  },

  async updateChecklistItem(id: string, updates: Partial<ChecklistItem>): Promise<ChecklistItem | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client
      .from('checklist_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Error updating checklist item:', error);
      return null;
    }
    return data;
  },

  // Live scheme updates - public
  async getLastLiveUpdate(): Promise<LiveSchemeUpdate | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client
      .from('live_scheme_updates')
      .select('*')
      .order('last_fetched_at', { ascending: false })
      .limit(1)
      .single();
    if (error) return null;
    return data;
  },

  async addLiveSchemeUpdate(update: {
    status: string;
    schemes_found_count: number;
    new_schemes_count: number;
    source_name: string;
  }): Promise<LiveSchemeUpdate | null> {
    const client = getSupabase();
    if (!client) return null;
    const { data, error } = await client
      .from('live_scheme_updates')
      .insert(update)
      .select()
      .single();
    if (error) {
      console.error('Error adding live scheme update:', error);
      return null;
    }
    return data;
  },
};

export default db;
