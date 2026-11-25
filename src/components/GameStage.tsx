import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Coins,
  HeartHandshake,
  Home,
  Layers,
  LogOut,
  Music,
  PhoneCall,
  PlayCircle,
  RefreshCw,
  Scissors,
  Users,
  Volume2,
  VolumeX,
  X,
  XCircle,
} from 'lucide-react';
import {
  AdRewardRequest,
  AudiencePollResult,
  COIN_COSTS,
  GameMode,
  GameOutcome,
  LifelineKey,
  LifelinesState,
  OPTION_LETTERS,
  PRIZE_LADDER,
  PhoneFriendResult,
  QUESTION_TIMER_SECONDS,
  QuizQuestion,
  SessionRecord,
  UserProfile,
  UserSettings,
  formatCoins,
  formatDinar,
  getCoinsForLevel,
  getSafeHavenPrize,
} from '../types/game';
import {
  buildGameDeck,
  pickReplacementQuestion,
  simulateAudiencePoll,
  simulatePhoneFriend,
} from '../utils/gameLogic';
import { soundEngine } from '../utils/sound';
import { AdBannerSlot } from './AdBannerSlot';
import { LifelinePanels } from './LifelinePanels';
import { PrizeLadder } from './PrizeLadder';

interface GameStageProps {
  mode: GameMode;
  profile: UserProfile;
  settings: UserSettings;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onSpendCoins: (amount: number) => boolean;
  onRequestAdReward: (request: AdRewardRequest) => void;
  onExitToMenu: () => void;
  onFinishGame: (outcome: GameOutcome) => void;
}

type QuestionPhase = 'ANSWERING' | 'LOCKED' | 'REVEALED';

const STUDIO_BG = '/src/assets/images/studio_backdrop_1795522141754.jpg';

const LIFELINE_LABELS: Record<LifelineKey, string> = {
  fiftyFifty: 'حذف إجابتين',
  audience: 'رأي الجمهور',
  phoneFriend: 'اتصال بصديق',
  swapQuestion: 'تبديل السؤال',
};

const MOTIVATIONAL_PHRASES = [
  'عاشت إيدك! إجابة صحيحة وتصفيق حار من الجمهور',
  'برافو يا بطل! خطوة واثقة نحو المليون العراقي',
  'ممتاز! ثقافتك العراقية تتألق في الاستوديو',
  'أحسنت! إجابة دقيقة وموفّقة',
  'أداء رائع! الجمهور يحيّيك على هذا الذكاء',
];

