import { UserProfile, UserSettings } from '../types/game';

const PROFILE_KEY = 'iraqi_millionaire_profile_v2';
const SETTINGS_KEY = 'iraqi_millionaire_settings_v3';

export function getTodayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const DEFAULT_PROFILE: UserProfile = {
  name: 'ضيف العراق',
  governorate: 'بغداد',
  emblem: 'palm',
  coins: 200,
  totalPoints: 0,
  bestPrize: 0,
  gamesPlayed: 0,
  totalCorrect: 0,
  totalAdsWatched: 0,
  dailyAdsWatched: 0,
  lastAdDate: '',
  lastDailyBonusDate: '',
};

export const DEFAULT_SETTINGS: UserSettings = {
  soundEnabled: true,
  musicEnabled: true,
  answerStyle: 'instant',
};

export function loadProfile(): UserProfile {
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    const today = getTodayKey();
    const isSameDay = parsed.lastAdDate === today;

    const safeTotalCorrect =
      typeof parsed.totalCorrect === 'number' && parsed.totalCorrect >= 0
        ? Math.floor(parsed.totalCorrect)
        : 0;

    const safeTotalPoints =
      typeof parsed.totalPoints === 'number' &&
      Number.isFinite(parsed.totalPoints) &&
      parsed.totalPoints >= 0
        ? Math.floor(parsed.totalPoints)
        : safeTotalCorrect * 10;

    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      name:
        typeof parsed.name === 'string' && parsed.name.trim().length > 0
          ? parsed.name.trim().slice(0, 28)
          : DEFAULT_PROFILE.name,
      coins:
        typeof parsed.coins === 'number' &&
        Number.isFinite(parsed.coins) &&
        parsed.coins >= 0
          ? Math.floor(parsed.coins)
          : DEFAULT_PROFILE.coins,
      totalPoints: safeTotalPoints,
      bestPrize:
        typeof parsed.bestPrize === 'number' && parsed.bestPrize >= 0
          ? parsed.bestPrize
          : 0,
      gamesPlayed:
        typeof parsed.gamesPlayed === 'number' && parsed.gamesPlayed >= 0
          ? parsed.gamesPlayed
          : 0,
      totalCorrect: safeTotalCorrect,
      totalAdsWatched:
        typeof parsed.totalAdsWatched === 'number' && parsed.totalAdsWatched >= 0
          ? parsed.totalAdsWatched
          : 0,
      dailyAdsWatched:
        isSameDay && typeof parsed.dailyAdsWatched === 'number'
          ? parsed.dailyAdsWatched
          : 0,
      lastAdDate: isSameDay ? today : '',
      lastDailyBonusDate:
        typeof parsed.lastDailyBonusDate === 'string'
          ? parsed.lastDailyBonusDate
          : '',
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile: UserProfile): void {
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadSettings(): UserSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<UserSettings>;

    const answerStyle =
      parsed.answerStyle === 'instant' || parsed.answerStyle === 'confirm'
        ? parsed.answerStyle
        : DEFAULT_SETTINGS.answerStyle;

    return {
      soundEnabled:
        typeof parsed.soundEnabled === 'boolean'
          ? parsed.soundEnabled
          : DEFAULT_SETTINGS.soundEnabled,
      musicEnabled:
        typeof parsed.musicEnabled === 'boolean'
          ? parsed.musicEnabled
          : DEFAULT_SETTINGS.musicEnabled,
      answerStyle,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: UserSettings): void {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}
