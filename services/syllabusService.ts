/**
 * Syllabus Service API
 * Fetches syllabus data from the backend (RAG-parsed data)
 */

import { apiRequest } from '../utils/api';
import { getCachedSyllabus, setCachedSyllabus, getCachedSubjectSyllabus, setCachedSubjectSyllabus } from './cacheService';

// Types
export interface SyllabusSubject {
    name: string;
    code: string;
    credits: number;
    semester?: number;
    module_count?: number;
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
    subject_count?: number;
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
 * Normalize a subject code to ensure a space between the letter prefix and numeric suffix.
 * e.g., "CST201" → "CST 201", "MAT101" → "MAT 101", "CST 201" stays "CST 201"
 */
function normalizeSubjectCode(code: string): string {
    // If there's already a space, return as-is
    if (/[A-Za-z]\s+\d/.test(code)) return code.trim();
    // Insert space between letters and digits: "CST201" → "CST 201"
    return code.replace(/([A-Za-z])(\d)/, '$1 $2').trim();
}

/**
 * Get detailed syllabus for a specific subject (cached 24h)
 * Backend: GET /api/v1/syllabus/subject/{subjectCode}
 *
 * @param subjectCode - Subject code (e.g., 'CST 201')
 * @returns Detailed syllabus with modules, outcomes, etc.
 */
export async function getSubjectSyllabus(
    subjectCode: string
): Promise<SubjectSyllabus> {
    const normalized = normalizeSubjectCode(subjectCode);
    // Cache-first
    const cached = await getCachedSubjectSyllabus(normalized);
    if (cached) {
        console.log('📖 Syllabus cache hit for', normalized);
        return cached as SubjectSyllabus;
    }

    const url = `${process.env.API_BASE_URL}/api/v1/syllabus/subject/${encodeURIComponent(normalized)}`;
    console.log('📖 Fetching syllabus for', normalized);

    const data = await apiRequest<SubjectSyllabus>(url, {
        method: 'GET',
    });

    // Cache the result
    await setCachedSubjectSyllabus(normalized, data);
    return data;
}

/**
 * Convert a SubjectSyllabus object to a plain-text string for download
 */
export function syllabusToText(syllabus: SubjectSyllabus): string {
    const lines: string[] = [];

    lines.push(`${'='.repeat(60)}`);
    lines.push(`  ${syllabus.subject_name}  (${syllabus.subject_code})`);
    lines.push(`  Credits: ${syllabus.credits}`);
    lines.push(`${'='.repeat(60)}`);
    lines.push('');

    // Modules
    if (syllabus.modules?.length) {
        for (const mod of syllabus.modules) {
            lines.push(`MODULE ${mod.module_number}: ${mod.title}  (${mod.hours} hrs)`);
            lines.push('-'.repeat(50));
            for (const topic of mod.topics) {
                lines.push(`  • ${topic}`);
            }
            lines.push('');
        }
    }

    // Course Outcomes
    if (syllabus.course_outcomes?.length) {
        lines.push('COURSE OUTCOMES');
        lines.push('-'.repeat(50));
        syllabus.course_outcomes.forEach((co, i) => {
            lines.push(`  CO${i + 1}: ${co}`);
        });
        lines.push('');
    }

    // Textbooks
    if (syllabus.textbooks?.length) {
        lines.push('TEXTBOOKS');
        lines.push('-'.repeat(50));
        syllabus.textbooks.forEach((tb, i) => {
            lines.push(`  ${i + 1}. ${tb}`);
        });
        lines.push('');
    }

    // References
    if (syllabus.references?.length) {
        lines.push('REFERENCES');
        lines.push('-'.repeat(50));
        syllabus.references.forEach((ref, i) => {
            lines.push(`  ${i + 1}. ${ref}`);
        });
        lines.push('');
    }

    return lines.join('\n');
}
