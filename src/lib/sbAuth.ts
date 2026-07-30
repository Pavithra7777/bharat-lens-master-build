/**
 * Auth wrapper using Supabase directly.
 * This syncs auth with the Supabase client used for data operations.
 */
import { supabase } from './supabase';
import { db } from '@doable/data';

export interface AuthUser {
  id: string;
  email?: string;
}

export interface AuthResult {
  user: AuthUser | null;
  error?: string;
}

export const sbAuth = {
  async getUser(): Promise<{ user: AuthUser | null }> {
    console.log('[Auth] getUser called');
    try {
      // Try Supabase first
      if (supabase) {
        console.log('[Auth] Trying Supabase...');
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.log('[Auth] Supabase error:', error.message);
        } else if (user) {
          console.log('[Auth] Supabase user found:', user.id);
          return {
            user: {
              id: user.id,
              email: user.email,
            },
          };
        }
      } else {
        console.log('[Auth] Supabase not configured, trying @doable/data...');
      }
      
      // Fallback to @doable/data
      const result = await db.auth.getUser();
      console.log('[Auth] @doable/data result:', result.user ? 'user found' : 'no user');
      if (!result.user) return { user: null };
      return {
        user: {
          id: result.user.id,
          email: (result.user as any).email,
        },
      };
    } catch (err: any) {
      console.error('[Auth] getUser error:', err);
      return { user: null };
    }
  },

  async signUp(email: string, password: string): Promise<AuthResult> {
    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) {
          return { user: null, error: error.message };
        }
        
        if (data.user) {
          return {
            user: {
              id: data.user.id,
              email: data.user.email,
            },
          };
        }
      }
      
      const result = await db.auth.signup({ email, password });
      if (!result.ok) {
        return { user: null, error: result.message || 'Signup failed' };
      }
      return {
        user: {
          id: result.user?.id || '',
          email: email,
        },
      };
    } catch (err: any) {
      console.error('signUp error:', err);
      return { user: null, error: err?.message || 'Signup failed' };
    }
  },

  async login(email: string, password: string): Promise<AuthResult> {
    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          return { user: null, error: error.message };
        }
        
        if (data.user) {
          return {
            user: {
              id: data.user.id,
              email: data.user.email,
            },
          };
        }
      }
      
      const result = await db.auth.login({ email, password });
      if (!result.ok) {
        return { user: null, error: result.message || 'Login failed' };
      }
      return {
        user: {
          id: result.user?.id || '',
          email: email,
        },
      };
    } catch (err: any) {
      console.error('login error:', err);
      return { user: null, error: err?.message || 'Login failed' };
    }
  },

  async logout(): Promise<void> {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      await db.auth.logout();
    } catch (err) {
      console.error('logout error:', err);
    }
  },

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          callback({
            id: session.user.id,
            email: session.user.email,
          });
        } else if (event === 'SIGNED_OUT') {
          callback(null);
        }
      });
      
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          callback({
            id: user.id,
            email: user.email,
          });
        }
      });
      
      return () => subscription.unsubscribe();
    } else {
      let mounted = true;
      const check = async () => {
        if (!mounted) return;
        const { user } = await db.auth.getUser();
        if (mounted) callback(user ? { id: user.id, email: (user as any).email } : null);
      };
      check();
      const interval = setInterval(check, 1000);
      return () => {
        mounted = false;
        clearInterval(interval);
      };
    }
  },
};
