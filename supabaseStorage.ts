import { supabase } from './supabaseClient';

// Storage bucket configuration
export const STORAGE_BUCKET = 'notes'; // Your bucket name from Supabase

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  filePath: string,
  fileData: Blob | ArrayBuffer,
  options?: {
    contentType?: string;
    upsert?: boolean;
  }
) {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, fileData, {
      contentType: options?.contentType || 'application/octet-stream',
      upsert: options?.upsert || false,
    });

  if (error) throw error;
  return data;
}

/**
 * Get public URL for a file in storage
 */
export function getPublicUrl(filePath: string) {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

/**
 * List files in a folder
 */
export async function listFiles(folderPath: string) {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(folderPath, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) throw error;
  return data || [];
}

/**
 * Delete a file from storage
 */
export async function deleteFile(filePath: string) {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);

  if (error) throw error;
  return data;
}

/**
 * Get file metadata
 */
export async function getFileInfo(filePath: string) {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(filePath.substring(0, filePath.lastIndexOf('/')), {
      search: filePath.substring(filePath.lastIndexOf('/') + 1),
    });

  if (error) throw error;
  return data?.[0] || null;
}
