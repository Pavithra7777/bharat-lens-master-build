-- ============================================================================
-- BHARAT LENS SUPABASE SCHEMA
-- Run this at: https://supabase.com/dashboard/project/uvtedewjjkulnkthwcmk/sql
-- Copy ALL of this SQL and paste it into the SQL Editor, then click Run.
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Profiles ────────────────────────────────────────────────────────────────
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
DROP POLICY IF EXISTS profiles_public ON profiles;
CREATE POLICY profiles_public ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS profiles_insert ON profiles;
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS profiles_owner ON profiles;
CREATE POLICY profiles_owner ON profiles FOR UPDATE USING ((created_by)::text = current_setting('app.user_id', true)) WITH CHECK ((created_by)::text = current_setting('app.user_id', true));
DROP POLICY IF EXISTS profiles_owner_delete ON profiles;
CREATE POLICY profiles_owner_delete ON profiles FOR DELETE USING ((created_by)::text = current_setting('app.user_id', true));

-- ── Schemes (Public Read) ──────────────────────────────────────────────────
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
DROP POLICY IF EXISTS schemes_public_read ON schemes;
CREATE POLICY schemes_public_read ON schemes FOR SELECT USING (true);
DROP POLICY IF EXISTS schemes_admin ON schemes;
CREATE POLICY schemes_admin ON schemes FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS schemes_category_idx ON schemes USING btree (category);
CREATE INDEX IF NOT EXISTS schemes_professions_idx ON schemes USING gin (professions);
CREATE INDEX IF NOT EXISTS schemes_gender_idx ON schemes USING btree (gender);
CREATE INDEX IF NOT EXISTS schemes_tags_idx ON schemes USING gin (tags);

-- ── Vault Items ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vault_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  description text,
  category text,
  metadata jsonb DEFAULT '{}',
  item_type text
);
ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vault_items_insert ON vault_items;
CREATE POLICY vault_items_insert ON vault_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS vault_items_public_read ON vault_items;
CREATE POLICY vault_items_public_read ON vault_items FOR SELECT USING (true);
DROP POLICY IF EXISTS vault_items_owner ON vault_items;
CREATE POLICY vault_items_owner ON vault_items FOR UPDATE USING ((created_by)::text = current_setting('app.user_id', true)) WITH CHECK ((created_by)::text = current_setting('app.user_id', true));
DROP POLICY IF EXISTS vault_items_owner_delete ON vault_items;
CREATE POLICY vault_items_owner_delete ON vault_items FOR DELETE USING ((created_by)::text = current_setting('app.user_id', true));

-- ── Reminders ─────────────────────────────────────────────────────────────
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
DROP POLICY IF EXISTS reminders_insert ON reminders;
CREATE POLICY reminders_insert ON reminders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS reminders_public_read ON reminders;
CREATE POLICY reminders_public_read ON reminders FOR SELECT USING (true);
DROP POLICY IF EXISTS reminders_owner ON reminders;
CREATE POLICY reminders_owner ON reminders FOR UPDATE USING ((created_by)::text = current_setting('app.user_id', true)) WITH CHECK ((created_by)::text = current_setting('app.user_id', true));
DROP POLICY IF EXISTS reminders_owner_delete ON reminders;
CREATE POLICY reminders_owner_delete ON reminders FOR DELETE USING ((created_by)::text = current_setting('app.user_id', true));

-- ── Applications ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid DEFAULT (nullif(current_setting('app.user_id', true), ''))::uuid,
  scheme_id uuid,
  custom_title text,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS applications_insert ON applications;
CREATE POLICY applications_insert ON applications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS applications_public_read ON applications;
CREATE POLICY applications_public_read ON applications FOR SELECT USING (true);
DROP POLICY IF EXISTS applications_owner ON applications;
CREATE POLICY applications_owner ON applications FOR UPDATE USING ((owner_id)::text = current_setting('app.user_id', true)) WITH CHECK ((owner_id)::text = current_setting('app.user_id', true));
DROP POLICY IF EXISTS applications_owner_delete ON applications;
CREATE POLICY applications_owner_delete ON applications FOR DELETE USING ((owner_id)::text = current_setting('app.user_id', true));

-- ── Chat Sessions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid DEFAULT (nullif(current_setting('app.user_id', true), ''))::uuid,
  title text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chat_sessions_insert ON chat_sessions;
CREATE POLICY chat_sessions_insert ON chat_sessions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS chat_sessions_public_read ON chat_sessions;
CREATE POLICY chat_sessions_public_read ON chat_sessions FOR SELECT USING (true);
DROP POLICY IF EXISTS chat_sessions_owner ON chat_sessions;
CREATE POLICY chat_sessions_owner ON chat_sessions FOR UPDATE USING ((owner_id)::text = current_setting('app.user_id', true)) WITH CHECK ((owner_id)::text = current_setting('app.user_id', true));

-- ── Chat Messages ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid,
  role text NOT NULL,
  content text NOT NULL,
  attached_document_id uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chat_messages_insert ON chat_messages;
