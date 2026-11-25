import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  BookOpen,
  Check,
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
  Share2,
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
  getPointsForDifficulty,
  getSafeHavenPrize,
} from '../types/game';
import {
  buildGameDeck,
  pickReplacementQuestion,
  simulateAudiencePoll,
  simulatePhoneFriend,
} from '../utils/gameLogic';
import { preloadInterstitial } from '../utils/ads';
import {
  triggerAnswerTapHaptic,
  triggerCorrectHaptic,
  triggerWrongHaptic,
} from '../utils/haptics';
import { shareWisdom } from '../utils/share';
import { soundEngine } from '../utils/sound';
import { AdBannerSlot } from './AdBannerSlot';
import { LifelinePanels } from './LifelinePanels';
import { PrizeLadder } from './PrizeLadder';
import { StudioStageBackdrop } from './StudioStageBackdrop';

interface GameStageProps {
  mode: GameMode;
  profile: UserProfile;
  settings: UserSettings;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onSpendCoins: (amount: number) => boolean;
  onRequestAdReward: (request: AdRewardRequest) => void;
  onTriggerStageInterstitial: (onContinue: () => void) => void;
  onCorrectAnswer?: (pointsEarned: number) => void;
  onNotify?: (message: string) => void;
  onExitToMenu: () => void;
  onFinishGame: (outcome: GameOutcome) => void;
}

