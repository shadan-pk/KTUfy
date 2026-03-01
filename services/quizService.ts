/**
 * Quiz Service API
 * Generates topic-oriented quiz questions via the backend LLM
 */

import { apiRequest } from '../utils/api';

// Types
export interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
}

export interface GenerateQuizRequest {
    topic: string;
    count?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    force_regenerate?: boolean;
}

export interface GenerateQuizResponse {
    id: string;
    topic: string;
    questions: QuizQuestion[];
    cached: boolean;
    created_at: string;
}

/**
 * Generate quiz questions for a given topic using AI/LLM
 * Backend: POST /api/v1/learning/quiz/generate
 *
 * The backend caches results. Use `forceRegenerate: true` to bypass cache.
 *
 * @param topic - The topic to generate questions for
 * @param count - Number of questions (default: 5)
 * @param difficulty - Question difficulty level
 * @param forceRegenerate - If true, bypasses the cache
 * @returns Generated quiz questions
 */
export async function generateQuiz(
    topic: string,
    count: number = 5,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    forceRegenerate: boolean = false
): Promise<GenerateQuizResponse> {
    const url = `${process.env.API_BASE_URL}/api/v1/learning/quiz/generate`;
    console.log('🧠 Generating quiz for topic:', topic, forceRegenerate ? '(force)' : '');

    return apiRequest<GenerateQuizResponse>(url, {
        method: 'POST',
        body: JSON.stringify({ topic, count, difficulty, force_regenerate: forceRegenerate }),
    });
}

/**
 * List all saved quiz/match sets (optionally filtered by type)
 * Backend: GET /api/v1/learning/quiz/?type=quiz|match|all
 */
export async function listLearningSets(type: 'quiz' | 'match' | 'all' = 'all'): Promise<any[]> {
    const url = `${process.env.API_BASE_URL}/api/v1/learning/quiz/?type=${type}`;
    return apiRequest<any[]>(url, { method: 'GET' });
}

/**
 * Get a specific quiz/match set by ID
 * Backend: GET /api/v1/learning/quiz/{id}
 */
export async function getLearningSet(id: string): Promise<any> {
    const url = `${process.env.API_BASE_URL}/api/v1/learning/quiz/${id}`;
    return apiRequest<any>(url, { method: 'GET' });
}

/**
 * Delete a quiz/match set by ID
 * Backend: DELETE /api/v1/learning/quiz/{id}
 */
export async function deleteLearningSet(id: string): Promise<{ message: string }> {
    const url = `${process.env.API_BASE_URL}/api/v1/learning/quiz/${id}`;
    return apiRequest<{ message: string }>(url, { method: 'DELETE' });
}

/**
 * Search quiz sets by topic
 * Backend: GET /api/v1/learning/quiz/search?q=topic
 */
export async function searchQuizSets(query: string): Promise<any[]> {
    const url = `${process.env.API_BASE_URL}/api/v1/learning/quiz/search?q=${encodeURIComponent(query)}`;
    return apiRequest<any[]>(url, { method: 'GET' });
}

// Match the Following types
export interface MatchPair {
    term: string;
    definition: string;
}

export interface GenerateMatchResponse {
    id: string;
    topic: string;
    pairs: MatchPair[];
    cached: boolean;
    created_at: string;
}

/**
 * Generate match-the-following pairs for a given topic
 * Backend: POST /api/v1/learning/match/generate
 *
 * The backend caches results. Use `forceRegenerate: true` to bypass cache.
 */
export async function generateMatchPairs(
    topic: string,
    count: number = 6,
    forceRegenerate: boolean = false
): Promise<GenerateMatchResponse> {
    const url = `${process.env.API_BASE_URL}/api/v1/learning/match/generate`;
    console.log('🔗 Generating match pairs for topic:', topic, forceRegenerate ? '(force)' : '');

    return apiRequest<GenerateMatchResponse>(url, {
        method: 'POST',
        body: JSON.stringify({ topic, count, force_regenerate: forceRegenerate }),
    });
}
