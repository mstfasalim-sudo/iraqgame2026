export type AppView = 'HOME' | 'PROVERBS' | 'REWARDS' | 'PROFILE';
export type GameScreen = 'HUB' | 'PLAYING' | 'RESULT';

export type GameMode =
  | 'mixed'
  | 'proverbs'
  | 'geography_history'
  | 'culture_dialect'
  | 'sports_arts';

export type QuestionCategory =
  | 'أمثال عراقية'
  | 'محافظات ومعالم'
  | 'تاريخ وحضارة'
  | 'أكلات وتراث'
  | 'لهجة وعادات'
  | 'رياضة عراقية'
  | 'أدب وشعر'
  | 'فن وموسيقى';

export type ProverbRegion =
  | 'بغدادي'
  | 'جنوبي'
  | 'موصلي وشمالي'
  | 'فرات أوسط وغربي'
  | 'عراقي عام';

export type DifficultyTier = 1 | 2 | 3; // 1 = سهل (1-5), 2 = متوسط (6-10), 3 = صعب (11-15)

export const QUESTION_TIMER_SECONDS = 25;

export interface QuizQuestion {
  id: string;
  domain: Exclude<GameMode, 'mixed'>;
  category: QuestionCategory;
  difficulty: DifficultyTier;
  question: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanation: string;
  proverbText?: string;
  region?: ProverbRegion;
}

export interface PrizeStep {
  level: number;
  amount: number;
  label: string;
  coinsReward: number;
  isSafeHaven?: boolean;
  isGrandPrize?: boolean;
}

export type LifelineKey = 'fiftyFifty' | 'audience' | 'phoneFriend' | 'swapQuestion';

export interface LifelinesState {
  fiftyFifty: boolean;
  audience: boolean;
  phoneFriend: boolean;
  swapQuestion: boolean;
}

export interface AudiencePollResult {
  percentages: [number, number, number, number];
}

export interface PhoneFriendResult {
  friendName: string;
  city: string;
  message: string;
  suggestedIndex: number;
  confidence: number;
}

export interface SessionRecord {
  question: QuizQuestion;
  selectedIndex: number | null;
  wasCorrect: boolean;
  level: number;
}

export interface GameOutcome {
  status: 'WON' | 'WITHDRAWN' | 'LOST' | 'TIMEOUT';
  finalPrize: number;
  earnedCoins: number;
  reachedLevel: number;
  correctCount: number;
  lifelinesUsedCount: number;
  history: SessionRecord[];
  mode: GameMode;
}

export type AnswerStyle = 'instant' | 'confirm';

export type AvatarEmblemId =
  | 'palm'
  | 'ziggurat'
  | 'ishtar'
  | 'dallah'
  | 'tigris'
  | 'lion';

export interface UserSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  answerStyle: AnswerStyle;
}

export interface DeveloperInfo {
  name: string;
  role: string;
  email: string;
  website: string;
  bio: string;
  version: string;
}

export interface UserProfile {
  name: string;
  governorate: string;
  emblem: AvatarEmblemId;
  coins: number;
  bestPrize: number;
  gamesPlayed: number;
  totalCorrect: number;
  totalAdsWatched: number;
  dailyAdsWatched: number;
  lastAdDate: string; // YYYY-MM-DD
  lastDailyBonusDate: string; // YYYY-MM-DD
}

export type AdRewardKind =
  | 'revive'
  | 'restore_lifeline'
  | 'bonus_coins'
  | 'double_result_coins';

export interface AdRewardRequest {
  kind: AdRewardKind;
  title: string;
  rewardLabel: string;
  lifelineKey?: LifelineKey;
  coinsAmount?: number;
  onComplete: () => void;
}

export const OPTION_LETTERS: readonly [string, string, string, string] = ['أ', 'ب', 'ج', 'د'];

export const COIN_COSTS = {
  revive: 150,
  restoreLifeline: 100,
} as const;

export const AD_REWARDS = {
  bonusCoins: 150,
  dailyCheckInCoins: 100,
  maxDailyAdCoins: 6,
} as const;

export const IRAQI_GOVERNORATES: readonly string[] = [
  'بغداد',
  'البصرة',
  'نينوى',
  'أربيل',
  'النجف الأشرف',
  'كربلاء المقدسة',
  'ذي قار',
  'بابل',
  'الأنبار',
  'ديالى',
  'صلاح الدين',
  'كركوك',
  'السليمانية',
  'دهوك',
  'واسط',
  'ميسان',
  'القادسية',
  'المثنى',
];

