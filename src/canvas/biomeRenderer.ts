import { ActiveBattleConfig, ArenaBiomeId } from '../types/game';

export interface BiomeDef {
  id: ArenaBiomeId;
  name: string;
  district: string;
  tagline: string;
  accentColor: string;
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  floorTop: string;
  floorBottom: string;
  floorBorder: string;
}

export const BIOME_ORDER: ArenaBiomeId[] = [
  'docks',
  'market',
  'rooftops',
  'station',
  'castle',
];

export const BIOMES: Record<ArenaBiomeId, BiomeDef> = {
  docks: {
    id: 'docks',
    name: 'Cais do Porto',
    district: 'Docas da Cidade',
    tagline: 'Brisa salgada, farol giratório e tábuas de madeira sobre o mar.',
    accentColor: '#38BDF8',
    skyTop: '#0369A1',
    skyMid: '#0EA5E9',
    skyBottom: '#FDE68A',
    floorTop: '#92400E',
    floorBottom: '#451A03',
    floorBorder: '#F59E0B',
  },
  market: {
    id: 'market',
    name: 'Feira da Pimenta',
    district: 'Bazar das Especiarias',
    tagline: 'Toldos listrados, lanternas ao vento e aroma de pimenta quente.',
    accentColor: '#FB923C',
    skyTop: '#7C2D12',
    skyMid: '#EA580C',
    skyBottom: '#FBBF24',
    floorTop: '#B45309',
    floorBottom: '#572808',
    floorBorder: '#FDE047',
  },
  rooftops: {
    id: 'rooftops',
    name: 'Telhados Elásticos',
    district: 'Bairro Noturno',
    tagline: 'Céu estrelado, letreiros neon e coberturas suspensas da cidade.',
    accentColor: '#34D399',
    skyTop: '#0F172A',
    skyMid: '#1E1B4B',
    skyBottom: '#312E81',
    floorTop: '#334155',
    floorBottom: '#0F172A',
    floorBorder: '#34D399',
  },
  station: {
    id: 'station',
    name: 'Estação Ferroviária',
    district: 'Depósito Central',
    tagline: 'Arcos de aço, vapor de locomotiva e sinais ferroviários acesos.',
    accentColor: '#F59E0B',
    skyTop: '#1C1917',
    skyMid: '#44403C',
    skyBottom: '#9A3412',
    floorTop: '#475569',
    floorBottom: '#1E293B',
    floorBorder: '#FBBF24',
  },
  castle: {
    id: 'castle',
    name: 'Castelo do Rei Karrolo',
    district: 'Cidadela Real',
    tagline: 'Vitrais góticos, tochas ardentes e tapete real diante do trono.',
    accentColor: '#EF4444',
    skyTop: '#1A0812',
    skyMid: '#4C0519',
    skyBottom: '#881337',
    floorTop: '#3B0764',
    floorBottom: '#1E1B4B',
    floorBorder: '#FBBF24',
  },
};

export const BIOME_LIST: BiomeDef[] = BIOME_ORDER.map((id) => BIOMES[id]);

export function resolveBattleBiome(config: ActiveBattleConfig): ArenaBiomeId {
  if (config.mode === 'STORY' && config.storyLevel) {
    return BIOME_ORDER[config.storyLevel.phaseIndex % BIOME_ORDER.length] || 'docks';
  }

  if (config.mode === 'ARCADE') {
    const startIdx = config.arenaBiome ? Math.max(0, BIOME_ORDER.indexOf(config.arenaBiome)) : 0;
    if (config.arenaBiome && config.arenaCycle === false) {
      return config.arenaBiome;
    }
    const waveOffset = Math.max(0, (config.arcadeWave || 1) - 1);
    return BIOME_ORDER[(startIdx + waveOffset) % BIOME_ORDER.length];
  }

  if (config.arenaBiome) {
    return config.arenaBiome;
  }

  // Deterministic pleasant fallback based on opponent char
  const charMap: Record<string, ArenaBiomeId> = {
    leo: 'docks',
    nina: 'docks',
    brasa: 'market',
    mola: 'rooftops',
    ferro: 'station',
    karrolo: 'castle',
    rich_boss: 'docks',
    boss_lady: 'market',
    clown: 'rooftops',
    big_boss: 'station',
    knight: 'castle',
  };
  return charMap[config.player2CharId] || 'docks';
}

