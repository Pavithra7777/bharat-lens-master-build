export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          preferred_language: string | null
          state: string | null
          district: string | null
          date_of_birth: string | null
          occupation_category: string | null
          simple_mode_enabled: boolean | null
          onboarding_completed: boolean | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          full_name?: string | null
          phone?: string | null
          preferred_language?: string | null
          state?: string | null
          district?: string | null
          date_of_birth?: string | null
          occupation_category?: string | null
          simple_mode_enabled?: boolean | null
          onboarding_completed?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          preferred_language?: string | null
          state?: string | null
          district?: string | null
          date_of_birth?: string | null
          occupation_category?: string | null
          simple_mode_enabled?: boolean | null
          onboarding_completed?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
      }
      schemes: {
        Row: {
          id: string
          title: string
          description: string | null
          short_benefit: string | null
          category: string
          gender: string | null
          min_age: number | null
          max_age: number | null
          category_eligible: string[] | null
          income_limit: number | null
          professions: string[] | null
          student_levels: string[] | null
          student_streams: string[] | null
          education_percentage_min: number | null
          employment_status: string[] | null
          business_type: string[] | null
          domicile_required: boolean | null
          applicable_states: string[] | null
          coverage: string | null
          benefit_type: string | null
          benefit_amount_min: number | null
          benefit_amount_max: number | null
          benefit_amount_text: string | null
          required_documents: string[] | null
          application_mode: string[] | null
          official_url: string | null
          helpline: string | null
          department: string | null
          ministry: string | null
          source_verified_at: string | null
          is_active: boolean | null
          created_at: string | null
          tags: string[] | null
          apply_url: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          short_benefit?: string | null
          category: string
          gender?: string | null
          min_age?: number | null
          max_age?: number | null
          category_eligible?: string[] | null
          income_limit?: number | null
          professions?: string[] | null
          student_levels?: string[] | null
          student_streams?: string[] | null
          education_percentage_min?: number | null
          employment_status?: string[] | null
          business_type?: string[] | null
          domicile_required?: boolean | null
          applicable_states?: string[] | null
          coverage?: string | null
          benefit_type?: string | null
          benefit_amount_min?: number | null
          benefit_amount_max?: number | null
          benefit_amount_text?: string | null
          required_documents?: string[] | null
          application_mode?: string[] | null
          official_url?: string | null
          helpline?: string | null
          department?: string | null
          ministry?: string | null
          source_verified_at?: string | null
          is_active?: boolean | null
          created_at?: string | null
          tags?: string[] | null
          apply_url?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          short_benefit?: string | null
          category?: string
          gender?: string | null
          min_age?: number | null
          max_age?: number | null
          category_eligible?: string[] | null
          income_limit?: number | null
          professions?: string[] | null
          student_levels?: string[] | null
          student_streams?: string[] | null
          education_percentage_min?: number | null
          employment_status?: string[] | null
          business_type?: string[] | null
          domicile_required?: boolean | null
          applicable_states?: string[] | null
          coverage?: string | null
          benefit_type?: string | null
          benefit_amount_min?: number | null
          benefit_amount_max?: number | null
          benefit_amount_text?: string | null
          required_documents?: string[] | null
          application_mode?: string[] | null
          official_url?: string | null
          helpline?: string | null
          department?: string | null
          ministry?: string | null
          source_verified_at?: string | null
          is_active?: boolean | null
          created_at?: string | null
          tags?: string[] | null
          apply_url?: string | null
        }
      }
      vault_items: {
        Row: {
          id: string
          created_by: string
          created_at: string
          title: string
          description: string | null
          category: string | null
          metadata: Json | null
          item_type: string | null
        }
        Insert: {
          id?: string
          created_by?: string
          created_at?: string
          title: string
          description?: string | null
          category?: string | null
          metadata?: Json | null
          item_type?: string | null
        }
        Update: {
          id?: string
          created_by?: string
          created_at?: string
          title?: string
          description?: string | null
          category?: string | null
          metadata?: Json | null
          item_type?: string | null
        }
      }
      reminders: {
        Row: {
          id: string
          owner_id: string | null
          related_document_id: string | null
          related_application_id: string | null
          title: string
          due_date: string
          notify_via: string[] | null
          is_completed: boolean | null
          created_at: string | null
          created_by: string
        }
        Insert: {
          id?: string
          owner_id?: string | null
          related_document_id?: string | null
          related_application_id?: string | null
          title: string
          due_date: string
          notify_via?: string[] | null
          is_completed?: boolean | null
          created_at?: string | null
          created_by?: string
        }
        Update: {
          id?: string
          owner_id?: string | null
          related_document_id?: string | null
          related_application_id?: string | null
          title?: string
          due_date?: string
          notify_via?: string[] | null
          is_completed?: boolean | null
          created_at?: string | null
          created_by?: string
        }
      }
      family_groups: {
        Row: {
          id: string
          owner_id: string | null
          group_name: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          owner_id?: string | null
          group_name?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          owner_id?: string | null
          group_name?: string | null
          created_at?: string | null
        }
      }
      family_members: {
        Row: {
          id: string
          family_group_id: string | null
          profile_id: string | null
          relation: string | null
          display_name: string | null
          permissions: Json | null
          invited_at: string | null
          accepted_at: string | null
        }
        Insert: {
          id?: string
          family_group_id?: string | null
          profile_id?: string | null
          relation?: string | null
          display_name?: string | null
          permissions?: Json | null
          invited_at?: string | null
          accepted_at?: string | null
        }
        Update: {
          id?: string
          family_group_id?: string | null
          profile_id?: string | null
          relation?: string | null
          display_name?: string | null
          permissions?: Json | null
          invited_at?: string | null
          accepted_at?: string | null
        }
      }
      applications: {
        Row: {
          id: string
          owner_id: string | null
          scheme_id: string | null
          custom_title: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          owner_id?: string | null
          scheme_id?: string | null
          custom_title?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          owner_id?: string | null
          scheme_id?: string | null
          custom_title?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      documents: {
        Row: {
          id: string
          owner_id: string | null
          family_member_id: string | null
          document_type: string | null
          file_path: string
          original_filename: string | null
          ocr_extracted_text: string | null
          ai_summary: string | null
          expiry_date: string | null
          reminder_days_before: number | null
          is_verified_by_user: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          owner_id?: string | null
          family_member_id?: string | null
          document_type?: string | null
          file_path: string
          original_filename?: string | null
          ocr_extracted_text?: string | null
          ai_summary?: string | null
          expiry_date?: string | null
          reminder_days_before?: number | null
          is_verified_by_user?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          owner_id?: string | null
          family_member_id?: string | null
          document_type?: string | null
          file_path?: string
          original_filename?: string | null
          ocr_extracted_text?: string | null
          ai_summary?: string | null
          expiry_date?: string | null
          reminder_days_before?: number | null
          is_verified_by_user?: boolean | null
          created_at?: string | null
        }
      }
      chat_sessions: {
        Row: {
          id: string
          owner_id: string | null
          title: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          owner_id?: string | null
          title?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          owner_id?: string | null
          title?: string | null
          created_at?: string | null
        }
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string | null
          role: string
          content: string
          attached_document_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          session_id?: string | null
          role: string
          content: string
          attached_document_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string | null
          role?: string
          content?: string
          attached_document_id?: string | null
          created_at?: string | null
        }
      }
      scam_reports: {
        Row: {
          id: string
          owner_id: string | null
          input_type: string | null
          raw_content: string | null
          file_path: string | null
          ai_verdict: string | null
          ai_reasoning: string | null
          url_safety_check: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          owner_id?: string | null
          input_type?: string | null
          raw_content?: string | null
          file_path?: string | null
          ai_verdict?: string | null
          ai_reasoning?: string | null
          url_safety_check?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          owner_id?: string | null
          input_type?: string | null
          raw_content?: string | null
          file_path?: string | null
          ai_verdict?: string | null
          ai_reasoning?: string | null
          url_safety_check?: Json | null
          created_at?: string | null
        }
      }
      feedback: {
        Row: {
          id: string
          created_by: string
          created_at: string
          feedback_type: string
          title: string
          url: string | null
          description: string | null
          status: string | null
        }
        Insert: {
          id?: string
          created_by?: string
          created_at?: string
          feedback_type: string
          title: string
          url?: string | null
          description?: string | null
          status?: string | null
        }
        Update: {
          id?: string
          created_by?: string
          created_at?: string
          feedback_type?: string
          title?: string
          url?: string | null
          description?: string | null
          status?: string | null
        }
      }
      checklist_items: {
        Row: {
          id: string
          application_id: string | null
          label: string
          is_completed: boolean | null
          linked_document_id: string | null
          sort_order: number | null
        }
        Insert: {
          id?: string
          application_id?: string | null
          label: string
          is_completed?: boolean | null
          linked_document_id?: string | null
          sort_order?: number | null
        }
        Update: {
          id?: string
          application_id?: string | null
          label?: string
          is_completed?: boolean | null
          linked_document_id?: string | null
          sort_order?: number | null
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
