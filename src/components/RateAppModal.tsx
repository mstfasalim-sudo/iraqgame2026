import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Award, Star, X } from 'lucide-react';
import { triggerCorrectHaptic } from '../utils/haptics';
import { soundEngine } from '../utils/sound';
import {
  markRankUpRatePromptShown,
  openStoreRatingPage,
} from '../utils/store';

interface RateAppModalProps {
  open: boolean;
  rankTitle?: string | null;
  onClose: () => void;
  onRated?: () => void;
}

export function RateAppModal({
  open,
  rankTitle,
  onClose,
  onRated,
}: RateAppModalProps) {
  const [selectedStars, setSelectedStars] = useState(5);

  const handleDismiss = () => {
    soundEngine.playClick();
    markRankUpRatePromptShown();
    onClose();
  };

  const handleRateNow = () => {
    soundEngine.playReward();
    triggerCorrectHaptic();
    markRankUpRatePromptShown();
    openStoreRatingPage();
    onRated?.();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="rate-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rate-modal-title"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.42, ease: 'easeInOut' }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-[#0B1530] border border-[#D9A441]/40 p-6 text-center space-y-5 shadow-2xl relative"
          >
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="إغلاق"
              className="absolute left-3.5 top-3.5 p-2 rounded-lg text-[#F8F5EE]/55 hover:text-[#F8F5EE] hover:bg-white/10 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#D9A441]/15 border border-[#D9A441]/40 flex items-center justify-center text-[#F2C96B]">
              {rankTitle ? (
                <Award className="h-7 w-7" aria-hidden="true" />
              ) : (
                <Star className="h-7 w-7 fill-[#F2C96B]" aria-hidden="true" />
              )}
            </div>

            <div className="space-y-1.5">
              {rankTitle && (
                <p className="text-xs font-bold text-[#F2C96B]">
                  مبارك ترقيتك إلى لقب «{rankTitle}»!
                </p>
              )}
              <h2
                id="rate-modal-title"
                className="font-display text-2xl font-bold text-[#F8F5EE]"
              >
                هل أعجبتك لعبة المليون العراقي؟
              </h2>
              <p className="text-xs sm:text-sm text-[#F8F5EE]/75 leading-relaxed">
                تقييمك اللطيف بـ 5 نجوم على المتجر يشجعنا على إضافة المزيد من
                الأمثال والألغاز العراقية الأصيلة مجاناً.
              </p>
            </div>

            {/* Interactive 5-Star Selector */}
            <div
              className="flex items-center justify-center gap-2 py-1"
              dir="ltr"
              role="radiogroup"
              aria-label="اختر عدد النجوم"
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const active = star <= selectedStars;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setSelectedStars(star);
                    }}
                    aria-label={`${star} نجوم`}
                    className="p-1 cursor-pointer transition-transform duration-300 hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors duration-300 ${
                        active
                          ? 'text-[#F2C96B] fill-[#F2C96B] drop-shadow-[0_0_8px_rgba(242,201,107,0.5)]'
                          : 'text-[#F8F5EE]/25'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleRateNow}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl text-sm sm:text-base font-bold text-[#060D1F] bg-gradient-to-l from-[#D9A441] via-[#F2C96B] to-[#D9A441] hover:brightness-105 shadow-lg shadow-[#D9A441]/20 cursor-pointer"
              >
                <span>قيّم التطبيق الآن ⭐</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="w-full py-2.5 text-xs sm:text-sm font-medium text-[#F8F5EE]/65 hover:text-[#F8F5EE] cursor-pointer"
              >
                ربما لاحقاً
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
