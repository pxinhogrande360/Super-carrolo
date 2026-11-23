import { AchievementDef, AchievementId } from '../types/game';

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_blood',
    title: 'Primeiro Carrollo',
    description: 'Vença seu primeiro duelo 1v1 em qualquer modo de jogo.',
    target: 1,
    icon: 'trophy',
  },
  {
    id: 'perfect_streak_10',
    title: 'Mão de Ouro',
    description: 'Acerte 10 Carrollos Perfeitos seguidos sem quebrar a sequência.',
    target: 10,
    icon: 'flame',
  },
  {
    id: 'flawless_boss',
    title: 'Intocável',
    description: 'Derrote qualquer Chefe de fase no Modo História sem sofrer dano.',
    target: 1,
    icon: 'shield',
  },
  {
    id: 'counter_master',
    title: 'Reflexo de Gato',
    description: 'Execute 5 Contra-Carrollos em duelos.',
    target: 5,
    icon: 'zap',
  },
  {
    id: 'bottle_whisperer',
    title: 'Mestre da Garrafa',
    description: 'Faça a garrafa parar em pé 25 vezes no total.',
    target: 25,
    icon: 'sparkles',
  },
  {
    id: 'dethrone_karrolo',
    title: 'Queda do Cavaleiro',
    description: 'Derrote o Chefe Final The Knight na Fase 5-6 do Modo História.',
    target: 1,
    icon: 'crown',
  },
];

export const ACHIEVEMENT_MAP: Record<AchievementId, AchievementDef> = ACHIEVEMENTS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<AchievementId, AchievementDef>
);
