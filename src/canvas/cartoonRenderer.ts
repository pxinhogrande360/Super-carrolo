import { BodyType, CharacterVisualConfig } from '../types/game';

export type FighterPose =
  | 'IDLE'
  | 'ENTRANCE'
  | 'REACH_BOTTLE'
  | 'WINDUP_SPIN'
  | 'FLICK_THROW'
  | 'STRIKE'
  | 'BLOCK'
  | 'HIT'
  | 'STUNNED'
  | 'VICTORY';

export interface FighterRenderState {
  charId?: string;
  visual: CharacterVisualConfig;
  facing: 1 | -1; // 1 = left side facing right, -1 = right side facing left
  x: number;
  y: number;
  pose: FighterPose;
  poseProgress: number; // 0..1
  chargeRatio: number;  // 0..1 when winding up spin or charged carrollo
  hitFlash: number;     // 0..1
  bumpAmount?: number;  // 0..1 swelling cascudo bump on top of head
  strikeTargetDist?: number; // pixel horizontal distance to rival for descending arc cascudo
  shieldActive: boolean;
  burnActive: boolean;
  vulnerable: boolean;
  time: number;
}

export interface BottleRenderState {
  x: number;
  y: number;
  angle: number; // radians, 0 = upright
  scaleX: number;
  scaleY: number;
  visible: boolean;
  heldBy: 0 | 1 | 2; // 0 = free/on table, 1 = p1 hand, 2 = p2 hand
  uprightGlow: number; // 0..1
  color: string;
  liquidColor: string;
  isGolden: boolean;
  magnetized: boolean;
}

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  secondaryColor?: string;
  text?: string;
  gravityScale?: number;
  life: number;
  maxLife: number;
  kind: 'star' | 'dust' | 'spark' | 'ring' | 'shard' | 'halftone' | 'comic_word';
  rotation: number;
  rotSpeed: number;
}