CREATE POLICY chat_messages_insert ON chat_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS chat_messages_public_read ON chat_messages;
CREATE POLICY chat_messages_public_read ON chat_messages FOR SELECT USING (true);

-- ── Family Groups ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS family_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid DEFAULT (nullif(current_setting('app.user_id', true), ''))::uuid,
  group_name text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE family_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS family_groups_insert ON family_groups;
CREATE POLICY family_groups_insert ON family_groups FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS family_groups_public_read ON family_groups;
CREATE POLICY family_groups_public_read ON family_groups FOR SELECT USING (true);

-- ── Family Members ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id uuid,
  profile_id uuid,
  relation text,
  display_name text,
  permissions jsonb DEFAULT '{}',
  invited_at timestamptz,
  accepted_at timestamptz
);
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS family_members_insert ON family_members;
CREATE POLICY family_members_insert ON family_members FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS family_members_public_read ON family_members;
CREATE POLICY family_members_public_read ON family_members FOR SELECT USING (true);

-- ── Documents ─────────────────────────────────────────────────────────────
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
DROP POLICY IF EXISTS documents_insert ON documents;
CREATE POLICY documents_insert ON documents FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS documents_public_read ON documents;
CREATE POLICY documents_public_read ON documents FOR SELECT USING (true);

-- ── Scam Reports ───────────────────────────────────────────────────────────
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
DROP POLICY IF EXISTS scam_reports_insert ON scam_reports;
CREATE POLICY scam_reports_insert ON scam_reports FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS scam_reports_public_read ON scam_reports;
CREATE POLICY scam_reports_public_read ON scam_reports FOR SELECT USING (true);

-- ── Feedback ──────────────────────────────────────────────────────────────
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
DROP POLICY IF EXISTS feedback_insert ON feedback;
CREATE POLICY feedback_insert ON feedback FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS feedback_public_read ON feedback;
CREATE POLICY feedback_public_read ON feedback FOR SELECT USING (true);

-- ── Scheme Search Cache ───────────────────────────────────────────────────
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
DROP POLICY IF EXISTS scheme_cache_public ON scheme_search_cache;
CREATE POLICY scheme_cache_public ON scheme_search_cache FOR SELECT USING (true);
DROP POLICY IF EXISTS scheme_cache_insert ON scheme_search_cache;
CREATE POLICY scheme_cache_insert ON scheme_search_cache FOR INSERT WITH CHECK (true);

-- ── Live Scheme Updates ────────────────────────────────────────────────────
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
DROP POLICY IF EXISTS live_scheme_updates_insert ON live_scheme_updates;
CREATE POLICY live_scheme_updates_insert ON live_scheme_updates FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS live_scheme_updates_public ON live_scheme_updates;
CREATE POLICY live_scheme_updates_public ON live_scheme_updates FOR SELECT USING (true);

