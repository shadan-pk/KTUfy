import { createClient } from '@supabase/supabase-js';

// Load env vars via react-native-dotenv or process.env (for web)
let SUPABASE_URL = process.env.SUPABASE_URL || '';
let SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

try {
  // react-native-dotenv will inject variables under '@env'
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const env = require('@env');
  SUPABASE_URL = SUPABASE_URL || env.SUPABASE_URL;
  SUPABASE_ANON_KEY = SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
} catch (err) {
  // ignore; fallback to process.env for web or build-time
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase URL or ANON key not set. Check .env or build config.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // use the browser's local storage in web; in RN we will persist tokens manually
    persistSession: false,
  },
});

export default supabase;
