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
  const [user, setUser] = useState<any | null>(undefined); // undefined = loading, null = not authenticated

  useEffect(() => {
    // Try to restore session from Supabase on mount
    (async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
          return;
        }

        if (session) {
          // We have an active session
          await saveTokens(session.access_token, session.refresh_token);
          setUser(session.user);
        } else {
          // No active session, try to restore from secure store
          const token = await getAccessToken();
          const refresh = await getRefreshToken();
          
          if (token && refresh) {
            // Try to refresh the session
            const { data, error: refreshError } = await supabase.auth.refreshSession({ refresh_token: refresh });
            if (!refreshError && data?.session) {
              await saveTokens(data.session.access_token, data.session.refresh_token);
              setUser(data.session.user);
            } else {
              // Refresh failed, clear tokens
              await deleteTokens();
              setUser(null);
            }
          } else {
            // No stored tokens
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Error restoring session:', err);
        setUser(null);
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
    try {
      console.log('🔐 Attempting sign in with email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('❌ Sign in error:', error);
        throw error;
      }
      
      if (data?.session) {
        const accessToken = data.session.access_token;
        const refreshToken = data.session.refresh_token;
        
        console.log('✅ Sign in successful!');
        console.log('='.repeat(80));
        console.log('🔑 JWT ACCESS TOKEN:');
        console.log(accessToken);
        console.log('='.repeat(80));
        console.log('🔄 REFRESH TOKEN:');
        console.log(refreshToken);
        console.log('='.repeat(80));
        
        await saveTokens(accessToken, refreshToken);
        setUser(data.user ?? { token: accessToken });
      }
    } catch (err) {
      console.error('❌ Sign in exception:', err);
      throw err;
    }
  };

  // Return the full signUp response so callers can access created user id even when no session is returned
  const signUp = async (email: string, password: string, data?: any) => {
    try {
      console.log('📝 Attempting sign up with email:', email);
      // If metadata provided, include it under 'options' so Supabase stores it as user_metadata
      const payload: any = { email, password };
      if (data) payload.options = { data };
      
      const { data: d, error } = await supabase.auth.signUp(payload);
      
      if (error) {
        console.error('❌ Sign up error:', error);
        throw error;
      }
      
      console.log('✅ Sign up successful!');
      
      // After signUp, Supabase may or may not return a session depending on settings
      if (d?.session) {
        const accessToken = d.session.access_token;
        const refreshToken = d.session.refresh_token;
        await saveTokens(accessToken, refreshToken);
        setUser(d.user ?? { token: accessToken });
      }
      return d; // caller can inspect d.user?.id even if no session was created
    } catch (err) {
      console.error('❌ Sign up exception:', err);
      throw err;
    }
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
