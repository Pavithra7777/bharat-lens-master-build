import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import db from './db';
import { sbAuth } from './sbAuth';
import { type Language } from './i18n';

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
  user: { id: string; email?: string } | null;
  isLoading: boolean;
  profile: Profile | null;
  familyMembers: FamilyMember[];
  activeFamilyMemberId: string | null;
  simpleMode: boolean;
  language: Language;
  setUser: (user: { id: string; email?: string } | null) => void;
  setProfile: (profile: Profile | null) => void;
  setSimpleMode: (enabled: boolean) => void;
  setLanguage: (lang: Language) => void;
  setActiveFamilyMember: (id: string | null) => void;
  logout: () => Promise<void>;
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

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const { user: currentUser } = await sbAuth.getUser();
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
      // First try to read profile
      const data = await db.getProfile(userId);

      if (data) {
        setProfile(data as Profile);
        setSimpleModeState(data.simple_mode_enabled || false);
        setLanguageState((data.preferred_language || 'en') as Language);
        if (data.id) await loadFamilyMembers(data.id);
      } else {
        // Create new profile — upsertProfile sets created_by from auth
        const newProfile = await db.upsertProfile({
          id: userId,
          full_name: 'User',
          preferred_language: 'en',
          onboarding_completed: false,
          created_by: userId,
        });
        if (newProfile) {
          setProfile(newProfile as Profile);
        }
      }
    } catch (error) {
      console.error('Load/create profile failed:', error);
      // Fallback: create a local profile when database is unavailable
      // This allows the app to proceed through onboarding even without DB
      const fallbackProfile = {
        id: userId,
        full_name: '',
        phone: null,
        preferred_language: 'en' as Language,
        state: '',
        district: null,
        date_of_birth: null,
        occupation_category: '',
        simple_mode_enabled: false,
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: userId,
      };
      setProfile(fallbackProfile);
    }
  }

  async function loadFamilyMembers(profileId: string) {
    try {
      const group = await db.getFamilyGroupByOwner(profileId);
      if (group) {
        const members = await db.getFamilyMembers(group.id);
        const mapped: FamilyMember[] = (members || []).map(m => ({
          id: m.id || '',
          family_group_id: m.group_id || m.id || '',
          profile_id: (m as any).profile_id || null,
          relation: m.relationship || 'member',
          display_name: m.name || 'Family Member',
          permissions: {
            view_documents: !!(m.permissions as any)?.view_documents || true,
            manage_reminders: !!(m.permissions as any)?.manage_reminders || false,
          },
        }));
        setFamilyMembers(mapped);
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
      await db.updateProfile(profile.id, { simple_mode_enabled: enabled });
      setProfile(prev => prev ? { ...prev, simple_mode_enabled: enabled } : null);
    }
  }

  async function setLanguage(lang: Language) {
    setLanguageState(lang);
    if (profile) {
      await db.updateProfile(profile.id, { preferred_language: lang });
      setProfile(prev => prev ? { ...prev, preferred_language: lang } : null);
    }
  }

  async function setActiveFamilyMember(id: string | null) {
    setActiveFamilyMemberId(id);
  }

  async function logout() {
    await sbAuth.logout();
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
