import { ArenaBiomeId, Attributes } from '../types/game';

export type ArenaConditionId =
  | 'ar_estavel'
  | 'brisa_pier'
  | 'mare_instavel'
  | 'chuva_costeira'
  | 'neblina_mar'
  | 'termica_pimenta'
  | 'rajada_bazar'
  | 'poeira_feira'
  | 'mesa_oleosa'
  | 'ventania_noturna'
  | 'telhado_elastico'
  | 'corrente_turbulenta'
  | 'sereno_frio'
  | 'trem_trilhos'
  | 'jato_vapor'
  | 'fumaca_carvao'
  | 'plataforma_inclinada'
  | 'mesa_encerada'
  | 'corrente_glacial'
  | 'nevasca_densa'
  | 'eco_salao';

export interface ArenaConditionDef {
  id: ArenaConditionId;
  label: string;
  biome: ArenaBiomeId | 'any';
  kind: 'calm' | 'wind' | 'thermal' | 'table' | 'weather';
  shortEffect: string;
  description: string;
  uprightPenalty: number; // base upright probability penalty (0..0.20)
  windForce: number; // horizontal acceleration px/s^2 during bottle flight
  windGustAmp: number; // oscillating wind gust amplitude px/s^2
  windGustFreq: number; // oscillation speed rad/s
  updraft: number; // vertical acceleration offset px/s^2 (negative = lift, positive = heavy air)
  bounceBoost: number; // multiplier on first bounce upward velocity
  slippery: number; // >0 adds horizontal slide after first bounce
  tremor: number; // >0 indicates table vibration / instability
  spinBarSpeedMult: number; // multiplier on spin charge bar oscillation speed
  ringSpeedMult: number; // multiplier on Carrollo timing ring speed
  sweetSpotShift: number; // offset from default 0.68 spin charge sweet spot
}

