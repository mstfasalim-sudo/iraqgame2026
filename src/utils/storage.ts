import { DeveloperInfo, UserProfile, UserSettings } from '../types/game';

const PROFILE_KEY = 'iraqi_millionaire_profile_v2';
const SETTINGS_KEY = 'iraqi_millionaire_settings_v3';
const DEVELOPER_KEY = 'iraqi_millionaire_developer_v1';

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

export const DEFAULT_DEVELOPER_INFO: DeveloperInfo = {
  name: 'فريق تطوير المليون العراقي',
  role: 'تطوير وتصميم التطبيقات الثقافية والألعاب العراقية',
  email: 'contact@iraqimillion.app',
  website: 'https://iraqimillion.app',
  bio: 'تطبيق مسابقات عراقي مجاني يهدف لإحياء الأمثال الشعبية البغدادية وتراث وتاريخ العراق بأسلوب تفاعلي ممتع لجميع الأعمار.',
  version: '2.1',
};

export function loadProfile(): UserProfile {
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    const today = getTodayKey();
    const isSameDay = parsed.lastAdDate === today;

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
      bestPrize:
        typeof parsed.bestPrize === 'number' && parsed.bestPrize >= 0
          ? parsed.bestPrize
          : 0,
      gamesPlayed:
        typeof parsed.gamesPlayed === 'number' && parsed.gamesPlayed >= 0
          ? parsed.gamesPlayed
          : 0,
      totalCorrect:
        typeof parsed.totalCorrect === 'number' && parsed.totalCorrect >= 0
          ? parsed.totalCorrect
          : 0,
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

export function loadDeveloperInfo(): DeveloperInfo {
  try {
    const raw = window.localStorage.getItem(DEVELOPER_KEY);
    if (!raw) return { ...DEFAULT_DEVELOPER_INFO };
    const parsed = JSON.parse(raw) as Partial<DeveloperInfo>;
    return {
      ...DEFAULT_DEVELOPER_INFO,
      ...parsed,
      name:
        typeof parsed.name === 'string' && parsed.name.trim()
          ? parsed.name.trim().slice(0, 60)
          : DEFAULT_DEVELOPER_INFO.name,
      role:
        typeof parsed.role === 'string' && parsed.role.trim()
          ? parsed.role.trim().slice(0, 90)
          : DEFAULT_DEVELOPER_INFO.role,
      email:
        typeof parsed.email === 'string'
          ? parsed.email.trim().slice(0, 80)
          : DEFAULT_DEVELOPER_INFO.email,
      website:
        typeof parsed.website === 'string'
          ? parsed.website.trim().slice(0, 120)
          : DEFAULT_DEVELOPER_INFO.website,
      bio:
        typeof parsed.bio === 'string' && parsed.bio.trim()
          ? parsed.bio.trim().slice(0, 260)
          : DEFAULT_DEVELOPER_INFO.bio,
    };
  } catch {
    return { ...DEFAULT_DEVELOPER_INFO };
  }
}

export function saveDeveloperInfo(info: DeveloperInfo): void {
  try {
    window.localStorage.setItem(DEVELOPER_KEY, JSON.stringify(info));
  } catch {
    // Ignore storage errors
  }
}
