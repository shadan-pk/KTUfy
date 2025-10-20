import React, { createContext, useContext, useEffect, useState } from 'react';
import supabase from '../supabaseClient';
import { saveTokens, getAccessToken, getRefreshToken, deleteTokens } from './secureStore';

interface AuthContextValue {
  user: any | null;
  signIn: (email: string, password: string) => Promise<void>;
  // signUp returns the raw Supabase response (may include user object even without session)
  signUp: (email: string, password: string, data?: any) => Promise<any>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    // Try to restore session from secure store on mount
    (async () => {
      const token = await getAccessToken();
      if (token) {
        // We don't have user details from token here; set a placeholder
        setUser({ token });
      }
    })();
  }, []);

  useEffect(() => {
    // Subscribe to Supabase auth state changes so signIn/signOut via other clients are reflected
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        saveTokens(session.access_token, session.refresh_token).catch(() => {});
        setUser(session.user ?? { token: session.access_token });
      } else if (event === 'SIGNED_OUT') {
        deleteTokens().catch(() => {});
        setUser(null);
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data?.session) {
      const accessToken = data.session.access_token;
      const refreshToken = data.session.refresh_token;
      await saveTokens(accessToken, refreshToken);
      setUser(data.user ?? { token: accessToken });
    }
  };

  // Return the full signUp response so callers can access created user id even when no session is returned
  const signUp = async (email: string, password: string, data?: any) => {
  // If metadata provided, include it under 'options' so Supabase stores it as user_metadata
  const payload: any = { email, password };
  if (data) payload.options = { data };
  const { data: d, error } = await supabase.auth.signUp(payload);
    if (error) throw error;
    // After signUp, Supabase may or may not return a session depending on settings
    if (d?.session) {
      const accessToken = d.session.access_token;
      const refreshToken = d.session.refresh_token;
      await saveTokens(accessToken, refreshToken);
      setUser(d.user ?? { token: accessToken });
    }
    return d; // caller can inspect d.user?.id even if no session was created
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    await deleteTokens();
    setUser(null);
  };

  const getToken = async (): Promise<string | null> => {
    let token = await getAccessToken();
    if (token) return token;

    // Try to refresh using refresh token
    const refresh = await getRefreshToken();
    if (!refresh) return null;

    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refresh });
    if (error) {
      await deleteTokens();
      return null;
    }
    if (data?.session) {
      const accessToken = data.session.access_token;
      const refreshToken = data.session.refresh_token;
      await saveTokens(accessToken, refreshToken);
      return accessToken;
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
