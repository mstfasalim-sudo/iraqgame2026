import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Megaphone, X } from 'lucide-react';
import {
  ADMOB_CONFIG,
  recordAdImpression,
  showAdMobInterstitial,
} from '../utils/ads';
import { TEST_MODE } from '../utils/config';
import { isOnline } from '../utils/offline';
import { soundEngine } from '../utils/sound';
import { ResilientImage } from './ResilientImage';

export type InterstitialContext = 'before_result' | 'stage_break';

interface InterstitialAdModalProps {
  open: boolean;
  context?: InterstitialContext;
  onContinue: () => void;
}

const SKIP_DELAY_SECONDS = 3;

export function InterstitialAdModal({
  open,
  context = 'before_result',
  onContinue,
}: InterstitialAdModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(SKIP_DELAY_SECONDS);
  const onContinueRef = useRef(onContinue);
  onContinueRef.current = onContinue;

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    // When offline, skip interstitial immediately so gameplay continues smoothly
    if (!isOnline()) {
      onContinueRef.current();
      return;
    }

    // On native Android/iOS, always invoke the native AdMob Interstitial directly.
    // showAdMobInterstitial is fail-safe: if offline or failed, it immediately calls onContinue.
    if (ADMOB_CONFIG.isNativePlatform) {
      showAdMobInterstitial(() => {
        if (!cancelled) {
          onContinueRef.current();
        }
      });
      return () => {
        cancelled = true;
      };
    }

    // Web preview fallback
    setSecondsLeft(SKIP_DELAY_SECONDS);
    recordAdImpression('interstitial');

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
  }, [open]);

  // Never render the web fallback card on native Android/iOS or when offline
  if (!open || ADMOB_CONFIG.isNativePlatform || !isOnline()) return null;

  const canSkip = secondsLeft === 0;

  const titleText =
    context === 'stage_break'
      ? 'فاصل إعلاني قصير قبل المرحلة التالية'
      : 'فاصل إعلاني قبل عرض نتيجتك النهائية';

  const continueLabel =
    context === 'stage_break' ? 'متابعة المسابقة' : 'عرض النتيجة النهائية';

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
              {TEST_MODE ? 'إعلان بيني AdMob (تجريبي)' : 'إعلان'}
            </span>
          </div>

          <button
            type="button"
            disabled={!canSkip}
            onClick={handleProceed}
            className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              canSkip
                ? 'bg-white/15 hover:bg-white/25 text-[#F8F5EE] cursor-pointer'
                : 'bg-white/5 text-[#F8F5EE]/45 cursor-not-allowed'
            }`}
          >
            {canSkip ? (
              <>
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                <span>إغلاق</span>
              </>
            ) : (
              <span className="tabular-nums">إغلاق بعد {secondsLeft} ث</span>
            )}
          </button>
        </div>

        <div className="relative h-56 bg-[#060D1F]">
          <ResilientImage
            src="/src/assets/images/baghdad_heritage_card_1795522142765.jpg"
            alt="فاصل إعلاني"
            fallbackLabel="فاصل إعلاني"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1530] via-[#0B1530]/45 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 p-6">
            <h2
              id="interstitial-ad-title"
              className="font-display text-2xl font-bold text-[#F8F5EE]"
            >
              {titleText}
            </h2>
            {TEST_MODE && (
              <p className="text-xs text-[#F8F5EE]/70 mt-1.5" dir="ltr">
                Interstitial Unit: {ADMOB_CONFIG.interstitialId}
              </p>
            )}
          </div>
        </div>

        <div className="p-5 flex items-center justify-end">
          <button
            type="button"
            disabled={!canSkip}
            onClick={handleProceed}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold transition-colors whitespace-nowrap ${
              canSkip
                ? 'bg-[#D9A441] hover:bg-[#F2C96B] text-[#060D1F] cursor-pointer'
                : 'bg-white/10 text-[#F8F5EE]/40 cursor-not-allowed'
            }`}
          >
            <span>
              {canSkip ? continueLabel : `جاري التحضير (${secondsLeft} ث)`}
            </span>
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