export function GameStage({
  mode,
  profile,
  settings,
  onToggleSound,
  onToggleMusic,
  onSpendCoins,
  onRequestAdReward,
  onExitToMenu,
  onFinishGame,
}: GameStageProps) {
  const isInstantMode = settings.answerStyle === 'instant';

  const [deckState, setDeckState] = useState(() => buildGameDeck(mode));
  const [questionIndex, setQuestionIndex] = useState(0); // 0 to 14
  const [phase, setPhase] = useState<QuestionPhase>('ANSWERING');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
  const [lifelines, setLifelines] = useState<LifelinesState>({
    fiftyFifty: true,
    audience: true,
    phoneFriend: true,
    swapQuestion: true,
  });

  const [audiencePoll, setAudiencePoll] = useState<AudiencePollResult | null>(null);
  const [phoneFriend, setPhoneFriend] = useState<PhoneFriendResult | null>(null);
  const [phoneDialing, setPhoneDialing] = useState(false);

  const [secondsLeft, setSecondsLeft] = useState(QUESTION_TIMER_SECONDS);
  const [timedOut, setTimedOut] = useState(false);
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [reviveUsed, setReviveUsed] = useState(false);
  const [rechargePrompt, setRechargePrompt] = useState<LifelineKey | null>(null);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [showMobileLadder, setShowMobileLadder] = useState(false);

  const usedIdsRef = useRef<Set<string>>(
    new Set(deckState.deck.map((q) => q.id))
  );
  const revealTimeoutRef = useRef<number | null>(null);
  const dialTimeoutRef = useRef<number | null>(null);

  const currentQuestion: QuizQuestion = deckState.deck[questionIndex];
  const currentLevel = questionIndex + 1;
  const clearedLevel =
    phase === 'REVEALED' &&
    selectedOption === currentQuestion.correctIndex &&
    !timedOut
      ? currentLevel
      : questionIndex;

  const currentEarnedPrize =
    questionIndex > 0 ? PRIZE_LADDER[questionIndex - 1].amount : 0;
  const currentStepPrize = PRIZE_LADDER[questionIndex].amount;
  const lifelinesUsedCount = Object.values(lifelines).filter((v) => !v).length;

  const motivationalPraise = useMemo(() => {
    if (currentLevel === 15) return 'مبارك لك! ربحت المليون العراقي بتصفيق حار';
    if (currentLevel === 10)
      return 'مذهل! تجاوزت محطة الأمان الثانية وضمنت 32,000 دينار';
    if (currentLevel === 5)
      return 'رائع! تجاوزت محطة الأمان الأولى وضمنت 1,000 دينار';
    return MOTIVATIONAL_PHRASES[questionIndex % MOTIVATIONAL_PHRASES.length];
  }, [currentLevel, questionIndex]);

  // Start / stop interactive studio background music
  useEffect(() => {
    soundEngine.startStudioMusic(currentQuestion.difficulty);
    soundEngine.playQuestionIntro();
    return () => {
      soundEngine.stopStudioMusic();
      if (revealTimeoutRef.current) window.clearTimeout(revealTimeoutRef.current);
      if (dialTimeoutRef.current) window.clearTimeout(dialTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scale studio music intensity with question difficulty & pause during reveal
  useEffect(() => {
    if (phase === 'ANSWERING') {
      soundEngine.startStudioMusic(currentQuestion.difficulty);
    } else {
      soundEngine.stopStudioMusic();
    }
  }, [phase, currentQuestion.difficulty]);

  const handleTimeout = useCallback(() => {
    setTimedOut(true);
    setPhase('REVEALED');
    setRechargePrompt(null);
    soundEngine.playWrong();
    setHistory((prev) => [
      ...prev,
      {
        question: currentQuestion,
        selectedIndex: null,
        wasCorrect: false,
        level: currentLevel,
      },
    ]);
  }, [currentLevel, currentQuestion]);

  // Mandatory 25-second countdown timer
  useEffect(() => {
    if (
      phase !== 'ANSWERING' ||
      showWithdrawConfirm ||
      rechargePrompt !== null
    ) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId);
          handleTimeout();
          return 0;
        }
        if (prev <= 9) {
          soundEngine.playTick(prev <= 5);
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [phase, showWithdrawConfirm, rechargePrompt, handleTimeout]);

  const confirmAnswer = useCallback(
    (optionIdx: number) => {
      if (phase !== 'ANSWERING') return;
      if (eliminatedOptions.includes(optionIdx)) return;

      setRechargePrompt(null);
      setSelectedOption(optionIdx);
      setPhase('LOCKED');
      soundEngine.playLockIn();

      const delayMs = isInstantMode ? 480 : 950;
      revealTimeoutRef.current = window.setTimeout(() => {
        const isCorrect = optionIdx === currentQuestion.correctIndex;
        setPhase('REVEALED');

        setHistory((prev) => [
          ...prev,
          {
            question: currentQuestion,
            selectedIndex: optionIdx,
            wasCorrect: isCorrect,
            level: currentLevel,
          },
        ]);

        if (isCorrect) {
          if (currentLevel === 15) {
            soundEngine.playGrandVictory();
          } else {
            soundEngine.playCorrect(currentLevel === 5 || currentLevel === 10);
          }
        } else {
          soundEngine.playWrong();
        }
      }, delayMs);
    },
    [phase, eliminatedOptions, isInstantMode, currentQuestion, currentLevel]
  );

  const handleOptionClick = (idx: number) => {
    if (phase !== 'ANSWERING' || eliminatedOptions.includes(idx)) return;
    if (isInstantMode) {
      soundEngine.playClick();
      confirmAnswer(idx);
      return;
    }

    if (selectedOption === idx) {
      confirmAnswer(idx);
    } else {
      soundEngine.playSelect();
      setSelectedOption(idx);
    }
  };

  const applyRevive = useCallback(() => {
    setReviveUsed(true);
    setHistory((prev) => prev.slice(0, -1));
    if (
      selectedOption !== null &&
      selectedOption !== currentQuestion.correctIndex
    ) {
      setEliminatedOptions((prev) =>
        prev.includes(selectedOption) ? prev : [...prev, selectedOption]
      );
    }
    setSelectedOption(null);
    setTimedOut(false);
    setSecondsLeft(QUESTION_TIMER_SECONDS);
    setPhase('ANSWERING');
    soundEngine.playMotivationalStinger();
  }, [selectedOption, currentQuestion.correctIndex]);

  const handleReviveWithAd = () => {
    soundEngine.playClick();
    onRequestAdReward({
      kind: 'revive',
      title: 'إنقاذ الجولة — فرصة ثانية',
      rewardLabel: 'حذف الإجابة الخاطئة وإكمال السؤال بـ 25 ثانية جديدة',
      onComplete: applyRevive,
    });
  };

  const handleReviveWithCoins = () => {
    soundEngine.playClick();
    if (onSpendCoins(COIN_COSTS.revive)) {
      applyRevive();
    }
  };

  const handleNextStep = useCallback(() => {
    if (phase !== 'REVEALED') return;
    soundEngine.playClick();

    const wasCorrect =
      !timedOut && selectedOption === currentQuestion.correctIndex;

    if (wasCorrect) {
      if (currentLevel === 15) {
        soundEngine.stopStudioMusic();
        onFinishGame({
          status: 'WON',
          finalPrize: PRIZE_LADDER[14].amount,
          earnedCoins: getCoinsForLevel(15),
          reachedLevel: 15,
          correctCount: history.filter((h) => h.wasCorrect).length,
          lifelinesUsedCount,
          history,
          mode,
        });
        return;
      }

      setQuestionIndex((prev) => prev + 1);
      setPhase('ANSWERING');
      setSelectedOption(null);
      setEliminatedOptions([]);
      setAudiencePoll(null);
      setPhoneFriend(null);
      setPhoneDialing(false);
      setRechargePrompt(null);
      setSecondsLeft(QUESTION_TIMER_SECONDS);
      setTimedOut(false);
      soundEngine.playQuestionIntro();
    } else {
      soundEngine.stopStudioMusic();
      const safePrize = getSafeHavenPrize(questionIndex);
      onFinishGame({
        status: timedOut ? 'TIMEOUT' : 'LOST',
        finalPrize: safePrize,
        earnedCoins: getCoinsForLevel(questionIndex),
        reachedLevel: currentLevel,
        correctCount: history.filter((h) => h.wasCorrect).length,
        lifelinesUsedCount,
        history,
        mode,
      });
    }
  }, [
    phase,
    timedOut,
    selectedOption,
    currentQuestion.correctIndex,
    currentLevel,
    onFinishGame,
    history,
    lifelinesUsedCount,
    mode,
    questionIndex,
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (showWithdrawConfirm || showMobileLadder || rechargePrompt) return;
      if (phase === 'ANSWERING') {
        if (['1', '2', '3', '4'].includes(e.key)) {
          const idx = Number(e.key) - 1;
          if (!eliminatedOptions.includes(idx)) {
            if (isInstantMode) {
              soundEngine.playClick();
              confirmAnswer(idx);
            } else {
              soundEngine.playSelect();
              setSelectedOption(idx);
            }
          }
        } else if (e.key === 'Enter' && selectedOption !== null) {
          e.preventDefault();
          confirmAnswer(selectedOption);
        }
      } else if (phase === 'REVEALED' && e.key === 'Enter') {
        e.preventDefault();
        handleNextStep();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    phase,
    selectedOption,
    eliminatedOptions,
    showWithdrawConfirm,
    showMobileLadder,
    rechargePrompt,
    isInstantMode,
    confirmAnswer,
    handleNextStep,
  ]);

  const triggerLifeline = (key: LifelineKey) => {
    if (phase !== 'ANSWERING') return;

    if (!lifelines[key]) {
      soundEngine.playClick();
      setRechargePrompt(key);
      return;
    }

    setRechargePrompt(null);

    if (key === 'fiftyFifty') {
      soundEngine.playLifeline();
      const wrongIndices = [0, 1, 2, 3].filter(
        (i) => i !== currentQuestion.correctIndex && !eliminatedOptions.includes(i)
      );
      const toRemove = [...wrongIndices]
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);
      setEliminatedOptions((prev) => [...prev, ...toRemove]);
      if (selectedOption !== null && toRemove.includes(selectedOption)) {
        setSelectedOption(null);
      }
      setLifelines((prev) => ({ ...prev, fiftyFifty: false }));
    } else if (key === 'audience') {
      soundEngine.playLifeline();
      setAudiencePoll(simulateAudiencePoll(currentQuestion, eliminatedOptions));
      setLifelines((prev) => ({ ...prev, audience: false }));
    } else if (key === 'phoneFriend') {
      soundEngine.playLifeline();
      setLifelines((prev) => ({ ...prev, phoneFriend: false }));
      setPhoneDialing(true);
      dialTimeoutRef.current = window.setTimeout(() => {
        setPhoneDialing(false);
        setPhoneFriend(simulatePhoneFriend(currentQuestion, eliminatedOptions));
      }, 550);
    } else if (key === 'swapQuestion') {
      const { replacement, nextReserve } = pickReplacementQuestion(
        currentQuestion.difficulty,
        deckState.reserve,
        usedIdsRef.current,
        mode
      );
      if (!replacement) return;
      soundEngine.playLifeline();
      usedIdsRef.current.add(replacement.id);
      setDeckState((prev) => {
        const nextDeck = [...prev.deck];
        nextDeck[questionIndex] = replacement;
        return { deck: nextDeck, reserve: nextReserve };
      });
      setSelectedOption(null);
      setEliminatedOptions([]);
      setAudiencePoll(null);
      setPhoneFriend(null);
      setPhoneDialing(false);
      setSecondsLeft(QUESTION_TIMER_SECONDS);
      setLifelines((prev) => ({ ...prev, swapQuestion: false }));
      soundEngine.playQuestionIntro();
    }
  };

  const restoreLifeline = (key: LifelineKey) => {
    setLifelines((prev) => ({ ...prev, [key]: true }));
    setRechargePrompt(null);
    soundEngine.playMotivationalStinger();
  };

  const handleConfirmWithdraw = () => {
    soundEngine.stopStudioMusic();
    soundEngine.playWithdraw();
    onFinishGame({
      status: 'WITHDRAWN',
      finalPrize: currentEarnedPrize,
      earnedCoins: getCoinsForLevel(questionIndex),
      reachedLevel: currentLevel,
      correctCount: history.filter((h) => h.wasCorrect).length,
      lifelinesUsedCount,
      history,
      mode,
    });
  };

  const isAnswerCorrect =
    phase === 'REVEALED' &&
    !timedOut &&
    selectedOption === currentQuestion.correctIndex;

  const canRevive = phase === 'REVEALED' && !isAnswerCorrect && !reviveUsed;
  const timerPct = Math.max(
    0,
    Math.min(100, (secondsLeft / QUESTION_TIMER_SECONDS) * 100)
  );
  const timerUrgent = secondsLeft <= 8 && phase === 'ANSWERING';

  return (
    <div className="min-h-screen bg-[#060D1F] text-[#F8F5EE] relative flex flex-col">
      {/* Subtle Broadcast Backdrop */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <img
          src={STUDIO_BG}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#060D1F]/80 via-[#060D1F]/92 to-[#060D1F]" />
      </div>

      {/* Compact Studio Top HUD */}
      <header className="relative z-20 border-b border-white/10 bg-[#060D1F]/88 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                soundEngine.stopStudioMusic();
                onExitToMenu();
              }}
              className="inline-flex items-center gap-1.5 text-sm text-[#F8F5EE]/75 hover:text-[#F8F5EE] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">الرئيسية</span>
            </button>
            <span className="text-white/15 hidden sm:inline" aria-hidden="true">
              |
            </span>
            <span className="font-display text-lg sm:text-xl font-bold text-[#F2C96B] truncate">
              {profile.name}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-[#F2C96B] tabular-nums ml-1">
              <Coins className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{formatCoins(profile.coins)}</span>
            </div>

            {/* Mandatory 25s Countdown Readout */}
            <div
              aria-label={`الوقت المتبقي ${secondsLeft} ثانية من ${QUESTION_TIMER_SECONDS}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-bold tabular-nums whitespace-nowrap shrink-0 transition-colors ${
                timerUrgent
                  ? 'border-red-500/70 bg-red-500/20 text-red-200'
                  : 'border-[#D9A441]/35 bg-[#0D1938] text-[#F8F5EE]'
              }`}
            >
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{secondsLeft} ث</span>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setShowMobileLadder(true);
              }}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D9A441]/30 bg-[#0D1938] text-xs font-medium text-[#F2C96B] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Layers className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="tabular-nums">{formatDinar(currentStepPrize)}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onToggleMusic();
              }}
              aria-label={
                settings.musicEnabled
                  ? 'إيقاف موسيقى الاستوديو'
                  : 'تشغيل موسيقى الاستوديو'
              }
              title={
                settings.musicEnabled
                  ? 'إيقاف موسيقى الاستوديو'
                  : 'تشغيل موسيقى الاستوديو'
              }
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                settings.musicEnabled
                  ? 'border-[#D9A441]/40 bg-[#D9A441]/15 text-[#F2C96B]'
                  : 'border-white/15 bg-[#0D1938] text-[#F8F5EE]/45 hover:text-[#F8F5EE]'
              }`}
            >
              <Music className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                onToggleSound();
              }}
              aria-label={
                settings.soundEnabled
                  ? 'كتم المؤثرات والتصفيق'
                  : 'تشغيل المؤثرات والتصفيق'
              }
              title={
                settings.soundEnabled
                  ? 'كتم المؤثرات والتصفيق'
                  : 'تشغيل المؤثرات والتصفيق'
              }
              className="p-2 rounded-lg border border-white/15 bg-[#0D1938] text-[#F8F5EE]/80 hover:text-[#F8F5EE] transition-colors cursor-pointer"
            >
              {settings.soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </button>

            {phase === 'ANSWERING' && currentEarnedPrize > 0 && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setShowWithdrawConfirm(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D9A441]/40 text-xs font-medium text-[#F2C96B] hover:bg-[#D9A441]/15 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>انسحاب</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Broadcast Layout */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Primary Quiz Stage */}
          <div className="lg:col-span-9 space-y-5">
            {/* Clean Metadata & Lifelines */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex flex-wrap items-center gap-2 text-sm text-[#F8F5EE]/75">
                <span className="font-bold text-[#F8F5EE] tabular-nums">
                  السؤال {currentLevel} / 15
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-[#F2C96B]">{currentQuestion.category}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {formatDinar(currentStepPrize)}
                </span>
              </div>

              <div
                className="flex flex-wrap items-center gap-2"
                role="group"
                aria-label="وسائل المساعدة"
              >
                {(
                  [
                    { key: 'fiftyFifty', label: 'حذف إجابتين', Icon: Scissors },
                    { key: 'audience', label: 'الجمهور', Icon: Users },
                    { key: 'phoneFriend', label: 'صديق', Icon: PhoneCall },
                    { key: 'swapQuestion', label: 'تبديل', Icon: RefreshCw },
                  ] as const
                ).map(({ key, label, Icon }) => {
                  const available = lifelines[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={phase !== 'ANSWERING'}
                      onClick={() => triggerLifeline(key)}
                      title={
                        available
                          ? label
                          : `اضغط لاستعادة ${label} عبر إعلان أو عملات`
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        phase !== 'ANSWERING'
                          ? 'border-white/10 bg-white/5 text-[#F8F5EE]/30 cursor-not-allowed'
                          : available
                            ? 'border-[#D9A441]/40 bg-[#0E1C3F] text-[#F8F5EE] hover:bg-[#D9A441] hover:text-[#060D1F] cursor-pointer'
                            : 'border-dashed border-[#D9A441]/35 bg-[#0A132C] text-[#F2C96B]/75 hover:border-[#F2C96B] cursor-pointer'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{available ? label : `شحن ${label}`}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lifeline Recharge Inline Prompt */}
            {rechargePrompt && phase === 'ANSWERING' && (
              <div className="bg-[#0F1C3D] border border-[#D9A441]/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-[#F2C96B]">
                    استعادة وسيلة «{LIFELINE_LABELS[rechargePrompt]}»
                  </div>
                  <p className="text-xs text-[#F8F5EE]/70 mt-0.5">
                    شاهد إعلاناً قصيراً (5 ثوانٍ) مجاناً أو استخدم{' '}
                    {COIN_COSTS.restoreLifeline} عملة من رصيدك.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onRequestAdReward({
                        kind: 'restore_lifeline',
                        title: `استعادة وسيلة ${LIFELINE_LABELS[rechargePrompt]}`,
                        rewardLabel: `إعادة تفعيل ${LIFELINE_LABELS[rechargePrompt]}`,
                        lifelineKey: rechargePrompt,
                        onComplete: () => restoreLifeline(rechargePrompt),
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#D9A441] hover:bg-[#F2C96B] text-[#060D1F] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>استعادة بإعلان</span>
                  </button>

                  <button
                    type="button"
                    disabled={profile.coins < COIN_COSTS.restoreLifeline}
                    onClick={() => {
                      soundEngine.playClick();
                      if (onSpendCoins(COIN_COSTS.restoreLifeline)) {
                        restoreLifeline(rechargePrompt);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      profile.coins >= COIN_COSTS.restoreLifeline
                        ? 'bg-white/12 hover:bg-white/20 text-[#F8F5EE] cursor-pointer'
                        : 'bg-white/5 text-[#F8F5EE]/35 cursor-not-allowed'
                    }`}
                  >
                    <Coins
                      className="h-3.5 w-3.5 text-[#F2C96B]"
                      aria-hidden="true"
                    />
                    <span>{COIN_COSTS.restoreLifeline} عملة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setRechargePrompt(null);
                    }}
                    aria-label="إغلاق"
                    className="p-1.5 text-[#F8F5EE]/60 hover:text-[#F8F5EE] cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Audience Poll / Phone Friend Output */}
            <LifelinePanels
              audiencePoll={audiencePoll}
              phoneFriend={phoneFriend}
              phoneDialing={phoneDialing}
              onDismissAudience={() => {
                soundEngine.playClick();
                setAudiencePoll(null);
              }}
              onDismissPhone={() => {
                soundEngine.playClick();
                setPhoneFriend(null);
              }}
            />

            {/* Withdraw Inline Confirmation */}
            {showWithdrawConfirm && (
              <div
                role="dialog"
                aria-label="تأكيد الانسحاب"
                className="bg-[#112046] border border-[#D9A441]/45 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <h3 className="text-base font-bold text-[#F2C96B]">
                    الانسحاب والاحتفاظ بمبلغ {formatDinar(currentEarnedPrize)}؟
                  </h3>
                  <p className="text-xs text-[#F8F5EE]/70 mt-1">
                    ستغادر الاستوديو بكامل رصيدك المحقق وعملات المرحلة.
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setShowWithdrawConfirm(false);
                    }}
                    className="px-4 py-2 text-xs font-medium text-[#F8F5EE]/80 bg-white/10 rounded-lg hover:text-[#F8F5EE] whitespace-nowrap cursor-pointer"
                  >
                    إكمال اللعب
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmWithdraw}
                    className="px-4 py-2 text-xs font-bold text-[#060D1F] bg-[#D9A441] hover:bg-[#F2C96B] rounded-lg whitespace-nowrap cursor-pointer"
                  >
                    تأكيد الانسحاب
                  </button>
                </div>
              </div>
            )}

            {/* Mandatory 25-Second Visual Countdown Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-[#F8F5EE]/60">
                <span>الوقت الإجباري للسؤال</span>
                <span
                  className={`tabular-nums font-semibold ${
                    timerUrgent ? 'text-red-300' : 'text-[#F2C96B]'
                  }`}
                >
                  {secondsLeft} / {QUESTION_TIMER_SECONDS} ثانية
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    timerUrgent ? 'bg-red-500' : 'bg-[#D9A441]'
                  }`}
                  style={{ width: `${timerPct}%` }}
                />
              </div>
            </div>

            {/* Question Box */}
            <div className="p-[1.5px] bg-gradient-to-r from-[#D9A441]/30 via-[#F2C96B]/70 to-[#D9A441]/30 studio-frame">
              <div className="bg-[#0C1838] px-7 sm:px-12 py-7 sm:py-9 text-center studio-frame min-h-[136px] flex items-center justify-center">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F8F5EE] leading-[1.45] [text-wrap:balance] max-w-3xl">
                  {currentQuestion.question}
                </h1>
              </div>
            </div>

            {/* 4 Answer Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {currentQuestion.options.map((optionText, idx) => {
                const isEliminated = eliminatedOptions.includes(idx);
                const isSelected = selectedOption === idx;
                const isCorrectOption = idx === currentQuestion.correctIndex;

                let borderClass =
                  'from-[#D9A441]/25 via-[#D9A441]/45 to-[#D9A441]/25';
                let innerClass =
                  'bg-[#0B1530] hover:bg-[#13244E] text-[#F8F5EE]';
                let letterClass = 'text-[#F2C96B]';
                let stateLabel: string | null = null;

                if (isEliminated) {
                  borderClass = 'from-white/5 via-white/10 to-white/5';
                  innerClass = 'bg-[#070E22]/60 text-[#F8F5EE]/20';
                  letterClass = 'text-[#F8F5EE]/20';
                } else if (phase === 'REVEALED') {
                  if (isCorrectOption && (isAnswerCorrect || !canRevive)) {
                    borderClass =
                      'from-emerald-400 via-emerald-300 to-emerald-400';
                    innerClass = 'bg-emerald-700/90 text-white font-semibold';
                    letterClass = 'text-emerald-200';
                    stateLabel = 'صحيح';
                  } else if (isSelected && !isCorrectOption) {
                    borderClass = 'from-red-500 via-red-400 to-red-500';
                    innerClass = 'bg-red-800/90 text-white';
                    letterClass = 'text-red-200';
                    stateLabel = 'خطأ';
                  } else {
                    borderClass = 'from-white/10 via-white/15 to-white/10';
                    innerClass = 'bg-[#091229]/80 text-[#F8F5EE]/50';
                    letterClass = 'text-[#F8F5EE]/40';
                  }
                } else if (isSelected) {
                  borderClass = 'from-[#F2C96B] via-[#FFE094] to-[#F2C96B]';
                  innerClass = 'bg-[#D9A441] text-[#060D1F] font-bold';
                  letterClass = 'text-[#060D1F]';
                  stateLabel = phase === 'LOCKED' ? 'جاري التحقق...' : 'مختار';
                }

                return (
                  <button
                    key={`${currentQuestion.id}-${idx}`}
                    type="button"
                    disabled={phase !== 'ANSWERING' || isEliminated}
                    onClick={() => handleOptionClick(idx)}
                    className={`group text-right p-[1.5px] bg-gradient-to-r ${borderClass} studio-frame transition-transform duration-150 focus-visible:outline-2 focus-visible:outline-[#F2C96B] ${
                      phase === 'ANSWERING' && !isEliminated
                        ? 'cursor-pointer active:scale-[0.99]'
                        : 'cursor-default'
                    }`}
                  >
                    <div
                      className={`${innerClass} studio-frame px-7 sm:px-8 py-4 min-h-[62px] flex items-center justify-between gap-3 transition-colors duration-150`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`font-bold text-base shrink-0 ${letterClass}`}
                        >
                          {OPTION_LETTERS[idx]}:
                        </span>
                        <span
                          className={`text-base sm:text-lg leading-snug ${
                            isEliminated ? 'line-through opacity-35' : ''
                          }`}
                        >
                          {optionText}
                        </span>
                      </div>

                      {stateLabel && (
                        <span
                          className={`text-xs font-semibold shrink-0 whitespace-nowrap ${
                            phase === 'REVEALED'
                              ? 'text-white/95'
                              : 'text-[#060D1F]/80'
                          }`}
                        >
                          {stateLabel}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Optional Classic Confirmation Bar */}
            {!isInstantMode &&
              phase === 'ANSWERING' &&
              selectedOption !== null && (
                <div className="bg-[#0F1C3D] border border-[#D9A441]/40 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-sm text-[#F8F5EE]/90">
                    اخترت{' '}
                    <strong className="text-[#F2C96B]">
                      ({OPTION_LETTERS[selectedOption]}){' '}
                      {currentQuestion.options[selectedOption]}
                    </strong>{' '}
                    — هل هذا جوابك النهائي؟
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setSelectedOption(null);
                      }}
                      className="px-4 py-2 text-xs text-[#F8F5EE]/75 hover:text-[#F8F5EE] whitespace-nowrap cursor-pointer"
                    >
                      تغيير
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmAnswer(selectedOption)}
                      className="px-6 py-2.5 text-sm font-bold text-[#060D1F] bg-[#D9A441] hover:bg-[#F2C96B] rounded-lg whitespace-nowrap cursor-pointer"
                    >
                      تأكيد الجواب النهائي
                    </button>
                  </div>
                </div>
              )}

            {/* Post-Reveal Panel with Motivational Praise & Applause */}
            {phase === 'REVEALED' && (
              <div
                className={`rounded-xl border p-5 sm:p-6 space-y-4 ${
                  isAnswerCorrect
                    ? 'bg-emerald-950/45 border-emerald-500/40'
                    : 'bg-red-950/45 border-red-500/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-2.5">
                    {isAnswerCorrect ? (
                      <CheckCircle2
                        className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                    ) : (
                      <XCircle
                        className="h-5 w-5 text-red-400 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                    )}
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-[#F8F5EE]">
                        {isAnswerCorrect
                          ? motivationalPraise
                          : timedOut
                            ? 'انتهت الـ 25 ثانية المحددة للسؤال'
                            : canRevive
                              ? 'إجابة خاطئة! هل تريد فرصة ثانية لإكمال الجولة؟'
                              : 'إجابة خاطئة — انتهت الجولة هنا'}
                      </h2>
                      {isAnswerCorrect && currentLevel < 15 && (
                        <p className="text-xs text-emerald-300/90 mt-0.5 tabular-nums">
                          ارتفع رصيدك الآن إلى {formatDinar(currentStepPrize)}
                        </p>
                      )}
                    </div>
                  </div>

                  {isAnswerCorrect || !canRevive ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-[#060D1F] bg-[#D9A441] hover:bg-[#F2C96B] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>
                        {isAnswerCorrect
                          ? currentLevel === 15
                            ? 'استلم جائزة المليون'
                            : 'السؤال التالي'
                          : 'عرض النتيجة النهائية'}
                      </span>
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                  ) : null}
                </div>

                {/* Second Chance Offer */}
                {canRevive && (
                  <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-[#F8F5EE]/80">
                      <HeartHandshake
                        className="h-4 w-4 text-[#F2C96B] shrink-0"
                        aria-hidden="true"
                      />
                      <span>
                        احذف الخيار الخاطئ واحصل على 25 ثانية جديدة لإكمال السؤال (مرة واحدة في الجولة).
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleReviveWithAd}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold bg-[#D9A441] hover:bg-[#F2C96B] text-[#060D1F] transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <PlayCircle className="h-4 w-4" aria-hidden="true" />
                        <span>فرصة ثانية بإعلان</span>
                      </button>

                      <button
                        type="button"
                        disabled={profile.coins < COIN_COSTS.revive}
                        onClick={handleReviveWithCoins}
                        className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                          profile.coins >= COIN_COSTS.revive
                            ? 'bg-white/15 hover:bg-white/20 text-[#F8F5EE] cursor-pointer'
                            : 'bg-white/5 text-[#F8F5EE]/35 cursor-not-allowed'
                        }`}
                      >
                        <Coins
                          className="h-3.5 w-3.5 text-[#F2C96B]"
                          aria-hidden="true"
                        />
                        <span>{COIN_COSTS.revive} عملة</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="px-3.5 py-2.5 text-xs text-[#F8F5EE]/70 hover:text-[#F8F5EE] transition-colors whitespace-nowrap cursor-pointer"
                      >
                        إنهاء الجولة
                      </button>
                    </div>
                  </div>
                )}

                {/* Cultural Explanation */}
                {(isAnswerCorrect || !canRevive) && (
                  <div className="pt-3 border-t border-white/10 space-y-1">
                    {currentQuestion.proverbText && (
                      <p className="font-display text-lg font-bold text-[#F2C96B]">
                        المثل الكامل: «{currentQuestion.proverbText}»
                      </p>
                    )}
                    <p className="text-sm text-[#F8F5EE]/85 leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Compact Non-Intrusive Gameplay Banner Ad */}
            <div className="pt-2">
              <AdBannerSlot placement="game" compact />
            </div>
          </div>

          {/* Desktop Prize Ladder */}
          <div className="hidden lg:block lg:col-span-3">
            <PrizeLadder
              currentLevel={currentLevel}
              clearedLevel={clearedLevel}
            />
          </div>
        </div>
      </main>

      {/* Mobile Prize Ladder Drawer */}
      {showMobileLadder && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          role="dialog"
          aria-label="سلم الجوائز"
        >
          <div className="w-full max-w-sm relative">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setShowMobileLadder(false);
              }}
              aria-label="إغلاق سلم الجوائز"
              className="absolute left-3 top-3 z-10 p-2 rounded-lg bg-white/10 text-[#F8F5EE] hover:bg-white/20 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <PrizeLadder
              currentLevel={currentLevel}
              clearedLevel={clearedLevel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
