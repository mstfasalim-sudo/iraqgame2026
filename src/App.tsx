import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { GameStage } from './components/GameStage';
import {
  InterstitialAdModal,
  InterstitialContext,
} from './components/InterstitialAdModal';
import { MenuScreen } from './components/MenuScreen';
import { PrivacyAboutModal } from './components/PrivacyAboutModal';
import { RateAppModal } from './components/RateAppModal';
import { ResultScreen } from './components/ResultScreen';
import { RewardedAdModal } from './components/RewardedAdModal';
import { SplashScreen } from './components/SplashScreen';
import {
  AD_REWARDS,
  AdRewardRequest,
  AppView,
  GameMode,
  GameOutcome,
  GameScreen,
  UserProfile,
  UserSettings,
  getPlayerRank,
} from './types/game';
import { initAdMob, preloadInterstitial } from './utils/ads';
import { soundEngine } from './utils/sound';
import {
  hasShownRankUpRatePrompt,
  markRankUpRatePromptShown,
} from './utils/store';
import {
  DEFAULT_PROFILE,
  getTodayKey,
  loadProfile,
  loadSettings,
  saveProfile,
  saveSettings,
} from './utils/storage';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [screen, setScreen] = useState<GameScreen>('HUB');
  const [activeView, setActiveView] = useState<AppView>('HOME');
  const [selectedMode, setSelectedMode] = useState<GameMode>('mixed');
  const [sessionId, setSessionId] = useState<number>(1);
  const [outcome, setOutcome] = useState<GameOutcome | null>(null);

  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());

  const [activeAdRequest, setActiveAdRequest] =
    useState<AdRewardRequest | null>(null);
  const [pendingInterstitial, setPendingInterstitial] = useState<{
    context: InterstitialContext;
    onDone: () => void;
  } | null>(null);
  const pendingInterstitialRef = useRef<{
    context: InterstitialContext;
    onDone: () => void;
  } | null>(null);
  pendingInterstitialRef.current = pendingInterstitial;
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [rateModal, setRateModal] = useState<{
    open: boolean;
    rankTitle: string | null;
  }>({ open: false, rankTitle: null });

  useEffect(() => {
    initAdMob();

    const handleReconnect = () => {
      initAdMob().then(() => {
        preloadInterstitial().catch(() => {});
      });
    };
    window.addEventListener('online', handleReconnect);
    return () => {
      window.removeEventListener('online', handleReconnect);
    };
  }, []);

  useEffect(() => {
    soundEngine.setEnabled(settings.soundEnabled);
    soundEngine.setMusicEnabled(settings.musicEnabled);
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  const handleUpdateProfile = (patch: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
    showToast('تم حفظ بيانات الملف الشخصي');
  };

  const handleUpdateSettings = (patch: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const handleResetProgress = () => {
    setProfile((prev) => ({
      ...DEFAULT_PROFILE,
      name: prev.name,
      governorate: prev.governorate,
      emblem: prev.emblem,
    }));
    showToast('تم تصفير الإحصائيات وإعادة الرصيد إلى 200 عملة');
  };

  const handleSpendCoins = (amount: number): boolean => {
    if (profile.coins < amount) return false;
    setProfile((prev) => ({
      ...prev,
      coins: Math.max(0, prev.coins - amount),
    }));
    return true;
  };

  const handleRequestAdReward = (request: AdRewardRequest) => {
    setActiveAdRequest({
      ...request,
      onComplete: () => {
        const today = getTodayKey();
        setProfile((prev) => {
          const sameDay = prev.lastAdDate === today;
          return {
            ...prev,
            totalAdsWatched: prev.totalAdsWatched + 1,
            dailyAdsWatched:
              request.kind === 'bonus_coins'
                ? (sameDay ? prev.dailyAdsWatched : 0) + 1
                : sameDay
                  ? prev.dailyAdsWatched
                  : 0,
            lastAdDate: today,
          };
        });
        request.onComplete();
      },
    });
  };

  const handleWatchCoinsAd = () => {
    const today = getTodayKey();
    const watchedToday =
      profile.lastAdDate === today ? profile.dailyAdsWatched : 0;
    if (watchedToday >= AD_REWARDS.maxDailyAdCoins) return;

    handleRequestAdReward({
      kind: 'bonus_coins',
      title: 'مكافأة عملات إضافية',
      rewardLabel: `+${AD_REWARDS.bonusCoins} عملة ذهبية`,
      coinsAmount: AD_REWARDS.bonusCoins,
      onComplete: () => {
        setProfile((prev) => ({
          ...prev,
          coins: prev.coins + AD_REWARDS.bonusCoins,
        }));
        showToast(`تمت إضافة +${AD_REWARDS.bonusCoins} عملة ذهبية إلى رصيدك`);
      },
    });
  };

  const handleClaimDailyBonus = () => {
    const today = getTodayKey();
    if (profile.lastDailyBonusDate === today) return;
    soundEngine.playReward();
    setProfile((prev) => ({
      ...prev,
      coins: prev.coins + AD_REWARDS.dailyCheckInCoins,
      lastDailyBonusDate: today,
    }));
    showToast(`تم استلام هدية اليوم (+${AD_REWARDS.dailyCheckInCoins} عملة)`);
  };

  const launchRoundImmediately = useCallback((modeOverride?: GameMode) => {
    if (modeOverride) {
      setSelectedMode(modeOverride);
    }
    setOutcome(null);
    setSessionId((prev) => prev + 1);
    setScreen('PLAYING');
    preloadInterstitial().catch(() => {});
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const handleStartGame = (modeOverride?: GameMode) => {
    launchRoundImmediately(modeOverride);
  };

  const handleReplayFromResult = (modeToPlay: GameMode) => {
    launchRoundImmediately(modeToPlay);
  };

  const handleTriggerStageInterstitial = useCallback(
    (onContinue: () => void) => {
      setPendingInterstitial({
        context: 'stage_break',
        onDone: onContinue,
      });
    },
    []
  );

  const handleFinishInterstitial = useCallback(() => {
    const current = pendingInterstitialRef.current;
    pendingInterstitialRef.current = null;
    setPendingInterstitial(null);
    if (current) {
      current.onDone();
    }
  }, []);

  const handleCorrectAnswer = useCallback(
    (pointsEarned: number) => {
      setProfile((prev) => {
        const oldRank = getPlayerRank(prev.totalPoints);
        const nextPoints = prev.totalPoints + pointsEarned;
        const newRank = getPlayerRank(nextPoints);

        if (newRank.title !== oldRank.title) {
          const shouldPromptRate = !hasShownRankUpRatePrompt();
          if (shouldPromptRate) {
            markRankUpRatePromptShown();
          }

          window.setTimeout(() => {
            soundEngine.playReward();
            showToast(`ترقّيت إلى لقب جديد: ${newRank.title} 🏆`);
          }, 350);

          if (shouldPromptRate) {
            window.setTimeout(() => {
              setRateModal({ open: true, rankTitle: newRank.title });
            }, 1050);
          }
        }

        return {
          ...prev,
          totalPoints: nextPoints,
          totalCorrect: prev.totalCorrect + 1,
        };
      });
    },
    [showToast]
  );

  const handleFinishGame = (result: GameOutcome) => {
    setOutcome(result);
    setProfile((prev) => ({
      ...prev,
      coins: prev.coins + result.earnedCoins,
      bestPrize: Math.max(prev.bestPrize, result.finalPrize),
      gamesPlayed: prev.gamesPlayed + 1,
    }));

    // Automatically show Interstitial Ad when round finishes, before showing ResultScreen
    setPendingInterstitial({
      context: 'before_result',
      onDone: () => {
        setScreen('RESULT');
        window.scrollTo({ top: 0, behavior: 'auto' });
      },
    });
  };

  const handleDoubleCoinsReward = (bonusAmount: number) => {
    setProfile((prev) => ({
      ...prev,
      coins: prev.coins + bonusAmount,
    }));
    showToast(`تمت مضاعفة المكافأة (+${bonusAmount} عملة إضافية)`);
  };

  const handleBackToMenu = (view: AppView = 'HOME') => {
    soundEngine.stopStudioMusic();
    setActiveView(view);
    setScreen('HUB');
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <SplashScreen onFinish={handleSplashFinish} durationMs={3000} />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {screen === 'PLAYING' ? (
          <motion.div
            key={`playing-${sessionId}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
          >
            <GameStage
              key={sessionId}
              mode={selectedMode}
              profile={profile}
              settings={settings}
              onToggleSound={() =>
                handleUpdateSettings({ soundEnabled: !settings.soundEnabled })
              }
              onToggleMusic={() =>
                handleUpdateSettings({ musicEnabled: !settings.musicEnabled })
              }
              onSpendCoins={handleSpendCoins}
              onRequestAdReward={handleRequestAdReward}
              onTriggerStageInterstitial={handleTriggerStageInterstitial}
              onCorrectAnswer={handleCorrectAnswer}
              onNotify={showToast}
              onExitToMenu={() => handleBackToMenu('HOME')}
              onFinishGame={handleFinishGame}
            />
          </motion.div>
        ) : screen === 'RESULT' && outcome ? (
          <motion.div
            key="result-screen"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
          >
            <ResultScreen
              outcome={outcome}
              bestPrize={profile.bestPrize}
              totalCoins={profile.coins}
              onDoubleCoinsReward={handleDoubleCoinsReward}
              onRequestAdReward={handleRequestAdReward}
              onPlayAgain={() => handleReplayFromResult(outcome.mode)}
              onBackToMenu={() => handleBackToMenu('HOME')}
            />
          </motion.div>
        ) : (
          <motion.div
            key="hub-screen"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
          >
            <MenuScreen
              activeView={activeView}
              onChangeView={(view) => {
                setActiveView(view);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              selectedMode={selectedMode}
              onSelectMode={setSelectedMode}
              profile={profile}
              settings={settings}
              onUpdateProfile={handleUpdateProfile}
              onUpdateSettings={handleUpdateSettings}
              onResetProgress={handleResetProgress}
              onClaimDailyBonus={handleClaimDailyBonus}
              onWatchCoinsAd={handleWatchCoinsAd}
              onStartGame={handleStartGame}
              onOpenPrivacy={() => setShowPrivacyModal(true)}
              onOpenRate={() => setRateModal({ open: true, rankTitle: null })}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Google Play Privacy Policy & About Modal */}
      <PrivacyAboutModal
        open={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        onOpenRate={() => setRateModal({ open: true, rankTitle: null })}
        onNotify={showToast}
      />

      {/* Gentle Rate Us Modal (Manual & One-Time Rank-Up Prompt) */}
      <RateAppModal
        open={rateModal.open}
        rankTitle={rateModal.rankTitle}
        onClose={() => setRateModal({ open: false, rankTitle: null })}
        onRated={() => showToast('شكراً لتقييمك ودعمك للعبة المليون العراقي ⭐')}
      />

      {/* Global Rewarded Ad Modal */}
      <RewardedAdModal
        request={activeAdRequest}
        onClose={() => setActiveAdRequest(null)}
      />

      {/* Full-Screen AdMob Interstitial (End of Round & Every 3 Stages) */}
      <InterstitialAdModal
        open={pendingInterstitial !== null}
        context={pendingInterstitial?.context}
        onContinue={handleFinishInterstitial}
      />

      {/* Lightweight Animated Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key={toastMessage}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[#0F1C3D] border border-[#D9A441]/50 text-[#F8F5EE] px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs sm:text-sm font-medium whitespace-nowrap"
          >
            <CheckCircle2
              className="h-4 w-4 text-emerald-400 shrink-0"
              aria-hidden="true"
            />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
