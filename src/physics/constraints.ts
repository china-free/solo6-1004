import type { GearPart, PartState } from '../types';
import { shortestAngleDelta } from '../utils/math';
import type { GearMeshConstraintData, CoaxialConstraintData } from './types';

const DEFAULT_GEAR_KP = 500;
const DEFAULT_GEAR_KD = 50;
const DEFAULT_COAXIAL_KP = 2000;
const DEFAULT_COAXIAL_KD = 100;

export const createGearMeshConstraint = (
  gearA: GearPart,
  gearB: GearPart
): GearMeshConstraintData => {
  return {
    gearA: gearA.id,
    gearB: gearB.id,
    teethA: gearA.teeth,
    teethB: gearB.teeth,
    kp: DEFAULT_GEAR_KP,
    kd: DEFAULT_GEAR_KD,
  };
};

export const createCoaxialConstraint = (
  partAId: string,
  partBId: string
): CoaxialConstraintData => {
  return {
    partA: partAId,
    partB: partBId,
    kp: DEFAULT_COAXIAL_KP,
    kd: DEFAULT_COAXIAL_KD,
  };
};

export const computeGearMeshTorques = (
  data: GearMeshConstraintData,
  stateA: PartState,
  stateB: PartState
): { torqueA: number; torqueB: number } => {
  const ratio = data.teethA / data.teethB;
  const idealAngleB = -stateA.angle * ratio;
  const angleError = shortestAngleDelta(stateB.angle, idealAngleB);

  const idealVelocityB = -stateA.angularVelocity * ratio;
  const velocityError = idealVelocityB - stateB.angularVelocity;

  const torqueB = data.kp * angleError + data.kd * velocityError;
  const torqueA = -torqueB * ratio;

  return { torqueA, torqueB };
};

export const computeGearTransmissionRatio = (
  teethA: number,
  teethB: number
): number => {
  return teethA / teethB;
};

export const computeCoaxialTorques = (
  data: CoaxialConstraintData,
  stateA: PartState,
  stateB: PartState
): { torqueA: number; torqueB: number } => {
  const angleError = shortestAngleDelta(stateB.angle, stateA.angle);
  const velocityError = stateA.angularVelocity - stateB.angularVelocity;

  const torqueA = -(data.kp * angleError + data.kd * velocityError);
  const torqueB = -torqueA;

  return { torqueA, torqueB };
};

export const createGearMeshTorqueFunction = (
  data: GearMeshConstraintData,
  getStateA: () => PartState,
  getStateB: () => PartState,
  target: 'A' | 'B',
  additionalTorque: number = 0
) => {
  return (theta: number, omega: number): number => {
    const currentStateA = getStateA();
    const currentStateB = getStateB();

    let stateA: PartState;
    let stateB: PartState;

    if (target === 'A') {
      stateA = { ...currentStateA, angle: theta, angularVelocity: omega };
      stateB = currentStateB;
    } else {
      stateA = currentStateA;
      stateB = { ...currentStateB, angle: theta, angularVelocity: omega };
    }

    const { torqueA, torqueB } = computeGearMeshTorques(data, stateA, stateB);
    return (target === 'A' ? torqueA : torqueB) + additionalTorque;
  };
};

export const createCoaxialTorqueFunction = (
  data: CoaxialConstraintData,
  getStateA: () => PartState,
  getStateB: () => PartState,
  target: 'A' | 'B',
  additionalTorque: number = 0
) => {
  return (theta: number, omega: number): number => {
    const currentStateA = getStateA();
    const currentStateB = getStateB();

    let stateA: PartState;
    let stateB: PartState;

    if (target === 'A') {
      stateA = { ...currentStateA, angle: theta, angularVelocity: omega };
      stateB = currentStateB;
    } else {
      stateA = currentStateA;
      stateB = { ...currentStateB, angle: theta, angularVelocity: omega };
    }

    const { torqueA, torqueB } = computeCoaxialTorques(data, stateA, stateB);
    return (target === 'A' ? torqueA : torqueB) + additionalTorque;
  };
};
