/**
 * Media Tools Service
 * Handles file upload → backend processing → file download for all media tools.
 */

import { Paths, File as ExpoFile } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform, Alert } from 'react-native';
import supabase from '../supabaseClient';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8000';
const MEDIA_BASE = `${API_BASE}/api/v1/media`;

// Longer timeout for media processing (3 minutes)
const MEDIA_TIMEOUT_MS = 180_000;

// ─── Auth helper ──────────────────────────────────────────────
async function getToken(): Promise<string | null> {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token ?? null;
    } catch {
        // Session not ready yet (e.g. still loading from AsyncStorage)
        return null;
    }
}

// ─── Types ────────────────────────────────────────────────────

export interface PickedFile {
    uri: string;
    name: string;
    mimeType?: string;
    size?: number;
}

export interface ProcessingResult {
    localUri: string;
    filename: string;
}

// ─── File Picker Helpers ──────────────────────────────────────

/**
 * Pick a single file with an optional type filter.
 */
export async function pickSingleFile(
    type: string[] = ['*/*']
): Promise<PickedFile | null> {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type,
            copyToCacheDirectory: true,
            multiple: false,
        });

        if (result.canceled || !result.assets?.length) return null;

        const asset = result.assets[0];
        return {
            uri: asset.uri,
            name: asset.name,
            mimeType: asset.mimeType ?? undefined,
            size: asset.size ?? undefined,
        };
    } catch (err) {
        console.error('File picker error:', err);
        return null;
    }
}

/**
 * Pick multiple files with an optional type filter.
 */
export async function pickMultipleFiles(
    type: string[] = ['*/*']
): Promise<PickedFile[]> {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type,
            copyToCacheDirectory: true,
            multiple: true,
        });

        if (result.canceled || !result.assets?.length) return [];

        return result.assets.map((asset) => ({
            uri: asset.uri,
            name: asset.name,
            mimeType: asset.mimeType ?? undefined,
            size: asset.size ?? undefined,
        }));
    } catch (err) {
        console.error('File picker error:', err);
        return [];
    }
}

// ─── Helpers ──────────────────────────────────────────────────

function extractFilename(res: Response): string {
    const cd = res.headers.get('content-disposition') || '';
    const match = cd.match(/filename\*?=(?:UTF-8''|["']?)([^"';\n]+)/i);
    if (match?.[1]) return decodeURIComponent(match[1].replace(/['"]/g, ''));
    return 'processed_file';
}

// ─── Upload + Download Core ───────────────────────────────────

/**
 * Upload file(s) to a media endpoint and download the result.
 * Uses fetch + FormData on all platforms.
 * Automatically retries once on transient failures (cold connection, auth not ready, etc.)
 */
export async function processMedia(
    endpoint: string,
    files: { fieldName: string; file: PickedFile }[],
    fields: Record<string, string> = {},
): Promise<ProcessingResult> {
    try {
        return await _processMediaCore(endpoint, files, fields);
    } catch (firstError: any) {
        // Retry once after a short delay — handles cold connections, auth not yet loaded, etc.
        console.warn('processMedia: first attempt failed, retrying…', firstError?.message);
        await new Promise(r => setTimeout(r, 600));
        return _processMediaCore(endpoint, files, fields);
    }
}

/** Core implementation (called by processMedia with retry wrapper) */
async function _processMediaCore(
    endpoint: string,
    files: { fieldName: string; file: PickedFile }[],
    fields: Record<string, string> = {},
): Promise<ProcessingResult> {
    const token = await getToken();
    const url = `${MEDIA_BASE}${endpoint}`;

    const formData = new FormData();

    // Add fields
    for (const [key, value] of Object.entries(fields)) {
        formData.append(key, value);
    }

    // Add files
    if (Platform.OS === 'web') {
        for (const { fieldName, file } of files) {
            const response = await fetch(file.uri);
            const blob = await response.blob();
            formData.append(fieldName, blob, file.name);
        }
    } else {
        for (const { fieldName, file } of files) {
            formData.append(fieldName, {
                uri: file.uri,
                name: file.name,
                type: file.mimeType || 'application/octet-stream',
            } as any);
        }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MEDIA_TIMEOUT_MS);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    // Do NOT set Content-Type — let fetch/FormData set the boundary automatically

    const res = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
        const errorText = await res.text();
        let msg = `Server error: ${res.status}`;
        try {
            const j = JSON.parse(errorText);
            msg = j.detail || msg;
        } catch { }
        throw new Error(msg);
    }

    const filename = extractFilename(res);

    // Check if response is JSON with download_url
    // Clone first so the body is still available if JSON has no download_url
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        const cloned = res.clone();
        try {
            const json = await cloned.json();
            if (json.download_url) {
                if (Platform.OS === 'web') {
                    triggerWebDownload(json.download_url, filename);
                    return { localUri: json.download_url, filename };
                }
                return downloadToCache(json.download_url, filename, token);
            }
        } catch { /* not valid JSON, fall through to binary handling */ }
    }

    // Direct file response
    if (Platform.OS === 'web') {
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        triggerWebDownload(objectUrl, filename);
        return { localUri: objectUrl, filename };
    }

    // Native: save blob to cache via expo-file-system new API
    return saveBlobToCache(res, filename);
}

// ─── Web download trigger ─────────────────────────────────────

function triggerWebDownload(url: string, filename: string) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ─── Native: save response to cache ───────────────────────────

async function saveBlobToCache(
    res: Response,
    filename: string,
): Promise<ProcessingResult> {
    const arrayBuffer = await res.arrayBuffer();
    const cacheFile = new ExpoFile(Paths.cache, filename);

    // Write ArrayBuffer → Uint8Array → File via writable stream
    const uint8 = new Uint8Array(arrayBuffer);
    const stream = cacheFile.writableStream();
    const writer = stream.getWriter();
    await writer.write(uint8);
    await writer.close();

    return { localUri: cacheFile.uri, filename };
}

async function downloadToCache(
    downloadUrl: string,
    filename: string,
    token: string | null,
): Promise<ProcessingResult> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(downloadUrl, { headers });
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);

    return saveBlobToCache(res, filename);
}

// ─── Share / Save ─────────────────────────────────────────────

/**
 * Share / save a processed file. Call after processMedia returns.
 */
export async function shareFile(localUri: string): Promise<void> {
    if (Platform.OS === 'web') {
        // On web the file was already auto-downloaded
        return;
    }

    const available = await Sharing.isAvailableAsync();
    if (!available) {
        Alert.alert('Sharing not available', 'Sharing is not available on this device.');
        return;
    }

    await Sharing.shareAsync(localUri);
}

// ─── Convenience: format human-readable file size ─────────────
export function formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
