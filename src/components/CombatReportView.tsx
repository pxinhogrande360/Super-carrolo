import React from 'react';
import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { BarChart3, RotateCcw, Shield, Target, Timer, X } from 'lucide-react';

export interface CombatReportProps {
  precisionPct: number;
  avgReactionMs: number;
  counterCount: number;
  enemyStrikesFaced: number;
  perfectCount: number;
  bottleUprights: number;
  isDark: boolean;
}

interface ReportBarDatum {
  name: string;
  chartValue: number;
  displayLabel: string;
  rawDetail: string;
  color: string;
}

export const CombatReportView: React.FC<CombatReportProps> = ({
  precisionPct,
  avgReactionMs,
  counterCount,
  enemyStrikesFaced,
  perfectCount,
  bottleUprights,
  isDark,
}) => {
  const counterFrequencyPct =
    enemyStrikesFaced > 0 ? Math.round((counterCount / enemyStrikesFaced) * 100) : 0;

  // Normalize metrics onto a 0..100 chart scale while showing exact real values on labels & tooltip
  const reactionScore =
    avgReactionMs > 0
      ? Math.max(12, Math.min(100, Math.round(115 - avgReactionMs / 16)))
      : 0;
  const counterChartScore = Math.max(6, Math.min(100, counterFrequencyPct));

  const data: ReportBarDatum[] = [
    {
      name: 'Precisão',
      chartValue: Math.max(4, precisionPct),
      displayLabel: `${precisionPct}%`,
      rawDetail: `${precisionPct}% de acerto no anel (${perfectCount} perfeitos)`,
      color: '#10B981',
    },
    {
      name: 'Reação Média',
      chartValue: Math.max(6, reactionScore),
      displayLabel: avgReactionMs > 0 ? `${avgReactionMs} ms` : '—',
      rawDetail:
        avgReactionMs > 0
          ? `${avgReactionMs} ms médios na janela de ataque`
          : 'Nenhuma janela medida neste duelo',
      color: '#38BDF8',
    },
    {
      name: 'Freq. Contra',
      chartValue: counterChartScore,
      displayLabel: `${counterFrequencyPct}%`,
      rawDetail:
        enemyStrikesFaced > 0
          ? `${counterCount} Contra-Carrollo(s) em ${enemyStrikesFaced} golpes inimigos (${counterFrequencyPct}%)`
          : `${counterCount} Contra-Carrollo(s) (nenhum golpe inimigo sofrido)`,
      color: '#FBBF24',
    },
  ];

  const rankLabel =
    precisionPct >= 82 && (avgReactionMs === 0 || avgReactionMs <= 750)
      ? 'Mestre da Rolha'
      : precisionPct >= 60
      ? 'Duelista Preciso'
      : 'Em Aquecimento';

  return (
    <div className="space-y-2.5 text-left">
      {/* KPI Summary Strip */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-[#ECFDF5] dark:bg-[#0F172A] border-2 border-[#111827] dark:border-[#94A3B8] px-2.5 py-1.5">
          <div className="flex items-center gap-1 text-[10px] font-bold text-[#065F46] dark:text-[#34D399]">
            <Target className="w-3 h-3" />
            <span>Precisão</span>
          </div>
          <div className="font-mono-nums font-extrabold text-sm text-[#111827] dark:text-[#F8FAFC]">
            {precisionPct}%
          </div>
        </div>

        <div className="rounded-xl bg-[#E0F2FE] dark:bg-[#0F172A] border-2 border-[#111827] dark:border-[#94A3B8] px-2.5 py-1.5">
          <div className="flex items-center gap-1 text-[10px] font-bold text-[#075985] dark:text-[#38BDF8]">
            <Timer className="w-3 h-3" />
            <span>Reação Média</span>
          </div>
          <div className="font-mono-nums font-extrabold text-sm text-[#111827] dark:text-[#F8FAFC]">
            {avgReactionMs > 0 ? `${avgReactionMs} ms` : '—'}
          </div>
        </div>

        <div className="rounded-xl bg-[#FEF3C7] dark:bg-[#0F172A] border-2 border-[#111827] dark:border-[#94A3B8] px-2.5 py-1.5">
          <div className="flex items-center gap-1 text-[10px] font-bold text-[#92400E] dark:text-[#FDE047]">
            <Shield className="w-3 h-3" />
            <span>Contra-Carrollo</span>
          </div>
          <div className="font-mono-nums font-extrabold text-sm text-[#111827] dark:text-[#F8FAFC]">
            {counterCount}x · {counterFrequencyPct}%
          </div>
        </div>
      </div>

      {/* Recharts Bar Chart */}
      <div className="rounded-xl border-[2.5px] border-[#111827] dark:border-[#94A3B8] bg-[#FFFBEB] dark:bg-[#0F172A] p-2.5">
        <div className="flex items-center justify-between gap-2 mb-1 px-1">
          <span className="font-display text-xs text-[#111827] dark:text-[#FDE047]">
            Métricas do Combate
          </span>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#111827] dark:bg-[#FDE047] text-[#FDE68A] dark:text-[#111827]">
            {rankLabel}
          </span>
        </div>

        <div className="w-full h-[170px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 14, left: -18, bottom: 2 }}
            >
              <XAxis
                dataKey="name"
                tick={{
                  fill: isDark ? '#E2E8F0' : '#111827',
                  fontSize: 11,
                  fontWeight: 700,
                }}
                axisLine={{ stroke: isDark ? '#94A3B8' : '#111827', strokeWidth: 2 }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{
                  fill: isDark ? '#94A3B8' : '#475569',
                  fontSize: 10,
                }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{
                  fill: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(17,24,39,0.06)',
                }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload as ReportBarDatum;
                  return (
                    <div className="rounded-lg border-2 border-[#111827] dark:border-[#FDE047] bg-[#FFF8EB] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] px-2.5 py-1.5 text-[11px] font-bold shadow-md">
                      <div>{item.name}</div>
                      <div className="text-[10px] text-[#475569] dark:text-[#CBD5E1]">
                        {item.rawDetail}
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="chartValue"
                radius={[8, 8, 2, 2]}
                stroke={isDark ? '#F8FAFC' : '#111827'}
                strokeWidth={2.5}
                maxBarSize={56}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
                <LabelList
                  dataKey="displayLabel"
                  position="top"
                  fill={isDark ? '#FDE047' : '#111827'}
                  fontSize={11}
                  fontWeight={800}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-1 flex items-center justify-between px-1 text-[10px] font-semibold text-[#64748B] dark:text-[#94A3B8]">
          <span>Garrafas em pé: {bottleUprights}</span>
          <span>Golpes defendidos: {counterCount}/{enemyStrikesFaced}</span>
        </div>
      </div>
    </div>
  );
};

interface CombatReportModalProps extends CombatReportProps {
  isOpen: boolean;
  winnerName: string;
  playerWon: boolean;
  isReplayMode?: boolean;
  onClose: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export const CombatReportModal: React.FC<CombatReportModalProps> = ({
  isOpen,
  winnerName,
  playerWon,
  isReplayMode,
  onClose,
  onRestart,
  onExit,
  ...reportProps
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="absolute inset-0 z-40 bg-black/75 dark:bg-black/88 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 14 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="cartoon-outline-lg rounded-2xl bg-[#FFF8EB] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] p-4 sm:p-5 w-full max-w-md space-y-3 max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl border-2 border-[#111827] dark:border-[#94A3B8] flex items-center justify-center shrink-0 ${
                playerWon ? 'bg-[#38BDF8] text-[#111827]' : 'bg-[#F97316] text-white'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="min-w-0 text-left">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#0284C7] dark:text-[#38BDF8]">
                {isReplayMode ? 'Análise do Replay' : 'Relatório Pós-Batalha'}
              </div>
              <h2 className="font-display text-xl leading-none truncate dark:text-[#FDE047]">
                Relatório de Combate
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar relatório"
            className="cartoon-btn w-8 h-8 rounded-lg bg-[#E2E8F0] dark:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-xl border-2 border-[#111827] dark:border-[#94A3B8] bg-[#FEF3C7] dark:bg-[#0F172A] px-3 py-1.5 flex items-center justify-between gap-2 text-xs font-bold">
          <span>
            {playerWon ? 'Campeão da Rodada' : 'Vencedor da Arena'}:{' '}
            <strong className="font-display text-sm text-[#B45309] dark:text-[#FDE047]">
              {winnerName}
            </strong>
          </span>
          <span className="font-mono-nums text-[11px] px-2 py-0.5 rounded bg-[#111827] text-[#FDE047]">
            {reportProps.perfectCount} Perfeitos
          </span>
        </div>

        <CombatReportView {...reportProps} />

        <div className="flex flex-row gap-2 pt-1">
          <button
            onClick={onClose}
            className="cartoon-btn flex-1 py-2 rounded-xl bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#111827] font-display text-xs"
          >
            Ver Resultado
          </button>
          <button
            onClick={onRestart}
            className="cartoon-btn flex-1 py-2 rounded-xl bg-[#FBBF24] text-[#111827] font-display text-xs flex items-center justify-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isReplayMode ? 'Rever' : 'Revanche'}</span>
          </button>
          <button
            onClick={onExit}
            className="cartoon-btn py-2 px-3 rounded-xl bg-[#E2E8F0] dark:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] font-display text-xs"
          >
            Sair
          </button>
        </div>
      </motion.div>
    </div>
  );
};
