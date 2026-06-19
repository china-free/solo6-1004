import type { Part, GearPart, SpringPart, BalancePart, EscapementPart, BarrelPart, ShaftPart, HandPart, PlatePart } from '../../types';
import { createBrassGradient, createBluedSteelGradient, createRubyGradient, drawRivet, drawRotated } from '../../utils/drawing';

export function renderPart(ctx: CanvasRenderingContext2D, part: Part): void {
  drawRotated(ctx, part.x, part.y, part.rotation, () => {
    switch (part.type) {
      case 'gear':
        drawGear(ctx, part);
        break;
      case 'spring':
        drawSpring(ctx, part);
        break;
      case 'balance':
        drawBalance(ctx, part);
        break;
      case 'escapement':
        drawEscapement(ctx, part);
        break;
      case 'barrel':
        drawBarrel(ctx, part);
        break;
      case 'shaft':
        drawShaft(ctx, part);
        break;
      case 'hand':
        drawHand(ctx, part);
        break;
      case 'plate':
        drawPlate(ctx, part);
        break;
    }
  });
}

function drawGear(ctx: CanvasRenderingContext2D, gear: GearPart): void {
  const { x, y, teeth, pitchRadius } = gear;
  const module = (pitchRadius * 2) / teeth;
  const outerRadius = pitchRadius + module;
  const rootRadius = pitchRadius - module * 1.25;
  const pressureAngle = Math.PI / 9;
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const toothAngle = (i / teeth) * Math.PI * 2;
    const halfTooth = Math.PI / teeth;
    for (let t = 0; t <= 8; t++) {
      const tt = t / 8;
      const angle = toothAngle - halfTooth + halfTooth * 0.4 * tt;
      const r = rootRadius + (pitchRadius - rootRadius) * tt;
      const inv = tt * tt * (pitchRadius - rootRadius) * 0.3;
      const px = x + Math.cos(angle + inv / r) * r;
      const py = y + Math.sin(angle + inv / r) * r;
      if (i === 0 && t === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    for (let t = 0; t <= 8; t++) {
      const tt = t / 8;
      const angle = toothAngle - halfTooth * 0.4 + halfTooth * 0.8 * tt;
      const r = pitchRadius + (outerRadius - pitchRadius) * Math.sin(tt * Math.PI);
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      ctx.lineTo(px, py);
    }
    for (let t = 0; t <= 8; t++) {
      const tt = t / 8;
      const angle = toothAngle + halfTooth * 0.4 + halfTooth * 0.4 * tt;
      const r = outerRadius - (outerRadius - pitchRadius) * tt;
      const inv = tt * tt * (outerRadius - pitchRadius) * 0.3;
      const px = x + Math.cos(angle - inv / r) * r;
      const py = y + Math.sin(angle - inv / r) * r;
      ctx.lineTo(px, py);
    }
    for (let t = 0; t <= 4; t++) {
      const tt = t / 4;
      const angle = toothAngle + halfTooth + (Math.PI * 2 / teeth - halfTooth) * tt;
      const px = x + Math.cos(angle) * rootRadius;
      const py = y + Math.sin(angle) * rootRadius;
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fillStyle = createBrassGradient(ctx, x, y, outerRadius);
  ctx.fill();
  ctx.strokeStyle = '#5a4510';
  ctx.lineWidth = 1;
  ctx.stroke();
  const holeRadius = pitchRadius * 0.25;
  ctx.beginPath();
  ctx.arc(x, y, holeRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#2a1f08';
  ctx.fill();
  ctx.strokeStyle = '#1a1505';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  if (pitchRadius > 30) {
    const spokeCount = 5;
    const innerR = holeRadius + 4;
    const outerR = pitchRadius * 0.75;
    for (let i = 0; i < spokeCount; i++) {
      const angle = (i / spokeCount) * Math.PI * 2;
      const sx = x + Math.cos(angle) * innerR;
      const sy = y + Math.sin(angle) * innerR;
      const ex = x + Math.cos(angle) * outerR;
      const ey = y + Math.sin(angle) * outerR;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = 'rgba(90, 69, 16, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawSpring(ctx: CanvasRenderingContext2D, spring: SpringPart): void {
  const { x, y, coils } = spring;
  const maxRadius = 40;
  const minRadius = 5;
  const turns = Math.max(3, coils);
  ctx.save();
  ctx.strokeStyle = createBluedSteelGradient(ctx, x, y, maxRadius) as unknown as string;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const steps = turns * 120;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2;
    const radius = minRadius + (maxRadius - minRadius) * (1 - Math.pow(1 - t, 1.5));
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, minRadius, 0, Math.PI * 2);
  ctx.fillStyle = createBluedSteelGradient(ctx, x, y, minRadius * 2);
  ctx.fill();
  ctx.strokeStyle = '#0d2030';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.restore();
}

function drawBalance(ctx: CanvasRenderingContext2D, balance: BalancePart): void {
  const { x, y, radius } = balance;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = createBrassGradient(ctx, x, y, radius);
  ctx.fill();
  ctx.strokeStyle = '#5a4510';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const innerRadius = radius * 0.8;
  ctx.beginPath();
  ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(90, 69, 16, 0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();
  const spokeCount = 4;
  for (let i = 0; i < spokeCount; i++) {
    const angle = (i / spokeCount) * Math.PI * 2;
    const sx = x + Math.cos(angle) * (radius * 0.12);
    const sy = y + Math.sin(angle) * (radius * 0.12);
    const ex = x + Math.cos(angle) * innerRadius;
    const ey = y + Math.sin(angle) * innerRadius;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = 'rgba(90, 69, 16, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  const rubyCount = 8;
  const rubyRadius = radius * 0.9;
  for (let i = 0; i < rubyCount; i++) {
    const angle = (i / rubyCount) * Math.PI * 2;
    const rx = x + Math.cos(angle) * rubyRadius;
    const ry = y + Math.sin(angle) * rubyRadius;
    drawRivet(ctx, rx, ry, 2.5, true);
  }
  const centerHole = radius * 0.1;
  ctx.beginPath();
  ctx.arc(x, y, centerHole, 0, Math.PI * 2);
  ctx.fillStyle = '#2a1f08';
  ctx.fill();
  ctx.strokeStyle = '#1a1505';
  ctx.lineWidth = 1;
  ctx.stroke();
  if (balance.hasDiscPin) {
    const pinAngle = -Math.PI / 2;
    const pinDist = radius * 0.65;
    const px = x + Math.cos(pinAngle) * pinDist;
    const py = y + Math.sin(pinAngle) * pinDist;
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#4a3818';
    ctx.fill();
    ctx.strokeStyle = '#2a1f08';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

function drawEscapement(ctx: CanvasRenderingContext2D, escapement: EscapementPart): void {
  const { x, y, forkLength } = escapement;
  ctx.save();
  const stemWidth = 10;
  const stemLength = forkLength * 0.6;
  ctx.fillStyle = createBrassGradient(ctx, x, y, forkLength);
  ctx.strokeStyle = '#5a4510';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.rect(x - stemWidth / 2, y - stemLength / 2, stemWidth, stemLength);
  ctx.fill();
  ctx.stroke();
  const forkWidth = forkLength * 0.9;
  const forkArmWidth = 8;
  const forkArmLength = forkLength * 0.4;
  ctx.beginPath();
  ctx.rect(x - forkWidth / 2, y - stemLength / 2 - forkArmWidth, forkWidth, forkArmWidth);
  ctx.fillStyle = createBrassGradient(ctx, x, y - stemLength / 3, forkLength);
  ctx.fill();
  ctx.stroke();
  const palletSize = 7;
  const leftPalletX = x - forkWidth / 2 - 3;
  const rightPalletX = x + forkWidth / 2 + 3;
  const palletY = y - stemLength / 2 - forkArmWidth / 2;
  ctx.beginPath();
  ctx.arc(leftPalletX, palletY, palletSize, 0, Math.PI * 2);
  ctx.fillStyle = createRubyGradient(ctx, leftPalletX, palletY, palletSize * 2);
  ctx.fill();
  ctx.strokeStyle = '#700818';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(rightPalletX, palletY, palletSize, 0, Math.PI * 2);
  ctx.fillStyle = createRubyGradient(ctx, rightPalletX, palletY, palletSize * 2);
  ctx.fill();
  ctx.stroke();
  const hornLength = forkLength * 0.5;
  ctx.beginPath();
  ctx.moveTo(x - forkWidth / 4, y - stemLength / 2 - forkArmWidth);
  ctx.lineTo(x - forkWidth / 4 - 5, y - stemLength / 2 - forkArmWidth - hornLength);
  ctx.lineTo(x - forkWidth / 4 + 2, y - stemLength / 2 - forkArmWidth - hornLength);
  ctx.lineTo(x - forkWidth / 4 + 3, y - stemLength / 2 - forkArmWidth);
  ctx.closePath();
  ctx.fillStyle = createBrassGradient(ctx, x, y - stemLength / 2, forkLength);
  ctx.fill();
  ctx.strokeStyle = '#5a4510';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + forkWidth / 4, y - stemLength / 2 - forkArmWidth);
  ctx.lineTo(x + forkWidth / 4 + 5, y - stemLength / 2 - forkArmWidth - hornLength);
  ctx.lineTo(x + forkWidth / 4 - 2, y - stemLength / 2 - forkArmWidth - hornLength);
  ctx.lineTo(x + forkWidth / 4 - 3, y - stemLength / 2 - forkArmWidth);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const centerR = 5;
  ctx.beginPath();
  ctx.arc(x, y, centerR, 0, Math.PI * 2);
  ctx.fillStyle = '#2a1f08';
  ctx.fill();
  ctx.strokeStyle = '#1a1505';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawBarrel(ctx: CanvasRenderingContext2D, barrel: BarrelPart): void {
  const { x, y, radius } = barrel;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = createBrassGradient(ctx, x, y, radius);
  ctx.fill();
  ctx.strokeStyle = '#5a4510';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const teeth = 60;
  const module = 1.5;
  const outerR = radius + module;
  const rootR = radius;
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const toothAngle = (i / teeth) * Math.PI * 2;
    const halfTooth = Math.PI / teeth;
    const a1 = toothAngle - halfTooth;
    const a2 = toothAngle - halfTooth * 0.4;
    const a3 = toothAngle + halfTooth * 0.4;
    const a4 = toothAngle + halfTooth;
    const p1x = x + Math.cos(a1) * rootR;
    const p1y = y + Math.sin(a1) * rootR;
    const p2x = x + Math.cos(a2) * outerR;
    const p2y = y + Math.sin(a2) * outerR;
    const p3x = x + Math.cos(a3) * outerR;
    const p3y = y + Math.sin(a3) * outerR;
    const p4x = x + Math.cos(a4) * rootR;
    const p4y = y + Math.sin(a4) * rootR;
    if (i === 0) ctx.moveTo(p1x, p1y);
    ctx.lineTo(p2x, p2y);
    ctx.lineTo(p3x, p3y);
    ctx.lineTo(p4x, p4y);
  }
  ctx.closePath();
  ctx.strokeStyle = '#5a4510';
  ctx.lineWidth = 1;
  ctx.stroke();
  const holeR = barrel.arborDiameter / 2 || radius * 0.2;
  ctx.beginPath();
  ctx.arc(x, y, holeR, 0, Math.PI * 2);
  ctx.fillStyle = '#2a1f08';
  ctx.fill();
  ctx.strokeStyle = '#1a1505';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  const energyRatio = Math.min(1, Math.max(0, barrel.energy / barrel.maxTorque));
  const innerR = radius * 0.85;
  ctx.beginPath();
  ctx.arc(x, y, innerR, -Math.PI / 2, -Math.PI / 2 + energyRatio * Math.PI * 2);
  ctx.strokeStyle = `rgba(200, 140, 50, ${0.3 + energyRatio * 0.5})`;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function drawShaft(ctx: CanvasRenderingContext2D, shaft: ShaftPart): void {
  const { x, y, radius } = shaft;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = createBrassGradient(ctx, x, y, radius * 2);
  ctx.fill();
  ctx.strokeStyle = '#5a4510';
  ctx.lineWidth = 1;
  ctx.stroke();
  const innerR = radius * 0.6;
  ctx.beginPath();
  ctx.arc(x, y, innerR, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(90, 69, 16, 0.4)';
  ctx.fill();
  if (shaft.isFixed) {
    const markR = radius * 0.3;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const sx = x + Math.cos(angle) * markR;
      const sy = y + Math.sin(angle) * markR;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = '#2a1f08';
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawHand(ctx: CanvasRenderingContext2D, hand: HandPart): void {
  const { x, y, length, handType } = hand;
  ctx.save();
  let width: number;
  let color: string;
  let tipColor: string;
  switch (handType) {
    case 'hour':
      width = 6;
      color = '#2a2010';
      tipColor = '#1a1505';
      break;
    case 'minute':
      width = 4;
      color = '#3a2a15';
      tipColor = '#2a1f08';
      break;
    case 'second':
      width = 2;
      color = '#c82030';
      tipColor = '#901018';
      break;
    default:
      width = 4;
      color = '#3a2a15';
      tipColor = '#2a1f08';
  }
  const tailLength = length * 0.2;
  ctx.beginPath();
  ctx.moveTo(x, y + tailLength);
  ctx.lineTo(x - width / 2, y + tailLength * 0.3);
  ctx.lineTo(x - width / 3, y - length * 0.7);
  ctx.lineTo(x, y - length);
  ctx.lineTo(x + width / 3, y - length * 0.7);
  ctx.lineTo(x + width / 2, y + tailLength * 0.3);
  ctx.closePath();
  const grad = ctx.createLinearGradient(x - width, y, x + width, y);
  grad.addColorStop(0, color);
  grad.addColorStop(0.5, tipColor);
  grad.addColorStop(1, color);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  if (handType === 'second') {
    ctx.beginPath();
    ctx.arc(x, y - length * 0.55, width * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  const centerR = Math.max(3, width * 0.8);
  ctx.beginPath();
  ctx.arc(x, y, centerR, 0, Math.PI * 2);
  ctx.fillStyle = tipColor;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.restore();
}

function drawPlate(ctx: CanvasRenderingContext2D, plate: PlatePart): void {
  const { x, y, width, height } = plate;
  ctx.save();
  const grad = ctx.createLinearGradient(x - width / 2, y - height / 2, x + width / 2, y + height / 2);
  grad.addColorStop(0, '#c49440');
  grad.addColorStop(0.5, '#a87828');
  grad.addColorStop(1, '#8b6018');
  ctx.fillStyle = grad;
  ctx.fillRect(x - width / 2, y - height / 2, width, height);
  ctx.strokeStyle = '#5a4510';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - width / 2, y - height / 2, width, height);
  const rivetSize = Math.min(width, height) * 0.025;
  const inset = rivetSize * 3;
  const positions = [
    [x - width / 2 + inset, y - height / 2 + inset],
    [x + width / 2 - inset, y - height / 2 + inset],
    [x - width / 2 + inset, y + height / 2 - inset],
    [x + width / 2 - inset, y + height / 2 - inset],
  ];
  if (width > 100) {
    positions.push([x, y - height / 2 + inset]);
    positions.push([x, y + height / 2 - inset]);
  }
  if (height > 100) {
    positions.push([x - width / 2 + inset, y]);
    positions.push([x + width / 2 - inset, y]);
  }
  positions.forEach(([rx, ry]) => {
    drawRivet(ctx, rx, ry, rivetSize);
  });
  ctx.restore();
}

export class PartRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  render(part: Part): void {
    renderPart(this.ctx, part);
  }
}
