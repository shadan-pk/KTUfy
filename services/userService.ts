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
  user_id?: string;
  role?: string;
  created_at?: string | null;
}

/**
 * Get current authenticated user's profile from backend
 * Backend: GET /api/v1/auth/me
 * Fetches from public.users table with all profile fields
 */
export async function getCurrentUserProfile(): Promise<UserProfile> {
  const url = `${process.env.API_BASE_URL}/api/v1/auth/me`;
  console.log('🔍 Fetching user profile from backend:', url);
  return apiRequest<UserProfile>(url, { method: 'GET' });
}

/**
 * Update user profile
 * Backend: PUT /api/v1/auth/me
 * Updates public.users table with profile fields
 * Can update: name, registration_number, college, branch, year_joined, year_ending, roll_number, email, metadata
 */
export async function updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  const url = `${process.env.API_BASE_URL}/api/v1/auth/me`;
  console.log('📝 Updating user profile:', url, profile);
  return apiRequest<UserProfile>(url, {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
}

/**
 * Request password reset email
 * Backend: POST /api/v1/auth/request-password-reset?email=user@example.com
 * Public endpoint - sends password reset email via Supabase
 */
export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  const url = `${process.env.API_BASE_URL}/api/v1/auth/request-password-reset?email=${encodeURIComponent(email)}`;
  console.log('🔐 Requesting password reset for:', email);
  return apiRequest<{ message: string }>(url, {
    method: 'POST',
  });
}

/**
 * Request email verification
 * Backend: POST /api/v1/auth/verify-email
 * Sends verification email to user
 */
export async function requestEmailVerification(): Promise<{ message: string }> {
  const url = `${process.env.API_BASE_URL}/api/v1/auth/verify-email`;
  console.log('📧 Requesting email verification');
  return apiRequest<{ message: string }>(url, {
    method: 'POST',
  });
}

/**
 * Delete user account
 * Backend: DELETE /api/v1/users/{user_id}
 * Permanently deletes user account from both auth.users and public.users
 */
export async function deleteUserAccount(userId: string): Promise<{ message: string }> {
  const url = `${process.env.API_BASE_URL}/api/v1/users/${userId}`;
  console.log('🗑️ Deleting user account:', userId);
  return apiRequest<{ message: string }>(url, {
    method: 'DELETE',
  });
}
