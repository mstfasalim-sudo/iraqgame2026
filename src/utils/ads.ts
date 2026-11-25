import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  InterstitialAdPluginEvents,
  RewardAdPluginEvents,
} from '@capacitor-community/admob';

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

// Official Google AdMob Android Test IDs used as safe defaults
const GOOGLE_TEST_IDS = {
  appId: 'ca-app-pub-3940256099942544~3347511713',
  bannerId: 'ca-app-pub-3940256099942544/6300978111',
  interstitialId: 'ca-app-pub-3940256099942544/1033173712',
  rewardedId: 'ca-app-pub-3940256099942544/5224354917',
} as const;

const AD_METRICS_KEY = 'iraqi_millionaire_admob_metrics_v1';

export const ADMOB_CONFIG: AdMobConfig = {
  appId: (import.meta.env.VITE_ADMOB_APP_ID || '').trim() || GOOGLE_TEST_IDS.appId,
  bannerId:
    (import.meta.env.VITE_ADMOB_BANNER_ID || '').trim() ||
    GOOGLE_TEST_IDS.bannerId,
  interstitialId:
    (import.meta.env.VITE_ADMOB_INTERSTITIAL_ID || '').trim() ||
    GOOGLE_TEST_IDS.interstitialId,
  rewardedId:
    (import.meta.env.VITE_ADMOB_REWARDED_ID || '').trim() ||
    GOOGLE_TEST_IDS.rewardedId,
  isTesting: (import.meta.env.VITE_ADMOB_TESTING ?? 'true') !== 'false',
  isNativePlatform: Capacitor.isNativePlatform(),
};

let admobInitialized = false;

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
 * Initializes @capacitor-community/admob when running on native Android/iOS.
 * Safely skips native bridge calls when previewing in a standard web browser.
 */
export async function initAdMob(): Promise<void> {
  if (!ADMOB_CONFIG.isNativePlatform || admobInitialized) return;

  try {
    await AdMob.initialize({
      initializeForTesting: ADMOB_CONFIG.isTesting,
    });
    admobInitialized = true;

    // Preload interstitial and rewarded ads in the background
    AdMob.prepareInterstitial({
      adId: ADMOB_CONFIG.interstitialId,
      isTesting: ADMOB_CONFIG.isTesting,
    }).catch(() => {});

    AdMob.prepareRewardVideoAd({
      adId: ADMOB_CONFIG.rewardedId,
      isTesting: ADMOB_CONFIG.isTesting,
    }).catch(() => {});
  } catch {
    // Ignore initialization failure on unsupported runtimes
  }
}

/**
 * Displays a native adaptive Google AdMob Banner at the bottom of the screen.
 */
export async function showAdMobBanner(): Promise<boolean> {
  if (!ADMOB_CONFIG.isNativePlatform) return false;
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
 * Displays a native Google AdMob Interstitial Ad via @capacitor-community/admob.
 * Returns true if handled natively, or false in web browser preview so the fallback modal displays.
 */
export async function showAdMobInterstitial(
  onAfterAd: () => void
): Promise<boolean> {
  if (!ADMOB_CONFIG.isNativePlatform) return false;

  try {
    if (!admobInitialized) await initAdMob();
    await AdMob.prepareInterstitial({
      adId: ADMOB_CONFIG.interstitialId,
      isTesting: ADMOB_CONFIG.isTesting,
    });

    const dismissHandle = await AdMob.addListener(
      InterstitialAdPluginEvents.Dismissed,
      () => {
        dismissHandle.remove().catch(() => {});
        onAfterAd();
      }
    );

    await AdMob.showInterstitial();
    recordAdImpression('interstitial');
    return true;
  } catch {
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
  if (!ADMOB_CONFIG.isNativePlatform) return false;

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
