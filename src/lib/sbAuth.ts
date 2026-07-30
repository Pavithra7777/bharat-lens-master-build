/**
 * Auth wrapper using Supabase directly.
 * This syncs auth with the Supabase client used for data operations.
 */
import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email?: string;
}

export interface AuthResult {
  user: AuthUser | null;
  error?: string;
}

// Get the Supabase client (lazy initialization)
function getClient() {
  return supabase;
}

export const sbAuth = {
  async getUser(): Promise<{ user: AuthUser | null }> {
    try {
      const client = getClient();
      if (!client) {
        // Supabase not configured, try @doable/data fallback
        const { db } = await import('@doable/data');
        const result = await db.auth.getUser();
        if (!result.user) return { user: null };
        return {
          user: {
            id: result.user.id,
            email: (result.user as any).email,
          },
        };
      }
      
      const { data: { user }, error } = await client.auth.getUser();
      if (error || !user) return { user: null };
      return {
        user: {
          id: user.id,
          email: user.email,
        },
      };
    } catch (err) {
      console.error('getUser error:', err);
      return { user: null };
    }
  },

  async signUp(email: string, password: string): Promise<AuthResult> {
    try {
      const client = getClient();
      if (!client) {
        // Fallback to @doable/data
        const { db } = await import('@doable/data');
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
      }

      const { data, error } = await client.auth.signUp({
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
      
      return { user: null, error: 'Signup failed - no user returned' };
    } catch (err: any) {
      console.error('signUp error:', err);
      return { user: null, error: err?.message || 'Signup failed' };
    }
  },

  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const client = getClient();
      if (!client) {
        // Fallback to @doable/data
        const { db } = await import('@doable/data');
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
      }

      const { data, error } = await client.auth.signInWithPassword({
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
      
      return { user: null, error: 'Login failed - no user returned' };
    } catch (err: any) {
      console.error('login error:', err);
      return { user: null, error: err?.message || 'Login failed' };
    }
  },

  async logout(): Promise<void> {
    try {
      const client = getClient();
      if (client) {
        await client.auth.signOut();
      }
      // Also try @doable/data logout
      try {
        const { db } = await import('@doable/data');
        await db.auth.logout();
      } catch {}
    } catch (err) {
      console.error('logout error:', err);
    }
  },

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    const client = getClient();
    
    if (client) {
      // Use Supabase auth state change
      const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          callback({
            id: session.user.id,
            email: session.user.email,
          });
        } else if (event === 'SIGNED_OUT') {
          callback(null);
        }
      });
      
      // Get initial state
      client.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          callback({
            id: user.id,
            email: user.email,
          });
        }
      });
      
      return () => subscription.unsubscribe();
    } else {
      // Fallback to polling with @doable/data
      let mounted = true;
      const check = async () => {
        if (!mounted) return;
        const { db } = await import('@doable/data');
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
