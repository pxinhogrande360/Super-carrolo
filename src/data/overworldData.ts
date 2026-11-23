import {
  OverworldNpcDef,
  OverworldShopDef,
  SaveData,
  SideQuestDef,
} from '../types/game';

export const SIDE_QUESTS: Record<string, SideQuestDef> = {
  quest_marujo_equilibrio: {
    id: 'quest_marujo_equilibrio',
    npcId: 'npc_baltazar',
    title: 'Equilíbrio de Marujo',
    description: 'Acerte o giro e deixe a garrafa em pé 5 vezes nos duelos.',
    metric: 'bottle_uprights',
    target: 5,
    rewardCoins: 60,
    rewardAttrPoints: 1,
  },
  quest_feira_perfeitos: {
    id: 'quest_feira_perfeitos',
    npcId: 'npc_hortensia',
    title: 'Tempero Perfeito',
    description: 'Execute 4 Carrollos Perfeitos no tempo exato do anel.',
    metric: 'perfect_hits',
    target: 4,
    rewardCoins: 75,
    rewardAttrPoints: 1,
  },
  quest_telhados_contras: {
    id: 'quest_telhados_contras',
    npcId: 'npc_joca',
    title: 'Reflexo das Antenas',
    description: 'Realize 3 Contra-Carrollos defendendo ataques rivais.',
    metric: 'counter_hits',
    target: 3,
    rewardCoins: 90,
    rewardAttrPoints: 1,
  },
  quest_cidadela_libertacao: {
    id: 'quest_cidadela_libertacao',
    npcId: 'npc_sofia',
    title: 'Libertadores da Cidade',
    description: 'Conclua pelo menos 12 fases diferentes do Modo História.',
    metric: 'story_wins',
    target: 12,
    rewardCoins: 130,
    rewardAttrPoints: 2,
  },
};

export const SIDE_QUEST_LIST: SideQuestDef[] = Object.values(SIDE_QUESTS);

export const OVERWORLD_NPCS: OverworldNpcDef[] = [
  {
    id: 'npc_baltazar',
    name: 'Velho Baltazar',
    role: 'Marinheiro Aposentado',
    sprite: 'sailor',
    phaseIndex: 0,
    mapX: 8,
    mapY: 68,
    greeting:
      'Marujo! O segredo do cais é sentir a brisa na garrafa. Prove seu equilíbrio deixando a garrafa em pé!',
    completedLine:
      'Pelas barbas da âncora! Você domina a garrafa como os velhos mestres do porto!',
    questId: 'quest_marujo_equilibrio',
  },
  {
    id: 'npc_hortensia',
    name: 'Dona Hortênsia',
    role: 'Herbalista da Feira',
    sprite: 'spice_vendor',
    phaseIndex: 1,
    mapX: 38,
    mapY: 59,
    greeting:
      'Os capangas do Rei aumentaram os impostos das especiarias. Só um Carrollo Perfeito devolve o respeito à praça!',
    completedLine:
      'Que golpe limpo e ardente! Tome estas rolhas douradas para fortalecer seu lutador!',
    questId: 'quest_feira_perfeitos',
  },
  {
    id: 'npc_joca',
    name: 'Joca das Antenas',
    role: 'Vigia dos Telhados',
    sprite: 'mechanic',
    phaseIndex: 2,
    mapX: 73,
    mapY: 70,
    greeting:
      'Aqui em cima quem não bloqueia cai da laje! Treine seu Contra-Carrollo na hora exata do impacto.',
    completedLine:
      'Reflexo de gato! Nenhum capanga de Karrolo vai te pegar desprevenido!',
    questId: 'quest_telhados_contras',
  },
  {
    id: 'npc_sofia',
    name: 'Cronista Sofia',
    role: 'Historiadora Rebelde',
    sprite: 'chronicler',
    phaseIndex: 3,
    mapX: 70,
    mapY: 25,
    greeting:
      'Estou registrando a queda da tirania de Karrolo. Liberte os distritos da cidade para inspirar novos duelistas!',
    completedLine:
      'Seu nome já ecoa por toda a cidadela! Leve este reforço antes de encarar o castelo!',
    questId: 'quest_cidadela_libertacao',
  },
];

