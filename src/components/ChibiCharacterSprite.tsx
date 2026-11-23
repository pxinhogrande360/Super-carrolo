import React from 'react';
import { CHARACTERS } from '../data/gameData';
import { CharacterAccessory, NpcSpriteVariant, OutfitStyle } from '../types/game';

interface ChibiCharacterSpriteProps {
  charId?: string;
  variant?: NpcSpriteVariant;
  size?: number;
  facing?: 1 | -1;
  isMoving?: boolean;
  className?: string;
}

interface ChibiPalette {
  label: string;
  skin: string;
  primary: string;
  secondary: string;
  accent: string;
  hair: string;
  bottleColor?: string;
  bottleLiquid?: string;
  bodyScaleX: number;
  outfitStyle?: OutfitStyle;
  headAccessory:
    | CharacterAccessory
    | 'sailor_cap'
    | 'spice_scarf'
    | 'mechanic_cap'
    | 'beret';
  propKind: 'bottle' | 'spyglass' | 'spice' | 'wrench' | 'scroll';
  beard?: boolean;
}

const NPC_PALETTES: Record<NpcSpriteVariant, ChibiPalette> = {
  sailor: {
    label: 'Velho Baltazar',
    skin: '#E6B48F',
    primary: '#0284C7',
    secondary: '#1E293B',
    accent: '#FDE047',
    hair: '#E2E8F0',
    bodyScaleX: 1.08,
    headAccessory: 'sailor_cap',
    propKind: 'spyglass',
    beard: true,
  },
  spice_vendor: {
    label: 'Dona Hortênsia',
    skin: '#D69168',
    primary: '#EA580C',
    secondary: '#7C2D12',
    accent: '#FACC15',
    hair: '#3F2316',
    bodyScaleX: 1.05,
    headAccessory: 'spice_scarf',
    propKind: 'spice',
  },
  mechanic: {
    label: 'Joca das Antenas',
    skin: '#F1C19B',
    primary: '#0D9488',
    secondary: '#1E293B',
    accent: '#38BDF8',
    hair: '#334155',
    bodyScaleX: 0.94,
    headAccessory: 'mechanic_cap',
    propKind: 'wrench',
  },
  chronicler: {
    label: 'Cronista Sofia',
    skin: '#F5CBA7',
    primary: '#7C3AED',
    secondary: '#312E81',
    accent: '#FBBF24',
    hair: '#78350F',
    bodyScaleX: 0.92,
    headAccessory: 'beret',
    propKind: 'scroll',
  },
};

function getPalette(charId?: string, variant?: NpcSpriteVariant): ChibiPalette {
  if (variant) {
    return NPC_PALETTES[variant];
  }
  const char = CHARACTERS[charId || 'leo'] || CHARACTERS.leo;
  const v = char.visual;
  const bodyScaleX =
    v.bodyType === 'stocky'
      ? 1.16
      : v.bodyType === 'titan' || v.bodyType === 'monarch'
      ? 1.14
      : v.bodyType === 'lanky' || v.bodyType === 'agile'
      ? 0.9
      : 1;

  return {
    label: char.name,
    skin: v.skin,
    primary: v.primary,
    secondary: v.secondary,
    accent: v.accent,
    hair: v.hair,
    bottleColor: v.bottleColor,
    bottleLiquid: v.bottleLiquid,
    bodyScaleX,
    outfitStyle: v.outfitStyle,
    headAccessory: v.accessory,
    propKind: 'bottle',
  };
}

