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
}

export interface GenerateQuizResponse {
    questions: QuizQuestion[];
    topic: string;
}

/**
 * Generate quiz questions for a given topic using AI/LLM
 * Backend: POST /api/v1/learning/quiz/generate
 *
 * @param topic - The topic to generate questions for
 * @param count - Number of questions (default: 5)
 * @param difficulty - Question difficulty level
 * @returns Generated quiz questions
 */
export async function generateQuiz(
    topic: string,
    count: number = 5,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): Promise<GenerateQuizResponse> {
    const url = `${process.env.API_BASE_URL}/api/v1/learning/quiz/generate`;
    console.log('🧠 Generating quiz for topic:', topic);

    return apiRequest<GenerateQuizResponse>(url, {
        method: 'POST',
        body: JSON.stringify({ topic, count, difficulty }),
    });
}

// Match the Following types
export interface MatchPair {
    term: string;
    definition: string;
}

export interface GenerateMatchResponse {
    pairs: MatchPair[];
    topic: string;
}

/**
 * Generate match-the-following pairs for a given topic
 * Backend: POST /api/v1/learning/match/generate
 */
export async function generateMatchPairs(
    topic: string,
    count: number = 6
): Promise<GenerateMatchResponse> {
    const url = `${process.env.API_BASE_URL}/api/v1/learning/match/generate`;
    console.log('🔗 Generating match pairs for topic:', topic);

    return apiRequest<GenerateMatchResponse>(url, {
        method: 'POST',
        body: JSON.stringify({ topic, count }),
    });
}
