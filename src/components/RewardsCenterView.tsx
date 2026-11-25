import {
  CalendarCheck,
  Coins,
  HeartHandshake,
  PlayCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  AD_REWARDS,
  COIN_COSTS,
  UserProfile,
  formatCoins,
} from '../types/game';
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
  onStartGame,
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
      className="max-w-5xl mx-auto px-6 py-10 space-y-10"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-white/10">
        <div>
          <p className="text-sm text-[#D9A441] mb-1.5">
            مكافآت الإعلانات والعملات الذهبية
          </p>
          <h1
            id="rewards-heading"
            className="font-display text-3xl sm:text-4xl font-bold text-[#F8F5EE]"
          >
            مركز المكافآت السريعة
          </h1>
          <p className="text-sm sm:text-base text-[#F8F5EE]/70 mt-2 max-w-xl leading-relaxed">
            اجمع العملات الذهبية عبر مشاهدة إعلانات قصيرة (5 ثوانٍ) أو هديتك اليومية، واستخدمها لإنقاذ جولتك أو شحن وسائل المساعدة.
          </p>
        </div>

        <div className="bg-[#0B1530] border border-[#D9A441]/30 rounded-xl px-5 py-3.5 shrink-0">
          <div className="text-xs text-[#F8F5EE]/60 mb-0.5">رصيدك الحالي</div>
          <div className="text-2xl font-bold text-[#F2C96B] tabular-nums flex items-center gap-2">
            <Coins className="h-5 w-5" aria-hidden="true" />
            <span>{formatCoins(profile.coins)}</span>
          </div>
        </div>
      </div>

      {/* Primary Reward Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Watch Ad for Coins */}
        <article className="bg-[#0B1530] border border-[#D9A441]/35 rounded-2xl p-7 flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#F8F5EE]/65">
              <span className="text-[#F2C96B] font-semibold">
                مكافأة إعلان فورية
              </span>
              <span className="tabular-nums">
                متبقي اليوم: {remainingAdsToday} / {AD_REWARDS.maxDailyAdCoins}
              </span>
            </div>

            <h2 className="font-display text-2xl font-bold text-[#F8F5EE]">
              شاهد إعلاناً قصيراً واربح +{AD_REWARDS.bonusCoins} عملة
            </h2>

            <p className="text-sm text-[#F8F5EE]/70 leading-relaxed">
              إعلان تفاعلي سريع مدته 5 ثوانٍ فقط يضيف {AD_REWARDS.bonusCoins}{' '}
              عملة ذهبية مباشرة إلى رصيدك لاستخدامها في أي جولة.
            </p>
          </div>

          <button
            type="button"
            disabled={remainingAdsToday === 0}
            onClick={onWatchCoinsAd}
            className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${
              remainingAdsToday > 0
                ? 'bg-[#D9A441] hover:bg-[#F2C96B] text-[#060D1F] cursor-pointer'
                : 'bg-white/10 text-[#F8F5EE]/40 cursor-not-allowed'
            }`}
          >
            <PlayCircle className="h-4 w-4" aria-hidden="true" />
            <span>
              {remainingAdsToday > 0
                ? `مشاهدة إعلان (+${AD_REWARDS.bonusCoins} عملة)`
                : 'اكتملت إعلانات اليوم — عُد غداً'}
            </span>
          </button>
        </article>

        {/* Daily Check-in Bonus */}
        <article className="bg-[#0B1530] border border-white/10 rounded-2xl p-7 flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#F8F5EE]/65">
              <span className="text-[#F2C96B] font-semibold">هدية الحضور اليومي</span>
              <span>{dailyBonusClaimed ? 'تم الاستلام اليوم' : 'متاحة الآن'}</span>
            </div>

            <h2 className="font-display text-2xl font-bold text-[#F8F5EE]">
              مكافأة الدخول اليومي (+{AD_REWARDS.dailyCheckInCoins} عملة)
            </h2>

            <p className="text-sm text-[#F8F5EE]/70 leading-relaxed">
              استلم هديتك المجانية كل يوم عند فتح التطبيق لتبدأ جولاتك برصيد وافر من العملات الذهبية.
            </p>
          </div>

          <button
            type="button"
            disabled={dailyBonusClaimed}
            onClick={onClaimDailyBonus}
            className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${
              !dailyBonusClaimed
                ? 'bg-white/15 hover:bg-[#D9A441] hover:text-[#060D1F] text-[#F8F5EE] cursor-pointer'
                : 'bg-white/5 text-[#F8F5EE]/40 cursor-not-allowed'
            }`}
          >
            <CalendarCheck className="h-4 w-4" aria-hidden="true" />
            <span>
              {dailyBonusClaimed
                ? 'تم استلام هدية اليوم بنجاح'
                : `استلم +${AD_REWARDS.dailyCheckInCoins} عملة مجاناً`}
            </span>
          </button>
        </article>
      </div>

      {/* How In-Game Ad & Coin Rewards Work */}
      <div className="pt-4 border-t border-white/10 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-[#F8F5EE]">
            كيف تستفيد من الإعلانات والعملات داخل اللعب؟
          </h2>
          <button
            type="button"
            onClick={onStartGame}
            className="px-4 py-2 text-xs font-bold text-[#060D1F] bg-[#D9A441] hover:bg-[#F2C96B] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            جرّبها داخل الجولة
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <HeartHandshake className="h-5 w-5 text-[#D9A441]" aria-hidden="true" />
            <h3 className="text-base font-semibold text-[#F8F5EE]">
              الفرصة الثانية عند الخطأ
            </h3>
            <p className="text-sm text-[#F8F5EE]/65 leading-relaxed">
              إذا أخطأت في سؤال أو انتهى الوقت، يمكنك مشاهدة إعلان قصير أو صرف{' '}
              <span className="tabular-nums text-[#F2C96B]">
                {COIN_COSTS.revive} عملة
              </span>{' '}
              لحذف الخيار الخاطئ وإكمال نفس المرحلة.
            </p>
          </div>

          <div className="space-y-2">
            <RefreshCw className="h-5 w-5 text-[#D9A441]" aria-hidden="true" />
            <h3 className="text-base font-semibold text-[#F8F5EE]">
              استعادة وسيلة مساعدة
            </h3>
            <p className="text-sm text-[#F8F5EE]/65 leading-relaxed">
              اضغط على أي وسيلة مساعدة مستهلكة داخل الاستوديو لإعادة شحنها عبر إعلان قصير أو{' '}
              <span className="tabular-nums text-[#F2C96B]">
                {COIN_COSTS.restoreLifeline} عملة
              </span>
              .
            </p>
          </div>

          <div className="space-y-2">
            <Sparkles className="h-5 w-5 text-[#D9A441]" aria-hidden="true" />
            <h3 className="text-base font-semibold text-[#F8F5EE]">
              مضاعفة عملات الجولة (×2)
            </h3>
            <p className="text-sm text-[#F8F5EE]/65 leading-relaxed">
              بعد انتهاء كل جولة يمكنك مضاعفة العملات الذهبية التي ربحتها فوراً عبر إعلان مكافأة سريع في شاشة النتيجة.
            </p>
          </div>
        </div>
      </div>

      <AdBannerSlot placement="rewards" />
    </section>
  );
}
