import { ACHIEVEMENTS } from './achievements';
import { CHARACTERS, SKILLS } from './gameData';
import { getSideQuestProgress, SIDE_QUESTS } from './overworldData';
import {
  AchievementDef,
  AchievementId,
  AchievementState,
  AttributeKey,
  Attributes,
  BattleChronicleEntry,
  BattleMatchTelemetry,
  CharacterProgression,
  SaveData,
  ShopItemDef,
  SkillCategory,
  SkillId,
  SkillProgress,
} from '../types/game';

const STORAGE_KEY = 'super_carrollo_save_v1';

function createDefaultProgression(charId: string): CharacterProgression {
  const char = CHARACTERS[charId] || CHARACTERS.leo;
  const skillProgress = {} as Record<SkillId, SkillProgress>;
  (Object.keys(SKILLS) as SkillId[]).forEach((id) => {
    skillProgress[id] = { level: 1, uses: 0 };
  });

  return {
    attributePoints: 2,
    bonusAttributes: { precisao: 0, velocidade: 0, resistencia: 0, sorte: 0, energia: 0 },
    equippedSkills: { ...char.defaultSkills },
    skillProgress,
  };
}

function createDefaultAchievements(): Record<AchievementId, AchievementState> {
  const map = {} as Record<AchievementId, AchievementState>;
  ACHIEVEMENTS.forEach((a) => {
    map[a.id] = { progress: 0 };
  });
  return map;
}

export function createInitialSave(): SaveData {
  const progression: Record<string, CharacterProgression> = {};
  Object.keys(CHARACTERS).forEach((id) => {
    progression[id] = createDefaultProgression(id);
  });

  return {
    selectedCharId: 'leo',
    unlockedChars: ['leo'],
    completedLevels: [],
    arcadeHighScore: 0,
    arcadeBestWave: 0,
    totalWins: 0,
    coins: 40,
    muted: false,
    themeMode: 'default',
    controlMode: 'both',
    tutorialCompleted: false,
    progression,
    achievements: createDefaultAchievements(),
    achievementStats: {
      currentPerfectStreak: 0,
      bestPerfectStreak: 0,
      totalCounters: 0,
      totalBottleUprights: 0,
      totalPerfects: 0,
      flawlessBossWins: 0,
    },
    sideQuests: {},
    purchasedShopItems: [],
    battleChronicle: [],
  };
}

export function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialSave();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const base = createInitialSave();
    const mergedProg: Record<string, CharacterProgression> = { ...base.progression };
    if (parsed.progression) {
      Object.keys(base.progression).forEach((charId) => {
        if (parsed.progression?.[charId]) {
          mergedProg[charId] = {
            ...base.progression[charId],
            ...parsed.progression[charId],
            bonusAttributes: {
              ...base.progression[charId].bonusAttributes,
              ...(parsed.progression[charId].bonusAttributes || {}),
            },
            equippedSkills: {
              ...base.progression[charId].equippedSkills,
              ...(parsed.progression[charId].equippedSkills || {}),
            },
            skillProgress: {
              ...base.progression[charId].skillProgress,
              ...(parsed.progression[charId].skillProgress || {}),
            },
          };
        }
      });
    }
    const mergedAchievements = createDefaultAchievements();
    if (parsed.achievements) {
      ACHIEVEMENTS.forEach((a) => {
        if (parsed.achievements?.[a.id]) {
          mergedAchievements[a.id] = {
            ...mergedAchievements[a.id],
            ...parsed.achievements[a.id],
          };
        }
      });
    }

    const safeSelected =
      parsed.selectedCharId &&
      CHARACTERS[parsed.selectedCharId] &&
      !CHARACTERS[parsed.selectedCharId].isBossOnly
        ? parsed.selectedCharId
        : 'leo';

    const safeUnlocked = Array.isArray(parsed.unlockedChars)
      ? parsed.unlockedChars.filter((id) => CHARACTERS[id] && !CHARACTERS[id].isBossOnly)
      : base.unlockedChars;

    return {
      ...base,
      ...parsed,
      selectedCharId: safeSelected,
      unlockedChars: safeUnlocked.length > 0 ? safeUnlocked : ['leo'],
      coins: typeof parsed.coins === 'number' ? parsed.coins : base.coins,
      themeMode: parsed.themeMode === 'dark_contrast' ? 'dark_contrast' : 'default',
      controlMode:
        parsed.controlMode === 'buttons' ||
        parsed.controlMode === 'gestures' ||
        parsed.controlMode === 'both'
          ? parsed.controlMode
          : 'both',
      progression: mergedProg,
      achievements: mergedAchievements,
      achievementStats: {
        ...base.achievementStats,
        ...(parsed.achievementStats || {}),
      },
      sideQuests: parsed.sideQuests || {},
      purchasedShopItems: Array.isArray(parsed.purchasedShopItems)
        ? parsed.purchasedShopItems
        : [],
      battleChronicle: Array.isArray(parsed.battleChronicle)
        ? parsed.battleChronicle
        : [],
    };
  } catch {
    return createInitialSave();
  }
}

