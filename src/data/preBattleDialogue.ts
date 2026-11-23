import { BIOMES } from '../canvas/biomeRenderer';
import { ActiveBattleConfig, ArenaBiomeId } from '../types/game';
import { CHARACTERS } from './gameData';

export interface PreBattleDialogue {
  speakerName: string;
  speakerCharId: string;
  subtitle: string;
  line: string;
  biomeName: string;
}

const BIOME_TAUNTS: Record<ArenaBiomeId, string[]> = {
  docks: [
    'A maré sobe rápido por aqui — e sua garrafa vai pro fundo do cais!',
    'Nem as gaivotas apostam que você aguenta três rodadas neste píer!',
    'O cheiro de maresia já derrubou desafiantes mais teimosos que você!',
  ],
  market: [
    'Segura a língua! Aqui na feira cada Carrollo arde mais que pimenta malagueta!',
    'Entre barracas de tempero, só sobrevive quem tem pulso firme na garrafa!',
    'Cuidado pra não derrubar o cesto de especiarias quando sua garrafa tombar!',
  ],
  rooftops: [
    'Aqui em cima o vento noturno não perdoa quem treme na hora do anel!',
    'Três antenas abaixo e nenhuma rede de segurança. Mostre equilíbrio!',
    'Os letreiros neon iluminam cada falha crítica lá de baixo!',
  ],
  station: [
    'O trem da vitória já apitou — e você ficou sem bilhete na plataforma!',
    'Entre vapor e trilhos de aço, só passa quem segura o tranco sem piscar!',
    'Aqui na Estação Central a pressão da caldeira entorta garrafa fraca!',
  ],
  castle: [
    'Bem-vindo à Cidadela Real. Sua garrafa vai virar troféu de porcelana!',
    'Diante dos vitrais do trono, ousadia sem precisão é derrota certa!',
    'As tochas do castelo não piscam, e minha guarda também não!',
  ],
};

