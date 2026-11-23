import { ActiveBattleConfig, ArenaBiomeId } from '../types/game';

export interface BattleLoreTip {
  id: string;
  tag: string;
  text: string;
  biome?: ArenaBiomeId;
  charId?: string;
}

export const BATTLE_LORE_TIPS: BattleLoreTip[] = [
  // Bioma: Cais do Porto
  {
    id: 'dock_seagulls',
    tag: 'LORE DO CAIS',
    biome: 'docks',
    text: 'As gaivotas do Cais só respeitam quem acerta Carrollo Perfeito. Quem derruba a garrafa paga o peixe.',
  },
  {
    id: 'dock_wood',
    tag: 'SEGREDOS DA MADEIRA',
    biome: 'docks',
    text: 'As tábuas do píer balançam quando chove, mas o segredo para a garrafa parar em pé é não espirrar durante o giro.',
  },
  // Bioma: Feira da Pimenta
  {
    id: 'market_pepper',
    tag: 'DICA PICANTE',
    biome: 'market',
    text: 'Dona Brasa garante que três gotas de pimenta malagueta na base da garrafa dão +10 de estilo (não tente em casa).',
  },
  {
    id: 'market_tents',
    tag: 'BAZAR CENTRAL',
    biome: 'market',
    text: 'Se a sua garrafa quicar na barraca de alho, vale ponto artístico, mas não conta dano na barra do rival.',
  },
  // Bioma: Telhados Elásticos
  {
    id: 'roof_antennas',
    tag: 'ALERTA NOS TELHADOS',
    biome: 'rooftops',
    text: 'Beto Mola já perdeu sete garrafas em antenas de TV vizinhas. Felizmente todas voltaram quicando.',
  },
  {
    id: 'roof_neon',
    tag: 'BAIRRO NOTURNO',
    biome: 'rooftops',
    text: 'Os letreiros neon piscam mais rápido toda vez que alguém encaixa um combo acima de 3x!',
  },
  // Bioma: Estação Ferroviária
  {
    id: 'station_steam',
    tag: 'REGRA DOS TRILHOS',
    biome: 'station',
    text: 'Capitão Ferro inspeciona cada garrafa com paquímetro antes do apito do trem. Nada de fundo magnético escondido!',
  },
  {
    id: 'station_ticket',
    tag: 'BILHETERIA REAL',
    biome: 'station',
    text: 'O trem das 18h só atrasa quando alguém acerta um Carrollo Crítico perto da caldeira.',
  },
  // Bioma: Castelo do Rei Karrolo
  {
    id: 'castle_crown',
    tag: 'ARQUIVO DO TRONO',
    biome: 'castle',
    text: 'Rei Karrolo proibiu garrafas quadradas no reino após ser derrotado por um garrafão térmico em 1998.',
  },
  {
    id: 'castle_carpet',
    tag: 'ETIQUETA REAL',
    biome: 'castle',
    text: 'Se derrubar suco no tapete vermelho do trono, a multa é o dobro. Acerte o anel verde para evitar bronca!',
  },
  // Personagens
  {
    id: 'char_leo',
    tag: 'CURIOSIDADE · LÉO',
    charId: 'leo',
    text: 'Léo aprendeu a equilibrar garrafas sem tirar as mãos dos bolsos do moletom preto.',
  },
  {
    id: 'char_nina',
    tag: 'FÍSICA DE NINA',
    charId: 'nina',
    text: 'Segundo os cadernos de Nina Tática, 98% das garrafas tombam por falta de confiança no dedão.',
  },
  {
    id: 'char_brasa',
    tag: 'SEGREDO DE BRASA',
    charId: 'brasa',
    text: 'Nunca chame a garrafa de Dona Brasa de "morna". O último guarda que disse isso ainda corre pela feira.',
  },
  {
    id: 'char_mola',
    tag: 'TREINO ELÁSTICO',
    charId: 'mola',
    text: 'Beto Mola dorme fazendo alongamento e acorda girando o despertador no ar.',
  },
  {
    id: 'char_ferro',
    tag: 'BLINDAGEM TOTAL',
    charId: 'ferro',
    text: 'A armadura do Capitão Ferro foi forjada com tampinhas recicladas de três gerações de campeões.',
  },
  {
    id: 'char_karrolo',
    tag: 'DECRETO REAL',
    charId: 'karrolo',
    text: 'Diz a lenda que a Garrafa Dourada do Rei Karrolo brilha sempre que alguém erra o timing do anel.',
  },
  {
    id: 'char_rich_boss',
    tag: 'CHEFE · RICH BOSS',
    charId: 'rich_boss',
    text: 'The Rich Boss manda polir sua bengala dourada antes de cada cascudo. Tudo no Cais do Porto tem taxa extra!',
  },
  {
    id: 'char_boss_lady',
    tag: 'CHEFE · BOSS LADY',
    charId: 'boss_lady',
    text: 'The Boss Lady nunca tira os óculos escuros na Feira da Pimenta — nem quando acerta um coque perfeito!',
  },
  {
    id: 'char_clown',
    tag: 'CHEFE · THE CLOWN',
    charId: 'clown',
    text: 'Os sininhos no chapéu de The Clown tocam um segundo antes dele descer o cascudo pelos telhados!',
  },
  {
    id: 'char_big_boss',
    tag: 'CHEFE · BIG BOSS',
    charId: 'big_boss',
    text: 'The Big Boss dobra qualquer garrafa mal apoiada na Estação Ferroviária só com o peso da sua corrente de ouro.',
  },
  {
    id: 'char_knight',
    tag: 'CHEFE FINAL · KNIGHT',
    charId: 'knight',
    text: 'The Knight comanda a Cidadela Real de elmo fechado. Só um Carrollo Perfeito racha essa manopla de aço!',
  },
  // Gerais / Combate
  {
    id: 'gen_cascudo',
    tag: 'ARTE DO COQUE',
    text: 'Um verdadeiro Carrollo desce de cima direto no coco com os nós dos dedos, régua ou bengala — e rende galo instantâneo!',
  },
  {
    id: 'gen_counter',
    tag: 'REFLEXO RARO',
    text: 'Se o botão de Contra-Carrollo aparecer bem na hora do golpe inimigo, toque rápido! Ele é raríssimo e amortece o impacto!',
  },
  {
    id: 'gen_green_zone',
    tag: 'CONSELHO DO CRONISTA',
    text: 'Segurar o giro até a faixa verde não garante milagres, mas até a física da praça dá uma força extra.',
  },
  {
    id: 'gen_combo',
    tag: 'RITMO DE COMBO',
    text: 'Manter a garrafa de pé em turnos seguidos faz o Medidor de Combo esquentar como pipoca em feira!',
  },
  {
    id: 'gen_newspaper',
    tag: 'MEMÓRIA DA PRAÇA',
    text: 'Cuidado com suas falhas críticas: o Cronista Raul está sempre anotando para a próxima capa do Jornal da Cidade!',
  },
];

let lastPickedTipId: string | null = null;

export function pickBattleLoadingTip(
  config: ActiveBattleConfig,
  biomeId: ArenaBiomeId
): BattleLoreTip {
  const candidates = BATTLE_LORE_TIPS.filter((tip) => {
    if (tip.id === lastPickedTipId) return false;
    if (tip.biome && tip.biome === biomeId) return true;
    if (
      tip.charId &&
      (tip.charId === config.player1CharId || tip.charId === config.player2CharId)
    ) {
      return true;
    }
    return !tip.biome && !tip.charId;
  });

  const pool = candidates.length > 0 ? candidates : BATTLE_LORE_TIPS;
  const chosen = pool[Math.floor(Math.random() * pool.length)] || BATTLE_LORE_TIPS[0];
  lastPickedTipId = chosen.id;
  return chosen;
}
