/**
 * KTUfy Local Cache Service
 *
 * Caches user profile, chat sessions, and chat history locally using
 * AsyncStorage so the app doesn't rely solely on the backend.
 *
 * Strategy:
 *   - Read from cache first, then refresh from network in background.
 *   - On write, update cache immediately, then sync to backend.
 *   - TTL-based expiry (default 30 min for profiles, 5 min for chat lists).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Cache Keys ───────────────────────────────────────────────────
const KEYS = {
    USER_PROFILE: '@KTUfy:cache:user_profile',
    CHAT_SESSIONS: '@KTUfy:cache:chat_sessions',
    CHAT_HISTORY: (sessionId: string) => `@KTUfy:cache:chat_history:${sessionId}`,
    TICKLISTS: '@KTUfy:cache:ticklists',
    SCHEDULE_EVENTS: '@KTUfy:cache:schedule_events',
    SYLLABUS: (branch: string, semester: string) => `@KTUfy:cache:syllabus:${branch}:${semester}`,
    STUDY_DASHBOARD: '@KTUfy:cache:study_dashboard',
};

// ─── TTL Values (milliseconds) ────────────────────────────────────
const TTL = {
    USER_PROFILE: 30 * 60 * 1000,   // 30 minutes
    CHAT_SESSIONS: 5 * 60 * 1000,   // 5 minutes
    CHAT_HISTORY: 10 * 60 * 1000,   // 10 minutes
    TICKLISTS: 60 * 60 * 1000,      // 60 minutes
    SCHEDULE: 6 * 60 * 60 * 1000,   // 6 hours
    SYLLABUS: 24 * 60 * 60 * 1000,  // 24 hours
    STUDY_DASHBOARD: 30 * 60 * 1000, // 30 minutes
};

// ─── Internal Helpers ─────────────────────────────────────────────
interface CachedData<T> {
    data: T;
    timestamp: number;
}

async function getCache<T>(key: string, ttl: number): Promise<T | null> {
    try {
        const raw = await AsyncStorage.getItem(key);
        if (!raw) return null;
        const cached: CachedData<T> = JSON.parse(raw);
        if (Date.now() - cached.timestamp > ttl) {
            // Expired — remove stale entry
            await AsyncStorage.removeItem(key);
            return null;
        }
        return cached.data;
    } catch (err) {
        console.warn('[Cache] Read error:', key, err);
        return null;
    }
}

async function setCache<T>(key: string, data: T): Promise<void> {
    try {
        const entry: CachedData<T> = { data, timestamp: Date.now() };
        await AsyncStorage.setItem(key, JSON.stringify(entry));
    } catch (err) {
        console.warn('[Cache] Write error:', key, err);
    }
}

async function removeCache(key: string): Promise<void> {
    try {
        await AsyncStorage.removeItem(key);
    } catch (err) {
        console.warn('[Cache] Remove error:', key, err);
    }
}

// ─── Public API ───────────────────────────────────────────────────

/**
 * User Profile
 */
export async function getCachedUserProfile(): Promise<any | null> {
    return getCache(KEYS.USER_PROFILE, TTL.USER_PROFILE);
}

export async function setCachedUserProfile(profile: any): Promise<void> {
    return setCache(KEYS.USER_PROFILE, profile);
}

export async function clearCachedUserProfile(): Promise<void> {
    return removeCache(KEYS.USER_PROFILE);
}

/**
 * Chat Sessions List
 */
export async function getCachedChatSessions(): Promise<any[] | null> {
    return getCache(KEYS.CHAT_SESSIONS, TTL.CHAT_SESSIONS);
}

export async function setCachedChatSessions(sessions: any[]): Promise<void> {
    return setCache(KEYS.CHAT_SESSIONS, sessions);
}

export async function clearCachedChatSessions(): Promise<void> {
    return removeCache(KEYS.CHAT_SESSIONS);
}

/**
 * Chat History (per session)
 */
export async function getCachedChatHistory(sessionId: string): Promise<any[] | null> {
    return getCache(KEYS.CHAT_HISTORY(sessionId), TTL.CHAT_HISTORY);
}

export async function setCachedChatHistory(sessionId: string, messages: any[]): Promise<void> {
    return setCache(KEYS.CHAT_HISTORY(sessionId), messages);
}

export async function clearCachedChatHistory(sessionId: string): Promise<void> {
    return removeCache(KEYS.CHAT_HISTORY(sessionId));
}

/**
 * Ticklists
 */
export async function getCachedTicklists(): Promise<any[] | null> {
    return getCache(KEYS.TICKLISTS, TTL.TICKLISTS);
}

export async function setCachedTicklists(ticklists: any[]): Promise<void> {
    return setCache(KEYS.TICKLISTS, ticklists);
}

/**
 * Schedule Events
 */
export async function getCachedSchedule(): Promise<any[] | null> {
    return getCache(KEYS.SCHEDULE_EVENTS, TTL.SCHEDULE);
}

export async function setCachedSchedule(events: any[]): Promise<void> {
    return setCache(KEYS.SCHEDULE_EVENTS, events);
}

/**
 * Syllabus (per branch+semester)
 */
export async function getCachedSyllabus(branch: string, semester: string): Promise<any[] | null> {
    return getCache(KEYS.SYLLABUS(branch, semester), TTL.SYLLABUS);
}

export async function setCachedSyllabus(branch: string, semester: string, subjects: any[]): Promise<void> {
    return setCache(KEYS.SYLLABUS(branch, semester), subjects);
}

/**
 * Study Dashboard
 */
export async function getCachedStudyDashboard(): Promise<any | null> {
    return getCache(KEYS.STUDY_DASHBOARD, TTL.STUDY_DASHBOARD);
}

export async function setCachedStudyDashboard(dashboard: any): Promise<void> {
    return setCache(KEYS.STUDY_DASHBOARD, dashboard);
}

/**
 * Clear all KTUfy caches
 */
export async function clearAllCaches(): Promise<void> {
    try {
        const allKeys = await AsyncStorage.getAllKeys();
        const cacheKeys = allKeys.filter(k => k.startsWith('@KTUfy:cache:'));
        if (cacheKeys.length > 0) {
            await AsyncStorage.multiRemove(cacheKeys);
        }
        console.log(`[Cache] Cleared ${cacheKeys.length} cached entries`);
    } catch (err) {
        console.warn('[Cache] Clear all error:', err);
    }
}
