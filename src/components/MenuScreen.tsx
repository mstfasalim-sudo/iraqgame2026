import {
  ArrowLeft,
  BookOpen,
  Coins,
  Gift,
  PlayCircle,
  Settings,
  Trophy,
  User,
} from 'lucide-react';
import { IRAQI_QUESTIONS, PROVERBS_QUESTIONS } from '../data/questions';
import {
  AD_REWARDS,
  AppView,
  DeveloperInfo,
  GAME_MODES,
  GameMode,
  QUESTION_TIMER_SECONDS,
  UserProfile,
  UserSettings,
  formatCoins,
  formatDinar,
  getPlayerRank,
} from '../types/game';
import { soundEngine } from '../utils/sound';
import { AdBannerSlot } from './AdBannerSlot';
import { EmblemBadge } from './EmblemBadge';
import { ProfileSettingsView } from './ProfileSettingsView';
import { ProverbsArchive } from './ProverbsArchive';
import { ResilientImage } from './ResilientImage';
import { RewardsCenterView } from './RewardsCenterView';

interface MenuScreenProps {
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  profile: UserProfile;
  settings: UserSettings;
  developerInfo: DeveloperInfo;
  onUpdateProfile: (patch: Partial<UserProfile>) => void;
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
  onUpdateDeveloperInfo: (patch: Partial<DeveloperInfo>) => void;
  onResetProgress: () => void;
  onClaimDailyBonus: () => void;
  onWatchCoinsAd: () => void;
  onStartGame: (modeOverride?: GameMode) => void;
}

const STUDIO_IMG = '/src/assets/images/studio_backdrop_1795522141754.jpg';

