import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { db } from '@doable/data';
import { type Language } from './i18n';

// Types
export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  preferred_language: Language;
  state: string | null;
  district: string | null;
  occupation_category: string | null;
  simple_mode_enabled: boolean;
  onboarding_completed: boolean;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  family_group_id: string;
  profile_id: string | null;
  relation: string;
  display_name: string;
  permissions: {
    view_documents: boolean;
    manage_reminders: boolean;
  };
}

export interface AppState {
  // Auth
  user: { id: string; email?: string } | null;
  isLoading: boolean;
  
  // Profile
  profile: Profile | null;
  
  // Family
  familyMembers: FamilyMember[];
  activeFamilyMemberId: string | null;
  
  // UI
  simpleMode: boolean;
  language: Language;
  
  // Actions
  setUser: (user: { id: string; email?: string } | null) => void;
  setProfile: (profile: Profile | null) => void;
  setSimpleMode: (enabled: boolean) => void;
  setLanguage: (lang: Language) => void;
  setActiveFamilyMember: (id: string | null) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<{ id: string; email?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [activeFamilyMemberId, setActiveFamilyMemberId] = useState<string | null>(null);
  const [simpleMode, setSimpleModeState] = useState(false);
  const [language, setLanguageState] = useState<Language>('en');

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const { user: currentUser } = await db.auth.getUser();
      if (currentUser) {
        setUserState(currentUser);
        await loadOrCreateProfile(currentUser.id);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadOrCreateProfile(userId: string) {
    try {
      // Try to find existing profile by user_id (assuming profiles.id = auth user id)
      const r = await db.query<Profile>(
        'SELECT * FROM profiles WHERE id = $1 LIMIT 1',
        [userId]
      );
      
      if (r.ok && r.rows.length > 0 && r.rows[0]) {
        const row = r.rows[0];
        setProfile(row);
        setSimpleModeState(row.simple_mode_enabled || false);
        setLanguageState((row.preferred_language as Language) || 'en');
        
        // Load family members if family group exists
        await loadFamilyMembers(row.id);
      } else {
        // Create new profile for this user
        const insertR = await db.query<Profile>(
          `INSERT INTO profiles (id, full_name, preferred_language) 
           VALUES ($1, $2, $3) RETURNING *`,
          [userId, 'User', 'en']
        );
        if (insertR.ok && insertR.rows.length > 0 && insertR.rows[0]) {
          const newProfile = insertR.rows[0];
          setProfile(newProfile);
        }
      }
    } catch (error) {
      console.error('Load/create profile failed:', error);
    }
  }

  async function loadFamilyMembers(profileId: string) {
    if (!profileId) return;
    try {
      // Find family group
      const groupR = await db.query(
        'SELECT id FROM family_groups WHERE owner_id = $1 LIMIT 1',
        [profileId]
      );
      
      if (groupR.ok && groupR.rows.length > 0 && groupR.rows[0]) {
        const membersR = await db.query<FamilyMember>(
          'SELECT * FROM family_members WHERE family_group_id = $1 ORDER BY invited_at',
          [groupR.rows[0].id]
        );
        if (membersR.ok && membersR.rows) {
          setFamilyMembers(membersR.rows);
        }
      }
    } catch (error) {
      console.error('Load family members failed:', error);
    }
  }

  function setUser(userData: { id: string; email?: string } | null) {
    setUserState(userData);
    if (userData) {
      loadOrCreateProfile(userData.id);
    } else {
      setProfile(null);
      setFamilyMembers([]);
      setActiveFamilyMemberId(null);
    }
  }

  function setProfileState(profileData: Profile | null) {
    setProfile(profileData);
    if (profileData) {
      setSimpleModeState(profileData.simple_mode_enabled);
      setLanguageState(profileData.preferred_language as Language);
    }
  }

  async function setSimpleMode(enabled: boolean) {
    setSimpleModeState(enabled);
    if (profile) {
      await db.query(
        'UPDATE profiles SET simple_mode_enabled = $1, updated_at = now() WHERE id = $2',
        [enabled, profile.id]
      );
      setProfile(prev => prev ? { ...prev, simple_mode_enabled: enabled } : null);
    }
  }

  async function setLanguage(lang: Language) {
    setLanguageState(lang);
    if (profile) {
      await db.query(
        'UPDATE profiles SET preferred_language = $1, updated_at = now() WHERE id = $2',
        [lang, profile.id]
      );
      setProfile(prev => prev ? { ...prev, preferred_language: lang } : null);
    }
  }

  async function setActiveFamilyMember(id: string | null) {
    setActiveFamilyMemberId(id);
  }

  async function logout() {
    await db.auth.logout();
    setUser(null);
    setProfile(null);
    setFamilyMembers([]);
    setActiveFamilyMemberId(null);
  }

  async function refreshProfile() {
    if (user) {
      await loadOrCreateProfile(user.id);
    }
  }

  const value: AppState = {
    user,
    isLoading,
    profile,
    familyMembers,
    activeFamilyMemberId,
    simpleMode,
    language,
    setUser,
    setProfile: setProfileState,
    setSimpleMode,
    setLanguage,
    setActiveFamilyMember,
    logout,
    refreshProfile,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