const CHAR_TAUNTS: Record<string, Record<ArenaBiomeId, string>> = {
  leo: {
    docks: 'Crescemos girando garrafas nesse porto. Vamos ver quem manda no cais!',
    market: 'Mesmo no calor da feira, meu Giro Solar não perde o foco!',
    rooftops: 'Lá de cima a vista é ótima para comemorar mais uma vitória!',
    station: 'Nenhum vagão blindado para o ritmo do bairro!',
    castle: 'Cheguei até o castelo e não vou recuar no último giro!',
  },
  nina: {
    docks: 'Calculei a umidade do cais e sua chance de vitória é 0,4%.',
    market: 'Nem a fumaça da pimenta altera minha equação de torque!',
    rooftops: 'Velocidade do vento: 14 nós. Sua derrota: matematicamente inevitável.',
    station: 'Atrito dos trilhos compensado. Pode girar quando quiser!',
    castle: 'Até o trono real obedece às leis da física da garrafa!',
  },
  brasa: {
    docks: 'Vou ferver essa água do porto antes da sua garrafa encostar na mesa!',
    market: 'Minha feira, minhas regras! Vai encarar o Carrollo Apimentado?',
    rooftops: 'Até na brisa noturna das antenas meu tempero pega fogo!',
    station: 'Mais quente que a caldeira da locomotiva — segura essa brasa!',
    castle: 'Hoje o tapete do castelo vai ficar chamuscado!',
  },
  mola: {
    docks: 'Quico melhor que onda no quebra-mar! Tenta acompanhar!',
    market: 'Saltei três tendas de alho só pra te vencer mais rápido!',
    rooftops: 'Esses telhados são meu quintal! Duvida que eu giro no ar?',
    station: 'Pulo por cima do trem e ainda acerto o anel verde rindo!',
    castle: 'Guarda real rígida demais... falta mola no joelho deles!',
  },
  ferro: {
    docks: 'Âncora no chão, guarda alta. Pode bater com força!',
    market: 'Pimenta nenhuma derrete minha armadura de tampinhas!',
    rooftops: 'Peso uma tonelada e não escorrego nem na telha molhada!',
    station: 'Trinta anos guardando esses trilhos. Ninguém fura meu bloqueio!',
    castle: 'Sou a muralha antes da coroa. Tente rachar meu escudo!',
  },
  karrolo: {
    docks: 'Vim pessoalmente conferir por que o porto anda tão barulhento!',
    market: 'Proibi feiras barulhentas — e você está prestes a ser multado!',
    rooftops: 'Mesmo no ponto mais alto da cidade, a sombra da coroa te alcança!',
    station: 'Todos os trilhos levam à derrota diante do Rei!',
    castle: 'Ajoelhe-se diante da Garrafa Dourada! Mostre do que é capaz!',
  },
  rich_boss: {
    docks: 'Este cais inteiro me pertence. Pague o pedágio com sua derrota!',
    market: 'Vim comprar todas as especiarias — e sua garrafa vem de brinde.',
    rooftops: 'Até nos telhados dá pra sentir cheiro de amador sem capital.',
    station: 'Meu vagão privado não espera por quem erra o anel verde!',
    castle: 'Financiei metade da cidadela. Saia do caminho da elite!',
  },
  boss_lady: {
    docks: 'Saí da feira só pra dar um cascudo em quem acha que manda no porto!',
    market: 'Acha que é forte? Na minha praça, um coque meu encerra o expediente!',
    rooftops: 'Suba mais alto se quiser — minha mão ainda alcança sua cabeça!',
    station: 'Entre vapor e aço, quem dita o respeito sou eu!',
    castle: 'Nem a guarda do castelo encara o meu olhar sem suar frio!',
  },
  clown: {
    docks: 'Hahaha! Uma garrafa quicando no píer? Que piada deliciosa!',
    market: 'Mais colorido que pimenta e mil vezes mais traquinas!',
    rooftops: 'Bem-vindo ao meu picadeiro nas nuvens! Cuidado com o cascudo com guizo!',
    station: 'O trem da risada partiu — e você vai direto pro vagão dos perdedores!',
    castle: 'Até o cavaleiro de armadura treme quando o Coringa entra no salão!',
  },
  big_boss: {
    docks: 'Sai da frente antes que um cascudo meu afunde o píer inteiro!',
    market: 'Sua garrafa parece palito de dente perto do meu punho!',
    rooftops: 'Não preciso pular antena — só preciso alcançar o topo da sua cabeça!',
    station: 'Tamanho não é tudo... mas ajuda na hora de esmagar sua defesa!',
    castle: 'Armadura nenhuma segura o tranco da minha corrente de ouro!',
  },
  knight: {
    docks: 'Por decreto da Cidadela, este porto volta ao domínio da armadura!',
    market: 'Barulho demais nesta feira. Receba a sentença do elmo!',
    rooftops: 'Nem nos telhados mais altos se foge do Cavaleiro Supremo!',
    station: 'Os trens reais transportam apenas campeões — você desce aqui!',
    castle: 'Curvem-se diante do Rei! Minha manopla de aço decide este duelo!',
  },
};

export function getPreBattleDialogue(
  config: ActiveBattleConfig,
  biomeId: ArenaBiomeId
): PreBattleDialogue {
  const oppChar = CHARACTERS[config.player2CharId] || CHARACTERS.karrolo;
  const biome = BIOMES[biomeId] || BIOMES.docks;
  const speakerName =
    config.player2Name || config.storyLevel?.opponentName || oppChar.name;

  if (config.mode === 'STORY' && config.storyLevel) {
    return {
      speakerName,
      speakerCharId: oppChar.id,
      subtitle: `${config.storyLevel.name} · ${biome.name}`,
      line: config.storyLevel.introLine,
      biomeName: biome.name,
    };
  }

  if (config.mode === 'ARCADE') {
    const wave = config.arcadeWave || 1;
    const pool = [
      CHAR_TAUNTS[oppChar.id]?.[biomeId],
      ...BIOME_TAUNTS[biomeId],
    ].filter(Boolean) as string[];
    const picked = pool[(wave + oppChar.id.length) % pool.length];
    return {
      speakerName,
      speakerCharId: oppChar.id,
      subtitle: `Arcade · Onda ${wave} · ${biome.name}`,
      line: picked,
      biomeName: biome.name,
    };
  }

  const charSpecific = CHAR_TAUNTS[oppChar.id]?.[biomeId];
  const biomePool = BIOME_TAUNTS[biomeId] || BIOME_TAUNTS.docks;
  const options = charSpecific ? [charSpecific, ...biomePool] : biomePool;
  const idx = Math.floor(Math.random() * options.length);

  return {
    speakerName,
    speakerCharId: oppChar.id,
    subtitle: `${oppChar.title} · ${biome.name}`,
    line: options[idx],
    biomeName: biome.name,
  };
}
