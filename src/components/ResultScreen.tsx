import { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coins,
  Home,
  PlayCircle,
  RotateCcw,
  ShieldCheck,
  Trophy,
  XCircle,
} from 'lucide-react';
import {
  AdRewardRequest,
  GameOutcome,
  OPTION_LETTERS,
  formatCoins,
  formatDinar,
} from '../types/game';
import { soundEngine } from '../utils/sound';
import { AdBannerSlot } from './AdBannerSlot';

interface ResultScreenProps {
  outcome: GameOutcome;
  bestPrize: number;
  totalCoins: number;
  onDoubleCoinsReward: (bonusAmount: number) => void;
  onRequestAdReward: (request: AdRewardRequest) => void;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function ResultScreen({
  outcome,
  bestPrize,
  totalCoins,
  onDoubleCoinsReward,
  onRequestAdReward,
  onPlayAgain,
  onBackToMenu,
}: ResultScreenProps) {
  const [doubled, setDoubled] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const isMillionaire = outcome.status === 'WON';
  const isWithdrawn = outcome.status === 'WITHDRAWN';

  const heading = isMillionaire
    ? 'مبارك! ربحت المليون العراقي'
    : isWithdrawn
      ? 'انسحاب بجائزة مضمونة'
      : outcome.status === 'TIMEOUT'
        ? 'انتهى الوقت'
        : 'انتهت الجولة';

  const displayedCoins = doubled
    ? outcome.earnedCoins * 2
    : outcome.earnedCoins;

  const handleWatchDoubleAd = () => {
    if (doubled) return;
    soundEngine.playClick();
    onRequestAdReward({
      kind: 'double_result_coins',
      title: 'مضاعفة عملات الجولة (×2)',
      rewardLabel: `+${outcome.earnedCoins} عملة إضافية`,
      coinsAmount: outcome.earnedCoins,
      onComplete: () => {
        setDoubled(true);
        onDoubleCoinsReward(outcome.earnedCoins);
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#060D1F] text-[#F8F5EE] studio-spotlight py-10 px-5 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-7">
        {/* Main Result Card */}
        <section className="bg-[#0B1530]/95 border border-[#D9A441]/30 rounded-2xl p-7 sm:p-10 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#D9A441]/15 border border-[#D9A441]/40 text-[#F2C96B]">
            {isMillionaire ? (
              <Trophy className="h-8 w-8" aria-hidden="true" />
            ) : (
              <ShieldCheck className="h-8 w-8" aria-hidden="true" />
            )}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F8F5EE] [text-wrap:balance]">
            {heading}
          </h1>

          <div className="py-5 border-y border-white/10 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#F8F5EE]/55 mb-1">الجائزة</p>
              <p className="font-display text-3xl sm:text-4xl font-bold text-[#F2C96B] tabular-nums">
                {formatDinar(outcome.finalPrize)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#F8F5EE]/55 mb-1">العملات</p>
              <p className="font-display text-3xl sm:text-4xl font-bold text-emerald-300 tabular-nums flex items-center justify-center gap-1.5">
                <Coins className="h-6 w-6 text-[#D9A441]" aria-hidden="true" />
                <span>+{formatCoins(displayedCoins)}</span>
              </p>
            </div>
          </div>

          {/* ×2 Double Coins Button */}
          {!doubled ? (
            <button
              type="button"
              onClick={handleWatchDoubleAd}
              className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl text-base font-bold bg-[#0F1C3D] border border-[#D9A441]/45 hover:bg-[#D9A441]/15 text-[#F2C96B] transition-colors whitespace-nowrap cursor-pointer"
            >
              <PlayCircle className="h-5 w-5" aria-hidden="true" />
              <span>مضاعفة العملات ×2 بإعلان (+{outcome.earnedCoins})</span>
            </button>
          ) : (
            <div className="text-sm font-semibold text-emerald-400">
              تمت المضاعفة · رصيدك {formatCoins(totalCoins)}
            </div>
          )}

          <div className="flex items-center justify-center gap-6 text-sm text-[#F8F5EE]/70 tabular-nums">
            <span>الصحيحة: {outcome.correctCount} / 15</span>
            <span aria-hidden="true">·</span>
            <span>الأعلى: {formatDinar(bestPrize)}</span>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onPlayAgain();
              }}
              className="inline-flex items-center justify-center gap-2.5 px-9 py-4 text-lg font-bold text-[#060D1F] bg-[#D9A441] hover:bg-[#F2C96B] rounded-2xl transition-colors whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
              <span>العب مجدداً</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onBackToMenu();
              }}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 text-lg font-semibold text-[#F8F5EE] bg-white/10 hover:bg-white/15 rounded-2xl transition-colors whitespace-nowrap cursor-pointer"
            >
              <Home className="h-5 w-5" aria-hidden="true" />
              <span>الرئيسية</span>
            </button>
          </div>
        </section>

        <AdBannerSlot placement="result" />

        {/* Collapsible Session Review */}
        {outcome.history.length > 0 && (
          <section className="space-y-3">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setShowReview((prev) => !prev);
              }}
              className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl bg-[#0B1530] border border-white/10 text-sm sm:text-base font-semibold text-[#F8F5EE]/85 hover:text-[#F8F5EE] transition-colors cursor-pointer"
            >
              <span>مراجعة أسئلة جولتك ({outcome.history.length})</span>
              {showReview ? (
                <ChevronUp className="h-5 w-5 text-[#D9A441]" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-5 w-5 text-[#D9A441]" aria-hidden="true" />
              )}
            </button>

            {showReview && (
              <div className="divide-y divide-white/10 bg-[#0B1530]/70 border border-white/10 rounded-xl px-5">
                {outcome.history.map((record) => {
                  const correctLetter =
                    OPTION_LETTERS[record.question.correctIndex];
                  const correctText =
                    record.question.options[record.question.correctIndex];

                  return (
                    <article
                      key={`${record.level}-${record.question.id}`}
                      className="py-4 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-3 text-xs text-[#F8F5EE]/60">
                        <span className="tabular-nums font-semibold">
                          السؤال {record.level}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${
                            record.wasCorrect ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {record.wasCorrect ? (
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <XCircle className="h-4 w-4" aria-hidden="true" />
                          )}
                          <span>{record.wasCorrect ? 'صحيح' : 'خطأ'}</span>
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-[#F8F5EE]">
                        {record.question.question}
                      </h3>
                      <div className="text-sm text-[#F2C96B]">
                        الجواب: ({correctLetter}) {correctText}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
