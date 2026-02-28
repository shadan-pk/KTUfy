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
}

export interface GenerateFlashcardsResponse {
    flashcards: Flashcard[];
    topic: string;
}

/**
 * Generate flashcards for a given topic using AI
 * Backend: POST /api/v1/flashcards/generate
 *
 * @param topic - The topic to generate flashcards for
 * @param count - Optional number of flashcards to generate (default: 10)
 * @returns Generated flashcards and the topic
 */
export async function generateFlashcards(
    topic: string,
    count: number = 10
): Promise<GenerateFlashcardsResponse> {
    const url = `${process.env.API_BASE_URL}/api/v1/flashcards/generate`;
    console.log('🎴 Generating flashcards for topic:', topic);

    return apiRequest<GenerateFlashcardsResponse>(url, {
        method: 'POST',
        body: JSON.stringify({ topic, count }),
    });
}