export function persistSaveData(save: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    // ignore storage quota errors
  }
}

export function appendBattleChronicle(
  save: SaveData,
  entry: BattleChronicleEntry
): SaveData {
  const prevList = Array.isArray(save.battleChronicle) ? save.battleChronicle : [];
  const nextSave: SaveData = {
    ...save,
    battleChronicle: [entry, ...prevList].slice(0, 8),
  };
  persistSaveData(nextSave);
  return nextSave;
}

export function getEffectiveAttributes(save: SaveData, charId: string): Attributes {
  const char = CHARACTERS[charId] || CHARACTERS.leo;
  const prog = save.progression[charId];
  if (!prog) return { ...char.baseAttributes };
  return {
    precisao: char.baseAttributes.precisao + prog.bonusAttributes.precisao,
    velocidade: char.baseAttributes.velocidade + prog.bonusAttributes.velocidade,
    resistencia: char.baseAttributes.resistencia + prog.bonusAttributes.resistencia,
    sorte: char.baseAttributes.sorte + prog.bonusAttributes.sorte,
    energia: char.baseAttributes.energia + prog.bonusAttributes.energia,
  };
}

export function upgradeAttribute(
  save: SaveData,
  charId: string,
  key: AttributeKey
): SaveData {
  const prog = save.progression[charId];
  if (!prog || prog.attributePoints <= 0) return save;
  if (prog.bonusAttributes[key] >= 8) return save;

  const updated: SaveData = {
    ...save,
    progression: {
      ...save.progression,
      [charId]: {
        ...prog,
        attributePoints: prog.attributePoints - 1,
        bonusAttributes: {
          ...prog.bonusAttributes,
          [key]: prog.bonusAttributes[key] + 1,
        },
      },
    },
  };
  persistSaveData(updated);
  return updated;
}

export function equipSkill(
  save: SaveData,
  charId: string,
  category: SkillCategory,
  skillId: SkillId
): SaveData {
  const prog = save.progression[charId];
  if (!prog) return save;
  const updated: SaveData = {
    ...save,
    progression: {
      ...save.progression,
      [charId]: {
        ...prog,
        equippedSkills: {
          ...prog.equippedSkills,
          [category]: skillId,
        },
      },
    },
  };
  persistSaveData(updated);
  return updated;
}

export function recordSkillUsage(
  save: SaveData,
  charId: string,
  usedSkills: Partial<Record<SkillId, number>>
): { nextSave: SaveData; leveledUp: SkillId[] } {
  const prog = save.progression[charId];
  if (!prog) return { nextSave: save, leveledUp: [] };

  const nextSkillProg = { ...prog.skillProgress };
  const leveledUp: SkillId[] = [];

  (Object.entries(usedSkills) as [SkillId, number][]).forEach(([id, count]) => {
    if (!count) return;
    const prev = nextSkillProg[id] || { level: 1, uses: 0 };
    const newUses = prev.uses + count;
    // Level thresholds: Nv.2 at 3 uses, Nv.3 at 7 uses, Nv.4 at 13 uses, Nv.5 at 20 uses
    let newLevel = 1;
    if (newUses >= 20) newLevel = 5;
    else if (newUses >= 13) newLevel = 4;
    else if (newUses >= 7) newLevel = 3;
    else if (newUses >= 3) newLevel = 2;

    if (newLevel > prev.level) {
      leveledUp.push(id);
    }
    nextSkillProg[id] = { level: newLevel, uses: newUses };
  });

  const nextSave: SaveData = {
    ...save,
    progression: {
      ...save.progression,
      [charId]: {
        ...prog,
        skillProgress: nextSkillProg,
      },
    },
  };
  persistSaveData(nextSave);
  return { nextSave, leveledUp };
}

export function getSkillNextThreshold(level: number): number {
  if (level === 1) return 3;
  if (level === 2) return 7;
  if (level === 3) return 13;
  if (level === 4) return 20;
  return 20;
}