export interface FloatingCallout {
  text: string;
  subtext?: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

export interface ComicSfxBurst {
  word: string;
  x: number;
  y: number;
  angle: number;
  burstColor: string;
  textColor: string;
  secondaryTextColor?: string;
  spikes: number;
  life: number;
  maxLife: number;
  scale: number;
}

interface BodyRigMetrics {
  hipY: number;
  torsoH: number;
  shoulderW: number;
  waistW: number;
  hipW: number;
  limbThickness: number;
  armReach: number;
  legSpread: number;
  bootW: number;
  bootH: number;
  headRx: number;
  headRy: number;
  bellyBulge: number;
  hasCape: boolean;
}

const BODY_METRICS: Record<BodyType, BodyRigMetrics> = {
  // Row 1 #3: Balanced athletic teenager/young fighter
  athletic: {
    hipY: -54,
    torsoH: 54,
    shoulderW: 25,
    waistW: 14,
    hipW: 17,
    limbThickness: 11,
    armReach: 1.0,
    legSpread: 20,
    bootW: 18,
    bootH: 10,
    headRx: 24,
    headRy: 26,
    bellyBulge: 0,
    hasCape: false,
  },
  // Row 1 #4 / Row 3 #2: Heavy stout powerhouse
  stocky: {
    hipY: -44,
    torsoH: 56,
    shoulderW: 30,
    waistW: 35,
    hipW: 32,
    limbThickness: 14,
    armReach: 0.92,
    legSpread: 22,
    bootW: 20,
    bootH: 11,
    headRx: 25,
    headRy: 24,
    bellyBulge: 16,
    hasCape: false,
  },
  // Row 1 #1 / Row 3 #1: Tall lanky long-limbed acrobat
  lanky: {
    hipY: -76,
    torsoH: 58,
    shoulderW: 20,
    waistW: 11,
    hipW: 14,
    limbThickness: 8.5,
    armReach: 1.24,
    legSpread: 24,
    bootW: 21,
    bootH: 10,
    headRx: 21,
    headRy: 25,
    bellyBulge: 0,
    hasCape: false,
  },
  // Row 1 #2 & #9 / Row 2 #4: Sleek curvy stylish agile stance
  agile: {
    hipY: -62,
    torsoH: 52,
    shoulderW: 21,
    waistW: 11,
    hipW: 21,
    limbThickness: 9.5,
    armReach: 1.04,
    legSpread: 18,
    bootW: 16,
    bootH: 9,
    headRx: 22,
    headRy: 25,
    bellyBulge: 0,
    hasCape: false,
  },
  // Row 1 #5: Massive V-taper muscular titan
  titan: {
    hipY: -64,
    torsoH: 66,
    shoulderW: 40,
    waistW: 21,
    hipW: 24,
    limbThickness: 17,
    armReach: 1.15,
    legSpread: 26,
    bootW: 23,
    bootH: 13,
    headRx: 24,
    headRy: 25,
    bellyBulge: 0,
    hasCape: false,
  },
  // Row 1 #10 + Royal Cape: Towering imposing monarch
  monarch: {
    hipY: -66,
    torsoH: 68,
    shoulderW: 38,
    waistW: 23,
    hipW: 26,
    limbThickness: 16,
    armReach: 1.14,
    legSpread: 25,
    bootW: 22,
    bootH: 12,
    headRx: 25,
    headRy: 27,
    bellyBulge: 4,
    hasCape: true,
  },
};

const INK = '#111827';

export function drawBottle(
  ctx: CanvasRenderingContext2D,
  bottle: BottleRenderState,
  time: number
) {
  if (!bottle.visible) return;
  ctx.save();
  ctx.translate(bottle.x, bottle.y);
  ctx.rotate(bottle.angle);
  ctx.scale(bottle.scaleX, bottle.scaleY);

  // Upright aura burst
  if (bottle.uprightGlow > 0.05) {
    ctx.save();
    ctx.globalAlpha = bottle.uprightGlow * 0.85;
    const rays = 8;
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 4;
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2 + time * 2.4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 28, -28 + Math.sin(a) * 28);
      ctx.lineTo(Math.cos(a) * 48, -28 + Math.sin(a) * 48);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Magnetized rings
  if (bottle.magnetized) {
    ctx.save();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Bottle silhouette (origin at bottom center (0, 0), height ~ 66px)
  const bodyColor = bottle.isGolden ? '#FBBF24' : bottle.color;
  const liquid = bottle.isGolden ? '#FEF08A' : bottle.liquidColor;

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Outer bottle path
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.lineTo(14, 0);
  ctx.quadraticCurveTo(17, -2, 16, -10);
  ctx.lineTo(15, -32);
  ctx.quadraticCurveTo(15, -42, 7, -48);
  ctx.lineTo(6, -62);
  ctx.lineTo(-6, -62);
  ctx.lineTo(-7, -48);
  ctx.quadraticCurveTo(-15, -42, -15, -32);
  ctx.lineTo(-16, -10);
  ctx.quadraticCurveTo(-17, -2, -14, 0);
  ctx.closePath();

  ctx.fillStyle = bodyColor;
  ctx.fill();

  // Liquid inside lower half
  ctx.save();
  ctx.clip();
  ctx.fillStyle = liquid;
  ctx.beginPath();
  const slosh = Math.sin(bottle.angle) * 8;
  ctx.moveTo(-20, -24 + slosh);
  ctx.lineTo(20, -24 - slosh);
  ctx.lineTo(20, 6);
  ctx.lineTo(-20, 6);
  ctx.closePath();
  ctx.fill();

  // Cel highlight stripe
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fillRect(-10, -45, 5, 42);
  ctx.restore();

  // Thick cartoon outline
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.lineTo(14, 0);
  ctx.quadraticCurveTo(17, -2, 16, -10);
  ctx.lineTo(15, -32);
  ctx.quadraticCurveTo(15, -42, 7, -48);
  ctx.lineTo(6, -62);
  ctx.lineTo(-6, -62);
  ctx.lineTo(-7, -48);
  ctx.quadraticCurveTo(-15, -42, -15, -32);
  ctx.lineTo(-16, -10);
  ctx.quadraticCurveTo(-17, -2, -14, 0);
  ctx.closePath();
  ctx.stroke();

  // Cap / cork
  ctx.fillStyle = '#EF4444';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(-8, -68, 16, 8, 3);
  ctx.fill();
  ctx.stroke();

  // Label emblem on bottle
  ctx.fillStyle = '#FFF8EB';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-9, -31, 18, 13, 3);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

export function drawDuelingTable(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  tableTopY: number
) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Pedestal base shadow
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(centerX, tableTopY + 76, 86, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pedestal pillar
  ctx.fillStyle = '#78350F';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(centerX - 28, tableTopY + 14, 56, 62, 6);
  ctx.fill();
  ctx.stroke();

  // Pedestal highlight
  ctx.fillStyle = '#92400E';
  ctx.fillRect(centerX - 18, tableTopY + 18, 14, 52);

  // Table top plank
  ctx.fillStyle = '#B45309';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5.5;
  ctx.beginPath();
  ctx.roundRect(centerX - 82, tableTopY, 164, 22, 8);
  ctx.fill();
  ctx.stroke();

  // Top wood rim highlight
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(centerX - 72, tableTopY + 4, 144, 5);

  // Target center pad
  ctx.fillStyle = '#FEF3C7';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(centerX, tableTopY + 2, 26, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function computeStrikeArcGeometry(
  pRaw: number,
  headY: number,
  shoulderY: number,
  reach: number,
  targetDist?: number
) {
  const p = Math.max(0, Math.min(1, pRaw));
  const maxLunge = targetDist ? Math.max(126, targetDist - 84) : 136;

  // Fluid 4-phase Carrolo choreography:
  // 1) 0.00..0.24 Anticipation recoil & coil
  // 2) 0.24..0.54 Airborne forward lunge + descending overhead fist arc
  // 3) 0.54..0.68 Knuckle impact compression & follow-through
  // 4) 0.68..1.00 Damped elastic spring recovery back to ready stance
  let offsetX = 0;
  let offsetY = 0;
  let lean = 0;
  let sx = 1;
  let sy = 1;
  let crouchDrop = 0;
  let stridePhase = 0;

  // Explicit circular descending arc overhead ending over opponent's head crown
  const arcCx = 20 * reach;
  const arcCy = headY - 22;
  const arcR = 64 * Math.min(1.15, reach);
  const startTheta = -Math.PI * 0.94;
  const endTheta = -0.18;

  let theta = startTheta;
  let handX = 42 * reach;
  let handY = shoulderY + 12;

  if (p < 0.24) {
    const t = p / 0.24;
    const e = 1 - (1 - t) * (1 - t);
    offsetX = -16 * e;
    offsetY = 0;
    crouchDrop = 16 * e;
    sx = 1 + 0.12 * e;
    sy = 1 - 0.12 * e;
    lean = -0.14 * e;
    stridePhase = -0.35 * e;
    theta = -Math.PI * 0.68 - e * (Math.PI * 0.26);
    handX = arcCx + Math.cos(theta) * arcR;
    handY = arcCy + Math.sin(theta) * arcR;
  } else if (p < 0.54) {
    const t = (p - 0.24) / 0.30;
    const lungeEase = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const arcLift = Math.sin(t * Math.PI);
    offsetX = -16 + (maxLunge + 16) * lungeEase;
    offsetY = -arcLift * 26;
    crouchDrop = 16 * (1 - arcLift) + 6 * lungeEase;
    sx = 1 - 0.09 * arcLift + 0.04 * lungeEase;
    sy = 1 + 0.12 * arcLift - 0.04 * lungeEase;
    lean = -0.14 + 0.40 * lungeEase;
    stridePhase = -0.35 + 1.35 * lungeEase;

    const swingEase = 1 - Math.pow(1 - t, 2.2);
    theta = startTheta + (endTheta - startTheta) * swingEase;
    handX = arcCx + Math.cos(theta) * arcR;
    handY = arcCy + Math.sin(theta) * arcR;
  } else if (p < 0.68) {
    const t = (p - 0.54) / 0.14;
    const squish = Math.sin(t * Math.PI);
    offsetX = maxLunge;
    offsetY = 0;
    crouchDrop = 10 + squish * 10;
    sx = 1 + 0.14 * squish;
    sy = 1 - 0.13 * squish;
    lean = 0.26 - t * 0.04;
    stridePhase = 1.0;

    theta = endTheta - squish * 0.10;
    handX = arcCx + Math.cos(theta) * arcR;
    handY = arcCy + Math.sin(theta) * arcR;
  } else {
    const t = (p - 0.68) / 0.32;
    const retEase = t * t * (3 - 2 * t);
    const hop = Math.sin(t * Math.PI);
    offsetX = maxLunge * (1 - retEase);
    offsetY = -hop * 14;
    crouchDrop = 10 * (1 - retEase);
    sx = 1 + hop * 0.04;
    sy = 1 - hop * 0.04;
    lean = 0.22 * (1 - retEase);
    stridePhase = 1.0 * (1 - retEase);

    theta = endTheta - retEase * 0.42;
    const impactEndX = arcCx + Math.cos(endTheta) * arcR;
    const impactEndY = arcCy + Math.sin(endTheta) * arcR;
    const guardX = 42 * reach;
    const guardY = shoulderY + 10;
    handX = impactEndX + (guardX - impactEndX) * retEase;
    handY = impactEndY + (guardY - impactEndY) * retEase;
  }

  const shX = 18 * reach;
  const shY = shoulderY + 8;
  const elbowX = (shX + handX) * 0.5 - 8;
  const elbowY = (shY + handY) * 0.5 - 18;

  return {
    p,
    offsetX,
    offsetY,
    lean,
    sx,
    sy,
    crouchDrop,
    stridePhase,
    arcCx,
    arcCy,
    arcR,
    startTheta,
    theta,
    handX,
    handY,
    elbowX,
    elbowY,
    isImpactPeak: p >= 0.48 && p <= 0.72,
    showArcTrail: p >= 0.24 && p <= 0.76,
  };
}

/**
 * Computes world coordinates of the fighter's active hand based on their body archetype
 * so the bottle locks accurately to every character's hand during REACH_BOTTLE / WINDUP_SPIN / FLICK_THROW.
 */
export function getFighterHandPos(f: FighterRenderState): { x: number; y: number } {
  const m = BODY_METRICS[f.visual.bodyType] || BODY_METRICS.athletic;
  const dir = f.facing;
  const reach = m.armReach;

  const idleRate = f.visual.bodyType === 'lanky' ? 5.2 : f.visual.bodyType === 'titan' ? 3.1 : 4.2;
  const breath = Math.sin(f.time * idleRate) * 0.032;
  let sx = 1 - breath * 0.55;
  let sy = 1 + breath;
  let lean = 0;
  let offsetX = 0;
  let offsetY = f.visual.bodyType === 'lanky' && f.pose === 'IDLE' ? Math.abs(Math.sin(f.time * 4.5)) * -6 : 0;
  let crouchDrop = 0;

  if (f.pose === 'REACH_BOTTLE') {
    lean = 0.22;
    offsetX = 16;
    crouchDrop = 14;
  } else if (f.pose === 'WINDUP_SPIN') {
    lean = 0.16 - f.chargeRatio * 0.38;
    sx = 1 + f.chargeRatio * 0.07;
    sy = 1 - f.chargeRatio * 0.07;
    crouchDrop = 10;
  } else if (f.pose === 'FLICK_THROW') {
    lean = 0.14;
    sy = 1.1;
    sx = 0.92;
    offsetY = -8;
  } else if (f.pose === 'STRIKE') {
    const hipTmp = m.hipY + 8;
    const shTmp = hipTmp - m.torsoH;
    const headTmp = shTmp - m.headRy - 8;
    const arc = computeStrikeArcGeometry(f.poseProgress, headTmp, shTmp, reach, f.strikeTargetDist);
    offsetX = arc.offsetX;
    offsetY = arc.offsetY;
    lean = arc.lean;
    sx = arc.sx;
    sy = arc.sy;
    crouchDrop = arc.crouchDrop;
  }

  const hipY = m.hipY + crouchDrop;
  const shoulderY = hipY - m.torsoH;
  const headY = shoulderY - m.headRy - 8;

  let handX = 40 * reach;
  let handY = shoulderY + 18;

  if (f.pose === 'REACH_BOTTLE') {
    handX = 72 * reach;
    handY = shoulderY + 34;
  } else if (f.pose === 'WINDUP_SPIN') {
    handX = (56 - f.chargeRatio * 36) * reach;
    handY = shoulderY + 28 + f.chargeRatio * 18;
  } else if (f.pose === 'FLICK_THROW') {
    const t = Math.min(1, f.poseProgress * 1.6);
    handX = (34 + t * 48) * reach;
    handY = shoulderY + 24 - t * 66;
  } else if (f.pose === 'STRIKE') {
    const arc = computeStrikeArcGeometry(f.poseProgress, headY, shoulderY, reach, f.strikeTargetDist);
    handX = arc.handX;
    handY = arc.handY;
  }

  // Apply upper-body rotation around (0, hipY)
  const relX = handX;
  const relY = handY - hipY;
  const cos = Math.cos(lean);
  const sin = Math.sin(lean);
  const rotX = relX * cos - relY * sin;
  const rotY = hipY + relX * sin + relY * cos;

  // Apply fighter scale & facing
  const worldX = f.x + dir * (offsetX + rotX * sx);
  const worldY = f.y + offsetY + rotY * sy;

  return { x: worldX, y: worldY };
}

/**
 * Draws a two-segment stylized comic limb (upper + forearm/shin) with flared cuff & thick ink contour.
 */
function drawArticulatedLimb(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  jx: number,
  jy: number,
  ex: number,
  ey: number,
  thickness: number,
  fillUpper: string,
  fillLower: string,
  flareEnd = false
) {
  // Upper segment
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(jx, jy);
  ctx.lineWidth = thickness + 8;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.lineWidth = thickness;
  ctx.strokeStyle = fillUpper;
  ctx.stroke();

  // Lower segment (tapered or flared comic cuff like the reference sheet!)
  if (flareEnd) {
    const dx = ex - jx;
    const dy = ey - jy;
    const len = Math.max(1, Math.hypot(dx, dy));
    const nx = -dy / len;
    const ny = dx / len;
    const w1 = thickness * 0.48;
    const w2 = thickness * 0.85;

    ctx.beginPath();
    ctx.moveTo(jx + nx * w1, jy + ny * w1);
    ctx.lineTo(ex + nx * w2, ey + ny * w2);
    ctx.lineTo(ex - nx * w2, ey - ny * w2);
    ctx.lineTo(jx - nx * w1, jy - ny * w1);
    ctx.closePath();
    ctx.fillStyle = fillLower;
    ctx.fill();
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = INK;
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(jx, jy);
    ctx.lineTo(ex, ey);
    ctx.lineWidth = thickness * 0.92 + 8;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.lineWidth = thickness * 0.92;
    ctx.strokeStyle = fillLower;
    ctx.stroke();
  }
}

export function drawFighter(ctx: CanvasRenderingContext2D, f: FighterRenderState) {
  const v = f.visual;
  const m = BODY_METRICS[v.bodyType] || BODY_METRICS.athletic;

  ctx.save();
  ctx.translate(f.x, f.y);

  // Ground shadow scaled to character width
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath();
  ctx.ellipse(0, 6, m.shoulderW * 1.45 + 14, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Facing flip
  ctx.scale(f.facing, 1);

  // Dynamic body transforms by pose & archetype
  const idleRate = v.bodyType === 'lanky' ? 5.2 : v.bodyType === 'titan' ? 3.1 : 4.2;
  const breath = Math.sin(f.time * idleRate) * 0.032;
  let sx = 1 - breath * 0.55;
  let sy = 1 + breath;
  let lean = 0;
  let offsetX = 0;
  let offsetY = v.bodyType === 'lanky' && f.pose === 'IDLE' ? Math.abs(Math.sin(f.time * 4.5)) * -6 : 0;
  let crouchDrop = 0;

  const charId = f.charId || '';
  const ep = Math.max(0, Math.min(1, f.poseProgress));

  let entranceSpin = 0;
  let extraCapeFlare = 0;
  let strikePlan: ReturnType<typeof computeStrikeArcGeometry> | null = null;
  const leoWalkPhase =
    f.pose === 'ENTRANCE' && charId === 'leo' && ep < 0.72
      ? (ep / 0.72) * Math.PI * 5
      : 0;

  if (f.pose === 'ENTRANCE') {
    if (charId === 'leo') {
      if (ep < 0.72) {
        // Firm rhythmic walk (WALK) from off-left into arena mark
        const t = ep / 0.72;
        offsetX = -(1 - t) * 170;
        offsetY = -Math.abs(Math.sin(leoWalkPhase)) * 7;
        crouchDrop = 3 + Math.abs(Math.cos(leoWalkPhase)) * 3;
        lean = 0.08;
      } else {
        // Crisp plant into combat guard stance
        const t = (ep - 0.72) / 0.28;
        const squish = Math.sin(t * Math.PI);
        offsetX = 0;
        offsetY = 0;
        lean = 0.06 * t;
        crouchDrop = 4 * (1 - t);
        sx = 1 + squish * 0.04;
        sy = 1 - squish * 0.04;
      }
    } else if (charId === 'rich_boss') {
      if (ep < 0.44) {
        const t = ep / 0.44;
        offsetX = -(1 - t) * 165;
        offsetY = -Math.abs(Math.sin(t * Math.PI * 2)) * 8;
        lean = -0.06;
      } else {
        lean = -0.04;
        sy = 1.02;
      }
    } else if (charId === 'boss_lady') {
      if (ep < 0.46) {
        const t = ep / 0.46;
        offsetX = -(1 - t) * 170;
        offsetY = -Math.abs(Math.sin(t * Math.PI * 2)) * 12;
        lean = Math.sin(t * Math.PI * 3) * 0.09;
      } else if (ep < 0.76) {
        lean = -0.06;
        sx = 0.98;
        sy = 1.03;
      } else {
        lean = 0.1;
        sx = 1.04;
        sy = 0.96;
      }
    } else if (charId === 'clown') {
      if (ep < 0.44) {
        const t = ep / 0.44;
        offsetX = -(1 - t) * 65;
        offsetY = -(1 - t * t) * 230;
        entranceSpin = (1 - t) * Math.PI * 2;
      } else if (ep < 0.62) {
        const sq = Math.sin(((ep - 0.44) / 0.18) * Math.PI);
        sx = 1 + sq * 0.26;
        sy = 1 - sq * 0.24;
        crouchDrop = sq * 20;
      } else {
        const t = (ep - 0.62) / 0.38;
        lean = 0.16 * Math.sin(Math.min(1, t * 1.4) * Math.PI * 0.5);
        sx = 0.96;
        sy = 1.05;
      }
    } else if (charId === 'big_boss') {
      if (ep < 0.50) {
        const t = ep / 0.50;
        offsetX = -(1 - t) * 155;
        const stompBounce = Math.abs(Math.sin(t * Math.PI * 2));
        offsetY = -stompBounce * 18;
        crouchDrop = (1 - stompBounce) * 10;
        lean = 0.08;
      } else if (ep < 0.82) {
        sx = 1.08;
        sy = 1.05;
        lean = -0.06;
      } else {
        const slam = Math.sin(((ep - 0.82) / 0.18) * Math.PI);
        sx = 1.05 + slam * 0.08;
        sy = 0.95 - slam * 0.06;
        crouchDrop = 8;
        lean = 0.1;
      }
    } else if (charId === 'knight') {
      if (ep < 0.46) {
        const t = ep / 0.46;
        offsetX = -(1 - t) * 165;
        offsetY = -Math.abs(Math.sin(t * Math.PI * 2)) * 9;
        extraCapeFlare = 18 * (1 - t * 0.4);
        lean = 0.06;
      } else {
        extraCapeFlare = 8 + Math.sin(f.time * 5) * 4;
        lean = ep > 0.78 ? 0.08 : -0.03;
      }
    } else {
      // Crisp heroic leap-in fallback for remaining roster
      if (ep < 0.52) {
        const t = ep / 0.52;
        offsetX = -(1 - t) * 150;
        offsetY = -Math.sin(t * Math.PI) * 46;
        lean = 0.16 * (1 - t);
      } else {
        lean = 0.08;
      }
    }
  } else if (f.pose === 'REACH_BOTTLE') {
    // Low crouched bottle-grab pose
    lean = 0.22;
    offsetX = 16;
    crouchDrop = 14;
  } else if (f.pose === 'WINDUP_SPIN') {
    lean = 0.16 - f.chargeRatio * 0.38;
    sx = 1 + f.chargeRatio * 0.07;
    sy = 1 - f.chargeRatio * 0.07;
    crouchDrop = 10;
  } else if (f.pose === 'FLICK_THROW') {
    lean = 0.14;
    sy = 1.1;
    sx = 0.92;
    offsetY = -8;
  } else if (f.pose === 'STRIKE') {
    // Fluid 4-phase Carrolo forward lunge + descending overhead fist arc
    const hipTmp = m.hipY + 8;
    const shTmp = hipTmp - m.torsoH;
    const headTmp = shTmp - m.headRy - 8;
    strikePlan = computeStrikeArcGeometry(
      f.poseProgress,
      headTmp,
      shTmp,
      m.armReach,
      f.strikeTargetDist
    );
    offsetX = strikePlan.offsetX;
    offsetY = strikePlan.offsetY;
    lean = strikePlan.lean;
    sx = strikePlan.sx;
    sy = strikePlan.sy;
    crouchDrop = strikePlan.crouchDrop;
  } else if (f.pose === 'HIT') {
    // Synchronized with Carrolo knuckle arrival (p ~ 0.36..0.52)
    if (ep < 0.34) {
      offsetX = 0;
      lean = 0.02;
      sx = 1.02;
      sy = 0.98;
    } else if (ep < 0.52) {
      const k = (ep - 0.34) / 0.18;
      const ke = 1 - (1 - k) * (1 - k);
      offsetX = -26 * ke;
      lean = -0.32 * ke;
      sx = 1 - 0.12 * ke;
      sy = 1 + 0.12 * ke;
      crouchDrop = 8 * (1 - ke);
    } else if (ep < 0.72) {
      offsetX = -26;
      lean = -0.32;
      sx = 0.88;
      sy = 1.12;
    } else {
      const t = (ep - 0.72) / 0.28;
      const ret = t * t * (3 - 2 * t);
      offsetX = -26 * (1 - ret);
      lean = -0.32 * (1 - ret);
      sx = 0.88 + 0.12 * ret;
      sy = 1.12 - 0.12 * ret;
    }
  } else if (f.pose === 'STUNNED') {
    // Slumped/dizzy pose
    lean = Math.sin(f.time * 9) * 0.12 + 0.14;
    crouchDrop = 18;
  } else if (f.pose === 'BLOCK') {
    // Brace -> parry impact absorb -> smooth recovery
    if (ep < 0.34) {
      sx = 1.03;
      sy = 0.97;
      lean = -0.04;
      crouchDrop = 4;
    } else if (ep < 0.66) {
      const abs = Math.sin(((ep - 0.34) / 0.32) * Math.PI);
      offsetX = -10 * abs;
      sx = 1.03 + 0.06 * abs;
      sy = 0.97 - 0.08 * abs;
      lean = -0.04 - 0.1 * abs;
      crouchDrop = 4 + 6 * abs;
    } else {
      const ret = (ep - 0.66) / 0.34;
      sx = 1.03 - 0.03 * ret;
      sy = 0.97 + 0.03 * ret;
      lean = -0.04 * (1 - ret);
      crouchDrop = 4 * (1 - ret);
    }
  } else if (f.pose === 'VICTORY') {
    offsetY = -Math.abs(Math.sin(f.time * 6)) * 16;
  }

  ctx.translate(offsetX, offsetY);
  if (entranceSpin !== 0) {
    ctx.translate(0, -76);
    ctx.rotate(entranceSpin);
    ctx.translate(0, 76);
  }
  ctx.scale(sx, sy);

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const hipY = m.hipY + crouchDrop;
  const shoulderY = hipY - m.torsoH;
  const headY = shoulderY - m.headRy - 8;
  const outfit = v.outfitStyle || 'standard';
  const effectiveHitFlash =
    f.pose === 'HIT' ? (ep >= 0.38 && ep <= 0.50 ? 1 : 0) : f.hitFlash;
  const armSkinOnly = outfit === 'crop_street' || outfit === 'tank_muscle';
  const sleeveUpper = armSkinOnly ? v.skin : v.primary;
  const sleeveLower = armSkinOnly ? v.skin : outfit === 'knight_armor' ? v.secondary : v.skin;

  // Burn aura if active
  if (f.burnActive) {
    ctx.save();
    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.65 + Math.sin(f.time * 12) * 0.25;
    ctx.beginPath();
    ctx.ellipse(0, hipY - 35, m.shoulderW + 24, Math.abs(headY) * 0.56, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Flowing cape behind torso (Knight & Monarch)
  if (m.hasCape || outfit === 'knight_armor') {
    const wave = Math.sin(f.time * 4.5) * 8 - extraCapeFlare;
    ctx.fillStyle = outfit === 'knight_armor' ? '#991B1B' : '#450A0A';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-m.shoulderW * 0.8, shoulderY + 4);
    ctx.quadraticCurveTo(-m.shoulderW * 1.4 - 16 - extraCapeFlare * 0.5, hipY - 10, -m.shoulderW * 1.2 - 22 + wave, -6);
    ctx.lineTo(6, -10);
    ctx.lineTo(m.shoulderW * 0.6, shoulderY + 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // --- LEGS & FLARED COMIC BOOTS / STREET SNEAKERS ---
  const stanceWide = f.pose === 'REACH_BOTTLE' ? 1.32 : 1;
  let backFootX = -m.legSpread * stanceWide;
  let frontFootX = m.legSpread * stanceWide;
  let backFootY = -4;
  let frontFootY = -4;

  if (f.pose === 'ENTRANCE' && charId === 'leo' && ep < 0.72) {
    const stride = Math.sin(leoWalkPhase) * 26;
    frontFootX = 6 + stride;
    backFootX = -6 - stride;
    frontFootY = -4 - Math.max(0, Math.cos(leoWalkPhase)) * 12;
    backFootY = -4 - Math.max(0, -Math.cos(leoWalkPhase)) * 12;
  } else if (f.pose === 'STRIKE' && strikePlan) {
    const sp = strikePlan.stridePhase;
    frontFootX = m.legSpread * (1 + Math.max(0, sp) * 0.55) + sp * 10;
    backFootX = -m.legSpread * (1 + Math.max(0, sp) * 0.45);
    const airT =
      ep >= 0.24 && ep <= 0.54 ? Math.sin(((ep - 0.24) / 0.30) * Math.PI) : 0;
    frontFootY = -4 - airT * 8;
    backFootY = -4 - airT * 14;
  }

  const backKneeX = backFootX * 0.55 - (crouchDrop > 0 ? 10 : 2);
  const frontKneeX = frontFootX * 0.65 + (crouchDrop > 0 ? 12 : 4);
  const kneeY = hipY * 0.48;
  const legUpperColor =
    outfit === 'trenchcoat'
      ? '#261D22'
      : outfit === 'jester'
      ? '#4C1D95'
      : outfit === 'street_ribs'
      ? '#1E1E26'
      : v.secondary;
  const legLowerColor =
    outfit === 'trenchcoat'
      ? '#261D22'
      : outfit === 'jester'
      ? '#B91C1C'
      : outfit === 'street_ribs'
      ? '#1E1E26'
      : v.secondary;

  // Back leg
  drawArticulatedLimb(
    ctx,
    -m.hipW * 0.45,
    hipY + 2,
    backKneeX,
    kneeY,
    backFootX,
    backFootY,
    m.limbThickness,
    legUpperColor,
    legLowerColor,
    true
  );

  // Pant side stripe for Boss Lady (red stripe) & Big Boss (white stripe)
  if (outfit === 'crop_street' || outfit === 'tank_muscle') {
    ctx.strokeStyle = outfit === 'crop_street' ? '#DC2626' : '#E2E8F0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-m.hipW * 0.52, hipY + 4);
    ctx.lineTo(backKneeX - 2, kneeY);
    ctx.lineTo(backFootX - 3, backFootY - 2);
    ctx.stroke();
  }

  // Back boot / shoe
  const bootFill =
    outfit === 'trenchcoat'
      ? '#452312'
      : outfit === 'tank_muscle'
      ? '#E2E8F0'
      : outfit === 'knight_armor'
      ? '#3F3845'
      : v.accent;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4.5;
  if (outfit === 'jester') {
    ctx.fillStyle = bootFill;
    ctx.beginPath();
    ctx.moveTo(backFootX - 10, backFootY + 8);
    ctx.lineTo(backFootX + m.bootW * 1.1, backFootY + 8);
    ctx.quadraticCurveTo(backFootX + m.bootW * 1.4, backFootY - 6, backFootX + 2, backFootY - 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (outfit === 'street_ribs') {
    // Chunky B&W panda skate sneaker
    ctx.fillStyle = '#14141A';
    ctx.beginPath();
    ctx.roundRect(backFootX - 12, backFootY - 8, m.bootW * 1.65, m.bootH * 1.65, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(backFootX - 10, backFootY + 3, m.bootW * 1.45, 5);
    ctx.beginPath();
    ctx.ellipse(backFootX + m.bootW * 0.52, backFootY - 1, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = bootFill;
    ctx.beginPath();
    ctx.ellipse(backFootX + 5, backFootY + 2, m.bootW * 0.9, m.bootH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Front leg
  drawArticulatedLimb(
    ctx,
    m.hipW * 0.45,
    hipY + 2,
    frontKneeX,
    kneeY,
    frontFootX,
    frontFootY,
    m.limbThickness,
    legUpperColor,
    legLowerColor,
    true
  );
  if (outfit === 'crop_street' || outfit === 'tank_muscle') {
    ctx.strokeStyle = outfit === 'crop_street' ? '#DC2626' : '#E2E8F0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(m.hipW * 0.52, hipY + 4);
    ctx.lineTo(frontKneeX + 2, kneeY);
    ctx.lineTo(frontFootX + 3, frontFootY - 2);
    ctx.stroke();
  }
  // Front boot / shoe
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4.5;
  if (outfit === 'jester') {
    ctx.fillStyle = bootFill;
    ctx.beginPath();
    ctx.moveTo(frontFootX - 10, frontFootY + 8);
    ctx.lineTo(frontFootX + m.bootW * 1.25, frontFootY + 8);
    ctx.quadraticCurveTo(frontFootX + m.bootW * 1.55, frontFootY - 7, frontFootX + 4, frontFootY - 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (outfit === 'street_ribs') {
    ctx.fillStyle = '#14141A';
    ctx.beginPath();
    ctx.roundRect(frontFootX - 11, frontFootY - 8, m.bootW * 1.75, m.bootH * 1.7, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(frontFootX - 9, frontFootY + 3, m.bootW * 1.55, 5);
    ctx.beginPath();
    ctx.ellipse(frontFootX + m.bootW * 0.62, frontFootY - 1, 7.5, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = bootFill;
    ctx.beginPath();
    ctx.ellipse(frontFootX + 7, frontFootY + 3, m.bootW, m.bootH, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // --- UPPER BODY TRANSFORM (Torso + Arms + Head lean together) ---
  ctx.save();
  ctx.translate(0, hipY);
  ctx.rotate(lean);
  ctx.translate(0, -hipY);

  // Back Arm (pose-driven!)
  let bElbowX = -m.shoulderW - 10;
  let bElbowY = shoulderY + 24;
  let bHandX = -m.shoulderW - 4;
  let bHandY = shoulderY + 46;

  if (f.pose === 'ENTRANCE') {
    if (charId === 'clown' && ep >= 0.62) {
      bElbowX = -m.shoulderW - 22;
      bElbowY = shoulderY - 4;
      bHandX = -m.shoulderW - 38;
      bHandY = shoulderY - 24;
    } else if (charId === 'big_boss' && ep >= 0.50 && ep < 0.82) {
      bElbowX = -m.shoulderW - 18;
      bElbowY = shoulderY - 8;
      bHandX = -m.shoulderW - 8;
      bHandY = headY - 12;
    } else if (charId === 'big_boss' && ep >= 0.82) {
      bElbowX = -6;
      bElbowY = shoulderY + 26;
      bHandX = 16;
      bHandY = shoulderY + 20;
    } else if (charId === 'boss_lady' && ep >= 0.46 && ep < 0.76) {
      bElbowX = -m.shoulderW - 16;
      bElbowY = shoulderY + 22;
      bHandX = -m.hipW - 2;
      bHandY = hipY - 2;
    } else if (charId === 'leo') {
      if (ep < 0.72) {
        // Rhythmic walk swing (opposite front leg)
        const swing = Math.sin(leoWalkPhase) * 18;
        bElbowX = -m.shoulderW - 6 + swing * 0.5;
        bElbowY = shoulderY + 22;
        bHandX = -m.shoulderW + 4 + swing;
        bHandY = shoulderY + 42 - Math.abs(swing) * 0.2;
      } else {
        // Combat guard stance
        const gt = Math.min(1, (ep - 0.72) / 0.22);
        bElbowX = -12 * gt + (-m.shoulderW - 6) * (1 - gt);
        bElbowY = shoulderY + 18 * gt + 22 * (1 - gt);
        bHandX = 18 * gt + (-m.shoulderW + 4) * (1 - gt);
        bHandY = shoulderY + 8 * gt + 42 * (1 - gt);
      }
    }
  } else if (f.pose === 'IDLE' && v.bodyType === 'agile') {
    bElbowX = -m.shoulderW - 14;
    bElbowY = shoulderY + 22;
    bHandX = -m.hipW;
    bHandY = hipY - 4;
  } else if (f.pose === 'VICTORY') {
    bElbowX = -m.shoulderW - 18;
    bElbowY = shoulderY - 12;
    bHandX = -m.shoulderW - 8;
    bHandY = shoulderY - 46;
  } else if (f.pose === 'BLOCK') {
    bElbowX = 6;
    bElbowY = shoulderY + 6;
    bHandX = 24;
    bHandY = headY - 8;
  } else if (f.pose === 'STRIKE') {
    bElbowX = -m.shoulderW - 22;
    bElbowY = shoulderY + 10;
    bHandX = -m.shoulderW - 36;
    bHandY = shoulderY + 26;
  }

  drawArticulatedLimb(
    ctx,
    -m.shoulderW * 0.78,
    shoulderY + 8,
    bElbowX,
    bElbowY,
    bHandX,
    bHandY,
    m.limbThickness * 0.86,
    sleeveUpper,
    sleeveLower
  );
  if (outfit === 'tank_muscle') {
    ctx.fillStyle = '#18141A';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(bHandX - 9, bHandY - 11, 18, 10, 3);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = outfit === 'knight_armor' ? '#4A434E' : '#FFF8EB';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(bHandX, bHandY, m.limbThickness * 0.75, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // --- SCULPTED STYLIZED TORSO ---
  ctx.fillStyle = effectiveHitFlash > 0.2 ? '#FFFFFF' : v.primary;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5.5;

  const waistY = hipY - m.torsoH * 0.34;
  ctx.beginPath();
  if (m.bellyBulge > 8) {
    ctx.moveTo(-m.shoulderW, shoulderY + 4);
    ctx.quadraticCurveTo(0, shoulderY - 8, m.shoulderW, shoulderY + 4);
    ctx.quadraticCurveTo(m.waistW + m.bellyBulge, waistY, m.hipW, hipY + 4);
    ctx.quadraticCurveTo(0, hipY + 12, -m.hipW, hipY + 4);
    ctx.quadraticCurveTo(-m.waistW - m.bellyBulge * 0.6, waistY, -m.shoulderW, shoulderY + 4);
  } else {
    ctx.moveTo(-m.shoulderW, shoulderY + 2);
    ctx.quadraticCurveTo(0, shoulderY - 9, m.shoulderW, shoulderY + 2);
    ctx.lineTo(m.waistW, waistY);
    ctx.lineTo(m.hipW, hipY + 4);
    ctx.quadraticCurveTo(0, hipY + 10, -m.hipW, hipY + 4);
    ctx.lineTo(-m.waistW, waistY);
    ctx.closePath();
  }
  ctx.fill();
  ctx.stroke();

  // Cel-shade shadow stripe down back edge of torso
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(-m.shoulderW - 10, shoulderY - 12, m.shoulderW * 0.72, m.torsoH + 26);

  // Outfit-specific torso motifs
  if (outfit === 'crop_street') {
    // Exposed midriff skin band above red belt
    ctx.fillStyle = v.skin;
    ctx.fillRect(-m.hipW - 4, waistY + 2, m.hipW * 2 + 8, hipY - waistY + 4);
  } else if (outfit === 'street_ribs') {
    // Leo's black streetwear sweater with light chest graffiti rib panel
    ctx.fillStyle = '#E5E7EB';
    ctx.beginPath();
    ctx.roundRect(-m.shoulderW * 0.56, shoulderY + 10, m.shoulderW * 1.18, m.torsoH * 0.68, 5);
    ctx.fill();
    // Diagonal dark rib streaks + graffiti splatter accents
    ctx.strokeStyle = '#18181F';
    ctx.lineWidth = 4;
    for (let r = 0; r < 3; r++) {
      const ry = shoulderY + 16 + r * 11;
      ctx.beginPath();
      ctx.moveTo(-m.shoulderW * 0.45, ry + 5);
      ctx.lineTo(m.shoulderW * 0.18, ry);
      ctx.stroke();
    }
    ctx.fillStyle = '#18181F';
    ctx.beginPath();
    ctx.arc(m.shoulderW * 0.34, shoulderY + 24, 3.5, 0, Math.PI * 2);
    ctx.arc(m.shoulderW * 0.26, shoulderY + 37, 2.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (outfit === 'jester') {
    // Split crimson diamond harlequin pattern
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(0, shoulderY - 6, m.shoulderW + 8, m.torsoH + 14);
    ctx.fillStyle = '#4C1D95';
    ctx.beginPath();
    ctx.moveTo(0, shoulderY + 14);
    ctx.lineTo(14, waistY);
    ctx.lineTo(0, hipY - 4);
    ctx.lineTo(-14, waistY);
    ctx.closePath();
    ctx.fill();
  } else if (outfit === 'trenchcoat') {
    // Crisp dark shirt V + cream lapels
    ctx.fillStyle = '#1E1B24';
    ctx.beginPath();
    ctx.moveTo(-8, shoulderY);
    ctx.lineTo(11, shoulderY);
    ctx.lineTo(3, waistY + 6);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // White collar trim for Leo's street_ribs sweater
  if (outfit === 'street_ribs') {
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(1, shoulderY + 3, 11, 0.15, Math.PI - 0.15);
    ctx.stroke();
  }

  // Trenchcoat tails below hip for Rich Boss
  if (outfit === 'trenchcoat') {
    ctx.fillStyle = v.primary;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(-m.hipW - 2, hipY + 1);
    ctx.lineTo(-m.hipW - 12, hipY + 28);
    ctx.lineTo(-2, hipY + 22);
    ctx.lineTo(4, hipY + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Rich Boss red bow tie
  if (outfit === 'trenchcoat') {
    ctx.fillStyle = '#B91C1C';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(3, shoulderY + 6);
    ctx.lineTo(-6, shoulderY + 1);
    ctx.lineTo(-6, shoulderY + 11);
    ctx.closePath();
    ctx.moveTo(3, shoulderY + 6);
    ctx.lineTo(12, shoulderY + 1);
    ctx.lineTo(12, shoulderY + 11);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Big Boss thick gold chain necklace
  if (outfit === 'tank_muscle') {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(2, shoulderY + 6, 17, 0.15, Math.PI - 0.15);
    ctx.stroke();
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.arc(2, shoulderY + 6, 17, 0.15, Math.PI - 0.15);
    ctx.stroke();
  }

  // Knight shoulder pauldrons & crimson neck scarf + chest cross
  if (outfit === 'knight_armor') {
    // Gold chest emblem
    ctx.fillStyle = '#FBBF24';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.fillRect(2, shoulderY + 16, 6, 14);
    ctx.fillRect(-2, shoulderY + 20, 14, 6);

    // Crimson scarf around collar
    ctx.fillStyle = '#B91C1C';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.roundRect(-m.shoulderW * 0.62, shoulderY - 8, m.shoulderW * 1.24, 16, 7);
    ctx.fill();
    ctx.stroke();

    // Steel shoulder pauldron
    ctx.fillStyle = '#5B5361';
    ctx.beginPath();
    ctx.arc(m.shoulderW * 0.72, shoulderY + 5, 16, Math.PI * 0.85, Math.PI * 2.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Clown jagged collar ruff
  if (outfit === 'jester') {
    ctx.fillStyle = '#DC2626';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-18, shoulderY + 2);
    ctx.lineTo(-10, shoulderY + 13);
    ctx.lineTo(0, shoulderY + 4);
    ctx.lineTo(10, shoulderY + 14);
    ctx.lineTo(19, shoulderY + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Belt / Waist Sash (+ Gold Buckle for bosses, dark cargo hem for Leo's street_ribs)
  if (outfit !== 'street_ribs') {
    ctx.fillStyle = outfit === 'knight_armor' || outfit === 'tank_muscle' ? '#27202B' : v.accent;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(-m.hipW - 1, hipY - 9, m.hipW * 2 + 2, 11, 4);
    ctx.fill();
    ctx.stroke();
    if (outfit !== 'standard') {
      ctx.fillStyle = '#FBBF24';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.roundRect(-3, hipY - 9, 12, 11, 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  // --- NECK & STYLIZED CARTOON HEAD ---
  ctx.fillStyle = effectiveHitFlash > 0.2 ? '#FFFFFF' : v.skin;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(-7, shoulderY - 10, 14, 15, 4);
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.translate(2, headY);
  ctx.fillStyle = effectiveHitFlash > 0.2 ? '#FFFFFF' : v.skin;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5.5;

  // Slightly chiseled comic head silhouette
  ctx.beginPath();
  ctx.moveTo(-m.headRx, -4);
  ctx.quadraticCurveTo(-m.headRx, -m.headRy, 0, -m.headRy);
  ctx.quadraticCurveTo(m.headRx, -m.headRy, m.headRx, -2);
  ctx.quadraticCurveTo(m.headRx * 0.9, m.headRy * 0.85, 4, m.headRy);
  ctx.quadraticCurveTo(-m.headRx * 0.85, m.headRy * 0.8, -m.headRx, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cel highlight on cheek
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.ellipse(-8, -8, 10, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();

  drawAccessory(ctx, v, m.headRx, m.headRy);

  // Eyes & Expression (unless full knight helmet covers the face)
  if (v.accessory !== 'knight_helm') {
    const blinking = Math.sin(f.time * 1.9) > 0.96 && f.pose === 'IDLE';
    const isHitImpactFace = f.pose === 'STUNNED' || (f.pose === 'HIT' && ep >= 0.36);

    if (isHitImpactFace) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 4;
      [2, 16].forEach((ex) => {
        ctx.beginPath();
        ctx.moveTo(ex - 4, -8);
        ctx.lineTo(ex + 4, 0);
        ctx.moveTo(ex + 4, -8);
        ctx.lineTo(ex - 4, 0);
        ctx.stroke();
      });
      ctx.fillStyle = '#7F1D1D';
      ctx.beginPath();
      ctx.ellipse(9, 12, 7, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (v.accessory === 'rich_shades' || v.accessory === 'afro_hoops') {
      // Sleek dark boss sunglasses
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.roundRect(-4, -10, 14, 10, 3);
      ctx.roundRect(12, -10, 13, 10, 3);
      ctx.fill();
      ctx.stroke();
      // Gold bridge & lens glint
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(10, -6);
      ctx.lineTo(12, -6);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.moveTo(-1, -8);
      ctx.lineTo(4, -3);
      ctx.moveTo(15, -8);
      ctx.lineTo(20, -3);
      ctx.stroke();

      // Smirk mouth
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      if (f.pose === 'VICTORY' || f.pose === 'STRIKE') {
        ctx.fillStyle = '#FFFFFF';
        ctx.moveTo(2, 9);
        ctx.quadraticCurveTo(10, 19, 19, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.moveTo(3, 11);
        ctx.quadraticCurveTo(11, 15, 18, 8);
        ctx.stroke();
      }
    } else if (v.accessory === 'curly_afro') {
      // Sheet 2 cute & expressive big glossy eyes for Leo!
      [2, 16].forEach((ex) => {
        if (blinking) {
          ctx.strokeStyle = INK;
          ctx.lineWidth = 3.8;
          ctx.beginPath();
          ctx.moveTo(ex - 6, -4);
          ctx.quadraticCurveTo(ex, -1, ex + 6, -4);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = INK;
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.ellipse(ex, -4, 7.2, 9.2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Large expressive glossy iris + dual specular catchlights
          ctx.fillStyle = '#140E13';
          ctx.beginPath();
          ctx.arc(ex + 1.5, -3.5, 4.7, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(ex + 3.2, -6.2, 2.0, 0, Math.PI * 2);
          ctx.arc(ex + 0.2, -1.2, 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Soft warm cheek blush
      ctx.fillStyle = 'rgba(239, 68, 68, 0.24)';
      ctx.beginPath();
      ctx.ellipse(-6, 5, 4.5, 2.8, 0, 0, Math.PI * 2);
      ctx.ellipse(21, 5, 4.2, 2.6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Expressive rounded brows
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(-4, -15);
      ctx.quadraticCurveTo(2, -18, 7, -14);
      ctx.moveTo(11, -14);
      ctx.quadraticCurveTo(17, -18, 22, -15);
      ctx.stroke();

      // Cheerful expressive smile / bright grin
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      if (f.pose === 'VICTORY' || f.pose === 'STRIKE') {
        ctx.fillStyle = '#FFFFFF';
        ctx.moveTo(1, 7);
        ctx.quadraticCurveTo(10, 21, 20, 7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.moveTo(3, 10);
        ctx.quadraticCurveTo(10, 16, 18, 9);
        ctx.stroke();
      }
    } else {
      [2, 16].forEach((ex) => {
        if (blinking) {
          ctx.strokeStyle = INK;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(ex - 5, -4);
          ctx.lineTo(ex + 5, -4);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = INK;
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.ellipse(ex, -4, 5.8, 7.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = v.accessory === 'jester_hat' ? '#DC2626' : INK;
          ctx.beginPath();
          ctx.arc(ex + 2, -3, 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Expressive eyebrows
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3.8;
      ctx.beginPath();
      ctx.moveTo(-3, -14);
      ctx.lineTo(7, -11);
      ctx.moveTo(11, -11);
      ctx.lineTo(22, -15);
      ctx.stroke();

      // Mouth (extra wide sinister grin for Clown!)
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      if (v.accessory === 'jester_hat' || f.pose === 'VICTORY' || f.pose === 'STRIKE') {
        ctx.fillStyle = '#FFFFFF';
        ctx.moveTo(0, 8);
        ctx.quadraticCurveTo(10, 22, 21, 7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.moveTo(3, 11);
        ctx.quadraticCurveTo(10, 15, 17, 9);
        ctx.stroke();
      }
    }
  }

  // Swelling Cartoon Cascudo Bump ("Galo") synced to actual knuckle arrival
  const rawBump =
    f.bumpAmount ?? (f.pose === 'HIT' ? 1 : f.pose === 'STUNNED' ? 0.72 : 0);
  const bumpVal =
    f.pose === 'HIT'
      ? ep >= 0.36
        ? rawBump * Math.min(1, (ep - 0.36) / 0.14)
        : 0
      : rawBump;
  if (bumpVal > 0.08) {
    const bumpR = 9 + bumpVal * 6;
    const bumpY = -m.headRy - bumpR * 0.45;
    ctx.save();
    ctx.fillStyle = '#F87171';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.8;
    ctx.beginPath();
    ctx.arc(2, bumpY, bumpR, Math.PI * 0.88, Math.PI * 2.12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Little pulse impact lines above the bump
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 2.8;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(2 + i * 10, bumpY - bumpR - 3);
      ctx.lineTo(2 + i * 14, bumpY - bumpR - 11);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.restore();

  // Knight Entrance golden visor flare & Rich Boss sunglasses star glint
  if (f.pose === 'ENTRANCE') {
    if (charId === 'knight' && ep >= 0.56 && ep <= 0.86) {
      ctx.save();
      ctx.translate(2, headY);
      drawStar(ctx, 14, -4, 10, '#FDE047');
      ctx.restore();
    } else if (charId === 'rich_boss' && ep >= 0.44 && ep <= 0.78) {
      ctx.save();
      ctx.translate(2, headY);
      drawStar(ctx, 21, -9, 9, '#FDE047');
      ctx.restore();
    }
  }

  // --- FRONT ARTICULATED ARM + ACTION HAND (tracks bottle or delivers descending-arc Carrolo cascudo!) ---
  const reach = m.armReach;
  let fElbowX = 24 * reach;
  let fElbowY = shoulderY + 26;
  let fHandX = 40 * reach;
  let fHandY = shoulderY + 18;
  let strikeArc: ReturnType<typeof computeStrikeArcGeometry> | null = null;

  if (f.pose === 'ENTRANCE') {
    if (charId === 'leo') {
      if (ep < 0.72) {
        // Natural opposite arm swing during firm walk
        const swing = Math.sin(leoWalkPhase) * 20;
        fElbowX = 18 - swing * 0.6;
        fElbowY = shoulderY + 24;
        fHandX = 28 - swing;
        fHandY = shoulderY + 42 - Math.abs(swing) * 0.25;
      } else {
        // Settle cleanly into agile combat guard (no bandana!)
        const gt = Math.min(1, (ep - 0.72) / 0.22);
        fElbowX = 24 * gt + 18 * (1 - gt);
        fElbowY = shoulderY + 14 * gt + 24 * (1 - gt);
        fHandX = 44 * gt + 28 * (1 - gt);
        fHandY = shoulderY + 4 * gt + 42 * (1 - gt);
      }
    } else if (charId === 'rich_boss') {
      if (ep >= 0.44 && ep < 0.76) {
        // Adjusting sunglasses with fingers
        fElbowX = 28;
        fElbowY = headY + 12;
        fHandX = 16;
        fHandY = headY - 2;
      } else if (ep >= 0.76) {
        // Planting golden cane crisply onto ground
        fElbowX = 28;
        fElbowY = shoulderY + 18;
        fHandX = 36;
        fHandY = shoulderY + 36;
      }
    } else if (charId === 'boss_lady') {
      if (ep >= 0.46 && ep < 0.76) {
        // Tilting shades with attitude
        fElbowX = 28;
        fElbowY = headY + 12;
        fHandX = 16;
        fHandY = headY - 3;
      } else if (ep >= 0.76) {
        fElbowX = 26;
        fElbowY = shoulderY + 12;
        fHandX = 48;
        fHandY = shoulderY + 2;
      }
    } else if (charId === 'clown') {
      if (ep >= 0.62) {
        // Wide showman bow arms flung open
        fElbowX = 38 * reach;
        fElbowY = shoulderY - 2;
        fHandX = 56 * reach;
        fHandY = shoulderY - 20;
      } else {
        fElbowX = 22 * reach;
        fElbowY = shoulderY - 12;
        fHandX = 36 * reach;
        fHandY = shoulderY - 34;
      }
    } else if (charId === 'big_boss') {
      if (ep >= 0.50 && ep < 0.82) {
        // Double bicep flex
        fElbowX = 40;
        fElbowY = shoulderY - 8;
        fHandX = 24;
        fHandY = headY - 14;
      } else if (ep >= 0.82) {
        // Fist slammed into palm
        fElbowX = 32;
        fElbowY = shoulderY + 22;
        fHandX = 22;
        fHandY = shoulderY + 18;
      }
    } else if (charId === 'knight') {
      if (ep >= 0.46 && ep < 0.78) {
        // Gauntlet snaps visor shut
        fElbowX = 28;
        fElbowY = headY + 14;
        fHandX = 16;
        fHandY = headY - 2;
      } else if (ep >= 0.78) {
        // Stern forward gauntlet challenge
        fElbowX = 30;
        fElbowY = shoulderY + 16;
        fHandX = 46;
        fHandY = shoulderY + 10;
      }
    } else if (ep >= 0.52) {
      fElbowX = 26 * reach;
      fElbowY = shoulderY - 8;
      fHandX = 36 * reach;
      fHandY = shoulderY - 34;
    }
  } else if (f.pose === 'IDLE' && v.bodyType === 'agile') {
    fElbowX = 24;
    fElbowY = shoulderY + 14;
    fHandX = 44;
    fHandY = shoulderY + 4;
  } else if (f.pose === 'REACH_BOTTLE') {
    fElbowX = 42 * reach;
    fElbowY = shoulderY + 26;
    fHandX = 72 * reach;
    fHandY = shoulderY + 34;
  } else if (f.pose === 'WINDUP_SPIN') {
    fElbowX = (28 - f.chargeRatio * 20) * reach;
    fElbowY = shoulderY + 24 + f.chargeRatio * 12;
    fHandX = (56 - f.chargeRatio * 36) * reach;
    fHandY = shoulderY + 28 + f.chargeRatio * 18;
  } else if (f.pose === 'FLICK_THROW') {
    const t = Math.min(1, f.poseProgress * 1.6);
    fElbowX = (26 + t * 22) * reach;
    fElbowY = shoulderY + 12 - t * 34;
    fHandX = (34 + t * 48) * reach;
    fHandY = shoulderY + 24 - t * 66;
  } else if (f.pose === 'STRIKE') {
    strikeArc =
      strikePlan ||
      computeStrikeArcGeometry(
        f.poseProgress,
        headY,
        shoulderY,
        reach,
        f.strikeTargetDist
      );
    fElbowX = strikeArc.elbowX;
    fElbowY = strikeArc.elbowY;
    fHandX = strikeArc.handX;
    fHandY = strikeArc.handY;
  } else if (f.pose === 'BLOCK') {
    // High overhead guard to parry downward cascudo!
    fElbowX = 24;
    fElbowY = shoulderY - 4;
    fHandX = 26;
    fHandY = headY - 12;
  } else if (f.pose === 'VICTORY') {
    fElbowX = 28;
    fElbowY = shoulderY - 12;
    fHandX = 38;
    fHandY = shoulderY - 52;
  }

  drawArticulatedLimb(
    ctx,
    m.shoulderW * 0.72,
    shoulderY + 8,
    fElbowX,
    fElbowY,
    fHandX,
    fHandY,
    m.limbThickness * 0.9,
    sleeveUpper,
    sleeveLower,
    false
  );

  // Wrist details (Big Boss wristband or Rich Boss gold watch)
  if (outfit === 'tank_muscle') {
    ctx.fillStyle = '#18141A';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(fHandX - 10, fHandY - 12, 20, 10, 3);
    ctx.fill();
    ctx.stroke();
  } else if (outfit === 'trenchcoat') {
    ctx.fillStyle = '#FBBF24';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(fHandX - 7, fHandY - 8, 12, 6, 2);
    ctx.fill();
    ctx.stroke();
  }

  // Rich Boss cane during ENTRANCE (twirl & crisp floor plant)
  if (f.pose === 'ENTRANCE' && charId === 'rich_boss') {
    ctx.save();
    ctx.translate(fHandX, fHandY);
    const caneAngle = ep < 0.76 ? ep * 12 : 0.08;
    ctx.rotate(caneAngle);
    ctx.fillStyle = '#18121E';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.roundRect(-3.5, -4, 7, ep >= 0.76 ? Math.max(46, -fHandY + 4) : 48, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(0, -4, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    if (ep >= 0.76 && ep <= 0.96) {
      const tapT = (ep - 0.76) / 0.20;
      ctx.save();
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 1 - tapT;
      ctx.beginPath();
      ctx.ellipse(fHandX + 4, 2, 12 + tapT * 18, 5 + tapT * 5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Striking Knuckles or Carrolo Object (cane, ruler, scepter, gauntlet)
  const tool = v.carrolloTool || 'knuckles';
  const handRadius = f.pose === 'STRIKE' ? m.limbThickness * 1.42 : m.limbThickness * 0.85;
  ctx.fillStyle =
    outfit === 'knight_armor'
      ? '#4A434E'
      : f.pose === 'STRIKE'
      ? v.accent
      : '#FFF8EB';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.arc(fHandX, fHandY, handRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (f.pose === 'STRIKE' && strikeArc) {
    // 1. Curved tapered descending-arc ribbon over head ("arco descendente")
    if (strikeArc.showArcTrail) {
      const tailTheta = Math.max(strikeArc.startTheta, strikeArc.theta - 1.45);
      const steps = 14;
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        const a = tailTheta + (strikeArc.theta - tailTheta) * u;
        const rOuter = strikeArc.arcR + 4 + u * 13;
        const px = strikeArc.arcCx + Math.cos(a) * rOuter;
        const py = strikeArc.arcCy + Math.sin(a) * rOuter;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      for (let i = steps; i >= 0; i--) {
        const u = i / steps;
        const a = tailTheta + (strikeArc.theta - tailTheta) * u;
        const rInner = strikeArc.arcR - 2 - u * 6;
        const px = strikeArc.arcCx + Math.cos(a) * rInner;
        const py = strikeArc.arcCy + Math.sin(a) * rInner;
        ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = v.accent;
      ctx.globalAlpha = 0.78;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 3.2;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.restore();
    }

    // 2. Prominent downward-pointing cartoon fist + 4 knuckles ("nós dos dedos") directly over opponent's head
    ctx.save();
    ctx.translate(fHandX, fHandY);
    ctx.rotate(0.28);
    ctx.fillStyle = outfit === 'knight_armor' ? '#64748B' : v.skin;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(-handRadius * 0.95, -handRadius * 0.55, handRadius * 1.9, handRadius * 1.15, 6);
    ctx.fill();
    ctx.stroke();

    // 4 sculpted downward-striking knuckle bumps ("nós dos dedos")
    ctx.fillStyle = outfit === 'knight_armor' ? '#CBD5E1' : '#FDE68A';
    ctx.lineWidth = 2.8;
    [-1.5, -0.5, 0.5, 1.5].forEach((k) => {
      ctx.beginPath();
      ctx.arc(k * 5.2, handRadius * 0.78, 4.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();

    // 3. Optional hard object swung downward on the rival's head
    if (tool === 'cane') {
      ctx.save();
      ctx.translate(fHandX, fHandY);
      ctx.rotate(0.42);
      ctx.fillStyle = '#18121E';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(-4, -8, 8, 52, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.arc(0, -8, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (tool === 'ruler') {
      ctx.save();
      ctx.translate(fHandX + 4, fHandY + 4);
      ctx.rotate(0.35);
      ctx.fillStyle = '#FBBF24';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(-5, -4, 11, 46, 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (tool === 'scepter') {
      ctx.save();
      ctx.translate(fHandX + 2, fHandY + 2);
      ctx.rotate(0.38);
      ctx.fillStyle = '#7C3AED';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(-4, -6, 8, 44, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.arc(0, 38, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 4. Visual cartoon knuckle-impact starburst & shockwave directly beneath the knuckles over rival's head crown
    if (strikeArc.isImpactPeak) {
      const impX = fHandX + 2;
      const impY = fHandY + handRadius + 10;
      const burstPulse = 1 - Math.abs(strikeArc.p - 0.58) / 0.18;
      const spikes = 8;
      ctx.save();
      ctx.translate(impX, impY);
      ctx.fillStyle = '#FEF08A';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const a = (i * Math.PI) / spikes - 0.2;
        const r = (i % 2 === 0 ? 22 : 9) * Math.max(0.55, burstPulse);
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r * 0.72;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Concentric crown bonk ring
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 4, 18 + (1 - Math.max(0, burstPulse)) * 16, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  ctx.restore(); // end upper body lean

  // Defensive Cork/Glass Shield (elevated to guard head from downward Carrolo)
  if (f.shieldActive || f.pose === 'BLOCK') {
    ctx.save();
    ctx.strokeStyle = '#38BDF8';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(18, headY + 12, 62, -Math.PI * 0.85, 0.45);
    ctx.stroke();
    ctx.fill();
    ctx.restore();
  }

  // Vulnerable / dizzy stars
  if (f.vulnerable || f.pose === 'STUNNED') {
    ctx.save();
    for (let i = 0; i < 3; i++) {
      const a = f.time * 5 + (i * Math.PI * 2) / 3;
      const sxPos = Math.cos(a) * 28;
      const syPos = headY - m.headRy - 22 + Math.sin(a) * 8;
      drawStar(ctx, sxPos, syPos, 7, '#FBBF24');
    }
    ctx.restore();
  }

  ctx.restore();
}

function drawAccessory(
  ctx: CanvasRenderingContext2D,
  v: CharacterVisualConfig,
  headRx: number,
  headRy: number
) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4.5;

  // Base hair tuft (skipped for full Knight helm, curly_afro, big afro, or jester hat)
  if (
    v.accessory !== 'knight_helm' &&
    v.accessory !== 'afro_hoops' &&
    v.accessory !== 'jester_hat' &&
    v.accessory !== 'curly_afro'
  ) {
    ctx.fillStyle = v.hair;
    ctx.beginPath();
    ctx.arc(-3, -headRy * 0.52, headRx * 0.85, Math.PI * 0.9, Math.PI * 2.05);
    ctx.fill();
    ctx.stroke();
  }

  if (v.accessory === 'curly_afro') {
    // Leo's fluffy short curly afro with scalloped forehead curls & clean crown
    ctx.fillStyle = '#140E13';
    ctx.beginPath();
    ctx.arc(-14, -headRy * 0.42, 13, 0, Math.PI * 2);
    ctx.arc(-7, -headRy * 0.78, 13.5, 0, Math.PI * 2);
    ctx.arc(4, -headRy * 0.88, 14, 0, Math.PI * 2);
    ctx.arc(14, -headRy * 0.68, 11.5, 0, Math.PI * 2);
    ctx.arc(-18, -2, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Soft curl sheen
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(-4, -headRy * 0.78, 7, Math.PI * 1.1, Math.PI * 1.75);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4.5;
  } else if (v.accessory === 'bandana') {
    ctx.fillStyle = v.primary;
    ctx.beginPath();
    ctx.roundRect(-headRx - 2, -headRy * 0.75, headRx * 2 + 4, 11, 5);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-headRx, -headRy * 0.55);
    ctx.lineTo(-headRx - 18, -headRy * 0.82);
    ctx.lineTo(-headRx - 14, -headRy * 0.24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (v.accessory === 'flame_crown') {
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.moveTo(-22, -headRy * 0.75);
    ctx.lineTo(-14, -headRy - 20);
    ctx.lineTo(-3, -headRy - 4);
    ctx.lineTo(4, -headRy - 26);
    ctx.lineTo(13, -headRy - 4);
    ctx.lineTo(22, -headRy - 18);
    ctx.lineTo(24, -headRy * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (v.accessory === 'goggles') {
    ctx.fillStyle = '#34D399';
    ctx.beginPath();
    ctx.roundRect(-12, -headRy * 0.92, 18, 12, 4);
    ctx.roundRect(8, -headRy * 0.92, 17, 12, 4);
    ctx.fill();
    ctx.stroke();
  } else if (v.accessory === 'visor') {
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.roundRect(-2, -12, headRx + 8, 14, 5);
    ctx.fill();
    ctx.stroke();
  } else if (v.accessory === 'helmet') {
    ctx.fillStyle = '#64748B';
    ctx.beginPath();
    ctx.arc(0, -8, headRx + 4, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (v.accessory === 'royal_crown') {
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.moveTo(-24, -headRy * 0.8);
    ctx.lineTo(-26, -headRy - 22);
    ctx.lineTo(-9, -headRy - 8);
    ctx.lineTo(0, -headRy - 28);
    ctx.lineTo(9, -headRy - 8);
    ctx.lineTo(26, -headRy - 22);
    ctx.lineTo(24, -headRy * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.arc(0, -headRy - 6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (v.accessory === 'rich_shades') {
    // Stylish sculpted hair puff on top + gold earring stud
    ctx.fillStyle = v.hair;
    ctx.beginPath();
    ctx.ellipse(0, -headRy * 0.9, headRx * 0.82, 12, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(-headRx + 2, 4, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (v.accessory === 'afro_hoops') {
    // Big voluminous curly afro behind/around top of head + gold hoop earrings
    ctx.fillStyle = '#140E13';
    ctx.beginPath();
    ctx.arc(-18, -headRy * 0.55, 19, 0, Math.PI * 2);
    ctx.arc(0, -headRy * 0.95, 22, 0, Math.PI * 2);
    ctx.arc(17, -headRy * 0.55, 17, 0, Math.PI * 2);
    ctx.arc(-20, -2, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Big gold hoop earring
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(-headRx + 3, 9, 7, 0, Math.PI * 2);
    ctx.stroke();
  } else if (v.accessory === 'jester_hat') {
    // Two-horned crimson & purple jester cap with golden bells
    ctx.fillStyle = '#4C1D95';
    ctx.beginPath();
    ctx.moveTo(-headRx + 2, -headRy * 0.5);
    ctx.quadraticCurveTo(-headRx - 18, -headRy - 26, -headRx - 22, -headRy + 2);
    ctx.quadraticCurveTo(-8, -headRy * 0.55, 2, -headRy * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.moveTo(0, -headRy * 0.72);
    ctx.quadraticCurveTo(headRx + 16, -headRy - 28, headRx + 22, -headRy + 4);
    ctx.quadraticCurveTo(10, -headRy * 0.5, -2, -headRy * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Golden jingle bells
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(-headRx - 22, -headRy + 2, 5.5, 0, Math.PI * 2);
    ctx.arc(headRx + 22, -headRy + 4, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (v.accessory === 'gold_chain') {
    // Sharp fade hairline + gold earring
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(-headRx + 2, 4, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (v.accessory === 'knight_helm') {
    // Crimson flowing knight plume behind helmet
    ctx.fillStyle = '#B91C1C';
    ctx.beginPath();
    ctx.moveTo(-6, -headRy - 4);
    ctx.quadraticCurveTo(-28, -headRy - 28, -36, -headRy + 4);
    ctx.quadraticCurveTo(-24, -headRy + 12, -10, -headRy * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Full dark steel helmet dome + pointed visor grille
    ctx.fillStyle = '#4A434E';
    ctx.beginPath();
    ctx.ellipse(0, -2, headRx + 2, headRy + 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Visor face plate
    ctx.fillStyle = '#2D2733';
    ctx.beginPath();
    ctx.moveTo(-2, -10);
    ctx.lineTo(headRx + 5, -2);
    ctx.lineTo(headRx, headRy - 4);
    ctx.lineTo(-2, headRy - 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing eye slit + vertical breath grille slits
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(4, -5);
    ctx.lineTo(18, -3);
    ctx.stroke();

    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.8;
    [5, 11, 17].forEach((gx) => {
      ctx.beginPath();
      ctx.moveTo(gx, 4);
      ctx.lineTo(gx - 1, 16);
      ctx.stroke();
    });
  }
}

export function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? radius : radius * 0.45;
    const a = (i * Math.PI) / 4;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawComicGradientWord(
  ctx: CanvasRenderingContext2D,
  word: string,
  fontSize: number,
  topColor: string,
  bottomColor: string,
  archCurve = 1
) {
  ctx.save();
  ctx.font = `400 ${fontSize}px "Bangers", "Comic Neue", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.transform(1, 0, -0.16, 1, 0, 0); // punchy comic italic slant

  const chars = word.split('');
  const charWidths = chars.map((ch) => Math.max(fontSize * 0.42, ctx.measureText(ch).width * 0.96));
  const totalW = charWidths.reduce((acc, w) => acc + w, 0);
  let cursorX = -totalW * 0.5;

  chars.forEach((ch, idx) => {
    const cw = charWidths[idx];
    const cx = cursorX + cw * 0.5;
    const norm = chars.length > 1 ? idx / (chars.length - 1) - 0.5 : 0; // -0.5..0.5
    const archY = -(0.25 - norm * norm) * fontSize * 0.52 * archCurve;
    const tilt = norm * 0.24 * archCurve;
    const charScale = 1 + (idx === 0 || idx === chars.length - 1 ? 0.08 : 0.02);

    ctx.save();
    ctx.translate(cx, archY);
    ctx.rotate(tilt);
    ctx.scale(charScale, charScale);

    // Blocky comic drop shadow
    ctx.fillStyle = INK;
    ctx.fillText(ch, 4, 5);

    // Crisp outer white sticker border for high legibility
    ctx.lineWidth = Math.max(5, fontSize * 0.24);
    ctx.strokeStyle = INK;
    ctx.strokeText(ch, 0, 0);

    // Multi-stop comic gradient fill
    const grad = ctx.createLinearGradient(0, -fontSize * 0.5, 0, fontSize * 0.5);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.28, topColor);
    grad.addColorStop(1, bottomColor);
    ctx.fillStyle = grad;
    ctx.fillText(ch, 0, 0);

    ctx.restore();
    cursorX += cw;
  });

  ctx.restore();
}

export function drawParticles(ctx: CanvasRenderingContext2D, pool: Particle[]) {
  for (const p of pool) {
    if (!p.active) continue;
    const t = p.life / p.maxLife;
    const alpha = t < 0.72 ? 1 : Math.max(0, 1 - (t - 0.72) / 0.28);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

    if (p.kind === 'star') {
      drawStar(ctx, 0, 0, p.size, p.color);
    } else if (p.kind === 'ring') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(2, 6 * (1 - t));
      ctx.beginPath();
      ctx.arc(0, 0, p.size * (1 + p.life * 4.5), 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.kind === 'shard') {
      // Jagged comic impact shard / bolt
      const len = p.size * 1.9;
      const wid = p.size * 0.65;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(len, 0);
      ctx.lineTo(-len * 0.45, -wid);
      ctx.lineTo(-len * 0.15, 0);
      ctx.lineTo(-len * 0.55, wid);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (p.kind === 'halftone') {
      // Comic ink halftone dot
      ctx.fillStyle = p.color;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * (1 - t * 0.4), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (p.kind === 'comic_word' && p.text) {
      // Flying comic impact word particle ("POW!", "BAAM!", "CRACK!")
      const pop = t < 0.16 ? 0.35 + (t / 0.16) * 0.85 : 1.2 - (t - 0.16) * 0.22;
      ctx.scale(pop, pop);
      drawComicGradientWord(
        ctx,
        p.text,
        p.size,
        p.color,
        p.secondaryColor || '#EF4444',
        0.75
      );
    } else {
      ctx.fillStyle = p.color;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * alpha + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function drawFloatingCallouts(
  ctx: CanvasRenderingContext2D,
  callouts: FloatingCallout[]
) {
  for (const c of callouts) {
    const progress = c.life / c.maxLife;
    const alpha = progress < 0.75 ? 1 : 1 - (progress - 0.75) / 0.25;
    const popScale = progress < 0.15 ? 0.6 + (progress / 0.15) * 0.5 : 1.05;

    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.translate(c.x, c.y - progress * 44);
    ctx.scale(c.scale * popScale, c.scale * popScale);
    ctx.textAlign = 'center';

    ctx.font = '400 24px "Bangers", "Comic Neue", system-ui, sans-serif';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = INK;
    ctx.strokeText(c.text, 0, 0);
    ctx.fillStyle = c.color;
    ctx.fillText(c.text, 0, 0);

    if (c.subtext) {
      ctx.font = '700 13px "Comic Neue", system-ui, sans-serif';
      ctx.lineWidth = 4;
      ctx.strokeText(c.subtext, 0, 20);
      ctx.fillStyle = '#FFF8EB';
      ctx.fillText(c.subtext, 0, 20);
    }

    ctx.restore();
  }
}

export function drawComicSfxBursts(
  ctx: CanvasRenderingContext2D,
  bursts: ComicSfxBurst[]
) {
  for (const b of bursts) {
    const t = b.life / b.maxLife;
    const alpha = t < 0.72 ? 1 : Math.max(0, 1 - (t - 0.72) / 0.28);
    // Elastic comic punch pop-in
    const popScale =
      t < 0.14
        ? 0.28 + (t / 0.14) * 0.96
        : t < 0.26
        ? 1.24 - ((t - 0.14) / 0.12) * 0.22
        : 1.02 + (t - 0.26) * 0.08;

    const totalScale = b.scale * popScale;
    const rx = Math.max(58, b.word.length * 12.5);
    const ry = 38;
    const points = Math.max(8, b.spikes) * 2;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(b.x, b.y - t * 14);
    ctx.rotate(b.angle);
    ctx.scale(totalScale, totalScale);

    // Comic speed-lines radiating around starburst
    ctx.save();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      const rayAngle = (i * Math.PI) / 3 + 0.25;
      const r1 = rx * 1.18;
      const r2 = rx * 1.38;
      ctx.beginPath();
      ctx.moveTo(Math.cos(rayAngle) * r1, Math.sin(rayAngle) * (ry * 1.25));
      ctx.lineTo(Math.cos(rayAngle) * r2, Math.sin(rayAngle) * (ry * 1.48));
      ctx.stroke();
    }
    ctx.restore();

    // Comic hard ink drop shadow
    ctx.save();
    ctx.translate(5, 6);
    ctx.fillStyle = INK;
    ctx.beginPath();
    for (let i = 0; i < points; i++) {
      const a = (i * Math.PI * 2) / points;
      const isOuter = i % 2 === 0;
      const radX = isOuter ? rx * 1.15 : rx * 0.68;
      const radY = isOuter ? ry * 1.25 : ry * 0.64;
      const px = Math.cos(a) * radX;
      const py = Math.sin(a) * radY;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Jagged starburst polygon
    ctx.fillStyle = b.burstColor;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < points; i++) {
      const a = (i * Math.PI * 2) / points;
      const isOuter = i % 2 === 0;
      const jitter = i % 4 === 0 ? 1.14 : 0.96;
      const radX = (isOuter ? rx * 1.15 : rx * 0.68) * jitter;
      const radY = (isOuter ? ry * 1.25 : ry * 0.64) * jitter;
      const px = Math.cos(a) * radX;
      const py = Math.sin(a) * radY;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner bright starburst highlight ring
    ctx.fillStyle = '#FFF8EB';
    ctx.globalAlpha = alpha * 0.35;
    ctx.beginPath();
    for (let i = 0; i < points; i++) {
      const a = (i * Math.PI * 2) / points;
      const isOuter = i % 2 === 0;
      const px = Math.cos(a) * (isOuter ? rx * 0.72 : rx * 0.42);
      const py = Math.sin(a) * (isOuter ? ry * 0.74 : ry * 0.4);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = alpha;

    // Stylized gradient curved comic lettering ("POW!", "BAAM!", "CRACK!")
    drawComicGradientWord(
      ctx,
      b.word,
      32,
      b.textColor,
      b.secondaryTextColor || (b.textColor === '#EF4444' ? '#991B1B' : '#EA580C'),
      1
    );

    ctx.restore();
  }
}
