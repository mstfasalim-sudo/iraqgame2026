import { CalendarCheck, Coins, PlayCircle } from 'lucide-react';
import { AD_REWARDS, UserProfile, formatCoins } from '../types/game';
import { soundEngine } from '../utils/sound';
import { getTodayKey } from '../utils/storage';
import { AdBannerSlot } from './AdBannerSlot';

interface RewardsCenterViewProps {
  profile: UserProfile;
  onClaimDailyBonus: () => void;
  onWatchCoinsAd: () => void;
  onStartGame: () => void;
}

export function RewardsCenterView({
  profile,
  onClaimDailyBonus,
  onWatchCoinsAd,
}: RewardsCenterViewProps) {
  const today = getTodayKey();
  const dailyBonusClaimed = profile.lastDailyBonusDate === today;
  const remainingAdsToday = Math.max(
    0,
    AD_REWARDS.maxDailyAdCoins - profile.dailyAdsWatched
  );

  return (
    <section
      aria-labelledby="rewards-heading"
      className="max-w-4xl mx-auto px-5 sm:px-6 py-8 sm:py-10 space-y-8"
    >
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <h1
          id="rewards-heading"
          className="font-display text-3xl sm:text-4xl font-bold text-[#F8F5EE]"
        >
          المكافآت
        </h1>

        <div className="inline-flex items-center gap-2.5 bg-[#0B1530] border border-[#D9A441]/30 rounded-xl px-5 py-3 shrink-0 self-start sm:self-auto">
          <Coins className="h-5 w-5 text-[#D9A441]" aria-hidden="true" />
          <span className="text-xl font-bold text-[#F2C96B] tabular-nums">
            {formatCoins(profile.coins)}
          </span>
        </div>
      </div>

      {/* Two Big Clear Reward Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <article className="bg-[#0B1530] border border-[#D9A441]/35 rounded-2xl p-7 flex flex-col justify-between gap-6">
          <div className="space-y-2">
            <div className="text-sm text-[#F8F5EE]/55 tabular-nums">
              متبقي اليوم: {remainingAdsToday} / {AD_REWARDS.maxDailyAdCoins}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F8F5EE]">
              +{AD_REWARDS.bonusCoins} عملة بإعلان
            </h2>
            <p className="text-sm text-[#F8F5EE]/70">
              شاهد إعلاناً قصيراً لزيادة رصيدك فوراً.
            </p>
          </div>

          <button
            type="button"
            disabled={remainingAdsToday === 0}
            onClick={() => {
              soundEngine.playClick();
              onWatchCoinsAd();
            }}
            className={`w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl text-base font-bold transition-colors whitespace-nowrap ${
              remainingAdsToday > 0
                ? 'bg-[#D9A441] hover:bg-[#F2C96B] text-[#060D1F] cursor-pointer'
                : 'bg-white/10 text-[#F8F5EE]/40 cursor-not-allowed'
            }`}
          >
            <PlayCircle className="h-5 w-5" aria-hidden="true" />
            <span>
              {remainingAdsToday > 0 ? 'شاهد إعلاناً الآن' : 'اكتملت إعلانات اليوم'}
            </span>
          </button>
        </article>

        <article className="bg-[#0B1530] border border-white/10 rounded-2xl p-7 flex flex-col justify-between gap-6">
          <div className="space-y-2">
            <div className="text-sm text-[#F8F5EE]/55">
              {dailyBonusClaimed ? 'تم الاستلام اليوم' : 'متاحة الآن'}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F8F5EE]">
              هدية اليوم (+{AD_REWARDS.dailyCheckInCoins} عملة)
            </h2>
            <p className="text-sm text-[#F8F5EE]/70">
              مكافأة مجانية يومية لرصيدك.
            </p>
          </div>

          <button
            type="button"
            disabled={dailyBonusClaimed}
            onClick={() => {
              soundEngine.playClick();
              onClaimDailyBonus();
            }}
            className={`w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl text-base font-bold transition-colors whitespace-nowrap ${
              !dailyBonusClaimed
                ? 'bg-white/15 hover:bg-[#D9A441] hover:text-[#060D1F] text-[#F8F5EE] cursor-pointer'
                : 'bg-white/5 text-[#F8F5EE]/40 cursor-not-allowed'
            }`}
          >
            <CalendarCheck className="h-5 w-5" aria-hidden="true" />
            <span>
              {dailyBonusClaimed ? 'تم الاستلام' : 'استلم الهدية'}
            </span>
          </button>
        </article>
      </div>

      <AdBannerSlot placement="rewards" />
    </section>
  );
}
