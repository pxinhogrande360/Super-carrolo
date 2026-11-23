import React from 'react';
import {
  X,
  Trophy,
  Flame,
  Shield,
  Zap,
  Sparkles,
  Crown,
  Check,
  Lock,
} from 'lucide-react';
import { ACHIEVEMENTS } from '../data/achievements';
import { AchievementDef, SaveData } from '../types/game';

interface AchievementsModalProps {
  save: SaveData;
  onClose: () => void;
}

function renderIcon(icon: AchievementDef['icon'], unlocked: boolean) {
  const cls = unlocked ? 'w-6 h-6 text-[#111827]' : 'w-6 h-6 text-[#94A3B8]';
  switch (icon) {
    case 'trophy':
      return <Trophy className={cls} />;
    case 'flame':
      return <Flame className={cls} />;
    case 'shield':
      return <Shield className={cls} />;
    case 'zap':
      return <Zap className={cls} />;
    case 'sparkles':
      return <Sparkles className={cls} />;
    case 'crown':
      return <Crown className={cls} />;
  }
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  save,
  onClose,
}) => {
  const unlockedCount = ACHIEVEMENTS.filter(
    (a) => Boolean(save.achievements[a.id]?.unlockedAt)
  ).length;

  return (
    <div
      className="fixed inset-0 z-40 bg-black/75 dark:bg-black/85 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cartoon-outline-lg rounded-3xl bg-[#1D1626] dark:bg-[#0B1120] text-[#FFF8EB] dark:text-[#F8FAFC] w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 bg-[#15101C] dark:bg-[#05070B] border-b-[3px] border-[#111827] dark:border-[#94A3B8]">
          <div>
            <h2 className="font-display font-extrabold text-xl text-[#FDE68A] dark:text-[#FDE047]">
              Conquistas de Super Carrollo
            </h2>
            <p className="text-xs text-[#CBD5E1] font-mono-nums mt-0.5">
              {unlockedCount}/{ACHIEVEMENTS.length} desbloqueadas · Melhor sequência perfeita: {save.achievementStats.bestPerfectStreak}
            </p>
          </div>
          <button
            onClick={onClose}
            className="cartoon-btn w-10 h-10 rounded-xl bg-[#FFF8EB] dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] flex items-center justify-center"
            aria-label="Fechar conquistas"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Achievement List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACHIEVEMENTS.map((def) => {
            const st = save.achievements[def.id] || { progress: 0 };
            const unlocked = Boolean(st.unlockedAt);
            const pct = Math.min(100, (st.progress / def.target) * 100);

            return (
              <div
                key={def.id}
                className={`cartoon-outline rounded-2xl p-4 flex flex-col justify-between gap-3 ${
                  unlocked
                    ? 'bg-[#FFF8EB] dark:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] dark:ring-2 dark:ring-[#34D399]'
                    : 'bg-[#2A2036] dark:bg-[#05070B] text-[#FFF8EB] dark:text-[#F8FAFC]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl border-[3px] border-[#111827] dark:border-[#94A3B8] flex items-center justify-center shrink-0 ${
                      unlocked ? 'bg-[#FBBF24] dark:bg-[#FDE047]' : 'bg-[#1D1626] dark:bg-[#0F172A]'
                    }`}
                  >
                    {renderIcon(def.icon, unlocked)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display font-extrabold text-sm leading-tight">
                        {def.title}
                      </h3>
                      {unlocked ? (
                        <Check className="w-4 h-4 text-[#059669] dark:text-[#34D399] stroke-[3] shrink-0" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                      )}
                    </div>
                    <p
                      className={`text-xs mt-1 leading-relaxed ${
                        unlocked ? 'text-[#334155] dark:text-[#E2E8F0]' : 'text-[#CBD5E1]'
                      }`}
                    >
                      {def.description}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono-nums font-bold mb-1">
                    <span className={unlocked ? 'text-[#059669] dark:text-[#34D399]' : 'text-[#FDE68A] dark:text-[#FDE047]'}>
                      {unlocked ? 'Desbloqueada' : 'Em progresso'}
                    </span>
                    <span>
                      {st.progress}/{def.target}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-black/25 dark:bg-[#0F172A] border border-[#111827] dark:border-[#94A3B8] overflow-hidden">
                    <div
                      className={`h-full ${unlocked ? 'bg-[#10B981]' : 'bg-[#FBBF24] dark:bg-[#FDE047]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
