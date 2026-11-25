import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { GameStage } from './components/GameStage';
import { InterstitialAdModal } from './components/InterstitialAdModal';
import { MenuScreen } from './components/MenuScreen';
import { ResultScreen } from './components/ResultScreen';
import { RewardedAdModal } from './components/RewardedAdModal';
import {
  AD_REWARDS,
  AdRewardRequest,
  AppView,
  DeveloperInfo,
  GameMode,
  GameOutcome,
  GameScreen,
  UserProfile,
  UserSettings,
} from './types/game';
import { initAdMob } from './utils/ads';
import { soundEngine } from './utils/sound';
import {
  DEFAULT_PROFILE,
  getTodayKey,
  loadDeveloperInfo,
  loadProfile,
  loadSettings,
  saveDeveloperInfo,
  saveProfile,
  saveSettings,
} from './utils/storage';

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('HUB');
  const [activeView, setActiveView] = useState<AppView>('HOME');
  const [selectedMode, setSelectedMode] = useState<GameMode>('mixed');
  const [sessionId, setSessionId] = useState<number>(1);
  const [outcome, setOutcome] = useState<GameOutcome | null>(null);

  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const [settings, setSettings] = useState<UserSettings>(() => loadSettings());
  const [developerInfo, setDeveloperInfo] = useState<DeveloperInfo>(() =>
    loadDeveloperInfo()
  );

  const [activeAdRequest, setActiveAdRequest] =
    useState<AdRewardRequest | null>(null);
  const [pendingReplayMode, setPendingReplayMode] = useState<GameMode | null>(
    null
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    initAdMob();
  }, []);

  useEffect(() => {
    soundEngine.setEnabled(settings.soundEnabled);
    soundEngine.setMusicEnabled(settings.musicEnabled);
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    saveDeveloperInfo(developerInfo);
  }, [developerInfo]);

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

  const handleUpdateDeveloperInfo = (patch: Partial<DeveloperInfo>) => {
    setDeveloperInfo((prev) => ({ ...prev, ...patch }));
    showToast('تم حفظ معلومات المطور بنجاح');
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
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const handleStartGame = (modeOverride?: GameMode) => {
    launchRoundImmediately(modeOverride);
  };

  const handleReplayFromResult = (modeToPlay: GameMode) => {
    // Show clean between-round interstitial ad before starting a replay round
    setPendingReplayMode(modeToPlay);
  };

  const handleFinishInterstitial = useCallback(() => {
    const modeToStart = pendingReplayMode ?? selectedMode;
    setPendingReplayMode(null);
    launchRoundImmediately(modeToStart);
  }, [pendingReplayMode, selectedMode, launchRoundImmediately]);

  const handleFinishGame = (result: GameOutcome) => {
    setOutcome(result);
    setProfile((prev) => ({
      ...prev,
      coins: prev.coins + result.earnedCoins,
      bestPrize: Math.max(prev.bestPrize, result.finalPrize),
      gamesPlayed: prev.gamesPlayed + 1,
      totalCorrect: prev.totalCorrect + result.correctCount,
    }));
    setScreen('RESULT');
    window.scrollTo({ top: 0, behavior: 'auto' });
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

  return (
    <>
      {screen === 'PLAYING' ? (
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
          onExitToMenu={() => handleBackToMenu('HOME')}
          onFinishGame={handleFinishGame}
        />
      ) : screen === 'RESULT' && outcome ? (
        <ResultScreen
          outcome={outcome}
          bestPrize={profile.bestPrize}
          totalCoins={profile.coins}
          onDoubleCoinsReward={handleDoubleCoinsReward}
          onRequestAdReward={handleRequestAdReward}
          onPlayAgain={() => handleReplayFromResult(outcome.mode)}
          onBackToMenu={() => handleBackToMenu('HOME')}
        />
      ) : (
        <MenuScreen
          activeView={activeView}
          onChangeView={(view) => {
            setActiveView(view);
            window.scrollTo({ top: 0, behavior: 'auto' });
          }}
          selectedMode={selectedMode}
          onSelectMode={setSelectedMode}
          profile={profile}
          settings={settings}
          developerInfo={developerInfo}
          onUpdateProfile={handleUpdateProfile}
          onUpdateSettings={handleUpdateSettings}
          onUpdateDeveloperInfo={handleUpdateDeveloperInfo}
          onResetProgress={handleResetProgress}
          onClaimDailyBonus={handleClaimDailyBonus}
          onWatchCoinsAd={handleWatchCoinsAd}
          onStartGame={handleStartGame}
        />
      )}

      {/* Global Rewarded Ad Modal */}
      <RewardedAdModal
        request={activeAdRequest}
        onClose={() => setActiveAdRequest(null)}
      />

      {/* Monetizable Between-Rounds Interstitial Ad */}
      <InterstitialAdModal
        open={pendingReplayMode !== null}
        onContinue={handleFinishInterstitial}
      />

      {/* Lightweight Toast Feedback */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[#0F1C3D] border border-[#D9A441]/50 text-[#F8F5EE] px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs sm:text-sm font-medium whitespace-nowrap"
        >
          <CheckCircle2
            className="h-4 w-4 text-emerald-400 shrink-0"
            aria-hidden="true"
          />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
