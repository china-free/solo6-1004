export type PartType = 'gear' | 'spring' | 'balance' | 'escapement' | 'barrel' | 'shaft' | 'hand' | 'plate';

export interface BasePart {
  id: string;
  type: PartType;
  x: number;
  y: number;
  rotation: number;
  mass: number;
  inertia: number;
  name: string;
  locked: boolean;
}

export interface GearPart extends BasePart {
  type: 'gear';
  teeth: number;
  module: number;
  pitchRadius: number;
  connectedTo: string[];
  isEscapementWheel?: boolean;
}

export interface SpringPart extends BasePart {
  type: 'spring';
  stiffness: number;
  coils: number;
  damping: number;
  innerAnchor: string;
  outerAnchor: string;
}

export interface BalancePart extends BasePart {
  type: 'balance';
  amplitudeLimit: number;
  radius: number;
  hasDiscPin: boolean;
}

export interface EscapementPart extends BasePart {
  type: 'escapement';
  palletAngle: number;
  lockDepth: number;
  impulseAngle: number;
  connectedWheel: string;
  connectedBalance: string;
  forkLength: number;
}

export interface BarrelPart extends BasePart {
  type: 'barrel';
  energy: number;
  maxTorque: number;
  radius: number;
  arborDiameter: number;
}

export interface ShaftPart extends BasePart {
  type: 'shaft';
  radius: number;
  friction: number;
  isFixed: boolean;
}

export interface HandPart extends BasePart {
  type: 'hand';
  handType: 'hour' | 'minute' | 'second';
  connectedGear: string;
  gearRatio: number;
  length: number;
}

export interface PlatePart extends BasePart {
  type: 'plate';
  width: number;
  height: number;
}

export type Part = GearPart | SpringPart | BalancePart | EscapementPart | BarrelPart | ShaftPart | HandPart | PlatePart;

export interface PartState {
  angle: number;
  angularVelocity: number;
  angularAcceleration: number;
  appliedTorque: number;
  lastTickAngle: number;
}

export type ConstraintType = 'gear_mesh' | 'shaft' | 'spring_torque' | 'escapement_lock' | 'coaxial';

export interface Constraint {
  id: string;
  type: ConstraintType;
  partA: string;
  partB: string;
  params: Record<string, number>;
  active: boolean;
}

export interface PhysicsConfig {
  gravity: number;
  airResistance: number;
  defaultFriction: number;
  subSteps: number;
}

export interface PhysicsState {
  running: boolean;
  timeScale: number;
  elapsedSimTime: number;
  elapsedRealTime: number;
  partsState: Record<string, PartState>;
  constraints: Constraint[];
  tickCount: number;
  lastTickTime: number;
}

export interface OscilloscopeData {
  timeData: number[];
  amplitudeData: number[];
  velocityData: number[];
  currentFrequency: number;
  targetFrequency: number;
  dailyRate: number;
  dailyRateHistory: number[];
  amplitudeStability: number;
  energyReserve: number;
}

export interface LevelConfig {
  id: string;
  name: string;
  description: string;
  maxParts: number;
  targetDailyRate: number;
  targetAmplitude: number;
  minStableCycles: number;
  availableParts: PartType[];
  presetParts?: Part[];
  hint: string;
}

export interface LevelProgress {
  levelId: string;
  completed: boolean;
  bestDailyRate: number;
  unlocked: boolean;
}

export type DragMode = 'none' | 'move' | 'rotate' | 'connect' | 'create';

export interface UIState {
  selectedPartId: string | null;
  hoveredPartId: string | null;
  dragMode: DragMode;
  connectionSourceId: string | null;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  showDebugInfo: boolean;
  audioEnabled: boolean;
  volume: number;
}