export const OVERWORLD_SHOPS: OverworldShopDef[] = [
  {
    id: 'shop_cais',
    name: 'Barraca do Cais',
    keeperName: 'Mestre Rolha',
    sprite: 'sailor',
    phaseIndex: 0,
    mapX: 27,
    mapY: 72,
    accentColor: '#0284C7',
    greeting: 'Suprimentos frescos do porto! Troque suas Rolhas Douradas por melhorias reais.',
    items: [
      {
        id: 'cais_foco_elixir',
        name: 'Elixir de Foco',
        description: '+1 Ponto de Atributo imediato para o lutador selecionado.',
        cost: 55,
        reward: { kind: 'attr_point', amount: 1 },
      },
      {
        id: 'cais_chumbo_manual',
        name: 'Guia Tático do Porto',
        description: '+6 usos de treino na habilidade Tática equipada.',
        cost: 40,
        reward: { kind: 'skill_xp', category: 'TATICA', uses: 6 },
      },
      {
        id: 'cais_amuleto_sorte',
        name: 'Tampinha da Sorte',
        description: '+1 de Sorte permanente no lutador ativo (compra única).',
        cost: 80,
        oneTime: true,
        reward: { kind: 'bonus_attr', attr: 'sorte', amount: 1 },
      },
    ],
  },
  {
    id: 'shop_feira',
    name: 'Bazar da Pimenta',
    keeperName: 'Tia Malagueta',
    sprite: 'spice_vendor',
    phaseIndex: 1,
    mapX: 48,
    mapY: 88,
    accentColor: '#EA580C',
    greeting: 'Temperos fortes e manuais de duelo! Turbine sua velocidade e ataque.',
    items: [
      {
        id: 'feira_pimenta_turbo',
        name: 'Pimenta Turbo',
        description: '+1 de Velocidade permanente no lutador ativo (compra única).',
        cost: 85,
        oneTime: true,
        reward: { kind: 'bonus_attr', attr: 'velocidade', amount: 1 },
      },
      {
        id: 'feira_manual_ofensivo',
        name: 'Pergaminho Ofensivo',
        description: '+6 usos de treino na habilidade Ofensiva equipada.',
        cost: 45,
        reward: { kind: 'skill_xp', category: 'OFENSIVA', uses: 6 },
      },
      {
        id: 'feira_kit_campeao',
        name: 'Kit de Treino Duplo',
        description: '+2 Pontos de Atributo para distribuir no lutador ativo.',
        cost: 105,
        reward: { kind: 'attr_point', amount: 2 },
      },
    ],
  },
  {
    id: 'shop_estacao',
    name: 'Oficina dos Trilhos',
    keeperName: 'Engenheiro Paco',
    sprite: 'mechanic',
    phaseIndex: 3,
    mapX: 46,
    mapY: 43,
    accentColor: '#475569',
    greeting: 'Peças blindadas para resistir ao Castelo Real! Invista na sua defesa.',
    items: [
      {
        id: 'estacao_placa_aco',
        name: 'Blindagem de Aço',
        description: '+1 de Resistência permanente no lutador ativo (compra única).',
        cost: 90,
        oneTime: true,
        reward: { kind: 'bonus_attr', attr: 'resistencia', amount: 1 },
      },
      {
        id: 'estacao_celula_energia',
        name: 'Bateria de Rolha',
        description: '+1 de Energia permanente no lutador ativo (compra única).',
        cost: 90,
        oneTime: true,
        reward: { kind: 'bonus_attr', attr: 'energia', amount: 1 },
      },
      {
        id: 'estacao_manual_defesa',
        name: 'Tratado de Defesa',
        description: '+6 usos de treino na habilidade Defensiva equipada.',
        cost: 45,
        reward: { kind: 'skill_xp', category: 'DEFENSIVA', uses: 6 },
      },
    ],
  },
];

export function getSideQuestProgress(save: SaveData, quest: SideQuestDef): number {
  switch (quest.metric) {
    case 'bottle_uprights':
      return save.achievementStats.totalBottleUprights || 0;
    case 'perfect_hits':
      return save.achievementStats.totalPerfects || 0;
    case 'counter_hits':
      return save.achievementStats.totalCounters || 0;
    case 'story_wins':
      return save.completedLevels.length;
  }
}
