/**
 * Syllabus Service API
 * Fetches syllabus data from the backend (RAG-parsed data)
 */

import { apiRequest } from '../utils/api';
import { getCachedSyllabus, setCachedSyllabus } from './cacheService';

// Types
export interface SyllabusSubject {
    name: string;
    code: string;
    credits: number;
}

export interface SyllabusModule {
    module_number: number;
    title: string;
    topics: string[];
    hours: number;
}

export interface SubjectSyllabus {
    subject_name: string;
    subject_code: string;
    credits: number;
    modules: SyllabusModule[];
    course_outcomes?: string[];
    textbooks?: string[];
    references?: string[];
}

export interface BranchInfo {
    code: string;
    name: string;
}

/**
 * Get available branches
 */
export async function getBranches(): Promise<BranchInfo[]> {
    const url = `${process.env.API_BASE_URL}/api/v1/syllabus/branches`;
    return apiRequest<BranchInfo[]>(url, { method: 'GET' });
}

/**
 * Get subjects for a specific branch and semester (cached 24h)
 */
export async function getSubjects(
    branch: string,
    semester: string
): Promise<SyllabusSubject[]> {
    // Cache-first
    const cached = await getCachedSyllabus(branch, semester);
    if (cached) return cached as SyllabusSubject[];

    const url = `${process.env.API_BASE_URL}/api/v1/syllabus/subjects?branch=${branch}&semester=${semester}`;
    const data = await apiRequest<SyllabusSubject[]>(url, { method: 'GET' });
    await setCachedSyllabus(branch, semester, data);
    return data;
}

/**
 * Get detailed syllabus for a specific subject
 * Backend: GET /api/v1/syllabus/subject/{subjectCode}
 *
 * @param subjectCode - Subject code (e.g., 'CSE201')
 * @returns Detailed syllabus with modules, outcomes, etc.
 */
export async function getSubjectSyllabus(
    subjectCode: string
): Promise<SubjectSyllabus> {
    const url = `${process.env.API_BASE_URL}/api/v1/syllabus/subject/${subjectCode}`;
    console.log('📖 Fetching syllabus for', subjectCode);

    return apiRequest<SubjectSyllabus>(url, {
        method: 'GET',
    });
}
