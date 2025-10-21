import supabase from './supabaseClient';

export { supabase };

// Helper: get user profile from 'users' table
export async function getUserProfile(userId: string) {
  // use maybeSingle() so that if no row exists we get data === null (no error)
  // instead of an error like PGRST116 (result contains 0 rows)
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data; // may be null when profile hasn't been created yet
}

export async function upsertUserProfile(user: any) {
  const { data, error } = await supabase.from('users').upsert(user).select();
  if (error) {
    // surface more context for debugging
    console.error('upsertUserProfile error:', { error, user });
    throw error;
  }
  return data;
}

// Ticklist: we'll store each subject as a row in 'ticklists' table with items JSONB
export async function getTicklistsForUser(userId: string) {
  const { data, error } = await supabase.from('ticklists').select('*').eq('user_id', userId);
  if (error) throw error;
  return data;
}

export async function upsertTicklist(ticklist: any) {
  const { data, error } = await supabase.from('ticklists').upsert(ticklist).select();
  if (error) throw error;
  return data;
}

export async function deleteTicklist(subjectId: string, userId: string) {
  const { data, error } = await supabase.from('ticklists').delete().match({ id: subjectId, user_id: userId });
  if (error) throw error;
  return data;
}
