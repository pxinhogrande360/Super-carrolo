import React, { useEffect } from 'react';
import { Volume2, VolumeX, Swords, Flame, Trophy, Users, Sparkles, Award, Film, Settings, Download } from 'lucide-react';
import { MatchReplay, SaveData } from '../types/game';
import { ACHIEVEMENTS } from '../data/achievements';
import { CHARACTERS } from '../data/gameData';
import { CharacterAvatar } from './CharacterAvatar';
import { CityNewspaperTicker } from './CityNewspaper';

interface TitleScreenProps {
  save: SaveData;
  lastReplay?: MatchReplay | null;
  achievementsModalOpen?: boolean;
  onStartStory: () => void;
  onStartFreeMode: () => void;
  onStartArcade: () => void;
  onOpenPvp: () => void;
  onOpenRoster: () => void;
  onOpenAchievements: () => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onOpenNewspaper: () => void;
  onWatchReplay?: () => void;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  save,
  lastReplay = null,
  achievementsModalOpen = false,
  onStartStory,
  onStartFreeMode,
  onStartArcade,
  onOpenPvp,
  onOpenRoster,
  onOpenAchievements,
  onOpenSettings,
  onOpenExport,
  onOpenNewspaper,
  onWatchReplay,
  onToggleMute,
}) => {
  const selectedChar = CHARACTERS[save.selectedCharId] || CHARACTERS.leo;
  const unlockedCount = ACHIEVEMENTS.filter((a) => Boolean(save.achievements[a.id]?.unlockedAt)).length;
  const nextMilestone =
    ACHIEVEMENTS.find((a) => !save.achievements[a.id]?.unlockedAt) || ACHIEVEMENTS[0];
  const nextProgress = save.achievements[nextMilestone.id]?.progress || 0;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (achievementsModalOpen) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onStartStory();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [achievementsModalOpen, onStartStory]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#18121E] dark:bg-[#05070B] flex flex-col justify-between">
      {/* Illustrated Key Art Backdrop */}
      <img
        src="./src/assets/images/title_key_art_1795256858213.jpg"
        alt="Praça central de Super Carrollo"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-center dark:brightness-75 dark:contrast-110 transition-all"
      />

      {/* Contrast Scrim on left/bottom for legible typography while keeping the right pedestal clear */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#18121E]/92 via-[#18121E]/65 to-transparent dark:from-[#030509]/96 dark:via-[#050811]/82" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#18121E]/85 via-transparent to-[#18121E]/35 dark:from-[#030509]/95 dark:to-[#030509]/55" />

      {/* Top minimal utility strip + Botões de sistema (Visual UI System PAPER tiles) */}
      <div className="relative z-10 flex items-center justify-between gap-3 px-4 sm:px-7 pt-3 sm:pt-4">
        <div className="flex flex-wrap items-center gap-2.5 text-[11px] sm:text-xs font-semibold text-[#FDE68A] dark:text-[#FDE047]">
          <span className="font-mono-nums">
            História: {save.completedLevels.length}/30 níveis
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-nums">
            Recorde Arcade: {save.arcadeHighScore}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-nums">
            Conquistas: {unlockedCount}/{ACHIEVEMENTS.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onStartFreeMode}
            className="ui-sys-btn px-2.5 py-1.5 rounded-xl flex flex-col items-center justify-center min-w-[64px]"
            title="Duelo Rápido (Modo Livre)"
          >
            <Flame className="w-3.5 h-3.5 text-[#EF4444]" />
            <span className="text-[10px] font-extrabold leading-tight mt-0.5">Livre</span>
          </button>

          <button
            onClick={onOpenAchievements}
            className="ui-sys-btn px-2.5 py-1.5 rounded-xl flex flex-col items-center justify-center min-w-[68px]"
            title="Conquistas"
          >
            <Award className="w-3.5 h-3.5 text-[#D97706] dark:text-[#FDE047]" />
            <span className="text-[10px] font-extrabold leading-tight mt-0.5">Conquistas</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="ui-sys-btn px-2.5 py-1.5 rounded-xl flex flex-col items-center justify-center min-w-[64px]"
            aria-label="Configurações"
            title="Configurações (Controles, Tema e Áudio)"
          >
            <Settings className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38BDF8]" />
            <span className="text-[10px] font-extrabold leading-tight mt-0.5">Config.</span>
          </button>

          <button
            onClick={onOpenExport}
            className="ui-sys-btn px-2.5 py-1.5 rounded-xl flex flex-col items-center justify-center min-w-[64px] !bg-[#10B981] hover:!bg-[#059669] !text-white"
            aria-label="Exportar e Publicar"
            title="Baixar site pronto ou código-fonte completo (.ZIP)"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span className="text-[10px] font-extrabold leading-tight mt-0.5">Exportar</span>
          </button>

          <button
            onClick={onToggleMute}
            className="ui-sys-btn px-2.5 py-1.5 rounded-xl flex flex-col items-center justify-center min-w-[54px]"
            aria-label={save.muted ? 'Ativar som' : 'Silenciar som'}
            title={save.muted ? 'Ativar som' : 'Silenciar som'}
          >
            {save.muted ? (
              <VolumeX className="w-3.5 h-3.5 text-[#EF4444]" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-[#10B981]" />
            )}
            <span className="text-[10px] font-extrabold leading-tight mt-0.5">Som</span>
          </button>
        </div>
      </div>

      {/* Main Left-Aligned Lockup & Mode Selector (Horizontal ergonomics) */}
      <div className="relative z-10 flex-1 flex items-center px-4 sm:px-9 lg:px-12 py-2 overflow-y-auto">
        <div className="w-full max-w-2xl space-y-3 sm:space-y-4">
          {/* Bespoke SVG Title Lockup */}
          <div className="select-none">
            <svg
              viewBox="0 0 540 148"
              className="w-full max-w-[340px] sm:max-w-[390px] drop-shadow-[0_5px_0_#111827]"
              aria-label="Super Carrollo"
            >
              {/* Comic Burst behind text */}
              <path
                d="M20 72 L46 22 L110 36 L160 10 L215 34 L278 8 L335 36 L405 14 L455 42 L515 28 L495 80 L525 120 L455 124 L395 142 L325 120 L250 140 L185 118 L115 138 L55 116 L15 125 Z"
                fill="#F59E0B"
                stroke="#111827"
                strokeWidth="7"
                strokeLinejoin="round"
              />
              {/* SUPER */}
              <text
                x="44"
                y="54"
                fill="#FFF8EB"
                stroke="#111827"
                strokeWidth="8"
                paintOrder="stroke"
                fontFamily="Bangers, Comic Neue, system-ui, sans-serif"
                fontWeight="400"
                fontSize="36"
                letterSpacing="4"
              >
                SUPER
              </text>
              {/* CARROLLO */}
              <text
                x="42"
                y="114"
                fill="#EF4444"
                stroke="#111827"
                strokeWidth="11"
                paintOrder="stroke"
                fontFamily="Bangers, Comic Neue, system-ui, sans-serif"
                fontWeight="400"
                fontSize="68"
                letterSpacing="3"
              >
                CARROLLO
              </text>
              {/* Little upright bottle icon */}
              <g transform="translate(454, 42) rotate(10)">
                <path
                  d="M8 62 L28 62 L30 34 Q30 24 22 18 L22 4 L14 4 L14 18 Q6 24 6 34 Z"
                  fill="#38BDF8"
                  stroke="#111827"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
                <rect
                  x="12"
                  y="0"
                  width="12"
                  height="6"
                  rx="2"
                  fill="#EF4444"
                  stroke="#111827"
                  strokeWidth="3.5"
                />
              </g>
            </svg>
          </div>

          <p className="text-xs sm:text-sm text-[#F3E8D2] dark:text-[#F8FAFC] max-w-md leading-snug font-medium">
            Gire a garrafa no centro da arena, equilibre em pé e dispare um Carrollo fulminante para libertar a cidade do Rei Karrolo.
          </p>

          {/* Primary CTA (RED) + 2x2 Visual UI System Mode Grid (PAPER / BLUE / GREEN / GOLD) */}
          <div className="space-y-2.5 max-w-lg pt-0.5">
            <button
              onClick={onStartStory}
              className="cartoon-btn w-full px-6 py-2.5 rounded-2xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-display text-xl tracking-wide flex items-center justify-center gap-2.5 whitespace-nowrap"
            >
              <Swords className="w-5 h-5" />
              <span>JOGAR</span>
            </button>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={onStartStory}
                className="cartoon-btn px-3 py-2 rounded-xl bg-[#FFF8EB] hover:bg-[#FEF3C7] text-[#18121E] font-display text-xs tracking-wide flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Swords className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                <span>MODO HISTÓRIA</span>
              </button>

              <button
                onClick={onStartArcade}
                className="cartoon-btn px-3 py-2 rounded-xl bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#18121E] font-display text-xs tracking-wide flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Trophy className="w-3.5 h-3.5 shrink-0" />
                <span>ARCADE</span>
              </button>

              <button
                onClick={onOpenPvp}
                className="cartoon-btn px-3 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-display text-xs tracking-wide flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>MODO PvP</span>
              </button>

              <button
                onClick={onOpenRoster}
                className="cartoon-btn px-3 py-2 rounded-xl bg-[#FBBF24] hover:bg-[#F59E0B] text-[#18121E] font-display text-xs tracking-wide flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>HABILIDADES</span>
              </button>
            </div>
          </div>

          {/* Active Hero & Achievements Summary Row */}
          <div className="flex flex-wrap items-stretch gap-2.5">
            <button
              onClick={onOpenRoster}
              className="cartoon-outline bg-[#261D2E]/95 dark:bg-[#0B1120]/95 hover:bg-[#32263C] dark:hover:bg-[#162033] rounded-xl px-3 py-2 inline-flex items-center gap-2.5 text-left transition-colors"
            >
              <CharacterAvatar charId={selectedChar.id} size={38} />
              <div>
                <div className="text-[11px] text-[#FBBF24] dark:text-[#FDE047] font-bold">
                  Lutador · Pts: {save.progression[selectedChar.id]?.attributePoints ?? 0}
                </div>
                <div className="text-xs font-display text-[#FFF8EB] dark:text-[#F8FAFC]">
                  {selectedChar.name} — {selectedChar.title}
                </div>
              </div>
            </button>

            <button
              onClick={onOpenAchievements}
              className="cartoon-outline bg-[#261D2E]/95 dark:bg-[#0B1120]/95 hover:bg-[#32263C] dark:hover:bg-[#162033] rounded-xl px-3 py-2 inline-flex items-center gap-2.5 text-left transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-[#FBBF24] border-2 border-[#111827] flex items-center justify-center shrink-0">
                <Award className="w-4 h-4 text-[#111827]" />
              </div>
              <div>
                <div className="text-[11px] text-[#FDE68A] dark:text-[#FDE047] font-bold font-mono-nums">
                  Conquistas · {unlockedCount}/{ACHIEVEMENTS.length}
                </div>
                <div className="text-xs font-display text-[#FFF8EB] dark:text-[#F8FAFC]">
                  {nextMilestone.title} ({nextProgress}/{nextMilestone.target})
                </div>
              </div>
            </button>

            {lastReplay && onWatchReplay && (
              <button
                onClick={onWatchReplay}
                className="cartoon-outline bg-[#261D2E]/95 dark:bg-[#0B1120]/95 hover:bg-[#32263C] dark:hover:bg-[#162033] rounded-xl px-3 py-2 inline-flex items-center gap-2.5 text-left transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-[#38BDF8] border-2 border-[#111827] flex items-center justify-center shrink-0">
                  <Film className="w-4 h-4 text-[#111827]" />
                </div>
                <div>
                  <div className="text-[11px] text-[#38BDF8] font-bold font-mono-nums">
                    Último Replay · {Math.max(1, Math.round(lastReplay.duration))}s
                  </div>
                  <div className="text-xs font-display text-[#FFF8EB] dark:text-[#F8FAFC]">
                    {lastReplay.p1Name} vs {lastReplay.p2Name}
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Retro Newspaper Ticker + Control Hint */}
      <div className="relative z-10 px-4 sm:px-9 lg:px-12 pb-2.5 space-y-1.5">
        <CityNewspaperTicker save={save} onOpen={onOpenNewspaper} />
        <div className="text-[11px] text-[#E5D5B5]/90 dark:text-[#E2E8F0] font-medium">
          Segure e solte para girar a garrafa · Toque no anel verde para o Carrollo · Enter para iniciar
        </div>
      </div>
    </div>
  );
};
