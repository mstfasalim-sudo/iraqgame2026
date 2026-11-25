import { useState } from 'react';
import {
  Check,
  Clock,
  Code2,
  Coins,
  Globe,
  Mail,
  Megaphone,
  Music,
  Pencil,
  RotateCcw,
  Save,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import {
  AVATAR_EMBLEMS,
  AnswerStyle,
  AvatarEmblemId,
  DeveloperInfo,
  IRAQI_GOVERNORATES,
  QUESTION_TIMER_SECONDS,
  UserProfile,
  UserSettings,
  formatCoins,
  formatDinar,
  getPlayerRank,
} from '../types/game';
import { ADMOB_CONFIG, loadAdMetrics } from '../utils/ads';
import { soundEngine } from '../utils/sound';
import { EmblemBadge } from './EmblemBadge';

interface ProfileSettingsViewProps {
  profile: UserProfile;
  settings: UserSettings;
  developerInfo: DeveloperInfo;
  onUpdateProfile: (patch: Partial<UserProfile>) => void;
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
  onUpdateDeveloperInfo: (patch: Partial<DeveloperInfo>) => void;
  onResetProgress: () => void;
}

export function ProfileSettingsView({
  profile,
  settings,
  developerInfo,
  onUpdateProfile,
  onUpdateSettings,
  onUpdateDeveloperInfo,
  onResetProgress,
}: ProfileSettingsViewProps) {
  const [nameInput, setNameInput] = useState(profile.name);
  const [governorateInput, setGovernorateInput] = useState(profile.governorate);
  const [emblemInput, setEmblemInput] = useState<AvatarEmblemId>(profile.emblem);
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Developer Info edit state
  const [editingDev, setEditingDev] = useState(false);
  const [devName, setDevName] = useState(developerInfo.name);
  const [devRole, setDevRole] = useState(developerInfo.role);
  const [devEmail, setDevEmail] = useState(developerInfo.email);
  const [devWebsite, setDevWebsite] = useState(developerInfo.website);
  const [devBio, setDevBio] = useState(developerInfo.bio);

  const rank = getPlayerRank(profile.totalCorrect);
  const adMetrics = loadAdMetrics();

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

  const handleSaveDeveloper = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playClick();
    onUpdateDeveloperInfo({
      name: devName.trim() || developerInfo.name,
      role: devRole.trim() || developerInfo.role,
      email: devEmail.trim(),
      website: devWebsite.trim(),
      bio: devBio.trim() || developerInfo.bio,
    });
    setEditingDev(false);
  };

  return (
    <section
      aria-labelledby="profile-heading"
      className="max-w-5xl mx-auto px-6 py-10 space-y-10"
    >
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-white/10">
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
              <span className="text-[#F2C96B] font-medium">{rank.title}</span>
              <span aria-hidden="true">·</span>
              <span>محافظة {profile.governorate}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums text-[#F8F5EE]">
                {formatCoins(profile.coins)}
              </span>
            </div>
          </div>
        </div>

        <div className="min-w-[220px] space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#F8F5EE]/70">
            <span>التقدم للرتبة التالية</span>
            <span className="tabular-nums text-[#F2C96B]">
              {rank.nextTitle ? `${rank.progressPct}%` : 'الرتبة القصوى'}
            </span>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#D9A441] rounded-full transition-all duration-300"
              style={{ width: `${rank.progressPct}%` }}
            />
          </div>
          <p className="text-xs text-[#F8F5EE]/55">
            {rank.nextTitle
              ? `تحتاج ${rank.remainingForNext} إجابة صحيحة للوصول إلى «${rank.nextTitle}»`
              : 'وصلت إلى أعلى رتبة ثقافية في المسابقة'}
          </p>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pb-8 border-b border-white/10">
        <div>
          <p className="text-xs text-[#F8F5EE]/55 mb-1">أعلى جائزة محققة</p>
          <p className="text-xl font-bold text-[#F2C96B] tabular-nums flex items-center gap-1.5">
            <Trophy className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{formatDinar(profile.bestPrize)}</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-[#F8F5EE]/55 mb-1">رصيد العملات</p>
          <p className="text-xl font-bold text-[#F8F5EE] tabular-nums flex items-center gap-1.5">
            <Coins className="h-4 w-4 text-[#D9A441] shrink-0" aria-hidden="true" />
            <span>{formatCoins(profile.coins)}</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-[#F8F5EE]/55 mb-1">الإجابات الصحيحة</p>
          <p className="text-xl font-bold text-[#F8F5EE] tabular-nums">
            {profile.totalCorrect} إجابة
          </p>
        </div>
        <div>
          <p className="text-xs text-[#F8F5EE]/55 mb-1">الجولات والإعلانات</p>
          <p className="text-xl font-bold text-[#F8F5EE] tabular-nums">
            {profile.gamesPlayed} جولة · {profile.totalAdsWatched} مكافأة
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Identity Form (7 cols) */}
        <form
          onSubmit={handleSaveProfile}
          className="lg:col-span-7 bg-[#0B1530] border border-white/10 rounded-2xl p-6 sm:p-7 space-y-6"
        >
          <div>
            <h2 className="font-display text-2xl font-bold text-[#F8F5EE]">
              بيانات الملف الشخصي
            </h2>
            <p className="text-sm text-[#F8F5EE]/65 mt-1">
              خصّص اسمك ومحافظتك وشارتك العراقية لتظهر في الاستوديو.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="player-name"
                className="block text-xs font-medium text-[#F8F5EE]/75 mb-2"
              >
                اسم المتسابق
              </label>
              <input
                id="player-name"
                type="text"
                maxLength={28}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="اكتب اسمك هنا..."
                className="w-full bg-[#060D1F] border border-white/15 rounded-lg px-4 py-2.5 text-sm text-[#F8F5EE] placeholder:text-[#F8F5EE]/40 focus:outline-none focus:border-[#D9A441]"
              />
            </div>

            <div>
              <label
                htmlFor="player-gov"
                className="block text-xs font-medium text-[#F8F5EE]/75 mb-2"
              >
                المحافظة
              </label>
              <select
                id="player-gov"
                value={governorateInput}
                onChange={(e) => setGovernorateInput(e.target.value)}
                className="w-full bg-[#060D1F] border border-white/15 rounded-lg px-4 py-2.5 text-sm text-[#F8F5EE] focus:outline-none focus:border-[#D9A441]"
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
            <span className="block text-xs font-medium text-[#F8F5EE]/75 mb-3">
              اختر شارة ملفك الشخصي
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
                    className={`p-3 rounded-xl border text-right flex items-center gap-3 transition-colors cursor-pointer ${
                      selected
                        ? 'border-[#D9A441] bg-[#D9A441]/15'
                        : 'border-white/10 bg-[#060D1F]/60 hover:border-white/25'
                    }`}
                  >
                    <EmblemBadge emblem={item.id} size="sm" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#F8F5EE] truncate">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-[#F8F5EE]/50 truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-4">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-[#060D1F] bg-[#D9A441] hover:bg-[#F2C96B] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              {savedNotice ? (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  <span>تم حفظ الملف الشخصي</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  <span>حفظ التغييرات</span>
                </>
              )}
            </button>

            <span className="text-xs text-[#F8F5EE]/50">
              يُحفظ تلقائياً على جهازك
            </span>
          </div>
        </form>

        {/* Game Preferences (5 cols) */}
        <div className="lg:col-span-5 bg-[#0B1530] border border-white/10 rounded-2xl p-6 sm:p-7 space-y-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#F8F5EE]">
              إعدادات الصوت واللعب
            </h2>
            <p className="text-sm text-[#F8F5EE]/65 mt-1">
              تحكّم بموسيقى الاستوديو وأصوات التصفيق وطريقة اختيار الإجابة.
            </p>
          </div>

          {/* Answer Mode */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-medium text-[#F8F5EE]/80">
              <Zap className="h-4 w-4 text-[#D9A441]" aria-hidden="true" />
              <span>أسلوب اختيار الإجابة</span>
            </div>
            <div
              className="grid grid-cols-2 gap-1.5 p-1 bg-[#060D1F] border border-white/10 rounded-lg"
              role="group"
              aria-label="أسلوب اختيار الإجابة"
            >
              {(
                [
                  { id: 'instant', label: 'ضغطة واحدة (الأسهل)' },
                  { id: 'confirm', label: 'تأكيد نهائي كلاسيكي' },
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
                    className={`px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
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

          {/* Sound Effects & Applause Toggle */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div className="flex items-center gap-2.5">
              {settings.soundEnabled ? (
                <Volume2 className="h-4 w-4 text-[#D9A441]" aria-hidden="true" />
              ) : (
                <VolumeX className="h-4 w-4 text-[#F8F5EE]/45" aria-hidden="true" />
              )}
              <div>
                <div className="text-sm font-medium text-[#F8F5EE]">
                  المؤثرات والتصفيق والنقر
                </div>
                <div className="text-xs text-[#F8F5EE]/55">
                  صوت النقر، التصفيق عند الصح، وأصوات البرنامج التحفيزية
                </div>
              </div>
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
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                settings.soundEnabled
                  ? 'bg-[#D9A441] text-[#060D1F]'
                  : 'bg-white/10 text-[#F8F5EE]/75 hover:text-[#F8F5EE]'
              }`}
            >
              {settings.soundEnabled ? 'مفعّل' : 'مكتوم'}
            </button>
          </div>

          {/* Studio Background Music Toggle */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div className="flex items-center gap-2.5">
              <Music
                className={`h-4 w-4 ${
                  settings.musicEnabled ? 'text-[#D9A441]' : 'text-[#F8F5EE]/45'
                }`}
                aria-hidden="true"
              />
              <div>
                <div className="text-sm font-medium text-[#F8F5EE]">
                  موسيقى الاستوديو التفاعلية
                </div>
                <div className="text-xs text-[#F8F5EE]/55">
                  موسيقى حماسية تتصاعد مع كل مرحلة داخل المسابقة
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onUpdateSettings({ musicEnabled: !settings.musicEnabled });
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                settings.musicEnabled
                  ? 'bg-[#D9A441] text-[#060D1F]'
                  : 'bg-white/10 text-[#F8F5EE]/75 hover:text-[#F8F5EE]'
              }`}
            >
              {settings.musicEnabled ? 'مفعّلة' : 'متوقفة'}
            </button>
          </div>

          {/* Mandatory 25s Timer Info Notice */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
            <div className="flex items-center gap-2 text-[#F8F5EE]/75">
              <Clock className="h-4 w-4 text-[#D9A441] shrink-0" aria-hidden="true" />
              <span>مؤقت السؤال</span>
            </div>
            <span className="font-semibold text-[#F2C96B] tabular-nums">
              إجباري {QUESTION_TIMER_SECONDS} ثانية لكل سؤال
            </span>
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
                className="inline-flex items-center gap-2 text-xs text-red-300/85 hover:text-red-300 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>إعادة ضبط الإحصائيات والرصيد</span>
              </button>
            ) : (
              <div className="space-y-2.5">
                <p className="text-xs text-red-300">
                  هل أنت متأكد من تصفير أعلى جائزة والجولات وإرجاع الرصيد إلى 200 عملة؟
                </p>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onResetProgress();
                      setConfirmReset(false);
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-colors whitespace-nowrap cursor-pointer"
                  >
                    تأكيد التصفير
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setConfirmReset(false);
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs text-[#F8F5EE]/75 bg-white/10 hover:bg-white/15 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Developer Info Section */}
      <div className="bg-[#0B1530] border border-white/10 rounded-2xl p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D9A441]/15 border border-[#D9A441]/35 text-[#F2C96B] flex items-center justify-center shrink-0">
              <Code2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-[#F8F5EE]">
                معلومات عن المطور
              </h2>
              <p className="text-xs text-[#F8F5EE]/60">
                الإصدار {developerInfo.version} · بطاقة التواصل وحقوق التطبيق
              </p>
            </div>
          </div>

          {!editingDev && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setDevName(developerInfo.name);
                setDevRole(developerInfo.role);
                setDevEmail(developerInfo.email);
                setDevWebsite(developerInfo.website);
                setDevBio(developerInfo.bio);
                setEditingDev(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/15 text-[#F8F5EE] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              <span>تعديل معلومات المطور</span>
            </button>
          )}
        </div>

        {!editingDev ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-7 space-y-2.5">
              <div className="text-lg font-bold text-[#F8F5EE]">
                {developerInfo.name}
              </div>
              <div className="text-xs text-[#F2C96B]">{developerInfo.role}</div>
              <p className="text-sm text-[#F8F5EE]/75 leading-relaxed pt-1">
                {developerInfo.bio}
              </p>
            </div>

            <div className="md:col-span-5 space-y-3 text-sm">
              {developerInfo.email && (
                <div className="flex items-center gap-2.5 text-[#F8F5EE]/80">
                  <Mail
                    className="h-4 w-4 text-[#D9A441] shrink-0"
                    aria-hidden="true"
                  />
                  <a
                    href={`mailto:${developerInfo.email}`}
                    className="hover:text-[#F2C96B] transition-colors truncate"
                  >
                    {developerInfo.email}
                  </a>
                </div>
              )}

              {developerInfo.website && (
                <div className="flex items-center gap-2.5 text-[#F8F5EE]/80">
                  <Globe
                    className="h-4 w-4 text-[#D9A441] shrink-0"
                    aria-hidden="true"
                  />
                  <span className="truncate" dir="ltr">
                    {developerInfo.website}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2.5 text-xs text-[#F8F5EE]/65 pt-2 border-t border-white/10">
                <Megaphone
                  className="h-4 w-4 text-[#D9A441] shrink-0"
                  aria-hidden="true"
                />
                <span>
                  {ADMOB_CONFIG.isNativePlatform
                    ? 'إضافة Google AdMob الأصلية (@capacitor-community/admob) نشطة الآن.'
                    : 'التطبيق مجهّز بالكامل للعمل مع Google AdMob (@capacitor-community/admob).'}
                </span>
              </div>
            </div>

            {/* Google AdMob Overview & Recorded Impressions */}
            <div className="md:col-span-12 pt-5 border-t border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-[#F2C96B]">
                  إعدادات إعلانات Google AdMob (@capacitor-community/admob)
                </h3>
                <span className="text-xs text-[#F8F5EE]/55">
                  {ADMOB_CONFIG.isTesting
                    ? 'الوضع الحالي: معرفات جوجل التجريبية'
                    : 'الوضع الحالي: الإنتاج المباشر'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 py-3 border-y border-white/10">
                <div>
                  <div className="text-xs text-[#F8F5EE]/55">ظهور البانر</div>
                  <div className="text-lg font-bold text-[#F8F5EE] tabular-nums mt-0.5">
                    {adMetrics.bannerImpressions}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#F8F5EE]/55">الإعلانات البينية</div>
                  <div className="text-lg font-bold text-[#F8F5EE] tabular-nums mt-0.5">
                    {adMetrics.interstitialImpressions}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#F8F5EE]/55">إعلانات المكافآت</div>
                  <div className="text-lg font-bold text-[#F2C96B] tabular-nums mt-0.5">
                    {adMetrics.rewardedImpressions}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#F8F5EE]/75">
                <div className="bg-[#060D1F]/70 border border-white/10 rounded-lg px-3.5 py-2.5">
                  <div className="text-[#F8F5EE]/50 mb-0.5">App ID (VITE_ADMOB_APP_ID)</div>
                  <div dir="ltr" className="font-mono text-[#F2C96B] truncate">
                    {ADMOB_CONFIG.appId}
                  </div>
                </div>
                <div className="bg-[#060D1F]/70 border border-white/10 rounded-lg px-3.5 py-2.5">
                  <div className="text-[#F8F5EE]/50 mb-0.5">Banner ID (VITE_ADMOB_BANNER_ID)</div>
                  <div dir="ltr" className="font-mono text-[#F2C96B] truncate">
                    {ADMOB_CONFIG.bannerId}
                  </div>
                </div>
                <div className="bg-[#060D1F]/70 border border-white/10 rounded-lg px-3.5 py-2.5">
                  <div className="text-[#F8F5EE]/50 mb-0.5">
                    Interstitial ID (VITE_ADMOB_INTERSTITIAL_ID)
                  </div>
                  <div dir="ltr" className="font-mono text-[#F2C96B] truncate">
                    {ADMOB_CONFIG.interstitialId}
                  </div>
                </div>
                <div className="bg-[#060D1F]/70 border border-white/10 rounded-lg px-3.5 py-2.5">
                  <div className="text-[#F8F5EE]/50 mb-0.5">
                    Rewarded ID (VITE_ADMOB_REWARDED_ID)
                  </div>
                  <div dir="ltr" className="font-mono text-[#F2C96B] truncate">
                    {ADMOB_CONFIG.rewardedId}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveDeveloper} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="dev-name"
                  className="block text-xs text-[#F8F5EE]/75 mb-1.5"
                >
                  اسم المطور أو الاستوديو
                </label>
                <input
                  id="dev-name"
                  type="text"
                  maxLength={60}
                  value={devName}
                  onChange={(e) => setDevName(e.target.value)}
                  className="w-full bg-[#060D1F] border border-white/15 rounded-lg px-3.5 py-2 text-sm text-[#F8F5EE] focus:outline-none focus:border-[#D9A441]"
                />
              </div>

              <div>
                <label
                  htmlFor="dev-role"
                  className="block text-xs text-[#F8F5EE]/75 mb-1.5"
                >
                  الصفة أو التخصص
                </label>
                <input
                  id="dev-role"
                  type="text"
                  maxLength={90}
                  value={devRole}
                  onChange={(e) => setDevRole(e.target.value)}
                  className="w-full bg-[#060D1F] border border-white/15 rounded-lg px-3.5 py-2 text-sm text-[#F8F5EE] focus:outline-none focus:border-[#D9A441]"
                />
              </div>

              <div>
                <label
                  htmlFor="dev-email"
                  className="block text-xs text-[#F8F5EE]/75 mb-1.5"
                >
                  البريد الإلكتروني للتواصل
                </label>
                <input
                  id="dev-email"
                  type="email"
                  maxLength={80}
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  className="w-full bg-[#060D1F] border border-white/15 rounded-lg px-3.5 py-2 text-sm text-[#F8F5EE] focus:outline-none focus:border-[#D9A441]"
                />
              </div>

              <div>
                <label
                  htmlFor="dev-website"
                  className="block text-xs text-[#F8F5EE]/75 mb-1.5"
                >
                  الموقع أو رابط التواصل
                </label>
                <input
                  id="dev-website"
                  type="text"
                  maxLength={120}
                  value={devWebsite}
                  onChange={(e) => setDevWebsite(e.target.value)}
                  className="w-full bg-[#060D1F] border border-white/15 rounded-lg px-3.5 py-2 text-sm text-[#F8F5EE] focus:outline-none focus:border-[#D9A441]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="dev-bio"
                className="block text-xs text-[#F8F5EE]/75 mb-1.5"
              >
                نبذة عن المطور والتطبيق
              </label>
              <textarea
                id="dev-bio"
                rows={3}
                maxLength={260}
                value={devBio}
                onChange={(e) => setDevBio(e.target.value)}
                className="w-full bg-[#060D1F] border border-white/15 rounded-lg px-3.5 py-2 text-sm text-[#F8F5EE] focus:outline-none focus:border-[#D9A441]"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold bg-[#D9A441] hover:bg-[#F2C96B] text-[#060D1F] transition-colors cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                <span>حفظ معلومات المطور</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setEditingDev(false);
                }}
                className="px-4 py-2 rounded-lg text-xs text-[#F8F5EE]/75 bg-white/10 hover:bg-white/15 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
