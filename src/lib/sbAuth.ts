/**
 * Auth wrapper using @doable/data built-in auth.
 * This provides the same interface as the previous Supabase auth.
 */
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
    try {
      const { user } = await db.auth.getUser();
      if (!user) return { user: null };
      return {
        user: {
          id: user.id,
          email: (user as any).email,
        },
      };
    } catch {
      return { user: null };
    }
  },

  async signUp(email: string, password: string): Promise<AuthResult> {
    try {
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
      return { user: null, error: err?.message || 'Signup failed' };
    }
  },

  async login(email: string, password: string): Promise<AuthResult> {
    try {
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
      return { user: null, error: err?.message || 'Login failed' };
    }
  },

  async logout(): Promise<void> {
    try {
      await db.auth.logout();
    } catch {
      // ignore
    }
  },

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    let mounted = true;
    const check = async () => {
      if (!mounted) return;
      const { user } = await this.getUser();
      if (mounted) callback(user);
    };
    check();
    const interval = setInterval(check, 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  },
};
