import { ArrowLeft, Lock, Sparkles } from 'lucide-react';
import { PROVERBS_QUESTIONS } from '../data/questions';
import { soundEngine } from '../utils/sound';
import { AdBannerSlot } from './AdBannerSlot';

interface ProverbsArchiveProps {
  onPlayProverbs: () => void;
}

export function ProverbsArchive({ onPlayProverbs }: ProverbsArchiveProps) {
  return (
    <section
      className="max-w-4xl mx-auto px-5 sm:px-6 py-10 sm:py-14 space-y-8"
      aria-labelledby="proverbs-challenge-heading"
    >
      <div className="bg-[#0B1530] border border-[#D9A441]/30 rounded-2xl p-8 sm:p-12 text-center space-y-7">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#D9A441]/15 border border-[#D9A441]/35 text-[#F2C96B] mx-auto">
          <Sparkles className="h-8 w-8" aria-hidden="true" />
        </div>

        <div className="space-y-3 max-w-xl mx-auto">
          <div className="text-sm text-[#D9A441] flex items-center justify-center gap-2 tabular-nums">
            <span>{PROVERBS_QUESTIONS.length} مثل عراقي</span>
            <span aria-hidden="true">·</span>
            <span>بغدادي · جنوبي · موصلي · فرات أوسط</span>
          </div>

          <h1
            id="proverbs-challenge-heading"
            className="font-display text-3xl sm:text-4xl font-bold text-[#F8F5EE] [text-wrap:balance]"
          >
            تحدي الأمثال العراقية
          </h1>

          <p className="text-base text-[#F8F5EE]/75 leading-relaxed">
            اكتشف الأمثال الشعبية وأجوبتها داخل المسابقة فقط لمتعة التحدي الحقيقية.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-[#F8F5EE]/55">
          <Lock className="h-4 w-4 text-[#D9A441] shrink-0" aria-hidden="true" />
          <span>الأسئلة والأجوبة مخفية هنا وتظهر أثناء اللعب فقط</span>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onPlayProverbs();
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-4.5 text-lg font-bold text-[#060D1F] bg-[#D9A441] hover:bg-[#F2C96B] rounded-2xl transition-colors whitespace-nowrap cursor-pointer shadow-lg shadow-[#D9A441]/15"
          >
            <span>ابدأ تحدي الأمثال الآن</span>
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <AdBannerSlot placement="proverbs" />
    </section>
  );
}
