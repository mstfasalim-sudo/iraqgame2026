import { Check, ShieldCheck, Trophy } from 'lucide-react';
import { PRIZE_LADDER } from '../types/game';

interface PrizeLadderProps {
  currentLevel: number; // 1 to 15
  clearedLevel: number; // 0 to 15
}

export function PrizeLadder({ currentLevel, clearedLevel }: PrizeLadderProps) {
  const reversedLadder = [...PRIZE_LADDER].reverse();

  return (
    <aside
      aria-label="سلم الجوائز"
      className="bg-[#0B1530]/90 border border-[#D9A441]/20 rounded-xl p-3.5 flex flex-col justify-between h-full"
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <h2 className="text-base font-bold text-[#F8F5EE] font-display">
          سلم الجوائز
        </h2>
        <span className="text-xs text-[#F8F5EE]/60 tabular-nums">
          15 مرحلة
        </span>
      </div>

      <ol className="space-y-0.5 flex-1 flex flex-col justify-between">
        {reversedLadder.map((step) => {
          const isCurrent = step.level === currentLevel;
          const isCleared = step.level <= clearedLevel;
          const isMilestone = Boolean(step.isSafeHaven || step.isGrandPrize);

          return (
            <li
              key={step.level}
              aria-current={isCurrent ? 'step' : undefined}
              className={`flex items-center justify-between px-2.5 py-1 rounded-lg text-xs xl:text-sm transition-colors duration-150 ${
                isCurrent
                  ? 'bg-[#D9A441] text-[#060D1F] font-bold shadow-sm'
                  : isCleared
                    ? 'text-emerald-300/90 bg-emerald-500/10'
                    : isMilestone
                      ? 'text-[#F2C96B] font-semibold'
                      : 'text-[#F8F5EE]/75'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-6 text-right tabular-nums text-xs ${
                    isCurrent
                      ? 'text-[#060D1F]/80 font-bold'
                      : isCleared
                        ? 'text-emerald-300'
                        : 'text-[#F8F5EE]/45'
                  }`}
                >
                  {step.level}
                </span>

                {step.isGrandPrize ? (
                  <Trophy
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isCurrent ? 'text-[#060D1F]' : 'text-[#D9A441]'
                    }`}
                    aria-hidden="true"
                  />
                ) : step.isSafeHaven ? (
                  <ShieldCheck
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isCurrent
                        ? 'text-[#060D1F]'
                        : isCleared
                          ? 'text-emerald-400'
                          : 'text-[#D9A441]'
                    }`}
                    aria-hidden="true"
                  />
                ) : isCleared ? (
                  <Check
                    className="h-3.5 w-3.5 shrink-0 text-emerald-400"
                    aria-hidden="true"
                  />
                ) : (
                  <span className="w-3.5 shrink-0" aria-hidden="true" />
                )}

                {step.isSafeHaven && !isCurrent && (
                  <span className="text-[11px] text-[#D9A441]/80 hidden xl:inline whitespace-nowrap">
                    أمان
                  </span>
                )}
                {step.isGrandPrize && !isCurrent && (
                  <span className="text-[11px] text-[#D9A441]/90 hidden xl:inline whitespace-nowrap">
                    المليون
                  </span>
                )}
              </div>

              <span className="tabular-nums tracking-wide whitespace-nowrap">
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="pt-3 mt-3 border-t border-white/10 text-xs text-[#F8F5EE]/55 flex items-center justify-between">
        <span>محطات الأمان</span>
        <span className="tabular-nums text-[#F2C96B]/90">1,000 · 32,000</span>
      </div>
    </aside>
  );
}
