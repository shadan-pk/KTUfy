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
    
    // Set Content-Type to application/json if body is present and not already set
    if (init?.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    
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

/**
 * API Helper with automatic JSON parsing and error handling
 * @param input - Full URL or path
 * @param init - Fetch init options
 * @returns Parsed JSON response
 */
export async function apiRequest<T = any>(input: RequestInfo, init?: RequestInit): Promise<T> {
  try {
    console.log('📡 API Request:', input);
    console.log('📡 Request Method:', init?.method || 'GET');
    console.log('📡 Request Body:', init?.body);
    console.log('📡 Request Headers:', init?.headers);
    
    const response = await apiFetch(input, init);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Raw API Error Response:', errorText);
      
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        console.error('❌ Parsed API Error:', errorJson);
        errorMessage = errorJson.detail || errorJson.message || JSON.stringify(errorJson);
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      console.error('❌ Final API Error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    // Handle empty responses
    const text = await response.text();
    if (!text) return {} as T;
    
    const data = JSON.parse(text);
    console.log('✅ API Response:', data);
    return data;
  } catch (error: any) {
    console.error('❌ API Request Failed:', error);
    throw error;
  }
}
