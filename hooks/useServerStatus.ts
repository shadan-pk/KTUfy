import { useState, useEffect, useRef, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';

const API_BASE = process.env.API_BASE_URL;

export interface ServerStatus {
    /** Device has internet connectivity */
    hasInternet: boolean;
    /** Backend API server is reachable */
    serverOnline: boolean;
    /** Currently checking server status */
    checking: boolean;
}

/**
 * Hook that monitors internet connectivity and backend server status.
 * Checks server health every 30s when online, every 10s when offline.
 */
export function useServerStatus(): ServerStatus {
    const [hasInternet, setHasInternet] = useState(true);
    const [serverOnline, setServerOnline] = useState(false);
    const [checking, setChecking] = useState(true);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const checkServer = useCallback(async () => {
        // If no API_BASE configured, server is always "offline"
        if (!API_BASE || API_BASE === 'undefined') {
            setServerOnline(false);
            setChecking(false);
            return;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const res = await fetch(`${API_BASE}/health`, {
                method: 'GET',
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            setServerOnline(res.ok);
        } catch {
            setServerOnline(false);
        } finally {
            setChecking(false);
        }
    }, []);

    useEffect(() => {
        // Monitor internet connectivity
        const unsubscribe = NetInfo.addEventListener((state) => {
            const online = state.isConnected ?? false;
            setHasInternet(online);
            if (!online) setServerOnline(false);
        });

        // Initial check
        checkServer();

        // Poll server status
        intervalRef.current = setInterval(checkServer, 30000);

        return () => {
            unsubscribe();
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [checkServer]);

    return { hasInternet, serverOnline, checking };
}
