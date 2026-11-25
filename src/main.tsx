import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './App.tsx';
import './index.css';
import { ensureOfflineDataCached } from './utils/offline';

// Verify & persist local question/proverb dataset inside LocalStorage for instant offline use
ensureOfflineDataCached();

// Register lightweight offline cache Service Worker for mobile web browsers
if (
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  !Capacitor.isNativePlatform() &&
  import.meta.env.PROD
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(<App />);
