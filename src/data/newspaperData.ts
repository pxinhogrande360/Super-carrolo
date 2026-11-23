import { BIOMES } from '../canvas/biomeRenderer';
import { ArenaBiomeId, BattleChronicleEntry, SaveData } from '../types/game';
import { CHARACTERS } from './gameData';

export interface NewspaperStory {
  id: string;
  kicker: string;
  headline: string;
  subhead: string;
  body: string;
  byline: string;
  biomeLabel: string;
  timeAgo: string;
  badge?: string;
}

export interface CityNewspaperEdition {
  editionNumber: number;
  dateLabel: string;
  shortBannerHeadline: string;
  shortBannerTag: string;
  leadStory: NewspaperStory;
  secondaryStories: NewspaperStory[];
  marketQuotes: { label: string; value: string; trend: string }[];
}

function formatRelativeMinutes(ts: number): string {
  const diffMin = Math.max(1, Math.floor((Date.now() - ts) / 60000));
  if (diffMin < 60) return `Há ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Há ${diffHours}h`;
  return `Há ${Math.floor(diffHours / 24)}d`;
}

function buildStoryFromChronicle(entry: BattleChronicleEntry, idx: number): NewspaperStory {
  const p1Name = CHARACTERS[entry.p1CharId]?.name || 'Desafiante';
  const biome = BIOMES[entry.arenaBiome] || BIOMES.docks;
  const oppName = entry.p2Name;
  const timeAgo = formatRelativeMinutes(entry.timestamp);

  if (
    entry.won &&
    (entry.p2CharId === 'knight' || entry.p2CharId === 'karrolo') &&
    entry.isBoss
  ) {
    const beatenBoss = entry.p2CharId === 'knight' ? 'THE KNIGHT' : 'O REI KARROLO';
    return {
      id: entry.id,
      kicker: 'EDIÇÃO EXTRAORDINÁRIA · QUEDA DA CIDADELA',
      headline: `${p1Name.toUpperCase()} DERRUBA ${beatenBoss}!`,
      subhead: `Com ${entry.perfectCount} Carrollos Perfeitos na Cidadela Real, a guarda blindada caiu diante da garrafa de ${p1Name}.`,
      body: `Multidões invadiram a praça após a queda do chefe supremo em ${biome.name}. Testemunhas juram ter visto o cascudo decisivo rachar o elmo antes dos ${entry.score} pontos finais.`,
      byline: 'Por Cronista Raul · Plantão Real',
      biomeLabel: biome.district,
      timeAgo,
      badge: 'MANCHETE HISTÓRICA',
    };
  }

  if (entry.won && entry.isBoss) {
    return {
      id: entry.id,
      kicker: 'VITÓRIA DE CHEFE · DISTRITO LIBERTADO',
      headline: `${p1Name} derrota ${oppName} em ${biome.name}!`,
      subhead: !entry.tookDamage
        ? 'Atuação impecável sem sofrer um único arranhão deixa plateia boquiaberta.'
        : `Sequência máxima de ${Math.max(1, entry.maxPerfectStreak)} acertos garante festa popular nas ruas.`,
      body: `Após um duelo intenso sob aplausos locais, ${p1Name} desequilibrou a defesa de ${oppName}. Comerciantes do bairro comemoraram distribuindo rolhas extras aos presentes.`,
      byline: 'Por Gazeta do Bairro',
      biomeLabel: biome.name,
      timeAgo,
      badge: !entry.tookDamage ? 'SEM DANO' : 'CHEFE VENCIDO',
    };
  }

  if (entry.mode === 'ARCADE') {
    const wave = entry.arcadeWave || 1;
    return {
      id: entry.id,
      kicker: `CIRCUITO ARCADE · ONDA ${wave}`,
      headline: entry.won
        ? `${p1Name} avança na Onda ${wave} somando ${entry.score} pts!`
        : `Sequência de ${p1Name} para na Onda ${wave} diante de ${oppName}.`,
      subhead: `Arena escolhida: ${biome.name} (${entry.perfectCount} Carrollos Perfeitos registrados).`,
      body: entry.won
        ? `Os fiscais do torneio quase ficaram sem papel para anotar o multiplicador de combo durante a exibição em ${biome.district}.`
        : `Apesar da derrota apertada contra ${oppName}, especialistas apostam em retorno imediato de ${p1Name} ao pódio.`,
      byline: 'Por Coluna Esportiva do Giro',
      biomeLabel: biome.name,
      timeAgo,
      badge: entry.won ? `ONDA ${wave}` : 'REVANCHE',
    };
  }

  if (entry.won) {
    return {
      id: entry.id,
      kicker: idx === 0 ? 'PLANTÃO DA ARENA' : 'CRÔNICA DE COMBATE',
      headline: `${p1Name} supera ${oppName} em duelo elétrico!`,
      subhead: `${entry.perfectCount} perfeitos e ${entry.score} pontos cravados diante de ${biome.name}.`,
      body: `${oppName} ainda tentou segurar o ritmo, mas a garrafa de ${p1Name} parou em pé sob forte torcida. Guardas reais já revisam as câmeras do coreto.`,
      byline: 'Por Repórter Mirim da Praça',
      biomeLabel: biome.name,
      timeAgo,
      badge: entry.counterCount > 0 ? 'AMORTECIMENTO RARO' : 'VITÓRIA',
    };
  }

  return {
    id: entry.id,
    kicker: 'TROPEÇO NA PRAÇA',
    headline: `${oppName} segura a investida de ${p1Name} em ${biome.name}`,
    subhead: 'Garrafa tombada muda o rumo do duelo; desafiante promete revanche imediata.',
    body: `Especialistas apontam que um milímetro no anel de precisão fez toda a diferença no desfecho em ${biome.district}. Os treinos já recomeçaram na banca de rolhas.`,
    byline: 'Por Observador das Docas',
    biomeLabel: biome.name,
    timeAgo,
    badge: 'REVANCHE',
  };
}

