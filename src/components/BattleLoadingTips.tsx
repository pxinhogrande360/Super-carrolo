import React, { useEffect, useMemo, useState } from 'react';
import { Lightbulb, FastForward, MapPin, Swords } from 'lucide-react';
import { BIOMES } from '../canvas/biomeRenderer';
import { pickBattleLoadingTip } from '../data/battleTipsData';
import { CHARACTERS } from '../data/gameData';
import { ActiveBattleConfig, ArenaBiomeId } from '../types/game';
import { CharacterAvatar } from './CharacterAvatar';
import { ChibiCharacterSprite } from './ChibiCharacterSprite';

interface BattleLoadingTipsProps {
  config: ActiveBattleConfig;
  biomeId: ArenaBiomeId;
  durationMs?: number;
  onComplete: () => void;
}

export const BattleLoadingTips: React.FC<BattleLoadingTipsProps> = ({
  config,
  biomeId,
  durationMs = 2200,
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const biome = BIOMES[biomeId] || BIOMES.docks;
  const p1 = CHARACTERS[config.player1CharId] || CHARACTERS.leo;
  const p2 = CHARACTERS[config.player2CharId] || CHARACTERS.karrolo;
  const p2Label = config.player2Name || config.storyLevel?.opponentName || p2.name;

  const tip = useMemo(() => pickBattleLoadingTip(config, biomeId), [config, biomeId]);

  useEffect(() => {
    const start = performance.now();
    let rafId = 0;
    let finished = false;

    const tick = (now: number) => {
      const ratio = Math.min(1, (now - start) / durationMs);
      setProgress(ratio);
      if (ratio >= 1 && !finished) {
        finished = true;
        onComplete();
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [durationMs, onComplete]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        onComplete();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-[#18121E] dark:bg-[#05070B] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Subtle Biome Radial Glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25 dark:opacity-20"
        style={{
          background: `radial-gradient(circle at 50% 35%, ${biome.accentColor}, transparent 68%)`,
        }}
      />

      <div className="relative z-10 w-full max-w-2xl cartoon-outline-lg rounded-2xl bg-[#FFF8EB] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] p-4 sm:p-6 space-y-4">
        {/* Top Arena Location Header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111827] dark:bg-[#FDE047] text-[#FDE68A] dark:text-[#111827] font-display text-xs tracking-wide">
            <MapPin className="w-3.5 h-3.5" />
            <span>ARENA: {biome.name.toUpperCase()}</span>
          </div>

          <button
            onClick={onComplete}
            className="cartoon-btn px-3 py-1 rounded-lg bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#111827] font-display text-xs flex items-center gap-1.5"
          >
            <span>Pular</span>
            <FastForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Horizontal Matchup Stage featuring faithful SVG Portraits + Mini Chibis */}
        <div className="rounded-xl border-[2.5px] border-[#111827] dark:border-[#94A3B8] bg-gradient-to-r from-[#FEF3C7] via-[#FFF8EB] to-[#FFE4E6] dark:from-[#0F172A] dark:via-[#111B33] dark:to-[#1E293B] px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <CharacterAvatar
                charId={p1.id}
                size={60}
                className="drop-shadow-[0_3px_0_#111827]"
              />
              <div className="absolute -right-2 -bottom-1 animate-winner-celebrate pointer-events-none">
                <ChibiCharacterSprite charId={p1.id} size={28} facing={1} isMoving={true} />
              </div>
            </div>
            <div className="min-w-0 pl-1">
              <div className="text-[10px] font-bold uppercase text-[#0284C7] dark:text-[#38BDF8]">
                Desafiante
              </div>
              <div className="font-display text-base sm:text-lg leading-tight truncate">
                {p1.name}
              </div>
            </div>
          </div>

          <div className="w-10 h-10 rounded-full bg-[#EF4444] text-white border-[2.5px] border-[#111827] flex items-center justify-center shrink-0 shadow-[0_2px_0_#111827]">
            <Swords className="w-5 h-5" />
          </div>

          <div className="flex items-center gap-2.5 min-w-0 flex-row-reverse text-right">
            <div className="relative shrink-0">
              <CharacterAvatar
                charId={p2.id}
                size={60}
                className="drop-shadow-[0_3px_0_#111827]"
              />
              <div className="absolute -left-2 -bottom-1 animate-loser-sway pointer-events-none">
                <ChibiCharacterSprite charId={p2.id} size={28} facing={-1} isMoving={false} />
              </div>
            </div>
            <div className="min-w-0 pr-1">
              <div className="text-[10px] font-bold uppercase text-[#EA580C] dark:text-[#FB923C]">
                {p2.isBossOnly ? 'Chefe Exclusivo' : 'Adversário'}
              </div>
              <div className="font-display text-base sm:text-lg leading-tight truncate">
                {p2Label}
              </div>
              <div className="text-[10px] font-semibold text-[#64748B] dark:text-[#CBD5E1] truncate">
                {p2.title}
              </div>
            </div>
          </div>
        </div>

        {/* Funny Lore "Dicas de Batalha" Card */}
        <div className="rounded-xl border-[2.5px] border-[#111827] dark:border-[#FDE047] bg-[#FEF3C7] dark:bg-[#0F172A] p-3.5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FBBF24] dark:bg-[#FDE047] border-2 border-[#111827] flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5 text-[#111827]" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-display text-sm text-[#B45309] dark:text-[#FDE047]">
                DICAS DE BATALHA
              </span>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#111827] text-[#FDE68A] dark:bg-[#1E293B] dark:text-[#38BDF8]">
                {tip.tag}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#1E293B] dark:text-[#F8FAFC] leading-snug">
              “{tip.text}”
            </p>
          </div>
        </div>

        {/* ~2.2s Animated Progress Strip */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#475569] dark:text-[#CBD5E1]">
            <span>Preparando mesa e polindo a garrafa...</span>
            <span className="font-mono-nums">{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-3.5 w-full rounded-full bg-[#E2E8F0] dark:bg-[#1E293B] border-[2.5px] border-[#111827] dark:border-[#94A3B8] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#F59E0B] via-[#EF4444] to-[#10B981] transition-none"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
