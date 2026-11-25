import {
  ArrowLeft,
  Award,
  Coins,
  Info,
  Mail,
  PlayCircle,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AD_REWARDS,
  AppView,
  GAME_MODES,
  GameMode,
  UserProfile,
  UserSettings,
  formatCoins,
  formatDinar,
  formatPoints,
  getPlayerRank,
} from '../types/game';
import { DEVELOPER_INFO } from '../utils/config';
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
  onUpdateProfile: (patch: Partial<UserProfile>) => void;
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
  onResetProgress: () => void;
  onClaimDailyBonus: () => void;
  onWatchCoinsAd: () => void;
  onStartGame: (modeOverride?: GameMode) => void;
  onOpenPrivacy: () => void;
  onOpenRate: () => void;
}

const STUDIO_IMG = '/src/assets/images/studio_backdrop_1795522141754.jpg';

export function MenuScreen({
  activeView,
  onChangeView,
  selectedMode,
  onSelectMode,
  profile,
  settings,
  onUpdateProfile,
  onUpdateSettings,
  onResetProgress,
  onClaimDailyBonus,
  onWatchCoinsAd,
  onStartGame,
  onOpenPrivacy,
  onOpenRate,
}: MenuScreenProps) {
  const remainingAdsToday = Math.max(
    0,
    AD_REWARDS.maxDailyAdCoins - profile.dailyAdsWatched
  );
  const rank = getPlayerRank(profile.totalPoints);

  const navItems: { id: AppView; label: string }[] = [
    { id: 'HOME', label: 'العب' },
    { id: 'PROVERBS', label: 'الأمثال' },
    { id: 'REWARDS', label: 'المكافآت' },
    { id: 'PROFILE', label: 'ملفي' },
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
      {/* Clean 3-Zone Top Bar */}
      <header className="sticky top-0 z-30 bg-[#060D1F]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 py-3.5 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => handleNav('HOME')}
            className="font-display text-2xl font-bold text-[#F2C96B] tracking-normal whitespace-nowrap shrink-0 cursor-pointer"
          >
            المليون العراقي
          </button>

          <nav
            aria-label="التنقل الرئيسي"
            className="hidden md:flex items-center gap-8 text-base font-medium"
          >
            {navItems.map((item) => {
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1 ${
                    active
                      ? 'text-[#F2C96B] border-b-2 border-[#F2C96B] font-semibold'
                      : 'text-[#F8F5EE]/70 hover:text-[#F8F5EE]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onOpenPrivacy();
              }}
              aria-label="سياسة الخصوصية وحول التطبيق"
              title="سياسة الخصوصية وحول التطبيق"
              className="p-2.5 rounded-xl border border-white/15 bg-[#0C1734] text-[#F8F5EE]/75 hover:text-[#F2C96B] hover:border-[#D9A441]/35 cursor-pointer"
            >
              <Info className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => {
                const nextSound = !settings.soundEnabled;
                onUpdateSettings({
                  soundEnabled: nextSound,
                  musicEnabled: nextSound ? settings.musicEnabled : false,
                });
                if (nextSound) {
                  soundEngine.setEnabled(true);
                  soundEngine.playClick();
                }
              }}
              aria-label={settings.soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
              title={settings.soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
              className={`p-2.5 rounded-xl border cursor-pointer ${
                settings.soundEnabled
                  ? 'border-[#D9A441]/35 bg-[#0C1734] text-[#F2C96B] hover:bg-[#D9A441]/15'
                  : 'border-white/15 bg-[#0C1734] text-[#F8F5EE]/45 hover:text-[#F8F5EE]'
              }`}
            >
              {settings.soundEnabled ? (
                <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              ) : (
                <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handlePlay()}
              className="px-4 sm:px-6 py-2.5 text-sm sm:text-base font-bold text-[#060D1F] bg-[#D9A441] hover:bg-[#F2C96B] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              ابدأ اللعب
            </button>
          </div>
        </div>

        {/* Clean Mobile Navigation */}
        <nav
          aria-label="التنقل على الهاتف"
          className="md:hidden border-t border-white/10 px-4 py-2 grid grid-cols-4 gap-2 bg-[#070F24]"
        >
          {navItems.map((item) => {
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`py-2.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
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
        <AnimatePresence mode="wait">
          {activeView === 'PROVERBS' && (
            <motion.div
              key="view-proverbs"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
            >
              <ProverbsArchive onPlayProverbs={() => handlePlay('proverbs')} />
            </motion.div>
          )}

          {activeView === 'REWARDS' && (
            <motion.div
              key="view-rewards"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
            >
              <RewardsCenterView
                profile={profile}
                onClaimDailyBonus={onClaimDailyBonus}
                onWatchCoinsAd={onWatchCoinsAd}
                onStartGame={() => handlePlay()}
              />
            </motion.div>
          )}

          {activeView === 'PROFILE' && (
            <motion.div
              key="view-profile"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
            >
              <ProfileSettingsView
                profile={profile}
                settings={settings}
                onUpdateProfile={onUpdateProfile}
                onUpdateSettings={onUpdateSettings}
                onResetProgress={onResetProgress}
                onOpenPrivacy={onOpenPrivacy}
                onOpenRate={onOpenRate}
              />
            </motion.div>
          )}

          {activeView === 'HOME' && (
            <motion.div
              key="view-home"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
              className="studio-spotlight py-8 lg:py-12"
            >
            <div className="max-w-6xl mx-auto px-5 sm:px-6 space-y-8">
              {/* Player Identity + Iraqi Rank & Progress Card */}
              <div className="bg-[#0B1530]/90 border border-[#D9A441]/25 rounded-2xl px-4 sm:px-5 py-4 space-y-3.5 shadow-lg shadow-black/20">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleNav('PROFILE')}
                    className="flex items-center gap-3 text-right hover:opacity-90 transition-opacity cursor-pointer min-w-0"
                  >
                    <EmblemBadge emblem={profile.emblem} size="sm" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-[#F8F5EE] truncate">
                          {profile.name}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#D9A441]/15 border border-[#D9A441]/35 text-xs font-bold text-[#F2C96B] whitespace-nowrap">
                          <Award className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>{rank.title}</span>
                        </span>
                      </div>
                      <p className="text-xs text-[#F8F5EE]/60 mt-0.5 tabular-nums">
                        مجموع النقاط: <strong className="text-[#F8F5EE]/90">{formatPoints(profile.totalPoints)}</strong>
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-4 text-sm sm:text-base shrink-0">
                    <div className="flex items-center gap-1.5 text-[#F2C96B] font-bold tabular-nums">
                      <Coins className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{formatCoins(profile.coins)}</span>
                    </div>

                    <div className="hidden sm:flex items-center gap-1.5 text-[#F8F5EE]/80 font-medium tabular-nums">
                      <Trophy
                        className="h-4 w-4 text-[#D9A441] shrink-0"
                        aria-hidden="true"
                      />
                      <span>{formatDinar(profile.bestPrize)}</span>
                    </div>
                  </div>
                </div>

                {/* Elegant Iraqi Rank Progress Bar */}
                <div className="space-y-1.5 pt-1 border-t border-white/10">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#F8F5EE]/75 font-medium">
                      {rank.nextTitle ? (
                        <>
                          اللقب القادم:{' '}
                          <strong className="text-[#F2C96B]">{rank.nextTitle}</strong>
                        </>
                      ) : (
                        <strong className="text-[#F2C96B]">
                          بلغت أعلى رتبة في الديوان — شيخ العارفين
                        </strong>
                      )}
                    </span>
                    <span className="text-[#F8F5EE]/65 tabular-nums whitespace-nowrap">
                      {rank.nextTitle
                        ? `متبقي ${rank.remainingForNext} نقطة (${rank.progressPct}%)`
                        : '100%'}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-[#FFE08A] via-[#F2C96B] to-[#D9A441] transition-all duration-500 ease-in-out"
                      style={{ width: `${Math.max(4, rank.progressPct)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Clean, Spacious Hero Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
                {/* Primary Controls */}
                <div className="lg:col-span-7 flex flex-col justify-between gap-8">
                  <div className="space-y-3">
                    <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#F8F5EE] leading-[1.2] [text-wrap:balance]">
                      من سيربح المليون العراقي؟
                    </h1>
                    <p className="text-base sm:text-lg text-[#F8F5EE]/70">
                      15 مرحلة في الأمثال وتراث العراق.
                    </p>
                  </div>

                  {/* Clean Mode Selector */}
                  <div className="space-y-5">
                    <div
                      className="grid grid-cols-2 sm:grid-cols-3 gap-2.5"
                      role="group"
                      aria-label="اختر نوع المسابقة"
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
                            className={`px-4 py-3.5 text-sm sm:text-base font-semibold rounded-xl border transition-colors whitespace-nowrap cursor-pointer ${
                              isActive
                                ? 'bg-[#D9A441] border-[#D9A441] text-[#060D1F] font-bold'
                                : 'bg-[#0C1734] border-white/10 text-[#F8F5EE]/85 hover:border-white/25 hover:text-[#F8F5EE]'
                            }`}
                          >
                            {mode.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Large Primary Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handlePlay()}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-3 px-10 py-4.5 text-lg sm:text-xl font-bold text-[#060D1F] bg-[#D9A441] hover:bg-[#F2C96B] rounded-2xl transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-lg shadow-[#D9A441]/15"
                      >
                        <span>ابدأ اللعب الآن</span>
                        <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        disabled={remainingAdsToday === 0}
                        onClick={() => {
                          soundEngine.playClick();
                          onWatchCoinsAd();
                        }}
                        className={`inline-flex items-center justify-center gap-2.5 px-6 py-4.5 text-base font-semibold rounded-2xl border transition-colors whitespace-nowrap shrink-0 ${
                          remainingAdsToday > 0
                            ? 'border-[#D9A441]/40 bg-[#0C1734] text-[#F2C96B] hover:bg-[#D9A441]/15 cursor-pointer'
                            : 'border-white/10 bg-white/5 text-[#F8F5EE]/40 cursor-not-allowed'
                        }`}
                      >
                        <PlayCircle className="h-5 w-5" aria-hidden="true" />
                        <span>+{AD_REWARDS.bonusCoins} عملة</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Focal Studio Image */}
                <div className="lg:col-span-5">
                  <div className="relative h-60 sm:h-72 lg:h-full min-h-[260px] rounded-2xl overflow-hidden border border-[#D9A441]/25 bg-[#0A142E]">
                    <ResilientImage
                      src={STUDIO_IMG}
                      alt="استوديو مسابقة المليون العراقي"
                      fallbackLabel="المليون العراقي"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#060D1F] via-[#060D1F]/25 to-transparent" />
                    <div className="absolute bottom-0 inset-x-0 p-6">
                      <p className="text-sm text-[#F2C96B]">الجائزة الكبرى</p>
                      <p className="font-display text-3xl sm:text-4xl font-bold text-[#F8F5EE] tabular-nums mt-0.5">
                        1,000,000 دينار
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <AdBannerSlot placement="home" />
            </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Fixed Read-Only Developer Footer (Editable Only by App Owner in Code/Env) */}
      <footer className="border-t border-white/10 py-6 bg-[#050A18]">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#F8F5EE]/60">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="font-semibold text-[#F2C96B]">
              تطوير: {DEVELOPER_INFO.name}
            </span>
            <span aria-hidden="true">·</span>
            <span>{DEVELOPER_INFO.role}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">الإصدار {DEVELOPER_INFO.version}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {DEVELOPER_INFO.email && (
              <a
                href={`mailto:${DEVELOPER_INFO.email}`}
                className="inline-flex items-center gap-1.5 text-[#F8F5EE]/70 hover:text-[#F2C96B] transition-colors"
                dir="ltr"
              >
                <Mail className="h-3.5 w-3.5 text-[#D9A441]" aria-hidden="true" />
                <span>{DEVELOPER_INFO.email}</span>
              </a>
            )}
            {DEVELOPER_INFO.website && (
              <span className="text-[#F8F5EE]/50" dir="ltr">
                {DEVELOPER_INFO.website}
              </span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
