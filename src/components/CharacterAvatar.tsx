import React from 'react';
import { CHARACTERS } from '../data/gameData';

interface CharacterAvatarProps {
  charId: string;
  size?: number;
  className?: string;
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  charId,
  size = 56,
  className = '',
}) => {
  const char = CHARACTERS[charId] || CHARACTERS.leo;
  const v = char.visual;

  // Stylized head/jawline proportions matched to each body archetype
  const isHeavy = v.bodyType === 'stocky';
  const isTitan = v.bodyType === 'titan' || v.bodyType === 'monarch';
  const isLanky = v.bodyType === 'lanky';
  const isAgile = v.bodyType === 'agile';
  const outfit = v.outfitStyle || 'standard';

  const shoulderPath = isTitan
    ? 'M6 74 Q22 48 40 50 Q58 48 74 74'
    : isHeavy
    ? 'M10 74 Q40 46 70 74'
    : isLanky
    ? 'M18 74 Q40 56 62 74'
    : 'M14 73 Q40 52 66 73';

  const headPath = isTitan
    ? 'M22 36 Q22 21 40 21 Q58 21 58 36 L55 54 Q40 64 25 54 Z'
    : isHeavy
    ? 'M19 42 Q19 24 40 24 Q61 24 61 42 Q61 62 40 62 Q19 62 19 42 Z'
    : isLanky
    ? 'M24 37 Q24 21 40 21 Q56 21 56 37 L50 56 Q40 63 30 56 Z'
    : isAgile
    ? 'M23 38 Q23 22 40 22 Q57 22 57 38 L52 55 Q40 62 28 55 Z'
    : 'M22 39 Q22 22 40 22 Q58 22 58 39 L53 56 Q40 62 27 56 Z';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      className={`shrink-0 ${className}`}
      aria-label={char.name}
    >
      {/* Background medallion */}
      <circle
        cx="40"
        cy="40"
        r="36"
        fill={
          outfit === 'street_ribs'
            ? '#0284C7'
            : outfit === 'trenchcoat'
            ? '#B91C1C'
            : outfit === 'knight_armor'
            ? '#991B1B'
            : outfit === 'jester'
            ? '#3B0764'
            : v.primary
        }
        stroke="#111827"
        strokeWidth="5"
      />
      <circle
        cx="40"
        cy="40"
        r="29"
        fill={outfit === 'street_ribs' ? '#38BDF8' : v.secondary}
        opacity={outfit === 'street_ribs' ? 0.38 : 0.28}
      />

      {/* Big Afro hair back silhouette for Boss Lady */}
      {v.accessory === 'afro_hoops' && (
        <g fill="#140E13" stroke="#111827" strokeWidth="4">
          <circle cx="20" cy="31" r="13.5" />
          <circle cx="60" cy="31" r="13.5" />
          <circle cx="27" cy="18" r="13" />
          <circle cx="53" cy="18" r="13" />
          <circle cx="40" cy="14" r="14.5" />
        </g>
      )}

      {/* Leo Curly Afro Back Halo */}
      {v.accessory === 'curly_afro' && (
        <g fill="#140E13" stroke="#111827" strokeWidth="4">
          <circle cx="23" cy="27" r="9.5" />
          <circle cx="57" cy="27" r="9.5" />
          <circle cx="30" cy="18" r="10.5" />
          <circle cx="50" cy="18" r="10.5" />
          <circle cx="40" cy="15" r="11.5" />
        </g>
      )}

      {/* Shoulders */}
      <path
        d={shoulderPath}
        fill={
          outfit === 'tank_muscle' || outfit === 'crop_street'
            ? v.skin
            : outfit === 'jester'
            ? '#4C1D95'
            : v.primary
        }
        stroke="#111827"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Leo Streetwear Black Sweater with White Rib/Graffiti Chest Graphic */}
      {outfit === 'street_ribs' && (
        <g>
          <path
            d="M31 55 L49 55 L52 73 L28 73 Z"
            fill="#E5E7EB"
            stroke="#111827"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <path
            d="M30 60 L38 58 M30 65 L39 63 M31 70 L39 68"
            stroke="#111827"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx="45" cy="61" r="2.2" fill="#111827" />
          <circle cx="46" cy="67" r="1.7" fill="#111827" />
        </g>
      )}

      {/* Boss Lady Athletic Black Top + Red Chest Stripe */}
      {outfit === 'crop_street' && (
        <g>
          <path
            d="M24 58 L27 74 L53 74 L56 58 Q40 63 24 58 Z"
            fill="#18121E"
            stroke="#111827"
            strokeWidth="3.2"
          />
          <path d="M27 65 L53 65" stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      )}

      {/* Big Boss Tank Top & Thick Gold Chain Links */}
      {outfit === 'tank_muscle' && (
        <g>
          <path
            d="M21 56 L26 74 L54 74 L59 56 Q40 62 21 56 Z"
            fill="#18141A"
            stroke="#111827"
            strokeWidth="3.5"
          />
          <path
            d="M27 56 Q40 69 53 56"
            fill="none"
            stroke="#111827"
            strokeWidth="8.5"
            strokeLinecap="round"
          />
          <path
            d="M27 56 Q40 69 53 56"
            fill="none"
            stroke="#FBBF24"
            strokeWidth="5"
            strokeDasharray="4 2"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* Rich Boss Cream Coat Lapels + White Collar + Red Bow Tie */}
      {outfit === 'trenchcoat' && (
        <g>
          <polygon points="32,57 48,57 40,74" fill="#1E1B24" stroke="#111827" strokeWidth="2.4" />
          <polygon points="27,57 34,57 36,72 24,72" fill="#FFF8EB" stroke="#111827" strokeWidth="2.4" />
          <polygon points="53,57 46,57 44,72 56,72" fill="#FFF8EB" stroke="#111827" strokeWidth="2.4" />
          <polygon points="40,61 31,56 31,66" fill="#B91C1C" stroke="#111827" strokeWidth="2.4" />
          <polygon points="40,61 49,56 49,66" fill="#B91C1C" stroke="#111827" strokeWidth="2.4" />
          <circle cx="40" cy="61" r="2.6" fill="#DC2626" stroke="#111827" strokeWidth="2" />
        </g>
      )}

      {/* Clown Split Purple/Crimson Jester Collar */}
      {outfit === 'jester' && (
        <g>
          <path
            d="M40 57 L64 74 L40 74 Z"
            fill="#DC2626"
            stroke="#111827"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M22 57 L30 68 L40 59 L50 68 L58 57"
            fill="#DC2626"
            stroke="#111827"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          <circle cx="40" cy="62" r="3" fill="#FBBF24" stroke="#111827" strokeWidth="2" />
        </g>
      )}

      {/* Knight Crimson Scarf & Steel Pauldrons */}
      {outfit === 'knight_armor' && (
        <g>
          <path
            d="M11 69 Q18 54 27 59 L22 73 Z"
            fill="#4A434E"
            stroke="#111827"
            strokeWidth="3.2"
          />
          <path
            d="M69 69 Q62 54 53 59 L58 73 Z"
            fill="#4A434E"
            stroke="#111827"
            strokeWidth="3.2"
          />
          <rect
            x="21"
            y="53"
            width="38"
            height="13"
            rx="6"
            fill="#B91C1C"
            stroke="#111827"
            strokeWidth="3.8"
          />
        </g>
      )}

      {/* Neck */}
      <rect
        x={isTitan ? 32 : 34}
        y="50"
        width={isTitan ? 16 : 12}
        height="12"
        rx="4"
        fill={v.accessory === 'knight_helm' ? '#2D2733' : v.skin}
        stroke="#111827"
        strokeWidth="3.5"
      />

      {/* Knight Full Visor Helmet OR Stylized Cartoon Head */}
      {v.accessory === 'knight_helm' ? (
        <g>
          {/* Crimson Flowing Plume */}
          <path
            d="M37 22 Q18 3 10 21 Q22 25 32 24 Z"
            fill="#B91C1C"
            stroke="#111827"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Steel Helm Dome */}
          <path
            d="M21 38 Q21 19 40 19 Q59 19 59 38 L56 56 Q40 64 24 56 Z"
            fill="#4A434E"
            stroke="#111827"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
          {/* Angular Visor Faceplate */}
          <path
            d="M25 34 L40 31 L55 34 L51 54 Q40 61 29 54 Z"
            fill="#2D2733"
            stroke="#111827"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Central visor ridge + glowing eye slits + grille */}
          <line x1="40" y1="31" x2="40" y2="57" stroke="#6B7280" strokeWidth="2.4" />
          <line x1="28" y1="38" x2="38" y2="40" stroke="#FDE047" strokeWidth="2.8" strokeLinecap="round" />
          <line x1="42" y1="40" x2="52" y2="38" stroke="#FDE047" strokeWidth="2.8" strokeLinecap="round" />
          <line x1="33" y1="45" x2="33" y2="54" stroke="#111827" strokeWidth="2.8" />
          <line x1="40" y1="45" x2="40" y2="55" stroke="#111827" strokeWidth="2.8" />
          <line x1="47" y1="45" x2="47" y2="54" stroke="#111827" strokeWidth="2.8" />
        </g>
      ) : (
        <g>
          <path
            d={headPath}
            fill={v.skin}
            stroke="#111827"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />

          {/* Hair */}
          {v.accessory !== 'jester_hat' &&
            v.accessory !== 'afro_hoops' &&
            v.accessory !== 'curly_afro' && (
              <path
                d={
                  v.accessory === 'gold_chain'
                    ? 'M23 31 L25 20 L55 20 L57 31 Q40 26 23 31 Z'
                    : 'M22 37 A19 17 0 0 1 58 37 Q40 27 22 37 Z'
                }
                fill={v.hair}
                stroke="#111827"
                strokeWidth="4"
                strokeLinejoin="round"
              />
            )}

          {/* Leo Scalloped Curly Hairline Bangs */}
          {v.accessory === 'curly_afro' && (
            <path
              d="M21 34 Q22 21 30 22 Q35 16 41 20 Q47 16 51 22 Q58 22 59 34 Q52 27 45 29 Q40 25 34 29 Q27 27 21 34 Z"
              fill="#140E13"
              stroke="#111827"
              strokeWidth="3.6"
              strokeLinejoin="round"
            />
          )}

          {/* Accessories */}
          {v.accessory === 'bandana' && (
            <g>
              <rect
                x="20"
                y="27"
                width="40"
                height="9"
                rx="4"
                fill={v.primary}
                stroke="#111827"
                strokeWidth="3.5"
              />
              <path
                d="M20 31 L10 25 L13 36 Z"
                fill={v.primary}
                stroke="#111827"
                strokeWidth="3"
                strokeLinejoin="round"
              />
            </g>
          )}
          {v.accessory === 'flame_crown' && (
            <path
              d="M22 30 L28 13 L35 24 L40 9 L46 24 L53 14 L58 30 Z"
              fill="#F97316"
              stroke="#111827"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
          )}
          {v.accessory === 'goggles' && (
            <g>
              <rect
                x="23"
                y="24"
                width="15"
                height="10"
                rx="4"
                fill="#34D399"
                stroke="#111827"
                strokeWidth="3.5"
              />
              <rect
                x="42"
                y="24"
                width="15"
                height="10"
                rx="4"
                fill="#34D399"
                stroke="#111827"
                strokeWidth="3.5"
              />
            </g>
          )}
          {v.accessory === 'visor' && (
            <rect
              x="26"
              y="36"
              width="30"
              height="11"
              rx="5"
              fill="#38BDF8"
              stroke="#111827"
              strokeWidth="3.5"
            />
          )}
          {v.accessory === 'helmet' && (
            <path
              d="M19 37 A21 20 0 0 1 61 37 Z"
              fill="#64748B"
              stroke="#111827"
              strokeWidth="4"
            />
          )}
          {v.accessory === 'royal_crown' && (
            <g>
              <path
                d="M21 28 L20 10 L32 20 L40 6 L48 20 L60 10 L59 28 Z"
                fill="#FBBF24"
                stroke="#111827"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              <circle
                cx="40"
                cy="20"
                r="3.5"
                fill="#DC2626"
                stroke="#111827"
                strokeWidth="2.5"
              />
            </g>
          )}
          {v.accessory === 'rich_shades' && (
            <g>
              <ellipse cx="40" cy="20" rx="15" ry="7.5" fill="#1A1418" stroke="#111827" strokeWidth="3.2" />
              <circle cx="22" cy="44" r="3" fill="#FBBF24" stroke="#111827" strokeWidth="2" />
            </g>
          )}
          {v.accessory === 'gold_chain' && (
            <circle cx="22" cy="43" r="3" fill="#FBBF24" stroke="#111827" strokeWidth="2" />
          )}
          {v.accessory === 'afro_hoops' && (
            <g>
              <circle cx="21" cy="48" r="5.5" fill="none" stroke="#FBBF24" strokeWidth="3.2" />
              <circle cx="59" cy="48" r="5.5" fill="none" stroke="#FBBF24" strokeWidth="3.2" />
            </g>
          )}
          {v.accessory === 'jester_hat' && (
            <g>
              <path
                d="M23 31 Q9 10 9 23 Q20 26 39 24 Z"
                fill="#4C1D95"
                stroke="#111827"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              <path
                d="M40 24 Q58 9 71 23 Q58 27 57 31 Z"
                fill="#DC2626"
                stroke="#111827"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              <circle cx="9" cy="23" r="4.2" fill="#FBBF24" stroke="#111827" strokeWidth="2.5" />
              <circle cx="71" cy="23" r="4.2" fill="#FBBF24" stroke="#111827" strokeWidth="2.5" />
              {/* Harlequin black eye spikes */}
              <polygon points="34,36 31,32 37,33" fill="#111827" />
              <polygon points="48,36 45,33 51,32" fill="#111827" />
            </g>
          )}

          {/* Eyes or Boss Sunglasses */}
          {v.accessory === 'rich_shades' || v.accessory === 'afro_hoops' ? (
            <g>
              <rect
                x="25"
                y="35"
                width="13"
                height="9.5"
                rx="3"
                fill="#0F172A"
                stroke={v.accessory === 'rich_shades' ? '#FBBF24' : '#111827'}
                strokeWidth="2.6"
              />
              <rect
                x="42"
                y="35"
                width="13"
                height="9.5"
                rx="3"
                fill="#0F172A"
                stroke={v.accessory === 'rich_shades' ? '#FBBF24' : '#111827'}
                strokeWidth="2.6"
              />
              <line x1="38" y1="39" x2="42" y2="39" stroke="#FBBF24" strokeWidth="2.6" />
              <line x1="27" y1="37" x2="31" y2="41" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.55" />
              <line x1="44" y1="37" x2="48" y2="41" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.55" />
            </g>
          ) : v.accessory === 'curly_afro' ? (
            <g>
              {/* Cute Expressive Large Eyes (Sheet 2) */}
              <path d="M27 33 Q33 30 37 33" fill="none" stroke="#111827" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M43 33 Q48 30 53 33" fill="none" stroke="#111827" strokeWidth="2.4" strokeLinecap="round" />
              <ellipse cx="33" cy="40.5" rx="5.2" ry="6.2" fill="#FFFFFF" stroke="#111827" strokeWidth="2.6" />
              <circle cx="34" cy="41" r="3.4" fill="#111827" />
              <circle cx="32.6" cy="39" r="1.4" fill="#FFFFFF" />
              <circle cx="35.5" cy="42.6" r="0.8" fill="#FFFFFF" />

              <ellipse cx="48" cy="40.5" rx="5.2" ry="6.2" fill="#FFFFFF" stroke="#111827" strokeWidth="2.6" />
              <circle cx="48.5" cy="41" r="3.4" fill="#111827" />
              <circle cx="47.2" cy="39" r="1.4" fill="#FFFFFF" />
              <circle cx="50" cy="42.6" r="0.8" fill="#FFFFFF" />

              <ellipse cx="26" cy="46.5" rx="2.6" ry="1.4" fill="#FB7185" opacity="0.45" />
              <ellipse cx="54.5" cy="46.5" rx="2.6" ry="1.4" fill="#FB7185" opacity="0.45" />
            </g>
          ) : (
            <g>
              {v.accessory === 'gold_chain' && (
                <>
                  <line x1="27" y1="35" x2="38" y2="37" stroke="#111827" strokeWidth="3.2" strokeLinecap="round" />
                  <line x1="42" y1="37" x2="53" y2="35" stroke="#111827" strokeWidth="3.2" strokeLinecap="round" />
                </>
              )}
              <circle cx="34" cy="42" r="4.2" fill="#FFFFFF" stroke="#111827" strokeWidth="2.5" />
              <circle cx="35" cy="42" r="2" fill={v.accessory === 'jester_hat' ? '#DC2626' : '#111827'} />
              <circle cx="48" cy="42" r="4.2" fill="#FFFFFF" stroke="#111827" strokeWidth="2.5" />
              <circle cx="49" cy="42" r="2" fill={v.accessory === 'jester_hat' ? '#DC2626' : '#111827'} />
            </g>
          )}

          {/* Expression */}
          {v.accessory === 'jester_hat' ? (
            <path
              d="M30 49 Q40 60 51 48 Z"
              fill="#FFFFFF"
              stroke="#111827"
              strokeWidth="2.8"
              strokeLinejoin="round"
            />
          ) : v.accessory === 'rich_shades' ? (
            <path
              d="M32 50 Q41 58 50 49 Z"
              fill="#FFFFFF"
              stroke="#111827"
              strokeWidth="2.6"
              strokeLinejoin="round"
            />
          ) : v.accessory === 'gold_chain' ? (
            <rect
              x="33"
              y="50"
              width="14"
              height="6"
              rx="2"
              fill="#FFFFFF"
              stroke="#111827"
              strokeWidth="2.6"
            />
          ) : v.accessory === 'curly_afro' ? (
            <path
              d="M34 51 Q41 57 48 50"
              fill="none"
              stroke="#111827"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ) : (
            <path
              d={isTitan ? 'M33 53 L47 52' : 'M34 52 Q41 58 48 51'}
              fill="none"
              stroke="#111827"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          )}
        </g>
      )}
    </svg>
  );
};
