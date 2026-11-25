import { useEffect, useState } from 'react';
import { IRAQI_QUESTIONS } from '../data/questions';

const OFFLINE_CACHE_KEY = 'iraqi_millionaire_offline_bank_v1';

/**
 * Safely checks whether the device currently has network connectivity.
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine !== false;
}

/**
 * Persists a verified offline copy of all local questions, proverbs, and wisdom
 * inside device LocalStorage so full gameplay works seamlessly with zero internet.
 */
export function ensureOfflineDataCached(): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const expectedVersion = `v1-${IRAQI_QUESTIONS.length}`;
    const existingRaw = window.localStorage.getItem(OFFLINE_CACHE_KEY);
    if (existingRaw) {
      const existing = JSON.parse(existingRaw) as { version?: string };
      if (existing.version === expectedVersion) return;
    }

    const payload = {
      version: expectedVersion,
      updatedAt: new Date().toISOString(),
      totalQuestions: IRAQI_QUESTIONS.length,
      proverbsCount: IRAQI_QUESTIONS.filter((q) => q.domain === 'proverbs')
        .length,
      items: IRAQI_QUESTIONS,
    };
    window.localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // App still runs directly from bundled local IRAQI_QUESTIONS if storage is full
  }
}

/**
 * React hook that tracks browser/device online/offline transitions reactively.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(() => isOnline());

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
}
