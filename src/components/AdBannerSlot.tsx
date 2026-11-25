import { useEffect, useRef } from 'react';
import { Megaphone } from 'lucide-react';
import {
  ADMOB_CONFIG,
  BannerPlacement,
  hideAdMobBanner,
  recordAdImpression,
  showAdMobBanner,
} from '../utils/ads';

interface AdBannerSlotProps {
  placement: BannerPlacement;
  compact?: boolean;
}

const PLACEMENT_META: Record<
  BannerPlacement,
  { title: string; subtitle: string; sizeLabel: string }
> = {
  home: {
    title: 'إعلان بانر Google AdMob · الرئيسية',
    subtitle: 'وحدة البانر التكيفية عبر @capacitor-community/admob',
    sizeLabel: 'ADAPTIVE_BANNER',
  },
  game: {
    title: 'إعلان بانر Google AdMob · أسفل الاستوديو',
    subtitle: 'شريط بانر تكيفي غير مزعج أثناء اللعب',
    sizeLabel: 'ADAPTIVE_BANNER',
  },
  proverbs: {
    title: 'إعلان بانر Google AdMob · ديوان الأمثال',
    subtitle: 'مساحة بانر متجاوبة داخل ديوان الأمثال العراقية',
    sizeLabel: 'ADAPTIVE_BANNER',
  },
  rewards: {
    title: 'إعلان بانر Google AdMob · مركز المكافآت',
    subtitle: 'مساحة بانر داخل صفحة المكافآت',
    sizeLabel: 'ADAPTIVE_BANNER',
  },
  result: {
    title: 'إعلان بانر Google AdMob · شاشة النتيجة',
    subtitle: 'مساحة بانر بعد انتهاء الجولة',
    sizeLabel: 'ADAPTIVE_BANNER',
  },
};

export function AdBannerSlot({ placement, compact = false }: AdBannerSlotProps) {
  const countedRef = useRef(false);
  const meta = PLACEMENT_META[placement];

  useEffect(() => {
    if (ADMOB_CONFIG.isNativePlatform) {
      showAdMobBanner();
      return () => {
        hideAdMobBanner();
      };
    }

    if (!countedRef.current) {
      countedRef.current = true;
      recordAdImpression('banner');
    }
  }, [placement]);

  // On native Android/iOS, the native AdMob banner overlays the bottom edge;
  // reserve clean vertical clearance so no UI controls are obscured.
  if (ADMOB_CONFIG.isNativePlatform) {
    return <div className="h-[64px] w-full shrink-0" aria-hidden="true" />;
  }

  return (
    <aside
      aria-label={meta.title}
      className={`w-full rounded-xl border border-dashed border-[#D9A441]/30 bg-[#0A142D]/85 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
        compact ? 'px-4 py-2.5' : 'px-5 py-3.5'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`${
            compact ? 'w-7 h-7' : 'w-9 h-9'
          } rounded-lg bg-[#D9A441]/12 border border-[#D9A441]/30 text-[#F2C96B] flex items-center justify-center shrink-0`}
        >
          <Megaphone
            className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-[#F2C96B] truncate">
            {meta.title}
          </div>
          {!compact && (
            <p className="text-xs text-[#F8F5EE]/60 mt-0.5 truncate" dir="ltr">
              {ADMOB_CONFIG.bannerId}
            </p>
          )}
        </div>
      </div>

      <span className="text-[11px] text-[#F8F5EE]/45 whitespace-nowrap shrink-0 tabular-nums">
        {ADMOB_CONFIG.isTesting ? `تجريبي · ${meta.sizeLabel}` : meta.sizeLabel}
      </span>
    </aside>
  );
}