export const ARENA_CONDITIONS: Record<ArenaConditionId, ArenaConditionDef> = {
  ar_estavel: {
    id: 'ar_estavel',
    label: 'Ar Estável',
    biome: 'any',
    kind: 'calm',
    shortEffect: 'Sem interferência',
    description: 'Ambiente calmo e mesa nivelada: o giro depende só da sua técnica.',
    uprightPenalty: 0,
    windForce: 0,
    windGustAmp: 0,
    windGustFreq: 0,
    updraft: 0,
    bounceBoost: 1,
    slippery: 0,
    tremor: 0,
    spinBarSpeedMult: 1,
    ringSpeedMult: 1,
    sweetSpotShift: 0,
  },
  // --- DOCAS (DOCKS) ---
  brisa_pier: {
    id: 'brisa_pier',
    label: 'Brisa do Píer',
    biome: 'docks',
    kind: 'wind',
    shortEffect: 'Vento → (-10%)',
    description: 'Vento marítimo empurra a garrafa para o lado durante o voo. Velocidade reduz o desvio.',
    uprightPenalty: 0.1,
    windForce: 75,
    windGustAmp: 25,
    windGustFreq: 6,
    updraft: 0,
    bounceBoost: 1,
    slippery: 0,
    tremor: 0,
    spinBarSpeedMult: 1,
    ringSpeedMult: 1,
    sweetSpotShift: 0,
  },
  mare_instavel: {
    id: 'mare_instavel',
    label: 'Maré Instável',
    biome: 'docks',
    kind: 'table',
    shortEffect: 'Mesa inclina (-12%)',
    description: 'O balanço do cais inclina a mesa e desloca o ponto ideal do giro.',
    uprightPenalty: 0.12,
    windForce: 0,
    windGustAmp: 0,
    windGustFreq: 0,
    updraft: 0,
    bounceBoost: 1.08,
    slippery: 0,
    tremor: 1,
    spinBarSpeedMult: 1.08,
    ringSpeedMult: 1,
    sweetSpotShift: 0.06,
  },
  chuva_costeira: {
    id: 'chuva_costeira',
    label: 'Chuva no Cais',
    biome: 'docks',
    kind: 'weather',
    shortEffect: 'Mesa molhada (-13%)',
    description: 'Respingos deixam a madeira escorregadia e o ar mais pesado no pouso.',
    uprightPenalty: 0.13,
    windForce: -35,
    windGustAmp: 0,
    windGustFreq: 0,
    updraft: 110,
    bounceBoost: 0.92,
    slippery: 1,
    tremor: 0,
    spinBarSpeedMult: 1,
    ringSpeedMult: 1.06,
    sweetSpotShift: -0.03,
  },
  neblina_mar: {
    id: 'neblina_mar',
    label: 'Neblina Salgada',
    biome: 'docks',
    kind: 'weather',
    shortEffect: 'Ar denso (-9%)',
    description: 'Umidade do mar deixa a garrafa pesada na descida e exige giro firme.',
    uprightPenalty: 0.09,
    windForce: 20,
    windGustAmp: 15,
    windGustFreq: 4,
    updraft: 140,
    bounceBoost: 0.9,
    slippery: 0,
    tremor: 0,
    spinBarSpeedMult: 0.94,
    ringSpeedMult: 1.08,
    sweetSpotShift: 0.04,
  },
  // --- BAZAR (MARKET) ---
  termica_pimenta: {
    id: 'termica_pimenta',
    label: 'Térmica da Pimenta',
    biome: 'market',
    kind: 'thermal',
    shortEffect: 'Ar quente ↑ (-9%)',
    description: 'Correntes quentes das especiarias sustentam a garrafa no ar por mais tempo.',
    uprightPenalty: 0.09,
    windForce: 0,
    windGustAmp: 0,
    windGustFreq: 0,
    updraft: -150,
    bounceBoost: 1,
    slippery: 0,
    tremor: 0,
    spinBarSpeedMult: 1,
    ringSpeedMult: 1,
    sweetSpotShift: 0,
  },
  rajada_bazar: {
    id: 'rajada_bazar',
    label: 'Rajada do Bazar',
    biome: 'market',
    kind: 'wind',
    shortEffect: 'Vento ← (-11%)',
    description: 'Vento entre as tendas desacelera o lançamento da garrafa. Velocidade compensa.',
    uprightPenalty: 0.11,
    windForce: -85,
    windGustAmp: 30,
    windGustFreq: 7,
    updraft: 0,
    bounceBoost: 1,
    slippery: 0,
    tremor: 0,
    spinBarSpeedMult: 1.06,
    ringSpeedMult: 1,
    sweetSpotShift: -0.04,
  },
  poeira_feira: {
    id: 'poeira_feira',
    label: 'Poeira das Tendas',
    biome: 'market',
    kind: 'weather',
    shortEffect: 'Carga rápida (-11%)',
    description: 'Poeira no ar acelera o ritmo da barra de giro e exige mais Precisão.',
    uprightPenalty: 0.11,
    windForce: 45,
    windGustAmp: 20,
    windGustFreq: 5,
    updraft: -40,
    bounceBoost: 1,
    slippery: 0,
    tremor: 0,
    spinBarSpeedMult: 1.18,
    ringSpeedMult: 1.08,
    sweetSpotShift: 0.03,
  },
  mesa_oleosa: {
    id: 'mesa_oleosa',
    label: 'Óleo de Especiaria',
    biome: 'market',
    kind: 'table',
    shortEffect: 'Base lisa (-13%)',
    description: 'Mesa engordurada faz a garrafa deslizar no primeiro toque.',
    uprightPenalty: 0.13,
    windForce: 0,
    windGustAmp: 0,
    windGustFreq: 0,
    updraft: 0,
    bounceBoost: 1,
    slippery: 1,
    tremor: 0,
    spinBarSpeedMult: 1,
    ringSpeedMult: 1,
    sweetSpotShift: 0.05,
  },
  // --- TELHADOS (ROOFTOPS) ---
  ventania_noturna: {
    id: 'ventania_noturna',
    label: 'Ventania Noturna',
    biome: 'rooftops',
    kind: 'wind',
    shortEffect: 'Vento forte ← (-15%)',
    description: 'Rajadas de altitude nos telhados desviam o giro da garrafa.',
    uprightPenalty: 0.15,
    windForce: -115,
    windGustAmp: 45,
    windGustFreq: 8,
    updraft: -45,
    bounceBoost: 1,
    slippery: 0,
    tremor: 0,
    spinBarSpeedMult: 1.08,
    ringSpeedMult: 1.05,
    sweetSpotShift: 0,
  },
  telhado_elastico: {
    id: 'telhado_elastico',
    label: 'Quique Elástico',
    biome: 'rooftops',
    kind: 'table',
    shortEffect: 'Quique alto (-12%)',
    description: 'Superfície tensa faz a garrafa quicar mais alto antes da queda final.',
    uprightPenalty: 0.12,
    windForce: 0,
    windGustAmp: 0,
    windGustFreq: 0,
    updraft: 0,
    bounceBoost: 1.34,
    slippery: 0,
    tremor: 0,
    spinBarSpeedMult: 1,
    ringSpeedMult: 1,
    sweetSpotShift: 0,
  },
  corrente_turbulenta: {
    id: 'corrente_turbulenta',
    label: 'Turbulência Alta',
    biome: 'rooftops',
    kind: 'wind',
    shortEffect: 'Rajada variável (-14%)',
    description: 'Redemoinhos mudam a força do vento em pleno voo da garrafa.',
    uprightPenalty: 0.14,
    windForce: 30,
    windGustAmp: 120,
    windGustFreq: 9,
    updraft: -70,
    bounceBoost: 1.06,
    slippery: 0,
    tremor: 0,
    spinBarSpeedMult: 1.12,
    ringSpeedMult: 1.06,
    sweetSpotShift: -0.05,
  },
  sereno_frio: {
    id: 'sereno_frio',
    label: 'Sereno Escorregadio',
    biome: 'rooftops',
    kind: 'weather',
    shortEffect: 'Orvalho na mesa (-11%)',
    description: 'Orvalho noturno deixa a base da garrafa lisa ao pousar nas telhas.',
    uprightPenalty: 0.11,
    windForce: -40,
    windGustAmp: 0,
    windGustFreq: 0,
    updraft: 60,
    bounceBoost: 0.96,
    slippery: 1,
    tremor: 0,
    spinBarSpeedMult: 1,
    ringSpeedMult: 1,
    sweetSpotShift: 0.04,
  },
  // --- ESTAÇÃO (STATION) ---
  trem_trilhos: {
    id: 'trem_trilhos',
    label: 'Trem nos Trilhos',
    biome: 'station',
    kind: 'table',
    shortEffect: 'Vibração forte (-13%)',
    description: 'Locomotiva passando treme a plataforma e exige mais Resistência no pouso.',
    uprightPenalty: 0.13,
    windForce: 0,
    windGustAmp: 25,
    windGustFreq: 12,
    updraft: 0,
    bounceBoost: 1.18,
    slippery: 0,
    tremor: 1,
    spinBarSpeedMult: 1.12,
    ringSpeedMult: 1.06,
    sweetSpotShift: -0.06,
  },
  jato_vapor: {
    id: 'jato_vapor',
    label: 'Jato de Vapor',
    biome: 'station',
    kind: 'thermal',
    shortEffect: 'Vapor ↑ + Vento (-13%)',
    description: 'Escapamento de vapor empurra a garrafa para cima e para frente.',
    uprightPenalty: 0.13,
    windForce: 90,
    windGustAmp: 35,
    windGustFreq: 6,
    updraft: -125,
    bounceBoost: 1,
    slippery: 0,
    tremor: 0,
    spinBarSpeedMult: 1,
    ringSpeedMult: 1.05,
    sweetSpotShift: 0,
  },
  fumaca_carvao: {
    id: 'fumaca_carvao',
    label: 'Fumaça Densa',
    biome: 'station',
    kind: 'weather',
    shortEffect: 'Anel rápido (-10%)',
    description: 'Fuligem na estação acelera levemente o fechamento do anel de Carrollo.',
    uprightPenalty: 0.1,
    windForce: -45,
    windGustAmp: 0,
    windGustFreq: 0,
    updraft: 85,
    bounceBoost: 1,
    slippery: 0,
    tremor: 0,
    spinBarSpeedMult: 1.05,
    ringSpeedMult: 1.14,
    sweetSpotShift: 0.03,
  },
  plataforma_inclinada: {
    id: 'plataforma_inclinada',
    label: 'Plataforma Torta',
    biome: 'station',
    kind: 'table',
    shortEffect: 'Deslize + Tremor (-14%)',
    description: 'Desnível metálico da plataforma faz a garrafa escorregar e tremer.',
    uprightPenalty: 0.14,
    windForce: 35,
    windGustAmp: 0,
    windGustFreq: 0,
    updraft: 0,
    bounceBoost: 1.1,
    slippery: 1,
    tremor: 1,
    spinBarSpeedMult: 1,
    ringSpeedMult: 1,
    sweetSpotShift: 0.06,
  },
  // --- CASTELO (CASTLE) ---
  mesa_encerada: {
    id: 'mesa_encerada',
    label: 'Mesa Encerada',
    biome: 'castle',
    kind: 'table',
    shortEffect: 'Piso escorregadio (-13%)',
    description: 'Madeira real polida faz a garrafa deslizar após o primeiro toque.',
    uprightPenalty: 0.13,
    windForce: 0,
    windGustAmp: 0,
    windGustFreq: 0,
    updraft: 0,
    bounceBoost: 1,
    slippery: 1,
    tremor: 0,
    spinBarSpeedMult: 1,
    ringSpeedMult: 1.04,
    sweetSpotShift: 0.05,
  },
  corrente_glacial: {
    id: 'corrente_glacial',
    label: 'Corrente Glacial',
    biome: 'castle',
    kind: 'wind',
    shortEffect: 'Vento gélido → (-14%)',
    description: 'Ventos da montanha atravessam o salão do castelo e desestabilizam a garrafa.',
    uprightPenalty: 0.14,
    windForce: 108,
    windGustAmp: 45,
    windGustFreq: 7,
    updraft: 0,
    bounceBoost: 1,
    slippery: 0,
    tremor: 0,
    spinBarSpeedMult: 1.08,
    ringSpeedMult: 1.06,
    sweetSpotShift: -0.04,
  },
  nevasca_densa: {
    id: 'nevasca_densa',
    label: 'Nevasca Real',
    biome: 'castle',
    kind: 'weather',
    shortEffect: 'Peso + Rajada (-16%)',
    description: 'Neve pesada e vento cruzado tornam o equilíbrio em pé um desafio de mestre.',
    uprightPenalty: 0.16,
    windForce: -80,
    windGustAmp: 75,
    windGustFreq: 8,
    updraft: 150,
    bounceBoost: 0.9,
    slippery: 1,
    tremor: 0,
    spinBarSpeedMult: 1.14,
    ringSpeedMult: 1.1,
    sweetSpotShift: -0.05,
  },
  eco_salao: {
    id: 'eco_salao',
    label: 'Pressão do Trono',
    biome: 'castle',
    kind: 'table',
    shortEffect: 'Quique + Ritmo (-12%)',
    description: 'Ressonância do salão real altera o quique da garrafa e o ritmo de disparo.',
    uprightPenalty: 0.12,
    windForce: 0,
    windGustAmp: 0,
    windGustFreq: 0,
    updraft: -60,
    bounceBoost: 1.26,
    slippery: 0,
    tremor: 1,
    spinBarSpeedMult: 1.15,
    ringSpeedMult: 1.1,
    sweetSpotShift: 0.05,
  },
};