export function MenuScreen({
  activeView,
  onChangeView,
  selectedMode,
  onSelectMode,
  profile,
  settings,
  developerInfo,
  onUpdateProfile,
  onUpdateSettings,
  onUpdateDeveloperInfo,
  onResetProgress,
  onClaimDailyBonus,
  onWatchCoinsAd,
  onStartGame,
}: MenuScreenProps) {
  const rank = getPlayerRank(profile.totalCorrect);
  const activeModeMeta =
    GAME_MODES.find((m) => m.id === selectedMode) ?? GAME_MODES[0];

  const remainingAdsToday = Math.max(
    0,
    AD_REWARDS.maxDailyAdCoins - profile.dailyAdsWatched
  );

  const navItems: { id: AppView; label: string }[] = [
    { id: 'HOME', label: 'العب' },
    { id: 'PROVERBS', label: 'ديوان الأمثال' },
    { id: 'REWARDS', label: 'المكافآت' },
    { id: 'PROFILE', label: 'ملفي وإعداداتي' },
  ];

  const handleNav = (view: AppView) => {
    soundEngine.playClick();
    onChangeView(view);
  };

  const handlePlay = (modeOverride?: GameMode) => {
    soundEngine.playClick();
    onStartGame(modeOverride);
  };

  return (
    <div className="min-h-screen bg-[#060D1F] text-[#F8F5EE] flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-[#060D1F]/92 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-3.5 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => handleNav('HOME')}
            className="font-display text-2xl font-bold text-[#F2C96B] tracking-normal whitespace-nowrap shrink-0 cursor-pointer"
          >
            المليون العراقي
          </button>

          <nav
            aria-label="التنقل الرئيسي"
            className="hidden md:flex items-center gap-7 text-sm font-medium"
          >
            {navItems.map((item) => {
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
                    active
                      ? 'text-[#F2C96B] border-b border-[#F2C96B]'
                      : 'text-[#F8F5EE]/75 hover:text-[#F8F5EE]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => handlePlay()}
              className="px-5 py-2 text-sm font-bold text-[#060D1F] bg-[#D9A441] hover:bg-[#F2C96B] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              ابدأ اللعب
            </button>
          </div>
        </div>

        {/* Compact Mobile Sub-Nav */}
        <nav
          aria-label="التنقل على الهاتف"
          className="md:hidden border-t border-white/10 px-4 py-2 flex items-center justify-around gap-2 bg-[#070F24]"
        >
          {navItems.map((item) => {
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#D9A441]/20 text-[#F2C96B]'
                    : 'text-[#F8F5EE]/70 hover:text-[#F8F5EE]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="flex-1">
        {activeView === 'PROVERBS' && (
          <ProverbsArchive onPlayProverbs={() => handlePlay('proverbs')} />
        )}

        {activeView === 'REWARDS' && (
          <RewardsCenterView
            profile={profile}
            onClaimDailyBonus={onClaimDailyBonus}
            onWatchCoinsAd={onWatchCoinsAd}
            onStartGame={() => handlePlay()}
          />
        )}

        {activeView === 'PROFILE' && (
          <ProfileSettingsView
            profile={profile}
            settings={settings}
            developerInfo={developerInfo}
            onUpdateProfile={onUpdateProfile}
            onUpdateSettings={onUpdateSettings}
            onUpdateDeveloperInfo={onUpdateDeveloperInfo}
            onResetProgress={onResetProgress}
          />
        )}

        {activeView === 'HOME' && (
          <div className="studio-spotlight py-8 lg:py-12">
            <div className="max-w-7xl mx-auto px-5 sm:px-6 space-y-8">
              {/* Compact Player Bar */}
              <div className="bg-[#0B1530]/90 border border-white/10 rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => handleNav('PROFILE')}
                  className="flex items-center gap-3 text-right hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <EmblemBadge emblem={profile.emblem} size="sm" />
                  <div>
                    <div className="text-sm font-bold text-[#F8F5EE] flex items-center gap-2">
                      <span>{profile.name}</span>
                      <span className="text-xs font-normal text-[#F2C96B]">
                        · {rank.title}
                      </span>
                    </div>
                    <div className="text-xs text-[#F8F5EE]/55">
                      محافظة {profile.governorate} · مؤقت إجباري{' '}
                      {QUESTION_TIMER_SECONDS} ثانية
                    </div>
                  </div>
                </button>

                <div className="flex flex-wrap items-center gap-5 text-sm">
                  <div className="flex items-center gap-1.5 text-[#F2C96B] font-semibold tabular-nums">
                    <Coins className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{formatCoins(profile.coins)}</span>
                  </div>

                  <div className="hidden sm:flex items-center gap-1.5 text-[#F8F5EE]/80 tabular-nums">
                    <Trophy
                      className="h-4 w-4 text-[#D9A441] shrink-0"
                      aria-hidden="true"
                    />
                    <span>الأعلى: {formatDinar(profile.bestPrize)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleNav('PROFILE')}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#F8F5EE]/75 hover:text-[#F8F5EE] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Settings className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>الإعدادات</span>
                  </button>
                </div>
              </div>

              {/* Clean, Focused Studio Hero Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
                {/* Right Column: Direct Play Controls */}
                <div className="lg:col-span-7 flex flex-col justify-between gap-7">
                  <div>
                    <div className="text-sm text-[#D9A441] flex flex-wrap items-center gap-2 mb-3">
                      <span>{IRAQI_QUESTIONS.length} سؤال ومثل عراقي</span>
                      <span aria-hidden="true">·</span>
                      <span>15 مرحلة · {QUESTION_TIMER_SECONDS} ثانية لكل سؤال</span>
                    </div>

                    <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#F8F5EE] leading-[1.2] [text-wrap:balance]">
                      من سيربح المليون في الأمثال وتراث العراق؟
                    </h1>

                    <p className="mt-4 text-base text-[#F8F5EE]/75 leading-relaxed max-w-xl">
                      اختر القسم الذي تحبه وابدأ اللعب فوراً بضغطة واحدة وسط أجواء الاستوديو التفاعلية وموسيقى التشويق وتصفيق الجمهور.
                    </p>
                  </div>

                  {/* Simplified 5-Mode Picker */}
                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <span className="block text-xs font-medium text-[#F8F5EE]/60">
                      اختر نوع الأسئلة
                    </span>
                    <div
                      className="flex flex-wrap items-center gap-2"
                      role="group"
                      aria-label="اختر نوع الأسئلة"
                    >
                      {GAME_MODES.map((mode) => {
                        const isActive = selectedMode === mode.id;
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => {
                              soundEngine.playClick();
                              onSelectMode(mode.id);
                            }}
                            className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              isActive
                                ? 'bg-[#D9A441] border-[#D9A441] text-[#060D1F] font-bold'
                                : 'bg-[#0C1734] border-white/10 text-[#F8F5EE]/80 hover:border-white/25 hover:text-[#F8F5EE]'
                            }`}
                          >
                            {mode.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-[#F8F5EE]/60">
                      {activeModeMeta.description}
                    </p>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handlePlay()}
                        className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 text-base font-bold text-[#060D1F] bg-[#D9A441] hover:bg-[#F2C96B] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <span>ابدأ المسابقة الآن</span>
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        disabled={remainingAdsToday === 0}
                        onClick={() => {
                          soundEngine.playClick();
                          onWatchCoinsAd();
                        }}
                        className={`inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold rounded-xl border transition-colors whitespace-nowrap shrink-0 ${
                          remainingAdsToday > 0
                            ? 'border-[#D9A441]/40 bg-[#0C1734] text-[#F2C96B] hover:bg-[#D9A441]/15 cursor-pointer'
                            : 'border-white/10 bg-white/5 text-[#F8F5EE]/40 cursor-not-allowed'
                        }`}
                      >
                        <PlayCircle className="h-4 w-4" aria-hidden="true" />
                        <span>
                          إعلان مكافأة (+{AD_REWARDS.bonusCoins} عملة)
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Left Column: Focal Studio Image */}
                <div className="lg:col-span-5">
                  <div className="relative h-64 sm:h-80 lg:h-full min-h-[300px] rounded-2xl overflow-hidden border border-[#D9A441]/25 bg-[#0A142E]">
                    <ResilientImage
                      src={STUDIO_IMG}
                      alt="استوديو مسابقة المليون العراقي بإضاءة ذهبية وأقواس بغدادية"
                      fallbackLabel="استوديو المليون العراقي"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#060D1F] via-[#060D1F]/30 to-transparent" />
                    <div className="absolute bottom-0 inset-x-0 p-6 space-y-1">
                      <p className="text-xs text-[#F2C96B]">الجائزة الكبرى</p>
                      <p className="font-display text-3xl sm:text-4xl font-bold text-[#F8F5EE] tabular-nums">
                        1,000,000 دينار
                      </p>
                      <p className="text-xs text-[#F8F5EE]/70 tabular-nums">
                        محطتا الأمان عند 1,000 و 32,000 دينار
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clean 3-Shortcut Action Strip */}
              <div className="pt-8 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                  type="button"
                  onClick={() => handleNav('PROVERBS')}
                  className="text-right p-5 rounded-xl bg-[#0B1530] border border-white/10 hover:border-[#D9A441]/40 transition-colors flex items-start gap-4 cursor-pointer"
                >
                  <BookOpen
                    className="h-5 w-5 text-[#D9A441] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <div className="text-base font-bold text-[#F8F5EE]">
                      ديوان الأمثال العراقية ({PROVERBS_QUESTIONS.length})
                    </div>
                    <p className="text-xs text-[#F8F5EE]/65 mt-1 leading-relaxed">
                      تصفّح وابحث في جميع الأمثال البغدادية والجنوبية والموصلية ومعانيها.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('REWARDS')}
                  className="text-right p-5 rounded-xl bg-[#0B1530] border border-white/10 hover:border-[#D9A441]/40 transition-colors flex items-start gap-4 cursor-pointer"
                >
                  <Gift
                    className="h-5 w-5 text-[#D9A441] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <div className="text-base font-bold text-[#F8F5EE]">
                      مركز مكافآت الإعلانات
                    </div>
                    <p className="text-xs text-[#F8F5EE]/65 mt-1 leading-relaxed">
                      احصل على هدية يومية وعملات ذهبية مجانية للفرصة الثانية وشحن المساعدات.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleNav('PROFILE')}
                  className="text-right p-5 rounded-xl bg-[#0B1530] border border-white/10 hover:border-[#D9A441]/40 transition-colors flex items-start gap-4 cursor-pointer"
                >
                  <User
                    className="h-5 w-5 text-[#D9A441] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <div className="text-base font-bold text-[#F8F5EE]">
                      الملف الشخصي وعن المطور
                    </div>
                    <p className="text-xs text-[#F8F5EE]/65 mt-1 leading-relaxed">
                      عدّل ملفك، وتحكّم بالموسيقى والتصفيق، واطّلع على معلومات المطور.
                    </p>
                  </div>
                </button>
              </div>

              {/* Non-Intrusive Monetizable Banner Ad Slot */}
              <AdBannerSlot placement="home" />
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 py-6 bg-[#050A18]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#F8F5EE]/50">
          <span>
            المليون العراقي · {developerInfo.name} · الإصدار{' '}
            {developerInfo.version}
          </span>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => handleNav('PROVERBS')}
              className="hover:text-[#F8F5EE] transition-colors cursor-pointer"
            >
              ديوان الأمثال
            </button>
            <button
              type="button"
              onClick={() => handleNav('REWARDS')}
              className="hover:text-[#F8F5EE] transition-colors cursor-pointer"
            >
              المكافآت
            </button>
            <button
              type="button"
              onClick={() => handleNav('PROFILE')}
              className="hover:text-[#F8F5EE] transition-colors cursor-pointer"
            >
              عن المطور والإعدادات
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
