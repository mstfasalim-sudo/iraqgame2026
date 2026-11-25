import { useState } from 'react';
import {
  Check,
  Code2,
  Coins,
  Megaphone,
  Music,
  RotateCcw,
  Save,
  ShieldCheck,
  Star,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  AVATAR_EMBLEMS,
  AnswerStyle,
  AvatarEmblemId,
  IRAQI_GOVERNORATES,
  UserProfile,
  UserSettings,
  formatCoins,
  formatDinar,
  formatPoints,
  getPlayerRank,
} from '../types/game';
import { ADMOB_CONFIG, loadAdMetrics } from '../utils/ads';
import { TEST_MODE } from '../utils/config';
import { soundEngine } from '../utils/sound';
import { EmblemBadge } from './EmblemBadge';

interface ProfileSettingsViewProps {
  profile: UserProfile;
  settings: UserSettings;
  onUpdateProfile: (patch: Partial<UserProfile>) => void;
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
  onResetProgress: () => void;
  onOpenPrivacy: () => void;
  onOpenRate: () => void;
}

export function ProfileSettingsView({
  profile,
  settings,
  onUpdateProfile,
  onUpdateSettings,
  onResetProgress,
  onOpenPrivacy,
  onOpenRate,
}: ProfileSettingsViewProps) {
  const [nameInput, setNameInput] = useState(profile.name);
  const [governorateInput, setGovernorateInput] = useState(profile.governorate);
  const [emblemInput, setEmblemInput] = useState<AvatarEmblemId>(profile.emblem);
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const rank = getPlayerRank(profile.totalPoints);
  const adMetrics = TEST_MODE ? loadAdMetrics() : null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    const cleaned = nameInput.trim() || 'ضيف العراق';
    setNameInput(cleaned);
    onUpdateProfile({
      name: cleaned.slice(0, 28),
      governorate: governorateInput,
      emblem: emblemInput,
    });
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2200);
  };

  return (
    <section
      aria-labelledby="profile-heading"
      className="max-w-5xl mx-auto px-5 sm:px-6 py-8 sm:py-10 space-y-8"
    >
      {/* Clean Header Summary */}
      <div className="bg-[#0B1530] border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <EmblemBadge emblem={profile.emblem} size="lg" />
          <div>
            <h1
              id="profile-heading"
              className="font-display text-3xl font-bold text-[#F8F5EE]"
            >
              {profile.name}
            </h1>
            <div className="text-sm text-[#F8F5EE]/65 flex flex-wrap items-center gap-2 mt-1">
              <span className="text-[#F2C96B] font-semibold">{rank.title}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{formatPoints(profile.totalPoints)}</span>
              <span aria-hidden="true">·</span>
              <span>{profile.governorate}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-base">
          <div>
            <div className="text-xs text-[#F8F5EE]/50">أعلى جائزة</div>
            <div className="font-bold text-[#F2C96B] tabular-nums flex items-center gap-1.5 mt-0.5">
              <Trophy className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{formatDinar(profile.bestPrize)}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-[#F8F5EE]/50">العملات</div>
            <div className="font-bold text-[#F8F5EE] tabular-nums flex items-center gap-1.5 mt-0.5">
              <Coins className="h-4 w-4 text-[#D9A441] shrink-0" aria-hidden="true" />
              <span>{formatCoins(profile.coins)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Identity Form (7 cols) */}
        <form
          onSubmit={handleSaveProfile}
          className="lg:col-span-7 bg-[#0B1530] border border-white/10 rounded-2xl p-6 sm:p-7 space-y-6"
        >
          <h2 className="font-display text-2xl font-bold text-[#F8F5EE]">
            الملف الشخصي
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="player-name"
                className="block text-sm font-medium text-[#F8F5EE]/75 mb-2"
              >
                الاسم
              </label>
              <input
                id="player-name"
                type="text"
                maxLength={28}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="اكتب اسمك..."
                className="w-full bg-[#060D1F] border border-white/15 rounded-xl px-4 py-3 text-base text-[#F8F5EE] placeholder:text-[#F8F5EE]/40 focus:outline-none focus:border-[#D9A441]"
              />
            </div>

            <div>
              <label
                htmlFor="player-gov"
                className="block text-sm font-medium text-[#F8F5EE]/75 mb-2"
              >
                المحافظة
              </label>
              <select
                id="player-gov"
                value={governorateInput}
                onChange={(e) => setGovernorateInput(e.target.value)}
                className="w-full bg-[#060D1F] border border-white/15 rounded-xl px-4 py-3 text-base text-[#F8F5EE] focus:outline-none focus:border-[#D9A441]"
              >
                {IRAQI_GOVERNORATES.map((gov) => (
                  <option key={gov} value={gov} className="bg-[#0B1530]">
                    {gov}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium text-[#F8F5EE]/75 mb-3">
              الشارة
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {AVATAR_EMBLEMS.map((item) => {
                const selected = emblemInput === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setEmblemInput(item.id);
                    }}
                    className={`p-3.5 rounded-xl border text-right flex items-center gap-3 transition-colors cursor-pointer ${
                      selected
                        ? 'border-[#D9A441] bg-[#D9A441]/15'
                        : 'border-white/10 bg-[#060D1F]/60 hover:border-white/25'
                    }`}
                  >
                    <EmblemBadge emblem={item.id} size="sm" />
                    <span className="text-sm font-semibold text-[#F8F5EE] truncate">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base font-bold text-[#060D1F] bg-[#D9A441] hover:bg-[#F2C96B] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
          >
            {savedNotice ? (
              <>
                <Check className="h-5 w-5" aria-hidden="true" />
                <span>تم الحفظ</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" aria-hidden="true" />
                <span>حفظ التغييرات</span>
              </>
            )}
          </button>
        </form>

        {/* Simple Sound & Game Settings (5 cols) */}
        <div className="lg:col-span-5 bg-[#0B1530] border border-white/10 rounded-2xl p-6 sm:p-7 space-y-6">
          <h2 className="font-display text-2xl font-bold text-[#F8F5EE]">
            الإعدادات
          </h2>

          {/* Answer Mode */}
          <div className="space-y-2.5">
            <span className="block text-sm font-medium text-[#F8F5EE]/80">
              طريقة الإجابة
            </span>
            <div
              className="grid grid-cols-2 gap-1.5 p-1 bg-[#060D1F] border border-white/10 rounded-xl"
              role="group"
              aria-label="طريقة الإجابة"
            >
              {(
                [
                  { id: 'instant', label: 'ضغطة واحدة' },
                  { id: 'confirm', label: 'تأكيد نهائي' },
                ] as { id: AnswerStyle; label: string }[]
              ).map((opt) => {
                const active = settings.answerStyle === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onUpdateSettings({ answerStyle: opt.id });
                    }}
                    className={`px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-[#D9A441] text-[#060D1F]'
                        : 'text-[#F8F5EE]/70 hover:text-[#F8F5EE]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sound Effects Toggle */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div className="flex items-center gap-3">
              {settings.soundEnabled ? (
                <Volume2 className="h-5 w-5 text-[#D9A441]" aria-hidden="true" />
              ) : (
                <VolumeX className="h-5 w-5 text-[#F8F5EE]/45" aria-hidden="true" />
              )}
              <span className="text-base font-medium text-[#F8F5EE]">
                الأصوات والتصفيق
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !settings.soundEnabled;
                onUpdateSettings({ soundEnabled: next });
                if (next) {
                  soundEngine.setEnabled(true);
                  soundEngine.playClick();
                }
              }}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
                settings.soundEnabled
                  ? 'bg-[#D9A441] text-[#060D1F]'
                  : 'bg-white/10 text-[#F8F5EE]/75 hover:text-[#F8F5EE]'
              }`}
            >
              {settings.soundEnabled ? 'مفعّل' : 'مكتوم'}
            </button>
          </div>

          {/* Studio Music Toggle */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div className="flex items-center gap-3">
              <Music
                className={`h-5 w-5 ${
                  settings.musicEnabled ? 'text-[#D9A441]' : 'text-[#F8F5EE]/45'
                }`}
                aria-hidden="true"
              />
              <span className="text-base font-medium text-[#F8F5EE]">
                موسيقى الاستوديو
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onUpdateSettings({ musicEnabled: !settings.musicEnabled });
              }}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors whitespace-nowrap cursor-pointer ${
                settings.musicEnabled
                  ? 'bg-[#D9A441] text-[#060D1F]'
                  : 'bg-white/10 text-[#F8F5EE]/75 hover:text-[#F8F5EE]'
              }`}
            >
              {settings.musicEnabled ? 'مفعّلة' : 'متوقفة'}
            </button>
          </div>

          {/* Rate Us & Privacy Policy (Google Play Ready) */}
          <div className="pt-4 border-t border-white/10 space-y-2.5">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onOpenRate();
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-[#060D1F] bg-[#D9A441] hover:bg-[#F2C96B] cursor-pointer"
            >
              <Star className="h-4 w-4 fill-[#060D1F]" aria-hidden="true" />
              <span>قيّم التطبيق ⭐</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onOpenPrivacy();
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#F8F5EE]/85 border border-white/15 bg-[#060D1F]/70 hover:border-[#D9A441]/40 hover:text-[#F2C96B] cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4 text-[#D9A441]" aria-hidden="true" />
              <span>سياسة الخصوصية وحول التطبيق</span>
            </button>
          </div>

          {/* Reset Progress */}
          <div className="pt-4 border-t border-white/10">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setConfirmReset(true);
                }}
                className="inline-flex items-center gap-2 text-sm text-red-300/85 hover:text-red-300 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>إعادة ضبط التقدم</span>
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-red-300">
                  هل تريد تصفير الإحصائيات وإعادة الرصيد؟
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onResetProgress();
                      setConfirmReset(false);
                    }}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-500 text-white transition-colors whitespace-nowrap cursor-pointer"
                  >
                    تأكيد
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setConfirmReset(false);
                    }}
                    className="px-5 py-2.5 rounded-xl text-sm text-[#F8F5EE]/75 bg-white/10 hover:bg-white/15 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AdMob Test Diagnostics: Hidden Unless TEST_MODE === true */}
      {TEST_MODE && adMetrics && (
        <div className="bg-[#0B1530] border border-white/10 rounded-2xl p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D9A441]/15 border border-[#D9A441]/35 text-[#F2C96B] flex items-center justify-center shrink-0">
                <Code2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-[#F8F5EE]">
                  فحص الإعلانات (TEST_MODE)
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-[#F8F5EE]/60 mt-0.5">
                  <Megaphone className="h-3.5 w-3.5 text-[#D9A441]" aria-hidden="true" />
                  <span>
                    {ADMOB_CONFIG.isNativePlatform
                      ? 'Google AdMob الأصلي نشط'
                      : 'Google AdMob (معاينة الويب)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 py-3 border-b border-white/10">
            <div>
              <div className="text-xs text-[#F8F5EE]/55">البانر</div>
              <div className="text-lg font-bold text-[#F8F5EE] tabular-nums mt-0.5">
                {adMetrics.bannerImpressions}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#F8F5EE]/55">البينية</div>
              <div className="text-lg font-bold text-[#F8F5EE] tabular-nums mt-0.5">
                {adMetrics.interstitialImpressions}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#F8F5EE]/55">المكافآت</div>
              <div className="text-lg font-bold text-[#F2C96B] tabular-nums mt-0.5">
                {adMetrics.rewardedImpressions}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#F8F5EE]/75">
            <div className="bg-[#060D1F]/70 border border-white/10 rounded-lg px-3.5 py-2.5">
              <div className="text-[#F8F5EE]/50 mb-0.5">App ID</div>
              <div dir="ltr" className="font-mono text-[#F2C96B] truncate">
                {ADMOB_CONFIG.appId}
              </div>
            </div>
            <div className="bg-[#060D1F]/70 border border-white/10 rounded-lg px-3.5 py-2.5">
              <div className="text-[#F8F5EE]/50 mb-0.5">Banner ID</div>
              <div dir="ltr" className="font-mono text-[#F2C96B] truncate">
                {ADMOB_CONFIG.bannerId}
              </div>
            </div>
            <div className="bg-[#060D1F]/70 border border-white/10 rounded-lg px-3.5 py-2.5">
              <div className="text-[#F8F5EE]/50 mb-0.5">Interstitial ID</div>
              <div dir="ltr" className="font-mono text-[#F2C96B] truncate">
                {ADMOB_CONFIG.interstitialId}
              </div>
            </div>
            <div className="bg-[#060D1F]/70 border border-white/10 rounded-lg px-3.5 py-2.5">
              <div className="text-[#F8F5EE]/50 mb-0.5">Rewarded ID</div>
              <div dir="ltr" className="font-mono text-[#F2C96B] truncate">
                {ADMOB_CONFIG.rewardedId}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
