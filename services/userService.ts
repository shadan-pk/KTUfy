/**
 * User Service API
 * Handles all user-related operations with the FastAPI backend
 */

import { apiRequest } from '../utils/api';

export interface UserProfile {
  email: string;
  name: string;
  registration_number: string;
  year_joined: number;
  year_ending: number;
  roll_number: string;
  college: string;
  branch: string;
  metadata?: any;
}

/**
 * Get current authenticated user's profile from backend
 * Matches your backend endpoint: GET /api/v1/auth/me
 */
export async function getCurrentUserProfile(): Promise<UserProfile> {
  const url = `${process.env.API_BASE_URL}/api/v1/auth/me`;
  console.log('🔍 Fetching user profile from backend:', url);
  return apiRequest<UserProfile>(url, { method: 'GET' });
}

/**
 * Update user profile (when you implement this endpoint in backend)
 */
export async function updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  const url = `${process.env.API_BASE_URL}/api/v1/auth/me`;
  console.log('📝 Updating user profile:', url);
  return apiRequest<UserProfile>(url, {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
}
