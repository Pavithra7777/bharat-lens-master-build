import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uvtedewjjkulnkthwcmk.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ythzGuzXHUW_T8vPqEONBA_C3au-5Je';

console.log('[Supabase] Initializing with URL:', supabaseUrl ? 'URL present' : 'URL missing');
console.log('[Supabase] Initializing with Key:', supabaseAnonKey ? 'Key present' : 'Key missing');

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  : null;

console.log('[Supabase] Client created:', supabase ? 'success' : 'failed (null)');

export function isSupabaseConfigured(): boolean {
  return !!supabase;
}