function getFallbackCityStories(save: SaveData): NewspaperStory[] {
  const activeName = CHARACTERS[save.selectedCharId]?.name || 'Léo';
  const progressCount = save.completedLevels.length;

  const dispatches: NewspaperStory[] = [
    {
      id: 'lore_bosses_council',
      kicker: 'ALERTA DOS 5 CHEFES',
      headline: 'Rich Boss, Boss Lady, Clown, Big Boss e The Knight fecham os distritos!',
      subhead: 'Conselho dos Chefes exige duelo limpo antes de liberar as chaves de cada bairro.',
      body: 'Do cais comandado pelo Milionário até os vitrais protegidos pelo Cavaleiro Supremo, desafiantes precisarão de cascudos certeiros e pulso firme na garrafa.',
      byline: 'Por Redação Central',
      biomeLabel: 'Cidadela Real',
      timeAgo: 'Edição Matinal',
    },
    {
      id: 'lore_nina_lab',
      kicker: 'CIÊNCIA & TORQUE',
      headline: 'Nina Tática mede ângulo ideal para o Carrollo Perfeito',
      subhead: 'Engenheira garante que respirar fundo antes do anel verde aumenta a precisão.',
      body: 'Equipada com transferidor e giz de cera, Nina analisou 400 arremessos no Cais do Porto antes de afirmar: "O segredo não é força, é charme no pulso."',
      byline: 'Por Caderno Técnico',
      biomeLabel: 'Docas da Cidade',
      timeAgo: 'Ontem',
    },
    {
      id: 'lore_brasa_feira',
      kicker: 'CULINÁRIA DE COMBATE',
      headline: 'Feira da Pimenta registra falta de água após visita da Boss Lady',
      subhead: 'Garrafa temperada de Dona Brasa divide atenções com os coques certeiros da Dama da Praça.',
      body: 'Clientes elogiaram o espetáculo visual, embora dois guarda-sóis tenham precisado de baldes d’água durante a demonstração vespertina.',
      byline: 'Por Correspondente do Bazar',
      biomeLabel: 'Bazar das Especiarias',
      timeAgo: '2 dias atrás',
    },
    {
      id: 'lore_mola_ferro',
      kicker: 'CURIOSIDADES DO BAIRRO',
      headline:
        progressCount > 0
          ? `${activeName} já soma ${save.totalWins} vitórias na campanha popular!`
          : `Rumores apontam que ${activeName} prepara desafio aberto nas Docas`,
      subhead:
        'Beto Mola evita armadilhas de The Clown nos telhados enquanto Big Boss vigia a Estação.',
      body: 'Apostadores da cidade acompanham cada giro de garrafa pelos cinco bairros enquanto os novos chefes testam o fôlego dos competidores.',
      byline: 'Por Cronista Raul',
      biomeLabel: 'Bairro Noturno',
      timeAgo: 'Arquivo da Praça',
    },
  ];

  return dispatches;
}