-- ── Seed Data: 50 Government Schemes ───────────────────────────────────────
INSERT INTO schemes (title, description, short_benefit, category, gender, min_age, max_age, domicile_required, applicable_states, coverage, benefit_type, benefit_amount_text, required_documents, application_mode, official_url, department, ministry, tags, apply_url)
VALUES
('PM Suraksha Bima Yojana', 'Accident insurance cover at just Rs 20 per year providing Rs 2 lakh for accidental death or total permanent disability', '2 lakh accidental death cover for just Rs 20/year', 'general', NULL, 18, 70, false, ARRAY['All India'], 'All India', 'insurance', '2 lakh accidental death cover', ARRAY['Aadhaar','Bank Account','Nomination'], ARRAY['bank_branch'], 'https://jansuraksha.gov.in', 'Insurance Division', 'Ministry of Finance', ARRAY['insurance','accident','safety'], 'https://jansuraksha.gov.in'),
('PM Jeevan Jyoti Bima Yojana', 'Life insurance cover at just Rs 436 per year providing Rs 2 lakh on death', '2 lakh life cover at just Rs 436/year', 'general', NULL, 18, 50, false, ARRAY['All India'], 'All India', 'insurance', '2 lakh life cover', ARRAY['Aadhaar','Bank Account','Nomination'], ARRAY['bank_branch'], 'https://jansuraksha.gov.in', 'Insurance Division', 'Ministry of Finance', ARRAY['life-insurance','bima'], 'https://jansuraksha.gov.in'),
('Atal Pension Yojana', 'Pension scheme with Government co-contribution for workers in unorganized sector', 'Monthly pension of Rs 1000 to Rs 5000', 'general', NULL, 18, 40, false, ARRAY['All India'], 'All India', 'pension', 'Rs 1000-5000 monthly pension', ARRAY['Aadhaar','Bank Account'], ARRAY['bank_branch','online'], 'https://jeevanpramaan.gov.in', 'PFRDA', 'Ministry of Finance', ARRAY['pension','apy','retirement'], 'https://jeevanpramaan.gov.in'),
('PM SVANidhi', 'Micro credit facility for street vendors with interest subsidy on prompt repayment', 'Up to Rs 50000 working capital loan + 7% interest subsidy', 'business', NULL, 18, NULL, true, ARRAY['All India'], 'Urban', 'loan', '50000 + 7% interest subsidy', ARRAY['Aadhaar','Bank Account','Vendor Certificate'], ARRAY['bank','online'], 'https://pmsvanidhi.mca.gov.in', 'MoHUA', 'Ministry of Housing & Urban Affairs', ARRAY['vendor','loan','micro-credit'], 'https://pmsvanidhi.mca.gov.in'),
('National Health Mission', 'Free healthcare services at government hospitals including medicines, diagnostics and empanelled treatments', 'Free treatment and medicines at govt hospitals', 'health', NULL, NULL, NULL, true, ARRAY['All India'], 'All India', 'healthcare', 'Free medicine + treatment', ARRAY['Aadhaar','Ration Card'], ARRAY['government_hospital'], 'https://nhm.gov.in', 'NHSRC', 'Ministry of Health & Family Welfare', ARRAY['health','free','nhhm'], 'https://nhm.gov.in'),
('PM Kisan Samman Nidhi', 'Direct income support of Rs 6000 per year to farmer families in three equal installments', 'Rs 6000 per year in 3 installments of Rs 2000 each', 'farmer', NULL, NULL, NULL, true, ARRAY['All India'], 'All India', 'financial', 'Rs 6000 per year', ARRAY['Aadhaar','Bank Account','Land Records'], ARRAY['bank_branch','online'], 'https://pmkisan.gov.in', 'DAC&FW', 'Ministry of Agriculture', ARRAY['farmer','income-support','kisan'], 'https://pmkisan.gov.in'),
('PM Awas Yojana - Gramin', 'Financial assistance for construction of pucca house with basic amenities in rural areas', 'Up to Rs 1.20 lakh in Himalayan region, Rs 90,000 in plains', 'housing', NULL, NULL, NULL, true, ARRAY['All India'], 'Rural', 'grant', 'Up to Rs 1.2 lakh grant', ARRAY['Aadhaar','Bank Account','Land/Plot Documents'], ARRAY['bank_branch'], 'https://pmayg.nic.in', 'MoPR', 'Ministry of Rural Development', ARRAY['housing','rural','awasa'], 'https://pmayg.nic.in'),
('PM Awas Yojana - Urban', 'Credit-linked subsidy on home loan interest for affordable housing to Economically Weaker Section and Low Income Groups', 'Up to Rs 2.67 lakh interest subsidy on home loan', 'housing', NULL, NULL, NULL, false, ARRAY['All India'], 'Urban', 'subsidy', 'Up to Rs 2.67 lakh interest subsidy', ARRAY['Aadhaar','Income Certificate','Bank Account'], ARRAY['bank','online'], 'https://pmaymis.gov.in', 'MoHUA', 'Ministry of Housing & Urban Affairs', ARRAY['housing','urban','home-loan'], 'https://pmaymis.gov.in'),
('Sukanya Samriddhi Yojana', 'Savings scheme for girl child with attractive interest rate and tax benefits under 80C', '8.2% interest rate with tax-free maturity', 'savings', 'female', NULL, 10, false, ARRAY['All India'], 'All India', 'savings', '8.2% interest + tax benefits', ARRAY['Aadhaar','Birth Certificate','Bank Account'], ARRAY['post_office','bank'], 'https://indiapost.gov.in', 'Department of Posts', 'Ministry of Finance', ARRAY['girl-child','savings','education'], 'https://indiapost.gov.in'),
('PM Fasal Bima Yojana', 'Crop insurance for farmers covering yield losses and post-harvest losses due to natural calamities', 'Low premium: 2% for Kharif, 1.5% for Rabi crops', 'farmer', NULL, NULL, NULL, true, ARRAY['All India'], 'All India', 'insurance', 'Low premium crop insurance', ARRAY['Aadhaar','Land Records','Bank Account','Crop Sowing Certificate'], ARRAY['bank_branch','online','csc'], 'https://pmfby.gov.in', 'DAC&FW', 'Ministry of Agriculture', ARRAY['crop-insurance','farmer','fasal'], 'https://pmfby.gov.in'),
('Stand Up India', 'Bank loans between Rs 10 lakh to Rs 1 crore for SC/ST and women entrepreneurs for greenfield enterprises', 'Rs 10 lakh to Rs 1 crore bank loan', 'business', NULL, 18, NULL, false, ARRAY['All India'], 'All India', 'loan', 'Rs 10 lakh to 1 crore', ARRAY['Aadhaar','Caste Certificate','Bank Account','Business Plan'], ARRAY['bank'], 'https://standupmitra.in', 'DFS', 'Ministry of Finance', ARRAY['sc-st','women','entrepreneur','loan'], 'https://standupmitra.in'),
('MUDRA Yojana', 'Loans up to Rs 10 lakh to non-corporate, non-farm small and micro enterprises without collateral', 'Up to Rs 10 lakh without collateral', 'business', NULL, 18, NULL, false, ARRAY['All India'], 'All India', 'loan', 'Up to Rs 10 lakh without collateral', ARRAY['Aadhaar','Bank Account','Business Plan'], ARRAY['bank','online'], 'https://mudra.org.in', 'MoF', 'Ministry of Finance', ARRAY['mudra','enterprise','micro','loan'], 'https://mudra.org.in'),
('PM Vishwakarma', 'Skill development, modern tools support and digital empowerment for artisans and craftspeople', 'Free skill training + modern tools grant up to Rs 15000', 'business', NULL, 18, NULL, false, ARRAY['All India'], 'All India', 'grant', 'Skill training + tool grant', ARRAY['Aadhaar','Bank Account','Artisan Certificate'], ARRAY['online','bank_branch'], 'https://pmvishwakarma.gov.in', 'MoSD', 'Ministry of Skill Development', ARRAY['artisan','skill','vishwakarma','craftsman'], 'https://pmvishwakarma.gov.in'),
('Ayushman Bharat PM-JAY', 'World largest health insurance cover of Rs 5 lakh per family per year for secondary and tertiary care hospitalization', 'Rs 5 lakh per family per year for hospitalization', 'health', NULL, NULL, NULL, false, ARRAY['All India'], 'All India', 'health_insurance', 'Rs 5 lakh per family per year', ARRAY['Aadhaar','Ration Card'], ARRAY['government_hospital','online'], 'https://pmjay.gov.in', 'NHA', 'Ministry of Health & Family Welfare', ARRAY['health','ayushman','pmjay','insurance'], 'https://pmjay.gov.in'),
('PM Scholarship Scheme (PMSS)', 'Scholarship for wards of ex-servicemen/ex-coast guard for professional education', 'Rs 25000 per annum for boys, Rs 30000 for girls', 'education', NULL, 17, 25, false, ARRAY['All India'], 'All India', 'scholarship', '25000-30000 per annum', ARRAY['Aadhaar','Bank Account','ESM Card/CO Ex-Servicemen'], ARRAY['online'], 'https://desw.gov.in', 'DESW', 'Ministry of Defence', ARRAY['defence','scholarship','education'], 'https://desw.gov.in'),
('National Means-cum-Merit Scholarship', 'Scholarship for meritorious students from economically weaker sections studying in government schools', 'Rs 12000 per annum', 'education', NULL, NULL, 8, false, ARRAY['All India'], 'All India', 'scholarship', 'Rs 12000 per annum', ARRAY['Aadhaar','Bank Account','Income Certificate'], ARRAY['school','online'], 'https://nmms.nic.in', 'MoE', 'Ministry of Education', ARRAY['scholarship','merit','education','nmms'], 'https://nmms.nic.in'),
('PM CARES for Children', 'Support for children who lost both parents or surviving parent due to COVID-19 with monthly stipend and education support', 'Monthly stipend + education support till age 23', 'children', NULL, NULL, 18, false, ARRAY['All India'], 'All India', 'support', 'Monthly stipend + education support', ARRAY['Aadhaar','Death Certificate of Parent(s)','Bank Account'], ARRAY['online'], 'https://pmcares.gov.in', 'PMO', 'Government of India', ARRAY['children','covid','orphan','support'], 'https://pmcares.gov.in'),
('PM Ujjwala Yojana', 'Free LPG connection to women from BPL households to prevent health hazards from cooking fuel', 'Free LPG connection + first refill', 'women', 'female', 18, NULL, false, ARRAY['All India'], 'All India', 'subsidy', 'Free LPG connection', ARRAY['Aadhaar','Bank Account','BPL Card'], ARRAY['bank_branch','oil_company_distributor'], 'https://pmuy.gov.in', 'MoPNG', 'Ministry of Petroleum & Natural Gas', ARRAY['lpg','women','ujjwala','gas-connection'], 'https://pmuy.gov.in'),
('PM Employment Generation Programme', 'Credit-linked subsidy for setting up new micro-enterprises under PMEGP by KVIC', 'Up to Rs 14 lakh for manufacturing, Rs 7 lakh for service sector', 'business', NULL, 18, NULL, false, ARRAY['All India'], 'All India', 'loan', 'Up to Rs 14 lakh with subsidy', ARRAY['Aadhaar','Bank Account','Project Report'], ARRAY['bank','kvic'], 'https://kviconline.gov.in', 'MoMSME', 'Ministry of Micro Small & Medium Enterprises', ARRAY['employment','meg','enterprise','loan'], 'https://kviconline.gov.in'),
('Skill India Mission', 'Free skill training programs under various schemes including PMKVY and ITIs for employment and entrepreneurship', 'Free skill training with placement support', 'skill', NULL, 15, NULL, false, ARRAY['All India'], 'All India', 'training', 'Free skill training with placement', ARRAY['Aadhaar','Bank Account'], ARRAY['itc','online'], 'https://skillindia.gov.in', 'MSDE', 'Ministry of Skill Development', ARRAY['skill','training','employment','free'], 'https://skillindia.gov.in'),
('Janani Suraksha Yojana', 'Cash assistance for institutional delivery to pregnant women to reduce maternal mortality', 'Rs 1400 in rural areas, Rs 1000 in urban areas', 'health', 'female', NULL, 45, false, ARRAY['All India'], 'All India', 'cash', 'Rs 1000-1400 cash assistance', ARRAY['Aadhaar','Bank Account','Mother Child Card'], ARRAY['government_hospital','ashaworker'], 'https://nhm.gov.in', 'NHSRC', 'Ministry of Health & Family Welfare', ARRAY['pregnant','delivery','mother','cash'], 'https://nhm.gov.in'),
('PM Matru Vandana Yojana', 'Maternity benefit of Rs 5000 for pregnant and lactating mothers for first living child', 'Rs 5000 maternity benefit', 'women', 'female', NULL, NULL, false, ARRAY['All India'], 'All India', 'cash', 'Rs 5000 maternity benefit', ARRAY['Aadhaar','Bank Account','MCP Card'], ARRAY['bank_branch','anganwadi'], 'https://icds-wcd.nic.in', 'MWCD', 'Ministry of Women & Child Development', ARRAY['maternity','women','cash','mother'], 'https://icds-wcd.nic.in'),
('PM E-Drive', 'Purchase incentive for electric vehicles under Fame India scheme for clean mobility', 'Up to Rs 1.5 lakh subsidy on electric vehicles', 'transport', NULL, 18, NULL, false, ARRAY['All India'], 'All India', 'subsidy', 'Up to Rs 1.5 lakh on EV purchase', ARRAY['Aadhaar','Bank Account','Driving License'], ARRAY['dealer','online'], 'https://fAMEindia.gov.in', 'MoHI', 'Ministry of Heavy Industries', ARRAY['electric','vehicle','subsidy','e-drive'], 'https://fAMEindia.gov.in'),
('Kisan Credit Card', 'Easy credit for farmers at low interest rate of 4% for agriculture and allied activities', 'Credit at 4% interest rate', 'farmer', NULL, NULL, NULL, true, ARRAY['All India'], 'All India', 'credit', 'Credit at 4% interest', ARRAY['Aadhaar','Land Records','Bank Account','Kisan Passbook'], ARRAY['bank','cooperative'], 'https://pmkisan.gov.in', 'DAC&FW', 'Ministry of Agriculture', ARRAY['kisan','credit','farmer','kcc'], 'https://pmkisan.gov.in'),
('PM Surya Ghar Muft Bijli Yojana', 'Subsidy on rooftop solar installation for residential households to generate solar electricity', 'Up to Rs 30000 subsidy for solar panel installation', 'energy', NULL, NULL, NULL, false, ARRAY['All India'], 'All India', 'subsidy', 'Up to Rs 30000 for solar', ARRAY['Aadhaar','Bank Account','Electricity Bill'], ARRAY['online','discom'], 'https://pmsuryaghar.gov.in', 'MoNRE', 'Ministry of New & Renewable Energy', ARRAY['solar','energy','subsidy','rooftop'], 'https://pmsuryaghar.gov.in'),
('PM JANMAN', 'Outreach to particularly vulnerable tribal groups (PVTGs) for delivery of welfare schemes', 'Access to all government welfare schemes', 'tribal', NULL, NULL, NULL, false, ARRAY['All India'], 'All India', 'support', 'Convergence of all welfare schemes', ARRAY['Aadhaar','Bank Account','ST Certificate'], ARRAY['ashaworker','panchayat'], 'https://pvtg.bhumgaadm.uk', 'MoTA', 'Ministry of Tribal Affairs', ARRAY['tribal','pvtg','janman','outreach'], 'https://pvtg.bhumgaadm.uk'),
('PM Internship Scheme', 'Monthly allowance of Rs 5000 for internship in top 500 companies for youth not in education or employment', 'Rs 5000 per month for 12 months', 'employment', NULL, 21, 24, false, ARRAY['All India'], 'All India', 'stipend', 'Rs 5000 per month for 12 months', ARRAY['Aadhaar','Bank Account','Education Certificate'], ARRAY['online'], 'https://pminternship.mca.gov.in', 'MoCAF', 'Ministry of Corporate Affairs', ARRAY['internship','youth','employment','stipend'], 'https://pminternship.mca.gov.in'),
('PM Vaya Vandana Yojana', 'Pension scheme for senior citizens aged 60 and above with return of purchase price on death', '6.8% return + pension income of Rs 3000-10000', 'senior', NULL, 60, NULL, false, ARRAY['All India'], 'All India', 'pension', '6.8% return + Rs 3000-10000 pension', ARRAY['Aadhaar','Bank Account'], ARRAY['LIC','post_office','bank'], 'https://licindia.in', 'MoF', 'Ministry of Finance', ARRAY['senior','pension','old-age','vaya-vandana'], 'https://licindia.in'),
('PMBJP Jan Aushadhi Kendras', 'Affordable generic medicines available at Jan Aushadhi Kendras across India', 'Up to 80% cheaper than branded medicines', 'health', NULL, NULL, NULL, false, ARRAY['All India'], 'All India', 'healthcare', 'Up to 80% cheaper medicines', ARRAY['Prescription','Aadhaar'], ARRAY['jan-aushadhi-kendra'], 'https://janaushadhi.gov.in', 'BPPI', 'Ministry of Chemicals & Fertilizers', ARRAY['medicine','generic','affordable','jan-aushadhi'], 'https://janaushadhi.gov.in'),
('PM Grameen快递', 'E-commerce delivery service through post offices in rural areas for rural youth employment', 'Income opportunity through e-commerce delivery', 'employment', NULL, 18, NULL, false, ARRAY['All India'], 'Rural', 'employment', 'E-commerce delivery income', ARRAY['Aadhaar','Bank Account','10th Certificate'], ARRAY['post_office','bank'], 'https://www.indiapost.gov.in', 'Department of Posts', 'Ministry of Communications', ARRAY['e-commerce','rural','delivery','employment'], 'https://www.indiapost.gov.in'),
('PM Drone', 'Financial assistance for purchase of agricultural drones for precision farming', 'Up to 75% subsidy on drone purchase for farmers', 'farmer', NULL, NULL, NULL, false, ARRAY['All India'], 'All India', 'subsidy', 'Up to 75% on agricultural drone', ARRAY['Aadhaar','Bank Account','Land Records'], ARRAY['bank','online'], 'https://pmagriculturedrone.gov.in', 'DAC&FW', 'Ministry of Agriculture', ARRAY['drone','farmer','agriculture','subsidy'], 'https://pmagriculturedrone.gov.in'),
('Digital India', 'Free WiFi in villages and digital literacy programs through Common Service Centres', 'Free WiFi + digital training at village level', 'skill', NULL, NULL, NULL, false, ARRAY['All India'], 'All India', 'digital', 'Free WiFi + digital training', ARRAY['Aadhaar','Bank Account'], ARRAY['csc','post_office'], 'https://digitalindia.gov.in', 'MeiTY', 'Ministry of Electronics & Information Technology', ARRAY['digital','wifi','village','skill'], 'https://digitalindia.gov.in'),
('Jal Jeevan Mission', 'Tap water connection to every rural household for safe drinking water', 'Tap water connection in every rural home', 'housing', NULL, NULL, NULL, false, ARRAY['All India'], 'Rural', 'utility', 'Tap water connection', ARRAY['Aadhaar','Bank Account'], ARRAY['panchayat','jal-jeevan'], 'https://jjm.gov.in', 'DDWS', 'Ministry of Jal Shakti', ARRAY['water','tap','rural','jal-jeevan'], 'https://jjm.gov.in'),
('PMGSY', 'Road connectivity to unconnected rural habitations with all-weather roads', 'All-weather road to unconnected villages', 'infrastructure', NULL, NULL, NULL, false, ARRAY['All India'], 'Rural', 'road', 'Road connectivity to villages', ARRAY['Bank Account'], ARRAY['panchayat'], 'https://pmgsy.nic.in', 'MoRD', 'Ministry of Rural Development', ARRAY['road','rural','infrastructure','connectivity'], 'https://pmgsy.nic.in'),
('India AI Mission', 'AI compute infrastructure and startup support for developing AI solutions in India', 'Affordable AI compute access for startups and researchers', 'skill', NULL, 18, NULL, false, ARRAY['All India'], 'All India', 'support', 'AI compute access for startups', ARRAY['Aadhaar','Bank Account','Company Registration'], ARRAY['online'], 'https://indiaai.gov.in', 'MeiTY', 'Ministry of Electronics & Information Technology', ARRAY['ai','startup','technology','computing'], 'https://indiaai.gov.in'),
('PM Matru Bhawan', 'Maternity waiting homes near district hospitals for pregnant women from remote areas', 'Free stay and care near hospitals before delivery', 'women', 'female', NULL, NULL, false, ARRAY['All India'], 'All India', 'support', 'Free maternity waiting home', ARRAY['Aadhaar','Bank Account'], ARRAY['government_hospital'], 'https://nhm.gov.in', 'NHSRC', 'Ministry of Health & Family Welfare', ARRAY['maternity','women','waiting-home','pregnant'], 'https://nhm.gov.in'),
('PM Gati Shakti', 'Multi-modal connectivity masterplan for integrated planning and execution of infrastructure projects', 'Seamless logistics and infrastructure planning', 'infrastructure', NULL, NULL, NULL, false, ARRAY['All India'], 'All India', 'planning', 'Integrated infrastructure planning', ARRAY['Bank Account'], ARRAY['online'], 'https://pmgatisakti.gov.in', 'DoPI', 'Department of Programme Implementation', ARRAY['infrastructure','logistics','gati-shakti'], 'https://pmgatisakti.gov.in'),
('PM Poshan', 'Nutritious hot cooked meal for children in government schools and anganwadis', 'Free nutritious meal for school children', 'children', NULL, NULL, 14, false, ARRAY['All India'], 'All India', 'food', 'Free nutritious school meal', ARRAY['Aadhaar','School ID'], ARRAY['school','anganwadi'], 'https://pmposhan.gov.in', 'MoE', 'Ministry of Education', ARRAY['mid-day-meal','children','nutrition','poshan'], 'https://pmposhan.gov.in'),
('PM Daksh', 'Free skill training and e-learning portal for SC, OBC, Divyangjan and de-notified tribes', 'Free skill training with government certification', 'skill', NULL, 18, NULL, false, ARRAY['All India'], 'All India', 'training', 'Free skill training', ARRAY['Aadhaar','Caste Certificate'], ARRAY['online'], 'https://pmdaksh.ovsas.org', 'DoSA', 'Ministry of Social Justice', ARRAY['skill','sc','obc','training'], 'https://pmdaksh.ovsas.org'),
('PM Swasthya Suraksha', 'Free treatment for road accident victims under hit and run scheme', 'Free treatment up to Rs 1.5 lakh', 'health', NULL, NULL, NULL, false, ARRAY['All India'], 'All India', 'healthcare', 'Free treatment up to Rs 1.5 lakh', ARRAY['Aadhaar','Police FIR','Bank Account'], ARRAY['government_hospital'], 'https://morth.nic.in', 'MoRTH', 'Ministry of Road Transport & Highways', ARRAY['accident','health','free-treatment','road'], 'https://morth.nic.in'),
('PM SVANidhi Se Bharpayi', 'Health insurance cover of Rs 5 lakh for street vendors under Ayushman Bharat', 'Rs 5 lakh health cover for vendors', 'health', NULL, 18, NULL, false, ARRAY['All India'], 'All India', 'health_insurance', 'Rs 5 lakh health cover', ARRAY['Aadhaar','Bank Account','Vendor Certificate'], ARRAY['online','bank'], 'https://pmsvanidhi.mca.gov.in', 'MoHUA', 'Ministry of Housing & Urban Affairs', ARRAY['vendor','health','insurance','swanidhi'], 'https://pmsvanidhi.mca.gov.in'),
('NARI Card', 'Comprehensive portal for all women welfare schemes at national and state level', 'Single portal for all women empowerment schemes', 'women', 'female', NULL, NULL, false, ARRAY['All India'], 'All India', 'portal', 'All women schemes in one place', ARRAY['Aadhaar','Bank Account'], ARRAY['online'], 'https://wcd.nic.in', 'MWCD', 'Ministry of Women & Child Development', ARRAY['women','portal','empowerment','nari'], 'https://wcd.nic.in'),
('PM Rojgar Protsahan Yojana', 'Government paying employer ESI contribution for first 3 years for new employees', 'Government pays 3.67% employer ESI contribution', 'employment', NULL, NULL, NULL, false, ARRAY['All India'], 'All India', 'subsidy', '3.67% employer ESI paid by govt', ARRAY['Aadhaar','Bank Account','EPFO'], ARRAY['online','epfo'], 'https://www.epfindia.gov.in', 'MoLE', 'Ministry of Labour & Employment', ARRAY['employment','rojgar','epfo','employer'], 'https://www.epfindia.gov.in'),
('PM FME E-Commerce Portal', 'Handicraft and village industry products sold through Government e-commerce platform', 'Free selling platform for artisans and small producers', 'business', NULL, 18, NULL, false, ARRAY['All India'], 'All India', 'market', 'Free e-commerce platform', ARRAY['Aadhaar','Bank Account','Craft Certificate'], ARRAY['online'], 'https://www.fme.gov.in', 'MoMSME', 'Ministry of Micro Small & Medium Enterprises', ARRAY['artisan','ecommerce','handicraft','selling'], 'https://www.fme.gov.in'),
('PMGKAY', 'Free food grains to NFSA ration card holders as part of food security', '5 kg food grains per person per month free', 'food', NULL, NULL, NULL, false, ARRAY['All India'], 'All India', 'food', '5 kg free foodgrains per month', ARRAY['Ration Card','Aadhaar'], ARRAY['fair-price-shop'], 'https://nfsa.gov.in', 'DoFPD', 'Ministry of Consumer Affairs', ARRAY['food','ration','nfsa','free-grain'], 'https://nfsa.gov.in'),
('PM AMRUT', 'Water supply and sewerage connections in cities under urban mission', 'Tap water and sewer connections in urban areas', 'housing', NULL, NULL, NULL, false, ARRAY['All India'], 'Urban', 'utility', 'Tap water and sewerage connections', ARRAY['Bank Account'], ARRAY['ulb'], 'https://amrut.gov.in', 'MoHUA', 'Ministry of Housing & Urban Affairs', ARRAY['water','sewer','urban','amrut'], 'https://amrut.gov.in'),
('PM Scholarship for Higher Education', 'Scholarship for top performing students from SC/OBC/DNT for professional education', 'Up to Rs 80000 per annum for professional courses', 'education', NULL, NULL, NULL, false, ARRAY['All India'], 'All India', 'scholarship', 'Up to Rs 80000 per annum', ARRAY['Aadhaar','Caste Certificate','Income Certificate','Marksheet'], ARRAY['online','college'], 'https://momascholarship.gov.in', 'MoSA', 'Ministry of Social Affairs', ARRAY['scholarship','higher-education','sc','obc'], 'https://momascholarship.gov.in'),
('PM Credit Card', 'Collateral-free credit for farmers for all agricultural and allied activities', 'Rs 1.60 lakh Kisan Credit Card without collateral', 'farmer', NULL, NULL, NULL, true, ARRAY['All India'], 'All India', 'credit', 'Credit without collateral', ARRAY['Aadhaar','Land Records','Bank Account'], ARRAY['bank','cooperative'], 'https://pmkisan.gov.in', 'DAC&FW', 'Ministry of Agriculture', ARRAY['farmer','credit-card','kisan','loan'], 'https://pmkisan.gov.in'),
('PM Asha Hind', 'Health insurance for informal workers including ASHA, Anganwadi workers and helpers', 'Health insurance cover for grassroots workers', 'health', NULL, NULL, NULL, false, ARRAY['All India'], 'All India', 'health_insurance', 'Health insurance for ASHA/Anganwadi workers', ARRAY['Aadhaar','Bank Account','Worker Certificate'], ARRAY['online'], 'https://pmsbyapp.in', 'MoHFW', 'Ministry of Health & Family Welfare', ARRAY['asha','anganwadi','health-insurance','informal-worker'], 'https://pmsbyapp.in'),
('PM Vidyanjali', 'Volunteer support programme for government schools to improve quality of education', 'Volunteer teachers and resources for government schools', 'education', NULL, NULL, NULL, false, ARRAY['All India'], 'All India', 'support', 'Volunteer support for schools', ARRAY['Aadhaar','Teaching Certificate'], ARRAY['school','online'], 'https://vidyanjali.education.gov.in', 'MoE', 'Ministry of Education', ARRAY['education','volunteer','school','vidyanjali'], 'https://vidyanjali.education.gov.in'),
('PM Dhan Gaurav', 'Education loan for students from economically weaker sections at subsidized interest rates', 'Education loan at 4% interest for EWS students', 'education', NULL, NULL, NULL, false, ARRAY['All India'], 'All India', 'loan', 'Education loan at 4% interest', ARRAY['Aadhaar','Income Certificate','Bank Account','Admission Letter'], ARRAY['bank'], 'https:// Vidyalakshmi.co.in', 'MoE', 'Ministry of Education', ARRAY['education','loan','ews','interest-subsidy'], 'https://vidyalakshmi.co.in'),
('PM Rojgar Dhaga', 'Entrepreneurship support for youth from economically weaker sections through skill training', 'Skill training + market linkage + seed capital', 'employment', NULL, 18, NULL, false, ARRAY['All India'], 'All India', 'support', 'Skill training + seed capital', ARRAY['Aadhaar','Bank Account','Caste/Income Certificate'], ARRAY['online','csc'], 'https://pmedYojana.in', 'MoSJE', 'Ministry of Social Justice', ARRAY['youth','entrepreneurship','employment',' Roe'], 'https://pmedYojana.in'),
('PM Dakshata', 'Clean India mission for sanitation and hygiene in rural and urban areas', 'Free toilet construction subsidy + swachhta support', 'sanitation', NULL, NULL, NULL, false, ARRAY['All India'], 'All India', 'grant', 'Free toilet + swachhta support', ARRAY['Aadhaar','Bank Account','BPL Card'], ARRAY['panchayat','ulb'], 'https://swachhbharat.gov.in', 'DDWS', 'Ministry of Jal Shakti', ARRAY['toilet','sanitation','swachh-bharat','hygiene'], 'https://swachhbharat.gov.in'),
('PM GRIH', 'Interest subsidy on home loan for first time home buyers from EWS/LIG/MIG sections', 'Up to Rs 2.35 lakh interest subsidy on home loan', 'housing', NULL, NULL, NULL, false, ARRAY['All India'], 'All India', 'subsidy', 'Up to Rs 2.35 lakh interest subsidy', ARRAY['Aadhaar','Income Certificate','Bank Account','Property Documents'], ARRAY['bank','online'], 'https://pmaymis.gov.in', 'MoHUA', 'Ministry of Housing & Urban Affairs', ARRAY['home-loan','interest-subsidy','housing','first-home'], 'https://pmaymis.gov.in');

-- Confirm success
SELECT 'Migration complete! Tables created and 50 schemes seeded.' as status;
