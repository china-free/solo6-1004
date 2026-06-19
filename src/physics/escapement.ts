import type { EscapementPart, PartState, BalancePart, GearPart } from '../types';
import { normalizeAngle, shortestAngleDelta, TWO_PI, clamp } from '../utils/math';
import type { EscapementConstraintData, EscapementState, TickEvent } from './types';

const IMPULSE_ENERGY_PER_UNIT_I = 0.05;
const MIN_IMPULSE_ENERGY = 0.00001;
const MAX_IMPULSE_ENERGY = 0.001;
const LOCK_THRESHOLD = 0.85;
const TARGET_AMPLITUDE_RATIO = 0.75;

export const createEscapementState = (): EscapementState => {
  return {
    palletLocked: true,
    lockedSide: 'entry',
    lastReleaseAngle: 0,
    tickPending: false,
    tockPending: false,
  };
};

export const createEscapementConstraint = (
  escapement: EscapementPart
): EscapementConstraintData => {
  return {
    escapementId: escapement.id,
    wheelId: escapement.connectedWheel,
    balanceId: escapement.connectedBalance,
    palletAngle: escapement.palletAngle,
    lockDepth: escapement.lockDepth,
    impulseAngle: escapement.impulseAngle,
    state: createEscapementState(),
  };
};

export const detectExtremum = (
  currentAngle: number,
  currentVelocity: number,
  previousAngle: number,
  previousVelocity: number,
  amplitudeLimit: number
): { reached: boolean; side: 'positive' | 'negative' | null } => {
  if (Math.abs(currentAngle) < amplitudeLimit * LOCK_THRESHOLD) {
    return { reached: false, side: null };
  }

  const signChanged = (previousVelocity > 0 && currentVelocity <= 0) ||
    (previousVelocity < 0 && currentVelocity >= 0);

  if (!signChanged) {
    return { reached: false, side: null };
  }

  const side = currentAngle > 0 ? 'positive' : 'negative';
  return { reached: true, side };
};

export const checkLockRelease = (
  data: EscapementConstraintData,
  balanceState: PartState,
  amplitudeLimit: number
): { shouldRelease: boolean; releaseSide: 'entry' | 'exit' | null } => {
  const { state, palletAngle, lockDepth } = data;

  if (!state.palletLocked) {
    return { shouldRelease: false, releaseSide: null };
  }

  const releaseAngle = palletAngle - lockDepth;
  const absAngle = Math.abs(balanceState.angle);

  if (absAngle < releaseAngle) {
    return { shouldRelease: false, releaseSide: null };
  }

  const side = balanceState.angle > 0 ? 'exit' : 'entry';
  return { shouldRelease: true, releaseSide: side };
};

export const advanceEscapementWheel = (
  wheelState: PartState,
  wheelTeeth: number,
  wheelInertia: number,
  dt: number,
  drivingTorque: number = 0
): { newState: PartState; angularImpulse: number } => {
  const toothAngle = TWO_PI / wheelTeeth;
  const currentAngle = wheelState.angle;
  const targetAngle = currentAngle - toothAngle;
  const angleDelta = shortestAngleDelta(currentAngle, targetAngle);
  const targetAngularVelocity = angleDelta / Math.max(dt, 0.0001);
  const velocityDelta = targetAngularVelocity - wheelState.angularVelocity;
  const angularImpulse = Math.max(wheelInertia, 0.000001) * velocityDelta;
  const impulseTorque = angularImpulse / Math.max(dt, 0.0001);

  return {
    newState: {
      ...wheelState,
      appliedTorque: wheelState.appliedTorque + impulseTorque + drivingTorque,
    },
    angularImpulse,
  };
};

