export type GameMode = 'STORY' | 'FREE' | 'ARCADE' | 'PVP_LOCAL' | 'PVP_ONLINE';

export type GameScreen = 'TITLE' | 'OVERWORLD' | 'ROSTER_SKILLS' | 'PVP_LOBBY' | 'BATTLE';

export type AttributeKey = 'precisao' | 'velocidade' | 'resistencia' | 'sorte' | 'energia';

export interface Attributes {
  precisao: number;     // Facilita Carrollos perfeitos (aumenta janela de acerto)
  velocidade: number;   // Reduz o tempo de preparação e acelera recuperação
  resistencia: number;  // Reduz o dano recebido
  sorte: number;        // Influencia eventos da garrafa (estabilização e críticos)
  energia: number;      // Melhora habilidades especiais e ganho de energia
}

export type SkillCategory = 'OFENSIVA' | 'DEFENSIVA' | 'TATICA';

export type SkillId =
  | 'impacto_sonico'
  | 'quebra_guarda'
  | 'furia_termica'
  | 'escudo_rolha'
  | 'reflexo_rapido'
  | 'postura_aco'
  | 'chumbo_base'
  | 'vento_cruzado'
  | 'giro_invertido';

export interface SkillDef {
  id: SkillId;
  name: string;
  category: SkillCategory;
  energyCost: number;
  description: string;
  effectSummary: string;
  color: string;
}

export interface SkillProgress {
  level: number; // 1 to 5
  uses: number;  // frequent use levels it up
}

export type BodyType =
  | 'athletic'
  | 'stocky'
  | 'lanky'
  | 'agile'
  | 'titan'
  | 'monarch';

export type CarrolloTool = 'knuckles' | 'cane' | 'ruler' | 'scepter' | 'gauntlet';

export type OutfitStyle =
  | 'standard'
  | 'street_ribs'
  | 'trenchcoat'
  | 'crop_street'
  | 'jester'
  | 'tank_muscle'
  | 'knight_armor';

export type CharacterAccessory =
  | 'bandana'
  | 'curly_afro'
  | 'flame_crown'
  | 'goggles'
  | 'visor'
  | 'helmet'
  | 'royal_crown'
  | 'rich_shades'
  | 'afro_hoops'
  | 'jester_hat'
  | 'gold_chain'
  | 'knight_helm';

export interface CharacterVisualConfig {
  bodyType: BodyType;
  skin: string;
  primary: string;
  secondary: string;
  accent: string;
  hair: string;
  accessory: CharacterAccessory;
  outfitStyle?: OutfitStyle;
  carrolloTool?: CarrolloTool;
  bottleColor: string;
  bottleLiquid: string;
}

export interface CharacterDef {
  id: string;
  name: string;
  title: string;
  bio: string;
  unlockRequirement: string;
  isBossOnly?: boolean;
  baseAttributes: Attributes;
  specialName: string;
  specialDesc: string;
  defaultSkills: Record<SkillCategory, SkillId>;
  preferredTree: SkillId[];
  visual: CharacterVisualConfig;
}

export interface StoryLevel {
  phaseIndex: number; // 0..4
  levelIndex: number; // 0..5 (5 is Boss)
  id: string;
  name: string;
  opponentName: string;
  opponentCharId: string;
  isBoss: boolean;
  difficulty: number; // 1..10
  hpMultiplier: number;
  introLine: string;
  victoryLine: string;
  rewardPoints: number;
  mapX: number; // 0..100% on overworld map
  mapY: number; // 0..100% on overworld map
}

export interface StoryPhase {
  index: number;
  name: string;
  district: string;
  bossName: string;
  bossCharId: string;
  themeColor: string;
  hubX: number;
  hubY: number;
  levels: StoryLevel[];
}

export interface CharacterProgression {
  attributePoints: number;
  bonusAttributes: Attributes;
  equippedSkills: Record<SkillCategory, SkillId>;
  skillProgress: Record<SkillId, SkillProgress>;
}

export type AchievementId =
  | 'first_blood'
  | 'perfect_streak_10'
  | 'flawless_boss'
  | 'counter_master'
  | 'bottle_whisperer'
  | 'dethrone_karrolo';

export interface AchievementDef {
  id: AchievementId;
  title: string;
  description: string;
  target: number;
  icon: 'trophy' | 'flame' | 'shield' | 'zap' | 'sparkles' | 'crown';
}

export interface AchievementState {
  progress: number;
  unlockedAt?: number;
}

export interface AchievementStats {
  currentPerfectStreak: number;
  bestPerfectStreak: number;
  totalCounters: number;
  totalBottleUprights: number;
  totalPerfects: number;
  flawlessBossWins: number;
}

export type SideQuestMetric =
  | 'bottle_uprights'
  | 'perfect_hits'
  | 'counter_hits'
  | 'story_wins';

export interface SideQuestDef {
  id: string;
  npcId: string;
  title: string;
  description: string;
  metric: SideQuestMetric;
  target: number;
  rewardCoins: number;
  rewardAttrPoints: number;
}

export interface SideQuestState {
  accepted: boolean;
  claimed: boolean;
}

