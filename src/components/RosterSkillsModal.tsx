import React, { useState } from 'react';
import { ArrowLeft, Plus, Shield, Swords, Compass, Check, Lock } from 'lucide-react';
import { BIOME_LIST, BIOME_ORDER } from '../canvas/biomeRenderer';
import { ATTRIBUTE_META, CHARACTER_LIST, CHARACTERS, SKILLS } from '../data/gameData';
import {
  getEffectiveAttributes,
  getSkillNextThreshold,
} from '../data/saveStore';
import {
  ArenaBiomeId,
  AttributeKey,
  SaveData,
  SkillCategory,
  SkillId,
} from '../types/game';
import { CharacterAvatar } from './CharacterAvatar';
import { ChibiCharacterSprite } from './ChibiCharacterSprite';

interface RosterSkillsModalProps {
  save: SaveData;
  mode: 'ROSTER' | 'FREE_SETUP';
  onClose: () => void;
  onSelectCharacter: (charId: string) => void;
  onUpgradeAttribute: (charId: string, key: AttributeKey) => void;
  onEquipSkill: (charId: string, category: SkillCategory, skillId: SkillId) => void;
  onStartFreeBattle?: (
    player1Id: string,
    player2Id: string,
    difficulty: number,
    arenaBiome: ArenaBiomeId
  ) => void;
}

const CATEGORIES: { key: SkillCategory; label: string; icon: React.ReactNode }[] = [
  { key: 'OFENSIVA', label: 'Ofensivas', icon: <Swords className="w-4 h-4" /> },
  { key: 'DEFENSIVA', label: 'Defensivas', icon: <Shield className="w-4 h-4" /> },
  { key: 'TATICA', label: 'Táticas', icon: <Compass className="w-4 h-4" /> },
];

