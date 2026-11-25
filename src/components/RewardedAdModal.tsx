import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Gift, PlayCircle, X } from 'lucide-react';
import { AdRewardRequest } from '../types/game';
import {
  ADMOB_CONFIG,
  recordAdImpression,
  showAdMobRewarded,
} from '../utils/ads';
import { soundEngine } from '../utils/sound';
import { ResilientImage } from './ResilientImage';

interface RewardedAdModalProps {
  request: AdRewardRequest | null;
  onClose: () => void;
}

const AD_DURATION_SECONDS = 5;

const CULTURAL_SPOTS = [
  {
    headline: 'زُر ديوان الأمثال العراقية الشامل',
    body: 'أكثر من 60 مثلاً عراقياً من بغداد والبصرة والموصل والفرات الأوسط مع معانيها ومناسباتها.',
    image: '/src/assets/images/proverbs_diwan_card_1795522142222.jpg',
  },
  {
    headline: 'رحلة بين حضارات بلاد الرافدين',
    body: 'اكتشف معالم المحافظات العراقية الـ 18 من قلعة أربيل والموصل حتى زقورة أور وشط العرب.',
    image: '/src/assets/images/baghdad_heritage_card_1795522142765.jpg',
  },
  {
    headline: 'تحدّ نفسك نحو جائزة المليون',
    body: 'شاهد الإعلانات القصيرة لجمع العملات واستعادة وسائل المساعدة أو الحصول على فرصة ثانية.',
    image: '/src/assets/images/studio_backdrop_1795522141754.jpg',
  },
];

export function RewardedAdModal({ request, onClose }: RewardedAdModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(AD_DURATION_SECONDS);
  const [claimed, setClaimed] = useState(false);
  const [handledNatively, setHandledNatively] = useState(false);

  const spot = useMemo(() => {
    if (!request) return CULTURAL_SPOTS[0];
    return CULTURAL_SPOTS[Math.floor(Math.random() * CULTURAL_SPOTS.length)];
  }, [request]);

  useEffect(() => {
    if (!request) return;
    let cancelled = false;
    setSecondsLeft(AD_DURATION_SECONDS);
    setClaimed(false);
    setHandledNatively(false);

    if (ADMOB_CONFIG.isNativePlatform) {
      showAdMobRewarded(
        () => {
          if (!cancelled) {
            soundEngine.playReward();
            request.onComplete();
            onClose();
          }
        },
        () => {
          if (!cancelled) onClose();
        }
      ).then((shown) => {
        if (!cancelled && shown) {
          setHandledNatively(true);
        }
      });
    }

    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId);
          soundEngine.playReward();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [request, onClose]);

  if (!request || handledNatively) return null;

  const isFinished = secondsLeft === 0;
  const progressPct = Math.round(
    ((AD_DURATION_SECONDS - secondsLeft) / AD_DURATION_SECONDS) * 100
  );

  const handleClaim = () => {
    if (!isFinished || claimed) return;
    setClaimed(true);
    recordAdImpression('rewarded');
    soundEngine.playReward();
    request.onComplete();
    onClose();
  };

  const handleCancel = () => {
    soundEngine.playClick();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rewarded-ad-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-[#0B1530] border border-[#D9A441]/35 overflow-hidden shadow-2xl">
        {/* Top bar */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between gap-3 bg-[#081026]">
          <div className="flex items-center gap-2 text-xs text-[#F2C96B]">
            <PlayCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Google AdMob · إعلان مكافآت{' '}
              {ADMOB_CONFIG.isTesting ? '(تجريبي)' : ''}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#F8F5EE]/70 tabular-nums">
              {isFinished
                ? 'المكافأة جاهزة للاستلام'
                : `يتبقى ${secondsLeft} ثوانٍ`}
            </span>
            <button
              type="button"
              onClick={handleCancel}
              aria-label="إغلاق الإعلان"
              className="p-1.5 rounded-lg text-[#F8F5EE]/55 hover:text-[#F8F5EE] hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Visual Showcase */}
        <div className="relative h-52 overflow-hidden bg-[#060D1F]">
          <ResilientImage
            src={spot.image}
            alt={spot.headline}
            fallbackLabel={spot.headline}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1530] via-[#0B1530]/45 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 p-5">
            <h2
              id="rewarded-ad-title"
              className="font-display text-2xl font-bold text-[#F8F5EE] leading-snug"
            >
              {spot.headline}
            </h2>
            <p className="text-sm text-[#F8F5EE]/80 mt-1 leading-relaxed">
              {spot.body}
            </p>
          </div>
        </div>

        {/* Progress & Claim Footer */}
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#F8F5EE]/70">{request.title}</span>
              <span className="font-semibold text-[#F2C96B]">
                {request.rewardLabel}
              </span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#D9A441] transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            {!isFinished ? (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2.5 text-xs font-medium text-[#F8F5EE]/60 hover:text-[#F8F5EE] transition-colors whitespace-nowrap cursor-pointer"
              >
                إلغاء بدون مكافأة
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>اكتملت المشاهدة بنجاح</span>
              </div>
            )}

            <button
              type="button"
              disabled={!isFinished}
              onClick={handleClaim}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-colors whitespace-nowrap shrink-0 ${
                isFinished
                  ? 'bg-[#D9A441] hover:bg-[#F2C96B] text-[#060D1F] cursor-pointer'
                  : 'bg-white/10 text-[#F8F5EE]/40 cursor-not-allowed'
              }`}
            >
              <Gift className="h-4 w-4" aria-hidden="true" />
              <span>
                {isFinished
                  ? 'استلم المكافأة الآن'
                  : `انتظر ${secondsLeft} ثوانٍ`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
