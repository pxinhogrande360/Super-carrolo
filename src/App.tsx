import { useCallback, useEffect, useRef, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { soundEngine } from './audio/soundEngine';
import { resolveBattleBiome } from './canvas/biomeRenderer';
import { AchievementsModal } from './components/AchievementsModal';
import { ArcadeArenaModal } from './components/ArcadeArenaModal';
import { BattleArena } from './components/BattleArena';
import { BattleLoadingTips } from './components/BattleLoadingTips';
import { CityNewspaperModal } from './components/CityNewspaper';
import { ExportModal } from './components/ExportModal';
import { OverworldMap } from './components/OverworldMap';
import { PvpLobbyModal } from './components/PvpLobbyModal';
import { RosterSkillsModal } from './components/RosterSkillsModal';
import { SettingsModal } from './components/SettingsModal';
import { TitleScreen } from './components/TitleScreen';
import { apiUrl } from './utils/apiBase';
import { ALL_STORY_LEVELS, BOSS_CHARACTER_LIST, CHARACTERS, CHARACTER_LIST, SKILLS } from './data/gameData';
import { SIDE_QUESTS } from './data/overworldData';
import { loadLastReplay } from './data/replayStore';
import {
  acceptSideQuest,
  appendBattleChronicle,
  buyShopItem,
  claimSideQuest,
  equipSkill,
  evaluateAchievements,
  loadSaveData,
  persistSaveData,
  recordSkillUsage,
  upgradeAttribute,
} from './data/saveStore';
import {
  ActiveBattleConfig,
  ArenaBiomeId,
  AttributeKey,
  BattleMatchTelemetry,
  ControlMode,
  MatchReplay,
  SaveData,
  ShopItemDef,
  SkillCategory,
  SkillId,
  StoryLevel,
  ThemeMode,
} from './types/game';

type AppView = 'TITLE' | 'OVERWORLD' | 'ROSTER' | 'FREE_SETUP' | 'PVP_LOBBY' | 'BATTLE';

export default function App() {
  const [save, setSave] = useState<SaveData>(() => loadSaveData());
  const [lastReplay, setLastReplay] = useState<MatchReplay | null>(() => loadLastReplay());
  const [view, setView] = useState<AppView>('TITLE');
  const [returnView, setReturnView] = useState<AppView>('TITLE');
  const [battleConfig, setBattleConfig] = useState<ActiveBattleConfig | null>(null);
  const [battleKey, setBattleKey] = useState(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [arcadeModalOpen, setArcadeModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [newspaperOpen, setNewspaperOpen] = useState(false);
  const [arenaLoadingPending, setArenaLoadingPending] = useState(false);
  const [musicOn, setMusicOn] = useState(() => soundEngine.musicEnabled);
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [landscapeDismissed, setLandscapeDismissed] = useState(false);
  const pvpSocketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 768;
      setIsPortraitMobile(portrait);
      if (!portrait) setLandscapeDismissed(false);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  useEffect(() => {
    soundEngine.setMuted(save.muted);
  }, [save.muted]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', save.themeMode === 'dark_contrast');
  }, [save.themeMode]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((cur) => (cur === msg ? null : cur));
    }, 3600);
  }, []);

  const handleToggleMute = useCallback(() => {
    setSave((prev) => {
      const next = { ...prev, muted: !prev.muted };
      soundEngine.setMuted(next.muted);
      persistSaveData(next);
      return next;
    });
  }, []);

  const handleToggleMusic = useCallback(() => {
    setMusicOn((prev) => {
      const next = !prev;
      soundEngine.setMusicEnabled(next);
      return next;
    });
  }, []);

  const handleChangeTheme = useCallback(
    (mode: ThemeMode) => {
      setSave((prev) => {
        if (prev.themeMode === mode) return prev;
        const next = { ...prev, themeMode: mode };
        persistSaveData(next);
        return next;
      });
      showToast(
        mode === 'dark_contrast'
          ? 'Dark Mode (Alto Contraste) ativado!'
          : 'Tema Padrão restaurado!'
      );
    },
    [showToast]
  );

  const handleChangeControlMode = useCallback(
    (mode: ControlMode) => {
      setSave((prev) => {
        if (prev.controlMode === mode) return prev;
        const next = { ...prev, controlMode: mode };
        persistSaveData(next);
        return next;
      });
      const label =
        mode === 'buttons' ? 'Botões' : mode === 'gestures' ? 'Gestos' : 'Botões + Gestos';
      showToast(`Controle definido para: ${label}`);
    },
    [showToast]
  );

  const handleResetTutorial = useCallback(() => {
    setSave((prev) => {
      const next = { ...prev, tutorialCompleted: false };
      persistSaveData(next);
      return next;
    });
    showToast('Tutorial reativado para a fase 1-1!');
  }, [showToast]);

  const handleSelectCharacter = useCallback((charId: string) => {
    setSave((prev) => {
      const next = { ...prev, selectedCharId: charId };
      persistSaveData(next);
      return next;
    });
  }, []);

  const handleUpgradeAttribute = useCallback((charId: string, key: AttributeKey) => {
    setSave((prev) => upgradeAttribute(prev, charId, key));
  }, []);

  const handleEquipSkill = useCallback(
    (charId: string, category: SkillCategory, skillId: SkillId) => {
      setSave((prev) => equipSkill(prev, charId, category, skillId));
    },
    []
  );

  const handleAcceptQuest = useCallback(
    (questId: string) => {
      setSave((prev) => acceptSideQuest(prev, questId));
      const quest = SIDE_QUESTS[questId];
      if (quest) {
        soundEngine.playSkill();
        showToast(`Missão aceita: ${quest.title}`);
      }
    },
    [showToast]
  );

  const handleClaimQuest = useCallback(
    (questId: string) => {
      setSave((prev) => {
        const res = claimSideQuest(prev, questId, prev.selectedCharId);
        if (res.claimed) {
          const quest = SIDE_QUESTS[questId];
          soundEngine.playVictory();
          if (quest) {
            showToast(
              `Recompensa resgatada: +${quest.rewardCoins} Rolhas e +${quest.rewardAttrPoints} pt!`
            );
          }
        }
        return res.nextSave;
      });
    },
    [showToast]
  );

  const handleBuyShopItem = useCallback(
    (item: ShopItemDef) => {
      setSave((prev) => {
        const res = buyShopItem(prev, item, prev.selectedCharId);
        if (res.ok) {
          soundEngine.playSkill();
          if (res.leveledSkill) {
            showToast(`${item.name} comprado! ${SKILLS[res.leveledSkill].name} subiu de nível!`);
          } else {
            showToast(`${item.name} adquirido!`);
          }
        } else if (res.reason) {
          showToast(res.reason);
        }
        return res.nextSave;
      });
    },
    [showToast]
  );

  const launchStoryLevel = useCallback(
    (lvl: StoryLevel, forceTutorial = false) => {
      setReturnView('OVERWORLD');
      const shouldRunTutorial =
        forceTutorial || (lvl.id === '0-0' && !save.tutorialCompleted);
      setBattleConfig({
        mode: 'STORY',
        player1CharId: save.selectedCharId,
        player2CharId: lvl.opponentCharId,
        player2Name: lvl.opponentName,
        storyLevel: lvl,
        difficulty: lvl.difficulty,
        enableTutorial: shouldRunTutorial,
      });
      setBattleKey((k) => k + 1);
      setArenaLoadingPending(true);
      setView('BATTLE');
    },
    [save.selectedCharId, save.tutorialCompleted]
  );

  const handleTutorialCompleted = useCallback(() => {
    setSave((prev) => {
      if (prev.tutorialCompleted) return prev;
      const next = { ...prev, tutorialCompleted: true };
      persistSaveData(next);
      return next;
    });
  }, []);

  const launchArcadeWave = useCallback(
    (
      wave: number,
      carriedScore: number,
      arenaBiome: ArenaBiomeId = 'docks',
      arenaCycle = true
    ) => {
      const isBossWave = wave % 5 === 0 && BOSS_CHARACTER_LIST.length > 0;
      const picked = isBossWave
        ? BOSS_CHARACTER_LIST[(Math.floor(wave / 5) - 1) % BOSS_CHARACTER_LIST.length]
        : CHARACTER_LIST[(wave - 1) % CHARACTER_LIST.length];
      setReturnView('TITLE');
      setBattleConfig({
        mode: 'ARCADE',
        player1CharId: save.selectedCharId,
        player2CharId: picked.id,
        player2Name: isBossWave
          ? `${picked.name} (Chefe · Onda ${wave})`
          : `${picked.name} (Onda ${wave})`,
        arcadeWave: wave,
        arcadeScore: carriedScore,
        arenaBiome,
        arenaCycle,
        difficulty: Math.min(10, 2 + Math.floor(wave * 0.8)),
      });
      setBattleKey((k) => k + 1);
      setArenaLoadingPending(true);
      setView('BATTLE');
    },
    [save.selectedCharId]
  );

  const handleBattleFinished = useCallback(
    (telemetry: BattleMatchTelemetry) => {
      if (!battleConfig) return;
      const { won, usedSkills, scoreDelta } = telemetry;

      setSave((prev) => {
        const { nextSave, leveledUp } = recordSkillUsage(
          prev,
          battleConfig.player1CharId,
          usedSkills
        );

        let updated = { ...nextSave };
        const isBossStage = Boolean(battleConfig.storyLevel?.isBoss);
        const coinReward = won
          ? battleConfig.mode === 'STORY'
            ? isBossStage
              ? 60
              : 25
            : battleConfig.mode === 'ARCADE'
            ? 20
            : 15
          : 5;
        updated.coins = (updated.coins || 0) + coinReward;
        if (won) {
          updated.totalWins += 1;
        }

        // Story completion, attribute points & character unlocks
        if (won && battleConfig.mode === 'STORY' && battleConfig.storyLevel) {
          const lvl = battleConfig.storyLevel;
          const firstClear = !updated.completedLevels.includes(lvl.id);
          if (firstClear) {
            updated.completedLevels = [...updated.completedLevels, lvl.id];
            const charProg = updated.progression[battleConfig.player1CharId];
            if (charProg) {
              updated = {
                ...updated,
                progression: {
                  ...updated.progression,
                  [battleConfig.player1CharId]: {
                    ...charProg,
                    attributePoints: charProg.attributePoints + lvl.rewardPoints,
                  },
                },
              };
            }
          }

          // Playable ally unlocks upon defeating each district Boss (bosses stay non-playable)
          const unlockMap: Record<string, string> = {
            '0-5': 'nina',
            '1-5': 'brasa',
            '2-5': 'mola',
            '3-5': 'ferro',
            '4-5': 'karrolo',
          };
          const unlockedChar = unlockMap[lvl.id];
          if (unlockedChar && !updated.unlockedChars.includes(unlockedChar)) {
            updated.unlockedChars = [...updated.unlockedChars, unlockedChar];
            const allyName = CHARACTERS[unlockedChar]?.name || unlockedChar.toUpperCase();
            showToast(`Novo aliado jogável desbloqueado: ${allyName}!`);
          }
        }

        // Arcade high score
        if (battleConfig.mode === 'ARCADE') {
          const wave = battleConfig.arcadeWave || 1;
          if (scoreDelta > updated.arcadeHighScore) {
            updated.arcadeHighScore = scoreDelta;
          }
          if (wave > updated.arcadeBestWave) {
            updated.arcadeBestWave = wave;
          }
          fetch(apiUrl('/api/arcade-scores'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Campeão',
              charId: battleConfig.player1CharId,
              score: scoreDelta,
              wave,
            }),
          }).catch(() => {});
        }

        if (leveledUp.length > 0) {
          const firstSkill = SKILLS[leveledUp[0]];
          const newLvl =
            updated.progression[battleConfig.player1CharId]?.skillProgress[leveledUp[0]]
              ?.level || 2;
          showToast(`Habilidade evoluiu: ${firstSkill.name} Nv.${newLvl}!`);
        }

        const isBoss = Boolean(battleConfig.storyLevel?.isBoss);
        const { nextSave: withAchievements, newlyUnlocked } = evaluateAchievements(
          updated,
          telemetry,
          isBoss
        );
        if (newlyUnlocked.length > 0) {
          showToast(`Conquista desbloqueada: ${newlyUnlocked[0].title}!`);
        }

        const resolvedBiome = resolveBattleBiome(battleConfig);
        const oppDisplayName =
          battleConfig.player2Name ||
          battleConfig.storyLevel?.opponentName ||
          battleConfig.player2CharId.toUpperCase();

        return appendBattleChronicle(withAchievements, {
          id: `${Date.now()}`,
          timestamp: Date.now(),
          won,
          mode: battleConfig.mode,
          p1CharId: battleConfig.player1CharId,
          p2CharId: battleConfig.player2CharId,
          p2Name: oppDisplayName,
          arenaBiome: resolvedBiome,
          isBoss,
          score: scoreDelta,
          perfectCount: telemetry.perfectCount,
          counterCount: telemetry.counterCount,
          maxPerfectStreak: telemetry.bestPerfectStreakInMatch,
          tookDamage: telemetry.tookDamage,
          arcadeWave: battleConfig.arcadeWave,
          levelName: battleConfig.storyLevel?.name,
        });
      });
      setLastReplay(loadLastReplay());
    },
    [battleConfig, showToast]
  );

  const handleWatchReplay = useCallback(
    (replay: MatchReplay, nextReturnView?: AppView) => {
      if (pvpSocketRef.current) {
        pvpSocketRef.current.close();
        pvpSocketRef.current = null;
      }
      if (nextReturnView) {
        setReturnView(nextReturnView);
      }
      setBattleConfig({
        mode: replay.mode,
        player1CharId: replay.p1CharId,
        player2CharId: replay.p2CharId,
        player2Name: replay.p2Name,
        arenaBiome: replay.arenaBiome,
        replayData: replay,
      });
      setBattleKey((k) => k + 1);
      setArenaLoadingPending(false);
      setView('BATTLE');
    },
    []
  );

  const handleNextStage = useCallback(() => {
    if (!battleConfig) return;
    if (battleConfig.mode === 'ARCADE') {
      const nextWave = (battleConfig.arcadeWave || 1) + 1;
      const carryScore = (battleConfig.arcadeScore || 0) + 500;
      launchArcadeWave(
        nextWave,
        carryScore,
        battleConfig.arenaBiome || 'docks',
        battleConfig.arenaCycle ?? true
      );
      return;
    }
    if (battleConfig.mode === 'STORY' && battleConfig.storyLevel) {
      const idx = ALL_STORY_LEVELS.findIndex((l) => l.id === battleConfig.storyLevel!.id);
      if (idx >= 0 && idx < ALL_STORY_LEVELS.length - 1) {
        launchStoryLevel(ALL_STORY_LEVELS[idx + 1]);
      } else {
        setView('OVERWORLD');
      }
    }
  }, [battleConfig, launchArcadeWave, launchStoryLevel]);

  const handleExitBattle = useCallback(() => {
    if (pvpSocketRef.current) {
      pvpSocketRef.current.close();
      pvpSocketRef.current = null;
    }
    setArenaLoadingPending(false);
    setBattleConfig(null);
    setView(returnView);
  }, [returnView]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#18121E] dark:bg-[#05070B]">
      {view === 'TITLE' && (
        <TitleScreen
          save={save}
          lastReplay={lastReplay}
          achievementsModalOpen={
            achievementsOpen || arcadeModalOpen || settingsOpen || newspaperOpen || exportOpen
          }
          onStartStory={() => setView('OVERWORLD')}
          onStartFreeMode={() => {
            setReturnView('TITLE');
            setView('FREE_SETUP');
          }}
          onStartArcade={() => setArcadeModalOpen(true)}
          onOpenPvp={() => setView('PVP_LOBBY')}
          onOpenRoster={() => {
            setReturnView('TITLE');
            setView('ROSTER');
          }}
          onOpenAchievements={() => setAchievementsOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenExport={() => setExportOpen(true)}
          onOpenNewspaper={() => setNewspaperOpen(true)}
          onWatchReplay={() => {
            if (lastReplay) handleWatchReplay(lastReplay, 'TITLE');
          }}
          onToggleMute={handleToggleMute}
        />
      )}

      {view === 'TITLE' && newspaperOpen && (
        <CityNewspaperModal save={save} onClose={() => setNewspaperOpen(false)} />
      )}

      {view === 'TITLE' && achievementsOpen && (
        <AchievementsModal save={save} onClose={() => setAchievementsOpen(false)} />
      )}

      {view === 'TITLE' && arcadeModalOpen && (
        <ArcadeArenaModal
          save={save}
          onClose={() => setArcadeModalOpen(false)}
          onStartArcade={(startBiome, cycleBiomes) => {
            setArcadeModalOpen(false);
            launchArcadeWave(1, 0, startBiome, cycleBiomes);
          }}
        />
      )}

      {view === 'OVERWORLD' && (
        <OverworldMap
          save={save}
          onBack={() => setView('TITLE')}
          onOpenSkills={() => {
            setReturnView('OVERWORLD');
            setView('ROSTER');
          }}
          onEnterLevel={launchStoryLevel}
          onAcceptQuest={handleAcceptQuest}
          onClaimQuest={handleClaimQuest}
          onBuyShopItem={handleBuyShopItem}
        />
      )}

      {(view === 'ROSTER' || view === 'FREE_SETUP') && (
        <RosterSkillsModal
          save={save}
          mode={view === 'FREE_SETUP' ? 'FREE_SETUP' : 'ROSTER'}
          onClose={() => setView(returnView)}
          onSelectCharacter={handleSelectCharacter}
          onUpgradeAttribute={handleUpgradeAttribute}
          onEquipSkill={handleEquipSkill}
          onStartFreeBattle={(p1, p2, diff, arenaBiome) => {
            setReturnView('TITLE');
            setBattleConfig({
              mode: 'FREE',
              player1CharId: p1,
              player2CharId: p2,
              arenaBiome,
              difficulty: diff,
            });
            setBattleKey((k) => k + 1);
            setArenaLoadingPending(true);
            setView('BATTLE');
          }}
        />
      )}

      {view === 'PVP_LOBBY' && (
        <PvpLobbyModal
          save={save}
          onClose={() => setView('TITLE')}
          onStartLocalPvp={(p1, p2, arenaBiome) => {
            setReturnView('TITLE');
            setBattleConfig({
              mode: 'PVP_LOCAL',
              player1CharId: p1,
              player2CharId: p2,
              arenaBiome,
            });
            setBattleKey((k) => k + 1);
            setArenaLoadingPending(true);
            setView('BATTLE');
          }}
          onStartOnlinePvp={(ws, code, slot, p1, p2, opponentName, arenaBiome) => {
            pvpSocketRef.current = ws;
            setReturnView('TITLE');
            setBattleConfig({
              mode: 'PVP_ONLINE',
              player1CharId: p1,
              player2CharId: p2,
              player2Name: slot === 1 ? opponentName : undefined,
              arenaBiome,
              pvpRoomCode: code,
              pvpPlayerSlot: slot,
            });
            setBattleKey((k) => k + 1);
            setArenaLoadingPending(false);
            setView('BATTLE');
          }}
        />
      )}

      {view === 'BATTLE' && battleConfig && arenaLoadingPending && (
        <BattleLoadingTips
          key={`tips-${battleKey}`}
          config={battleConfig}
          biomeId={resolveBattleBiome(battleConfig)}
          onComplete={() => setArenaLoadingPending(false)}
        />
      )}

      {view === 'BATTLE' && battleConfig && !arenaLoadingPending && (
        <BattleArena
          key={battleKey}
          config={battleConfig}
          save={save}
          pvpSocket={pvpSocketRef.current}
          onToggleMute={handleToggleMute}
          onOpenSettings={() => setSettingsOpen(true)}
          onTutorialCompleted={handleTutorialCompleted}
          onBattleFinished={handleBattleFinished}
          onWatchReplay={(replay) => handleWatchReplay(replay)}
          onExit={handleExitBattle}
          onNextStage={
            !battleConfig.replayData &&
            (battleConfig.mode === 'STORY' || battleConfig.mode === 'ARCADE')
              ? handleNextStage
              : undefined
          }
        />
      )}

      {/* Settings Modal (Controls, Theme & Audio) */}
      {settingsOpen && (
        <SettingsModal
          save={save}
          musicOn={musicOn}
          onChangeTheme={handleChangeTheme}
          onChangeControlMode={handleChangeControlMode}
          onToggleMute={handleToggleMute}
          onToggleMusic={handleToggleMusic}
          onResetTutorial={handleResetTutorial}
          onOpenExport={() => setExportOpen(true)}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {exportOpen && <ExportModal onClose={() => setExportOpen(false)} />}

      {/* Progression Toast */}
      {toastMsg && (
        <div className="pointer-events-none fixed top-14 left-1/2 -translate-x-1/2 z-[60] cartoon-outline rounded-xl bg-[#FBBF24] dark:bg-[#FDE047] text-[#111827] px-3.5 py-1.5 font-display text-xs">
          {toastMsg}
        </div>
      )}

      {/* Landscape Orientation Guidance on Narrow Portrait Phones */}
      {isPortraitMobile && !landscapeDismissed && (
        <div className="fixed inset-0 z-50 bg-[#18121E]/95 dark:bg-[#05070B]/95 flex flex-col items-center justify-center p-6 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FBBF24] dark:bg-[#FDE047] border-[3px] border-[#111827] flex items-center justify-center shadow-[0_4px_0_#111827]">
            <Smartphone className="w-8 h-8 text-[#111827] -rotate-90 transition-transform" />
          </div>
          <div className="space-y-1.5 max-w-xs">
            <h2 className="font-display text-xl text-[#FDE68A] dark:text-[#FDE047]">
              Modo Horizontal Recomendado
            </h2>
            <p className="text-xs text-[#E5D5B5] dark:text-[#E2E8F0] leading-relaxed">
              Vire seu aparelho na horizontal para ter a arena completa e os comandos originais na ponta dos dedos.
            </p>
          </div>
          <button
            onClick={() => setLandscapeDismissed(true)}
            className="cartoon-btn px-4 py-2 rounded-xl bg-[#FFF8EB] dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] font-bold text-xs"
          >
            Continuar assim mesmo
          </button>
        </div>
      )}
    </div>
  );
}