export const impartImpulse = (
  balanceState: PartState,
  balanceInertia: number,
  amplitudeLimit: number,
  currentAngle: number
): { newState: PartState; energyImparted: number } => {
  const I = Math.max(balanceInertia, 0.000001);
  const omega = balanceState.angularVelocity;
  const currentKE = 0.5 * I * omega * omega;
  const currentAmplitude = Math.abs(currentAngle);
  const targetAmplitude = amplitudeLimit * TARGET_AMPLITUDE_RATIO;
  const amplitudeDeficit = Math.max(0, targetAmplitude - currentAmplitude);
  const amplitudeRatio = amplitudeDeficit / Math.max(amplitudeLimit, 0.001);
  const baseEnergy = IMPULSE_ENERGY_PER_UNIT_I * I;
  const scaledEnergy = baseEnergy * (0.5 + amplitudeRatio * 1.5);
  const impulseEnergy = clamp(scaledEnergy, MIN_IMPULSE_ENERGY, MAX_IMPULSE_ENERGY);
  const targetKE = currentKE + impulseEnergy;
  const velocitySign = omega >= 0 ? 1 : -1;
  const targetVelocity = velocitySign * Math.sqrt(Math.max(0, (2 * targetKE) / I));
  const maxSafeVelocity = amplitudeLimit * 8;
  const clampedVelocity = clamp(targetVelocity, -maxSafeVelocity, maxSafeVelocity);

  return {
    newState: {
      ...balanceState,
      angularVelocity: clampedVelocity,
    },
    energyImparted: impulseEnergy,
  };
};

export const updateEscapement = (
  data: EscapementConstraintData,
  balance: BalancePart,
  wheel: GearPart,
  balanceState: PartState,
  wheelState: PartState,
  previousBalanceState: PartState,
  currentTime: number,
  dt: number,
  barrelDrivingTorque: number = 0
): {
  data: EscapementConstraintData;
  balanceState: PartState;
  wheelState: PartState;
  tickEvent: TickEvent | null;
} => {
  let newData = { ...data, state: { ...data.state } };
  let newBalanceState = { ...balanceState };
  let newWheelState = { ...wheelState };
  let tickEvent: TickEvent | null = null;

  const extremum = detectExtremum(
    balanceState.angle,
    balanceState.angularVelocity,
    previousBalanceState.angle,
    previousBalanceState.angularVelocity,
    balance.amplitudeLimit
  );

  if (extremum.reached) {
    const lockCheck = checkLockRelease(newData, newBalanceState, balance.amplitudeLimit);

    if (lockCheck.shouldRelease) {
      newData.state.palletLocked = false;
      newData.state.lockedSide = null;

      const wheelAdvance = advanceEscapementWheel(
        newWheelState,
        wheel.teeth,
        wheel.inertia,
        dt,
        barrelDrivingTorque
      );
      newWheelState = wheelAdvance.newState;

      const impulse = impartImpulse(
        newBalanceState,
        balance.inertia,
        balance.amplitudeLimit,
        newBalanceState.angle
      );
      newBalanceState = impulse.newState;

      newData.state.lastReleaseAngle = newBalanceState.angle;
      newData.state.tickPending = lockCheck.releaseSide === 'entry';
      newData.state.tockPending = lockCheck.releaseSide === 'exit';

      const eventType: 'tick' | 'tock' = lockCheck.releaseSide === 'entry' ? 'tick' : 'tock';
      tickEvent = {
        type: eventType,
        time: currentTime,
        balanceId: data.balanceId,
        angle: newBalanceState.angle,
        energyImparted: impulse.energyImparted,
      };
    }
  }

  if (!newData.state.palletLocked) {
    const absAngle = Math.abs(newBalanceState.angle);
    if (absAngle < newData.palletAngle * 0.5) {
      const lockingSide: 'entry' | 'exit' = newBalanceState.angularVelocity > 0 ? 'exit' : 'entry';
      newData.state.palletLocked = true;
      newData.state.lockedSide = lockingSide;
      newData.state.tickPending = false;
      newData.state.tockPending = false;
    }
  }

  return { data: newData, balanceState: newBalanceState, wheelState: newWheelState, tickEvent };
};

export const computeEscapementLockingTorque = (
  data: EscapementConstraintData,
  balanceState: PartState
): number => {
  if (!data.state.palletLocked) {
    return 0;
  }

  const { palletAngle, lockDepth } = data;
  const targetAngle = data.state.lockedSide === 'entry' ? -palletAngle + lockDepth : palletAngle - lockDepth;
  const angleError = shortestAngleDelta(balanceState.angle, targetAngle);

  const kp = 800;
  const kd = 20;
  return kp * angleError - kd * balanceState.angularVelocity;
};

export const isTickDue = (data: EscapementConstraintData): boolean => {
  return data.state.tickPending;
};

export const isTockDue = (data: EscapementConstraintData): boolean => {
  return data.state.tockPending;
};