export type NpcSpriteVariant = 'sailor' | 'spice_vendor' | 'mechanic' | 'chronicler';

export interface OverworldNpcDef {
  id: string;
  name: string;
  role: string;
  sprite: NpcSpriteVariant;
  phaseIndex: number;
  mapX: number;
  mapY: number;
  greeting: string;
  completedLine: string;
  questId: string;
}

export type ShopItemReward =
  | { kind: 'attr_point'; amount: number }
  | { kind: 'bonus_attr'; attr: AttributeKey; amount: number }
  | { kind: 'skill_xp'; category: SkillCategory; uses: number };

export interface ShopItemDef {
  id: string;
  name: string;
  description: string;
  cost: number;
  oneTime?: boolean;
  reward: ShopItemReward;
}

export interface OverworldShopDef {
  id: string;
  name: string;
  keeperName: string;
  sprite: NpcSpriteVariant;
  phaseIndex: number;
  mapX: number;
  mapY: number;
  accentColor: string;
  greeting: string;
  items: ShopItemDef[];
}

export type ThemeMode = 'default' | 'dark_contrast';

export type ControlMode = 'buttons' | 'gestures' | 'both';

export interface BattleChronicleEntry {
  id: string;
  timestamp: number;
  won: boolean;
  mode: GameMode;
  p1CharId: string;
  p2CharId: string;
  p2Name: string;
  arenaBiome: ArenaBiomeId;
  isBoss: boolean;
  score: number;
  perfectCount: number;
  counterCount: number;
  maxPerfectStreak: number;
  tookDamage: boolean;
  arcadeWave?: number;
  levelName?: string;
}

export interface SaveData {
  selectedCharId: string;
  unlockedChars: string[];
  completedLevels: string[]; // e.g. "0-0", "0-1"...
  arcadeHighScore: number;
  arcadeBestWave: number;
  totalWins: number;
  coins: number;
  muted: boolean;
  themeMode: ThemeMode;
  controlMode: ControlMode;
  tutorialCompleted: boolean;
  progression: Record<string, CharacterProgression>;
  achievements: Record<AchievementId, AchievementState>;
  achievementStats: AchievementStats;
  sideQuests: Record<string, SideQuestState>;
  purchasedShopItems: string[];
  battleChronicle?: BattleChronicleEntry[];
}

export interface BattleMatchTelemetry {
  won: boolean;
  usedSkills: Partial<Record<SkillId, number>>;
  scoreDelta: number;
  perfectCount: number;
  endingPerfectStreak: number;
  bestPerfectStreakInMatch: number;
  tookDamage: boolean;
  counterCount: number;
  bottleUprights: number;
}

export type CarrolloType =
  | 'PERFEITO'
  | 'CRITICO'
  | 'CARREGADO'
  | 'NORMAL'
  | 'CONTRA_CARROLLO'
  | 'FALHA';

export type ArenaBiomeId = 'docks' | 'market' | 'rooftops' | 'station' | 'castle';

export type ArenaRoundEvent = 'NONE' | 'GOLDEN_ROUND' | 'TAILWIND' | 'ENERGY_SURGE';

export type ReplayEvent =
  | { t: number; slot: 1 | 2; kind: 'spin_charge_start' }
  | {
      t: number;
      slot: 1 | 2;
      kind: 'spin_release';
      charge: number;
      willLandUpright: boolean;
      flipSign: 1 | -1;
    }
  | { t: number; slot: 1 | 2; kind: 'carrollo_charge_start' }
  | {
      t: number;
      slot: 1 | 2;
      kind: 'carrollo_strike';
      isCharged: boolean;
      strikeType: CarrolloType;
    }
  | { t: number; slot: 1 | 2; kind: 'counter_attempt'; isCounter: boolean }
  | { t: number; slot: 1 | 2; kind: 'skill_activate'; category: SkillCategory | 'SPECIAL' }
  | {
      t: number;
      slot: 1 | 2;
      kind: 'round_event';
      event: Exclude<ArenaRoundEvent, 'NONE'>;
    };

export interface MatchReplay {
  id: string;
  recordedAt: number;
  mode: GameMode;
  arenaBiome: ArenaBiomeId;
  p1CharId: string;
  p2CharId: string;
  p1Name: string;
  p2Name: string;
  p1Attrs: Attributes;
  p2Attrs: Attributes;
  p1Skills: Record<SkillCategory, SkillId>;
  p2Skills: Record<SkillCategory, SkillId>;
  p1MaxHp: number;
  p2MaxHp: number;
  winner: 1 | 2;
  score: number;
  duration: number;
  events: ReplayEvent[];
}

export interface ActiveBattleConfig {
  mode: GameMode;
  player1CharId: string;
  player2CharId: string;
  player2Name?: string;
  storyLevel?: StoryLevel;
  arcadeWave?: number;
  arcadeScore?: number;
  arenaBiome?: ArenaBiomeId;
  arenaCycle?: boolean;
  difficulty?: number; // 1..10 for CPU
  pvpRoomCode?: string;
  pvpPlayerSlot?: 1 | 2;
  enableTutorial?: boolean;
  replayData?: MatchReplay;
}
