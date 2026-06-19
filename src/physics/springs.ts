import type { SpringPart, PartState } from '../types';
import { shortestAngleDelta } from '../utils/math';
import type { SpringConstraintData } from './types';

export const createSpringConstraint = (
  spring: SpringPart
): SpringConstraintData => {
  return {
    springId: spring.id,
    innerPart: spring.innerAnchor,
    outerPart: spring.outerAnchor,
    stiffness: spring.stiffness,
    damping: spring.damping,
  };
};

export const computeSpringTorque = (
  data: SpringConstraintData,
  innerState: PartState,
  outerState: PartState
): { innerTorque: number; outerTorque: number } => {
  const relativeAngle = shortestAngleDelta(outerState.angle, innerState.angle);
  const relativeVelocity = innerState.angularVelocity - outerState.angularVelocity;

  const torqueMagnitude = -data.stiffness * relativeAngle - data.damping * relativeVelocity;

  return {
    innerTorque: torqueMagnitude,
    outerTorque: -torqueMagnitude,
  };
};

export const computeSpringPotentialEnergy = (
  data: SpringConstraintData,
  innerState: PartState,
  outerState: PartState
): number => {
  const relativeAngle = shortestAngleDelta(outerState.angle, innerState.angle);
  return 0.5 * data.stiffness * relativeAngle * relativeAngle;
};

export const createSpringTorqueFunction = (
  data: SpringConstraintData,
  getInnerState: () => PartState,
  getOuterState: () => PartState,
  additionalTorque: number = 0
) => {
  return (theta: number, omega: number): number => {
    const innerSnapshot = { ...getInnerState(), angle: theta, angularVelocity: omega };
    const outerSnapshot = getOuterState();
    const { innerTorque } = computeSpringTorque(data, innerSnapshot, outerSnapshot);
    return innerTorque + additionalTorque;
  };
};