export const ChibiCharacterSprite: React.FC<ChibiCharacterSpriteProps> = ({
  charId,
  variant,
  size = 58,
  facing = 1,
  isMoving = false,
  className = '',
}) => {
  const p = getPalette(charId, variant);
  const flipTransform = facing === -1 ? 'translate(80,0) scale(-1,1)' : undefined;

  return (
    <svg
      width={size}
      height={Math.round((size * 96) / 80)}
      viewBox="0 0 80 96"
      className={`shrink-0 overflow-visible ${className}`}
      aria-label={p.label}
    >
      {/* Ground drop shadow */}
      <ellipse cx="40" cy="89" rx="18" ry="5" fill="#111827" opacity="0.32" />

      <g transform={flipTransform}>
        <g>
          {/* Walk or idle gentle body bob */}
          {isMoving ? (
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 0; 0 -4.5; 0 0; 0 -4.5; 0 0"
              dur="0.42s"
              repeatCount="indefinite"
            />
          ) : (
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 0; 0 -1.6; 0 0"
              dur="1.4s"
              repeatCount="indefinite"
            />
          )}

          {/* Back Cape for Karrolo & The Knight */}
          {(p.headAccessory === 'royal_crown' || p.outfitStyle === 'knight_armor') && (
            <path
              d="M22 52 L13 83 L66 83 L58 52 Z"
              fill={p.outfitStyle === 'knight_armor' ? '#991B1B' : '#7F1D1D'}
              stroke="#111827"
              strokeWidth="4"
              strokeLinejoin="round"
            />
          )}

          {/* Back Leg */}
          <g>
            {isMoving && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="18 33 74; -20 33 74; 18 33 74"
                dur="0.42s"
                repeatCount="indefinite"
              />
            )}
            <rect
              x="26"
              y="72"
              width="11"
              height="13"
              rx="5"
              fill={p.secondary}
              stroke="#111827"
              strokeWidth="3.8"
            />
            <rect
              x="24"
              y="79"
              width="14"
              height="8"
              rx="4"
              fill={p.outfitStyle === 'street_ribs' ? '#FFFFFF' : '#1E293B'}
              stroke="#111827"
              strokeWidth="3.5"
            />
            {p.outfitStyle === 'street_ribs' && (
              <rect x="25" y="79" width="9" height="4" rx="2" fill="#111827" />
            )}
          </g>

          {/* Front Leg */}
          <g>
            {isMoving && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="-20 47 74; 18 47 74; -20 47 74"
                dur="0.42s"
                repeatCount="indefinite"
              />
            )}
            <rect
              x="43"
              y="72"
              width="11"
              height="13"
              rx="5"
              fill={p.secondary}
              stroke="#111827"
              strokeWidth="3.8"
            />
            {(p.outfitStyle === 'crop_street' || p.outfitStyle === 'tank_muscle') && (
              <rect
                x="48"
                y="74"
                width="3.2"
                height="9"
                rx="1.5"
                fill={p.outfitStyle === 'crop_street' ? '#DC2626' : '#CBD5E1'}
              />
            )}
            <rect
              x="42"
              y="79"
              width="15"
              height="8"
              rx="4"
              fill={p.outfitStyle === 'street_ribs' ? '#FFFFFF' : '#111827'}
              stroke="#111827"
              strokeWidth="3.5"
            />
            {p.outfitStyle === 'street_ribs' && (
              <rect x="43" y="79" width="10" height="4" rx="2" fill="#111827" />
            )}
          </g>

          {/* Back Arm */}
          <g>
            {isMoving && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="-18 25 56; 16 25 56; -18 25 56"
                dur="0.42s"
                repeatCount="indefinite"
              />
            )}
            <rect
              x="16"
              y="55"
              width="10"
              height="17"
              rx="5"
              transform="rotate(14 21 63)"
              fill={
                p.outfitStyle === 'tank_muscle' || p.outfitStyle === 'crop_street'
                  ? p.skin
                  : p.primary
              }
              stroke="#111827"
              strokeWidth="3.6"
            />
            <circle
              cx="19"
              cy="71"
              r="5"
              fill={p.outfitStyle === 'knight_armor' ? '#52525B' : p.skin}
              stroke="#111827"
              strokeWidth="3.4"
            />
          </g>

          {/* Compact Chibi Torso */}
          <g transform={`translate(40 62) scale(${p.bodyScaleX} 1) translate(-40 -62)`}>
            {p.outfitStyle === 'trenchcoat' && (
              <path
                d="M20 55 L17 79 L63 79 L60 55 Z"
                fill={p.primary}
                stroke="#111827"
                strokeWidth="3.8"
                strokeLinejoin="round"
              />
            )}
            <rect
              x="24"
              y="49"
              width="32"
              height="27"
              rx="11"
              fill={p.outfitStyle === 'jester' ? '#4C1D95' : p.primary}
              stroke="#111827"
              strokeWidth="4.2"
            />
            {p.outfitStyle === 'jester' && (
              <>
                <path d="M40 50 L54 50 L54 74 L40 74 Z" fill="#DC2626" />
                <path
                  d="M25 50 L32 57 L40 50 L48 57 L55 50"
                  fill="none"
                  stroke="#FBBF24"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
              </>
            )}
            {p.outfitStyle === 'trenchcoat' && (
              <>
                <path d="M35 50 L40 60 L45 50 Z" fill="#FFFFFF" stroke="#111827" strokeWidth="2" />
                <circle cx="40" cy="54" r="3.2" fill="#DC2626" stroke="#111827" strokeWidth="2" />
              </>
            )}
            {p.outfitStyle === 'crop_street' && (
              <rect x="27" y="62" width="26" height="5" rx="2" fill={p.skin} />
            )}
            {p.outfitStyle === 'tank_muscle' && (
              <path
                d="M29 50 Q40 61 51 50"
                fill="none"
                stroke="#FBBF24"
                strokeWidth="4.4"
                strokeLinecap="round"
              />
            )}
            {p.outfitStyle === 'knight_armor' && (
              <>
                <path
                  d="M23 48 Q40 57 57 48 L53 56 Q40 61 27 56 Z"
                  fill="#991B1B"
                  stroke="#111827"
                  strokeWidth="2.8"
                />
                <circle cx="23" cy="54" r="6" fill="#6B7280" stroke="#111827" strokeWidth="3" />
                <circle cx="57" cy="54" r="6" fill="#6B7280" stroke="#111827" strokeWidth="3" />
              </>
            )}
            {/* Belt / Chest Stripe OR Streetwear Rib Graphic */}
            {p.outfitStyle === 'street_ribs' ? (
              <g>
                <rect
                  x="31"
                  y="52"
                  width="20"
                  height="18"
                  rx="4"
                  fill="#E5E7EB"
                  stroke="#111827"
                  strokeWidth="2.2"
                />
                <line x1="33" y1="56" x2="40" y2="55" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="33" y1="61" x2="41" y2="60" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="33" y1="66" x2="40" y2="65" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="46" cy="57" r="2" fill="#111827" />
                <circle cx="47" cy="63" r="1.5" fill="#111827" />
              </g>
            ) : (
              <>
                <rect
                  x="25"
                  y="66"
                  width="30"
                  height="6"
                  rx="3"
                  fill={p.accent}
                  stroke="#111827"
                  strokeWidth="3"
                />
                <circle
                  cx="40"
                  cy="59"
                  r="4.5"
                  fill={p.outfitStyle === 'knight_armor' ? '#FBBF24' : p.secondary}
                  stroke="#111827"
                  strokeWidth="2.5"
                />
              </>
            )}
          </g>

          {/* Front Arm + Held Prop (Bottle or NPC Item) */}
          <g>
            {isMoving && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="14 55 56; -16 55 56; 14 55 56"
                dur="0.42s"
                repeatCount="indefinite"
              />
            )}
            <rect
              x="54"
              y="54"
              width="10"
              height="17"
              rx="5"
              transform="rotate(-18 59 62)"
              fill={
                p.outfitStyle === 'tank_muscle' || p.outfitStyle === 'crop_street'
                  ? p.skin
                  : p.primary
              }
              stroke="#111827"
              strokeWidth="3.6"
            />

            {/* Character's Mini Bottle */}
            {p.propKind === 'bottle' && (
              <g transform="translate(63 53) rotate(14)">
                <rect
                  x="-4.5"
                  y="2"
                  width="9"
                  height="15"
                  rx="3"
                  fill={p.bottleColor || '#38BDF8'}
                  stroke="#111827"
                  strokeWidth="2.8"
                />
                <rect
                  x="-3"
                  y="9"
                  width="6"
                  height="6"
                  rx="1.5"
                  fill={p.bottleLiquid || '#F59E0B'}
                />
                <rect
                  x="-2.2"
                  y="-4"
                  width="4.4"
                  height="7"
                  rx="1.5"
                  fill={p.bottleColor || '#38BDF8'}
                  stroke="#111827"
                  strokeWidth="2.4"
                />
              </g>
            )}

            {/* Sailor Spyglass */}
            {p.propKind === 'spyglass' && (
              <g transform="translate(64 56) rotate(-22)">
                <rect
                  x="-3"
                  y="-7"
                  width="6"
                  height="17"
                  rx="2"
                  fill="#FBBF24"
                  stroke="#111827"
                  strokeWidth="2.6"
                />
                <rect
                  x="-4"
                  y="-9"
                  width="8"
                  height="4"
                  rx="1.5"
                  fill="#94A3B8"
                  stroke="#111827"
                  strokeWidth="2.4"
                />
              </g>
            )}

            {/* Spice Vendor Jar */}
            {p.propKind === 'spice' && (
              <g transform="translate(64 60)">
                <circle
                  cx="0"
                  cy="2"
                  r="6"
                  fill="#EF4444"
                  stroke="#111827"
                  strokeWidth="2.6"
                />
                <rect
                  x="-3.5"
                  y="-6"
                  width="7"
                  height="4"
                  rx="1.5"
                  fill="#FDE047"
                  stroke="#111827"
                  strokeWidth="2.2"
                />
              </g>
            )}

            {/* Mechanic Wrench */}
            {p.propKind === 'wrench' && (
              <g transform="translate(64 54) rotate(18)">
                <rect
                  x="-2.5"
                  y="-4"
                  width="5"
                  height="17"
                  rx="2"
                  fill="#CBD5E1"
                  stroke="#111827"
                  strokeWidth="2.5"
                />
                <circle
                  cx="0"
                  cy="-5"
                  r="4.5"
                  fill="#94A3B8"
                  stroke="#111827"
                  strokeWidth="2.5"
                />
              </g>
            )}

            {/* Chronicler Scroll */}
            {p.propKind === 'scroll' && (
              <g transform="translate(64 58) rotate(10)">
                <rect
                  x="-4.5"
                  y="-6"
                  width="9"
                  height="14"
                  rx="2.5"
                  fill="#FEF3C7"
                  stroke="#111827"
                  strokeWidth="2.5"
                />
                <line x1="-2" y1="-2" x2="2" y2="-2" stroke="#92400E" strokeWidth="1.8" />
                <line x1="-2" y1="2" x2="2" y2="2" stroke="#92400E" strokeWidth="1.8" />
              </g>
            )}

            <circle
              cx="61"
              cy="69"
              r="5"
              fill={p.outfitStyle === 'knight_armor' ? '#52525B' : p.skin}
              stroke="#111827"
              strokeWidth="3.4"
            />
          </g>

          {/* Big Expressive Chibi Head */}
          <g>
            {/* Boss Lady curly afro puffs behind head */}
            {p.headAccessory === 'afro_hoops' && (
              <g fill={p.hair} stroke="#111827" strokeWidth="3.4">
                <circle cx="20" cy="24" r="11" />
                <circle cx="60" cy="24" r="11" />
                <circle cx="28" cy="13" r="12" />
                <circle cx="52" cy="13" r="12" />
                <circle cx="40" cy="10" r="12.5" />
              </g>
            )}

            {/* Leo fluffy curly afro silhouette behind head */}
            {p.headAccessory === 'curly_afro' && (
              <g fill={p.hair} stroke="#111827" strokeWidth="3.4">
                <circle cx="21" cy="24" r="9.5" />
                <circle cx="59" cy="24" r="9.5" />
                <circle cx="29" cy="14" r="10" />
                <circle cx="51" cy="14" r="10" />
                <circle cx="40" cy="11" r="11" />
              </g>
            )}

            <ellipse
              cx="40"
              cy="32"
              rx="22"
              ry="20"
              fill={p.headAccessory === 'knight_helm' ? '#6B7280' : p.skin}
              stroke="#111827"
              strokeWidth="4.4"
            />

            {/* Hair Silhouette (hidden for knight full helmet, clown hat, or scalloped curly_afro) */}
            {p.headAccessory !== 'knight_helm' &&
              p.headAccessory !== 'jester_hat' &&
              p.headAccessory !== 'curly_afro' && (
                <path
                  d="M19 30 C19 14, 61 14, 61 30 Q49 21 40 24 Q30 21 19 30 Z"
                  fill={p.hair}
                  stroke="#111827"
                  strokeWidth="3.8"
                  strokeLinejoin="round"
                />
              )}

            {p.headAccessory === 'curly_afro' && (
              <path
                d="M18 30 Q20 15 30 16 Q35 11 41 15 Q47 11 52 16 Q60 16 62 30 Q53 23 46 25 Q40 21 33 25 Q26 23 18 30 Z"
                fill={p.hair}
                stroke="#111827"
                strokeWidth="3.6"
                strokeLinejoin="round"
              />
            )}

            {/* Sailor Beard */}
            {p.beard && (
              <path
                d="M27 40 Q40 55 53 40 Q49 48 40 49 Q31 48 27 40 Z"
                fill="#F8FAFC"
                stroke="#111827"
                strokeWidth="3.2"
                strokeLinejoin="round"
              />
            )}

            {/* Accessories */}
            {p.headAccessory === 'bandana' && (
              <g>
                <rect
                  x="18"
                  y="19"
                  width="44"
                  height="9"
                  rx="4"
                  fill={p.primary}
                  stroke="#111827"
                  strokeWidth="3.4"
                />
                <path
                  d="M18 23 L7 17 L11 28 Z"
                  fill={p.primary}
                  stroke="#111827"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
              </g>
            )}

            {p.headAccessory === 'flame_crown' && (
              <path
                d="M21 20 L27 5 L34 15 L40 2 L46 15 L53 6 L59 20 Z"
                fill="#F97316"
                stroke="#111827"
                strokeWidth="3.4"
                strokeLinejoin="round"
              />
            )}

            {p.headAccessory === 'goggles' && (
              <g>
                <rect
                  x="22"
                  y="15"
                  width="15"
                  height="10"
                  rx="4"
                  fill="#34D399"
                  stroke="#111827"
                  strokeWidth="3.2"
                />
                <rect
                  x="43"
                  y="15"
                  width="15"
                  height="10"
                  rx="4"
                  fill="#34D399"
                  stroke="#111827"
                  strokeWidth="3.2"
                />
              </g>
            )}

            {p.headAccessory === 'visor' && (
              <rect
                x="26"
                y="27"
                width="31"
                height="11"
                rx="5"
                fill="#38BDF8"
                stroke="#111827"
                strokeWidth="3.4"
              />
            )}

            {p.headAccessory === 'helmet' && (
              <path
                d="M17 29 A23 21 0 0 1 63 29 Z"
                fill="#64748B"
                stroke="#111827"
                strokeWidth="3.8"
              />
            )}

            {p.headAccessory === 'royal_crown' && (
              <g>
                <path
                  d="M21 19 L20 4 L32 13 L40 1 L48 13 L60 4 L59 19 Z"
                  fill="#FBBF24"
                  stroke="#111827"
                  strokeWidth="3.4"
                  strokeLinejoin="round"
                />
                <circle
                  cx="40"
                  cy="13"
                  r="3.2"
                  fill="#DC2626"
                  stroke="#111827"
                  strokeWidth="2.4"
                />
              </g>
            )}

            {p.headAccessory === 'jester_hat' && (
              <g>
                <path
                  d="M21 22 Q16 6 8 10 Q18 19 31 20 Z"
                  fill="#5B21B6"
                  stroke="#111827"
                  strokeWidth="3.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M59 22 Q64 6 72 10 Q62 19 49 20 Z"
                  fill="#DC2626"
                  stroke="#111827"
                  strokeWidth="3.2"
                  strokeLinejoin="round"
                />
                <circle cx="8" cy="11" r="4.2" fill="#FDE047" stroke="#111827" strokeWidth="2.4" />
                <circle cx="72" cy="11" r="4.2" fill="#FDE047" stroke="#111827" strokeWidth="2.4" />
              </g>
            )}

            {p.headAccessory === 'knight_helm' && (
              <g>
                {/* Crimson Plume */}
                <path
                  d="M36 12 Q24 -2 12 8 Q20 14 29 14 Z"
                  fill="#DC2626"
                  stroke="#111827"
                  strokeWidth="3.2"
                  strokeLinejoin="round"
                />
                {/* Armored Visor Plate */}
                <path
                  d="M22 25 L58 25 L55 47 L40 52 L25 47 Z"
                  fill="#4B5563"
                  stroke="#111827"
                  strokeWidth="3.4"
                  strokeLinejoin="round"
                />
                {/* Glowing slits & vertical grill */}
                <line x1="29" y1="31" x2="38" y2="33" stroke="#111827" strokeWidth="3.4" strokeLinecap="round" />
                <line x1="51" y1="31" x2="43" y2="33" stroke="#111827" strokeWidth="3.4" strokeLinecap="round" />
                <line x1="34" y1="38" x2="34" y2="45" stroke="#111827" strokeWidth="2.6" strokeLinecap="round" />
                <line x1="40" y1="38" x2="40" y2="47" stroke="#111827" strokeWidth="2.6" strokeLinecap="round" />
                <line x1="46" y1="38" x2="46" y2="45" stroke="#111827" strokeWidth="2.6" strokeLinecap="round" />
              </g>
            )}

            {p.headAccessory === 'afro_hoops' && (
              <g>
                <circle cx="19" cy="40" r="5" fill="none" stroke="#FBBF24" strokeWidth="3" />
                <circle cx="61" cy="40" r="5" fill="none" stroke="#FBBF24" strokeWidth="3" />
              </g>
            )}

            {p.headAccessory === 'sailor_cap' && (
              <g>
                <ellipse
                  cx="40"
                  cy="16"
                  rx="20"
                  ry="8"
                  fill="#F8FAFC"
                  stroke="#111827"
                  strokeWidth="3.4"
                />
                <rect
                  x="24"
                  y="17"
                  width="34"
                  height="6"
                  rx="3"
                  fill="#1E293B"
                  stroke="#111827"
                  strokeWidth="3"
                />
              </g>
            )}

            {p.headAccessory === 'spice_scarf' && (
              <path
                d="M19 25 Q40 12 61 25 L57 14 Q40 8 23 14 Z"
                fill="#FACC15"
                stroke="#111827"
                strokeWidth="3.4"
                strokeLinejoin="round"
              />
            )}

            {p.headAccessory === 'mechanic_cap' && (
              <g>
                <path
                  d="M20 22 A20 14 0 0 1 60 22 Z"
                  fill="#0284C7"
                  stroke="#111827"
                  strokeWidth="3.4"
                />
                <rect
                  x="44"
                  y="19"
                  width="20"
                  height="5"
                  rx="2.5"
                  fill="#FBBF24"
                  stroke="#111827"
                  strokeWidth="3"
                />
              </g>
            )}

            {p.headAccessory === 'beret' && (
              <ellipse
                cx="38"
                cy="15"
                rx="21"
                ry="8"
                transform="rotate(-10 38 15)"
                fill="#7C3AED"
                stroke="#111827"
                strokeWidth="3.4"
              />
            )}

            {/* Eyes & Shades (skip bare eyes on closed knight helmet) */}
            {p.headAccessory !== 'knight_helm' && (
              <>
                {p.headAccessory === 'rich_shades' || p.headAccessory === 'afro_hoops' ? (
                  <g>
                    <rect
                      x="27"
                      y="29"
                      width="13"
                      height="9"
                      rx="3"
                      fill="#111827"
                      stroke="#FBBF24"
                      strokeWidth="2.2"
                    />
                    <rect
                      x="43"
                      y="29"
                      width="13"
                      height="9"
                      rx="3"
                      fill="#111827"
                      stroke="#FBBF24"
                      strokeWidth="2.2"
                    />
                    <line x1="40" y1="33" x2="43" y2="33" stroke="#FBBF24" strokeWidth="2.4" />
                  </g>
                ) : (
                  <>
                    <ellipse
                      cx="35"
                      cy="34"
                      rx={p.headAccessory === 'curly_afro' ? 5.5 : 4.6}
                      ry={p.headAccessory === 'curly_afro' ? 6.4 : 5.4}
                      fill="#FFFFFF"
                      stroke="#111827"
                      strokeWidth="2.6"
                    />
                    <circle
                      cx="36.2"
                      cy="34.5"
                      r={p.headAccessory === 'curly_afro' ? 3.5 : 2.5}
                      fill="#111827"
                    />
                    <circle cx="34.8" cy="32.2" r="1.3" fill="#FFFFFF" />
                    {p.headAccessory === 'curly_afro' && (
                      <circle cx="37.6" cy="36" r="0.8" fill="#FFFFFF" />
                    )}

                    <ellipse
                      cx="50"
                      cy="34"
                      rx={p.headAccessory === 'curly_afro' ? 5.5 : 4.6}
                      ry={p.headAccessory === 'curly_afro' ? 6.4 : 5.4}
                      fill="#FFFFFF"
                      stroke="#111827"
                      strokeWidth="2.6"
                    />
                    <circle
                      cx="51"
                      cy="34.5"
                      r={p.headAccessory === 'curly_afro' ? 3.5 : 2.5}
                      fill="#111827"
                    />
                    <circle cx="49.6" cy="32.2" r="1.3" fill="#FFFFFF" />
                    {p.headAccessory === 'curly_afro' && (
                      <circle cx="52.4" cy="36" r="0.8" fill="#FFFFFF" />
                    )}
                  </>
                )}

                {/* Blush cheeks */}
                <ellipse cx="27" cy="39" rx="3" ry="1.6" fill="#FB7185" opacity="0.55" />
                <ellipse cx="56" cy="39" rx="3" ry="1.6" fill="#FB7185" opacity="0.55" />

                {/* Smile */}
                <path
                  d="M38 43 Q43 47 48 42"
                  fill="none"
                  stroke="#111827"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />
              </>
            )}
          </g>
        </g>
      </g>
    </svg>
  );
};
