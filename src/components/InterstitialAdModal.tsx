import { useEffect, useState } from 'react';
import { ArrowLeft, Megaphone, X } from 'lucide-react';
import {
  ADMOB_CONFIG,
  recordAdImpression,
  showAdMobInterstitial,
} from '../utils/ads';
import { soundEngine } from '../utils/sound';
import { ResilientImage } from './ResilientImage';

interface InterstitialAdModalProps {
  open: boolean;
  onContinue: () => void;
}

const SKIP_DELAY_SECONDS = 4;

export function InterstitialAdModal({
  open,
  onContinue,
}: InterstitialAdModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(SKIP_DELAY_SECONDS);
  const [handledNatively, setHandledNatively] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setSecondsLeft(SKIP_DELAY_SECONDS);
    setHandledNatively(false);

    if (ADMOB_CONFIG.isNativePlatform) {
      showAdMobInterstitial(() => {
        if (!cancelled) onContinue();
      }).then((shown) => {
        if (!cancelled && shown) {
          setHandledNatively(true);
        }
      });
    } else {
      recordAdImpression('interstitial');
    }

    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [open, onContinue]);

  if (!open || handledNatively) return null;

  const canSkip = secondsLeft === 0;

  const handleProceed = () => {
    if (!canSkip) return;
    soundEngine.playClick();
    onContinue();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="interstitial-ad-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-[#0B1530] border border-[#D9A441]/35 overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between gap-3 bg-[#081026]">
          <div className="flex items-center gap-2 text-xs text-[#F2C96B]">
            <Megaphone className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Google AdMob · إعلان بيني{' '}
              {ADMOB_CONFIG.isTesting ? '(تجريبي)' : ''}
            </span>
          </div>

          <button
            type="button"
            disabled={!canSkip}
            onClick={handleProceed}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              canSkip
                ? 'bg-white/15 hover:bg-white/25 text-[#F8F5EE] cursor-pointer'
                : 'bg-white/5 text-[#F8F5EE]/45 cursor-not-allowed'
            }`}
          >
            {canSkip ? (
              <>
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                <span>تخطي</span>
              </>
            ) : (
              <span className="tabular-nums">إغلاق بعد {secondsLeft} ث</span>
            )}
          </button>
        </div>

        <div className="relative h-56 bg-[#060D1F]">
          <ResilientImage
            src="/src/assets/images/baghdad_heritage_card_1795522142765.jpg"
            alt="إعلان بيني Google AdMob"
            fallbackLabel="إعلان بيني Google AdMob"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1530] via-[#0B1530]/45 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 p-6">
            <h2
              id="interstitial-ad-title"
              className="font-display text-2xl font-bold text-[#F8F5EE]"
            >
              فاصل إعلاني قبل انطلاق جولتك الجديدة
            </h2>
            <p className="text-xs text-[#F8F5EE]/70 mt-1.5" dir="ltr">
              Interstitial Unit: {ADMOB_CONFIG.interstitialId}
            </p>
          </div>
        </div>

        <div className="p-5 flex items-center justify-between gap-4">
          <span className="text-xs text-[#F8F5EE]/55">
            @capacitor-community/admob
          </span>
          <button
            type="button"
            disabled={!canSkip}
            onClick={handleProceed}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${
              canSkip
                ? 'bg-[#D9A441] hover:bg-[#F2C96B] text-[#060D1F] cursor-pointer'
                : 'bg-white/10 text-[#F8F5EE]/40 cursor-not-allowed'
            }`}
          >
            <span>
              {canSkip
                ? 'ابدأ الجولة الآن'
                : `جاري التحضير (${secondsLeft} ث)`}
            </span>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
