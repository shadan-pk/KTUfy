import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Get Supabase credentials from Expo config or environment variables (for web)
let SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL || '';
let SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY || '';


// Fallback for web platform - try process.env
if (Platform.OS === 'web' && (!SUPABASE_URL || !SUPABASE_ANON_KEY)) {
  SUPABASE_URL = SUPABASE_URL || process.env.SUPABASE_URL || '';
  SUPABASE_ANON_KEY = SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Supabase URL or ANON key not set. Check .env or app.config.js');
}

// Create Supabase client with proper storage configuration
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: Platform.OS !== 'web' ? AsyncStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
