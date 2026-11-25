import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  InterstitialAdPluginEvents,
  RewardAdPluginEvents,
} from '@capacitor-community/admob';
import { TEST_MODE } from './config';
import { isOnline } from './offline';

export type BannerPlacement = 'home' | 'game' | 'proverbs' | 'rewards' | 'result';

export interface AdMobConfig {
  appId: string;
  bannerId: string;
  interstitialId: string;
  rewardedId: string;
  isTesting: boolean;
  isNativePlatform: boolean;
}

export interface AdMetrics {
  bannerImpressions: number;
  interstitialImpressions: number;
  rewardedImpressions: number;
}

// Official Google AdMob Android Test IDs
export const GOOGLE_TEST_IDS = {
  appId: 'ca-app-pub-3940256099942544~3347511713',
  bannerId: 'ca-app-pub-3940256099942544/6300978111',
  interstitialId: 'ca-app-pub-3940256099942544/1033173712',
  rewardedId: 'ca-app-pub-3940256099942544/5224354917',
} as const;

const AD_METRICS_KEY = 'iraqi_millionaire_admob_metrics_v1';

// In TEST_MODE always use Google's official Android test IDs;
// in production use environment variables (with safe fallback if unset).
const isTestingMode =
  TEST_MODE || (import.meta.env.VITE_ADMOB_TESTING ?? 'false') === 'true';

export const ADMOB_CONFIG: AdMobConfig = {
  appId: TEST_MODE
    ? GOOGLE_TEST_IDS.appId
    : (import.meta.env.VITE_ADMOB_APP_ID || '').trim() || GOOGLE_TEST_IDS.appId,
  bannerId: TEST_MODE
    ? GOOGLE_TEST_IDS.bannerId
    : (import.meta.env.VITE_ADMOB_BANNER_ID || '').trim() ||
      GOOGLE_TEST_IDS.bannerId,
  interstitialId: TEST_MODE
    ? GOOGLE_TEST_IDS.interstitialId
    : (import.meta.env.VITE_ADMOB_INTERSTITIAL_ID || '').trim() ||
      GOOGLE_TEST_IDS.interstitialId,
  rewardedId: TEST_MODE
    ? GOOGLE_TEST_IDS.rewardedId
    : (import.meta.env.VITE_ADMOB_REWARDED_ID || '').trim() ||
      GOOGLE_TEST_IDS.rewardedId,
  isTesting: isTestingMode,
  isNativePlatform: Capacitor.isNativePlatform(),
};

let admobInitialized = false;
let interstitialLoaded = false;
let interstitialLoadingPromise: Promise<boolean> | null = null;

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallbackValue: T
): Promise<T> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(fallbackValue);
      }
    }, timeoutMs);

    promise
      .then((value) => {
        if (!settled) {
          settled = true;
          window.clearTimeout(timer);
          resolve(value);
        }
      })
      .catch(() => {
        if (!settled) {
          settled = true;
          window.clearTimeout(timer);
          resolve(fallbackValue);
        }
      });
  });
}

export function loadAdMetrics(): AdMetrics {
  try {
    const raw = window.localStorage.getItem(AD_METRICS_KEY);
    if (!raw) {
      return {
        bannerImpressions: 0,
        interstitialImpressions: 0,
        rewardedImpressions: 0,
      };
    }
    const parsed = JSON.parse(raw) as Partial<AdMetrics>;
    return {
      bannerImpressions: Number(parsed.bannerImpressions) || 0,
      interstitialImpressions: Number(parsed.interstitialImpressions) || 0,
      rewardedImpressions: Number(parsed.rewardedImpressions) || 0,
    };
  } catch {
    return {
      bannerImpressions: 0,
      interstitialImpressions: 0,
      rewardedImpressions: 0,
    };
  }
}

