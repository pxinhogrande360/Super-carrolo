import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useAnimate } from 'motion/react';
import {
  Pause,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Volume2,
  VolumeX,
  ArrowLeft,
  Crown,
  Film,
  FastForward,
  ScrollText,
  Zap,
  Music,
  Settings,
  Star,
  BarChart3,
  MessageSquareQuote,
  Wind,
} from 'lucide-react';
import {
  ARENA_CONDITIONS,
  ArenaConditionDef,
  computeConditionMitigation,
  rollArenaCondition,
} from '../data/arenaConditions';
import { CHARACTERS, SKILLS } from '../data/gameData';
import { getPreBattleDialogue } from '../data/preBattleDialogue';
import { saveLastReplay } from '../data/replayStore';
import { getEffectiveAttributes } from '../data/saveStore';
import { soundEngine } from '../audio/soundEngine';
import {
  BottleRenderState,
  ComicSfxBurst,
  FighterPose,
  FighterRenderState,
  FloatingCallout,
  Particle,
  drawBottle,
  drawComicSfxBursts,
  drawDuelingTable,
  drawFighter,
  drawFloatingCallouts,
  drawParticles,
  getFighterHandPos,
} from '../canvas/cartoonRenderer';
import {
  AmbientParticle,
  BIOMES,
  createAmbientParticles,
  drawBiomeBackground,
  resolveBattleBiome,
  updateAndDrawAmbientParticles,
} from '../canvas/biomeRenderer';
import {
  ActiveBattleConfig,
  ArenaRoundEvent,
  Attributes,
  BattleMatchTelemetry,
  CarrolloType,
  MatchReplay,
  ReplayEvent,
  SaveData,
  SkillCategory,
  SkillId,
} from '../types/game';
import { CharacterAvatar } from './CharacterAvatar';
import { ChibiCharacterSprite } from './ChibiCharacterSprite';
import { CombatReportModal, CombatReportView } from './CombatReportView';

interface BattleArenaProps {
  config: ActiveBattleConfig;
  save: SaveData;
  pvpSocket?: WebSocket | null;
  onToggleMute: () => void;
  onOpenSettings?: () => void;
  onTutorialCompleted?: () => void;
  onBattleFinished: (result: BattleMatchTelemetry) => void;
  onWatchReplay?: (replay: MatchReplay) => void;
  onExit: () => void;
  onNextStage?: () => void;
}

type DuelPhase =
  | 'ARENA_ENTRANCE'
  | 'TURN_INTRO'
  | 'SPIN_READY'
  | 'BOTTLE_FLIGHT'
  | 'CARROLLO_WINDOW'
  | 'DEFENSE_WINDOW'
  | 'STRIKE_RESOLVE'
  | 'MATCH_OVER';

interface FighterSim {
  slot: 1 | 2;
  charId: string;
  name: string;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  attrs: Attributes;
  pose: FighterPose;
  poseTimer: number;
  poseDuration: number;
  hitFlash: number;
  vulnerable: boolean;
  shieldTurns: number;
  burnTurns: number;
  precisionDebuffTurns: number;
  damageBoost: number; // multiplier e.g. 1.35
  guardBreak: boolean;
  bottleMagnet: boolean; // Chumbo na base / special
  bottleSabotage: boolean; // Vento cruzado
  secondChance: boolean; // Giro invertido
  counterReady: boolean;
  equippedSkills: Record<SkillCategory, SkillId>;
}

type BattleLogTone = 'perfect' | 'critical' | 'fail' | 'counter' | 'skill' | 'info';

interface BattleLogEntry {
  id: number;
  timeLabel: string;
  message: string;
  tone: BattleLogTone;
}

interface HudSnapshot {
  p1Hp: number;
  p1MaxHp: number;
  p1Energy: number;
  p2Hp: number;
  p2MaxHp: number;
  p2Energy: number;
  activeTurn: 1 | 2;
  phase: DuelPhase;
  ringProgress: number; // 0..1
  ringTargetStart: number;
  ringTargetEnd: number;
  chargeRatio: number;
  promptText: string;
  canCounter: boolean;
  p1Buffs: string[];
  p2Buffs: string[];
  winner: 0 | 1 | 2;
  score: number;
  comboCount: number;
  comboMultiplier: number;
  maxCombo: number;
  comboPop: number;
  endQuip?: string;
  tutorialStep: 'NONE' | 'SPIN_GUIDE' | 'PERFECT_TIMING_GUIDE' | 'DONE';
  actionLog: BattleLogEntry[];
  roundEvent: ArenaRoundEvent;
  arenaCondition: ArenaConditionDef;
  bottleSweetSpot: number;
  defenseRatio: number;
  matchStats: {
    damageDealt: number;
    perfectCount: number;
    counterCount: number;
    enemyStrikesFaced: number;
    bottleUprights: number;
    precisionPct: number;
    avgReactionMs: number;
  };
}

const PARTICLE_POOL_SIZE = 32;
const ENTRANCE_DURATION = 1.45;

function formatMatchTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
}