type QuestionPhase = 'ANSWERING' | 'LOCKED' | 'REVEALED';

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
  onTriggerStageInterstitial,
  onCorrectAnswer,
  onNotify,
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
  const [shareCopied, setShareCopied] = useState(false);

  const usedIdsRef = useRef<Set<string>>(
    new Set(deckState.deck.map((q) => q.id))
  );
  const revealTimeoutRef = useRef<number | null>(null);
  const dialTimeoutRef = useRef<number | null>(null);
  const isAdvancingRef = useRef(false);

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

  // Start / stop interactive studio background music & preload next interstitial ad
  useEffect(() => {
    soundEngine.startStudioMusic(currentQuestion.difficulty);
    soundEngine.playQuestionIntro();
    preloadInterstitial().catch(() => {});
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
    triggerWrongHaptic();
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
          triggerCorrectHaptic();
          onCorrectAnswer?.(getPointsForDifficulty(currentQuestion.difficulty));
          if (currentLevel === 15) {
            soundEngine.playGrandVictory();
          } else {
            soundEngine.playCorrect(currentLevel === 5 || currentLevel === 10);
          }
        } else {
          triggerWrongHaptic();
          soundEngine.playWrong();
        }
      }, delayMs);
    },
    [
      phase,
      eliminatedOptions,
      isInstantMode,
      currentQuestion,
      currentLevel,
      onCorrectAnswer,
    ]
  );

  const handleOptionClick = (idx: number) => {
    if (phase !== 'ANSWERING' || eliminatedOptions.includes(idx)) return;
    triggerAnswerTapHaptic();
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
    if (phase !== 'REVEALED' || isAdvancingRef.current) return;
    isAdvancingRef.current = true;
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

      const advanceToNextQuestion = () => {
        isAdvancingRef.current = false;
        setQuestionIndex((prev) => prev + 1);
        setPhase('ANSWERING');
        setSelectedOption(null);
        setEliminatedOptions([]);
        setAudiencePoll(null);
        setPhoneFriend(null);
        setPhoneDialing(false);
        setRechargePrompt(null);
        setShareCopied(false);
        setSecondsLeft(QUESTION_TIMER_SECONDS);
        setTimedOut(false);
        soundEngine.playQuestionIntro();
      };

      // Show a full-screen interstitial automatically after every 3 completed stages
      if (currentLevel % 3 === 0) {
        soundEngine.stopStudioMusic();
        onTriggerStageInterstitial(advanceToNextQuestion);
      } else {
        advanceToNextQuestion();
      }
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
    onTriggerStageInterstitial,
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

  const handleShareWisdom = async () => {
    soundEngine.playClick();
    triggerAnswerTapHaptic();
    const result = await shareWisdom({
      question: currentQuestion.question,
      proverbText: currentQuestion.proverbText,
      explanation: currentQuestion.explanation,
    });
    if (result === 'copied') {
      setShareCopied(true);
      onNotify?.('تم نسخ الحكمة جاهزة للمشاركة');
      window.setTimeout(() => setShareCopied(false), 2200);
    } else if (result === 'shared') {
      onNotify?.('تمت مشاركة الحكمة بنجاح');
    }
  };

  const timerPct = Math.max(
    0,
    Math.min(100, (secondsLeft / QUESTION_TIMER_SECONDS) * 100)
  );
  const timerUrgent = secondsLeft <= 8 && phase === 'ANSWERING';

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#060D1F] text-[#F8F5EE] relative flex flex-col">
      {/* Dynamic Progress-Driven Animated Studio Backdrop */}
      <StudioStageBackdrop
        level={currentLevel}
        celebrating={isAnswerCorrect}
      />

      {/* 1. Compact Single-Row Top HUD (Question #, Prize/Points, Timer & Controls) */}
      <header className="relative z-20 shrink-0 border-b border-white/10 bg-[#060D1F]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 h-12 sm:h-14 flex items-center justify-between gap-1.5 sm:gap-3">
          {/* Right cluster (RTL start): Home + Question # + Prize/Points */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                soundEngine.stopStudioMusic();
                onExitToMenu();
              }}
              aria-label="العودة للرئيسية"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-white/10 bg-[#0D1938]/90 text-[#F8F5EE]/80 hover:text-[#F8F5EE] inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
              <span className="hidden md:inline text-xs font-medium">الرئيسية</span>
            </button>

            {/* Question Number */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/8 border border-white/10 text-[11px] sm:text-xs font-bold text-[#F8F5EE] tabular-nums whitespace-nowrap shrink-0">
              <span>س {currentLevel}/15</span>
            </div>

            {/* Prize / Points (tappable on mobile to view Prize Ladder) */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setShowMobileLadder(true);
              }}
              title="سلم الجوائز"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[#D9A441]/35 bg-[#0D1938] text-[11px] sm:text-xs font-bold text-[#F2C96B] tabular-nums whitespace-nowrap shrink-0 cursor-pointer lg:cursor-default"
            >
              <Layers className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:hidden shrink-0" aria-hidden="true" />
              <Coins className="h-3.5 w-3.5 hidden lg:inline shrink-0" aria-hidden="true" />
              <span>{formatDinar(currentStepPrize)}</span>
            </button>

            <div className="hidden lg:flex items-center gap-1 text-xs font-semibold text-[#F8F5EE]/70 tabular-nums whitespace-nowrap shrink-0">
              <span aria-hidden="true">·</span>
              <span>{formatCoins(profile.coins)}</span>
            </div>
          </div>

          {/* Left cluster (RTL end): Timer + Withdraw + Audio toggles */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Compact 25s Countdown Readout */}
            <div
              aria-label={`الوقت المتبقي ${secondsLeft} ثانية من ${QUESTION_TIMER_SECONDS}`}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg border text-[11px] sm:text-xs font-bold tabular-nums whitespace-nowrap shrink-0 transition-colors ${
                timerUrgent
                  ? 'border-red-500/75 bg-red-500/25 text-red-200'
                  : 'border-[#D9A441]/35 bg-[#0D1938] text-[#F8F5EE]'
              }`}
            >
              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
              <span>{secondsLeft}ث</span>
            </div>

            {phase === 'ANSWERING' && currentEarnedPrize > 0 && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setShowWithdrawConfirm(true);
                }}
                aria-label="انسحاب"
                title="انسحاب والاحتفاظ بالرصيد"
                className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg border border-[#D9A441]/40 text-[11px] sm:text-xs font-semibold text-[#F2C96B] hover:bg-[#D9A441]/15 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">انسحاب</span>
              </button>
            )}

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
              className={`p-1.5 rounded-lg border cursor-pointer ${
                settings.musicEnabled
                  ? 'border-[#D9A441]/40 bg-[#D9A441]/15 text-[#F2C96B]'
                  : 'border-white/15 bg-[#0D1938] text-[#F8F5EE]/45 hover:text-[#F8F5EE]'
              }`}
            >
              <Music className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
              className="p-1.5 rounded-lg border border-white/15 bg-[#0D1938] text-[#F8F5EE]/80 hover:text-[#F8F5EE] cursor-pointer"
            >
              {settings.soundEnabled ? (
                <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Sleek Full-Width 25s Countdown Progress Line */}
        <div className="w-full h-1 bg-white/10 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              timerUrgent ? 'bg-red-500' : 'bg-[#D9A441]'
            }`}
            style={{ width: `${timerPct}%` }}
          />
        </div>
      </header>

      {/* 2. Centered Compact Question & Options Stage (Zero Vertical Scroll) */}
      <main className="relative z-10 flex-1 min-h-0 max-w-7xl w-full mx-auto px-3 sm:px-6 py-2 sm:py-3 flex flex-col lg:grid lg:grid-cols-12 lg:gap-6 lg:items-center overflow-hidden">
        {/* Primary Quiz Column */}
        <div className="flex-1 min-h-0 lg:col-span-9 flex flex-col justify-center gap-2 sm:gap-3.5 w-full">
          {/* Smooth Fade & Slide Question + Options Stage */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
              className="flex flex-col gap-2 sm:gap-3.5"
            >
              {/* Compact Studio Question Card */}
              <div className="p-[1.5px] bg-gradient-to-r from-[#D9A441]/30 via-[#F2C96B]/70 to-[#D9A441]/30 studio-frame shrink-0">
                <div className="bg-[#0C1838]/95 px-4 sm:px-9 py-2.5 sm:py-5 text-center studio-frame min-h-[70px] sm:min-h-[112px] flex flex-col items-center justify-center gap-0.5 sm:gap-1">
                  <span className="text-[11px] sm:text-xs font-semibold text-[#F2C96B]/85 tracking-wide">
                    {currentQuestion.category}
                  </span>
                  <h1 className="font-display text-[15px] sm:text-2xl lg:text-[26px] font-bold text-[#F8F5EE] leading-snug sm:leading-[1.4] [text-wrap:balance] max-w-3xl">
                    {currentQuestion.question}
                  </h1>
                </div>
              </div>

              {/* Tightly Stacked 4 Answer Options with Smooth 500ms Color Transition */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-3">
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

                  const isRevealedCorrect =
                    phase === 'REVEALED' &&
                    isCorrectOption &&
                    (isAnswerCorrect || !canRevive);

                  if (isEliminated) {
                    borderClass = 'from-white/5 via-white/10 to-white/5';
                    innerClass = 'bg-[#070E22]/60 text-[#F8F5EE]/20';
                    letterClass = 'text-[#F8F5EE]/20';
                  } else if (phase === 'REVEALED') {
                    if (isRevealedCorrect) {
                      borderClass =
                        'from-[#FFE08A] via-[#F2C96B] to-[#D9A441]';
                      innerClass =
                        'bg-gradient-to-r from-emerald-800/95 via-emerald-700/95 to-[#8A6619]/95 text-[#FFFDF5] font-bold';
                      letterClass = 'text-[#FFE08A]';
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
                      className={`group text-right p-[1.5px] bg-gradient-to-r ${borderClass} studio-frame transition-all duration-500 ease-in-out focus-visible:outline-2 focus-visible:outline-[#F2C96B] ${
                        isRevealedCorrect ? 'correct-golden-pulse z-10' : ''
                      } ${
                        phase === 'ANSWERING' && !isEliminated
                          ? 'cursor-pointer active:scale-[0.975]'
                          : 'cursor-default'
                      }`}
                    >
                      <div
                        className={`${innerClass} studio-frame px-4 sm:px-7 py-2 sm:py-3.5 min-h-[42px] sm:min-h-[56px] flex items-center justify-between gap-2.5 transition-all duration-500 ease-in-out`}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <span
                            className={`font-bold text-sm sm:text-lg shrink-0 transition-colors duration-500 ease-in-out ${letterClass}`}
                          >
                            {OPTION_LETTERS[idx]}:
                          </span>
                          <span
                            className={`text-sm sm:text-lg font-medium leading-tight sm:leading-snug transition-colors duration-500 ease-in-out ${
                              isEliminated ? 'line-through opacity-35' : ''
                            }`}
                          >
                            {optionText}
                          </span>
                        </div>

                        {stateLabel && (
                          <span
                            className={`text-[11px] sm:text-xs font-semibold shrink-0 whitespace-nowrap transition-opacity duration-500 ease-in-out ${
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
            </motion.div>
          </AnimatePresence>

          {/* Compact Classic Confirmation Bar (when Classic mode is enabled) */}
          <AnimatePresence>
            {!isInstantMode &&
              phase === 'ANSWERING' &&
              selectedOption !== null && (
                <motion.div
                  key="classic-confirm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="bg-[#0F1C3D]/95 border border-[#D9A441]/45 rounded-xl px-3.5 py-2 sm:px-5 sm:py-3 flex items-center justify-between gap-2.5 shrink-0"
                >
                  <div className="text-xs sm:text-sm text-[#F8F5EE]/90 truncate">
                    اخترت{' '}
                    <strong className="text-[#F2C96B]">
                      ({OPTION_LETTERS[selectedOption]}){' '}
                      {currentQuestion.options[selectedOption]}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setSelectedOption(null);
                      }}
                      className="px-2.5 py-1.5 text-xs text-[#F8F5EE]/75 hover:text-[#F8F5EE] whitespace-nowrap cursor-pointer"
                    >
                      تغيير
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmAnswer(selectedOption)}
                      className="px-4 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-bold text-[#060D1F] bg-[#D9A441] hover:bg-[#F2C96B] rounded-lg whitespace-nowrap cursor-pointer"
                    >
                      تأكيد الجواب
                    </button>
                  </div>
                </motion.div>
              )}
          </AnimatePresence>

          {/* Post-Reveal Wisdom / Explanation Card + Manual Next Button (Zero Scrolling) */}
          <AnimatePresence>
            {phase === 'REVEALED' && (
              <motion.div
                key={`reveal-${currentQuestion.id}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: 'easeInOut' }}
                className={`rounded-2xl border px-3.5 py-2.5 sm:px-5 sm:py-3.5 space-y-2.5 shrink-0 backdrop-blur-md transition-colors duration-500 ease-in-out ${
                  isAnswerCorrect
                    ? 'bg-emerald-950/60 border-emerald-500/45 shadow-[0_10px_30px_-14px_rgba(16,185,129,0.45)]'
                    : 'bg-red-950/60 border-red-500/45 shadow-[0_10px_30px_-14px_rgba(239,68,68,0.4)]'
                }`}
              >
                {/* Compact Status Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isAnswerCorrect ? (
                      <CheckCircle2
                        className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <XCircle
                        className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <h2 className="text-xs sm:text-base font-bold text-[#F8F5EE] truncate">
                      {isAnswerCorrect
                        ? motivationalPraise
                        : timedOut
                          ? 'انتهى الوقت المحدد للسؤال'
                          : canRevive
                            ? 'إجابة خاطئة! هل تريد فرصة ثانية؟'
                            : 'إجابة خاطئة — انتهت الجولة'}
                    </h2>
                  </div>

                  {isAnswerCorrect && (
                    <span className="text-[11px] sm:text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-400/25 px-2 py-0.5 rounded-md tabular-nums whitespace-nowrap shrink-0">
                      {formatDinar(currentStepPrize)}
                    </span>
                  )}
                </div>

                {/* Second Chance Offer (shown before spoiling answer if revive is available) */}
                {canRevive ? (
                  <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#F8F5EE]/85">
                      <HeartHandshake
                        className="h-4 w-4 text-[#F2C96B] shrink-0"
                        aria-hidden="true"
                      />
                      <span>أكمل نفس السؤال بفرصة ثانية</span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={handleReviveWithAd}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#D9A441] hover:bg-[#F2C96B] text-[#060D1F] whitespace-nowrap cursor-pointer"
                      >
                        <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>فرصة بإعلان</span>
                      </button>

                      <button
                        type="button"
                        disabled={profile.coins < COIN_COSTS.revive}
                        onClick={handleReviveWithCoins}
                        className={`inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap ${
                          profile.coins >= COIN_COSTS.revive
                            ? 'bg-white/15 hover:bg-white/20 text-[#F8F5EE] cursor-pointer'
                            : 'bg-white/5 text-[#F8F5EE]/35 cursor-not-allowed'
                        }`}
                      >
                        <Coins
                          className="h-3.5 w-3.5 text-[#F2C96B]"
                          aria-hidden="true"
                        />
                        <span>{COIN_COSTS.revive}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="px-3 py-2 text-xs font-semibold text-[#F8F5EE]/80 hover:text-[#F8F5EE] bg-white/8 rounded-xl whitespace-nowrap cursor-pointer"
                      >
                        إنهاء الجولة
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Readable Wisdom & Cultural Explanation Box with Share Button */}
                    <div className="rounded-xl bg-[#07112A]/85 border border-[#D9A441]/25 px-3 py-2 sm:px-4 sm:py-2.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-[#F2C96B] min-w-0">
                          <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span className="truncate">
                            {currentQuestion.proverbText
                              ? `الحكمة والمثل: «${currentQuestion.proverbText}»`
                              : 'تفسير وحكمة الإجابة'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={handleShareWisdom}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                            shareCopied
                              ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200'
                              : 'border-[#D9A441]/45 bg-[#D9A441]/15 text-[#F2C96B] hover:bg-[#D9A441]/25'
                          }`}
                        >
                          {shareCopied ? (
                            <>
                              <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
                              <span>تم النسخ</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                              <span>شارك الحكمة 📤</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-xs sm:text-sm text-[#F8F5EE]/92 leading-relaxed max-h-[58px] sm:max-h-[82px] overflow-y-auto">
                        {currentQuestion.explanation}
                      </p>
                    </div>

                    {/* Prominent Manual Next / End Round Button Directly Below Wisdom */}
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 text-sm sm:text-base font-bold text-[#060D1F] bg-gradient-to-l from-[#D9A441] via-[#F2C96B] to-[#D9A441] hover:brightness-105 rounded-xl shadow-[0_6px_22px_-6px_rgba(217,164,65,0.6)] whitespace-nowrap cursor-pointer"
                    >
                      <span>
                        {isAnswerCorrect && currentLevel < 15
                          ? 'السؤال التالي'
                          : 'إنهاء الجولة'}
                      </span>
                      <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Prize Ladder */}
        <div className="hidden lg:block lg:col-span-3 h-full max-h-[580px]">
          <PrizeLadder
            currentLevel={currentLevel}
            clearedLevel={clearedLevel}
          />
        </div>
      </main>

      {/* 3. Fixed Thumb-Friendly Bottom Lifelines Bar + Banner Ad Dock */}
      <footer className="relative z-20 shrink-0 border-t border-white/10 bg-[#071028]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 pt-2 pb-1.5 sm:py-2 space-y-1.5">
          {/* Single Horizontal Row of 4 Lifelines (Thumb-Reachable) */}
          <div
            className="grid grid-cols-4 gap-1.5 sm:gap-3 max-w-3xl mx-auto"
            role="group"
            aria-label="وسائل المساعدة"
          >
            {(
              [
                {
                  key: 'fiftyFifty',
                  shortLabel: 'حذف 2',
                  label: 'حذف إجابتين',
                  Icon: Scissors,
                },
                {
                  key: 'audience',
                  shortLabel: 'الجمهور',
                  label: 'الجمهور',
                  Icon: Users,
                },
                {
                  key: 'phoneFriend',
                  shortLabel: 'صديق',
                  label: 'صديق',
                  Icon: PhoneCall,
                },
                {
                  key: 'swapQuestion',
                  shortLabel: 'تبديل',
                  label: 'تبديل',
                  Icon: RefreshCw,
                },
              ] as const
            ).map(({ key, shortLabel, label, Icon }) => {
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
                  className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 py-1.5 sm:py-2 px-1 sm:px-3 rounded-xl border text-[11px] sm:text-xs font-semibold whitespace-nowrap ${
                    phase !== 'ANSWERING'
                      ? 'border-white/10 bg-white/5 text-[#F8F5EE]/30 cursor-not-allowed'
                      : available
                        ? 'border-[#D9A441]/40 bg-[#0E1C3F] text-[#F8F5EE] hover:bg-[#D9A441] hover:text-[#060D1F] cursor-pointer'
                        : 'border-dashed border-[#D9A441]/35 bg-[#0A132C] text-[#F2C96B]/75 hover:border-[#F2C96B] cursor-pointer'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" aria-hidden="true" />
                  <span className="sm:hidden truncate">
                    {available ? shortLabel : `شحن`}
                  </span>
                  <span className="hidden sm:inline truncate">
                    {available ? label : `شحن ${label}`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Compact Non-Intrusive Gameplay Banner Ad Underneath Lifelines */}
          <div className="max-w-3xl mx-auto">
            <AdBannerSlot placement="game" compact />
          </div>
        </div>
      </footer>

      {/* Floating Overlays (Audience Poll, Phone Friend, Lifeline Recharge, Withdraw Confirm) so stage never scrolls */}
      <AnimatePresence>
        {(audiencePoll || phoneFriend || phoneDialing) && (
          <motion.div
            key="lifeline-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="fixed inset-0 z-40 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => {
              if (!phoneDialing) {
                soundEngine.playClick();
                setAudiencePoll(null);
                setPhoneFriend(null);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="w-full max-w-xl"
              onClick={(e) => e.stopPropagation()}
            >
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lifeline Recharge Floating Modal */}
      <AnimatePresence>
        {rechargePrompt && phase === 'ANSWERING' && (
          <motion.div
            key="recharge-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="fixed inset-0 z-40 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => {
              soundEngine.playClick();
              setRechargePrompt(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#0F1C3D] border border-[#D9A441]/45 rounded-2xl p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#F2C96B]">
                    استعادة وسيلة «{LIFELINE_LABELS[rechargePrompt]}»
                  </h3>
                  <p className="text-xs text-[#F8F5EE]/75 mt-1">
                    شاهد إعلاناً قصيراً مجاناً أو استخدم{' '}
                    {COIN_COSTS.restoreLifeline} عملة من رصيدك.
                  </p>
                </div>
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
              <div className="flex items-center gap-2.5">
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
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#D9A441] hover:bg-[#F2C96B] text-[#060D1F] whitespace-nowrap cursor-pointer"
                >
                  <PlayCircle className="h-4 w-4" aria-hidden="true" />
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
                  className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap ${
                    profile.coins >= COIN_COSTS.restoreLifeline
                      ? 'bg-white/15 hover:bg-white/20 text-[#F8F5EE] cursor-pointer'
                      : 'bg-white/5 text-[#F8F5EE]/35 cursor-not-allowed'
                  }`}
                >
                  <Coins
                    className="h-4 w-4 text-[#F2C96B]"
                    aria-hidden="true"
                  />
                  <span>{COIN_COSTS.restoreLifeline} عملة</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdraw Confirmation Floating Modal */}
      <AnimatePresence>
        {showWithdrawConfirm && (
          <motion.div
            key="withdraw-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
            role="dialog"
            aria-label="تأكيد الانسحاب"
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="w-full max-w-md bg-[#112046] border border-[#D9A441]/45 rounded-2xl p-5 space-y-4 shadow-2xl"
            >
              <div>
                <h3 className="text-base font-bold text-[#F2C96B]">
                  الانسحاب والاحتفاظ بمبلغ {formatDinar(currentEarnedPrize)}؟
                </h3>
                <p className="text-xs text-[#F8F5EE]/75 mt-1">
                  ستغادر الاستوديو بكامل رصيدك المحقق وعملات المرحلة.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setShowWithdrawConfirm(false);
                  }}
                  className="px-4 py-2 text-xs font-medium text-[#F8F5EE]/85 bg-white/10 rounded-xl hover:text-[#F8F5EE] whitespace-nowrap cursor-pointer"
                >
                  إكمال اللعب
                </button>
                <button
                  type="button"
                  onClick={handleConfirmWithdraw}
                  className="px-4 py-2 text-xs font-bold text-[#060D1F] bg-[#D9A441] hover:bg-[#F2C96B] rounded-xl whitespace-nowrap cursor-pointer"
                >
                  تأكيد الانسحاب
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Prize Ladder Drawer */}
      <AnimatePresence>
        {showMobileLadder && (
          <motion.div
            key="mobile-ladder-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 lg:hidden bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-label="سلم الجوائز"
            onClick={() => {
              soundEngine.playClick();
              setShowMobileLadder(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
              className="w-full max-w-sm max-h-[85dvh] relative"
              onClick={(e) => e.stopPropagation()}
            >
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
