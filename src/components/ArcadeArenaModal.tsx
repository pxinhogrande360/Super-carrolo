import React, { useState } from 'react';
import {
  Anchor,
  Crown,
  Flame,
  Moon,
  RefreshCw,
  Swords,
  TrainFront,
  X,
} from 'lucide-react';
import { BIOME_LIST, BiomeDef } from '../canvas/biomeRenderer';
import { ArenaBiomeId, SaveData } from '../types/game';

interface ArcadeArenaModalProps {
  save: SaveData;
  onClose: () => void;
  onStartArcade: (startBiome: ArenaBiomeId, cycleBiomes: boolean) => void;
}

const BIOME_ICONS: Record<ArenaBiomeId, React.ReactNode> = {
  docks: <Anchor className="w-5 h-5" />,
  market: <Flame className="w-5 h-5" />,
  rooftops: <Moon className="w-5 h-5" />,
  station: <TrainFront className="w-5 h-5" />,
  castle: <Crown className="w-5 h-5" />,
};

export const ArcadeArenaModal: React.FC<ArcadeArenaModalProps> = ({
  save,
  onClose,
  onStartArcade,
}) => {
  const [selectedBiome, setSelectedBiome] = useState<ArenaBiomeId>('docks');
  const [cycleBiomes, setCycleBiomes] = useState<boolean>(true);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 dark:bg-black/85 flex items-center justify-center p-4">
      <div className="cartoon-outline-lg rounded-3xl bg-[#261D2E] dark:bg-[#0B1120] text-[#FFF8EB] dark:text-[#F8FAFC] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 bg-[#18121E] dark:bg-[#05070B] border-b-[3px] border-[#111827] dark:border-[#94A3B8]">
          <div>
            <h2 className="font-display font-extrabold text-xl text-[#FBBF24] dark:text-[#FDE047]">
              Modo Arcade · Escolha a Arena
            </h2>
            <p className="text-xs text-[#CBD5E1] font-mono-nums mt-0.5">
              Recorde: {save.arcadeHighScore} pts · Melhor onda: {save.arcadeBestWave}
            </p>
          </div>
          <button
            onClick={onClose}
            className="cartoon-btn w-10 h-10 rounded-xl bg-[#FFF8EB] dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] flex items-center justify-center shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Cycle vs Fixed Arena Mode Switch */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-[#18121E] dark:bg-[#05070B] border-2 border-[#111827] dark:border-[#94A3B8] p-3.5">
            <div>
              <div className="font-display font-bold text-sm text-[#FDE68A] dark:text-[#FDE047]">
                Rotação de Biomas
              </div>
              <div className="text-xs text-[#CBD5E1]">
                {cycleBiomes
                  ? 'Avança para o próximo bioma automaticamente a cada nova onda.'
                  : 'Mantém todo o desafio Arcade na arena selecionada abaixo.'}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setCycleBiomes(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 border-[#111827] dark:border-[#94A3B8] flex items-center gap-1.5 whitespace-nowrap ${
                  cycleBiomes
                    ? 'bg-[#10B981] text-white'
                    : 'bg-[#261D2E] dark:bg-[#0F172A] text-[#CBD5E1] hover:bg-[#352944] dark:hover:bg-[#1E293B]'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ciclo por Onda</span>
              </button>
              <button
                onClick={() => setCycleBiomes(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 border-[#111827] dark:border-[#94A3B8] whitespace-nowrap ${
                  !cycleBiomes
                    ? 'bg-[#FBBF24] dark:bg-[#FDE047] text-[#111827]'
                    : 'bg-[#261D2E] dark:bg-[#0F172A] text-[#CBD5E1] hover:bg-[#352944] dark:hover:bg-[#1E293B]'
                }`}
              >
                Arena Fixa
              </button>
            </div>
          </div>

          {/* 5 Biome Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BIOME_LIST.map((biome: BiomeDef) => {
              const active = selectedBiome === biome.id;
              return (
                <button
                  key={biome.id}
                  onClick={() => setSelectedBiome(biome.id)}
                  className={`cartoon-outline rounded-2xl p-3.5 text-left transition-transform flex items-start gap-3 ${
                    active
                      ? 'bg-[#FFF8EB] dark:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] dark:ring-2 dark:ring-[#FDE047] scale-[1.01]'
                      : 'bg-[#1D1626] dark:bg-[#05070B] text-[#FFF8EB] dark:text-[#F8FAFC] hover:bg-[#32263C] dark:hover:bg-[#0F172A]'
                  }`}
                >
                  {/* Color biome emblem */}
                  <div
                    className="w-12 h-12 rounded-xl border-[3px] border-[#111827] dark:border-[#94A3B8] flex items-center justify-center shrink-0 text-white"
                    style={{
                      background: `linear-gradient(160deg, ${biome.skyTop} 0%, ${biome.skyBottom} 100%)`,
                    }}
                  >
                    {BIOME_ICONS[biome.id]}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div
                      className={`text-[11px] font-bold ${
                        active ? 'text-[#B45309] dark:text-[#FDE047]' : 'text-[#FDE68A] dark:text-[#38BDF8]'
                      }`}
                    >
                      {biome.district}
                    </div>
                    <div className="font-display font-extrabold text-base leading-tight">
                      {biome.name}
                    </div>
                    <p
                      className={`text-xs mt-1 leading-snug ${
                        active ? 'text-[#334155] dark:text-[#E2E8F0]' : 'text-[#CBD5E1]'
                      }`}
                    >
                      {biome.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="px-5 py-4 bg-[#18121E] dark:bg-[#05070B] border-t-[3px] border-[#111827] dark:border-[#94A3B8] flex items-center justify-between gap-3">
          <div className="text-xs text-[#E2E8F0] font-medium">
            {cycleBiomes
              ? `Iniciando em ${BIOME_LIST.find((b) => b.id === selectedBiome)?.name}`
              : `Arena fixa: ${BIOME_LIST.find((b) => b.id === selectedBiome)?.name}`}
          </div>
          <button
            onClick={() => onStartArcade(selectedBiome, cycleBiomes)}
            className="cartoon-btn px-6 py-2.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-display font-extrabold text-sm flex items-center gap-2 whitespace-nowrap"
          >
            <Swords className="w-4 h-4" />
            <span>Iniciar Arcade</span>
          </button>
        </div>
      </div>
    </div>
  );
};
