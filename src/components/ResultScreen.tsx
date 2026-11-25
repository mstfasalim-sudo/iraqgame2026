import { useState } from 'react';
import {
  CheckCircle2,
  Coins,
  Home,
  PlayCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
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

  const isMillionaire = outcome.status === 'WON';
  const isWithdrawn = outcome.status === 'WITHDRAWN';

  const heading = isMillionaire
    ? 'مبارك لك! ربحت المليون العراقي'
    : isWithdrawn
      ? 'انسحاب ذكي بجائزة مضمونة'
      : outcome.status === 'TIMEOUT'
        ? 'انتهى الوقت وتوقفت الجولة هنا'
        : 'انتهت الجولة في الاستوديو';

  const subtitle = isMillionaire
    ? 'أجبت على جميع الأسئلة الخمسة عشر بنجاح وأثبتّ ثقافتك العراقية الأصيلة.'
    : isWithdrawn
      ? `قررت الانسحاب عند السؤال ${outcome.reachedLevel} والاحتفاظ بجائزتك الكاملة.`
      : outcome.finalPrize > 0
        ? `توقفت عند السؤال ${outcome.reachedLevel} وغادرت بجائزة محطة الأمان المضمونة.`
        : `توقفت عند السؤال ${outcome.reachedLevel}؛ ربحت عملات مشاركة ويمكنك المحاولة مجدداً الآن.`;

  const displayedCoins = doubled
    ? outcome.earnedCoins * 2
    : outcome.earnedCoins;

  const handleWatchDoubleAd = () => {
    if (doubled) return;
    soundEngine.playClick();
    onRequestAdReward({
      kind: 'double_result_coins',
      title: 'مضاعفة مكافأة الجولة (×2)',
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
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Main Result Card */}
        <section className="bg-[#0B1530]/95 border border-[#D9A441]/30 rounded-2xl p-7 sm:p-10 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#D9A441]/15 border border-[#D9A441]/40 text-[#F2C96B]">
            {isMillionaire ? (
              <Trophy className="h-7 w-7" aria-hidden="true" />
            ) : (
              <ShieldCheck className="h-7 w-7" aria-hidden="true" />
            )}
          </div>

          <div className="space-y-2 max-w-2xl mx-auto">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F8F5EE] [text-wrap:balance]">
              {heading}
            </h1>
            <p className="text-sm sm:text-base text-[#F8F5EE]/75 leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="py-5 border-y border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-[#F8F5EE]/55 mb-1">الجائزة النهائية</p>
              <p className="font-display text-4xl font-bold text-[#F2C96B] tabular-nums">
                {formatDinar(outcome.finalPrize)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#F8F5EE]/55 mb-1">
                العملات المكتسبة في هذه الجولة
              </p>
              <p className="font-display text-4xl font-bold text-emerald-300 tabular-nums flex items-center justify-center gap-2">
                <Coins className="h-6 w-6 text-[#D9A441]" aria-hidden="true" />
                <span>+{formatCoins(displayedCoins)}</span>
              </p>
            </div>
          </div>

          {/* ×2 Double Coins Rewarded Ad Banner */}
          {!doubled ? (
            <div className="bg-[#0F1C3D] border border-[#D9A441]/35 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-right">
              <div className="flex items-center gap-3">
                <Sparkles
                  className="h-5 w-5 text-[#F2C96B] shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <div className="text-sm font-bold text-[#F8F5EE]">
                    ضاعف عملاتك من +{outcome.earnedCoins} إلى +
                    {outcome.earnedCoins * 2} عملة!
                  </div>
                  <div className="text-xs text-[#F8F5EE]/65">
                    شاهد إعلان مكافأة سريع (5 ثوانٍ) لإضافة {outcome.earnedCoins}{' '}
                    عملة إضافية لرصيدك.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleWatchDoubleAd}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold bg-[#D9A441] hover:bg-[#F2C96B] text-[#060D1F] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
                <span>مضاعفة ×2 بإعلان</span>
              </button>
            </div>
          ) : (
            <div className="text-xs font-semibold text-emerald-400">
              تمت مضاعفة عملات الجولة وإضافتها إلى رصيدك الإجمالي (
              {formatCoins(totalCoins)}).
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 text-center pt-1">
            <div>
              <p className="text-xs text-[#F8F5EE]/55 mb-1">الإجابات الصحيحة</p>
              <p className="text-lg font-bold text-[#F8F5EE] tabular-nums">
                {outcome.correctCount} / 15
              </p>
            </div>
            <div>
              <p className="text-xs text-[#F8F5EE]/55 mb-1">رصيدك الكلي</p>
              <p className="text-lg font-bold text-[#F2C96B] tabular-nums">
                {formatCoins(totalCoins)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#F8F5EE]/55 mb-1">أفضل جائزة</p>
              <p className="text-lg font-bold text-[#F8F5EE] tabular-nums">
                {formatDinar(bestPrize)}
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onPlayAgain();
              }}
              className="inline-flex items-center gap-2 px-7 py-3 text-sm sm:text-base font-bold text-[#060D1F] bg-[#D9A441] hover:bg-[#F2C96B] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>العب جولة جديدة</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onBackToMenu();
              }}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm sm:text-base font-medium text-[#F8F5EE] bg-white/10 hover:bg-white/15 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              <span>العودة للرئيسية</span>
            </button>
          </div>
        </section>

        {/* Monetizable Result Banner Ad Slot */}
        <AdBannerSlot placement="result" />

        {/* Session Question Review */}
        {outcome.history.length > 0 && (
          <section aria-labelledby="review-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2
                id="review-heading"
                className="font-display text-2xl font-bold text-[#F8F5EE]"
              >
                مراجعة أسئلة الجولة
              </h2>
              <span className="text-xs text-[#F8F5EE]/55 tabular-nums">
                {outcome.history.length} سؤال
              </span>
            </div>

            <div className="divide-y divide-white/10 border-t border-b border-white/10">
              {outcome.history.map((record) => {
                const correctLetter =
                  OPTION_LETTERS[record.question.correctIndex];
                const correctText =
                  record.question.options[record.question.correctIndex];

                return (
                  <article
                    key={`${record.level}-${record.question.id}`}
                    className="py-5 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3 text-xs text-[#F8F5EE]/60">
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums font-semibold text-[#F8F5EE]/85">
                          السؤال {record.level}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{record.question.category}</span>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 font-semibold ${
                          record.wasCorrect
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}
                      >
                        {record.wasCorrect ? (
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <XCircle className="h-4 w-4" aria-hidden="true" />
                        )}
                        <span>
                          {record.wasCorrect ? 'إجابة صحيحة' : 'إجابة خاطئة'}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-semibold text-[#F8F5EE] leading-snug">
                      {record.question.question}
                    </h3>

                    <div className="text-sm text-[#F2C96B]">
                      الجواب الصحيح: ({correctLetter}) {correctText}
                    </div>

                    <p className="text-sm text-[#F8F5EE]/65 leading-relaxed">
                      {record.question.explanation}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