const INK = '#111827';

export interface BiomeDrawOptions {
  isBoss?: boolean;
  levelIndex?: number;
  wave?: number;
}

export function drawBiomeBackground(
  ctx: CanvasRenderingContext2D,
  biomeId: ArenaBiomeId,
  w: number,
  h: number,
  time: number,
  options: BiomeDrawOptions = {}
) {
  const biome = BIOMES[biomeId] || BIOMES.docks;
  const horizonY = h * 0.78;
  const isBoss = Boolean(options.isBoss);
  const intensity = Math.min(1, ((options.levelIndex ?? 0) / 5) * 0.5 + (isBoss ? 0.5 : 0));

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // 1. Sky / Backwall gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  skyGrad.addColorStop(0, biome.skyTop);
  skyGrad.addColorStop(0.58, biome.skyMid);
  skyGrad.addColorStop(1, biome.skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, horizonY + 8);

  // Subtle comic sunburst rays behind center arena
  ctx.save();
  ctx.globalAlpha = isBoss ? 0.14 : 0.08;
  ctx.fillStyle = '#FFF8EB';
  const rayCx = w * 0.5;
  const rayCy = horizonY * 0.68;
  for (let i = 0; i < 12; i++) {
    const a1 = (i / 12) * Math.PI * 2 + time * 0.05;
    const a2 = a1 + Math.PI / 24;
    ctx.beginPath();
    ctx.moveTo(rayCx, rayCy);
    ctx.lineTo(rayCx + Math.cos(a1) * w, rayCy + Math.sin(a1) * w);
    ctx.lineTo(rayCx + Math.cos(a2) * w, rayCy + Math.sin(a2) * w);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Boss dramatic dusk/storm vignette tint
  if (intensity > 0.1) {
    ctx.fillStyle = `rgba(17, 24, 39, ${intensity * 0.24})`;
    ctx.fillRect(0, 0, w, horizonY);
  }

  // 2. Biome-specific layered midground scenery
  switch (biomeId) {
    case 'docks':
      drawDocksScenery(ctx, w, h, horizonY, time, isBoss);
      break;
    case 'market':
      drawMarketScenery(ctx, w, h, horizonY, time, isBoss);
      break;
    case 'rooftops':
      drawRooftopsScenery(ctx, w, h, horizonY, time, isBoss);
      break;
    case 'station':
      drawStationScenery(ctx, w, h, horizonY, time, isBoss);
      break;
    case 'castle':
      drawCastleScenery(ctx, w, h, horizonY, time, isBoss);
      break;
  }

  // 3. Foreground Floor Deck aligned with fighters (floorY = h * 0.85)
  drawBiomeFloor(ctx, biome, w, h, horizonY);

  // 4. Subtle vignette framing so foreground fighters pop with crisp contrast
  const edgeGrad = ctx.createRadialGradient(w * 0.5, h * 0.55, w * 0.28, w * 0.5, h * 0.55, w * 0.78);
  edgeGrad.addColorStop(0, 'rgba(0,0,0,0)');
  edgeGrad.addColorStop(1, isBoss ? 'rgba(17,24,39,0.42)' : 'rgba(17,24,39,0.24)');
  ctx.fillStyle = edgeGrad;
  ctx.fillRect(0, 0, w, h);

  ctx.restore();
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, fill: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = fill;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-48, 14);
  ctx.quadraticCurveTo(-56, -4, -36, -8);
  ctx.quadraticCurveTo(-28, -32, -2, -26);
  ctx.quadraticCurveTo(18, -38, 34, -16);
  ctx.quadraticCurveTo(54, -12, 48, 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawDocksScenery(
  ctx: CanvasRenderingContext2D,
  w: number,
  _h: number,
  horizonY: number,
  time: number,
  isBoss: boolean
) {
  const seaTop = horizonY * 0.72;

  // Big cartoon harbor sun
  const sunX = w * 0.76;
  const sunY = horizonY * 0.34;
  ctx.fillStyle = isBoss ? '#FB923C' : '#FDE047';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.arc(sunX, sunY, Math.min(w, horizonY) * 0.11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Drifting stylized clouds
  const cloudOffset1 = ((time * 14) % (w + 220)) - 110;
  const cloudOffset2 = ((time * 9 + w * 0.55) % (w + 220)) - 110;
  drawCloud(ctx, cloudOffset1, horizonY * 0.22, 1.0, '#FFF8EB');
  drawCloud(ctx, cloudOffset2, horizonY * 0.31, 0.75, '#FEF3C7');

  // Distant island + lighthouse on left headland
  const lhBaseX = w * 0.14;
  const lhBaseY = seaTop + 8;
  ctx.fillStyle = '#065F46';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, seaTop + 12);
  ctx.quadraticCurveTo(w * 0.12, seaTop - 26, w * 0.27, seaTop + 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Lighthouse tower
  const lhH = Math.min(130, horizonY * 0.32);
  ctx.fillStyle = '#FFF8EB';
  ctx.beginPath();
  ctx.moveTo(lhBaseX - 18, lhBaseY);
  ctx.lineTo(lhBaseX - 11, lhBaseY - lhH);
  ctx.lineTo(lhBaseX + 11, lhBaseY - lhH);
  ctx.lineTo(lhBaseX + 18, lhBaseY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Red stripes on lighthouse
  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.moveTo(lhBaseX - 15, lhBaseY - lhH * 0.3);
  ctx.lineTo(lhBaseX + 15, lhBaseY - lhH * 0.3);
  ctx.lineTo(lhBaseX + 13, lhBaseY - lhH * 0.54);
  ctx.lineTo(lhBaseX - 13, lhBaseY - lhH * 0.54);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Lighthouse rotating beam
  const beamAngle = Math.sin(time * 0.9) * 0.35 + 0.15;
  ctx.save();
  ctx.translate(lhBaseX, lhBaseY - lhH - 8);
  ctx.rotate(beamAngle);
  ctx.fillStyle = 'rgba(254, 240, 138, 0.22)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w * 0.55, -52);
  ctx.lineTo(w * 0.55, 52);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Lighthouse lantern dome
  ctx.fillStyle = '#FBBF24';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.5;
  ctx.fillRect(lhBaseX - 12, lhBaseY - lhH - 16, 24, 16);
  ctx.strokeRect(lhBaseX - 12, lhBaseY - lhH - 16, 24, 16);
  ctx.fillStyle = '#EF4444';
  ctx.beginPath();
  ctx.arc(lhBaseX, lhBaseY - lhH - 16, 13, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bobbing cargo boat silhouette on right sea
  const shipX = w * 0.82;
  const shipY = seaTop + 6 + Math.sin(time * 2.1) * 3;
  ctx.save();
  ctx.translate(shipX, shipY);
  ctx.rotate(Math.sin(time * 1.6) * 0.03);
  ctx.fillStyle = '#1E293B';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-48, 0);
  ctx.lineTo(48, 0);
  ctx.lineTo(36, 18);
  ctx.lineTo(-34, 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#E11D48';
  ctx.fillRect(-16, -24, 28, 24);
  ctx.strokeRect(-16, -24, 28, 24);
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(-10, -40, 8, 16);
  ctx.strokeRect(-10, -40, 8, 16);
  ctx.restore();

  // Stylized Ocean Band with undulating comic waves
  ctx.fillStyle = '#0284C7';
  ctx.fillRect(0, seaTop, w, horizonY - seaTop);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, seaTop);
  ctx.lineTo(w, seaTop);
  ctx.stroke();

  // Animated wave crests
  ctx.strokeStyle = '#BAE6FD';
  ctx.lineWidth = 3.5;
  for (let row = 0; row < 2; row++) {
    const wy = seaTop + 18 + row * 22;
    const shift = (time * (28 + row * 12)) % 64;
    ctx.beginPath();
    for (let x = -64; x < w + 64; x += 64) {
      ctx.moveTo(x + shift, wy);
      ctx.quadraticCurveTo(x + 16 + shift, wy - 7, x + 32 + shift, wy);
    }
    ctx.stroke();
  }

  // Harbor wooden bollards & fluttering pennants at pier edge
  const postXs = [w * 0.08, w * 0.92];
  for (const px of postXs) {
    ctx.fillStyle = '#78350F';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.roundRect(px - 12, horizonY - 58, 24, 64, 5);
    ctx.fill();
    ctx.stroke();

    // Rope coil
    ctx.fillStyle = '#FDE68A';
    ctx.beginPath();
    ctx.roundRect(px - 15, horizonY - 26, 30, 12, 5);
    ctx.fill();
    ctx.stroke();
  }

  // Overhead harbor pennant rope
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, horizonY * 0.16);
  ctx.quadraticCurveTo(w * 0.5, horizonY * 0.28, w, horizonY * 0.14);
  ctx.stroke();
  const pennantColors = ['#EF4444', '#FBBF24', '#FFF8EB', '#38BDF8'];
  for (let i = 1; i <= 11; i++) {
    const t = i / 12;
    const px = w * t;
    const py = (1 - t) * (1 - t) * (horizonY * 0.16) + 2 * (1 - t) * t * (horizonY * 0.28) + t * t * (horizonY * 0.14);
    const sway = Math.sin(time * 4.2 + i) * 4;
    ctx.fillStyle = pennantColors[i % pennantColors.length];
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px - 11, py);
    ctx.lineTo(px + 11, py);
    ctx.lineTo(px + sway, py + 24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

function drawMarketScenery(
  ctx: CanvasRenderingContext2D,
  w: number,
  _h: number,
  horizonY: number,
  time: number,
  isBoss: boolean
) {
  // Sunset desert/town rooftops silhouette
  ctx.fillStyle = '#7C2D12';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  const blocks = [0.06, 0.18, 0.3, 0.56, 0.72, 0.88];
  blocks.forEach((bx, idx) => {
    const bw = w * 0.16;
    const bh = 75 + (idx % 3) * 38;
    ctx.fillRect(w * bx - bw * 0.5, horizonY - bh, bw, bh + 6);
    ctx.strokeRect(w * bx - bw * 0.5, horizonY - bh, bw, bh + 6);
  });

  // Central stone bazaar arch behind the table
  const archX = w * 0.5;
  const archW = Math.min(280, w * 0.34);
  const archH = horizonY * 0.56;
  ctx.fillStyle = '#9A3412';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(archX - archW * 0.5, horizonY - archH, archW, archH + 6, [120, 120, 0, 0]);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isBoss ? '#450A0A' : '#431407';
  ctx.beginPath();
  ctx.roundRect(archX - archW * 0.34, horizonY - archH * 0.82, archW * 0.68, archH * 0.82 + 6, [90, 90, 0, 0]);
  ctx.fill();
  ctx.stroke();

  // Left & Right colorful striped market stall awnings
  const drawStall = (cx: number, flip: number) => {
    const stallW = Math.min(210, w * 0.24);
    const stallTop = horizonY - 125;
    // Wooden poles
    ctx.fillStyle = '#451A03';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.fillRect(cx - stallW * 0.45, stallTop + 20, 12, 110);
    ctx.strokeRect(cx - stallW * 0.45, stallTop + 20, 12, 110);
    ctx.fillRect(cx + stallW * 0.38, stallTop + 20, 12, 110);
    ctx.strokeRect(cx + stallW * 0.38, stallTop + 20, 12, 110);

    // Striped canopy
    const stripes = 6;
    const sw = stallW / stripes;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#EF4444' : '#FFF8EB';
      ctx.beginPath();
      ctx.roundRect(cx - stallW * 0.5 + i * sw, stallTop, sw + 1, 38, [0, 0, 10, 10]);
      ctx.fill();
      ctx.stroke();
    }

    // Spice sacks & chili pot
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.ellipse(cx - 28 * flip, horizonY - 16, 22, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.ellipse(cx + 22 * flip, horizonY - 14, 18, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };

  drawStall(w * 0.14, 1);
  drawStall(w * 0.86, -1);

  // Overhead swaying festive paper lanterns
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, horizonY * 0.18);
  ctx.quadraticCurveTo(w * 0.5, horizonY * 0.34, w, horizonY * 0.18);
  ctx.stroke();

  const lanternColors = ['#FBBF24', '#EF4444', '#FB923C', '#10B981'];
  for (let i = 1; i <= 7; i++) {
    const t = i / 8;
    const lx = w * t;
    const ly = (1 - t) * (1 - t) * (horizonY * 0.18) + 2 * (1 - t) * t * (horizonY * 0.34) + t * t * (horizonY * 0.18);
    const sway = Math.sin(time * 2.8 + i * 0.9) * 0.08;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(sway);
    ctx.fillStyle = lanternColors[i % lanternColors.length];
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(0, 20, 15, 19, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Warm inner glow
    ctx.fillStyle = 'rgba(254, 240, 138, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 20, 7, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Rising warm spice embers
  for (let i = 0; i < 10; i++) {
    const px = ((i * 137 + time * 18) % w);
    const py = horizonY - ((time * (28 + (i % 4) * 9) + i * 53) % (horizonY * 0.7));
    ctx.fillStyle = i % 2 === 0 ? '#FDE047' : '#FB923C';
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRooftopsScenery(
  ctx: CanvasRenderingContext2D,
  w: number,
  _h: number,
  horizonY: number,
  time: number,
  isBoss: boolean
) {
  // Twinkling stars & crescent moon
  for (let i = 0; i < 24; i++) {
    const sx = ((i * 193 + 47) % (w - 40)) + 20;
    const sy = ((i * 89 + 23) % (horizonY * 0.55)) + 18;
    const twinkle = 0.45 + 0.55 * Math.abs(Math.sin(time * 2.5 + i));
    ctx.fillStyle = `rgba(254, 249, 195, ${twinkle})`;
    ctx.beginPath();
    ctx.arc(sx, sy, i % 4 === 0 ? 2.8 : 1.7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Glowing cartoon crescent moon
  const moonX = w * 0.8;
  const moonY = horizonY * 0.24;
  ctx.fillStyle = isBoss ? '#FCA5A5' : '#FEF08A';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Layered city skyline with lit windows
  const buildings = [
    { x: 0.04, bw: 0.13, bh: 0.48, c: '#1E293B' },
    { x: 0.17, bw: 0.14, bh: 0.62, c: '#0F172A' },
    { x: 0.32, bw: 0.12, bh: 0.42, c: '#1E293B' },
    { x: 0.46, bw: 0.15, bh: 0.56, c: '#0F172A' },
    { x: 0.63, bw: 0.13, bh: 0.44, c: '#1E293B' },
    { x: 0.77, bw: 0.14, bh: 0.64, c: '#0F172A' },
    { x: 0.91, bw: 0.12, bh: 0.5, c: '#1E293B' },
  ];

  buildings.forEach((b, idx) => {
    const bx = w * b.x - (w * b.bw) * 0.5;
    const bw = w * b.bw;
    const bh = horizonY * b.bh;
    const by = horizonY - bh;
    ctx.fillStyle = b.c;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.fillRect(bx, by, bw, bh + 6);
    ctx.strokeRect(bx, by, bw, bh + 6);

    // Lit windows
    ctx.fillStyle = idx % 2 === 0 ? '#FBBF24' : '#34D399';
    for (let wy = by + 18; wy < horizonY - 26; wy += 28) {
      for (let wx = bx + 14; wx < bx + bw - 22; wx += 24) {
        if (((wx + wy + idx) % 3) !== 0) {
          ctx.fillRect(wx, wy, 10, 14);
        }
      }
    }
  });

  // Water tower on left rooftop
  const wtX = w * 0.14;
  const wtBase = horizonY;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(wtX - 24, wtBase);
  ctx.lineTo(wtX - 16, wtBase - 64);
  ctx.moveTo(wtX + 24, wtBase);
  ctx.lineTo(wtX + 16, wtBase - 64);
  ctx.stroke();

  ctx.fillStyle = '#78350F';
  ctx.beginPath();
  ctx.roundRect(wtX - 28, wtBase - 118, 56, 56, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#059669';
  ctx.beginPath();
  ctx.moveTo(wtX - 32, wtBase - 118);
  ctx.lineTo(wtX, wtBase - 144);
  ctx.lineTo(wtX + 32, wtBase - 118);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Pulsing neon bottle billboard on right building
  const neonX = w * 0.85;
  const neonY = horizonY - 125;
  const pulse = 0.72 + Math.sin(time * 5) * 0.28;
  ctx.fillStyle = '#0F172A';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.roundRect(neonX - 46, neonY - 34, 92, 68, 10);
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.strokeStyle = '#34D399';
  ctx.lineWidth = 4;
  ctx.strokeRect(neonX - 38, neonY - 26, 76, 52);
  ctx.fillStyle = '#34D399';
  ctx.font = '800 15px "Bricolage Grotesque", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('DUELO', neonX, neonY + 6);
  ctx.restore();

  // Rooftop safety railing along horizon
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, horizonY - 24);
  ctx.lineTo(w, horizonY - 24);
  for (let x = 20; x < w; x += 56) {
    ctx.moveTo(x, horizonY - 24);
    ctx.lineTo(x, horizonY);
  }
  ctx.stroke();
}

function drawStationScenery(
  ctx: CanvasRenderingContext2D,
  w: number,
  _h: number,
  horizonY: number,
  time: number,
  isBoss: boolean
) {
  // Arched steel depot skylights
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6;
  ctx.fillStyle = '#292524';
  for (let i = 0; i < 3; i++) {
    const sx = w * (0.2 + i * 0.3);
    ctx.beginPath();
    ctx.arc(sx, horizonY - 20, w * 0.14, Math.PI, 0);
    ctx.stroke();
  }

  // Steel pillars left & right
  [w * 0.1, w * 0.9].forEach((px) => {
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4.5;
    ctx.fillRect(px - 18, 0, 36, horizonY + 4);
    ctx.strokeRect(px - 18, 0, 36, horizonY + 4);
    // Rivets
    ctx.fillStyle = '#94A3B8';
    for (let y = 30; y < horizonY - 20; y += 52) {
      ctx.beginPath();
      ctx.arc(px - 8, y, 3, 0, Math.PI * 2);
      ctx.arc(px + 8, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Vintage locomotive silhouette parked along back track
  const locoX = w * 0.5;
  const locoY = horizonY - 12;
  ctx.fillStyle = '#1E293B';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  // Boiler body
  ctx.beginPath();
  ctx.roundRect(locoX - 150, locoY - 82, 230, 74, 16);
  ctx.fill();
  ctx.stroke();
  // Cabin
  ctx.fillStyle = '#7F1D1D';
  ctx.beginPath();
  ctx.roundRect(locoX + 60, locoY - 114, 96, 106, 8);
  ctx.fill();
  ctx.stroke();
  // Smokestack
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(locoX - 124, locoY - 116, 26, 36);
  ctx.strokeRect(locoX - 124, locoY - 116, 26, 36);

  // Locomotive glowing headlamp
  ctx.fillStyle = isBoss ? '#EF4444' : '#FDE047';
  ctx.beginPath();
  ctx.arc(locoX - 146, locoY - 46, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Animated cartoon steam puffs from smokestack
  for (let i = 0; i < 4; i++) {
    const cycle = (time * 0.45 + i * 0.25) % 1;
    const puffX = locoX - 112 + cycle * 110;
    const puffY = locoY - 126 - cycle * 95;
    const puffR = 14 + cycle * 24;
    ctx.save();
    ctx.globalAlpha = (1 - cycle) * 0.65;
    ctx.fillStyle = '#E2E8F0';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(puffX, puffY, puffR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Railway signal lamp post
  const sigX = w * 0.23;
  ctx.fillStyle = '#475569';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.fillRect(sigX - 5, horizonY - 135, 10, 135);
  ctx.strokeRect(sigX - 5, horizonY - 135, 10, 135);
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.roundRect(sigX - 14, horizonY - 155, 28, 52, 8);
  ctx.fill();
  ctx.stroke();
  const blink = Math.sin(time * 3.5) > 0;
  ctx.fillStyle = blink ? '#10B981' : '#F59E0B';
  ctx.beginPath();
  ctx.arc(sigX, horizonY - 139, 7, 0, Math.PI * 2);
  ctx.fill();
}

function drawCastleScenery(
  ctx: CanvasRenderingContext2D,
  w: number,
  _h: number,
  horizonY: number,
  time: number,
  isBoss: boolean
) {
  // Stone brick citadel back wall arches
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  [0.16, 0.5, 0.84].forEach((rx, idx) => {
    const ax = w * rx;
    const aw = idx === 1 ? Math.min(240, w * 0.26) : Math.min(150, w * 0.16);
    const ah = idx === 1 ? horizonY * 0.72 : horizonY * 0.54;

    ctx.fillStyle = '#2E1065';
    ctx.beginPath();
    ctx.roundRect(ax - aw * 0.5, horizonY - ah, aw, ah + 6, [aw * 0.5, aw * 0.5, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // Glowing stained-glass pattern inside arch
    ctx.save();
    ctx.clip();
    ctx.fillStyle = isBoss ? 'rgba(239, 68, 68, 0.38)' : 'rgba(251, 191, 36, 0.28)';
    ctx.beginPath();
    ctx.arc(ax, horizonY - ah + aw * 0.48, aw * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });

  // Royal crimson banners with golden bottle emblem
  [w * 0.33, w * 0.67].forEach((bx, idx) => {
    const sway = Math.sin(time * 2.4 + idx) * 4;
    ctx.fillStyle = '#991B1B';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(bx - 24, 18);
    ctx.lineTo(bx + 24, 18);
    ctx.lineTo(bx + 24 + sway, 155);
    ctx.lineTo(bx + sway, 182);
    ctx.lineTo(bx - 24 + sway, 155);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Gold trim + mini bottle crest
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.roundRect(bx - 8 + sway * 0.5, 76, 16, 42, 4);
    ctx.fill();
    ctx.stroke();
  });

  // Flickering wall torches on stone pillars
  [w * 0.08, w * 0.92].forEach((tx, idx) => {
    const ty = horizonY - 115;
    ctx.fillStyle = '#451A03';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.fillRect(tx - 8, ty, 16, 42);
    ctx.strokeRect(tx - 8, ty, 16, 42);

    const flicker = Math.sin(time * 14 + idx * 2) * 4;
    // Outer flame
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.moveTo(tx - 14, ty);
    ctx.quadraticCurveTo(tx - 16, ty - 28, tx + flicker * 0.5, ty - 44 - Math.abs(flicker));
    ctx.quadraticCurveTo(tx + 16, ty - 28, tx + 14, ty);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner bright flame
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(tx, ty - 14, 7, 0, Math.PI * 2);
    ctx.fill();
  });

  // Floating golden embers in throne room
  for (let i = 0; i < 12; i++) {
    const px = ((i * 151 + time * 15) % w);
    const py = horizonY - ((time * (22 + (i % 3) * 10) + i * 47) % (horizonY * 0.8));
    ctx.fillStyle = i % 2 === 0 ? '#FBBF24' : '#F87171';
    ctx.beginPath();
    ctx.arc(px, py, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBiomeFloor(
  ctx: CanvasRenderingContext2D,
  biome: BiomeDef,
  w: number,
  h: number,
  horizonY: number
) {
  const floorGrad = ctx.createLinearGradient(0, horizonY, 0, h);
  floorGrad.addColorStop(0, biome.floorTop);
  floorGrad.addColorStop(1, biome.floorBottom);
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, horizonY, w, h - horizonY);

  // Biome-specific deck texture
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, horizonY, w, h - horizonY);
  ctx.clip();

  if (biome.id === 'docks') {
    // Wooden plank lines
    ctx.strokeStyle = 'rgba(17, 24, 39, 0.45)';
    ctx.lineWidth = 3;
    for (let i = -4; i <= 12; i++) {
      const topX = (w / 8) * i;
      const botX = w * 0.5 + (topX - w * 0.5) * 1.45;
      ctx.beginPath();
      ctx.moveTo(topX, horizonY);
      ctx.lineTo(botX, h);
      ctx.stroke();
    }
  } else if (biome.id === 'station') {
    // Yellow/black industrial hazard stripe along deck edge
    const stripeW = 28;
    for (let x = -stripeW; x < w + stripeW; x += stripeW * 2) {
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.moveTo(x, horizonY);
      ctx.lineTo(x + stripeW, horizonY);
      ctx.lineTo(x + stripeW - 14, horizonY + 14);
      ctx.lineTo(x - 14, horizonY + 14);
      ctx.closePath();
      ctx.fill();
    }
  } else if (biome.id === 'castle') {
    // Crimson royal carpet runner down center
    ctx.fillStyle = '#991B1B';
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w * 0.36, horizonY);
    ctx.lineTo(w * 0.64, horizonY);
    ctx.lineTo(w * 0.74, h);
    ctx.lineTo(w * 0.26, h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Subtle perspective tile lines for market / rooftops
    ctx.strokeStyle = 'rgba(17, 24, 39, 0.32)';
    ctx.lineWidth = 2.5;
    for (let i = -3; i <= 11; i++) {
      const topX = (w / 8) * i;
      const botX = w * 0.5 + (topX - w * 0.5) * 1.35;
      ctx.beginPath();
      ctx.moveTo(topX, horizonY);
      ctx.lineTo(botX, h);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Thick comic ink horizon trim
  ctx.fillStyle = biome.floorBorder;
  ctx.fillRect(0, horizonY - 4, w, 8);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, horizonY - 4);
  ctx.lineTo(w, horizonY - 4);
  ctx.moveTo(0, horizonY + 4);
  ctx.lineTo(w, horizonY + 4);
  ctx.stroke();
}

export interface AmbientParticle {
  nx: number; // normalized 0..1 x
  ny: number; // normalized 0..1 y
  size: number;
  speedFactor: number;
  alpha: number;
  phase: number;
  variant: 0 | 1 | 2;
}

export function createAmbientParticles(count = 10): AmbientParticle[] {
  const list: AmbientParticle[] = [];
  for (let i = 0; i < count; i++) {
    list.push({
      nx: Math.random(),
      ny: Math.random(),
      size: 1.2 + Math.random() * 1.1,
      speedFactor: 0.5 + Math.random() * 0.45,
      alpha: 0.09 + Math.random() * 0.11,
      phase: Math.random() * Math.PI * 2,
      variant: (i % 3) as 0 | 1 | 2,
    });
  }
  return list;
}

export function updateAndDrawAmbientParticles(
  ctx: CanvasRenderingContext2D,
  particles: AmbientParticle[],
  biomeId: ArenaBiomeId,
  w: number,
  h: number,
  dt: number,
  time: number
) {
  if (w <= 0 || h <= 0) return;

  ctx.save();
  for (const p of particles) {
    // Advance normalized coordinates according to biome weather/atmosphere
    if (biomeId === 'docks') {
      p.nx += 0.024 * p.speedFactor * dt;
      p.ny += Math.sin(time * 1.2 + p.phase) * 0.008 * dt;
    } else if (biomeId === 'market') {
      p.ny -= 0.03 * p.speedFactor * dt;
      p.nx += Math.sin(time * 1.5 + p.phase) * 0.012 * dt;
    } else if (biomeId === 'rooftops') {
      p.nx -= 0.042 * p.speedFactor * dt;
      p.ny += 0.012 * p.speedFactor * dt;
    } else if (biomeId === 'station') {
      p.ny -= 0.035 * p.speedFactor * dt;
      p.nx += 0.01 * p.speedFactor * dt;
    } else {
      p.ny += (p.variant === 2 ? -0.022 : 0.036) * p.speedFactor * dt;
      p.nx += Math.sin(time * 1.4 + p.phase) * 0.016 * dt + 0.006 * dt;
    }

    // Wrap smoothly around screen edges
    if (p.nx > 1.04) p.nx = -0.04;
    if (p.nx < -0.04) p.nx = 1.04;
    if (p.ny > 1.04) p.ny = -0.04;
    if (p.ny < -0.04) p.ny = 1.04;

    const px = p.nx * w;
    const py = p.ny * h;
    const pulse = 0.75 + Math.sin(time * 2.2 + p.phase) * 0.25;
    ctx.globalAlpha = p.alpha * pulse;

    if (biomeId === 'docks') {
      ctx.fillStyle = p.variant === 0 ? '#FEF3C7' : p.variant === 1 ? '#E0F2FE' : '#FDE68A';
      ctx.beginPath();
      ctx.arc(px, py, p.size * 0.85, 0, Math.PI * 2);
      ctx.fill();
    } else if (biomeId === 'market') {
      ctx.fillStyle = p.variant === 0 ? '#FDBA74' : p.variant === 1 ? '#FCA5A5' : '#FDE047';
      ctx.beginPath();
      ctx.arc(px, py, p.size * 0.85, 0, Math.PI * 2);
      ctx.fill();
    } else if (biomeId === 'rooftops') {
      ctx.fillStyle = p.variant === 0 ? '#A7F3D0' : p.variant === 1 ? '#BAE6FD' : '#F8FAFC';
      ctx.beginPath();
      ctx.arc(px, py, p.size * 0.75, 0, Math.PI * 2);
      ctx.fill();
    } else if (biomeId === 'station') {
      if (p.variant === 0) {
        ctx.fillStyle = 'rgba(226, 232, 240, 0.32)';
        ctx.beginPath();
        ctx.arc(px, py, p.size * 1.6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.variant === 1 ? '#FBBF24' : '#FB923C';
        ctx.beginPath();
        ctx.arc(px, py, p.size * 0.72, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      if (p.variant === 2) {
        ctx.fillStyle = '#FBBF24';
        ctx.beginPath();
        ctx.arc(px, py, p.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.variant === 0 ? '#FFFFFF' : '#E0F2FE';
        ctx.beginPath();
        ctx.arc(px, py, p.size * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

