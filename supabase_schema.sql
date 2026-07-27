-- Bharat Lens Supabase Schema
-- Run this in your Supabase SQL Editor at: https://supabase.com/dashboard/project/uvtedewjjkulnkthwcmk/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text,
  phone text,
  preferred_language text DEFAULT 'en',
  state text,
  district text,
  date_of_birth date,
  occupation_category text,
  simple_mode_enabled boolean DEFAULT false,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_public ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_owner ON profiles FOR ALL USING ((created_by)::text = current_setting('app.user_id', true)) WITH CHECK ((created_by)::text = current_setting('app.user_id', true));

-- Schemes table (public read - government schemes)
CREATE TABLE IF NOT EXISTS schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  short_benefit text,
  category text NOT NULL,
  gender text,
  min_age integer,
  max_age integer,
  category_eligible text[],
  income_limit integer,
  professions text[],
  student_levels text[],
  student_streams text[],
  education_percentage_min integer,
  employment_status text[],
  business_type text[],
  domicile_required boolean,
  applicable_states text[],
  coverage text,
  benefit_type text,
  benefit_amount_min integer,
  benefit_amount_max integer,
  benefit_amount_text text,
  required_documents text[],
  application_mode text[],
  official_url text,
  helpline text,
  department text,
  ministry text,
  source_verified_at date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  tags text[],
  apply_url text
);
ALTER TABLE schemes ENABLE ROW LEVEL SECURITY;
CREATE POLICY schemes_public_read ON schemes FOR SELECT USING (true);
CREATE POLICY schemes_admin_write ON schemes FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS schemes_category_idx ON schemes USING btree (category);
CREATE INDEX IF NOT EXISTS schemes_professions_idx ON schemes USING gin (professions);

-- Vault items table (private - user documents)
CREATE TABLE IF NOT EXISTS vault_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL DEFAULT (nullif(current_setting('app.user_id', true), ''))::uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  description text,
  category text,
  metadata jsonb,
  item_type text
);
ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY vault_items_owner ON vault_items FOR ALL USING ((created_by)::text = current_setting('app.user_id', true)) WITH CHECK ((created_by)::text = current_setting('app.user_id', true));

-- Family groups table
CREATE TABLE IF NOT EXISTS family_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid DEFAULT (nullif(current_setting('app.user_id', true), ''))::uuid,
  group_name text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY family_groups_owner ON family_groups FOR ALL USING ((owner_id)::text = current_setting('app.user_id', true)) WITH CHECK ((owner_id)::text = current_setting('app.user_id', true));

-- Family members table
CREATE TABLE IF NOT EXISTS family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id uuid,
  profile_id uuid,
  relation text,
  display_name text,
  permissions jsonb,
  invited_at timestamptz,
  accepted_at timestamptz
);
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY family_members_all ON family_members FOR ALL USING (true) WITH CHECK (true);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid DEFAULT (nullif(current_setting('app.user_id', true), ''))::uuid,
  family_member_id uuid,
  document_type text,
  file_path text NOT NULL,
  original_filename text,
  ocr_extracted_text text,
  ai_summary text,
  expiry_date date,
  reminder_days_before integer,
  is_verified_by_user boolean,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY documents_owner ON documents FOR ALL USING ((owner_id)::text = current_setting('app.user_id', true)) WITH CHECK ((owner_id)::text = current_setting('app.user_id', true));

-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid DEFAULT (nullif(current_setting('app.user_id', true), ''))::uuid,
  related_document_id uuid,
  related_application_id uuid,
  title text NOT NULL,
  due_date date NOT NULL,
  notify_via text[],
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL DEFAULT (nullif(current_setting('app.user_id', true), ''))::uuid
);
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY reminders_owner ON reminders FOR ALL USING ((created_by)::text = current_setting('app.user_id', true)) WITH CHECK ((created_by)::text = current_setting('app.user_id', true));

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid DEFAULT (nullif(current_setting('app.user_id', true), ''))::uuid,
  scheme_id uuid,
  custom_title text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY applications_owner ON applications FOR ALL USING ((owner_id)::text = current_setting('app.user_id', true)) WITH CHECK ((owner_id)::text = current_setting('app.user_id', true));

-- Checklist items table
CREATE TABLE IF NOT EXISTS checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid,
  label text NOT NULL,
  is_completed boolean DEFAULT false,
  linked_document_id uuid,
  sort_order integer
);
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY checklist_items_all ON checklist_items FOR ALL USING (true) WITH CHECK (true);

-- Chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid DEFAULT (nullif(current_setting('app.user_id', true), ''))::uuid,
  title text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY chat_sessions_owner ON chat_sessions FOR ALL USING ((owner_id)::text = current_setting('app.user_id', true)) WITH CHECK ((owner_id)::text = current_setting('app.user_id', true));

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid,
  role text NOT NULL,
  content text NOT NULL,
  attached_document_id uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY chat_messages_all ON chat_messages FOR ALL USING (true) WITH CHECK (true);

-- Scam reports table
CREATE TABLE IF NOT EXISTS scam_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid DEFAULT (nullif(current_setting('app.user_id', true), ''))::uuid,
  input_type text,
  raw_content text,
  file_path text,
  ai_verdict text,
  ai_reasoning text,
  url_safety_check jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE scam_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY scam_reports_owner ON scam_reports FOR ALL USING ((owner_id)::text = current_setting('app.user_id', true)) WITH CHECK ((owner_id)::text = current_setting('app.user_id', true));

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL DEFAULT (nullif(current_setting('app.user_id', true), ''))::uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  feedback_type text NOT NULL,
  title text NOT NULL,
  url text,
  description text,
  status text DEFAULT 'open'
);
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY feedback_owner ON feedback FOR ALL USING ((created_by)::text = current_setting('app.user_id', true)) WITH CHECK ((created_by)::text = current_setting('app.user_id', true));
CREATE POLICY feedback_public_read ON feedback FOR SELECT USING (true);

-- Scheme search cache table
CREATE TABLE IF NOT EXISTS scheme_search_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_text text NOT NULL,
  summary text,
  eligibility_snippet text,
  source_url text,
  source_domain text,
  retrieved_at timestamptz DEFAULT now(),
  promoted_to_scheme_id uuid,
  review_status text DEFAULT 'pending'
);
ALTER TABLE scheme_search_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY scheme_cache_public ON scheme_search_cache FOR SELECT USING (true);
CREATE POLICY scheme_cache_write ON scheme_search_cache FOR INSERT WITH CHECK (true);

-- Live scheme updates table
CREATE TABLE IF NOT EXISTS live_scheme_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url text,
  source_name text,
  last_fetched_at timestamptz NOT NULL,
  schemes_found_count integer,
  new_schemes_count integer,
  status text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE live_scheme_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY live_scheme_updates_public ON live_scheme_updates FOR SELECT USING (true);
CREATE POLICY live_scheme_updates_admin ON live_scheme_updates FOR INSERT WITH CHECK (true);
