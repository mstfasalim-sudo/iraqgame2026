import { useEffect, useRef } from 'react';
import { Megaphone } from 'lucide-react';
import {
  ADMOB_CONFIG,
  BannerPlacement,
  hideAdMobBanner,
  recordAdImpression,
  showAdMobBanner,
} from '../utils/ads';
import { TEST_MODE } from '../utils/config';
import { useOnlineStatus } from '../utils/offline';

interface AdBannerSlotProps {
  placement: BannerPlacement;
  compact?: boolean;
}

export function AdBannerSlot({ placement, compact = false }: AdBannerSlotProps) {
  const countedRef = useRef(false);
  const online = useOnlineStatus();

  useEffect(() => {
    if (!online) {
      if (ADMOB_CONFIG.isNativePlatform) {
        hideAdMobBanner();
      }
      return;
    }

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
  }, [placement, online]);

  // Hide ads cleanly while offline; they reappear automatically once connection returns
  if (!online) {
    return null;
  }

  // On native Android/iOS, the native AdMob banner overlays the bottom edge;
  // reserve clean vertical clearance so no UI controls are obscured.
  if (ADMOB_CONFIG.isNativePlatform) {
    return (
      <div
        className={`${compact ? 'h-[54px]' : 'h-[64px]'} w-full shrink-0`}
        aria-hidden="true"
      />
    );
  }

  return (
    <aside
      aria-label="مساحة إعلانية"
      className={`w-full rounded-lg border border-white/10 bg-[#0A142D]/75 flex items-center justify-between gap-2.5 ${
        compact ? 'px-3 py-1.5' : 'px-5 py-3'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Megaphone
          className="h-4 w-4 text-[#D9A441]/75 shrink-0"
          aria-hidden="true"
        />
        <span className="text-xs text-[#F8F5EE]/55 truncate">
          {TEST_MODE
            ? `AdMob Banner (${ADMOB_CONFIG.bannerId})`
            : 'مساحة إعلانية'}
        </span>
      </div>

      {TEST_MODE && (
        <span className="text-[11px] text-[#F2C96B]/70 whitespace-nowrap shrink-0">
          وضع الاختبار
        </span>
      )}
    </aside>
  );
}
