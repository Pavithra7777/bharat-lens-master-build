import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
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
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }
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
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Load profile error:', error);
        return;
      }

      if (data) {
        setProfile(data as Profile);
        setSimpleModeState(data.simple_mode_enabled || false);
        setLanguageState((data.preferred_language as Language) || 'en');
        await loadFamilyMembers(data.id);
      } else {
        // Create new profile
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: 'User',
            preferred_language: 'en',
          })
          .select()
          .single();

        if (!insertError && newProfile) {
          setProfile(newProfile as Profile);
        }
      }
    } catch (error) {
      console.error('Load/create profile failed:', error);
    }
  }

  async function loadFamilyMembers(profileId: string) {
    if (!supabase) return;
    try {
      const { data: groupData } = await supabase
        .from('family_groups')
        .select('id')
        .eq('owner_id', profileId)
        .maybeSingle();

      if (groupData) {
        const { data: membersData } = await supabase
          .from('family_members')
          .select('*')
          .eq('family_group_id', groupData.id)
          .order('invited_at', { ascending: true });

        if (membersData) {
          setFamilyMembers(membersData as FamilyMember[]);
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
    if (profile && supabase) {
      await supabase
        .from('profiles')
        .update({ simple_mode_enabled: enabled, updated_at: new Date().toISOString() })
        .eq('id', profile.id);
      setProfile(prev => prev ? { ...prev, simple_mode_enabled: enabled } : null);
    }
  }

  async function setLanguage(lang: Language) {
    setLanguageState(lang);
    if (profile && supabase) {
      await supabase
        .from('profiles')
        .update({ preferred_language: lang, updated_at: new Date().toISOString() })
        .eq('id', profile.id);
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