export function generateCityNewspaper(save: SaveData): CityNewspaperEdition {
  const chronicle = Array.isArray(save.battleChronicle) ? save.battleChronicle : [];
  const editionNumber = 104 + save.totalWins + chronicle.length;
  const activeName = CHARACTERS[save.selectedCharId]?.name || 'Léo';

  const chronicleStories = chronicle.map((entry, idx) => buildStoryFromChronicle(entry, idx));
  const fallbackStories = getFallbackCityStories(save);

  const leadStory: NewspaperStory =
    chronicleStories[0] || {
      id: 'inaugural_lead',
      kicker: 'EDIÇÃO DE HOJE · CIDADE EM ALERTA',
      headline: `${activeName.toUpperCase()} ENCARA OS 5 NOVOS CHEFES DA CIDADE!`,
      subhead:
        'Rich Boss, Boss Lady, Clown, Big Boss e The Knight assumiram os pontos-chave de cada distrito.',
      body: `Mesmo sob o olhar atento dos cinco chefes, o espírito de duelo voltou às ruas. Entre na arena, equilibre a garrafa em pé e faça história nas próximas edições do Jornal da Cidade.`,
      byline: 'Por Cronista Raul · Editor-Chefe',
      biomeLabel: 'Praça Central',
      timeAgo: 'Agora',
      badge: 'ED. INAUGURAL',
    };

  const secondaryStories = [
    ...chronicleStories.slice(1, 3),
    ...fallbackStories,
  ].slice(0, 4);

  const latest = chronicle[0];
  let shortBannerHeadline: string;
  let shortBannerTag = 'JORNAL DA CIDADE';

  if (latest) {
    const p1Name = CHARACTERS[latest.p1CharId]?.name || activeName;
    const biomeName = (BIOMES[latest.arenaBiome as ArenaBiomeId] || BIOMES.docks).name;
    if (
      latest.won &&
      (latest.p2CharId === 'knight' || latest.p2CharId === 'karrolo') &&
      latest.isBoss
    ) {
      shortBannerTag = 'EXTRA!';
      shortBannerHeadline = `${p1Name} derrota ${latest.p2Name} em ${biomeName}! Cidade em festa!`;
    } else if (latest.won) {
      shortBannerTag = latest.isBoss ? 'VITÓRIA ÉPICA' : 'ÚLTIMA HORA';
      shortBannerHeadline = `${p1Name} vence ${latest.p2Name} em ${biomeName} (${latest.score} pts)!`;
    } else {
      shortBannerTag = 'PLANTÃO';
      shortBannerHeadline = `${latest.p2Name} segura ${p1Name} em ${biomeName} — revanche à vista!`;
    }
  } else if (save.arcadeHighScore > 0) {
    shortBannerHeadline = `Recorde no Arcade chega a ${save.arcadeHighScore} pts e agita a Praça Central!`;
  } else {
    shortBannerHeadline = `Os 5 novos Chefes dominam os bairros; ${activeName} promete resposta nas Docas!`;
  }

  return {
    editionNumber,
    dateLabel: `Edição nº ${editionNumber} · Folha Independente`,
    shortBannerHeadline,
    shortBannerTag,
    leadStory,
    secondaryStories,
    marketQuotes: [
      {
        label: 'Rolha Dourada',
        value: `${Math.max(10, save.coins)} un.`,
        trend: save.totalWins > 0 ? '▲ Em alta' : '● Estável',
      },
      {
        label: 'Garrafas em Pé',
        value: `${save.achievementStats.totalBottleUprights}`,
        trend: '▲ Recorde local',
      },
      {
        label: 'Pimenta da Feira',
        value: 'Picante +3',
        trend: '▲ Dona Brasa aprova',
      },
    ],
  };
}