export const AVATAR_EMBLEMS: readonly {
  id: AvatarEmblemId;
  label: string;
  subtitle: string;
}[] = [
  { id: 'palm', label: 'نخلة العراق', subtitle: 'رمز العطاء والأصالة' },
  { id: 'ziggurat', label: 'زقورة أور', subtitle: 'إرث سومر الخالد' },
  { id: 'ishtar', label: 'بوابة عشتار', subtitle: 'مجد بابل العظيمة' },
  { id: 'dallah', label: 'دلة الضيافة', subtitle: 'كرم الديوان العراقي' },
  { id: 'tigris', label: 'موج دجلة', subtitle: 'شريان بلاد الرافدين' },
  { id: 'lion', label: 'أسد بابل', subtitle: 'رمز الشموخ والقوة' },
];

export const GAME_MODES: readonly {
  id: GameMode;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    id: 'mixed',
    label: 'التحدي الشامل',
    shortLabel: 'شامل',
    description: 'أمثال شعبية + تاريخ ومحافظات + لهجة وأكلات + رياضة وفن',
  },
  {
    id: 'proverbs',
    label: 'الأمثال العراقية',
    shortLabel: 'أمثال',
    description: 'أمثال بغدادية وجنوبية وموصلية وعراقية شاملة مع معانيها',
  },
  {
    id: 'geography_history',
    label: 'محافظات وتاريخ',
    shortLabel: 'العراق وتاريخه',
    description: 'محافظات العراق الـ 18 ومعالمها وحضارات بلاد الرافدين',
  },
  {
    id: 'culture_dialect',
    label: 'أكلات ولهجة وتراث',
    shortLabel: 'تراث ولهجة',
    description: 'الأكلات العراقية ومفردات اللهجة الشعبية والعادات الأصيلة',
  },
  {
    id: 'sports_arts',
    label: 'رياضة وفن وأدب',
    shortLabel: 'رياضة وفن',
    description: 'نجوم الكرة العراقية، الشعراء، المقام البغدادي، والفنون',
  },
];

export const PRIZE_LADDER: readonly PrizeStep[] = [
  { level: 1, amount: 100, label: '100', coinsReward: 15 },
  { level: 2, amount: 200, label: '200', coinsReward: 25 },
  { level: 3, amount: 300, label: '300', coinsReward: 35 },
  { level: 4, amount: 500, label: '500', coinsReward: 50 },
  { level: 5, amount: 1000, label: '1,000', coinsReward: 80, isSafeHaven: true },
  { level: 6, amount: 2000, label: '2,000', coinsReward: 100 },
  { level: 7, amount: 4000, label: '4,000', coinsReward: 120 },
  { level: 8, amount: 8000, label: '8,000', coinsReward: 150 },
  { level: 9, amount: 16000, label: '16,000', coinsReward: 180 },
  { level: 10, amount: 32000, label: '32,000', coinsReward: 240, isSafeHaven: true },
  { level: 11, amount: 64000, label: '64,000', coinsReward: 300 },
  { level: 12, amount: 125000, label: '125,000', coinsReward: 380 },
  { level: 13, amount: 250000, label: '250,000', coinsReward: 460 },
  { level: 14, amount: 500000, label: '500,000', coinsReward: 600 },
  { level: 15, amount: 1000000, label: '1,000,000', coinsReward: 1000, isGrandPrize: true },
];

export function formatDinar(amount: number): string {
  return `${amount.toLocaleString('en-US')} دينار`;
}

export function formatCoins(amount: number): string {
  return `${amount.toLocaleString('en-US')} عملة`;
}

export function getSafeHavenPrize(clearedLevel: number): number {
  if (clearedLevel >= 10) return 32000;
  if (clearedLevel >= 5) return 1000;
  return 0;
}

export function getCoinsForLevel(clearedLevel: number): number {
  if (clearedLevel <= 0) return 10;
  const step = PRIZE_LADDER[Math.min(clearedLevel, 15) - 1];
  return step ? step.coinsReward : 10;
}

export function getPlayerRank(totalCorrect: number): {
  title: string;
  nextTitle: string | null;
  progressPct: number;
  remainingForNext: number;
} {
  const tiers = [
    { min: 0, title: 'ضيف الاستوديو' },
    { min: 15, title: 'متسابق واعد' },
    { min: 40, title: 'عريف الديوان' },
    { min: 80, title: 'راوي بغداد' },
    { min: 140, title: 'موسوعة العراق' },
  ];

  let currentIdx = 0;
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (totalCorrect >= tiers[i].min) {
      currentIdx = i;
      break;
    }
  }

  const current = tiers[currentIdx];
  const next = tiers[currentIdx + 1] ?? null;
  if (!next) {
    return {
      title: current.title,
      nextTitle: null,
      progressPct: 100,
      remainingForNext: 0,
    };
  }

  const span = next.min - current.min;
  const gained = totalCorrect - current.min;
  return {
    title: current.title,
    nextTitle: next.title,
    progressPct: Math.min(100, Math.round((gained / span) * 100)),
    remainingForNext: Math.max(0, next.min - totalCorrect),
  };
}
