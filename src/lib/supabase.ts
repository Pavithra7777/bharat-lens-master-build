import { createClient } from '@supabase/supabase-js';

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

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  : null;

export function isSupabaseConfigured(): boolean {
  return !!supabase;
}
