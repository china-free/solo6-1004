import type {
  GearPart,
  SpringPart,
  BalancePart,
  EscapementPart,
  BarrelPart,
  ShaftPart,
  HandPart,
} from '../types';
import { generateId } from '../utils/math';

export const createGear = (
  teeth: number,
  x: number,
  y: number,
  module: number = 3
): GearPart => {
  const pitchRadius = (module * teeth) / 2;
  const mass = 0.001 * teeth;
  const inertia = 0.5 * mass * pitchRadius * pitchRadius;

  return {
    id: generateId(),
    type: 'gear',
    x,
    y,
    rotation: 0,
    mass,
    inertia: Math.max(inertia, 0.00001),
    name: `齿轮(${teeth}齿)`,
    locked: false,
    teeth,
    module,
    pitchRadius,
    connectedTo: [],
  };
};

export const createSpring = (
  stiffness: number,
  x: number,
  y: number,
  balanceId: string,
  outerAnchorId: string
): SpringPart => {
  return {
    id: generateId(),
    type: 'spring',
    x,
    y,
    rotation: 0,
    mass: 0.0005,
    inertia: 0.00001,
    name: '游丝',
    locked: false,
    stiffness,
    coils: 12,
    damping: 0.001,
    innerAnchor: balanceId,
    outerAnchor: outerAnchorId,
  };
};

export const createBalance = (
  x: number,
  y: number,
  inertia: number = 0.001
): BalancePart => {
  return {
    id: generateId(),
    type: 'balance',
    x,
    y,
    rotation: 0,
    mass: 0.01,
    inertia,
    name: '摆轮',
    locked: false,
    amplitudeLimit: 1.5,
    radius: 30,
    hasDiscPin: true,
  };
};

export const createEscapement = (
  x: number,
  y: number,
  wheelId: string,
  balanceId: string
): EscapementPart => {
  return {
    id: generateId(),
    type: 'escapement',
    x,
    y,
    rotation: 0,
    mass: 0.005,
    inertia: 0.0001,
    name: '擒纵叉',
    locked: false,
    palletAngle: 0.08,
    lockDepth: 0.1,
    impulseAngle: 0.15,
    connectedWheel: wheelId,
    connectedBalance: balanceId,
    forkLength: 20,
  };
};

export const createBarrel = (
  x: number,
  y: number,
  energy: number = 1.0
): BarrelPart => {
  return {
    id: generateId(),
    type: 'barrel',
    x,
    y,
    rotation: 0,
    mass: 0.02,
    inertia: 0.0005,
    name: '发条盒',
    locked: false,
    energy,
    maxTorque: 0.005,
    radius: 25,
    arborDiameter: 4,
  };
};

export const createShaft = (
  x: number,
  y: number,
  isFixed: boolean = false
): ShaftPart => {
  return {
    id: generateId(),
    type: 'shaft',
    x,
    y,
    rotation: 0,
    mass: 0.002,
    inertia: 0.00005,
    name: isFixed ? '固定轴' : '传动轴',
    locked: false,
    radius: 3,
    friction: 0.001,
    isFixed,
  };
};

export const createHand = (
  handType: 'hour' | 'minute' | 'second',
  gearId: string,
  ratio: number
): HandPart => {
  const lengths = { hour: 40, minute: 55, second: 60 };
  const names = { hour: '时针', minute: '分针', second: '秒针' };

  return {
    id: generateId(),
    type: 'hand',
    x: 400,
    y: 300,
    rotation: 0,
    mass: 0.001,
    inertia: 0.00001,
    name: names[handType],
    locked: false,
    handType,
    connectedGear: gearId,
    gearRatio: ratio,
    length: lengths[handType],
  };
};
