/**
 * Ticklist Service API
 * Handles AI generation of study checklists
 */

import { apiRequest } from '../utils/api';
import { getSubjectSyllabus } from './syllabusService';

export interface ChecklistItem {
    id: string;
    title: string;
    completed: boolean;
}

/**
 * Generate a checklist for a specific module of a subject.
 * First tries to fetch from the official syllabus database.
 * If not found, calls the AI generation endpoint.
 * 
 * @param subjectCode - The code of the subject (e.g., 'CST 201')
 * @param subjectName - The name of the subject (used as fallback for AI)
 * @param moduleNumber - The module number (1-6)
 * @returns Array of strings representing topics/checklist items
 */
export async function generateChecklist(
    subjectCode: string,
    subjectName: string,
    moduleNumber: number
): Promise<string[]> {
    try {
        // 1. Try to fetch from Syllabus DB first
        const syllabus = await getSubjectSyllabus(subjectCode);
        if (syllabus && syllabus.modules) {
            const moduleData = syllabus.modules.find(m => m.module_number === moduleNumber);
            if (moduleData && moduleData.topics && moduleData.topics.length > 0) {
                console.log(`✅ Found syllabus topics for ${subjectCode} Module ${moduleNumber}`);
                return moduleData.topics;
            }
        }
    } catch (err) {
        console.warn('Could not fetch syllabus for checklist, falling back to AI:', err);
    }

    // 2. Fallback to AI Generation
    const url = `${process.env.API_BASE_URL}/api/v1/ticklist/generate`;
    console.log(`🤖 Generating AI checklist for ${subjectName} Module ${moduleNumber}`);
    
    return apiRequest<string[]>(url, {
        method: 'POST',
        body: JSON.stringify({ 
            subject_code: subjectCode,
            subject_name: subjectName,
            module_number: moduleNumber 
        }),
    });
}
