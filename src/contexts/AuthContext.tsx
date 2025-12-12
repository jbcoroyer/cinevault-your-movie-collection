import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Profile } from '@/lib/supabase';
import { processDailyLogin, DailyLoginResult } from '@/services/gamificationService';
import { DailyBonusDialog } from '@/components/gamification/DailyBonusDialog';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      session: null,
      profile: null,
      loading: true,
      signIn: async () => ({ error: new Error('Auth not initialized') }),
      signUp: async () => ({ error: new Error('Auth not initialized') }),
      signInWithGoogle: async () => ({ error: new Error('Auth not initialized') }),
      signOut: async () => {},
      resetPassword: async () => ({ error: new Error('Auth not initialized') }),
      updateProfile: async () => ({ error: new Error('Auth not initialized') }),
      refreshProfile: async () => {},
    };
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Daily bonus dialog state
  const [showDailyBonus, setShowDailyBonus] = useState(false);
  const [dailyLoginResult, setDailyLoginResult] = useState<DailyLoginResult | null>(null);
  const [hasProcessedLogin, setHasProcessedLogin] = useState(false);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Process daily login when user is authenticated
  const handleDailyLogin = async (userId: string) => {
    if (hasProcessedLogin) return;
    
    try {
      setHasProcessedLogin(true);
      const result = await processDailyLogin(userId);
      
      if (result && !result.alreadyLoggedIn) {
        setDailyLoginResult(result);
        setShowDailyBonus(true);
        // Refresh profile to get updated XP
        await fetchProfile(userId);
      }
    } catch (error) {
      console.error('Error processing daily login:', error);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
          handleDailyLogin(session.user.id);
        }, 0);
      } else {
        setProfile(null);
        setHasProcessedLogin(false);
      }
      
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
        handleDailyLogin(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setHasProcessedLogin(false);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });
    return { error: error as Error | null };
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', user.id);

    if (!error) {
      await fetchProfile(user.id);
    }

    return { error: error as Error | null };
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
      
      {/* Daily Bonus Dialog */}
      {dailyLoginResult && (
        <DailyBonusDialog
          open={showDailyBonus}
          onOpenChange={setShowDailyBonus}
          streak={dailyLoginResult.streak?.current_streak || 1}
          xpEarned={dailyLoginResult.bonus?.xpEarned || 25}
          popcornEarned={dailyLoginResult.bonus?.popcornEarned || 5}
          streakBroken={dailyLoginResult.streakBroken}
          newBadges={dailyLoginResult.newBadges}
        />
      )}
    </AuthContext.Provider>
  );
};
