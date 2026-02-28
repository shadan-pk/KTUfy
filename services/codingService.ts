/**
 * Coding Service API
 * Handles code execution via Judge0 API (free tier)
 */

import { apiRequest } from '../utils/api';

// Judge0 language IDs
export const LANGUAGE_IDS: { [key: string]: number } = {
    python: 71,   // Python 3.8.1
    c: 50,        // C (GCC 9.2.0)
    cpp: 54,      // C++ (GCC 9.2.0)
    java: 62,     // Java (OpenJDK 13.0.1)
};

// Types
export interface CodeSubmission {
    source_code: string;
    language_id: number;
    stdin?: string;
    expected_output?: string;
}

export interface CodeResult {
    stdout: string | null;
    stderr: string | null;
    compile_output: string | null;
    status: {
        id: number;
        description: string;
    };
    time: string | null;
    memory: number | null;
}

// Judge0 free API endpoint
const JUDGE0_API = 'https://judge0-ce.p.rapidapi.com';

// For the free hosted instance (no API key needed):
const JUDGE0_FREE_API = 'https://ce.judge0.com';

/**
 * Execute code via the backend (preferred, if available)
 * Backend: POST /api/v1/coding/execute
 *
 * @param code - Source code to execute
 * @param language - Programming language
 * @param stdin - Optional standard input
 * @returns Execution result
 */
export async function executeCodeViaBackend(
    code: string,
    language: string,
    stdin?: string
): Promise<CodeResult> {
    const url = `${process.env.API_BASE_URL}/api/v1/coding/execute`;
    console.log('💻 Executing code via backend:', language);

    return apiRequest<CodeResult>(url, {
        method: 'POST',
        body: JSON.stringify({
            source_code: code,
            language,
            stdin,
        }),
    });
}

/**
 * Execute code via Judge0 free API (fallback)
 * Uses the free hosted Judge0 CE instance
 *
 * @param code - Source code to execute
 * @param language - Programming language key (python, c, cpp, java)
 * @param stdin - Optional standard input
 * @returns Execution result
 */
export async function executeCodeViaJudge0(
    code: string,
    language: string,
    stdin?: string
): Promise<CodeResult> {
    const languageId = LANGUAGE_IDS[language];
    if (!languageId) {
        throw new Error(`Unsupported language: ${language}`);
    }

    console.log('💻 Executing code via Judge0:', language, 'langId:', languageId);

    // Submit code
    const submission: CodeSubmission = {
        source_code: code,
        language_id: languageId,
        stdin,
    };

    const submitResponse = await fetch(`${JUDGE0_FREE_API}/submissions?base64_encoded=false&wait=true`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission),
    });

    if (!submitResponse.ok) {
        const errorText = await submitResponse.text();
        throw new Error(`Judge0 API Error: ${submitResponse.status} — ${errorText}`);
    }

    const result = await submitResponse.json();

    return {
        stdout: result.stdout || null,
        stderr: result.stderr || null,
        compile_output: result.compile_output || null,
        status: result.status || { id: 0, description: 'Unknown' },
        time: result.time || null,
        memory: result.memory || null,
    };
}

/**
 * Execute code — tries backend first, falls back to Judge0
 */
export async function executeCode(
    code: string,
    language: string,
    stdin?: string
): Promise<CodeResult> {
    try {
        // Try backend first
        return await executeCodeViaBackend(code, language, stdin);
    } catch (error) {
        console.log('Backend code execution unavailable, falling back to Judge0');
        // Fallback to Judge0
        return await executeCodeViaJudge0(code, language, stdin);
    }
}
