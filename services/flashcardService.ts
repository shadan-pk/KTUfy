/**
 * Flashcard Service API
 * Handles flashcard generation via the backend AI/RAG system
 */

import { apiRequest } from '../utils/api';

// Types
export interface Flashcard {
    front: string;
    back: string;
}

export interface GenerateFlashcardsRequest {
    topic: string;
    count?: number;
    force_regenerate?: boolean;
}

export interface FlashcardSet {
    id: string;
    topic: string;
    flashcards: Flashcard[];
    cached: boolean;
    created_at: string;
}

export interface GenerateFlashcardsResponse {
    id: string;
    topic: string;
    flashcards: Flashcard[];
    cached: boolean;
    created_at: string;
}

/**
 * Generate flashcards for a given topic using AI
 * Backend: POST /api/v1/flashcards/generate
 *
 * The backend caches results. If the same topic is requested again, the cached
 * version is returned (with `cached: true`). Use `force_regenerate: true` to
 * bypass the cache and generate fresh flashcards.
 *
 * @param topic - The topic to generate flashcards for
 * @param count - Number of flashcards to generate (default: 10)
 * @param forceRegenerate - If true, bypasses the cache and generates new flashcards
 * @returns Generated flashcard set with id, cached status, and creation time
 */
export async function generateFlashcards(
    topic: string,
    count: number = 10,
    forceRegenerate: boolean = false
): Promise<GenerateFlashcardsResponse> {
    const url = `${process.env.API_BASE_URL}/api/v1/flashcards/generate`;
    console.log('🎴 Generating flashcards for topic:', topic, forceRegenerate ? '(force)' : '');

    return apiRequest<GenerateFlashcardsResponse>(url, {
        method: 'POST',
        body: JSON.stringify({ topic, count, force_regenerate: forceRegenerate }),
    });
}

/**
 * List all saved flashcard sets for the current user
 * Backend: GET /api/v1/flashcards/
 */
export async function listFlashcardSets(): Promise<FlashcardSet[]> {
    const url = `${process.env.API_BASE_URL}/api/v1/flashcards/`;
    return apiRequest<FlashcardSet[]>(url, { method: 'GET' });
}

/**
 * Get a specific flashcard set by ID
 * Backend: GET /api/v1/flashcards/{id}
 */
export async function getFlashcardSet(id: string): Promise<FlashcardSet> {
    const url = `${process.env.API_BASE_URL}/api/v1/flashcards/${id}`;
    return apiRequest<FlashcardSet>(url, { method: 'GET' });
}

/**
 * Delete a flashcard set by ID
 * Backend: DELETE /api/v1/flashcards/{id}
 */
export async function deleteFlashcardSet(id: string): Promise<{ message: string }> {
    const url = `${process.env.API_BASE_URL}/api/v1/flashcards/${id}`;
    return apiRequest<{ message: string }>(url, { method: 'DELETE' });
}
