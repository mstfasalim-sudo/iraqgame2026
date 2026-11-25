import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  Database,
  Mail,
  Megaphone,
  Share2,
  ShieldCheck,
  Star,
  WifiOff,
  X,
} from 'lucide-react';
import { DEVELOPER_INFO } from '../utils/config';
import { soundEngine } from '../utils/sound';
import { shareAppWithFriends } from '../utils/store';

interface PrivacyAboutModalProps {
  open: boolean;
  onClose: () => void;
  onOpenRate: () => void;
  onNotify?: (message: string) => void;
}

export function PrivacyAboutModal({
  open,
  onClose,
  onOpenRate,
  onNotify,
}: PrivacyAboutModalProps) {
  const [copiedAppLink, setCopiedAppLink] = useState(false);

  const handleShareApp = async () => {
    soundEngine.playClick();
    const res = await shareAppWithFriends();
    if (res === 'copied') {
      setCopiedAppLink(true);
      onNotify?.('تم نسخ رابط التطبيق لمشاركته مع أصدقائك');
      window.setTimeout(() => setCopiedAppLink(false), 2200);
    } else if (res === 'shared') {
      onNotify?.('شكراً لمشاركة التطبيق مع أصدقائك');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="privacy-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-modal-title"
          onClick={() => {
            soundEngine.playClick();
            onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.42, ease: 'easeInOut' }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[88dvh] overflow-y-auto rounded-2xl bg-[#0B1530] border border-[#D9A441]/35 shadow-2xl"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3 bg-[#081026]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#D9A441]/15 border border-[#D9A441]/35 text-[#F2C96B] flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2
                    id="privacy-modal-title"
                    className="font-display text-lg sm:text-xl font-bold text-[#F8F5EE]"
                  >
                    سياسة الخصوصية وحول التطبيق
                  </h2>
                  <p className="text-[11px] text-[#F8F5EE]/55">
                    المليون العراقي · الإصدار {DEVELOPER_INFO.version}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onClose();
                }}
                aria-label="إغلاق"
                className="p-2 rounded-lg text-[#F8F5EE]/60 hover:text-[#F8F5EE] hover:bg-white/10 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Clean Privacy Policy Body */}
            <div className="p-5 space-y-4 text-sm text-[#F8F5EE]/85 leading-relaxed">
              <div className="rounded-xl bg-[#071026] border border-white/10 p-3.5 flex items-start gap-3">
                <Database
                  className="h-4 w-4 text-[#F2C96B] shrink-0 mt-1"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#F8F5EE]">
                    حفظ التقدم محلياً على جهازك
                  </h3>
                  <p className="text-xs text-[#F8F5EE]/70 mt-1">
                    يحفظ التطبيق اسم اللاعب، النقاط، الرتبة، الرصيد، والإعدادات
                    محلياً في ذاكرة جهازك فقط (LocalStorage)، ولا نقوم بجمع أو
                    تخزين أو مشاركة أي بيانات شخصية على خوادم خارجية.
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-[#071026] border border-white/10 p-3.5 flex items-start gap-3">
                <Megaphone
                  className="h-4 w-4 text-[#F2C96B] shrink-0 mt-1"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#F8F5EE]">
                    إعلانات Google AdMob
                  </h3>
                  <p className="text-xs text-[#F8F5EE]/70 mt-1">
                    يستخدم التطبيق خدمة إعلانات Google AdMob لعرض إعلانات مجانية
                    تدعم تطوير اللعبة واستمراريتها. قد تستخدم Google معرفات
                    إعلانية غير شخصية وفق سياسة خصوصية Google عند توفر الاتصال
                    بالإنترنت.
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-[#071026] border border-white/10 p-3.5 flex items-start gap-3">
                <WifiOff
                  className="h-4 w-4 text-[#F2C96B] shrink-0 mt-1"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#F8F5EE]">
                    العمل بدون إنترنت
                  </h3>
                  <p className="text-xs text-[#F8F5EE]/70 mt-1">
                    جميع الأسئلة والأمثال والحكم محفوظة داخل التطبيق لتستمتع
                    باللعب دون إنترنت في أي وقت.
                  </p>
                </div>
              </div>

              {/* Fixed Immutable Developer Credit */}
              <div className="rounded-xl bg-[#08122B] border border-[#D9A441]/30 p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#F2C96B]">
                  <span>تطوير:</span>
                  <span dir="ltr" className="tracking-wide text-[#F8F5EE]">
                    {DEVELOPER_INFO.name}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#F8F5EE]/75">
                  <Mail
                    className="h-3.5 w-3.5 text-[#D9A441] shrink-0"
                    aria-hidden="true"
                  />
                  <span>حساب التواصل:</span>
                  <a
                    href={`mailto:${DEVELOPER_INFO.email}`}
                    dir="ltr"
                    className="font-medium text-[#F2C96B] hover:underline"
                  >
                    {DEVELOPER_INFO.email}
                  </a>
                </div>
              </div>

              {/* Clean Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleShareApp}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-[#060D1F] bg-[#D9A441] hover:bg-[#F2C96B] cursor-pointer"
                >
                  {copiedAppLink ? (
                    <>
                      <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>تم نسخ رابط التطبيق</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>مشاركة التطبيق مع الأصدقاء</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    onClose();
                    onOpenRate();
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-[#F2C96B] border border-[#D9A441]/40 bg-[#0D1A3B] hover:bg-[#D9A441]/15 whitespace-nowrap cursor-pointer"
                >
                  <Star className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>قيّم التطبيق ⭐</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
