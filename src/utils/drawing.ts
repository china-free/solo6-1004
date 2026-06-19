export function createBrassGradient(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): CanvasGradient {
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  grad.addColorStop(0, '#f5d580');
  grad.addColorStop(0.3, '#e6b84e');
  grad.addColorStop(0.6, '#c49335');
  grad.addColorStop(0.85, '#8b6914');
  grad.addColorStop(1, '#5a4510');
  return grad;
}

export function createBluedSteelGradient(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): CanvasGradient {
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  grad.addColorStop(0, '#7cb5d6');
  grad.addColorStop(0.3, '#4a8ab8');
  grad.addColorStop(0.6, '#2c5f8a');
  grad.addColorStop(0.85, '#1a3d5c');
  grad.addColorStop(1, '#0d2030');
  return grad;
}

export function createRubyGradient(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): CanvasGradient {
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  grad.addColorStop(0, '#ff8090');
  grad.addColorStop(0.3, '#e83050');
  grad.addColorStop(0.6, '#b81030');
  grad.addColorStop(0.85, '#700818');
  grad.addColorStop(1, '#38040a');
  return grad;
}

export function generateEtchingTexture(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#b8863a';
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 1.5 + 0.3;
    const alpha = Math.random() * 0.25 + 0.05;
    ctx.fillStyle = `rgba(60, 40, 10, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 150; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const len = Math.random() * 20 + 5;
    const angle = Math.random() * Math.PI * 2;
    const alpha = Math.random() * 0.15 + 0.03;
    ctx.strokeStyle = `rgba(90, 60, 15, ${alpha})`;
    ctx.lineWidth = Math.random() * 0.8 + 0.3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
    ctx.stroke();
  }
  return canvas;
}

export function drawRivet(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, isRuby: boolean = false): void {
  const r = size;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (isRuby) {
    ctx.fillStyle = createRubyGradient(ctx, x, y, r);
  } else {
    ctx.fillStyle = createBrassGradient(ctx, x, y, r);
  }
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.restore();
}

export function drawRotated(ctx: CanvasRenderingContext2D, cx: number, cy: number, angle: number, drawFn: () => void): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.translate(-cx, -cy);
  drawFn();
  ctx.restore();
}