export function recordAdImpression(
  kind: 'banner' | 'interstitial' | 'rewarded'
): AdMetrics {
  const current = loadAdMetrics();
  const next: AdMetrics = {
    bannerImpressions:
      current.bannerImpressions + (kind === 'banner' ? 1 : 0),
    interstitialImpressions:
      current.interstitialImpressions + (kind === 'interstitial' ? 1 : 0),
    rewardedImpressions:
      current.rewardedImpressions + (kind === 'rewarded' ? 1 : 0),
  };
  try {
    window.localStorage.setItem(AD_METRICS_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
  return next;
}

/**
 * Preloads the next full-screen AdMob Interstitial ad in the background
 * so it can appear immediately without delay. Safe against network errors.
 */
export async function preloadInterstitial(): Promise<boolean> {
  if (!ADMOB_CONFIG.isNativePlatform || !isOnline()) return false;
  if (interstitialLoaded) return true;
  if (interstitialLoadingPromise) return interstitialLoadingPromise;

  interstitialLoadingPromise = (async () => {
    try {
      if (!admobInitialized) {
        await AdMob.initialize({
          initializeForTesting: ADMOB_CONFIG.isTesting,
        });
        admobInitialized = true;
      }

      const ok = await withTimeout(
        AdMob.prepareInterstitial({
          adId: ADMOB_CONFIG.interstitialId,
          isTesting: ADMOB_CONFIG.isTesting,
        }).then(() => true),
        8000,
        false
      );

      interstitialLoaded = ok;
      return ok;
    } catch {
      interstitialLoaded = false;
      return false;
    } finally {
      interstitialLoadingPromise = null;
    }
  })();

  return interstitialLoadingPromise;
}

/**
 * Initializes @capacitor-community/admob when running on native Android/iOS
 * and preloads Interstitial & Rewarded ads in the background.
 */
export async function initAdMob(): Promise<void> {
  if (!ADMOB_CONFIG.isNativePlatform || admobInitialized || !isOnline()) return;

  try {
    await AdMob.initialize({
      initializeForTesting: ADMOB_CONFIG.isTesting,
    });
    admobInitialized = true;

    // Preload interstitial and rewarded ads silently in the background
    preloadInterstitial().catch(() => {});

    AdMob.prepareRewardVideoAd({
      adId: ADMOB_CONFIG.rewardedId,
      isTesting: ADMOB_CONFIG.isTesting,
    }).catch(() => {});
  } catch {
    // Never block app startup if AdMob fails to initialize
  }
}

/**
 * Displays a native adaptive Google AdMob Banner at the bottom of the screen.
 */
export async function showAdMobBanner(): Promise<boolean> {
  if (!ADMOB_CONFIG.isNativePlatform || !isOnline()) return false;
  try {
    if (!admobInitialized) await initAdMob();
    await AdMob.showBanner({
      adId: ADMOB_CONFIG.bannerId,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: ADMOB_CONFIG.isTesting,
    });
    recordAdImpression('banner');
    return true;
  } catch {
    return false;
  }
}

/**
 * Hides/removes the active native Google AdMob Banner.
 */
export async function hideAdMobBanner(): Promise<void> {
  if (!ADMOB_CONFIG.isNativePlatform) return;
  try {
    await AdMob.hideBanner();
  } catch {
    // Ignore if no banner is currently active
  }
}

/**
 * Shows a preloaded native Google AdMob Interstitial Ad via @capacitor-community/admob.
 * Guaranteed fail-safe: if offline, slow to load, or failed to show, it immediately
 * invokes `onAfterAd` so the app never hangs, and re-preloads in the background.
 */
export async function showAdMobInterstitial(
  onAfterAd: () => void
): Promise<boolean> {
  if (!ADMOB_CONFIG.isNativePlatform) return false;
  if (!isOnline() && !interstitialLoaded) {
    onAfterAd();
    return false;
  }

  let finished = false;
  let dismissHandle: { remove: () => Promise<void> } | null = null;
  let failShowHandle: { remove: () => Promise<void> } | null = null;
  let failLoadHandle: { remove: () => Promise<void> } | null = null;
  let safetyTimer: number | null = null;

  const cleanup = () => {
    if (safetyTimer !== null) {
      window.clearTimeout(safetyTimer);
      safetyTimer = null;
    }
    dismissHandle?.remove().catch(() => {});
    failShowHandle?.remove().catch(() => {});
    failLoadHandle?.remove().catch(() => {});
    dismissHandle = null;
    failShowHandle = null;
    failLoadHandle = null;
  };

  const finishOnce = () => {
    if (finished) return;
    finished = true;
    cleanup();
    onAfterAd();
    // Immediately preload the next interstitial in the background
    preloadInterstitial().catch(() => {});
  };

  try {
    // If not already preloaded, wait briefly (max 2.5s) before gracefully skipping
    const ready = interstitialLoaded
      ? true
      : await withTimeout(preloadInterstitial(), 2500, false);

    if (!ready) {
      finishOnce();
      return false;
    }

    dismissHandle = await AdMob.addListener(
      InterstitialAdPluginEvents.Dismissed,
      finishOnce
    );
    failShowHandle = await AdMob.addListener(
      InterstitialAdPluginEvents.FailedToShow,
      finishOnce
    );
    failLoadHandle = await AdMob.addListener(
      InterstitialAdPluginEvents.FailedToLoad,
      finishOnce
    );

    // Mark consumed before showing so next preload fetches a fresh ad
    interstitialLoaded = false;

    // Ultimate non-blocking safety guard in case OS closes ad without firing event
    safetyTimer = window.setTimeout(finishOnce, 30000);

    await AdMob.showInterstitial();
    recordAdImpression('interstitial');
    return true;
  } catch {
    interstitialLoaded = false;
    finishOnce();
    return false;
  }
}

/**
 * Displays a native Google AdMob Rewarded Video Ad via @capacitor-community/admob.
 * Returns true if handled natively, or false in web browser preview so the fallback modal displays.
 */
export async function showAdMobRewarded(
  onRewardGranted: () => void,
  onDismissed?: () => void
): Promise<boolean> {
  if (!ADMOB_CONFIG.isNativePlatform || !isOnline()) return false;

  try {
    if (!admobInitialized) await initAdMob();
    await AdMob.prepareRewardVideoAd({
      adId: ADMOB_CONFIG.rewardedId,
      isTesting: ADMOB_CONFIG.isTesting,
    });

    let earned = false;
    const rewardHandle = await AdMob.addListener(
      RewardAdPluginEvents.Rewarded,
      () => {
        if (!earned) {
          earned = true;
          recordAdImpression('rewarded');
          onRewardGranted();
        }
      }
    );

    const dismissHandle = await AdMob.addListener(
      RewardAdPluginEvents.Dismissed,
      () => {
        rewardHandle.remove().catch(() => {});
        dismissHandle.remove().catch(() => {});
        if (!earned) {
          onDismissed?.();
        }
      }
    );

    await AdMob.showRewardVideoAd();
    return true;
  } catch {
    return false;
  }
}
