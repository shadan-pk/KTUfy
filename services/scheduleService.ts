/**
 * Schedule Service API
 * Fetches exam schedule data from the backend
 */

import { apiRequest } from '../utils/api';
import {
    getCachedSchedule, setCachedSchedule,
    getCachedScheduleBySemester, setCachedScheduleBySemester,
} from './cacheService';

// Types
export interface ExamEvent {
    id: string;
    date: string;
    title: string;
    type: 'holiday' | 'exam' | 'deadline' | 'event';
    description?: string;
    subject_code?: string;   // e.g. 'CST401'
    semester?: string;       // e.g. 'S6'
    branch?: string;
}

/**
 * Get the exam schedule from the backend, optionally filtered by semester & branch.
 * Uses a semester-keyed cache when user details are available (24h TTL).
 *
 * Backend: GET /api/v1/schedule/exams?semester=S6&branch=CS
 */
export async function getExamSchedule(
    filters?: { semester?: string; branch?: string }
): Promise<ExamEvent[]> {
    const sem = filters?.semester ?? '';
    const branch = filters?.branch ?? '';

    // Use tailored cache when we have semester info
    if (sem) {
        const cached = await getCachedScheduleBySemester(sem, branch);
        if (cached) return cached as ExamEvent[];
    } else {
        const cached = await getCachedSchedule();
        if (cached) return cached as ExamEvent[];
    }

    // Build URL with query params
    const params = new URLSearchParams();
    if (sem) params.append('semester', sem);
    if (branch) params.append('branch', branch);
    const query = params.toString() ? `?${params.toString()}` : '';
    const url = `${process.env.API_BASE_URL}/api/v1/schedule/exams${query}`;

    const data = await apiRequest<ExamEvent[]>(url, { method: 'GET' });

    // Cache by semester if available, otherwise generic cache
    if (sem) {
        await setCachedScheduleBySemester(sem, branch, data);
    } else {
        await setCachedSchedule(data);
    }
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