export const BattleArena: React.FC<BattleArenaProps> = ({
  config,
  save,
  pvpSocket,
  onToggleMute,
  onOpenSettings,
  onTutorialCompleted,
  onBattleFinished,
  onWatchReplay,
  onExit,
  onNextStage,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isReplayMode = Boolean(config.replayData);
  const biomeId = config.replayData?.arenaBiome || resolveBattleBiome(config);
  const biomeDef = BIOMES[biomeId];

  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  pausedRef.current = paused;

  const [showCombatLog, setShowCombatLog] = useState(false);
  const [musicOn, setMusicOn] = useState(() => soundEngine.musicEnabled);
  const [replaySpeed, setReplaySpeed] = useState<1 | 2>(1);
  const replaySpeedRef = useRef<1 | 2>(1);
  replaySpeedRef.current = replaySpeed;

  const controlMode = save.controlMode || 'both';
  const allowButtons = controlMode !== 'gestures';
  const allowGestures = controlMode !== 'buttons';
  const gestureRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    swipedUp: boolean;
  }>({ active: false, startX: 0, startY: 0, swipedUp: false });

  const [arenaShakeScope, animateArenaShake] = useAnimate<HTMLDivElement>();
  const [comboMeterScope, animateComboMeter] = useAnimate<HTMLDivElement>();
  const [comboMilestoneGlow, setComboMilestoneGlow] = useState<5 | 10 | 20 | null>(null);
  const [postMatchTab, setPostMatchTab] = useState<'summary' | 'report'>('summary');
  const [combatReportOpen, setCombatReportOpen] = useState(false);
  const [preDialogue] = useState(() => getPreBattleDialogue(config, biomeId));
  const [introDialogueOpen, setIntroDialogueOpen] = useState(
    () => !isReplayMode && config.mode !== 'PVP_ONLINE'
  );
  const introDialogueOpenRef = useRef(introDialogueOpen);
  introDialogueOpenRef.current = introDialogueOpen;
  const ambientParticlesRef = useRef<AmbientParticle[]>(createAmbientParticles(10));
  const prevComboCountRef = useRef(0);
  const prevComboMultRef = useRef(1);

  const triggerMotionShake = useCallback(
    (strength: 'subtle' | 'heavy') => {
      if (!arenaShakeScope.current) return;
      if (
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        return;
      }
      if (strength === 'heavy') {
        void animateArenaShake(
          arenaShakeScope.current,
          {
            x: [0, -4.5, 4.5, -2.5, 2, -1, 0],
            y: [0, 3, -3, 1.5, -1, 0],
            rotate: [0, -0.35, 0.35, -0.15, 0],
          },
          { duration: 0.28, ease: 'easeOut' }
        );
      } else {
        void animateArenaShake(
          arenaShakeScope.current,
          {
            x: [0, -2.5, 2.5, -1.5, 1, 0],
            y: [0, 1.5, -1.5, 0.8, 0],
            rotate: [0, -0.18, 0.18, 0],
          },
          { duration: 0.2, ease: 'easeOut' }
        );
      }
    },
    [animateArenaShake, arenaShakeScope]
  );

  useEffect(() => {
    if (!introDialogueOpen) return;
    const t = setTimeout(() => setIntroDialogueOpen(false), 2800);
    return () => clearTimeout(t);
  }, [introDialogueOpen]);

  const initialConditionRef = useRef<ArenaConditionDef>(
    !isReplayMode && config.mode !== 'PVP_ONLINE' && !config.enableTutorial
      ? rollArenaCondition(biomeId)
      : ARENA_CONDITIONS.ar_estavel
  );

  const p1Char = CHARACTERS[config.player1CharId] || CHARACTERS.leo;
  const p2Char = CHARACTERS[config.player2CharId] || CHARACTERS.karrolo;

  const mySlot: 1 | 2 =
    config.mode === 'PVP_ONLINE' ? config.pvpPlayerSlot || 1 : 1;

  // Track skill usage during this match for frequent-use evolution
  const usedSkillsRef = useRef<Partial<Record<SkillId, number>>>({});
  const resultReportedRef = useRef(false);
  const recordedEventsRef = useRef<ReplayEvent[]>([]);
  const lastSavedReplayRef = useRef<MatchReplay | null>(null);
  const replayCursorRef = useRef<number>(0);

  const makeFighterSim = useCallback(
    (slot: 1 | 2): FighterSim => {
      const rep = config.replayData;
      if (rep) {
        const charId = slot === 1 ? rep.p1CharId : rep.p2CharId;
        const maxHp = slot === 1 ? rep.p1MaxHp : rep.p2MaxHp;
        const attrs = slot === 1 ? { ...rep.p1Attrs } : { ...rep.p2Attrs };
        const skills = slot === 1 ? { ...rep.p1Skills } : { ...rep.p2Skills };
        const name = slot === 1 ? rep.p1Name : rep.p2Name;
        return {
          slot,
          charId,
          name,
          hp: maxHp,
          maxHp,
          energy: 35,
          maxEnergy: 100,
          attrs,
          pose: 'IDLE',
          poseTimer: 0,
          poseDuration: 0.68,
          hitFlash: 0,
          vulnerable: false,
          shieldTurns: 0,
          burnTurns: 0,
          precisionDebuffTurns: 0,
          damageBoost: 1,
          guardBreak: false,
          bottleMagnet: false,
          bottleSabotage: false,
          secondChance: false,
          counterReady: false,
          equippedSkills: skills,
        };
      }

      const charId = slot === 1 ? config.player1CharId : config.player2CharId;
      const char = CHARACTERS[charId] || CHARACTERS.leo;
      const prog = save.progression[charId];
      const baseAttrs =
        slot === 1 || config.mode === 'PVP_LOCAL'
          ? getEffectiveAttributes(save, charId)
          : { ...char.baseAttributes };

      const diffScale =
        slot === 2 && config.mode !== 'PVP_LOCAL' && config.mode !== 'PVP_ONLINE'
          ? (config.difficulty ?? 4) * 0.35
          : 0;

      const attrs: Attributes = {
        precisao: Math.round(baseAttrs.precisao + diffScale),
        velocidade: Math.round(baseAttrs.velocidade + diffScale * 0.8),
        resistencia: Math.round(baseAttrs.resistencia + diffScale * 0.8),
        sorte: Math.round(baseAttrs.sorte + diffScale * 0.6),
        energia: Math.round(baseAttrs.energia + diffScale * 0.8),
      };

      const hpMult = slot === 2 && config.storyLevel ? config.storyLevel.hpMultiplier : 1;
      const arcadeMult =
        slot === 2 && config.mode === 'ARCADE'
          ? 0.85 + ((config.arcadeWave || 1) - 1) * 0.16
          : 1;
      const maxHp = Math.round((110 + attrs.resistencia * 10) * hpMult * arcadeMult);

      return {
        slot,
        charId,
        name:
          slot === 2 && config.player2Name
            ? config.player2Name
            : slot === 2 && config.storyLevel
            ? config.storyLevel.opponentName
            : char.name,
        hp: maxHp,
        maxHp,
        energy: 35,
        maxEnergy: 100,
        attrs,
        pose: 'IDLE',
        poseTimer: 0,
        poseDuration: 0.68,
        hitFlash: 0,
        vulnerable: false,
        shieldTurns: 0,
        burnTurns: 0,
        precisionDebuffTurns: 0,
        damageBoost: 1,
        guardBreak: false,
        bottleMagnet: false,
        bottleSabotage: false,
        secondChance: false,
        counterReady: false,
        equippedSkills: prog?.equippedSkills || char.defaultSkills,
      };
    },
    [config, save]
  );

  // Mutable Simulation Ref (isolated from React renders)
  const simRef = useRef<{
    p1: FighterSim;
    p2: FighterSim;
    activeTurn: 1 | 2;
    phase: DuelPhase;
    phaseTimer: number;
    time: number;
    entranceClock: number;
    entranceBeat: number;
    hitstop: number;
    shake: number;
    score: number;
    // Bottle physics
    bottle: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      angle: number;
      angularVel: number;
      scaleX: number;
      scaleY: number;
      bounces: number;
      willLandUpright: boolean;
      uprightGlow: number;
      heldBy: 0 | 1 | 2;
      isGolden: boolean;
    };
    // Input / timing state
    isChargingSpin: boolean;
    spinCharge: number; // 0..1
    isChargingCarrollo: boolean;
    carrolloCharge: number; // 0..1
    ringProgress: number; // 0..1
    ringTargetStart: number;
    ringTargetEnd: number;
    pendingStrike: {
      type: CarrolloType;
      damage: number;
      defenderBlocked: boolean;
      defenderCountered: boolean;
    } | null;
    aiActionDelay: number;
    aiTriggered: boolean;
    winner: 0 | 1 | 2;
    comboCount: number;
    maxCombo: number;
    comboPop: number;
    endQuip?: string;
    tutorialStep: 'NONE' | 'SPIN_GUIDE' | 'PERFECT_TIMING_GUIDE' | 'DONE';
    particles: Particle[];
    callouts: FloatingCallout[];
    sfxBursts: ComicSfxBurst[];
    actionLog: BattleLogEntry[];
    logSeq: number;
    roundEvent: ArenaRoundEvent;
    arenaCondition: ArenaConditionDef;
    defenseMaxTimer: number;
    counterWindowAvailable: boolean;
    telemetry: {
      damageDealt: number;
      perfectCount: number;
      perfectStreak: number;
      bestPerfectStreak: number;
      tookDamage: boolean;
      counterCount: number;
      enemyStrikesFaced: number;
      bottleUprights: number;
      ringAccuracySamples: number[];
      reactionSamplesMs: number[];
      carrolloWindowOpenedAt: number;
    };
  } | null>(null);

  if (!simRef.current) {
    const pool: Particle[] = [];
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
      pool.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 8,
        color: '#FBBF24',
        life: 0,
        maxLife: 0.5,
        kind: 'star',
        rotation: 0,
        rotSpeed: 0,
      });
    }
    const initialP1 = makeFighterSim(1);
    const initialP2 = makeFighterSim(2);
    const useEntrance = !isReplayMode && config.mode !== 'PVP_ONLINE';
    if (useEntrance) {
      initialP1.pose = 'ENTRANCE';
      initialP2.pose = 'ENTRANCE';
    }
    simRef.current = {
      p1: initialP1,
      p2: initialP2,
      activeTurn: 1,
      phase: useEntrance ? 'ARENA_ENTRANCE' : 'TURN_INTRO',
      phaseTimer: useEntrance ? ENTRANCE_DURATION : 0.7,
      time: 0,
      entranceClock: 0,
      entranceBeat: 0,
      hitstop: 0,
      shake: 0,
      score: config.arcadeScore || 0,
      bottle: {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        angle: 0,
        angularVel: 0,
        scaleX: 1,
        scaleY: 1,
        bounces: 0,
        willLandUpright: true,
        uprightGlow: 0,
        heldBy: 0,
        isGolden: config.player1CharId === 'karrolo' || config.player2CharId === 'karrolo',
      },
      isChargingSpin: false,
      spinCharge: 0,
      isChargingCarrollo: false,
      carrolloCharge: 0,
      ringProgress: 0,
      ringTargetStart: 0.58,
      ringTargetEnd: 0.84,
      pendingStrike: null,
      aiActionDelay: 0.65,
      aiTriggered: false,
      winner: 0,
      comboCount: 0,
      maxCombo: 0,
      comboPop: 0,
      tutorialStep: !isReplayMode && config.enableTutorial ? 'SPIN_GUIDE' : 'NONE',
      particles: pool,
      callouts: [],
      sfxBursts: [],
      actionLog: [
        {
          id: 1,
          timeLabel: '0:00',
          message: `Duelo iniciado: ${initialP1.name} vs ${initialP2.name}!`,
          tone: 'info',
        },
      ],
      logSeq: 1,
      roundEvent: 'NONE',
      arenaCondition: initialConditionRef.current,
      defenseMaxTimer: 0.5,
      counterWindowAvailable: false,
      telemetry: {
        damageDealt: 0,
        perfectCount: 0,
        perfectStreak: save.achievementStats?.currentPerfectStreak || 0,
        bestPerfectStreak: save.achievementStats?.currentPerfectStreak || 0,
        tookDamage: false,
        counterCount: 0,
        enemyStrikesFaced: 0,
        bottleUprights: 0,
        ringAccuracySamples: [],
        reactionSamplesMs: [],
        carrolloWindowOpenedAt: 0,
      },
    };
  }

  const initialSnapshotRef = useRef<{
    p1Attrs: Attributes;
    p2Attrs: Attributes;
    p1Skills: Record<SkillCategory, SkillId>;
    p2Skills: Record<SkillCategory, SkillId>;
    p1MaxHp: number;
    p2MaxHp: number;
    p1Name: string;
    p2Name: string;
  } | null>(null);

  if (!initialSnapshotRef.current && simRef.current) {
    initialSnapshotRef.current = {
      p1Attrs: { ...simRef.current.p1.attrs },
      p2Attrs: { ...simRef.current.p2.attrs },
      p1Skills: { ...simRef.current.p1.equippedSkills },
      p2Skills: { ...simRef.current.p2.equippedSkills },
      p1MaxHp: simRef.current.p1.maxHp,
      p2MaxHp: simRef.current.p2.maxHp,
      p1Name: simRef.current.p1.name,
      p2Name: simRef.current.p2.name,
    };
  }

  const [hud, setHud] = useState<HudSnapshot>(() => {
    const s = simRef.current!;
    return {
      p1Hp: s.p1.hp,
      p1MaxHp: s.p1.maxHp,
      p1Energy: s.p1.energy,
      p2Hp: s.p2.hp,
      p2MaxHp: s.p2.maxHp,
      p2Energy: s.p2.energy,
      activeTurn: 1,
      phase: 'TURN_INTRO',
      ringProgress: 0,
      ringTargetStart: 0.58,
      ringTargetEnd: 0.84,
      chargeRatio: 0,
      promptText: 'Prepare-se para o duelo!',
      canCounter: false,
      p1Buffs: [],
      p2Buffs: [],
      winner: 0,
      score: s.score,
      comboCount: 0,
      comboMultiplier: 1,
      maxCombo: 0,
      comboPop: 0,
      tutorialStep: s.tutorialStep,
      actionLog: [...s.actionLog],
      roundEvent: s.roundEvent,
      arenaCondition: s.arenaCondition,
      bottleSweetSpot: 0.68 + s.arenaCondition.sweetSpotShift,
      defenseRatio: 0,
      matchStats: {
        damageDealt: s.telemetry.damageDealt,
        perfectCount: s.telemetry.perfectCount,
        counterCount: s.telemetry.counterCount,
        enemyStrikesFaced: s.telemetry.enemyStrikesFaced,
        bottleUprights: s.telemetry.bottleUprights,
        precisionPct: 0,
        avgReactionMs: 0,
      },
    };
  });

  const matchActive = hud.winner === 0;
  useEffect(() => {
    if (!save.muted && musicOn && !paused && matchActive) {
      soundEngine.startArenaMusic();
    } else {
      soundEngine.stopArenaMusic();
    }
    return () => {
      soundEngine.stopArenaMusic();
    };
  }, [matchActive, musicOn, paused, save.muted]);

  const spawnBurst = useCallback(
    (x: number, y: number, color: string, count: number, kind: Particle['kind'] = 'star') => {
      const sim = simRef.current;
      if (!sim) return;
      let spawned = 0;
      for (const p of sim.particles) {
        if (p.active) continue;
        const a = Math.random() * Math.PI * 2;
        const spd = 90 + Math.random() * 260;
        p.active = true;
        p.x = x;
        p.y = y;
        p.vx = Math.cos(a) * spd;
        p.vy = Math.sin(a) * spd - 60;
        p.size = kind === 'ring' ? 16 : 6 + Math.random() * 8;
        p.color = color;
        p.secondaryColor = undefined;
        p.text = undefined;
        p.gravityScale = kind === 'ring' ? 0 : 1;
        p.life = 0;
        p.maxLife = 0.35 + Math.random() * 0.35;
        p.kind = kind;
        p.rotation = Math.random() * Math.PI;
        p.rotSpeed = (Math.random() - 0.5) * 10;
        spawned++;
        if (spawned >= count) break;
      }
    },
    []
  );

  const addCallout = useCallback(
    (text: string, x: number, y: number, color: string, subtext?: string, scale = 1) => {
      const sim = simRef.current;
      if (!sim) return;
      if (sim.callouts.length >= 1) {
        sim.callouts.shift();
      }
      sim.callouts.push({
        text,
        subtext,
        x,
        y,
        color,
        life: 0,
        maxLife: 0.82,
        scale,
      });
    },
    []
  );

  const addComicSfx = useCallback(
    (
      word: string,
      x: number,
      y: number,
      burstColor: string,
      textColor: string,
      scale = 1,
      spikes = 10,
      secondaryTextColor?: string
    ) => {
      const sim = simRef.current;
      if (!sim) return;
      if (sim.sfxBursts.length >= 1) {
        sim.sfxBursts.shift();
      }
      sim.sfxBursts.push({
        word,
        x,
        y,
        angle: (Math.random() - 0.5) * 0.2,
        burstColor,
        textColor,
        secondaryTextColor,
        spikes,
        life: 0,
        maxLife: 0.62,
        scale,
      });
    },
    []
  );

  const spawnCarrolloImpactParticles = useCallback(
    (x: number, y: number, strikeType: CarrolloType, _defenderSlot: 1 | 2) => {
      const isCrit = strikeType === 'CRITICO';
      const isPerf = strikeType === 'PERFEITO';
      const ringColor = isCrit ? '#FBBF24' : isPerf ? '#EF4444' : '#FFF8EB';
      spawnBurst(x, y, ringColor, isCrit ? 6 : isPerf ? 4 : 2, 'star');
      if (isCrit || isPerf) {
        spawnBurst(x, y, ringColor, 1, 'ring');
      }
    },
    [spawnBurst]
  );

  const pushCombatLog = useCallback((message: string, tone: BattleLogTone = 'info') => {
    const sim = simRef.current;
    if (!sim) return;
    sim.logSeq += 1;
    const entry: BattleLogEntry = {
      id: sim.logSeq,
      timeLabel: formatMatchTime(sim.time),
      message,
      tone,
    };
    sim.actionLog = [entry, ...sim.actionLog].slice(0, 14);
  }, []);

  const applyRoundEvent = useCallback(
    (slot: 1 | 2, ev: Exclude<ArenaRoundEvent, 'NONE'>) => {
      const sim = simRef.current;
      if (!sim) return;
      const actor = slot === 1 ? sim.p1 : sim.p2;
      const canvas = canvasRef.current;
      const w = canvas ? canvas.width : 1000;
      const h = canvas ? canvas.height : 600;
      const actorX = slot === 1 ? w * 0.24 : w * 0.76;

      sim.roundEvent = ev;
      if (ev === 'GOLDEN_ROUND') {
        actor.damageBoost = Math.max(actor.damageBoost, 1.4);
        sim.bottle.isGolden = true;
        addCallout('GARRAFA DOURADA!', w * 0.5, h * 0.32, '#FBBF24', '+40% Dano no turno!', 1.05);
        pushCombatLog(`Sorte (${actor.name}): Garrafa Dourada (+40% Dano)!`, 'critical');
      } else if (ev === 'TAILWIND') {
        actor.bottleMagnet = true;
        addCallout('BRISA FAVORÁVEL!', actorX, h * 0.34, '#34D399', 'Garrafa estabilizada!', 0.98);
        pushCombatLog(`Sorte (${actor.name}): Brisa Favorável estabiliza o giro!`, 'skill');
      } else if (ev === 'ENERGY_SURGE') {
        actor.energy = Math.min(100, actor.energy + 25);
        spawnBurst(actorX, h * 0.62, '#38BDF8', 6, 'star');
        addCallout('SURTO DE ROLHA!', actorX, h * 0.34, '#38BDF8', '+25 Energia!', 0.98);
        pushCombatLog(`Sorte (${actor.name}): Surto de Rolha (+25 ENE)!`, 'counter');
      }
    },
    [addCallout, pushCombatLog, spawnBurst]
  );

  const isLocalHumanTurn = useCallback(
    (turn: 1 | 2): boolean => {
      if (isReplayMode) return false;
      if (config.mode === 'PVP_LOCAL') return true;
      if (config.mode === 'PVP_ONLINE') return turn === mySlot;
      return turn === 1;
    },
    [config.mode, isReplayMode, mySlot]
  );

  // Launch the bottle from the active fighter's hand!
  const launchBottle = useCallback(
    (
      charge: number,
      forcedUpright?: boolean,
      fromNetwork = false,
      forcedFlipSign?: 1 | -1
    ) => {
      const sim = simRef.current;
      if (!sim || sim.phase !== 'SPIN_READY') return;

      const attacker = sim.activeTurn === 1 ? sim.p1 : sim.p2;
      const defender = sim.activeTurn === 1 ? sim.p2 : sim.p1;

      // Guided tutorial spin: ensure player reaches green zone, then guarantee upright landing
      if (sim.tutorialStep === 'SPIN_GUIDE' && attacker.slot === 1) {
        if (charge < 0.35) {
          sim.isChargingSpin = false;
          sim.spinCharge = 0;
          const canvas = canvasRef.current;
          addCallout(
            'SEGURE MAIS!',
            (canvas ? canvas.width : 1000) * 0.24,
            (canvas ? canvas.height : 600) * 0.42,
            '#FBBF24',
            'Solte na faixa verde!'
          );
          return;
        }
        forcedUpright = true;
        sim.tutorialStep = 'PERFECT_TIMING_GUIDE';
      }

      // Calculate upright probability: spin sweet spot + attributes + skills + scenario conditions
      const condMit = computeConditionMitigation(
        sim.arenaCondition,
        attacker.attrs,
        attacker.bottleMagnet
      );
      const sweetDist = Math.abs(charge - condMit.sweetSpotTarget);
      let uprightChance = Math.max(0.28, 0.84 - sweetDist * 0.9);
      uprightChance += attacker.attrs.sorte * 0.025 + attacker.attrs.precisao * 0.015;
      uprightChance -= condMit.effectivePenalty;
      if (attacker.bottleMagnet) uprightChance += 0.32;
      if (defender.bottleSabotage) uprightChance -= 0.24;
      uprightChance = Math.max(0.16, Math.min(0.96, uprightChance));

      const willLandUpright =
        forcedUpright !== undefined ? forcedUpright : Math.random() < uprightChance;
      const flipSign: 1 | -1 = forcedFlipSign ?? (Math.random() > 0.5 ? 1 : -1);

      if (!isReplayMode) {
        recordedEventsRef.current.push({
          t: sim.time,
          slot: attacker.slot,
          kind: 'spin_release',
          charge,
          willLandUpright,
          flipSign,
        });
      }

      if (config.mode === 'PVP_ONLINE' && !fromNetwork && pvpSocket?.readyState === WebSocket.OPEN) {
        pvpSocket.send(
          JSON.stringify({
            type: 'pvp_event',
            event: 'spin_bottle',
            payload: { charge, willLandUpright },
          })
        );
      }

      attacker.pose = 'FLICK_THROW';
      attacker.poseTimer = 0.35;
      attacker.poseDuration = 0.35;
      sim.isChargingSpin = false;
      sim.spinCharge = 0;

      const canvas = canvasRef.current;
      const w = canvas ? canvas.width : 1000;
      const h = canvas ? canvas.height : 600;
      const centerX = w * 0.5;
      const tableTopY = h * 0.72;

      const hand = getFighterHandPos({
        visual: CHARACTERS[attacker.charId].visual,
        facing: attacker.slot === 1 ? 1 : -1,
        x: attacker.slot === 1 ? w * 0.22 : w * 0.78,
        y: h * 0.84,
        pose: 'WINDUP_SPIN',
        poseProgress: 1,
        chargeRatio: charge,
        hitFlash: 0,
        shieldActive: attacker.shieldTurns > 0,
        burnActive: attacker.burnTurns > 0,
        vulnerable: attacker.vulnerable,
        time: sim.time,
      });

      const flightTime = 0.85 + charge * 0.22;
      sim.bottle.heldBy = 0;
      sim.bottle.x = hand.x;
      sim.bottle.y = hand.y;
      sim.bottle.vx = (centerX - hand.x) / flightTime;
      sim.bottle.vy = (tableTopY - hand.y - 0.5 * 1450 * flightTime * flightTime) / flightTime;
      sim.bottle.angle = 0;
      // If landing upright, angular velocity aims near 2 full flips; if falling, lands tilted
      const flips = willLandUpright ? 2 : 1.75 + flipSign * 0.5;
      sim.bottle.angularVel =
        ((flips * Math.PI * 2) / flightTime) * (attacker.slot === 1 ? 1 : -1);
      sim.bottle.bounces = 0;
      sim.bottle.willLandUpright = willLandUpright;
      sim.bottle.uprightGlow = 0;

      sim.phase = 'BOTTLE_FLIGHT';
      sim.phaseTimer = 0;
      soundEngine.playSpinLaunch();
      pushCombatLog(`${attacker.name} girou a garrafa!`, 'info');
    },
    [addCallout, config.mode, isReplayMode, pushCombatLog, pvpSocket]
  );

  // Execute Carrollo Strike during CARROLLO_WINDOW
  const executeCarrollo = useCallback(
    (isCharged: boolean, forcedType?: CarrolloType, fromNetwork = false) => {
      const sim = simRef.current;
      if (!sim || sim.phase !== 'CARROLLO_WINDOW') return;

      const attacker = sim.activeTurn === 1 ? sim.p1 : sim.p2;
      const defender = sim.activeTurn === 1 ? sim.p2 : sim.p1;

      let strikeType: CarrolloType = 'NORMAL';
      if (forcedType) {
        strikeType = forcedType;
        if (strikeType === 'CRITICO' && attacker.energy >= 100) {
          attacker.energy = 0;
        }
      } else {
        const inCore =
          sim.ringProgress >= sim.ringTargetStart && sim.ringProgress <= sim.ringTargetEnd;
        const inNear =
          sim.ringProgress >= sim.ringTargetStart - 0.14 &&
          sim.ringProgress <= sim.ringTargetEnd + 0.14;

        if (!inNear && sim.ringProgress > 0.96) {
          strikeType = 'FALHA';
        } else if (inCore && attacker.energy >= 100) {
          strikeType = 'CRITICO';
          attacker.energy = 0;
        } else if (inCore) {
          strikeType = isCharged ? 'CARREGADO' : 'PERFEITO';
        } else if (isCharged && inNear) {
          strikeType = 'CARREGADO';
        } else if (!inNear) {
          strikeType = 'FALHA';
        } else {
          strikeType = 'NORMAL';
        }
      }

      if (config.mode === 'PVP_ONLINE' && !fromNetwork && pvpSocket?.readyState === WebSocket.OPEN) {
        pvpSocket.send(
          JSON.stringify({
            type: 'pvp_event',
            event: 'carrollo_strike',
            payload: { strikeType },
          })
        );
      }

      // Interactive Tutorial Step 2: guide until player lands a Perfect Carrollo
      if (sim.tutorialStep === 'PERFECT_TIMING_GUIDE' && attacker.slot === 1) {
        if (strikeType !== 'PERFEITO' && strikeType !== 'CRITICO') {
          sim.ringProgress = 0;
          sim.isChargingCarrollo = false;
          sim.carrolloCharge = 0;
          const canvas = canvasRef.current;
          addCallout(
            'QUASE!',
            (canvas ? canvas.width : 1000) * 0.5,
            (canvas ? canvas.height : 600) * 0.34,
            '#FBBF24',
            'Espere o anel dourado entrar na faixa verde!'
          );
          return;
        }
        sim.tutorialStep = 'DONE';
        onTutorialCompleted?.();
        const canvas = canvasRef.current;
        addCallout(
          'TUTORIAL COMPLETO!',
          (canvas ? canvas.width : 1000) * 0.5,
          (canvas ? canvas.height : 600) * 0.28,
          '#10B981',
          'Você dominou o Carrollo Perfeito!'
        );
      }

      if (!isReplayMode) {
        recordedEventsRef.current.push({
          t: sim.time,
          slot: attacker.slot,
          kind: 'carrollo_strike',
          isCharged,
          strikeType,
        });
      }

      if (attacker.slot === 1) {
        const ringCenter = (sim.ringTargetStart + sim.ringTargetEnd) * 0.5;
        const halfW = Math.max(0.01, (sim.ringTargetEnd - sim.ringTargetStart) * 0.5);
        const dist = Math.abs(sim.ringProgress - ringCenter);
        let accSample = 0;
        if (strikeType !== 'FALHA') {
          accSample =
            dist <= halfW
              ? Math.round(92 + 8 * (1 - dist / halfW))
              : Math.round(Math.max(35, 82 - dist * 140));
        }
        sim.telemetry.ringAccuracySamples.push(accSample);
        if (sim.telemetry.carrolloWindowOpenedAt > 0) {
          const reactMs = Math.max(
            120,
            Math.min(1800, Math.round((sim.time - sim.telemetry.carrolloWindowOpenedAt) * 1000))
          );
          sim.telemetry.reactionSamplesMs.push(reactMs);
        }
        if (strikeType === 'PERFEITO') {
          sim.telemetry.perfectCount += 1;
          sim.telemetry.perfectStreak += 1;
          sim.telemetry.bestPerfectStreak = Math.max(
            sim.telemetry.bestPerfectStreak,
            sim.telemetry.perfectStreak
          );
        } else if (strikeType !== 'CRITICO') {
          sim.telemetry.perfectStreak = 0;
        }
      }

      if (strikeType === 'FALHA') {
        const canvas = canvasRef.current;
        const w = canvas ? canvas.width : 1000;
        const h = canvas ? canvas.height : 600;
        const failX = attacker.slot === 1 ? w * 0.24 : w * 0.76;
        if (attacker.slot === 1) {
          sim.comboCount = 0;
          sim.comboPop = 0;
        }
        attacker.vulnerable = true;
        attacker.pose = 'STUNNED';
        attacker.poseTimer = 0.85;
        attacker.poseDuration = 0.85;
        soundEngine.playBottleFail();
        addComicSfx('OOPS!', failX, h * 0.34, '#EF4444', '#FEF08A', 0.92, 10);
        addCallout(
          'FALHA CRÍTICA!',
          failX,
          h * 0.45,
          '#EF4444',
          'Ficou vulnerável!'
        );
        pushCombatLog(`${attacker.name}: Falha crítica! Ficou vulnerável!`, 'fail');
        sim.phase = 'STRIKE_RESOLVE';
        sim.phaseTimer = 0.85;
        sim.pendingStrike = {
          type: 'FALHA',
          damage: 0,
          defenderBlocked: false,
          defenderCountered: false,
        };
        return;
      }

      // Compute raw damage
      let baseDmg = 18 + attacker.attrs.precisao * 1.4 + attacker.attrs.energia * 0.8;
      if (strikeType === 'PERFEITO') baseDmg *= 1.48;
      if (strikeType === 'CARREGADO') baseDmg *= 1.38;
      if (strikeType === 'CRITICO') baseDmg *= 1.88;

      // Apply offensive skill boost
      baseDmg *= attacker.damageBoost;

      // Bonus if defender was vulnerable from a previous fail
      if (defender.vulnerable) {
        baseDmg *= 1.25;
      }

      // Resistance mitigation
      const resFactor = Math.max(0.55, 1 - defender.attrs.resistencia * 0.032);
      let finalDmg = Math.round(baseDmg * resFactor);

      // Shield reduction unless guardBreak
      if (defender.shieldTurns > 0 && !attacker.guardBreak) {
        finalDmg = Math.round(finalDmg * 0.5);
      }

      sim.pendingStrike = {
        type: strikeType,
        damage: Math.max(6, finalDmg),
        defenderBlocked: false,
        defenderCountered: false,
      };
      const defSlot: 1 | 2 = sim.activeTurn === 1 ? 2 : 1;
      // 0.2 em 100% (0.002) de chance de surgir o comando Contra-Carrollo no instante do golpe inimigo
      const rareCounterTriggered =
        !isReplayMode &&
        !attacker.guardBreak &&
        isLocalHumanTurn(defSlot) &&
        Math.random() < 0.002;

      sim.counterWindowAvailable = rareCounterTriggered;
      sim.phase = 'DEFENSE_WINDOW';
      sim.phaseTimer = rareCounterTriggered
        ? Math.max(0.46, 0.68 - attacker.attrs.velocidade * 0.015)
        : 0.22;
      sim.defenseMaxTimer = sim.phaseTimer;
      sim.aiTriggered = false;

      if (rareCounterTriggered) {
        const canvas = canvasRef.current;
        const w = canvas ? canvas.width : 1000;
        const h = canvas ? canvas.height : 600;
        const defX = defSlot === 1 ? w * 0.24 : w * 0.76;
        addCallout('CONTRA DISPONÍVEL!', defX, h * 0.34, '#38BDF8', 'Toque rápido!', 1.05);
      }
    },
    [
      addCallout,
      addComicSfx,
      config.mode,
      isLocalHumanTurn,
      isReplayMode,
      onTutorialCompleted,
      pushCombatLog,
      pvpSocket,
    ]
  );

  // Defender Counter mitigation attempt during DEFENSE_WINDOW (only when rare 0.2% command appeared)
  const attemptCounter = useCallback(
    (defenderSlot?: 1 | 2, fromNetwork = false, forcedIsCounter?: boolean) => {
      const sim = simRef.current;
      if (!sim || sim.phase !== 'DEFENSE_WINDOW' || !sim.pendingStrike) return;
      const expectedDefSlot: 1 | 2 = sim.activeTurn === 1 ? 2 : 1;
      if (defenderSlot && defenderSlot !== expectedDefSlot) return;

      const defender = expectedDefSlot === 1 ? sim.p1 : sim.p2;
      const attacker = sim.activeTurn === 1 ? sim.p1 : sim.p2;

      if (attacker.guardBreak || sim.pendingStrike.defenderCountered) return;
      if (!fromNetwork && !isReplayMode && !sim.counterWindowAvailable) return;

      const isCounter = forcedIsCounter !== undefined ? forcedIsCounter : true;
      sim.counterWindowAvailable = false;
      sim.pendingStrike.defenderBlocked = true;
      sim.pendingStrike.defenderCountered = isCounter;
      defender.pose = 'BLOCK';
      defender.poseTimer = 0.68;
      defender.poseDuration = 0.68;
      soundEngine.playBlock();

      if (!isReplayMode) {
        recordedEventsRef.current.push({
          t: sim.time,
          slot: expectedDefSlot,
          kind: 'counter_attempt',
          isCounter,
        });
      }

      if (
        config.mode === 'PVP_ONLINE' &&
        !fromNetwork &&
        pvpSocket?.readyState === WebSocket.OPEN
      ) {
        pvpSocket.send(
          JSON.stringify({
            type: 'pvp_event',
            event: 'counter_attempt',
            payload: { isCounter },
          })
        );
      }
    },
    [config.mode, isReplayMode, pvpSocket]
  );

  // Activate one of the 3 Category Skills or Signature Special
  const activateSkill = useCallback(
    (slot: 1 | 2, category: SkillCategory | 'SPECIAL', fromNetwork = false) => {
      const sim = simRef.current;
      if (!sim || sim.phase === 'MATCH_OVER') return;
      const actor = slot === 1 ? sim.p1 : sim.p2;
      const rival = slot === 1 ? sim.p2 : sim.p1;

      const canvas = canvasRef.current;
      const w = canvas ? canvas.width : 1000;
      const h = canvas ? canvas.height : 600;
      const actorX = slot === 1 ? w * 0.24 : w * 0.76;

      if (category === 'SPECIAL') {
        if (actor.energy < 100) return;
        actor.energy = 0;
        const char = CHARACTERS[actor.charId] || CHARACTERS.leo;
        actor.damageBoost = Math.max(actor.damageBoost, 1.5);
        actor.bottleMagnet = true;
        if (
          actor.charId === 'brasa' ||
          actor.charId === 'karrolo' ||
          actor.charId === 'boss_lady' ||
          actor.charId === 'clown'
        ) {
          rival.burnTurns = 2;
          rival.precisionDebuffTurns = 2;
        }
        if (
          actor.charId === 'ferro' ||
          actor.charId === 'mola' ||
          actor.charId === 'big_boss' ||
          actor.charId === 'knight' ||
          actor.charId === 'rich_boss'
        ) {
          actor.shieldTurns = 1;
          actor.counterReady = true;
        }
        soundEngine.playSkill();
        spawnBurst(actorX, h * 0.58, '#FBBF24', 8, 'star');
        addComicSfx('BOOM!', actorX, h * 0.28, '#FBBF24', '#EF4444', 0.92, 11);
        addCallout(char.specialName.toUpperCase() + '!', actorX, h * 0.36, '#FBBF24');
        pushCombatLog(`${actor.name}: Especial ${char.specialName}!`, 'critical');
        triggerMotionShake('subtle');
      } else {
        const skillId = actor.equippedSkills[category];
        const skill = SKILLS[skillId];
        if (!skill || actor.energy < skill.energyCost) return;

        actor.energy -= skill.energyCost;
        const sLevel =
          slot === 1 && !isReplayMode
            ? save.progression[actor.charId]?.skillProgress[skillId]?.level || 1
            : 1;
        const levelMult = 1 + (sLevel - 1) * 0.12;

        if (slot === 1 && !isReplayMode) {
          usedSkillsRef.current[skillId] = (usedSkillsRef.current[skillId] || 0) + 1;
        }

        if (skillId === 'impacto_sonico') {
          actor.damageBoost = 1.35 * levelMult;
        } else if (skillId === 'quebra_guarda') {
          actor.guardBreak = true;
          rival.precisionDebuffTurns = 2;
        } else if (skillId === 'furia_termica') {
          rival.burnTurns = 2;
        } else if (skillId === 'escudo_rolha') {
          actor.shieldTurns = 2;
        } else if (skillId === 'reflexo_rapido') {
          actor.counterReady = true;
          actor.shieldTurns = 1;
        } else if (skillId === 'postura_aco') {
          const heal = Math.round(18 * levelMult);
          actor.hp = Math.min(actor.maxHp, actor.hp + heal);
          actor.vulnerable = false;
        } else if (skillId === 'chumbo_base') {
          actor.bottleMagnet = true;
        } else if (skillId === 'vento_cruzado') {
          rival.bottleSabotage = true;
        } else if (skillId === 'giro_invertido') {
          actor.secondChance = true;
        }

        soundEngine.playSkill();
        spawnBurst(actorX, h * 0.62, skill.color, 6, 'star');
        addCallout(skill.name.toUpperCase(), actorX, h * 0.38, skill.color);
        pushCombatLog(`${actor.name} ativou ${skill.name}!`, 'skill');
      }

      if (!isReplayMode) {
        recordedEventsRef.current.push({
          t: sim.time,
          slot,
          kind: 'skill_activate',
          category,
        });
      }

      if (config.mode === 'PVP_ONLINE' && !fromNetwork && pvpSocket?.readyState === WebSocket.OPEN) {
        pvpSocket.send(
          JSON.stringify({
            type: 'pvp_event',
            event: 'skill_activate',
            payload: { category },
          })
        );
      }
    },
    [
      addCallout,
      addComicSfx,
      config.mode,
      isReplayMode,
      pushCombatLog,
      pvpSocket,
      save.progression,
      spawnBurst,
    ]
  );

  // Listen to WebSocket PvP events in Online mode
  useEffect(() => {
    if (config.mode !== 'PVP_ONLINE' || !pvpSocket) return;

    const onMessage = (evt: MessageEvent) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'pvp_event') {
          const { event, payload, fromSlot } = msg;
          if (event === 'spin_bottle') {
            launchBottle(payload.charge, payload.willLandUpright, true);
          } else if (event === 'carrollo_strike') {
            executeCarrollo(false, payload.strikeType, true);
          } else if (event === 'counter_attempt') {
            attemptCounter(fromSlot, true);
          } else if (event === 'skill_activate') {
            activateSkill(fromSlot, payload.category, true);
          }
        }
      } catch {
        // ignore
      }
    };

    pvpSocket.addEventListener('message', onMessage);
    return () => pvpSocket.removeEventListener('message', onMessage);
  }, [activateSkill, attemptCounter, config.mode, executeCarrollo, launchBottle, pvpSocket]);

  // Unified Primary Action Handlers (Pointer / Touch / Keyboard)
  const handlePrimaryDown = useCallback(() => {
    const sim = simRef.current;
    if (!sim || pausedRef.current || isReplayMode) return;

    if (sim.phase === 'ARENA_ENTRANCE' && !introDialogueOpenRef.current) {
      sim.p1.pose = 'IDLE';
      sim.p2.pose = 'IDLE';
      sim.phase = 'TURN_INTRO';
      sim.phaseTimer = 0.35;
      return;
    }

    if (sim.phase === 'SPIN_READY' && isLocalHumanTurn(sim.activeTurn)) {
      sim.isChargingSpin = true;
      recordedEventsRef.current.push({
        t: sim.time,
        slot: sim.activeTurn,
        kind: 'spin_charge_start',
      });
      soundEngine.playGrab();
    } else if (sim.phase === 'CARROLLO_WINDOW' && isLocalHumanTurn(sim.activeTurn)) {
      sim.isChargingCarrollo = true;
      sim.carrolloCharge = 0;
      recordedEventsRef.current.push({
        t: sim.time,
        slot: sim.activeTurn,
        kind: 'carrollo_charge_start',
      });
    } else if (sim.phase === 'DEFENSE_WINDOW') {
      const defSlot: 1 | 2 = sim.activeTurn === 1 ? 2 : 1;
      if (isLocalHumanTurn(defSlot)) {
        attemptCounter(defSlot);
      }
    }
  }, [attemptCounter, isLocalHumanTurn, isReplayMode]);

  const handlePrimaryUp = useCallback(() => {
    const sim = simRef.current;
    if (!sim || pausedRef.current) return;

    if (sim.phase === 'SPIN_READY' && sim.isChargingSpin && isLocalHumanTurn(sim.activeTurn)) {
      launchBottle(Math.max(0.2, sim.spinCharge));
    } else if (
      sim.phase === 'CARROLLO_WINDOW' &&
      sim.isChargingCarrollo &&
      isLocalHumanTurn(sim.activeTurn)
    ) {
      sim.isChargingCarrollo = false;
      executeCarrollo(sim.carrolloCharge > 0.25);
    }
  }, [executeCarrollo, isLocalHumanTurn, launchBottle]);

  // Arena Gesture Handlers (when controlMode is 'gestures' or 'both')
  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!allowGestures) return;
      gestureRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        swipedUp: false,
      };
      handlePrimaryDown();
    },
    [allowGestures, handlePrimaryDown]
  );

  const handleCanvasPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!allowGestures || !gestureRef.current.active || gestureRef.current.swipedUp) return;
      const sim = simRef.current;
      if (!sim) return;
      const dy = gestureRef.current.startY - e.clientY;
      // Upward flick/swipe (>= 46px) launches bottle cleanly
      if (sim.phase === 'SPIN_READY' && sim.isChargingSpin && dy >= 46) {
        gestureRef.current.swipedUp = true;
        gestureRef.current.active = false;
        handlePrimaryUp();
      }
    },
    [allowGestures, handlePrimaryUp]
  );

  const handleCanvasPointerUp = useCallback(() => {
    if (!allowGestures || !gestureRef.current.active) return;
    const wasSwiped = gestureRef.current.swipedUp;
    gestureRef.current.active = false;
    gestureRef.current.swipedUp = false;
    if (!wasSwiped) {
      handlePrimaryUp();
    }
  }, [allowGestures, handlePrimaryUp]);

  // Keyboard bindings
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (introDialogueOpenRef.current) {
        if (e.code === 'Space' || e.code === 'Enter' || e.key === 'Escape') {
          e.preventDefault();
          setIntroDialogueOpen(false);
        }
        return;
      }
      if (e.key === 'Escape') {
        setPaused((p) => !p);
        return;
      }
      if (e.repeat) return;
      const sim = simRef.current;
      if (!sim || pausedRef.current) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (sim.activeTurn === 1 || config.mode !== 'PVP_LOCAL') {
          handlePrimaryDown();
        }
      }
      if (e.code === 'Enter' && config.mode === 'PVP_LOCAL') {
        e.preventDefault();
        if (sim.activeTurn === 2 || sim.phase === 'DEFENSE_WINDOW') {
          handlePrimaryDown();
        }
      }
      if (e.key.toLowerCase() === 'a') {
        if (sim.phase === 'DEFENSE_WINDOW' && sim.activeTurn === 2) {
          attemptCounter(1);
        }
      }
      if (e.key.toLowerCase() === 'k' && config.mode === 'PVP_LOCAL') {
        if (sim.phase === 'DEFENSE_WINDOW' && sim.activeTurn === 1) {
          attemptCounter(2);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const sim = simRef.current;
      if (!sim) return;
      if (e.code === 'Space') {
        if (sim.activeTurn === 1 || config.mode !== 'PVP_LOCAL') {
          handlePrimaryUp();
        }
      }
      if (e.code === 'Enter' && config.mode === 'PVP_LOCAL') {
        if (sim.activeTurn === 2) {
          handlePrimaryUp();
        }
      }
    };

    const onBlur = () => {
      if (simRef.current) {
        simRef.current.isChargingSpin = false;
        simRef.current.isChargingCarrollo = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [attemptCounter, config.mode, handlePrimaryDown, handlePrimaryUp]);

  // Main 60fps Canvas Simulation & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let rafId = 0;
    let lastTime = performance.now();
    let hudSyncAcc = 0;

    const resolveStrike = () => {
      const sim = simRef.current!;
      const attacker = sim.activeTurn === 1 ? sim.p1 : sim.p2;
      const defender = sim.activeTurn === 1 ? sim.p2 : sim.p1;
      const pending = sim.pendingStrike;
      const w = canvas.width;
      const h = canvas.height;
      const defX = defender.slot === 1 ? w * 0.24 : w * 0.76;

      if (!pending || pending.type === 'FALHA') return;

      if (defender.slot === 1) {
        sim.telemetry.enemyStrikesFaced += 1;
      }

      if (pending.defenderCountered) {
        // Contra-Carrollo: amortece parcialmente o dano recebido sem contra-atacar!
        const mitigatedDmg = Math.max(4, Math.round(pending.damage * 0.7));
        defender.hp = Math.max(0, defender.hp - mitigatedDmg);
        if (defender.slot === 1) {
          sim.telemetry.counterCount += 1;
          if (mitigatedDmg > 0) {
            sim.telemetry.tookDamage = true;
          }
        }
        defender.pose = 'BLOCK';
        defender.poseTimer = 0.68;
        defender.poseDuration = 0.68;
        defender.hitFlash = 0.35;
        defender.vulnerable = false;
        defender.energy = Math.min(100, defender.energy + 14);
        attacker.pose = 'STRIKE';
        attacker.poseTimer = 0.68;
        attacker.poseDuration = 0.68;
        attacker.energy = Math.min(100, attacker.energy + 18 + attacker.attrs.energia);
        sim.hitstop = 0.04;
        sim.shake = 0;
        triggerMotionShake('subtle');
        soundEngine.playBlock();
        spawnBurst(defX, h * 0.45, '#38BDF8', 4, 'star');
        addCallout(
          'CONTRA-CARROLLO!',
          defX,
          h * 0.36,
          '#38BDF8',
          `Dano amortecido (-${mitigatedDmg} HP)`,
          1.02
        );
        pushCombatLog(
          `${defender.name}: Contra-Carrollo amorteceu o impacto (-${mitigatedDmg} HP)!`,
          'counter'
        );
      } else {
        let dmg = pending.damage;
        if (defender.counterReady) {
          dmg = Math.max(4, Math.round(dmg * 0.8));
        }
        if (pending.defenderBlocked) {
          dmg = Math.max(4, Math.round(dmg * 0.65));
        }
        defender.hp = Math.max(0, defender.hp - dmg);
        if (defender.slot === 1 && dmg > 0) {
          sim.telemetry.tookDamage = true;
        }
        defender.pose = pending.defenderBlocked ? 'BLOCK' : 'HIT';
        defender.poseTimer = 0.68;
        defender.poseDuration = 0.68;
        defender.hitFlash = pending.defenderBlocked ? 0.4 : 1;
        defender.vulnerable = false;

        attacker.pose = 'STRIKE';
        attacker.poseTimer = 0.68;
        attacker.poseDuration = 0.68;
        attacker.energy = Math.min(100, attacker.energy + 22 + attacker.attrs.energia * 2);
        defender.energy = Math.min(100, defender.energy + 14);

        if (attacker.slot === 1) {
          sim.telemetry.damageDealt += dmg;
          sim.comboCount += 1;
          sim.maxCombo = Math.max(sim.maxCombo, sim.comboCount);
          sim.comboPop = 1;
          const comboMult = Math.min(5, 1 + (sim.comboCount - 1) * 0.5);
          const basePoints =
            dmg * 12 +
            (pending.type === 'PERFEITO' ? 150 : pending.type === 'CRITICO' ? 300 : 0);
          sim.score += Math.round(basePoints * comboMult);
          if (sim.comboCount >= 2) {
            soundEngine.playComboChime(sim.comboCount);
            pushCombatLog(
              `Combo ${sim.comboCount}x! Bônus ${comboMult.toFixed(1)}x nos pontos!`,
              'critical'
            );
          }
        }

        sim.hitstop = pending.type === 'CRITICO' ? 0.055 : pending.type === 'PERFEITO' ? 0.04 : 0.02;
        sim.shake = 0;
        if (pending.type === 'CRITICO') {
          triggerMotionShake('heavy');
        } else if (pending.type === 'PERFEITO' || pending.type === 'CARREGADO') {
          triggerMotionShake('subtle');
        }

        soundEngine.playCarrolloHit(
          pending.type === 'CRITICO'
            ? 'critical'
            : pending.type === 'PERFEITO'
            ? 'perfect'
            : pending.type === 'CARREGADO'
            ? 'charged'
            : 'normal'
        );

        const burstColor =
          pending.type === 'CRITICO'
            ? '#FBBF24'
            : pending.type === 'PERFEITO'
            ? '#EF4444'
            : '#FFF8EB';

        spawnCarrolloImpactParticles(defX, h * 0.45, pending.type, defender.slot);

        // Comic starburst strictly reserved for Critical and Perfect cascudo strikes (zero clutter on normal hits)
        if (pending.type === 'CRITICO') {
          const critWord = Math.random() > 0.5 ? 'CASCUDO!' : 'COQUE!';
          addComicSfx(critWord, defX, h * 0.25, '#FBBF24', '#FEF08A', 1.12, 11, '#EF4444');
        } else if (pending.type === 'PERFEITO') {
          const perfWord = Math.random() > 0.5 ? 'TOCK!' : 'BONK!';
          addComicSfx(perfWord, defX, h * 0.27, '#EF4444', '#FDE047', 1.0, 10, '#DC2626');
        }

        const label =
          pending.type === 'CRITICO'
            ? 'CARROLLO CRÍTICO!'
            : pending.type === 'PERFEITO'
            ? 'CARROLLO PERFEITO!'
            : pending.type === 'CARREGADO'
            ? 'CARROLLO CARREGADO!'
            : 'CARROLLO!';

        addCallout(
          label,
          defX,
          h * 0.42,
          burstColor,
          pending.defenderBlocked ? `Bloqueado -${dmg} HP` : `-${dmg} HP`,
          pending.type === 'CRITICO' ? 1.18 : 1.02
        );

        const logTone: BattleLogTone =
          pending.type === 'CRITICO'
            ? 'critical'
            : pending.type === 'PERFEITO'
            ? 'perfect'
            : 'info';
        const logPrefix =
          pending.type === 'CRITICO'
            ? 'Carrollo Crítico!'
            : pending.type === 'PERFEITO'
            ? 'Carrollo Perfeito!'
            : pending.type === 'CARREGADO'
            ? 'Carrollo Carregado!'
            : 'Carrollo!';
        pushCombatLog(
          `${attacker.name}: ${logPrefix}${
            pending.defenderBlocked ? ` (Bloqueado -${dmg} HP)` : ` (-${dmg} HP)`
          }`,
          logTone
        );

        if (pending.type === 'PERFEITO') {
          soundEngine.playCharacterQuip(attacker.charId, 'perfect');
        }
      }

      // Clear single-use attack modifiers
      attacker.damageBoost = 1;
      attacker.guardBreak = false;
      attacker.bottleMagnet = false;
      defender.counterReady = false;
      if (defender.shieldTurns > 0) defender.shieldTurns--;
    };

    const advanceTurn = () => {
      const sim = simRef.current!;
      if (sim.p1.hp <= 0 || sim.p2.hp <= 0) {
        sim.phase = 'MATCH_OVER';
        sim.winner = sim.p1.hp > 0 ? 1 : 2;
        if (sim.winner === 1) {
          sim.p1.pose = 'VICTORY';
          sim.p2.pose = 'STUNNED';
          soundEngine.playVictory();
          sim.endQuip = soundEngine.playCharacterQuip(sim.p1.charId, 'victory');
          pushCombatLog(`Vitória de ${sim.p1.name}!`, 'critical');
        } else {
          sim.p2.pose = 'VICTORY';
          sim.p1.pose = 'STUNNED';
          soundEngine.playDefeat();
          sim.endQuip = soundEngine.playCharacterQuip(sim.p1.charId, 'defeat');
          pushCombatLog(`Vitória de ${sim.p2.name}!`, 'fail');
        }
        if (!resultReportedRef.current) {
          resultReportedRef.current = true;
          if (!isReplayMode && initialSnapshotRef.current) {
            const snap = initialSnapshotRef.current;
            const replayObj: MatchReplay = {
              id: `${Date.now()}`,
              recordedAt: Date.now(),
              mode: config.mode,
              arenaBiome: biomeId,
              p1CharId: sim.p1.charId,
              p2CharId: sim.p2.charId,
              p1Name: snap.p1Name,
              p2Name: snap.p2Name,
              p1Attrs: snap.p1Attrs,
              p2Attrs: snap.p2Attrs,
              p1Skills: snap.p1Skills,
              p2Skills: snap.p2Skills,
              p1MaxHp: snap.p1MaxHp,
              p2MaxHp: snap.p2MaxHp,
              winner: sim.winner,
              score: sim.score,
              duration: sim.time,
              events: [...recordedEventsRef.current],
            };
            lastSavedReplayRef.current = replayObj;
            saveLastReplay(replayObj);

            onBattleFinished({
              won: sim.winner === 1,
              usedSkills: usedSkillsRef.current,
              scoreDelta: sim.score,
              perfectCount: sim.telemetry.perfectCount,
              endingPerfectStreak: sim.telemetry.perfectStreak,
              bestPerfectStreakInMatch: sim.telemetry.bestPerfectStreak,
              tookDamage: sim.telemetry.tookDamage,
              counterCount: sim.telemetry.counterCount,
              bottleUprights: sim.telemetry.bottleUprights,
            });
          }
        }
        return;
      }

      sim.activeTurn = sim.activeTurn === 1 ? 2 : 1;
      const nextActive = sim.activeTurn === 1 ? sim.p1 : sim.p2;

      // Burn tick at start of turn
      if (nextActive.burnTurns > 0) {
        nextActive.burnTurns--;
        const burnDmg = 9;
        nextActive.hp = Math.max(1, nextActive.hp - burnDmg);
        if (nextActive.slot === 1) {
          sim.telemetry.tookDamage = true;
        }
        const w = canvas.width;
        addCallout(
          'QUEIMADURA!',
          nextActive.slot === 1 ? w * 0.24 : w * 0.76,
          canvas.height * 0.45,
          '#F97316',
          `-${burnDmg} HP`
        );
        pushCombatLog(`${nextActive.name}: Queimadura (-${burnDmg} HP)`, 'fail');
      }
      if (nextActive.precisionDebuffTurns > 0) nextActive.precisionDebuffTurns--;
      nextActive.bottleSabotage = false;
      sim.roundEvent = 'NONE';
      sim.bottle.isGolden =
        config.player1CharId === 'karrolo' || config.player2CharId === 'karrolo';

      // Sorte-driven dynamic arena round event (not during tutorial or Online PvP)
      if (
        !isReplayMode &&
        config.mode !== 'PVP_ONLINE' &&
        (sim.tutorialStep === 'NONE' || sim.tutorialStep === 'DONE')
      ) {
        sim.arenaCondition = rollArenaCondition(biomeId);
        const luckChance = Math.min(0.48, 0.16 + nextActive.attrs.sorte * 0.025);
        if (Math.random() < luckChance) {
          const pool: Exclude<ArenaRoundEvent, 'NONE'>[] = [
            'GOLDEN_ROUND',
            'TAILWIND',
            'ENERGY_SURGE',
          ];
          const picked = pool[Math.floor(Math.random() * pool.length)];
          applyRoundEvent(nextActive.slot, picked);
          recordedEventsRef.current.push({
            t: sim.time,
            slot: nextActive.slot,
            kind: 'round_event',
            event: picked,
          });
        }
      } else {
        sim.arenaCondition = ARENA_CONDITIONS.ar_estavel;
      }

      sim.phase = 'TURN_INTRO';
      sim.phaseTimer = Math.max(0.35, 0.58 - nextActive.attrs.velocidade * 0.02);
      sim.aiTriggered = false;
      sim.aiActionDelay = 0.45 + Math.random() * 0.3;
    };

    const loop = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const speedMult = isReplayMode ? replaySpeedRef.current : 1;
      const dt = Math.min(rawDt, 0.05) * speedMult;

      const sim = simRef.current!;
      const w = canvas.width;
      const h = canvas.height;
      const centerX = w * 0.5;
      const tableTopY = h * 0.72;
      const p1X = w * 0.23;
      const p2X = w * 0.77;
      const floorY = h * 0.85;

      if (!pausedRef.current) {
        if (sim.hitstop > 0) {
          sim.hitstop -= dt;
        } else {
          if (sim.phase === 'ARENA_ENTRANCE') {
            sim.entranceClock += dt;
          } else {
            sim.time += dt;
          }
          sim.shake = Math.max(0, sim.shake - dt * 55);

          // Replay input-sequence dispatcher
          if (isReplayMode && config.replayData && sim.phase !== 'MATCH_OVER') {
            const events = config.replayData.events;
            while (replayCursorRef.current < events.length) {
              const ev = events[replayCursorRef.current];
              if (sim.time < ev.t) break;

              if (ev.kind === 'skill_activate') {
                activateSkill(ev.slot, ev.category, true);
                replayCursorRef.current++;
              } else if (ev.kind === 'round_event') {
                applyRoundEvent(ev.slot, ev.event);
                replayCursorRef.current++;
              } else if (ev.kind === 'spin_charge_start' && sim.phase === 'SPIN_READY') {
                sim.isChargingSpin = true;
                soundEngine.playGrab();
                replayCursorRef.current++;
              } else if (ev.kind === 'spin_release' && sim.phase === 'SPIN_READY') {
                launchBottle(ev.charge, ev.willLandUpright, true, ev.flipSign);
                replayCursorRef.current++;
              } else if (ev.kind === 'carrollo_charge_start' && sim.phase === 'CARROLLO_WINDOW') {
                sim.isChargingCarrollo = true;
                sim.carrolloCharge = 0;
                replayCursorRef.current++;
              } else if (ev.kind === 'carrollo_strike' && sim.phase === 'CARROLLO_WINDOW') {
                executeCarrollo(ev.isCharged, ev.strikeType, true);
                replayCursorRef.current++;
              } else if (ev.kind === 'counter_attempt' && sim.phase === 'DEFENSE_WINDOW') {
                attemptCounter(ev.slot, true, ev.isCounter);
                replayCursorRef.current++;
              } else {
                // Phase not ready yet (e.g. slight dt drift): wait for transition
                break;
              }
            }
          }

          // Update fighter timers & flash
          [sim.p1, sim.p2].forEach((f) => {
            f.hitFlash = Math.max(0, f.hitFlash - dt * 4);
            if (f.poseTimer > 0) {
              f.poseTimer -= dt;
              if (f.poseTimer <= 0 && sim.phase !== 'MATCH_OVER' && sim.phase !== 'ARENA_ENTRANCE') {
                f.pose = 'IDLE';
              }
            }
          });

          const attacker = sim.activeTurn === 1 ? sim.p1 : sim.p2;
          const defender = sim.activeTurn === 1 ? sim.p2 : sim.p1;

          // Phase Machine (stays on standby while pre-battle opponent taunt is visible)
          if (!introDialogueOpenRef.current) {
            if (sim.phase === 'ARENA_ENTRANCE') {
              sim.p1.pose = 'ENTRANCE';
              sim.p2.pose = 'ENTRANCE';
              sim.bottle.heldBy = 0;
              sim.bottle.x = centerX;
              sim.bottle.y = tableTopY;
              sim.bottle.angle = 0;
              sim.bottle.uprightGlow = 0;
              sim.phaseTimer -= dt;
              const ep = Math.max(0, Math.min(1, 1 - sim.phaseTimer / ENTRANCE_DURATION));

              if (sim.entranceBeat === 0 && ep >= 0.25) {
                sim.entranceBeat = 1;
                if (sim.p1.charId === 'leo') {
                  spawnBurst(p1X - 95, floorY, '#FDE68A', 3, 'dust');
                }
              } else if (sim.entranceBeat === 1 && ep >= 0.48) {
                sim.entranceBeat = 2;
                if (sim.p1.charId === 'leo') {
                  spawnBurst(p1X - 35, floorY, '#FDE68A', 3, 'dust');
                }
                if (sim.p2.charId === 'clown') {
                  spawnBurst(p2X, floorY, '#C084FC', 6, 'dust');
                  soundEngine.playBottleBounce();
                } else if (sim.p2.charId === 'big_boss') {
                  spawnBurst(p2X, floorY, '#FDE68A', 6, 'dust');
                  soundEngine.playTone(105, 52, 0.16, 'triangle', 0.14);
                } else if (sim.p1.charId !== 'leo') {
                  spawnBurst(p1X, floorY, '#FDE68A', 4, 'dust');
                }
              } else if (sim.entranceBeat === 2 && ep >= 0.74) {
                sim.entranceBeat = 3;
                if (sim.p1.charId === 'leo') {
                  spawnBurst(p1X + 10, floorY, '#FDE68A', 4, 'dust');
                }
                if (sim.p2.charId === 'rich_boss') {
                  spawnBurst(p2X - 24, floorY, '#FBBF24', 5, 'star');
                  soundEngine.playTone(880, 1320, 0.11, 'triangle', 0.11);
                } else if (sim.p2.charId === 'knight') {
                  spawnBurst(p2X, floorY - 125, '#FDE047', 5, 'star');
                  soundEngine.playBlock();
                } else if (sim.p2.charId === 'big_boss') {
                  spawnBurst(p2X, floorY - 80, '#FBBF24', 5, 'star');
                  soundEngine.playTone(125, 58, 0.18, 'square', 0.12);
                } else if (sim.p2.charId === 'boss_lady') {
                  spawnBurst(p2X, floorY - 70, '#EF4444', 5, 'star');
                }
              }

              if (sim.phaseTimer <= 0) {
                sim.p1.pose = 'IDLE';
                sim.p2.pose = 'IDLE';
                sim.phase = 'TURN_INTRO';
                sim.phaseTimer = 0.45;
              }
            } else if (sim.phase === 'TURN_INTRO') {
            sim.phaseTimer -= dt;
            sim.bottle.heldBy = 0;
            sim.bottle.x = centerX;
            sim.bottle.y = tableTopY;
            sim.bottle.angle = 0;
            sim.bottle.uprightGlow = 0;
            if (sim.phaseTimer <= 0) {
              sim.phase = 'SPIN_READY';
              attacker.pose = 'REACH_BOTTLE';
              attacker.poseTimer = 0;
              sim.bottle.heldBy = attacker.slot;
            }
          } else if (sim.phase === 'SPIN_READY') {
            attacker.pose = sim.isChargingSpin ? 'WINDUP_SPIN' : 'REACH_BOTTLE';
            if (sim.isChargingSpin) {
              sim.spinCharge =
                (sim.spinCharge + dt * 1.15 * sim.arenaCondition.spinBarSpeedMult) % 1.05;
              if (sim.spinCharge > 1) sim.spinCharge = 1;
            }

            // Lock bottle cleanly to active fighter's hand!
            const hand = getFighterHandPos({
              visual: CHARACTERS[attacker.charId].visual,
              facing: attacker.slot === 1 ? 1 : -1,
              x: attacker.slot === 1 ? p1X : p2X,
              y: floorY,
              pose: attacker.pose,
              poseProgress: 0.5,
              chargeRatio: sim.spinCharge,
              hitFlash: 0,
              shieldActive: false,
              burnActive: false,
              vulnerable: false,
              time: sim.time,
            });
            sim.bottle.x = hand.x;
            sim.bottle.y = hand.y + 24;
            sim.bottle.angle =
              attacker.slot === 1
                ? -0.35 - sim.spinCharge * 0.45
                : 0.35 + sim.spinCharge * 0.45;

            // CPU AI spin trigger
            if (
              !isReplayMode &&
              config.mode !== 'PVP_LOCAL' &&
              config.mode !== 'PVP_ONLINE' &&
              sim.activeTurn === 2
            ) {
              sim.aiActionDelay -= dt;
              if (sim.aiActionDelay <= 0 && !sim.aiTriggered) {
                if (!sim.isChargingSpin) {
                  sim.isChargingSpin = true;
                  recordedEventsRef.current.push({
                    t: sim.time,
                    slot: 2,
                    kind: 'spin_charge_start',
                  });
                }
                if (sim.spinCharge >= 0.55 + Math.random() * 0.25) {
                  sim.aiTriggered = true;
                  // CPU skill chance
                  if (attacker.energy >= 40 && Math.random() < 0.38) {
                    activateSkill(2, Math.random() > 0.5 ? 'OFENSIVA' : 'TATICA');
                  }
                  launchBottle(sim.spinCharge);
                }
              }
            }
          } else if (sim.phase === 'BOTTLE_FLIGHT') {
            const cond = sim.arenaCondition;
            const gust =
              cond.windGustAmp > 0
                ? Math.sin(sim.time * cond.windGustFreq) * cond.windGustAmp
                : 0;
            sim.bottle.vx += (cond.windForce + gust) * dt;
            sim.bottle.vy += (1450 + cond.updraft) * dt;
            sim.bottle.x += sim.bottle.vx * dt;
            sim.bottle.y += sim.bottle.vy * dt;
            sim.bottle.angle += sim.bottle.angularVel * dt;

            // Table collision
            if (sim.bottle.y >= tableTopY && sim.bottle.vy > 0) {
              sim.bottle.y = tableTopY;
              soundEngine.playBottleBounce();
              spawnBurst(sim.bottle.x, tableTopY, '#FDE68A', 4, 'dust');

              if (sim.bottle.bounces === 0) {
                sim.bottle.bounces = 1;
                sim.bottle.vy = -210 * cond.bounceBoost;
                sim.bottle.vx =
                  cond.slippery > 0
                    ? sim.bottle.vx * 0.55 + (attacker.slot === 1 ? 65 : -65)
                    : sim.bottle.vx * 0.25;
                sim.bottle.angularVel *= 0.3;
              } else {
                // Final landing check: EM PÉ or TOMBOU!
                if (sim.bottle.willLandUpright) {
                  if (attacker.slot === 1) {
                    sim.telemetry.bottleUprights += 1;
                  }
                  sim.bottle.angle = 0;
                  sim.bottle.vx = 0;
                  sim.bottle.vy = 0;
                  sim.bottle.angularVel = 0;
                  sim.bottle.uprightGlow = 1;
                  soundEngine.playBottleUpright();
                  spawnBurst(centerX, tableTopY - 26, '#FBBF24', 8, 'star');
                  addCallout('EM PÉ!', centerX, tableTopY - 95, '#FBBF24', 'Hora do Carrollo!');
                  pushCombatLog(`Garrafa em pé! Chance de Carrollo para ${attacker.name}.`, 'perfect');

                  // Configure Precision Ring target based on Precisão attribute
                  const precBonus = attacker.attrs.precisao * 0.016;
                  const debuffPenalty = attacker.precisionDebuffTurns > 0 ? 0.07 : 0;
                  const width = Math.max(0.14, 0.22 + precBonus - debuffPenalty);
                  sim.ringTargetStart = 0.68 - width * 0.5;
                  sim.ringTargetEnd = 0.68 + width * 0.5;
                  sim.ringProgress = 0;
                  sim.isChargingCarrollo = false;
                  sim.carrolloCharge = 0;
                  sim.aiTriggered = false;
                  if (attacker.slot === 1) {
                    sim.telemetry.carrolloWindowOpenedAt = sim.time;
                  }
                  sim.phase = 'CARROLLO_WINDOW';
                } else if (attacker.secondChance) {
                  // Giro Invertido saves the flip!
                  attacker.secondChance = false;
                  addCallout('GIRO INVERTIDO!', centerX, tableTopY - 90, '#10B981', 'Segunda chance!');
                  pushCombatLog(`${attacker.name}: Giro Invertido! Segunda chance!`, 'skill');
                  sim.bottle.vy = -520;
                  sim.bottle.bounces = 0;
                  sim.bottle.willLandUpright = true;
                  sim.bottle.angularVel = Math.PI * 4;
                } else {
                  // TOMBOU!
                  if (attacker.slot === 1) {
                    sim.telemetry.perfectStreak = 0;
                    sim.comboCount = 0;
                    sim.comboPop = 0;
                  }
                  sim.bottle.angle = attacker.slot === 1 ? Math.PI * 0.48 : -Math.PI * 0.48;
                  sim.bottle.vx = 0;
                  sim.bottle.vy = 0;
                  sim.bottle.angularVel = 0;
                  attacker.vulnerable = true;
                  attacker.pose = 'STUNNED';
                  attacker.poseTimer = 0.9;
                  attacker.poseDuration = 0.9;
                  soundEngine.playBottleFail();
                  addCallout('TOMBOU!', centerX, tableTopY - 85, '#EF4444', 'Vulnerável!');
                  pushCombatLog(`Garrafa tombou! ${attacker.name} ficou vulnerável.`, 'fail');
                  sim.pendingStrike = {
                    type: 'FALHA',
                    damage: 0,
                    defenderBlocked: false,
                    defenderCountered: false,
                  };
                  sim.phase = 'STRIKE_RESOLVE';
                  sim.phaseTimer = 0.9;
                }
              }
            }
          } else if (sim.phase === 'CARROLLO_WINDOW') {
            const baseSpeed =
              (0.88 + attacker.attrs.velocidade * 0.025) * sim.arenaCondition.ringSpeedMult;
            const inTutSweet =
              sim.tutorialStep === 'PERFECT_TIMING_GUIDE' &&
              sim.ringProgress >= sim.ringTargetStart &&
              sim.ringProgress <= sim.ringTargetEnd;
            const tutScale =
              sim.tutorialStep === 'PERFECT_TIMING_GUIDE' && attacker.slot === 1
                ? inTutSweet
                  ? 0.24
                  : 0.48
                : 1;
            sim.ringProgress += dt * baseSpeed * tutScale;
            if (sim.isChargingCarrollo) {
              sim.carrolloCharge = Math.min(1, sim.carrolloCharge + dt * 1.4);
            }

            // CPU Carrollo execution
            if (
              !isReplayMode &&
              config.mode !== 'PVP_LOCAL' &&
              config.mode !== 'PVP_ONLINE' &&
              sim.activeTurn === 2 &&
              !sim.aiTriggered
            ) {
              const targetCenter = (sim.ringTargetStart + sim.ringTargetEnd) * 0.5;
              const diff = config.difficulty ?? 4;
              const errorMargin = Math.max(0.02, (10 - diff) * 0.025);
              if (sim.ringProgress >= targetCenter + (Math.random() - 0.5) * errorMargin) {
                sim.aiTriggered = true;
                executeCarrollo(Math.random() < 0.25);
              }
            }

            if (sim.ringProgress >= 1) {
              if (isReplayMode) {
                sim.ringProgress = 0.99;
              } else if (sim.tutorialStep === 'PERFECT_TIMING_GUIDE' && attacker.slot === 1) {
                sim.ringProgress = 0;
              } else {
                executeCarrollo(false);
              }
            }
          } else if (sim.phase === 'DEFENSE_WINDOW') {
            sim.phaseTimer -= dt;

            if (sim.phaseTimer <= 0) {
              // In replay mode, flush an imminent counter_attempt before resolving
              if (isReplayMode && config.replayData) {
                const nextEv = config.replayData.events[replayCursorRef.current];
                if (nextEv && nextEv.kind === 'counter_attempt' && nextEv.t - sim.time < 0.2) {
                  attemptCounter(nextEv.slot, true, nextEv.isCounter);
                  replayCursorRef.current++;
                }
              }
              sim.counterWindowAvailable = false;
              resolveStrike();
              sim.phase = 'STRIKE_RESOLVE';
              sim.phaseTimer = 0.72;
            }
          } else if (sim.phase === 'STRIKE_RESOLVE') {
            sim.phaseTimer -= dt;
            if (sim.phaseTimer <= 0) {
              advanceTurn();
            }
          }

          // Update particles, callouts & comic SFX bursts
          sim.comboPop = Math.max(0, sim.comboPop - dt * 2.8);
          for (const p of sim.particles) {
            if (!p.active) continue;
            p.life += dt;
            if (p.life >= p.maxLife) {
              p.active = false;
              continue;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 420 * (p.gravityScale ?? 1) * dt;
            if (p.kind === 'comic_word') {
              p.vx *= Math.pow(0.28, dt);
            }
            p.rotation += p.rotSpeed * dt;
          }
          sim.callouts = sim.callouts.filter((c) => {
            c.life += dt;
            return c.life < c.maxLife;
          });
          sim.sfxBursts = sim.sfxBursts.filter((b) => {
            b.life += dt;
            return b.life < b.maxLife;
          });
          }
        }
      }

      // --- DRAW ARENA ---
      ctx.save();
      if (sim.shake > 0.2) {
        ctx.translate(
          (Math.random() - 0.5) * sim.shake,
          (Math.random() - 0.5) * sim.shake
        );
      }

      const visualTime = sim.phase === 'ARENA_ENTRANCE' ? sim.entranceClock : sim.time;

      // Dynamic Biome Cartoon Background
      drawBiomeBackground(ctx, biomeId, w, h, visualTime, {
        isBoss: Boolean(config.storyLevel?.isBoss),
        levelIndex: config.storyLevel?.levelIndex ?? 0,
        wave: config.arcadeWave ?? 1,
      });

      // Dynamic Biome-Specific Atmospheric Particles (docks dust, market spice, castle snow, etc.)
      updateAndDrawAmbientParticles(
        ctx,
        ambientParticlesRef.current,
        biomeId,
        w,
        h,
        pausedRef.current ? 0 : dt,
        visualTime
      );

      // Wooden Dueling Table in center
      drawDuelingTable(ctx, centerX, tableTopY);

      // Fighters
      const strikeDist = Math.abs(p2X - p1X);
      const getPoseProgress = (f: FighterSim) =>
        f.pose === 'ENTRANCE'
          ? Math.max(0, Math.min(1, 1 - sim.phaseTimer / ENTRANCE_DURATION))
          : 1 - Math.max(0, f.poseTimer / Math.max(0.01, f.poseDuration || 0.68));

      const p1Render: FighterRenderState = {
        charId: sim.p1.charId,
        visual: p1Char.visual,
        facing: 1,
        x: p1X,
        y: floorY,
        pose: sim.p1.pose,
        poseProgress: getPoseProgress(sim.p1),
        chargeRatio: sim.activeTurn === 1 ? sim.spinCharge : 0,
        hitFlash: sim.p1.hitFlash,
        strikeTargetDist: strikeDist,
        shieldActive: sim.p1.shieldTurns > 0,
        burnActive: sim.p1.burnTurns > 0,
        vulnerable: sim.p1.vulnerable,
        bumpAmount: sim.p1.pose === 'HIT' ? 1 : sim.p1.pose === 'STUNNED' ? 0.65 : 0,
        time: visualTime,
      };
      const p2Render: FighterRenderState = {
        charId: sim.p2.charId,
        visual: p2Char.visual,
        facing: -1,
        x: p2X,
        y: floorY,
        pose: sim.p2.pose,
        poseProgress: getPoseProgress(sim.p2),
        chargeRatio: sim.activeTurn === 2 ? sim.spinCharge : 0,
        hitFlash: sim.p2.hitFlash,
        strikeTargetDist: strikeDist,
        shieldActive: sim.p2.shieldTurns > 0,
        burnActive: sim.p2.burnTurns > 0,
        vulnerable: sim.p2.vulnerable,
        bumpAmount: sim.p2.pose === 'HIT' ? 1 : sim.p2.pose === 'STUNNED' ? 0.65 : 0,
        time: visualTime,
      };

      // Draw striking fighter last so the descending-arc Carrolo knuckles render cleanly over rival's head
      if (sim.p1.pose === 'STRIKE' && sim.p2.pose !== 'STRIKE') {
        drawFighter(ctx, p2Render);
        drawFighter(ctx, p1Render);
      } else {
        drawFighter(ctx, p1Render);
        drawFighter(ctx, p2Render);
      }

      // Bottle
      const activeCharVisual =
        sim.activeTurn === 1 ? p1Char.visual : p2Char.visual;
      const bottleRender: BottleRenderState = {
        x: sim.bottle.x,
        y: sim.bottle.y,
        angle: sim.bottle.angle,
        scaleX: sim.bottle.scaleX,
        scaleY: sim.bottle.scaleY,
        visible: true,
        heldBy: sim.bottle.heldBy,
        uprightGlow: sim.bottle.uprightGlow,
        color: activeCharVisual.bottleColor,
        liquidColor: activeCharVisual.bottleLiquid,
        isGolden: sim.bottle.isGolden,
        magnetized:
          (sim.activeTurn === 1 ? sim.p1.bottleMagnet : sim.p2.bottleMagnet) &&
          sim.phase !== 'STRIKE_RESOLVE',
      };
      drawBottle(ctx, bottleRender, visualTime);

      // Spin Charge Gauge Arc above active fighter when charging OR during Tutorial Spin Guide
      if (
        sim.phase === 'SPIN_READY' &&
        (sim.isChargingSpin || (sim.tutorialStep === 'SPIN_GUIDE' && sim.activeTurn === 1))
      ) {
        const gx = sim.activeTurn === 1 ? p1X : p2X;
        const gy = floorY - 190;
        const targetMid = Math.max(0.45, Math.min(0.85, 0.68 + sim.arenaCondition.sweetSpotShift));
        const bandStart = Math.max(0.2, targetMid - 0.22);
        const bandEnd = Math.min(0.96, targetMid + 0.22);
        const inGreen = sim.spinCharge >= bandStart && sim.spinCharge <= bandEnd;
        ctx.save();
        ctx.lineWidth = 12;
        ctx.strokeStyle = '#111827';
        ctx.beginPath();
        ctx.arc(gx, gy, 38, Math.PI, Math.PI * 2);
        ctx.stroke();

        // Sweet spot green band (shifts slightly on unstable/tremoring tables)
        ctx.lineWidth = 8;
        ctx.strokeStyle = inGreen ? '#34D399' : '#10B981';
        ctx.beginPath();
        ctx.arc(gx, gy, 38, Math.PI + Math.PI * bandStart, Math.PI + Math.PI * bandEnd);
        ctx.stroke();

        // Fill meter
        if (sim.isChargingSpin) {
          ctx.strokeStyle = inGreen ? '#34D399' : '#FBBF24';
          ctx.beginPath();
          ctx.arc(gx, gy, 38, Math.PI, Math.PI + Math.PI * sim.spinCharge);
          ctx.stroke();
        }

        if (sim.tutorialStep === 'SPIN_GUIDE' && sim.activeTurn === 1) {
          ctx.font = '400 14px "Bangers", "Comic Neue", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#111827';
          const guideTxt = !sim.isChargingSpin
            ? 'SEGURE ATÉ A FAIXA VERDE!'
            : inGreen
            ? 'SOLTE AGORA!'
            : 'CONTINUE SEGURANDO...';
          ctx.strokeText(guideTxt, gx, gy - 52);
          ctx.fillStyle = inGreen ? '#34D399' : '#FDE68A';
          ctx.fillText(guideTxt, gx, gy - 52);
        }
        ctx.restore();
      }

      // Carrollo Precision Ring centered above the upright bottle!
      if (sim.phase === 'CARROLLO_WINDOW') {
        const rx = centerX;
        const ry = tableTopY - 115;
        const maxR = 92;
        const targetOuter = maxR * (1 - sim.ringTargetStart);
        const targetInner = maxR * (1 - sim.ringTargetEnd);
        const currentR = Math.max(8, maxR * (1 - sim.ringProgress));
        const inCoreNow =
          sim.ringProgress >= sim.ringTargetStart && sim.ringProgress <= sim.ringTargetEnd;
        const isTutRing = sim.tutorialStep === 'PERFECT_TIMING_GUIDE' && sim.activeTurn === 1;

        ctx.save();

        // Tutorial outer halo & inward timing arrows
        if (isTutRing) {
          const pulse = 0.55 + Math.sin(sim.time * 10) * 0.35;
          ctx.save();
          ctx.globalAlpha = inCoreNow ? 0.95 : pulse * 0.6;
          ctx.strokeStyle = inCoreNow ? '#34D399' : '#FDE68A';
          ctx.lineWidth = inCoreNow ? 10 : 5;
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.arc(rx, ry, (targetOuter + targetInner) * 0.5 + 16, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Target golden/emerald ring zone
        ctx.strokeStyle = isTutRing && inCoreNow ? '#34D399' : '#10B981';
        ctx.lineWidth = Math.max(8, targetOuter - targetInner);
        ctx.beginPath();
        ctx.arc(rx, ry, (targetOuter + targetInner) * 0.5, 0, Math.PI * 2);
        ctx.stroke();

        // Thick ink border around target
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(rx, ry, targetOuter, 0, Math.PI * 2);
        ctx.stroke();

        // Shrinking timing ring
        ctx.strokeStyle =
          isTutRing && inCoreNow
            ? '#FFFFFF'
            : sim.isChargingCarrollo
            ? '#EF4444'
            : '#FBBF24';
        ctx.lineWidth = isTutRing && inCoreNow ? 9 : 7;
        ctx.beginPath();
        ctx.arc(rx, ry, currentR, 0, Math.PI * 2);
        ctx.stroke();

        // Charged Carrollo outer power arc
        if (sim.isChargingCarrollo && sim.carrolloCharge > 0.04) {
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(
            rx,
            ry,
            maxR + 10,
            -Math.PI / 2,
            -Math.PI / 2 + Math.PI * 2 * Math.min(1, sim.carrolloCharge)
          );
          ctx.stroke();
        }

        // Center label
        ctx.font = '400 16px "Bangers", "Comic Neue", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#111827';
        const txt = isTutRing
          ? inCoreNow
            ? 'AGORA! PERFEITO!'
            : 'ESPERE O VERDE...'
          : isLocalHumanTurn(sim.activeTurn)
          ? 'TOQUE AGORA!'
          : 'ALVO';
        ctx.strokeText(txt, rx, ry + 5);
        ctx.fillStyle = isTutRing && inCoreNow ? '#34D399' : '#FFF8EB';
        ctx.fillText(txt, rx, ry + 5);

        if (isTutRing) {
          ctx.font = '700 11px "Comic Neue", system-ui, sans-serif';
          ctx.lineWidth = 3.5;
          const sub = 'Alinhe o anel dourado com a faixa verde para o Carrollo Perfeito';
          ctx.strokeText(sub, rx, ry - maxR - 16);
          ctx.fillStyle = '#FDE68A';
          ctx.fillText(sub, rx, ry - maxR - 16);
        }
        ctx.restore();
      }

      if (sim.phase === 'ARENA_ENTRANCE' && !introDialogueOpenRef.current) {
        const ep = Math.max(0, Math.min(1, 1 - sim.phaseTimer / ENTRANCE_DURATION));
        const alpha = ep < 0.15 ? ep / 0.15 : ep > 0.85 ? (1 - ep) / 0.15 : 1;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.textAlign = 'center';
        ctx.font = '400 28px "Bangers", "Comic Neue", system-ui, sans-serif';
        ctx.lineWidth = 7;
        ctx.strokeStyle = '#111827';
        const title = `${sim.p1.name.toUpperCase()}  VS  ${sim.p2.name.toUpperCase()}`;
        ctx.strokeText(title, centerX, tableTopY - 148);
        ctx.fillStyle = '#FDE047';
        ctx.fillText(title, centerX, tableTopY - 148);

        ctx.font = '700 13px "Comic Neue", system-ui, sans-serif';
        ctx.lineWidth = 4;
        const sub = 'ENTRADA NA ARENA!';
        ctx.strokeText(sub, centerX, tableTopY - 122);
        ctx.fillStyle = '#FFF8EB';
        ctx.fillText(sub, centerX, tableTopY - 122);
        ctx.restore();
      }

      drawParticles(ctx, sim.particles);
      drawComicSfxBursts(ctx, sim.sfxBursts);
      drawFloatingCallouts(ctx, sim.callouts);
      ctx.restore();

      // Throttled HUD state sync (~20fps for smooth React bars without thrashing)
      hudSyncAcc += dt;
      if (hudSyncAcc >= 0.05) {
        hudSyncAcc = 0;
        const activeName = sim.activeTurn === 1 ? sim.p1.name : sim.p2.name;
        const defSlot: 1 | 2 = sim.activeTurn === 1 ? 2 : 1;
        let promptText = `Turno de ${activeName}`;
        if (sim.phase === 'ARENA_ENTRANCE') {
          promptText = `Entrada na Arena: ${sim.p1.name} vs ${sim.p2.name}!`;
        } else if (sim.tutorialStep === 'SPIN_GUIDE' && sim.phase === 'SPIN_READY') {
          promptText =
            'TUTORIAL 1/2: Segure na arena ou no botão e solte na faixa VERDE para equilibrar a garrafa!';
        } else if (
          sim.tutorialStep === 'PERFECT_TIMING_GUIDE' &&
          sim.phase === 'CARROLLO_WINDOW'
        ) {
          promptText =
            'TUTORIAL 2/2: Espere o anel dourado alinhar na faixa VERDE brilhante e toque para um CARROLLO PERFEITO!';
        } else if (sim.phase === 'SPIN_READY') {
          promptText = isLocalHumanTurn(sim.activeTurn)
            ? `Segure e solte na faixa verde para girar a garrafa!`
            : `${activeName} está preparando o giro...`;
        } else if (sim.phase === 'BOTTLE_FLIGHT') {
          promptText = 'A garrafa está girando!';
        } else if (sim.phase === 'CARROLLO_WINDOW') {
          promptText = isLocalHumanTurn(sim.activeTurn)
            ? 'GARRAFA EM PÉ! Toque no anel verde para o Carrollo!'
            : `${activeName} vai desferir o Carrollo!`;
        } else if (sim.phase === 'DEFENSE_WINDOW') {
          promptText =
            sim.counterWindowAvailable && isLocalHumanTurn(defSlot)
              ? 'CHANCE RARA! Toque em CONTRA-CARROLLO para amortecer o golpe!'
              : 'Impacto iminente!';
        }

        const getBuffs = (f: FighterSim) => {
          const b: string[] = [];
          if (f.shieldTurns > 0) b.push('Escudo');
          if (f.burnTurns > 0) b.push('Queimando');
          if (f.vulnerable) b.push('Vulnerável');
          if (f.bottleMagnet) b.push('Base Firme');
          return b;
        };

        setHud({
          p1Hp: sim.p1.hp,
          p1MaxHp: sim.p1.maxHp,
          p1Energy: Math.round(sim.p1.energy),
          p2Hp: sim.p2.hp,
          p2MaxHp: sim.p2.maxHp,
          p2Energy: Math.round(sim.p2.energy),
          activeTurn: sim.activeTurn,
          phase: sim.phase,
          ringProgress: sim.ringProgress,
          ringTargetStart: sim.ringTargetStart,
          ringTargetEnd: sim.ringTargetEnd,
          chargeRatio: sim.spinCharge,
          promptText,
          canCounter:
            sim.phase === 'DEFENSE_WINDOW' &&
            sim.counterWindowAvailable &&
            isLocalHumanTurn(defSlot) &&
            !sim.pendingStrike?.defenderCountered,
          p1Buffs: getBuffs(sim.p1),
          p2Buffs: getBuffs(sim.p2),
          winner: sim.winner,
          score: sim.score,
          comboCount: sim.comboCount,
          comboMultiplier: Math.min(5, 1 + Math.max(0, sim.comboCount - 1) * 0.5),
          maxCombo: sim.maxCombo,
          comboPop: sim.comboPop,
          endQuip: sim.endQuip,
          tutorialStep: sim.tutorialStep,
          actionLog: sim.actionLog,
          roundEvent: sim.roundEvent,
          arenaCondition: sim.arenaCondition,
          bottleSweetSpot: Math.max(0.45, Math.min(0.85, 0.68 + sim.arenaCondition.sweetSpotShift)),
          defenseRatio:
            sim.phase === 'DEFENSE_WINDOW'
              ? Math.max(0, Math.min(1, sim.phaseTimer / Math.max(0.1, sim.defenseMaxTimer)))
              : 0,
          matchStats: {
            damageDealt: sim.telemetry.damageDealt,
            perfectCount: sim.telemetry.perfectCount,
            counterCount: sim.telemetry.counterCount,
            enemyStrikesFaced: sim.telemetry.enemyStrikesFaced,
            bottleUprights: sim.telemetry.bottleUprights,
            precisionPct:
              sim.telemetry.ringAccuracySamples.length > 0
                ? Math.round(
                    sim.telemetry.ringAccuracySamples.reduce((a, b) => a + b, 0) /
                      sim.telemetry.ringAccuracySamples.length
                  )
                : 0,
            avgReactionMs:
              sim.telemetry.reactionSamplesMs.length > 0
                ? Math.round(
                    sim.telemetry.reactionSamplesMs.reduce((a, b) => a + b, 0) /
                      sim.telemetry.reactionSamplesMs.length
                  )
                : 0,
          },
        });
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [
    activateSkill,
    addCallout,
    addComicSfx,
    applyRoundEvent,
    attemptCounter,
    biomeId,
    config.arcadeWave,
    config.difficulty,
    config.mode,
    config.player1CharId,
    config.player2CharId,
    config.replayData,
    config.storyLevel?.isBoss,
    config.storyLevel?.levelIndex,
    executeCarrollo,
    isLocalHumanTurn,
    isReplayMode,
    launchBottle,
    onBattleFinished,
    p1Char.visual,
    p2Char.visual,
    pushCombatLog,
    spawnBurst,
    spawnCarrolloImpactParticles,
    triggerMotionShake,
  ]);

  const handleRestartMatch = () => {
    resultReportedRef.current = false;
    usedSkillsRef.current = {};
    recordedEventsRef.current = [];
    replayCursorRef.current = 0;
    const s = simRef.current;
    if (!s) return;
    const useEntrance = !isReplayMode && config.mode !== 'PVP_ONLINE';
    s.p1 = makeFighterSim(1);
    s.p2 = makeFighterSim(2);
    if (useEntrance) {
      s.p1.pose = 'ENTRANCE';
      s.p2.pose = 'ENTRANCE';
    }
    s.activeTurn = 1;
    s.phase = useEntrance ? 'ARENA_ENTRANCE' : 'TURN_INTRO';
    s.phaseTimer = useEntrance ? ENTRANCE_DURATION : 0.6;
    s.time = 0;
    s.entranceClock = 0;
    s.entranceBeat = 0;
    s.winner = 0;
    s.comboCount = 0;
    s.maxCombo = 0;
    s.comboPop = 0;
    s.endQuip = undefined;
    s.tutorialStep = !isReplayMode && config.enableTutorial ? 'SPIN_GUIDE' : 'NONE';
    s.roundEvent = 'NONE';
    s.arenaCondition =
      !isReplayMode && config.mode !== 'PVP_ONLINE' && !config.enableTutorial
        ? rollArenaCondition(biomeId)
        : ARENA_CONDITIONS.ar_estavel;
    s.counterWindowAvailable = false;
    s.callouts = [];
    s.sfxBursts = [];
    s.logSeq = 1;
    s.actionLog = [
      {
        id: 1,
        timeLabel: '0:00',
        message: `Duelo reiniciado: ${s.p1.name} vs ${s.p2.name}!`,
        tone: 'info',
      },
    ];
    s.telemetry = {
      damageDealt: 0,
      perfectCount: 0,
      perfectStreak: s.telemetry.perfectStreak,
      bestPerfectStreak: s.telemetry.bestPerfectStreak,
      tookDamage: false,
      counterCount: 0,
      enemyStrikesFaced: 0,
      bottleUprights: 0,
      ringAccuracySamples: [],
      reactionSamplesMs: [],
      carrolloWindowOpenedAt: 0,
    };
    setPostMatchTab('summary');
    setCombatReportOpen(false);
    setComboMilestoneGlow(null);
    prevComboCountRef.current = 0;
    prevComboMultRef.current = 1;
    setPaused(false);
  };

  // Auto-open the dedicated Combat Report modal briefly after victory/defeat celebration
  useEffect(() => {
    if (hud.winner === 0) {
      setCombatReportOpen(false);
      return;
    }
    const timer = setTimeout(() => {
      setCombatReportOpen(true);
    }, 1300);
    return () => clearTimeout(timer);
  }, [hud.winner]);

  // Trigger Framer Motion Combo Meter scaling pulse on multiplier/combo rise + golden glow at 5, 10, 20
  useEffect(() => {
    const prevCount = prevComboCountRef.current;
    const prevMult = prevComboMultRef.current;
    prevComboCountRef.current = hud.comboCount;
    prevComboMultRef.current = hud.comboMultiplier;

    if (hud.comboCount > prevCount || hud.comboMultiplier > prevMult) {
      if (
        comboMeterScope.current &&
        !(
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches
        )
      ) {
        void animateComboMeter(
          comboMeterScope.current,
          { scale: [1, 1.2, 1] },
          { duration: 0.3, ease: 'easeOut' }
        );
      }

      const crossedMilestone: 5 | 10 | 20 | null =
        prevCount < 20 && hud.comboCount >= 20
          ? 20
          : prevCount < 10 && hud.comboCount >= 10
          ? 10
          : prevCount < 5 && hud.comboCount >= 5
          ? 5
          : null;

      if (crossedMilestone) {
        setComboMilestoneGlow(crossedMilestone);
        const timer = setTimeout(() => {
          setComboMilestoneGlow((cur) => (cur === crossedMilestone ? null : cur));
        }, 2200);
        return () => clearTimeout(timer);
      }
    }
  }, [animateComboMeter, comboMeterScope, hud.comboCount, hud.comboMultiplier]);

  // Which player's skill bar to show at bottom (in Local PvP, show active turn player; in Online/Solo, show mySlot)
  const controlSlot: 1 | 2 =
    config.mode === 'PVP_LOCAL' ? hud.activeTurn : mySlot;
  const controlFighter = simRef.current
    ? controlSlot === 1
      ? simRef.current.p1
      : simRef.current.p2
    : null;
  const controlEnergy = controlSlot === 1 ? hud.p1Energy : hud.p2Energy;

  const winnerCharId = hud.winner === 1 ? config.player1CharId : config.player2CharId;
  const loserCharId = hud.winner === 1 ? config.player2CharId : config.player1CharId;
  const winnerName =
    hud.winner === 1
      ? simRef.current?.p1.name || p1Char.name
      : simRef.current?.p2.name || p2Char.name;

  return (
    <motion.div
      ref={arenaShakeScope}
      className="relative w-screen h-screen overflow-hidden bg-[#18121E] dark:bg-[#05070B]"
    >
      {/* Full-viewport 60fps Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
        className={`block w-full h-full touch-none ${allowGestures ? 'cursor-pointer' : 'cursor-default'}`}
      />

      {/* Subtle Low-Light Comfort Dimmer in High-Contrast Dark Mode */}
      <div className="pointer-events-none absolute inset-0 bg-transparent dark:bg-[#03050A]/25 transition-colors" />

      {/* Low-Occlusion Perimeter HUD (pointer-events-none wrapper) */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2.5 sm:p-4">
        {/* TOP HUD: Compact Horizontal Fighter Health Bars + Center Match Strip */}
        <div className="flex items-start justify-between gap-2.5">
          {/* Player 1 Meter + Dynamic Combo Meter */}
          <div className="w-[38%] max-w-xs flex flex-col gap-1.5 items-start">
            <div className="w-full cartoon-outline rounded-xl bg-[#FFF8EB] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] px-2.5 py-1.5 sm:px-3 sm:py-2">
              <div className="flex items-center gap-2">
                <CharacterAvatar charId={config.player1CharId} size={34} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-display text-xs truncate">
                      {simRef.current?.p1.name || p1Char.name}
                    </span>
                    <span className="font-mono-nums text-[10px] font-bold">
                      {hud.p1Hp}/{hud.p1MaxHp}
                    </span>
                  </div>
                  <div className="mt-0.5 h-2.5 rounded-full bg-[#CBD5E1] dark:bg-[#1E293B] border-2 border-[#111827] dark:border-[#94A3B8] overflow-hidden">
                    <div
                      className="h-full bg-[#EF4444] transition-[width] duration-150"
                      style={{ width: `${(hud.p1Hp / Math.max(1, hud.p1MaxHp)) * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-1.5">
                    <div className="flex-1 h-1.5 rounded-full bg-[#CBD5E1] dark:bg-[#1E293B] border border-[#111827] dark:border-[#94A3B8] overflow-hidden">
                      <div
                        className="h-full bg-[#38BDF8] transition-[width] duration-150"
                        style={{ width: `${hud.p1Energy}%` }}
                      />
                    </div>
                    <span className="font-mono-nums text-[9px] font-bold text-[#0284C7] dark:text-[#38BDF8]">
                      {hud.p1Energy} ENE
                    </span>
                  </div>
                </div>
              </div>
              {hud.p1Buffs.length > 0 && (
                <div className="mt-0.5 text-[10px] font-bold text-[#B45309] dark:text-[#FDE047] truncate">
                  {hud.p1Buffs.join(' · ')}
                </div>
              )}
            </div>

            {/* Dynamic Combo Meter with Framer Motion Multiplier Pulse & Golden Glow at 5/10/20 */}
            {hud.comboCount >= 1 && (
              <motion.div
                ref={comboMeterScope}
                animate={
                  comboMilestoneGlow
                    ? {
                        boxShadow: [
                          '0 0 0px rgba(251, 191, 36, 0.3)',
                          '0 0 24px rgba(253, 224, 71, 0.95)',
                          '0 0 10px rgba(251, 191, 36, 0.55)',
                        ],
                      }
                    : { boxShadow: '0 3px 0 #111827' }
                }
                transition={
                  comboMilestoneGlow
                    ? { duration: 0.7, repeat: Infinity, repeatType: 'reverse' }
                    : { duration: 0.2 }
                }
                style={{ transformOrigin: 'top left' }}
                className={`relative cartoon-outline rounded-xl px-2.5 py-1 transition-colors duration-150 ${
                  comboMilestoneGlow
                    ? 'bg-gradient-to-r from-[#FDE047] via-[#FBBF24] to-[#F59E0B] text-[#111827] ring-2 ring-[#FFF8EB]'
                    : hud.comboCount >= 5
                    ? 'bg-gradient-to-r from-[#FBBF24] via-[#EF4444] to-[#EC4899] text-white'
                    : hud.comboCount === 4
                    ? 'bg-[#EF4444] text-white'
                    : hud.comboCount === 3
                    ? 'bg-[#F97316] text-white'
                    : hud.comboCount === 2
                    ? 'bg-[#FDE047] text-[#111827]'
                    : 'bg-[#FEF3C7] text-[#111827]'
                }`}
              >
                {comboMilestoneGlow && (
                  <div className="mb-0.5 flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-[#111827]">
                    <Sparkles className="w-3 h-3" />
                    <span>Brilho Dourado · {comboMilestoneGlow} Ataques!</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm sm:text-base leading-none drop-shadow-[1px_1px_0_rgba(17,24,39,0.4)]">
                    {hud.comboCount}x{' '}
                    {hud.comboCount >= 20
                      ? 'LENDÁRIO!'
                      : hud.comboCount >= 10
                      ? 'SUPER COMBO!'
                      : hud.comboCount >= 5
                      ? 'ULTRA COMBO!'
                      : 'COMBO!'}
                  </span>
                  <span className="font-mono-nums text-[10px] font-extrabold bg-[#111827] text-[#FDE047] px-1.5 py-0.5 rounded">
                    +{hud.comboMultiplier.toFixed(1)}x PTS
                  </span>
                </div>
                {/* Heat Segmented Combo Bar */}
                <div className="mt-1 grid grid-cols-5 gap-1">
                  {[1, 2, 3, 4, 5].map((tier) => (
                    <div
                      key={tier}
                      className={`h-1.5 rounded-sm border border-[#111827] ${
                        hud.comboCount >= tier ? 'bg-[#FFF8EB]' : 'bg-[#111827]/25'
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Center Match Controls (Visual UI System PAPER tiles) + Combat Action Text Log */}
          <div className="pointer-events-auto flex flex-col items-center gap-1 max-w-[280px] sm:max-w-[330px]">
            <div className="flex items-center gap-1.5">
              <button
                onClick={onToggleMute}
                className="ui-sys-btn w-8 h-8 rounded-lg flex items-center justify-center"
                aria-label="Som"
                title="Som"
              >
                {save.muted ? (
                  <VolumeX className="w-3.5 h-3.5 text-[#EF4444]" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-[#10B981]" />
                )}
              </button>
              <button
                onClick={() => {
                  const next = !musicOn;
                  soundEngine.setMusicEnabled(next);
                  setMusicOn(next);
                }}
                className={`ui-sys-btn w-8 h-8 rounded-lg flex items-center justify-center ${
                  musicOn && !save.muted ? '!bg-[#FEF3C7] dark:!bg-[#1E293B]' : ''
                }`}
                aria-label="Música da Arena"
                title={musicOn ? 'Silenciar Música' : 'Ativar Música'}
              >
                <Music
                  className={`w-3.5 h-3.5 ${
                    musicOn && !save.muted ? 'text-[#0284C7] dark:text-[#38BDF8]' : 'text-[#94A3B8]'
                  }`}
                />
              </button>
              <button
                onClick={() => setShowCombatLog((v) => !v)}
                className={`ui-sys-btn h-8 px-2 rounded-lg text-[10px] font-extrabold flex items-center gap-1 ${
                  showCombatLog ? '!bg-[#FBBF24] !text-[#18121E]' : ''
                }`}
                title="Exibir/Ocultar Registro de Combate"
              >
                <ScrollText className="w-3.5 h-3.5" />
                <span>Log</span>
              </button>
              <button
                onClick={() => setPaused(true)}
                className="ui-sys-btn w-8 h-8 rounded-lg flex items-center justify-center"
                aria-label="Pausar"
                title="Pausar"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-[10px] font-bold text-[#FDE68A] dark:text-[#FDE047] bg-[#18121E]/85 dark:bg-[#05070B]/95 px-2.5 py-0.5 rounded-md border-2 border-[#111827] dark:border-[#94A3B8] font-mono-nums whitespace-nowrap">
              {isReplayMode
                ? `REPLAY ${replaySpeed}x · ${biomeDef.name}`
                : config.mode === 'ARCADE'
                ? `Onda ${config.arcadeWave || 1} · ${biomeDef.name} · ${hud.score} pts`
                : config.mode === 'PVP_ONLINE'
                ? `Sala ${config.pvpRoomCode} · ${biomeDef.name}`
                : config.storyLevel
                ? `${config.storyLevel.name} · ${biomeDef.name}`
                : `Modo Livre · ${biomeDef.name}`}
            </div>

            {hud.arenaCondition.id !== 'ar_estavel' && (
              <div
                title={hud.arenaCondition.description}
                className="text-[10px] font-bold px-2.5 py-0.5 rounded-md border-2 border-[#111827] dark:border-[#94A3B8] bg-[#E0F2FE] dark:bg-[#0F172A] text-[#075985] dark:text-[#38BDF8] flex items-center gap-1 whitespace-nowrap"
              >
                <Wind className="w-3 h-3 shrink-0" />
                <span>
                  {hud.arenaCondition.label} · {hud.arenaCondition.shortEffect}
                </span>
              </div>
            )}

            {hud.roundEvent !== 'NONE' && (
              <div className="text-[10px] font-display px-2.5 py-0.5 rounded-md border-2 border-[#111827] dark:border-[#F8FAFC] bg-[#FBBF24] dark:bg-[#FDE047] text-[#111827] whitespace-nowrap">
                {hud.roundEvent === 'GOLDEN_ROUND'
                  ? 'Sorte · Garrafa Dourada (+40% Dano)'
                  : hud.roundEvent === 'TAILWIND'
                  ? 'Sorte · Brisa Favorável (Garrafa Estável)'
                  : 'Sorte · Surto de Rolha (+25 ENE)'}
              </div>
            )}

            {(hud.tutorialStep === 'SPIN_GUIDE' || hud.tutorialStep === 'PERFECT_TIMING_GUIDE') && (
              <button
                onClick={() => {
                  if (simRef.current) {
                    simRef.current.tutorialStep = 'DONE';
                  }
                  onTutorialCompleted?.();
                }}
                className="cartoon-btn px-2.5 py-0.5 rounded-md bg-[#38BDF8] text-[#111827] text-[10px] font-extrabold whitespace-nowrap"
              >
                Pular Tutorial
              </button>
            )}

            {/* Compact Combat Action Text Log */}
            {showCombatLog && (
              <div className="pointer-events-none w-full rounded-xl bg-[#18121E]/80 dark:bg-[#05070B]/92 border-2 border-[#111827] dark:border-[#94A3B8] px-2.5 py-1.5 space-y-0.5 backdrop-blur-[2px]">
                {hud.actionLog.slice(0, 2).map((entry, idx) => {
                  const toneColor =
                    entry.tone === 'perfect'
                      ? 'border-l-[#10B981] text-[#A7F3D0]'
                      : entry.tone === 'critical'
                      ? 'border-l-[#FBBF24] text-[#FDE68A]'
                      : entry.tone === 'fail'
                      ? 'border-l-[#EF4444] text-[#FCA5A5]'
                      : entry.tone === 'counter'
                      ? 'border-l-[#38BDF8] text-[#BAE6FD]'
                      : entry.tone === 'skill'
                      ? 'border-l-[#C084FC] text-[#E9D5FF]'
                      : 'border-l-[#94A3B8] text-[#F8FAFC]';
                  return (
                    <div
                      key={entry.id}
                      className={`border-l-[3px] pl-1.5 flex items-baseline gap-1.5 text-[10px] leading-tight truncate ${toneColor} ${
                        idx === 0 ? 'font-bold opacity-100' : idx === 1 ? 'opacity-80' : 'opacity-60'
                      }`}
                    >
                      <span className="font-mono-nums text-[9px] text-[#94A3B8] shrink-0">
                        {entry.timeLabel}
                      </span>
                      <span className="truncate">{entry.message}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Player 2 Meter */}
          <div className="w-[38%] max-w-xs cartoon-outline rounded-xl bg-[#FFF8EB] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] px-2.5 py-1.5 sm:px-3 sm:py-2">
            <div className="flex items-center gap-2 flex-row-reverse">
              <CharacterAvatar charId={config.player2CharId} size={34} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono-nums text-[10px] font-bold">
                    {hud.p2Hp}/{hud.p2MaxHp}
                  </span>
                  <span className="font-display text-xs truncate">
                    {simRef.current?.p2.name || p2Char.name}
                  </span>
                </div>
                <div className="mt-0.5 h-2.5 rounded-full bg-[#CBD5E1] dark:bg-[#1E293B] border-2 border-[#111827] dark:border-[#94A3B8] overflow-hidden">
                  <div
                    className="h-full bg-[#EA580C] ml-auto transition-[width] duration-150"
                    style={{ width: `${(hud.p2Hp / Math.max(1, hud.p2MaxHp)) * 100}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between gap-1.5">
                  <span className="font-mono-nums text-[9px] font-bold text-[#0284C7] dark:text-[#38BDF8]">
                    {hud.p2Energy} ENE
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-[#CBD5E1] dark:bg-[#1E293B] border border-[#111827] dark:border-[#94A3B8] overflow-hidden">
                    <div
                      className="h-full bg-[#38BDF8] ml-auto transition-[width] duration-150"
                      style={{ width: `${hud.p2Energy}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            {hud.p2Buffs.length > 0 && (
              <div className="mt-0.5 text-[10px] font-bold text-[#B45309] dark:text-[#FDE047] text-right truncate">
                {hud.p2Buffs.join(' · ')}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM HUD: Horizontal Original Arcade-Bottle Command Deck */}
        <div className="flex flex-col items-center gap-1.5">
          {/* Compact Dynamic Prompt Line */}
          <div className="text-[11px] font-semibold text-[#FFF8EB] dark:text-[#FDE047] bg-[#18121E]/85 dark:bg-[#05070B]/95 border-2 border-[#111827] dark:border-[#94A3B8] px-3 py-0.5 rounded-lg text-center">
            {isReplayMode ? `Replay · ${hud.promptText}` : hud.promptText}
          </div>

          <div className="pointer-events-auto w-full max-w-5xl flex items-center justify-between gap-2.5">
            {isReplayMode ? (
              <div className="w-full flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => setPaused((p) => !p)}
                  className="command-deck-plate px-4 py-2 bg-[#FBBF24] text-[#111827] font-display text-xs flex items-center gap-1.5"
                >
                  {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{paused ? 'Retomar' : 'Pausar'}</span>
                </button>
                <button
                  onClick={() => setReplaySpeed((s) => (s === 1 ? 2 : 1))}
                  className="command-deck-plate px-4 py-2 bg-[#38BDF8] text-[#111827] font-display text-xs flex items-center gap-1.5 font-mono-nums"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span>Velocidade {replaySpeed}x</span>
                </button>
                <button
                  onClick={handleRestartMatch}
                  className="command-deck-plate px-4 py-2 bg-[#FFF8EB] text-[#111827] font-display text-xs flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reiniciar</span>
                </button>
                <button
                  onClick={onExit}
                  className="command-deck-plate px-4 py-2 bg-[#EF4444] text-white font-display text-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Sair do Replay</span>
                </button>
              </div>
            ) : (
              <>
                {/* Left: Redesigned Visual UI System Action Trigger (or Gesture Prompt in 'gestures' mode) */}
                <div className="shrink-0">
                  {hud.canCounter ? (
                    <button
                      onPointerDown={() =>
                        attemptCounter(hud.activeTurn === 1 ? 2 : 1)
                      }
                      className="command-deck-plate relative px-4 py-2 bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#18121E] flex items-center gap-2.5 min-w-[215px]"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#FFF8EB] border-2 border-[#18121E] flex items-center justify-center shrink-0">
                        <Shield className="w-4 h-4 text-[#0284C7]" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-sm leading-none">
                            CONTRA-CARROLLO!
                          </span>
                          <span className="font-mono-nums text-[9px] bg-[#18121E] text-[#FDE68A] px-1 py-0.5 rounded">
                            [A]
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 w-full rounded-full bg-[#18121E]/75 overflow-hidden border border-[#18121E]">
                          <div
                            className="h-full bg-[#FDE047]"
                            style={{ width: `${Math.round(hud.defenseRatio * 100)}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  ) : (hud.phase === 'SPIN_READY' || hud.phase === 'CARROLLO_WINDOW') &&
                    isLocalHumanTurn(hud.activeTurn) ? (
                    allowButtons ? (
                      <button
                        onPointerDown={handlePrimaryDown}
                        onPointerUp={handlePrimaryUp}
                        className={`command-deck-plate relative px-4 py-2 flex items-center gap-2.5 min-w-[225px] ${
                          hud.phase === 'CARROLLO_WINDOW'
                            ? 'bg-[#10B981] hover:bg-[#059669] text-white'
                            : 'bg-[#FFF8EB] hover:bg-[#FEF3C7] text-[#18121E]'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl border-2 border-[#18121E] flex items-center justify-center shrink-0 ${
                            hud.phase === 'CARROLLO_WINDOW'
                              ? 'bg-[#FFF8EB] text-[#10B981]'
                              : 'bg-[#FBBF24] text-[#18121E]'
                          }`}
                        >
                          {hud.phase === 'SPIN_READY' ? (
                            <RotateCcw className="w-4 h-4" />
                          ) : (
                            <Zap className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-display text-sm leading-none tracking-wide">
                              {hud.phase === 'SPIN_READY'
                                ? 'GIRAR GARRAFA'
                                : 'CARROLLO!'}
                            </span>
                            <span className="font-mono-nums text-[9px] bg-[#18121E] text-[#FDE68A] px-1.5 py-0.5 rounded">
                              ESPAÇO
                            </span>
                          </div>
                          <div className="text-[10px] font-semibold opacity-80 leading-tight mt-0.5">
                            {hud.phase === 'SPIN_READY'
                              ? 'Segura, gira e solta no verde!'
                              : 'Toque na faixa verde!'}
                          </div>
                          {/* Embedded live timing bar */}
                          <div className="mt-1 relative h-2 w-full rounded-full bg-[#18121E]/25 overflow-hidden border border-[#18121E]">
                            {hud.phase === 'SPIN_READY' ? (
                              <>
                                <div
                                  className="absolute top-0 bottom-0 bg-[#10B981]/80"
                                  style={{
                                    left: `${Math.max(20, (hud.bottleSweetSpot - 0.22) * 100)}%`,
                                    width: '44%',
                                  }}
                                />
                                <div
                                  className="h-full bg-[#EF4444]"
                                  style={{ width: `${Math.min(100, hud.chargeRatio * 100)}%` }}
                                />
                              </>
                            ) : (
                              <>
                                <div
                                  className="absolute top-0 bottom-0 bg-[#FEF08A]"
                                  style={{
                                    left: `${hud.ringTargetStart * 100}%`,
                                    width: `${(hud.ringTargetEnd - hud.ringTargetStart) * 100}%`,
                                  }}
                                />
                                <div
                                  className="absolute top-0 bottom-0 w-1.5 bg-[#EF4444]"
                                  style={{
                                    left: `${Math.min(97, hud.ringProgress * 100)}%`,
                                  }}
                                />
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    ) : (
                      /* Gestures-Only Compact Arena Prompt Plate */
                      <div className="command-deck-plate px-4 py-2 bg-[#FFF8EB] dark:bg-[#0F172A] text-[#18121E] dark:text-[#F8FAFC] min-w-[225px]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-sm leading-none">
                            {hud.phase === 'SPIN_READY'
                              ? 'GESTO: SEGURE / DESLIZE ↑'
                              : 'GESTO: TOQUE NA ARENA!'}
                          </span>
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#38BDF8] text-[#18121E] border border-[#18121E]">
                            GESTOS
                          </span>
                        </div>
                        <div className="mt-1.5 relative h-2 w-full rounded-full bg-[#18121E]/20 dark:bg-[#1E293B] overflow-hidden border border-[#18121E] dark:border-[#94A3B8]">
                          {hud.phase === 'SPIN_READY' ? (
                            <>
                              <div
                                className="absolute top-0 bottom-0 bg-[#10B981]/80"
                                style={{
                                  left: `${Math.max(20, (hud.bottleSweetSpot - 0.22) * 100)}%`,
                                  width: '44%',
                                }}
                              />
                              <div
                                className="h-full bg-[#EF4444]"
                                style={{ width: `${Math.min(100, hud.chargeRatio * 100)}%` }}
                              />
                            </>
                          ) : (
                            <>
                              <div
                                className="absolute top-0 bottom-0 bg-[#10B981]"
                                style={{
                                  left: `${hud.ringTargetStart * 100}%`,
                                  width: `${(hud.ringTargetEnd - hud.ringTargetStart) * 100}%`,
                                }}
                              />
                              <div
                                className="absolute top-0 bottom-0 w-1.5 bg-[#FBBF24]"
                                style={{
                                  left: `${Math.min(97, hud.ringProgress * 100)}%`,
                                }}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="command-deck-plate px-3.5 py-2 bg-[#FFF8EB]/95 dark:bg-[#0B1120]/95 text-[#18121E] dark:text-[#E2E8F0] flex items-center gap-2 min-w-[180px]">
                      <div className="w-7 h-7 rounded-lg bg-[#FBBF24] border-2 border-[#18121E] flex items-center justify-center shrink-0">
                        <RotateCcw className="w-3.5 h-3.5 text-[#18121E] animate-spin" />
                      </div>
                      <div className="text-left">
                        <div className="font-display text-xs leading-none">
                          ARENA ATIVA
                        </div>
                        <div className="text-[10px] opacity-75 font-semibold mt-0.5">
                          Aguardando jogada...
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Redesigned Visual UI System Skill Tiles (PAPER surface + Bottom Colored Category Pill) */}
                {controlFighter && (
                  <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-0.5">
                    {(['OFENSIVA', 'DEFENSIVA', 'TATICA'] as SkillCategory[]).map((cat) => {
                      const sId = controlFighter.equippedSkills[cat];
                      const sk = SKILLS[sId];
                      const canAfford = controlEnergy >= sk.energyCost;
                      const enabled = canAfford && isLocalHumanTurn(controlSlot);
                      const catTag =
                        cat === 'OFENSIVA' ? 'ATQ' : cat === 'DEFENSIVA' ? 'DEF' : 'TAT';
                      const pillBg =
                        cat === 'OFENSIVA'
                          ? 'bg-[#EF4444] text-white'
                          : cat === 'DEFENSIVA'
                          ? 'bg-[#38BDF8] text-[#18121E]'
                          : 'bg-[#10B981] text-white';

                      return (
                        <button
                          key={cat}
                          disabled={!enabled}
                          onClick={() => activateSkill(controlSlot, cat)}
                          className={`skill-cartridge rounded-xl px-2.5 py-1.5 text-center min-w-[84px] sm:min-w-[96px] flex flex-col justify-between gap-1 ${
                            enabled
                              ? 'bg-[#FFF8EB] dark:bg-[#0F172A] text-[#18121E] dark:text-[#F8FAFC] hover:bg-[#FEF3C7] dark:hover:bg-[#1E293B]'
                              : 'bg-[#E5D5B5]/85 dark:bg-[#05070B]/90 text-[#64748B] opacity-75 cursor-not-allowed'
                          }`}
                          title={`${sk.name}: ${sk.description}`}
                        >
                          <div className="font-mono-nums text-sm font-extrabold leading-none">
                            {sk.energyCost}
                          </div>
                          <div className="text-[9px] font-bold leading-tight truncate max-w-[82px] mx-auto">
                            {sk.name}
                          </div>
                          <div
                            className={`w-full py-0.5 rounded-md border border-[#18121E] font-display text-[10px] leading-none tracking-wider ${pillBg}`}
                          >
                            {catTag}
                          </div>
                        </button>
                      );
                    })}

                    <button
                      disabled={controlEnergy < 100 || !isLocalHumanTurn(controlSlot)}
                      onClick={() => activateSkill(controlSlot, 'SPECIAL')}
                      className={`skill-cartridge rounded-xl px-2.5 py-1.5 text-center min-w-[84px] sm:min-w-[96px] flex flex-col justify-between gap-1 ${
                        controlEnergy >= 100 && isLocalHumanTurn(controlSlot)
                          ? 'bg-[#FFF8EB] dark:bg-[#0F172A] text-[#18121E] dark:text-[#F8FAFC] hover:bg-[#FEF3C7]'
                          : 'bg-[#E5D5B5]/85 dark:bg-[#05070B]/90 text-[#64748B] opacity-75 cursor-not-allowed'
                      }`}
                      title="Disparar Especial de 100 Energia"
                    >
                      <div className="font-mono-nums text-sm font-extrabold leading-none">
                        100
                      </div>
                      <div className="text-[9px] font-bold leading-tight truncate max-w-[82px] mx-auto">
                        Especial
                      </div>
                      <div className="w-full py-0.5 rounded-md border border-[#18121E] bg-[#FBBF24] text-[#18121E] font-display text-[10px] leading-none tracking-wider">
                        ULT
                      </div>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* PRE-BATTLE PROVOCATIVE OPPONENT DIALOGUE */}
      {introDialogueOpen && hud.winner === 0 && (
        <div
          onClick={() => setIntroDialogueOpen(false)}
          className="absolute inset-0 z-30 bg-black/55 dark:bg-black/70 flex items-center justify-center p-4 cursor-pointer"
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 14 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="cartoon-outline-lg rounded-2xl bg-[#FFF8EB] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] p-4 sm:p-5 w-full max-w-lg flex items-center gap-4"
          >
            <div className="shrink-0 flex flex-col items-center gap-1">
              <div className="relative w-24 h-24 rounded-2xl border-[3px] border-[#111827] dark:border-[#94A3B8] bg-gradient-to-b from-[#FEF3C7] to-[#FBBF24]/55 dark:from-[#0F172A] dark:to-[#1E293B] flex items-center justify-center shadow-[0_3px_0_#111827]">
                <CharacterAvatar
                  charId={preDialogue.speakerCharId}
                  size={80}
                  className="drop-shadow-[0_2px_0_#111827]"
                />
                <div className="absolute -right-2 -bottom-2 pointer-events-none animate-loser-sway">
                  <ChibiCharacterSprite
                    charId={preDialogue.speakerCharId}
                    size={32}
                    facing={-1}
                    isMoving={true}
                  />
                </div>
              </div>
              {CHARACTERS[preDialogue.speakerCharId]?.isBossOnly && (
                <span className="px-2 py-0.5 rounded bg-[#EF4444] text-white border-[2px] border-[#111827] font-display text-[9px] tracking-wider uppercase">
                  Chefe Exclusivo
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#EA580C] dark:text-[#FB923C] truncate">
                    {preDialogue.subtitle}
                  </div>
                  <h3 className="font-display text-lg sm:text-xl leading-none truncate dark:text-[#FDE047]">
                    {preDialogue.speakerName}
                  </h3>
                  <div className="text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] truncate">
                    {CHARACTERS[preDialogue.speakerCharId]?.title}
                  </div>
                </div>
                <MessageSquareQuote className="w-5 h-5 text-[#D97706] dark:text-[#FDE047] shrink-0" />
              </div>

              <p className="rounded-xl border-2 border-[#111827] dark:border-[#94A3B8] bg-[#FEF3C7] dark:bg-[#0F172A] px-3 py-2 text-xs sm:text-sm font-bold italic text-[#1E293B] dark:text-[#F8FAFC] leading-snug">
                “{preDialogue.line}”
              </p>

              <div className="flex justify-end">
                <button
                  onClick={() => setIntroDialogueOpen(false)}
                  className="cartoon-btn px-3.5 py-1.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-display text-xs"
                >
                  Aceitar Desafio! [Espaço]
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* PAUSE MODAL */}
      {paused && hud.winner === 0 && (
        <div className="absolute inset-0 z-30 bg-black/70 dark:bg-black/85 flex items-center justify-center p-4">
          <div className="cartoon-outline-lg rounded-2xl bg-[#FFF8EB] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] p-5 w-full max-w-xs text-center space-y-3 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-xl dark:text-[#FDE047]">
              {isReplayMode ? 'Replay Pausado' : 'Duelo Pausado'}
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => setPaused(false)}
                className="cartoon-btn w-full py-2.5 rounded-xl bg-[#10B981] text-white font-display text-sm flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                <span>Continuar</span>
              </button>
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="cartoon-btn w-full py-2.5 rounded-xl bg-[#38BDF8] text-[#111827] font-display text-sm flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Controles, Tema & Áudio</span>
                </button>
              )}
              <button
                onClick={handleRestartMatch}
                className="cartoon-btn w-full py-2.5 rounded-xl bg-[#FBBF24] text-[#111827] font-display text-sm flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isReplayMode ? 'Reiniciar Replay' : 'Reiniciar Duelo'}</span>
              </button>
              <button
                onClick={onExit}
                className="cartoon-btn w-full py-2.5 rounded-xl bg-[#E2E8F0] dark:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] font-display text-sm flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{isReplayMode ? 'Sair do Replay' : 'Sair da Arena'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VICTORY / GAME OVER / REPLAY END MODAL + RELATÓRIO DE COMBATE */}
      {hud.winner !== 0 && (
        <div className="absolute inset-0 z-30 bg-black/75 dark:bg-black/85 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.86, opacity: 0, y: 18 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className="cartoon-outline-lg rounded-2xl bg-[#FFF8EB] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] p-4 sm:p-5 w-full max-w-md text-center space-y-2.5 max-h-[92vh] overflow-y-auto"
          >
            {/* Header Badge + Title */}
            <div className="flex items-center justify-center gap-2.5">
              <motion.div
                initial={{ rotate: -18, scale: 0.6 }}
                animate={{ rotate: [0, -8, 8, 0], scale: 1 }}
                transition={{ duration: 0.65, ease: 'easeOut' }}
                className={`w-10 h-10 rounded-xl border-2 border-[#111827] dark:border-[#94A3B8] flex items-center justify-center shrink-0 ${
                  hud.winner === 1 ? 'bg-[#FBBF24] text-[#111827]' : 'bg-[#EF4444] text-white'
                }`}
              >
                {postMatchTab === 'report' ? (
                  <BarChart3 className="w-5 h-5" />
                ) : isReplayMode ? (
                  <Film className="w-5 h-5" />
                ) : (
                  <Crown className="w-5 h-5" />
                )}
              </motion.div>

              <h2 className="font-display text-2xl leading-none dark:text-[#FDE047]">
                {postMatchTab === 'report'
                  ? 'Relatório de Combate'
                  : isReplayMode
                  ? 'Fim do Replay'
                  : config.mode === 'PVP_LOCAL'
                  ? `Jogador ${hud.winner} Venceu!`
                  : hud.winner === mySlot
                  ? 'Vitória no Carrollo!'
                  : 'Derrota na Arena!'}
              </h2>
            </div>

            {/* Segmented View Switcher: Celebração / Relatório de Combate */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl border-2 border-[#111827] dark:border-[#94A3B8] bg-[#EAD9B5] dark:bg-[#0F172A]">
              <button
                onClick={() => setPostMatchTab('summary')}
                className={`py-1.5 rounded-lg font-display text-xs flex items-center justify-center gap-1.5 transition-colors ${
                  postMatchTab === 'summary'
                    ? 'bg-[#FFF8EB] dark:bg-[#FDE047] text-[#111827] border-2 border-[#111827]'
                    : 'text-[#475569] dark:text-[#CBD5E1] hover:text-[#111827] dark:hover:text-white'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Resultado</span>
              </button>
              <button
                onClick={() => setPostMatchTab('report')}
                className={`py-1.5 rounded-lg font-display text-xs flex items-center justify-center gap-1.5 transition-colors ${
                  postMatchTab === 'report'
                    ? 'bg-[#38BDF8] text-[#111827] border-2 border-[#111827]'
                    : 'text-[#475569] dark:text-[#CBD5E1] hover:text-[#111827] dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Relatório de Combate</span>
              </button>
            </div>

            {postMatchTab === 'report' ? (
              <CombatReportView
                precisionPct={hud.matchStats.precisionPct}
                avgReactionMs={hud.matchStats.avgReactionMs}
                counterCount={hud.matchStats.counterCount}
                enemyStrikesFaced={hud.matchStats.enemyStrikesFaced}
                perfectCount={hud.matchStats.perfectCount}
                bottleUprights={hud.matchStats.bottleUprights}
                isDark={save.themeMode === 'dark_contrast'}
              />
            ) : (
              <>
                {/* Animated Victory Celebration Stage */}
                <div className="relative overflow-hidden rounded-2xl border-[2.5px] border-[#111827] dark:border-[#94A3B8] bg-gradient-to-b from-[#FEF3C7] via-[#FDE68A]/70 to-[#FBBF24]/35 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#05070B] px-4 pt-3 pb-2.5">
                  {/* Comic Starburst Halo Behind Champion */}
                  <svg
                    viewBox="0 0 120 120"
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 opacity-55 dark:opacity-45 animate-victory-halo"
                  >
                    <polygon
                      points="60,2 72,34 106,18 86,48 118,60 86,72 106,102 72,86 60,118 48,86 14,102 34,72 2,60 34,48 14,18 48,34"
                      fill={hud.winner === 1 ? '#FBBF24' : '#F97316'}
                      stroke="#111827"
                      strokeWidth="3"
                    />
                  </svg>

                  {/* Floating Comic Confetti Stars */}
                  <Star
                    className="pointer-events-none absolute left-6 top-3 w-4 h-4 text-[#F59E0B] fill-[#FDE047] animate-confetti-float"
                    style={{ animationDelay: '0s' }}
                  />
                  <Star
                    className="pointer-events-none absolute right-7 top-4 w-4 h-4 text-[#EF4444] fill-[#FB7185] animate-confetti-float"
                    style={{ animationDelay: '0.35s' }}
                  />
                  <Star
                    className="pointer-events-none absolute left-14 bottom-4 w-3.5 h-3.5 text-[#0284C7] fill-[#38BDF8] animate-confetti-float"
                    style={{ animationDelay: '0.7s' }}
                  />
                  <Star
                    className="pointer-events-none absolute right-14 bottom-5 w-3.5 h-3.5 text-[#059669] fill-[#34D399] animate-confetti-float"
                    style={{ animationDelay: '1.05s' }}
                  />

                  {/* Characters Stage: Defeated Rival Swaying + Champion Celebrating */}
                  <div className="relative z-10 flex items-end justify-center gap-5 min-h-[96px]">
                    <div className="flex flex-col items-center opacity-75 animate-loser-sway">
                      <ChibiCharacterSprite
                        charId={loserCharId}
                        size={46}
                        facing={1}
                        isMoving={false}
                      />
                      <span className="mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#111827]/75 text-[#CBD5E1]">
                        Derrotado
                      </span>
                    </div>

                    <div className="flex flex-col items-center">
                      <div className="animate-winner-celebrate drop-shadow-[0_4px_0_rgba(17,24,39,0.75)]">
                        <ChibiCharacterSprite
                          charId={winnerCharId}
                          size={74}
                          facing={-1}
                          isMoving={true}
                        />
                      </div>
                      <motion.span
                        initial={{ scale: 0.7, y: 6 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ delay: 0.15, type: 'spring', stiffness: 360, damping: 18 }}
                        className="mt-0.5 px-2.5 py-0.5 rounded-full bg-[#FBBF24] dark:bg-[#FDE047] text-[#111827] border-2 border-[#111827] font-display text-xs shadow-[0_2px_0_#111827]"
                      >
                        {winnerName} · CAMPEÃO!
                      </motion.span>
                    </div>
                  </div>
                </div>

                {!isReplayMode && config.storyLevel && hud.winner === 1 ? (
                  <p className="text-xs italic text-[#334155] dark:text-[#F8FAFC] bg-[#FEF3C7] dark:bg-[#0F172A] border-2 border-[#111827] dark:border-[#94A3B8] rounded-xl px-3 py-2">
                    “{config.storyLevel.victoryLine}”
                  </p>
                ) : (
                  hud.endQuip && (
                    <p className="text-xs italic text-[#334155] dark:text-[#F8FAFC] bg-[#FEF3C7] dark:bg-[#0F172A] border-2 border-[#111827] dark:border-[#94A3B8] rounded-xl px-3 py-2">
                      “{hud.endQuip}”
                    </p>
                  )
                )}

                <div className="text-xs font-bold text-[#475569] dark:text-[#CBD5E1] font-mono-nums">
                  Pontuação: {hud.score} · Melhor Combo: {hud.maxCombo}x
                  {config.mode === 'ARCADE' && ` · Onda ${config.arcadeWave || 1}`}
                  {!isReplayMode &&
                    ` · +${
                      hud.winner === 1
                        ? config.mode === 'STORY'
                          ? config.storyLevel?.isBoss
                            ? 60
                            : 25
                          : config.mode === 'ARCADE'
                          ? 20
                          : 15
                        : 5
                    } Rolhas`}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
                  <div className="rounded-xl bg-[#FEF3C7] dark:bg-[#0F172A] border-2 border-[#111827] dark:border-[#94A3B8] px-2.5 py-1.5">
                    <div className="text-[10px] font-bold text-[#92400E] dark:text-[#FDE047]">
                      Dano Causado
                    </div>
                    <div className="font-mono-nums font-extrabold text-sm text-[#111827] dark:text-[#F8FAFC]">
                      {hud.matchStats.damageDealt}
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#ECFDF5] dark:bg-[#0F172A] border-2 border-[#111827] dark:border-[#94A3B8] px-2.5 py-1.5">
                    <div className="text-[10px] font-bold text-[#065F46] dark:text-[#34D399]">
                      Perfeitos
                    </div>
                    <div className="font-mono-nums font-extrabold text-sm text-[#111827] dark:text-[#F8FAFC]">
                      {hud.matchStats.perfectCount}
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#E0F2FE] dark:bg-[#0F172A] border-2 border-[#111827] dark:border-[#94A3B8] px-2.5 py-1.5">
                    <div className="text-[10px] font-bold text-[#075985] dark:text-[#38BDF8]">
                      Contras
                    </div>
                    <div className="font-mono-nums font-extrabold text-sm text-[#111827] dark:text-[#F8FAFC]">
                      {hud.matchStats.counterCount}
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#F3E8FF] dark:bg-[#0F172A] border-2 border-[#111827] dark:border-[#94A3B8] px-2.5 py-1.5">
                    <div className="text-[10px] font-bold text-[#6B21A8] dark:text-[#C084FC]">
                      Garrafas em Pé
                    </div>
                    <div className="font-mono-nums font-extrabold text-sm text-[#111827] dark:text-[#F8FAFC]">
                      {hud.matchStats.bottleUprights}
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-col gap-2 pt-1">
              {!isReplayMode && lastSavedReplayRef.current && onWatchReplay && (
                <button
                  onClick={() => onWatchReplay(lastSavedReplayRef.current!)}
                  className="cartoon-btn w-full py-2 rounded-xl bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#111827] font-display text-xs flex items-center justify-center gap-2"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Assistir Replay do Duelo</span>
                </button>
              )}

              <div className="flex flex-row gap-2">
                {!isReplayMode && hud.winner === 1 && onNextStage && (
                  <button
                    onClick={onNextStage}
                    className="cartoon-btn flex-1 py-2.5 rounded-xl bg-[#10B981] text-white font-display text-xs"
                  >
                    {config.mode === 'ARCADE' ? 'Próxima Onda' : 'Avançar'}
                  </button>
                )}

                <button
                  onClick={() => setCombatReportOpen(true)}
                  className="cartoon-btn py-2.5 px-3 rounded-xl bg-[#38BDF8] text-[#111827] font-display text-xs flex items-center justify-center gap-1"
                  title="Abrir Relatório de Combate"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Gráfico</span>
                </button>

                <button
                  onClick={handleRestartMatch}
                  className="cartoon-btn flex-1 py-2.5 rounded-xl bg-[#FBBF24] text-[#111827] font-display text-xs"
                >
                  {isReplayMode ? 'Assistir Novamente' : 'Jogar Novamente'}
                </button>

                <button
                  onClick={onExit}
                  className="cartoon-btn flex-1 py-2.5 rounded-xl bg-[#E2E8F0] dark:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] font-display text-xs"
                >
                  Voltar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* STANDALONE COMBAT REPORT MODAL (auto-opens after post-battle celebration) */}
      <CombatReportModal
        isOpen={hud.winner !== 0 && combatReportOpen}
        winnerName={winnerName}
        playerWon={hud.winner === mySlot}
        isReplayMode={isReplayMode}
        precisionPct={hud.matchStats.precisionPct}
        avgReactionMs={hud.matchStats.avgReactionMs}
        counterCount={hud.matchStats.counterCount}
        enemyStrikesFaced={hud.matchStats.enemyStrikesFaced}
        perfectCount={hud.matchStats.perfectCount}
        bottleUprights={hud.matchStats.bottleUprights}
        isDark={save.themeMode === 'dark_contrast'}
        onClose={() => setCombatReportOpen(false)}
        onRestart={handleRestartMatch}
        onExit={onExit}
      />
    </motion.div>
  );
};
