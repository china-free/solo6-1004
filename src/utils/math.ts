export const PI = Math.PI;
export const TWO_PI = Math.PI * 2;
export const HALF_PI = Math.PI / 2;
export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};

export const normalizeAngle = (angle: number): number => {
  while (angle > PI) angle -= TWO_PI;
  while (angle < -PI) angle += TWO_PI;
  return angle;
};

export const normalizeAnglePositive = (angle: number): number => {
  angle = angle % TWO_PI;
  if (angle < 0) angle += TWO_PI;
  return angle;
};

export const shortestAngleDelta = (from: number, to: number): number => {
  return normalizeAngle(to - from);
};

export const dist = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

export const distSq = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
};

export const angleBetween = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.atan2(y2 - y1, x2 - x1);
};

export const pointOnCircle = (cx: number, cy: number, r: number, angle: number): [number, number] => {
  return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
};

export const rotatePoint = (px: number, py: number, cx: number, cy: number, angle: number): [number, number] => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = px - cx;
  const dy = py - cy;
  return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
};

export const snapToGrid = (value: number, gridSize: number): number => {
  return Math.round(value / gridSize) * gridSize;
};

export const movingAverage = (values: number[], windowSize: number): number => {
  if (values.length === 0) return 0;
  const window = values.slice(-windowSize);
  return window.reduce((sum, v) => sum + v, 0) / window.length;
};

export const standardDeviation = (values: number[]): number => {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
};

export const rk4Integrate = (
  angle: number,
  velocity: number,
  torqueFunc: (theta: number, omega: number) => number,
  inertia: number,
  dt: number
): [number, number] => {
  const a1 = torqueFunc(angle, velocity) / inertia;
  const v1 = velocity;

  const a2 = torqueFunc(angle + 0.5 * dt * v1, velocity + 0.5 * dt * a1) / inertia;
  const v2 = velocity + 0.5 * dt * a1;

  const a3 = torqueFunc(angle + 0.5 * dt * v2, velocity + 0.5 * dt * a2) / inertia;
  const v3 = velocity + 0.5 * dt * a2;

  const a4 = torqueFunc(angle + dt * v3, velocity + dt * a3) / inertia;
  const v4 = velocity + dt * a3;

  const newAngle = angle + (dt / 6) * (v1 + 2 * v2 + 2 * v3 + v4);
  const newVelocity = velocity + (dt / 6) * (a1 + 2 * a2 + 2 * a3 + a4);

  return [newAngle, newVelocity];
};

export const invLerp = (a: number, b: number, value: number): number => {
  if (b === a) return 0;
  return (value - a) / (b - a);
};

export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp(invLerp(edge0, edge1, x), 0, 1);
  return t * t * (3 - 2 * t);
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 10);
};
