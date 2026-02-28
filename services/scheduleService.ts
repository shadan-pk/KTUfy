/**
 * Schedule Service API
 * Fetches exam schedule data from the backend
 */

import { apiRequest } from '../utils/api';
import { getCachedSchedule, setCachedSchedule } from './cacheService';

// Types
export interface ExamEvent {
    id: string;
    date: string;
    title: string;
    type: 'holiday' | 'exam' | 'deadline' | 'event';
    description?: string;
}

/**
 * Get the exam schedule from the backend
 * Backend: GET /api/v1/schedule/exams
 *
 * @returns List of exam events
 */
export async function getExamSchedule(): Promise<ExamEvent[]> {
    // Cache-first strategy
    const cached = await getCachedSchedule();
    if (cached) return cached as ExamEvent[];

    const url = `${process.env.API_BASE_URL}/api/v1/schedule/exams`;
    const data = await apiRequest<ExamEvent[]>(url, { method: 'GET' });
    await setCachedSchedule(data);
    return data;
}

/**
 * Get upcoming events (next 30 days)
 * Backend: GET /api/v1/schedule/upcoming
 *
 * @returns List of upcoming events
 */
export async function getUpcomingEvents(): Promise<ExamEvent[]> {
    const url = `${process.env.API_BASE_URL}/api/v1/schedule/upcoming`;
    console.log('📅 Fetching upcoming events');

    return apiRequest<ExamEvent[]>(url, {
        method: 'GET',
    });
}
