import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

function vibrateWeb(pattern: number | number[]): void {
  try {
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.vibrate === 'function'
    ) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore unsupported or blocked vibration calls
  }
}

/**
 * Light, subtle haptic tap when selecting an answer button.
 */
export function triggerAnswerTapHaptic(): void {
  if (Capacitor.isNativePlatform()) {
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  } else {
    vibrateWeb(14);
  }
}

/**
 * Subtle celebratory haptic pulse when the revealed answer is correct.
 */
export function triggerCorrectHaptic(): void {
  if (Capacitor.isNativePlatform()) {
    Haptics.notification({ type: NotificationType.Success }).catch(() => {});
  } else {
    vibrateWeb([18, 35, 24]);
  }
}

/**
 * Gentle error haptic feedback when an answer is wrong or time expires.
 */
export function triggerWrongHaptic(): void {
  if (Capacitor.isNativePlatform()) {
    Haptics.notification({ type: NotificationType.Error }).catch(() => {});
  } else {
    vibrateWeb([35, 30, 35]);
  }
}
