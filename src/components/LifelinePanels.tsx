import { PhoneCall, Users, X } from 'lucide-react';
import {
  AudiencePollResult,
  OPTION_LETTERS,
  PhoneFriendResult,
} from '../types/game';

interface LifelinePanelsProps {
  audiencePoll: AudiencePollResult | null;
  phoneFriend: PhoneFriendResult | null;
  phoneDialing: boolean;
  onDismissAudience: () => void;
  onDismissPhone: () => void;
}

export function LifelinePanels({
  audiencePoll,
  phoneFriend,
  phoneDialing,
  onDismissAudience,
  onDismissPhone,
}: LifelinePanelsProps) {
  if (!audiencePoll && !phoneFriend && !phoneDialing) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {audiencePoll && (
        <div className="bg-[#0F1C3D]/95 border border-[#D9A441]/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#F2C96B]">
              <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>تصويت جمهور الاستوديو</span>
            </div>
            <button
              type="button"
              onClick={onDismissAudience}
              aria-label="إغلاق تصويت الجمهور"
              className="p-1 text-[#F8F5EE]/55 hover:text-[#F8F5EE] transition-colors rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3 items-end h-28 pt-2">
            {audiencePoll.percentages.map((pct, idx) => (
              <div key={OPTION_LETTERS[idx]} className="flex flex-col items-center h-full justify-end">
                <span className="text-xs font-semibold text-[#F8F5EE]/90 tabular-nums mb-1.5">
                  {pct}%
                </span>
                <div className="w-full max-w-[38px] bg-white/10 rounded-t-md h-16 flex items-end overflow-hidden">
                  <div
                    className="w-full bg-[#D9A441] rounded-t-md transition-transform duration-300 origin-bottom"
                    style={{ height: `${Math.max(4, pct)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-[#F2C96B] mt-1.5">
                  {OPTION_LETTERS[idx]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(phoneDialing || phoneFriend) && (
        <div className="bg-[#0F1C3D]/95 border border-[#D9A441]/30 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#F2C96B]">
              <PhoneCall className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>اتصال بصديق</span>
            </div>
            {!phoneDialing && (
              <button
                type="button"
                onClick={onDismissPhone}
                aria-label="إغلاق نافذة الاتصال"
                className="p-1 text-[#F8F5EE]/55 hover:text-[#F8F5EE] transition-colors rounded"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {phoneDialing ? (
            <div className="py-6 text-center text-sm text-[#F8F5EE]/80">
              جاري الاتصال بصديقك في الاستوديو...
            </div>
          ) : (
            phoneFriend && (
              <div className="space-y-2">
                <div className="text-xs text-[#F8F5EE]/65 flex items-center gap-2">
                  <span className="font-semibold text-[#F8F5EE]">{phoneFriend.friendName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{phoneFriend.city}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums text-[#F2C96B]">
                    نسبة الثقة {phoneFriend.confidence}%
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-[#F8F5EE]/95">
                  «{phoneFriend.message}»
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
