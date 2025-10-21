import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'supabase_access_token';
const REFRESH_TOKEN_KEY = 'supabase_refresh_token';
const PENDING_PROFILE_KEY = 'pending_user_profile';

export async function saveTokens(accessToken: string, refreshToken?: string) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export async function getAccessToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function deleteTokens() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

// Temp profile storage for signup -> email verification -> login flow
export async function savePendingProfile(profileData: any) {
  await SecureStore.setItemAsync(PENDING_PROFILE_KEY, JSON.stringify(profileData));
}

export async function getPendingProfile(): Promise<any | null> {
  const data = await SecureStore.getItemAsync(PENDING_PROFILE_KEY);
  return data ? JSON.parse(data) : null;
}

export async function deletePendingProfile() {
  await SecureStore.deleteItemAsync(PENDING_PROFILE_KEY);
}
