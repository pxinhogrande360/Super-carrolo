import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  Coins,
  Crown,
  Lock,
  ScrollText,
  ShoppingBag,
  Sparkles,
  Swords,
  X,
} from 'lucide-react';
import { ALL_STORY_LEVELS, CHARACTERS, STORY_PHASES } from '../data/gameData';
import {
  OVERWORLD_NPCS,
  OVERWORLD_SHOPS,
  SIDE_QUESTS,
  SIDE_QUEST_LIST,
  getSideQuestProgress,
} from '../data/overworldData';
import {
  OverworldNpcDef,
  OverworldShopDef,
  SaveData,
  ShopItemDef,
  StoryLevel,
} from '../types/game';
import { CharacterAvatar } from './CharacterAvatar';
import { ChibiCharacterSprite } from './ChibiCharacterSprite';

interface OverworldMapProps {
  save: SaveData;
  onBack: () => void;
  onOpenSkills: () => void;
  onEnterLevel: (level: StoryLevel, forceTutorial?: boolean) => void;
  onAcceptQuest: (questId: string) => void;
  onClaimQuest: (questId: string) => void;
  onBuyShopItem: (item: ShopItemDef) => void;
}

type FocusTarget =
  | { kind: 'LEVEL'; level: StoryLevel }
  | { kind: 'NPC'; npc: OverworldNpcDef }
  | { kind: 'SHOP'; shop: OverworldShopDef };

const DISTRICT_LABELS: { phaseIndex: number; title: string; x: number; y: number; color: string }[] = [
  { phaseIndex: 0, title: '1. Cais do Porto', x: 17, y: 26, color: '#0284C7' },
  { phaseIndex: 1, title: '2. Praça da Feira', x: 46, y: 45, color: '#EA580C' },
  { phaseIndex: 2, title: '3. Telhados', x: 80, y: 47, color: '#059669' },
  { phaseIndex: 3, title: '4. Estação Central', x: 46, y: 16, color: '#475569' },
  { phaseIndex: 4, title: '5. Castelo Real', x: 83, y: 7, color: '#991B1B' },
];