export function evaluateAchievements(
  save: SaveData,
  telemetry: BattleMatchTelemetry,
  isBossBattle: boolean
): { nextSave: SaveData; newlyUnlocked: AchievementDef[] } {
  const prevStats = save.achievementStats;
  const bestStreak = Math.max(
    prevStats.bestPerfectStreak,
    telemetry.bestPerfectStreakInMatch
  );
  const totalCounters = prevStats.totalCounters + telemetry.counterCount;
  const totalBottleUprights = prevStats.totalBottleUprights + telemetry.bottleUprights;
  const flawlessBossWins =
    prevStats.flawlessBossWins +
    (telemetry.won && isBossBattle && !telemetry.tookDamage ? 1 : 0);

  const nextStats = {
    currentPerfectStreak: telemetry.endingPerfectStreak,
    bestPerfectStreak: bestStreak,
    totalCounters,
    totalBottleUprights,
    totalPerfects: (prevStats.totalPerfects || 0) + telemetry.perfectCount,
    flawlessBossWins,
  };

  const nextAchievements: Record<AchievementId, AchievementState> = {
    ...save.achievements,
  };
  const newlyUnlocked: AchievementDef[] = [];
  const now = Date.now();

  const progressValues: Record<AchievementId, number> = {
    first_blood: save.totalWins,
    perfect_streak_10: bestStreak,
    flawless_boss: flawlessBossWins,
    counter_master: totalCounters,
    bottle_whisperer: totalBottleUprights,
    dethrone_karrolo: save.completedLevels.includes('4-5') ? 1 : 0,
  };

  for (const def of ACHIEVEMENTS) {
    const prev = nextAchievements[def.id] || { progress: 0 };
    const rawProgress = Math.min(def.target, Math.max(prev.progress, progressValues[def.id]));
    const alreadyUnlocked = Boolean(prev.unlockedAt);
    const shouldUnlock = !alreadyUnlocked && rawProgress >= def.target;

    nextAchievements[def.id] = {
      progress: rawProgress,
      unlockedAt: shouldUnlock ? now : prev.unlockedAt,
    };

    if (shouldUnlock) {
      newlyUnlocked.push(def);
    }
  }

  const nextSave: SaveData = {
    ...save,
    achievements: nextAchievements,
    achievementStats: nextStats,
  };
  persistSaveData(nextSave);
  return { nextSave, newlyUnlocked };
}

export function acceptSideQuest(save: SaveData, questId: string): SaveData {
  if (!SIDE_QUESTS[questId]) return save;
  const cur = save.sideQuests[questId];
  if (cur?.accepted) return save;

  const nextSave: SaveData = {
    ...save,
    sideQuests: {
      ...save.sideQuests,
      [questId]: { accepted: true, claimed: false },
    },
  };
  persistSaveData(nextSave);
  return nextSave;
}

export function claimSideQuest(
  save: SaveData,
  questId: string,
  activeCharId: string
): { nextSave: SaveData; claimed: boolean } {
  const quest = SIDE_QUESTS[questId];
  if (!quest) return { nextSave: save, claimed: false };
  const state = save.sideQuests[questId];
  if (state?.claimed) return { nextSave: save, claimed: false };
  const progress = getSideQuestProgress(save, quest);
  if (progress < quest.target) return { nextSave: save, claimed: false };

  const charProg = save.progression[activeCharId];
  const updatedProg = charProg
    ? {
        ...save.progression,
        [activeCharId]: {
          ...charProg,
          attributePoints: charProg.attributePoints + quest.rewardAttrPoints,
        },
      }
    : save.progression;

  const nextSave: SaveData = {
    ...save,
    coins: save.coins + quest.rewardCoins,
    progression: updatedProg,
    sideQuests: {
      ...save.sideQuests,
      [questId]: { accepted: true, claimed: true },
    },
  };
  persistSaveData(nextSave);
  return { nextSave, claimed: true };
}

export function buyShopItem(
  save: SaveData,
  item: ShopItemDef,
  activeCharId: string
): { nextSave: SaveData; ok: boolean; reason?: string; leveledSkill?: SkillId } {
  if (save.coins < item.cost) {
    return { nextSave: save, ok: false, reason: 'Rolhas Douradas insuficientes.' };
  }
  if (item.oneTime && save.purchasedShopItems.includes(item.id)) {
    return { nextSave: save, ok: false, reason: 'Item único já adquirido.' };
  }

  const charProg = save.progression[activeCharId];
  if (!charProg) {
    return { nextSave: save, ok: false, reason: 'Lutador não encontrado.' };
  }

  let nextProg = charProg;
  let leveledSkill: SkillId | undefined;

  if (item.reward.kind === 'attr_point') {
    nextProg = {
      ...charProg,
      attributePoints: charProg.attributePoints + item.reward.amount,
    };
  } else if (item.reward.kind === 'bonus_attr') {
    const attrKey = item.reward.attr;
    const currentBonus = charProg.bonusAttributes[attrKey] || 0;
    if (currentBonus >= 8) {
      return { nextSave: save, ok: false, reason: 'Atributo já está no limite máximo (+8).' };
    }
    nextProg = {
      ...charProg,
      bonusAttributes: {
        ...charProg.bonusAttributes,
        [attrKey]: Math.min(8, currentBonus + item.reward.amount),
      },
    };
  } else if (item.reward.kind === 'skill_xp') {
    const equippedId = charProg.equippedSkills[item.reward.category];
    const usedResult = recordSkillUsage(save, activeCharId, {
      [equippedId]: item.reward.uses,
    });
    nextProg = usedResult.nextSave.progression[activeCharId];
    if (usedResult.leveledUp.includes(equippedId)) {
      leveledSkill = equippedId;
    }
  }

  const nextSave: SaveData = {
    ...save,
    coins: save.coins - item.cost,
    progression: {
      ...save.progression,
      [activeCharId]: nextProg,
    },
    purchasedShopItems: item.oneTime
      ? [...save.purchasedShopItems, item.id]
      : save.purchasedShopItems,
  };
  persistSaveData(nextSave);
  return { nextSave, ok: true, leveledSkill };
}