const BIOME_CONDITION_POOL: Record<ArenaBiomeId, ArenaConditionId[]> = {
  docks: ['brisa_pier', 'mare_instavel', 'chuva_costeira', 'neblina_mar'],
  market: ['termica_pimenta', 'rajada_bazar', 'poeira_feira', 'mesa_oleosa'],
  rooftops: ['ventania_noturna', 'telhado_elastico', 'corrente_turbulenta', 'sereno_frio'],
  station: ['trem_trilhos', 'jato_vapor', 'fumaca_carvao', 'plataforma_inclinada'],
  castle: ['mesa_encerada', 'corrente_glacial', 'nevasca_densa', 'eco_salao'],
};

export function rollArenaCondition(biomeId: ArenaBiomeId): ArenaConditionDef {
  // ~20% chance of calm air so turns keep natural pacing
  if (Math.random() < 0.2) {
    return ARENA_CONDITIONS.ar_estavel;
  }
  const pool = BIOME_CONDITION_POOL[biomeId] || BIOME_CONDITION_POOL.docks;
  const id = pool[Math.floor(Math.random() * pool.length)];
  return ARENA_CONDITIONS[id];
}

export function computeConditionMitigation(
  cond: ArenaConditionDef,
  attackerAttrs: Attributes,
  bottleMagnet: boolean
): { effectivePenalty: number; sweetSpotTarget: number } {
  let mitigation = 0;

  if (Math.abs(cond.windForce) > 0 || cond.windGustAmp > 0) {
    mitigation += Math.min(0.42, attackerAttrs.velocidade * 0.032);
  }
  if (cond.tremor > 0 || cond.slippery > 0) {
    mitigation += Math.min(0.42, attackerAttrs.resistencia * 0.032);
  }
  if (cond.updraft !== 0 || cond.bounceBoost !== 1 || cond.kind === 'weather') {
    mitigation += Math.min(0.42, attackerAttrs.sorte * 0.032);
  }

  mitigation = Math.min(0.68, mitigation);

  let effectivePenalty = cond.uprightPenalty * (1 - mitigation);
  if (bottleMagnet) {
    effectivePenalty *= 0.35;
  }

  const sweetSpotTarget = Math.max(0.42, Math.min(0.86, 0.68 + cond.sweetSpotShift));
  return {
    effectivePenalty: Math.max(0, effectivePenalty),
    sweetSpotTarget,
  };
}