export const OverworldMap: React.FC<OverworldMapProps> = ({
  save,
  onBack,
  onOpenSkills,
  onEnterLevel,
  onAcceptQuest,
  onClaimQuest,
  onBuyShopItem,
}) => {
  const unlockedIds = useMemo(() => {
    const set = new Set<string>(['0-0']);
    for (let i = 0; i < ALL_STORY_LEVELS.length - 1; i++) {
      if (save.completedLevels.includes(ALL_STORY_LEVELS[i].id)) {
        set.add(ALL_STORY_LEVELS[i + 1].id);
      }
    }
    return set;
  }, [save.completedLevels]);

  const initialLevel = useMemo(() => {
    const uncompleted = ALL_STORY_LEVELS.find(
      (l) => unlockedIds.has(l.id) && !save.completedLevels.includes(l.id)
    );
    return uncompleted || ALL_STORY_LEVELS[0];
  }, [unlockedIds, save.completedLevels]);

  const [playerPos, setPlayerPos] = useState({ x: initialLevel.mapX, y: initialLevel.mapY });
  const [targetPos, setTargetPos] = useState<{ x: number; y: number } | null>(null);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [isMoving, setIsMoving] = useState(false);
  const [focusTarget, setFocusTarget] = useState<FocusTarget>({
    kind: 'LEVEL',
    level: initialLevel,
  });
  const [activePhaseTab, setActivePhaseTab] = useState<number>(initialLevel.phaseIndex);
  const [questsOpen, setQuestsOpen] = useState(false);

  const keysRef = useRef<Record<string, boolean>>({});
  const posRef = useRef({ x: initialLevel.mapX, y: initialLevel.mapY });
  const targetRef = useRef<{ x: number; y: number } | null>(null);
  const facingRef = useRef<1 | -1>(1);
  const movingRef = useRef(false);
  const focusRef = useRef<FocusTarget>(focusTarget);
  const unlockedRef = useRef(unlockedIds);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    focusRef.current = focusTarget;
  }, [focusTarget]);

  useEffect(() => {
    unlockedRef.current = unlockedIds;
  }, [unlockedIds]);

  const updateTarget = (next: { x: number; y: number } | null) => {
    targetRef.current = next;
    setTargetPos(next);
  };

  // Smooth Cuphead-style free-roam movement loop
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if ((e.key === 'Enter' || e.key === ' ') && focusRef.current.kind === 'LEVEL') {
        const lvl = focusRef.current.level;
        if (unlockedRef.current.has(lvl.id)) {
          e.preventDefault();
          onEnterLevel(lvl);
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    const onBlur = () => {
      keysRef.current = {};
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    let rafId = 0;
    let last = performance.now();

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      let dx = 0;
      let dy = 0;
      const k = keysRef.current;
      if (k['w'] || k['arrowup']) dy -= 1;
      if (k['s'] || k['arrowdown']) dy += 1;
      if (k['a'] || k['arrowleft']) dx -= 1;
      if (k['d'] || k['arrowright']) dx += 1;

      const cur = posRef.current;
      let nx = cur.x;
      let ny = cur.y;
      let moved = false;
      let stepDeltaX = 0;
      const speed = 26; // % per second

      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        stepDeltaX = (dx / len) * speed * dt;
        nx += stepDeltaX;
        ny += (dy / len) * speed * dt;
        moved = true;
        if (targetRef.current) {
          targetRef.current = null;
          setTargetPos(null);
        }
      } else if (targetRef.current) {
        const tdx = targetRef.current.x - cur.x;
        const tdy = targetRef.current.y - cur.y;
        const dist = Math.hypot(tdx, tdy);
        if (dist < 1.1) {
          nx = targetRef.current.x;
          ny = targetRef.current.y;
          targetRef.current = null;
          setTargetPos(null);
        } else {
          stepDeltaX = (tdx / dist) * speed * 1.35 * dt;
          nx += stepDeltaX;
          ny += (tdy / dist) * speed * 1.35 * dt;
          moved = true;
        }
      }

      nx = Math.max(5, Math.min(95, nx));
      ny = Math.max(8, Math.min(92, ny));

      if (Math.abs(stepDeltaX) > 0.01) {
        const nextFacing: 1 | -1 = stepDeltaX < 0 ? -1 : 1;
        if (nextFacing !== facingRef.current) {
          facingRef.current = nextFacing;
          setFacing(nextFacing);
        }
      }

      if (moved !== movingRef.current) {
        movingRef.current = moved;
        setIsMoving(moved);
      }

      if (nx !== cur.x || ny !== cur.y) {
        posRef.current = { x: nx, y: ny };
        setPlayerPos({ x: nx, y: ny });

        // Check nearest interactive point (Level, NPC, or Shop)
        let bestDist = 6.2;
        let nextFocus: FocusTarget | null = null;
        let nextPhase = -1;

        for (const lvl of ALL_STORY_LEVELS) {
          const d = Math.hypot(lvl.mapX - nx, lvl.mapY - ny);
          if (d < bestDist) {
            bestDist = d;
            nextFocus = { kind: 'LEVEL', level: lvl };
            nextPhase = lvl.phaseIndex;
          }
        }
        for (const npc of OVERWORLD_NPCS) {
          const d = Math.hypot(npc.mapX - nx, npc.mapY - ny);
          if (d < bestDist) {
            bestDist = d;
            nextFocus = { kind: 'NPC', npc };
            nextPhase = npc.phaseIndex;
          }
        }
        for (const shop of OVERWORLD_SHOPS) {
          const d = Math.hypot(shop.mapX - nx, shop.mapY - ny);
          if (d < bestDist) {
            bestDist = d;
            nextFocus = { kind: 'SHOP', shop };
            nextPhase = shop.phaseIndex;
          }
        }

        if (nextFocus) {
          const prevF = focusRef.current;
          const changed =
            prevF.kind !== nextFocus.kind ||
            (prevF.kind === 'LEVEL' &&
              nextFocus.kind === 'LEVEL' &&
              prevF.level.id !== nextFocus.level.id) ||
            (prevF.kind === 'NPC' &&
              nextFocus.kind === 'NPC' &&
              prevF.npc.id !== nextFocus.npc.id) ||
            (prevF.kind === 'SHOP' &&
              nextFocus.kind === 'SHOP' &&
              prevF.shop.id !== nextFocus.shop.id);
          if (changed) {
            focusRef.current = nextFocus;
            setFocusTarget(nextFocus);
            if (nextPhase >= 0) setActivePhaseTab(nextPhase);
          }
        }
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [onEnterLevel]);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = mapContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    updateTarget({ x: xPct, y: yPct });
  };

  const handleSelectLevel = (e: React.MouseEvent, lvl: StoryLevel) => {
    e.stopPropagation();
    const next: FocusTarget = { kind: 'LEVEL', level: lvl };
    focusRef.current = next;
    setFocusTarget(next);
    setActivePhaseTab(lvl.phaseIndex);
    updateTarget({ x: lvl.mapX, y: lvl.mapY });
  };

  const handleSelectNpc = (e: React.MouseEvent, npc: OverworldNpcDef) => {
    e.stopPropagation();
    const next: FocusTarget = { kind: 'NPC', npc };
    focusRef.current = next;
    setFocusTarget(next);
    setActivePhaseTab(npc.phaseIndex);
    updateTarget({ x: npc.mapX, y: npc.mapY });
  };

  const handleSelectShop = (e: React.MouseEvent, shop: OverworldShopDef) => {
    e.stopPropagation();
    const next: FocusTarget = { kind: 'SHOP', shop };
    focusRef.current = next;
    setFocusTarget(next);
    setActivePhaseTab(shop.phaseIndex);
    updateTarget({ x: shop.mapX, y: shop.mapY });
  };

  const questSummary = useMemo(() => {
    let claimedCount = 0;
    let readyCount = 0;
    for (const q of SIDE_QUEST_LIST) {
      const st = save.sideQuests[q.id];
      const prog = getSideQuestProgress(save, q);
      if (st?.claimed) claimedCount += 1;
      else if (prog >= q.target) readyCount += 1;
    }
    return { claimedCount, readyCount, total: SIDE_QUEST_LIST.length };
  }, [save]);

  const playerChar = CHARACTERS[save.selectedCharId] || CHARACTERS.leo;
  const activePhase = STORY_PHASES[activePhaseTab];

  // Derived panel data
  const focusedLevel = focusTarget.kind === 'LEVEL' ? focusTarget.level : null;
  const isLevelUnlocked = focusedLevel ? unlockedIds.has(focusedLevel.id) : false;
  const isLevelCompleted = focusedLevel ? save.completedLevels.includes(focusedLevel.id) : false;
  const levelOpponent = focusedLevel
    ? CHARACTERS[focusedLevel.opponentCharId] || CHARACTERS.leo
    : null;

  const focusedNpc = focusTarget.kind === 'NPC' ? focusTarget.npc : null;
  const npcQuest = focusedNpc ? SIDE_QUESTS[focusedNpc.questId] : null;
  const npcQuestState = npcQuest ? save.sideQuests[npcQuest.id] : undefined;
  const npcQuestProgress = npcQuest ? getSideQuestProgress(save, npcQuest) : 0;
  const npcQuestDone = npcQuest ? npcQuestProgress >= npcQuest.target : false;

  const focusedShop = focusTarget.kind === 'SHOP' ? focusTarget.shop : null;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#221A2B] dark:bg-[#05070B] flex flex-col">
      {/* Top Compact Bar */}
      <div className="relative z-20 flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#18121E]/95 dark:bg-[#030509]/98 border-b-[3px] border-[#111827] dark:border-[#94A3B8]">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBack}
            className="cartoon-btn px-3 py-1.5 rounded-xl bg-[#FFF8EB] dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] font-bold text-sm flex items-center gap-1.5 whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Início</span>
          </button>
          <div className="min-w-0">
            <h1 className="font-display font-extrabold text-sm sm:text-lg text-[#FDE68A] dark:text-[#FDE047] leading-tight truncate">
              Cidade de Karrolo
            </h1>
            <p className="text-xs text-[#E5D5B5]/80 dark:text-[#CBD5E1] hidden md:block">
              Explore NPCs, lojas e duelos · {save.completedLevels.length}/30 vitórias
            </p>
          </div>
        </div>

        {/* Phase Quick-Jump Tabs */}
        <div className="hidden xl:flex items-center gap-1.5">
          {STORY_PHASES.map((phase) => {
            const active = phase.index === activePhaseTab;
            return (
              <button
                key={phase.index}
                onClick={() => {
                  setActivePhaseTab(phase.index);
                  updateTarget({ x: phase.hubX, y: phase.hubY });
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border-2 border-[#111827] dark:border-[#94A3B8] transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#FBBF24] dark:bg-[#FDE047] text-[#111827]'
                    : 'bg-[#2E2438] dark:bg-[#0F172A] text-[#FFF8EB] dark:text-[#F8FAFC] hover:bg-[#3E314B] dark:hover:bg-[#1E293B]'
                }`}
              >
                Fase {phase.index + 1}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Rolhas Douradas Balance */}
          <div
            title="Rolhas Douradas para gastar nas lojas do mapa"
            className="px-2.5 py-1.5 rounded-xl bg-[#2E2438] dark:bg-[#0F172A] border-2 border-[#111827] dark:border-[#94A3B8] text-[#FDE68A] dark:text-[#FDE047] font-mono-nums font-extrabold text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap"
          >
            <Coins className="w-4 h-4 text-[#FBBF24] dark:text-[#FDE047]" />
            <span>{save.coins}</span>
          </div>

          <button
            onClick={() => setQuestsOpen((v) => !v)}
            className="cartoon-btn relative px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#A7F3D0] text-[#111827] font-bold text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap"
          >
            <ScrollText className="w-4 h-4" />
            <span className="hidden sm:inline">Missões</span>
            <span className="font-mono-nums text-xs bg-[#111827] text-[#FFF8EB] px-1.5 py-0.5 rounded-md">
              {questSummary.claimedCount}/{questSummary.total}
            </span>
            {questSummary.readyCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#EF4444] text-white border-2 border-[#111827] font-mono-nums text-[10px] font-black flex items-center justify-center">
                {questSummary.readyCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onEnterLevel(ALL_STORY_LEVELS[0], true)}
            className="cartoon-btn px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#38BDF8] text-[#111827] font-bold text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Tutorial</span>
          </button>

          <button
            onClick={onOpenSkills}
            className="cartoon-btn px-3 py-1.5 rounded-xl bg-[#FBBF24] text-[#111827] font-bold text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden md:inline">Árvore & Atributos</span>
            <span className="md:hidden">Skills</span>
          </button>
        </div>
      </div>

      {/* Interactive Cuphead-style Overworld Map */}
      <div
        ref={mapContainerRef}
        onClick={handleMapClick}
        className="relative flex-1 overflow-hidden cursor-crosshair"
      >
        <img
          src="./src/assets/images/overworld_city_map_1795256858631.jpg"
          alt="Mapa da Cidade de Super Carrollo"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none dark:brightness-75 dark:contrast-110 transition-all"
        />

        {/* Subtle warm comic vignette for contrast */}
        <div
          className="absolute inset-0 pointer-events-none dark:bg-[#03050A]/25"
          style={{
            background:
              'radial-gradient(circle at 50% 45%, transparent 55%, rgba(17, 24, 39, 0.34) 100%)',
          }}
        />

        {/* Double-Layered Comic Road Paths + NPC/Shop Connector Trails */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {/* Phase-to-Phase Bridge Trails */}
          {STORY_PHASES.slice(0, -1).map((phase, idx) => {
            const bossLvl = phase.levels[phase.levels.length - 1];
            const nextFirst = STORY_PHASES[idx + 1].levels[0];
            return (
              <g key={`bridge-${idx}`}>
                <line
                  x1={bossLvl.mapX}
                  y1={bossLvl.mapY}
                  x2={nextFirst.mapX}
                  y2={nextFirst.mapY}
                  stroke="#111827"
                  strokeWidth="0.9"
                  strokeDasharray="1.8 1.4"
                  opacity="0.45"
                />
              </g>
            );
          })}

          {/* Main Phase Roads */}
          {STORY_PHASES.map((phase) => {
            const pts = phase.levels.map((l) => `${l.mapX},${l.mapY}`).join(' ');
            return (
              <g key={phase.index}>
                <polyline
                  points={pts}
                  fill="none"
                  stroke="#111827"
                  strokeWidth="1.45"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.78"
                />
                <polyline
                  points={pts}
                  fill="none"
                  stroke="#FDE68A"
                  strokeWidth="0.65"
                  strokeDasharray="1.6 1.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.92"
                />
              </g>
            );
          })}

          {/* Connectors to NPCs & Shops */}
          {OVERWORLD_NPCS.map((npc) => {
            const anchor = STORY_PHASES[npc.phaseIndex].levels[1];
            return (
              <line
                key={`trail-${npc.id}`}
                x1={npc.mapX}
                y1={npc.mapY}
                x2={anchor.mapX}
                y2={anchor.mapY}
                stroke="#10B981"
                strokeWidth="0.45"
                strokeDasharray="0.9 0.9"
                opacity="0.75"
              />
            );
          })}

          {OVERWORLD_SHOPS.map((shop) => {
            const anchor = STORY_PHASES[shop.phaseIndex].levels[2];
            return (
              <line
                key={`trail-${shop.id}`}
                x1={shop.mapX}
                y1={shop.mapY}
                x2={anchor.mapX}
                y2={anchor.mapY}
                stroke="#F59E0B"
                strokeWidth="0.5"
                strokeDasharray="1 0.8"
                opacity="0.8"
              />
            );
          })}
        </svg>

        {/* District Banners */}
        {DISTRICT_LABELS.map((d) => (
          <div
            key={d.phaseIndex}
            style={{ left: `${d.x}%`, top: `${d.y}%`, backgroundColor: d.color }}
            className="hidden sm:flex absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none px-2.5 py-0.5 rounded-lg border-2 border-[#111827] shadow-[0_2px_0_#111827] text-white font-display font-extrabold text-[11px] tracking-wide whitespace-nowrap z-0"
          >
            {d.title}
          </div>
        ))}

        {/* Click Walk Target Indicator */}
        {targetPos && (
          <div
            style={{ left: `${targetPos.x}%`, top: `${targetPos.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"
          >
            <div className="w-7 h-7 rounded-full border-[3px] border-dashed border-[#FDE68A] bg-[#FBBF24]/25 animate-spin" />
          </div>
        )}

        {/* 30 Level Nodes across 5 Phases */}
        {ALL_STORY_LEVELS.map((lvl) => {
          const unlocked = unlockedIds.has(lvl.id);
          const completed = save.completedLevels.includes(lvl.id);
          const isCurrent = focusTarget.kind === 'LEVEL' && focusTarget.level.id === lvl.id;

          return (
            <button
              key={lvl.id}
              onClick={(e) => handleSelectLevel(e, lvl)}
              style={{ left: `${lvl.mapX}%`, top: `${lvl.mapY}%` }}
              title={lvl.name}
              className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full border-[3px] border-[#111827] transition-transform shadow-[0_3px_0_#111827] ${
                lvl.isBoss ? 'w-11 h-11 sm:w-12 sm:h-12' : 'w-8 h-8 sm:w-9 sm:h-9'
              } ${
                isCurrent ? 'scale-125 ring-4 ring-[#FDE68A] z-10' : 'hover:scale-110'
              } ${
                completed
                  ? 'bg-[#10B981] text-white'
                  : unlocked
                  ? lvl.isBoss
                    ? 'bg-[#EF4444] text-white'
                    : 'bg-[#FBBF24] text-[#111827]'
                  : 'bg-[#475569] text-[#CBD5E1] opacity-90'
              }`}
            >
              {completed ? (
                <Check className="w-4 h-4 stroke-[3]" />
              ) : !unlocked ? (
                <Lock className="w-3.5 h-3.5" />
              ) : lvl.isBoss ? (
                <Crown className="w-5 h-5" />
              ) : (
                <span className="font-mono-nums text-xs font-extrabold">
                  {lvl.phaseIndex + 1}-{lvl.levelIndex + 1}
                </span>
              )}
            </button>
          );
        })}

        {/* Interactive NPCs with Mini Chibi Sprites & Side Quest Badges */}
        {OVERWORLD_NPCS.map((npc) => {
          const quest = SIDE_QUESTS[npc.questId];
          const state = quest ? save.sideQuests[quest.id] : undefined;
          const progress = quest ? getSideQuestProgress(save, quest) : 0;
          const readyToClaim = Boolean(quest && !state?.claimed && progress >= quest.target);
          const isClaimed = Boolean(state?.claimed);
          const isSelected = focusTarget.kind === 'NPC' && focusTarget.npc.id === npc.id;

          return (
            <button
              key={npc.id}
              onClick={(e) => handleSelectNpc(e, npc)}
              style={{ left: `${npc.mapX}%`, top: `${npc.mapY}%` }}
              title={`${npc.name} — ${npc.role}`}
              className={`group absolute -translate-x-1/2 -translate-y-2/3 flex flex-col items-center transition-transform ${
                isSelected ? 'scale-115 z-10' : 'hover:scale-110'
              }`}
            >
              {/* Quest Status Callout */}
              <span
                className={`-mb-1 px-1.5 py-0.5 rounded-md border-2 border-[#111827] font-display font-black text-[10px] leading-none shadow-[0_2px_0_#111827] ${
                  isClaimed
                    ? 'bg-[#10B981] text-white'
                    : readyToClaim
                    ? 'bg-[#EF4444] text-white'
                    : state?.accepted
                    ? 'bg-[#38BDF8] text-[#111827]'
                    : 'bg-[#FDE047] text-[#111827]'
                }`}
              >
                {isClaimed ? '✓' : readyToClaim ? '!' : state?.accepted ? '?' : '!'}
              </span>

              <div
                className={`rounded-2xl transition-all ${
                  isSelected ? 'drop-shadow-[0_0_8px_rgba(253,230,138,0.95)]' : ''
                }`}
              >
                <ChibiCharacterSprite variant={npc.sprite} size={44} />
              </div>

              <span className="mt-0.5 px-1.5 py-0.5 rounded bg-[#111827]/90 text-[#FFF8EB] text-[10px] font-bold leading-none whitespace-nowrap border border-[#FDE68A]/50">
                {npc.name.split(' ')[0]}
              </span>
            </button>
          );
        })}

        {/* Interactive Shops (Locais de Venda) */}
        {OVERWORLD_SHOPS.map((shop) => {
          const isSelected = focusTarget.kind === 'SHOP' && focusTarget.shop.id === shop.id;

          return (
            <button
              key={shop.id}
              onClick={(e) => handleSelectShop(e, shop)}
              style={{ left: `${shop.mapX}%`, top: `${shop.mapY}%` }}
              title={shop.name}
              className={`absolute -translate-x-1/2 -translate-y-2/3 flex flex-col items-center transition-transform ${
                isSelected ? 'scale-115 z-10' : 'hover:scale-110'
              }`}
            >
              {/* Striped Stall Awning */}
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-t-lg border-2 border-[#111827] text-white font-display font-extrabold text-[10px] shadow-[0_2px_0_#111827]"
                style={{
                  backgroundImage: `repeating-linear-gradient(90deg, ${shop.accentColor} 0 8px, #FFF8EB 8px 14px)`,
                }}
              >
                <span className="bg-[#111827]/85 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <ShoppingBag className="w-2.5 h-2.5 text-[#FBBF24]" />
                  <span>LOJA</span>
                </span>
              </div>

              <div
                className={`bg-[#FFF8EB]/90 border-x-2 border-b-2 border-[#111827] rounded-b-xl px-1.5 pt-0.5 pb-1 shadow-[0_3px_0_#111827] ${
                  isSelected ? 'ring-4 ring-[#FDE68A]' : ''
                }`}
              >
                <ChibiCharacterSprite variant={shop.sprite} size={36} />
              </div>

              <span className="mt-0.5 px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#111827] border-2 border-[#111827] text-[10px] font-extrabold leading-none whitespace-nowrap">
                {shop.name}
              </span>
            </button>
          );
        })}

        {/* Walkable Protagonist Mini Chibi Sprite */}
        <div
          style={{ left: `${playerPos.x}%`, top: `${playerPos.y}%` }}
          className="absolute -translate-x-1/2 -translate-y-[82%] pointer-events-none z-20"
        >
          <div className="relative flex flex-col items-center">
            <div className="drop-shadow-[0_3px_0_#111827]">
              <ChibiCharacterSprite
                charId={save.selectedCharId}
                facing={facing}
                isMoving={isMoving}
                size={60}
              />
            </div>
            <span className="-mt-1 px-2 py-0.5 rounded-md bg-[#FBBF24] text-[#111827] border-2 border-[#111827] font-display font-black text-[10px] leading-none shadow-[0_2px_0_#111827] whitespace-nowrap">
              {playerChar.name}
            </span>
          </div>
        </div>

        {/* Mobile Touch D-Pad (bottom-left) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-3 bottom-3 z-20 grid grid-cols-3 gap-1 w-32 h-32 sm:hidden"
        >
          <div />
          <button
            onTouchStart={() => (keysRef.current['arrowup'] = true)}
            onTouchEnd={() => (keysRef.current['arrowup'] = false)}
            className="cartoon-btn rounded-lg bg-[#FFF8EB]/90 text-[#111827] font-bold flex items-center justify-center"
          >
            ▲
          </button>
          <div />
          <button
            onTouchStart={() => (keysRef.current['arrowleft'] = true)}
            onTouchEnd={() => (keysRef.current['arrowleft'] = false)}
            className="cartoon-btn rounded-lg bg-[#FFF8EB]/90 text-[#111827] font-bold flex items-center justify-center"
          >
            ◀
          </button>
          <div />
          <button
            onTouchStart={() => (keysRef.current['arrowright'] = true)}
            onTouchEnd={() => (keysRef.current['arrowright'] = false)}
            className="cartoon-btn rounded-lg bg-[#FFF8EB]/90 text-[#111827] font-bold flex items-center justify-center"
          >
            ▶
          </button>
          <div />
          <button
            onTouchStart={() => (keysRef.current['arrowdown'] = true)}
            onTouchEnd={() => (keysRef.current['arrowdown'] = false)}
            className="cartoon-btn rounded-lg bg-[#FFF8EB]/90 text-[#111827] font-bold flex items-center justify-center"
          >
            ▼
          </button>
          <div />
        </div>

        {/* Context Interaction Card (bottom-right): Level, NPC Quest, or Shop */}
        {focusedLevel && levelOpponent && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-3 bottom-3 sm:right-5 sm:bottom-5 z-20 w-[calc(100%-9.5rem)] sm:w-[380px] cartoon-outline-lg rounded-2xl bg-[#FFF8EB] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] p-4"
          >
            <div className="flex items-start gap-3">
              <CharacterAvatar charId={levelOpponent.id} size={56} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#B45309] dark:text-[#FDE047] truncate">
                  {activePhase.name} ·{' '}
                  {focusedLevel.isBoss
                    ? levelOpponent.isBossOnly
                      ? 'CHEFE EXCLUSIVO'
                      : 'CHEFE DO DISTRITO'
                    : 'Capanga'}
                </div>
                <h2 className="font-display font-extrabold text-lg leading-tight truncate">
                  {focusedLevel.name}
                </h2>
                <div className="text-xs font-semibold text-[#475569] dark:text-[#CBD5E1] mt-0.5">
                  Adversário: {focusedLevel.opponentName} · Dificuldade {focusedLevel.difficulty}/10
                </div>
              </div>
            </div>

            <p className="mt-2.5 text-xs sm:text-sm italic text-[#334155] dark:text-[#F8FAFC] bg-[#FEF3C7] dark:bg-[#0F172A] border-2 border-[#111827] dark:border-[#94A3B8] rounded-xl px-3 py-2">
              “{focusedLevel.introLine}”
            </p>

            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#0F766E] dark:text-[#34D399]">
                {isLevelCompleted
                  ? 'Concluído · +Rolhas por revanches'
                  : `Recompensa: +${focusedLevel.rewardPoints} pt(s) + ${
                      focusedLevel.isBoss ? 60 : 25
                    } Rolhas`}
              </span>

              <button
                disabled={!isLevelUnlocked}
                onClick={() => onEnterLevel(focusedLevel)}
                className={`cartoon-btn px-4 py-2 rounded-xl font-display font-extrabold text-sm flex items-center gap-2 whitespace-nowrap ${
                  isLevelUnlocked
                    ? 'bg-[#EF4444] hover:bg-[#DC2626] text-white'
                    : 'bg-[#CBD5E1] dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] cursor-not-allowed'
                }`}
              >
                <Swords className="w-4 h-4" />
                <span>{isLevelUnlocked ? 'Duelar Agora' : 'Bloqueado'}</span>
              </button>
            </div>
          </div>
        )}

        {focusedNpc && npcQuest && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-3 bottom-3 sm:right-5 sm:bottom-5 z-20 w-[calc(100%-9.5rem)] sm:w-[395px] cartoon-outline-lg rounded-2xl bg-[#FFF8EB] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] p-4"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-[#FEF3C7] dark:bg-[#1E293B] border-2 border-[#111827] dark:border-[#94A3B8] px-1.5 pt-1">
                <ChibiCharacterSprite variant={focusedNpc.sprite} size={52} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#0F766E] dark:text-[#34D399] truncate">
                  NPC · {focusedNpc.role}
                </div>
                <h2 className="font-display font-extrabold text-lg leading-tight truncate">
                  {focusedNpc.name}
                </h2>
                <p className="mt-1 text-xs italic text-[#334155] dark:text-[#CBD5E1]">
                  “{npcQuestState?.claimed ? focusedNpc.completedLine : focusedNpc.greeting}”
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-[#ECFDF5] dark:bg-[#0F172A] border-2 border-[#111827] dark:border-[#94A3B8] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display font-extrabold text-sm text-[#065F46] dark:text-[#34D399]">
                  Missão: {npcQuest.title}
                </span>
                <span className="font-mono-nums text-xs font-extrabold text-[#111827] dark:text-[#FDE047]">
                  {Math.min(npcQuestProgress, npcQuest.target)}/{npcQuest.target}
                </span>
              </div>
              <p className="text-xs text-[#334155] dark:text-[#E2E8F0] mt-1">{npcQuest.description}</p>
              <div className="mt-2 h-2.5 w-full rounded-full bg-[#D1FAE5] dark:bg-[#1E293B] border-2 border-[#111827] dark:border-[#94A3B8] overflow-hidden">
                <div
                  className="h-full bg-[#10B981] transition-all"
                  style={{
                    width: `${Math.min(100, (npcQuestProgress / npcQuest.target) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="font-mono-nums text-xs font-bold text-[#B45309] dark:text-[#FDE047]">
                Prêmio: +{npcQuest.rewardCoins} Rolhas · +{npcQuest.rewardAttrPoints} pt(s)
              </span>

              {npcQuestState?.claimed ? (
                <span className="px-3 py-1.5 rounded-xl bg-[#10B981] text-white border-2 border-[#111827] dark:border-[#94A3B8] font-display font-extrabold text-xs flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Concluída</span>
                </span>
              ) : npcQuestDone ? (
                <button
                  onClick={() => onClaimQuest(npcQuest.id)}
                  className="cartoon-btn px-4 py-2 rounded-xl bg-[#FBBF24] hover:bg-[#F59E0B] text-[#111827] font-display font-extrabold text-xs sm:text-sm whitespace-nowrap"
                >
                  Resgatar Prêmio
                </button>
              ) : npcQuestState?.accepted ? (
                <span className="px-3 py-1.5 rounded-xl bg-[#E0F2FE] dark:bg-[#0C4A6E] text-[#0369A1] dark:text-[#BAE6FD] border-2 border-[#111827] dark:border-[#38BDF8] font-bold text-xs">
                  Em andamento
                </span>
              ) : (
                <button
                  onClick={() => onAcceptQuest(npcQuest.id)}
                  className="cartoon-btn px-4 py-2 rounded-xl bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#111827] font-display font-extrabold text-xs sm:text-sm whitespace-nowrap"
                >
                  Aceitar Missão
                </button>
              )}
            </div>
          </div>
        )}

        {focusedShop && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-3 bottom-3 sm:right-5 sm:bottom-5 z-20 w-[calc(100%-9.5rem)] sm:w-[410px] cartoon-outline-lg rounded-2xl bg-[#FFF8EB] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="rounded-xl bg-[#FEF3C7] dark:bg-[#1E293B] border-2 border-[#111827] dark:border-[#94A3B8] px-1 pt-0.5">
                  <ChibiCharacterSprite variant={focusedShop.sprite} size={46} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-[#B45309] dark:text-[#FDE047] truncate">
                    Local de Venda · {focusedShop.keeperName}
                  </div>
                  <h2 className="font-display font-extrabold text-base sm:text-lg leading-tight truncate">
                    {focusedShop.name}
                  </h2>
                </div>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-[#111827] dark:bg-[#05070B] border dark:border-[#94A3B8] text-[#FDE68A] dark:text-[#FDE047] font-mono-nums font-extrabold text-xs flex items-center gap-1 shrink-0">
                <Coins className="w-3.5 h-3.5 text-[#FBBF24]" />
                <span>{save.coins}</span>
              </div>
            </div>

            <p className="mt-2 text-xs italic text-[#475569] dark:text-[#CBD5E1]">{focusedShop.greeting}</p>

            <div className="mt-2.5 space-y-2 max-h-48 overflow-y-auto pr-0.5">
              {focusedShop.items.map((item) => {
                const owned =
                  Boolean(item.oneTime) && save.purchasedShopItems.includes(item.id);
                const canAfford = save.coins >= item.cost;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2.5 rounded-xl border-2 border-[#111827] dark:border-[#94A3B8] bg-[#FEF3C7]/70 dark:bg-[#0F172A] px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-extrabold text-xs sm:text-sm text-[#111827] dark:text-[#F8FAFC] truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-[#475569] dark:text-[#CBD5E1] leading-snug">
                        {item.description}
                      </div>
                    </div>

                    {owned ? (
                      <span className="px-2.5 py-1 rounded-lg bg-[#10B981] text-white border-2 border-[#111827] font-bold text-xs shrink-0">
                        Adquirido
                      </span>
                    ) : (
                      <button
                        disabled={!canAfford}
                        onClick={() => onBuyShopItem(item)}
                        className={`cartoon-btn px-2.5 py-1.5 rounded-xl font-mono-nums font-extrabold text-xs flex items-center gap-1 shrink-0 ${
                          canAfford
                            ? 'bg-[#FBBF24] hover:bg-[#F59E0B] text-[#111827]'
                            : 'bg-[#CBD5E1] dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] cursor-not-allowed'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>{item.cost}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Side Quests Drawer Overlay */}
        {questsOpen && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setQuestsOpen(false);
            }}
            className="absolute inset-0 z-30 bg-[#111827]/60 dark:bg-black/80 flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl cartoon-outline-lg rounded-2xl bg-[#FFF8EB] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] p-5 max-h-[84vh] flex flex-col"
            >
              <div className="flex items-center justify-between gap-3 pb-3 border-b-2 border-[#111827]/20 dark:border-[#94A3B8]/35">
                <div className="flex items-center gap-2">
                  <ScrollText className="w-5 h-5 text-[#0F766E] dark:text-[#34D399]" />
                  <h2 className="font-display font-extrabold text-lg sm:text-xl dark:text-[#FDE047]">
                    Missões Secundárias da Cidade
                  </h2>
                </div>
                <button
                  onClick={() => setQuestsOpen(false)}
                  className="cartoon-btn p-1.5 rounded-lg bg-[#E2E8F0] dark:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3 space-y-3 overflow-y-auto pr-1">
                {SIDE_QUEST_LIST.map((q) => {
                  const npc = OVERWORLD_NPCS.find((n) => n.id === q.npcId);
                  const state = save.sideQuests[q.id];
                  const prog = getSideQuestProgress(save, q);
                  const done = prog >= q.target;

                  return (
                    <div
                      key={q.id}
                      className="rounded-xl border-2 border-[#111827] dark:border-[#94A3B8] bg-[#FEF3C7]/60 dark:bg-[#0F172A] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        {npc && <ChibiCharacterSprite variant={npc.sprite} size={42} />}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-display font-extrabold text-sm truncate">
                              {q.title}
                            </span>
                            <span className="font-mono-nums text-xs font-bold text-[#0F766E] dark:text-[#34D399]">
                              {Math.min(prog, q.target)}/{q.target}
                            </span>
                          </div>
                          <p className="text-xs text-[#475569] dark:text-[#CBD5E1] mt-0.5">{q.description}</p>
                          <div className="text-[11px] font-bold text-[#B45309] dark:text-[#FDE047] mt-1">
                            {npc?.name} · +{q.rewardCoins} Rolhas · +{q.rewardAttrPoints} pt
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {npc && (
                          <button
                            onClick={() => {
                              setQuestsOpen(false);
                              const next: FocusTarget = { kind: 'NPC', npc };
                              focusRef.current = next;
                              setFocusTarget(next);
                              setActivePhaseTab(npc.phaseIndex);
                              updateTarget({ x: npc.mapX, y: npc.mapY });
                            }}
                            className="cartoon-btn px-2.5 py-1.5 rounded-lg bg-[#FFF8EB] dark:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] text-xs font-bold"
                          >
                            Ir ao NPC
                          </button>
                        )}
                        {state?.claimed ? (
                          <span className="px-2.5 py-1.5 rounded-lg bg-[#10B981] text-white border-2 border-[#111827] text-xs font-bold">
                            Concluída
                          </span>
                        ) : done ? (
                          <button
                            onClick={() => onClaimQuest(q.id)}
                            className="cartoon-btn px-3 py-1.5 rounded-lg bg-[#FBBF24] text-[#111827] text-xs font-extrabold"
                          >
                            Resgatar
                          </button>
                        ) : !state?.accepted ? (
                          <button
                            onClick={() => onAcceptQuest(q.id)}
                            className="cartoon-btn px-3 py-1.5 rounded-lg bg-[#38BDF8] text-[#111827] text-xs font-extrabold"
                          >
                            Aceitar
                          </button>
                        ) : (
                          <span className="px-2.5 py-1.5 rounded-lg bg-[#E0F2FE] dark:bg-[#0C4A6E] text-[#0369A1] dark:text-[#BAE6FD] border-2 border-[#111827] dark:border-[#38BDF8] text-xs font-bold">
                            Ativa
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
