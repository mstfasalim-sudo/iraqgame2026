export interface WisdomSharePayload {
  question: string;
  proverbText?: string;
  explanation: string;
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';

const PROMO_LINE = 'حمّل لعبة أمثال وتحديات العراق وجرّب ذكاءك! 🇮🇶';

export function formatWisdomShareText(payload: WisdomSharePayload): string {
  const { question, proverbText, explanation } = payload;

  if (proverbText && proverbText.trim().length > 0) {
    return `«${proverbText.trim()}»\n\nالحكمة والتفسير: ${explanation.trim()}\n\n${PROMO_LINE}`;
  }

  return `${question.trim()}\n\nالتفسير: ${explanation.trim()}\n\n${PROMO_LINE}`;
}

async function copyTextFallback(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to legacy textarea copy
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Shares a proverb/question and its wisdom via native Web Share API,
 * falling back cleanly to clipboard copy on browsers without navigator.share.
 */
export async function shareWisdom(
  payload: WisdomSharePayload
): Promise<ShareResult> {
  const text = formatWisdomShareText(payload);

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: 'حكمة من لعبة المليون العراقي',
        text,
      });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'cancelled';
      }
      // Fall through to clipboard copy if share sheet fails
    }
  }

  const copied = await copyTextFallback(text);
  return copied ? 'copied' : 'failed';
}
