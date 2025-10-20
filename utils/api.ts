import supabase from '../supabaseClient';
import { getAccessToken, getRefreshToken, saveTokens, deleteTokens } from '../auth/secureStore';

async function refreshTokenIfNeeded() {
  const refresh = await getRefreshToken();
  if (!refresh) return null;

  // Use Supabase API to refresh session
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refresh });
  if (error) {
    await deleteTokens();
    throw error;
  }
  if (data?.session) {
    const accessToken = data.session.access_token;
    const refreshToken = data.session.refresh_token;
    await saveTokens(accessToken, refreshToken);
    return accessToken;
  }
  return null;
}

export async function apiFetch(input: RequestInfo, init?: RequestInit) {
  let token = await getAccessToken();

  const makeRequest = async (t: string | null) => {
    const headers = new Headers(init?.headers as any || {});
    if (t) headers.set('Authorization', `Bearer ${t}`);
    const res = await fetch(input, { ...init, headers });
    return res;
  };

  let res = await makeRequest(token);
  if (res.status === 401) {
    // Try refresh
    try {
      const newToken = await refreshTokenIfNeeded();
      if (newToken) {
        res = await makeRequest(newToken);
      }
    } catch (err) {
      // refresh failed: propagate 401
      return res;
    }
  }

  return res;
}
