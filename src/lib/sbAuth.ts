/**
 * Supabase Auth wrapper that mirrors @doable/data auth interface.
 * This allows the app to switch from @doable/data to Supabase seamlessly.
 */
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email?: string;
}

// Supabase doesn't expose the isAdmin flag — it's set by the platform
// For cross-user admin queries, use db.admin.query from @doable/data
// For user-owned data, Supabase RLS handles scoping automatically
export interface AuthResult {
  user: AuthUser | null;
  error?: string;
}

export const sbAuth = {
  async getUser(): Promise<{ user: AuthUser | null }> {
    if (!supabase) {
      return { user: null };
    }
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return { user: null };
      }
      return {
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      };
    } catch {
      return { user: null };
    }
  },

  async signUp(email: string, password: string): Promise<AuthResult> {
    if (!supabase) {
      return { user: null, error: 'Supabase not configured' };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      return { user: null, error: error.message };
    }
    return {
      user: data.user
        ? { id: data.user.id, email: data.user.email }
        : null,
    };
  },

  async login(email: string, password: string): Promise<AuthResult> {
    if (!supabase) {
      return { user: null, error: 'Supabase not configured' };
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { user: null, error: error.message };
    }
    return {
      user: data.user
        ? { id: data.user.id, email: data.user.email }
        : null,
    };
  },

  async logout(): Promise<void> {
    if (!supabase) return;
    await supabase.auth.signOut();
  },

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    if (!supabase) return () => {};
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(
        session?.user
          ? { id: session.user.id, email: session.user.email }
          : null
      );
    });
    return () => data.subscription.unsubscribe();
  },
};
