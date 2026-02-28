/**
 * Schedule Service
 * Fetches exam schedule directly from Supabase (exam_schedule table).
 * The backend populates the table; the app reads from it directly.
 */

import supabase from '../supabaseClient';
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
 * Fetch exam schedule directly from Supabase, optionally filtered by semester & branch.
 * Uses per-semester caching (24h TTL).
 */
export async function getExamSchedule(
    filters?: { semester?: string; branch?: string; forceRefresh?: boolean }
): Promise<ExamEvent[]> {
    const sem = filters?.semester ?? '';
    const branch = filters?.branch ?? '';
    const force = filters?.forceRefresh ?? false;

    // Cache-first strategy (skip if forceRefresh)
    if (!force) {
        if (sem) {
            const cached = await getCachedScheduleBySemester(sem, branch);
            if (cached) return cached as ExamEvent[];
        } else {
            const cached = await getCachedSchedule();
            if (cached) return cached as ExamEvent[];
        }
    }

    // Query Supabase directly
    let query = supabase
        .from('exam_schedule')
        .select('id, date, title, type, description, subject_code, semester, branch')
        .order('date', { ascending: true });

    // Include events for this semester OR global events (semester IS NULL)
    if (sem) query = query.or(`semester.eq.${sem},semester.is.null`);
    if (branch) query = query.or(`branch.eq.${branch},branch.is.null`);

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    const events = (data ?? []) as ExamEvent[];

    // Save to cache
    if (sem) {
        await setCachedScheduleBySemester(sem, branch, events);
    } else {
        await setCachedSchedule(events);
    }

    return events;
}

/**
 * Get upcoming events (next 30 days) directly from Supabase.
 */
export async function getUpcomingEvents(): Promise<ExamEvent[]> {
    const today = new Date().toISOString().split('T')[0];
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('exam_schedule')
        .select('id, date, title, type, description, subject_code, semester, branch')
        .gte('date', today)
        .lte('date', in30Days)
        .order('date', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as ExamEvent[];
}