export const RosterSkillsModal: React.FC<RosterSkillsModalProps> = ({
  save,
  mode,
  onClose,
  onSelectCharacter,
  onUpgradeAttribute,
  onEquipSkill,
  onStartFreeBattle,
}) => {
  const [inspectCharId, setInspectCharId] = useState<string>(save.selectedCharId);
  const [opponentCharId, setOpponentCharId] = useState<string>('karrolo');
  const [cpuDifficulty, setCpuDifficulty] = useState<number>(5);
  const [selectedArena, setSelectedArena] = useState<ArenaBiomeId | 'random'>('random');
  const [activeCategory, setActiveCategory] = useState<SkillCategory>('OFENSIVA');

  const char = CHARACTERS[inspectCharId] || CHARACTERS.leo;
  const prog = save.progression[char.id];
  const attrs = getEffectiveAttributes(save, char.id);
  const isUnlockedInStory = save.unlockedChars.includes(char.id);
  const canUseHere = mode === 'FREE_SETUP' || isUnlockedInStory;

  const categorySkills = (Object.values(SKILLS) as typeof SKILLS[SkillId][]).filter(
    (s) => s.category === activeCategory
  );

  return (
    <div className="w-screen h-screen bg-[#1D1626] dark:bg-[#05070B] text-[#FFF8EB] dark:text-[#F8FAFC] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-5 py-3 bg-[#15101C] dark:bg-[#030509] border-b-[3px] border-[#111827] dark:border-[#94A3B8]">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="cartoon-btn px-3 py-1.5 rounded-xl bg-[#FFF8EB] dark:bg-[#0F172A] text-[#111827] dark:text-[#F8FAFC] font-bold text-sm flex items-center gap-1.5 whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
          <h1 className="font-display font-extrabold text-lg sm:text-xl text-[#FDE68A] dark:text-[#FDE047]">
            {mode === 'FREE_SETUP'
              ? 'Modo Livre · Escolha os Duelistas'
              : 'Personagens & Árvore de Habilidades'}
          </h1>
        </div>

        {mode === 'FREE_SETUP' && onStartFreeBattle ? (
          <button
            onClick={() => {
              const resolvedArena =
                selectedArena === 'random'
                  ? BIOME_ORDER[Math.floor(Math.random() * BIOME_ORDER.length)]
                  : selectedArena;
              onStartFreeBattle(inspectCharId, opponentCharId, cpuDifficulty, resolvedArena);
            }}
            className="cartoon-btn px-5 py-2 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-display font-extrabold text-sm flex items-center gap-2 whitespace-nowrap"
          >
            <Swords className="w-4 h-4" />
            <span>Iniciar Duelo</span>
          </button>
        ) : (
          canUseHere && (
            <button
              onClick={() => {
                onSelectCharacter(char.id);
                onClose();
              }}
              className="cartoon-btn px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-display font-bold text-sm flex items-center gap-1.5 whitespace-nowrap"
            >
              <Check className="w-4 h-4" />
              <span>
                {save.selectedCharId === char.id ? 'Lutador Selecionado' : `Usar ${char.name}`}
              </span>
            </button>
          )
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Character Roster */}
          <div className="lg:col-span-4 space-y-3">
            <h2 className="font-display font-bold text-sm text-[#FDE68A] dark:text-[#FDE047]">
              Elenco de Super Carrollo
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2.5">
              {CHARACTER_LIST.map((c) => {
                const selected = c.id === inspectCharId;
                const unlocked = mode === 'FREE_SETUP' || save.unlockedChars.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setInspectCharId(c.id);
                      if (unlocked) onSelectCharacter(c.id);
                    }}
                    className={`cartoon-outline rounded-2xl p-3 text-left transition-transform ${
                      selected
                        ? 'bg-[#FBBF24] dark:bg-[#FDE047] text-[#111827] scale-[1.02]'
                        : 'bg-[#2A2036] dark:bg-[#0B1120] text-[#FFF8EB] dark:text-[#F8FAFC] hover:bg-[#352944] dark:hover:bg-[#162033]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <CharacterAvatar charId={c.id} size={46} />
                      {!unlocked && <Lock className="w-4 h-4 opacity-70" />}
                    </div>
                    <div className="mt-2 font-display font-extrabold text-sm truncate">
                      {c.name}
                    </div>
                    <div
                      className={`text-xs truncate ${
                        selected ? 'text-[#451A03]' : 'text-[#CBD5E1]'
                      }`}
                    >
                      {c.specialName}
                    </div>
                  </button>
                );
              })}
            </div>

            {mode === 'FREE_SETUP' && (
              <div className="cartoon-outline rounded-2xl bg-[#2A2036] dark:bg-[#0B1120] p-4 space-y-3">
                <div className="text-sm font-display font-bold text-[#FDE68A] dark:text-[#FDE047]">
                  Adversário (CPU)
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {CHARACTER_LIST.map((opp) => (
                    <button
                      key={opp.id}
                      onClick={() => setOpponentCharId(opp.id)}
                      className={`rounded-xl p-2 border-2 border-[#111827] dark:border-[#94A3B8] flex flex-col items-center gap-1 transition-colors ${
                        opponentCharId === opp.id
                          ? 'bg-[#EF4444] text-white'
                          : 'bg-[#1D1626] dark:bg-[#05070B] text-[#E2E8F0] hover:bg-[#352944] dark:hover:bg-[#1E293B]'
                      }`}
                    >
                      <CharacterAvatar charId={opp.id} size={36} />
                      <span className="text-[11px] font-bold truncate w-full text-center">
                        {opp.name}
                      </span>
                    </button>
                  ))}
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Nível da CPU</span>
                    <span className="font-mono-nums text-[#FBBF24] dark:text-[#FDE047]">{cpuDifficulty}/10</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={cpuDifficulty}
                    onChange={(e) => setCpuDifficulty(Number(e.target.value))}
                    className="w-full accent-[#EF4444]"
                  />
                </div>

                <div>
                  <div className="text-xs font-bold text-[#FDE68A] dark:text-[#FDE047] mb-1.5">
                    Arena (Bioma)
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setSelectedArena('random')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border-2 border-[#111827] dark:border-[#94A3B8] truncate ${
                        selectedArena === 'random'
                          ? 'bg-[#FBBF24] dark:bg-[#FDE047] text-[#111827]'
                          : 'bg-[#1D1626] dark:bg-[#05070B] text-[#E2E8F0] hover:bg-[#352944] dark:hover:bg-[#1E293B]'
                      }`}
                    >
                      Aleatória
                    </button>
                    {BIOME_LIST.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setSelectedArena(b.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border-2 border-[#111827] dark:border-[#94A3B8] truncate ${
                          selectedArena === b.id
                            ? 'bg-[#38BDF8] text-[#111827]'
                            : 'bg-[#1D1626] dark:bg-[#05070B] text-[#E2E8F0] hover:bg-[#352944] dark:hover:bg-[#1E293B]'
                        }`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Character Sheet, Attributes & 3-Category Skill Tree */}
          <div className="lg:col-span-8 space-y-5">
            {/* Character Bio + Special */}
            <div className="cartoon-outline-lg rounded-2xl bg-[#FFF8EB] dark:bg-[#0B1120] text-[#111827] dark:text-[#F8FAFC] p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 shrink-0">
                  <CharacterAvatar charId={char.id} size={72} />
                  <div className="rounded-xl bg-[#FEF3C7] dark:bg-[#1E293B] border-2 border-[#111827] dark:border-[#94A3B8] px-2 py-1 flex items-center justify-center">
                    <ChibiCharacterSprite charId={char.id} size={52} isMoving={true} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#B45309] dark:text-[#FDE047]">
                    <span>{char.title}</span>
                    {!isUnlockedInStory && mode !== 'FREE_SETUP' && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#DC2626] dark:text-[#FCA5A5]">{char.unlockRequirement}</span>
                      </>
                    )}
                  </div>
                  <h2 className="font-display font-extrabold text-2xl leading-tight">
                    {char.name}
                  </h2>
                  <p className="text-sm text-[#334155] dark:text-[#CBD5E1] mt-1">{char.bio}</p>
                </div>
              </div>

              <div className="mt-4 bg-[#FEF3C7] dark:bg-[#0F172A] border-2 border-[#111827] dark:border-[#94A3B8] rounded-xl px-3.5 py-2.5">
                <div className="text-xs font-extrabold text-[#B45309] dark:text-[#FDE047]">
                  Habilidade Especial · {char.specialName}
                </div>
                <div className="text-sm font-semibold text-[#111827] dark:text-[#F8FAFC] mt-0.5">
                  {char.specialDesc}
                </div>
              </div>
            </div>

            {/* 5 Attributes Tree */}
            <div className="cartoon-outline rounded-2xl bg-[#2A2036] dark:bg-[#0B1120] p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-display font-extrabold text-base text-[#FDE68A] dark:text-[#FDE047]">
                    Árvore de Atributos
                  </h3>
                  <p className="text-xs text-[#CBD5E1]">
                    Evolua no Modo História e Arcade para distribuir pontos
                  </p>
                </div>
                <div className="font-mono-nums text-sm font-extrabold text-[#FBBF24] dark:text-[#FDE047]">
                  Pontos disponíveis: {prog?.attributePoints ?? 0}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(ATTRIBUTE_META) as AttributeKey[]).map((key) => {
                  const meta = ATTRIBUTE_META[key];
                  const val = attrs[key];
                  const bonus = prog?.bonusAttributes[key] ?? 0;
                  const canUpgrade = (prog?.attributePoints ?? 0) > 0 && bonus < 8;
                  return (
                    <div
                      key={key}
                      className="rounded-xl bg-[#1D1626] dark:bg-[#05070B] border-2 border-[#111827] dark:border-[#94A3B8] p-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-[#FFF8EB] dark:text-[#F8FAFC]">
                            {meta.label}
                          </span>
                          <span className="font-mono-nums text-sm font-extrabold text-[#38BDF8]">
                            {val}
                          </span>
                        </div>
                        <p className="text-xs text-[#94A3B8] dark:text-[#CBD5E1] mt-0.5">{meta.effect}</p>
                        <div className="mt-2 h-2 rounded-full bg-[#334155] dark:bg-[#1E293B] overflow-hidden border border-[#111827] dark:border-[#94A3B8]">
                          <div
                            className="h-full bg-[#FBBF24] dark:bg-[#FDE047]"
                            style={{ width: `${Math.min(100, (val / 15) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <button
                        disabled={!canUpgrade}
                        onClick={() => onUpgradeAttribute(char.id, key)}
                        className={`cartoon-btn w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          canUpgrade
                            ? 'bg-[#10B981] hover:bg-[#059669] text-white'
                            : 'bg-[#334155] dark:bg-[#1E293B] text-[#64748B] cursor-not-allowed'
                        }`}
                        title={`Melhorar ${meta.label}`}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3 Categories of Skills (evolves by frequent use!) */}
            <div className="cartoon-outline rounded-2xl bg-[#2A2036] dark:bg-[#0B1120] p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-display font-extrabold text-base text-[#FDE68A] dark:text-[#FDE047]">
                    Habilidades por Categoria
                  </h3>
                  <p className="text-xs text-[#CBD5E1]">
                    Equipe 1 de cada categoria. Cada habilidade evolui até o Nv.5 pelo uso frequente nos duelos.
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setActiveCategory(cat.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 border-[#111827] dark:border-[#94A3B8] flex items-center gap-1.5 whitespace-nowrap ${
                        activeCategory === cat.key
                          ? 'bg-[#FBBF24] dark:bg-[#FDE047] text-[#111827]'
                          : 'bg-[#1D1626] dark:bg-[#05070B] text-[#FFF8EB] dark:text-[#F8FAFC] hover:bg-[#352944] dark:hover:bg-[#1E293B]'
                      }`}
                    >
                      {cat.icon}
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {categorySkills.map((skill) => {
                  const equipped = prog?.equippedSkills[activeCategory] === skill.id;
                  const sProg = prog?.skillProgress[skill.id] || { level: 1, uses: 0 };
                  const nextCap = getSkillNextThreshold(sProg.level);
                  const pct = sProg.level >= 5 ? 100 : Math.min(100, (sProg.uses / nextCap) * 100);

                  return (
                    <div
                      key={skill.id}
                      className={`rounded-xl border-[3px] border-[#111827] dark:border-[#94A3B8] p-3.5 flex flex-col justify-between ${
                        equipped
                          ? 'bg-[#FFF8EB] dark:bg-[#1E293B] text-[#111827] dark:text-[#F8FAFC] dark:ring-2 dark:ring-[#FDE047]'
                          : 'bg-[#1D1626] dark:bg-[#05070B] text-[#FFF8EB] dark:text-[#F8FAFC]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display font-extrabold text-sm">
                            {skill.name}
                          </span>
                          <span
                            className="font-mono-nums text-xs font-extrabold"
                            style={{ color: equipped ? '#D97706' : '#FDE047' }}
                          >
                            Nv.{sProg.level}
                          </span>
                        </div>
                        <div
                          className={`text-xs font-bold mt-0.5 ${
                            equipped ? 'text-[#475569] dark:text-[#38BDF8]' : 'text-[#94A3B8] dark:text-[#CBD5E1]'
                          }`}
                        >
                          {skill.effectSummary} · {skill.energyCost} ENE
                        </div>
                        <p
                          className={`text-xs mt-2 leading-relaxed ${
                            equipped ? 'text-[#334155] dark:text-[#E2E8F0]' : 'text-[#CBD5E1]'
                          }`}
                        >
                          {skill.description}
                        </p>
                      </div>

                      <div className="mt-3 space-y-2.5">
                        <div>
                          <div className="flex justify-between text-[11px] font-mono-nums opacity-80 mb-1">
                            <span>Uso frequente</span>
                            <span>
                              {sProg.level >= 5 ? 'MÁX' : `${sProg.uses}/${nextCap} usos`}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-black/25 dark:bg-[#0F172A] overflow-hidden border border-[#111827] dark:border-[#94A3B8]">
                            <div
                              className="h-full"
                              style={{ width: `${pct}%`, backgroundColor: skill.color }}
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => onEquipSkill(char.id, activeCategory, skill.id)}
                          className={`cartoon-btn w-full py-1.5 rounded-lg text-xs font-extrabold ${
                            equipped
                              ? 'bg-[#10B981] text-white'
                              : 'bg-[#FBBF24] hover:bg-[#F59E0B] text-[#111827]'
                          }`}
                        >
                          {equipped ? 'Equipada' : 'Equipar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
