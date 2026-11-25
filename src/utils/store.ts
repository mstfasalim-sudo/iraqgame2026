const RATE_PROMPT_SHOWN_KEY = 'iraqi_millionaire_rate_prompt_shown_v1';

export const APP_PACKAGE_NAME = 'com.iraqimillion.app';
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${APP_PACKAGE_NAME}`;

export function hasShownRankUpRatePrompt(): boolean {
  try {
    return window.localStorage.getItem(RATE_PROMPT_SHOWN_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markRankUpRatePromptShown(): void {
  try {
    window.localStorage.setItem(RATE_PROMPT_SHOWN_KEY, 'true');
  } catch {
    // Ignore storage errors
  }
}

/**
 * Opens the app's Google Play Store rating page safely without relying on window.open.
 */
export function openStoreRatingPage(): void {
  try {
    const link = document.createElement('a');
    link.href = PLAY_STORE_URL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch {
    // Ignore navigation restrictions in embedded previews
  }
}

/**
 * Shares the app link with friends via native Web Share API or clipboard fallback.
 */
export async function shareAppWithFriends(): Promise<
  'shared' | 'copied' | 'cancelled' | 'failed'
> {
  const text = `جرّب لعبة «المليون العراقي» — أكثر من 240 مثل ولغز وسؤال من تراث العراق! 🇮🇶\n${PLAY_STORE_URL}`;

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: 'المليون العراقي',
        text,
        url: PLAY_STORE_URL,
      });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'cancelled';
      }
    }
  }

  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return 'copied';
    }
  } catch {
    // Fall through
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok ? 'copied' : 'failed';
  } catch {
    return 'failed';
  }
}
