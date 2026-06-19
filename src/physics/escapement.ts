import type { EscapementPart, PartState, BalancePart, GearPart } from '../types';
import { normalizeAngle, shortestAngleDelta, TWO_PI } from '../utils/math';
import type { EscapementConstraintData, EscapementState, TickEvent } from './types';

const IMPULSE_ENERGY = 0.00005;
const LOCK_THRESHOLD = 0.85;

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
  wheelTeeth: number
): PartState => {
  const toothAngle = TWO_PI / wheelTeeth;
  return {
    ...wheelState,
    angle: wheelState.angle - toothAngle,
    appliedTorque: 0,
  };
};

export const impartImpulse = (
  balanceState: PartState,
  energy: number = IMPULSE_ENERGY
): { newState: PartState; energyImparted: number } => {
  const currentKineticEnergy = 0.5 * balanceState.angularVelocity * balanceState.angularVelocity;
  const newKineticEnergy = currentKineticEnergy + energy;
  const velocitySign = balanceState.angularVelocity >= 0 ? 1 : -1;
  const newVelocity = velocitySign * Math.sqrt(Math.max(0, newKineticEnergy * 2));

  return {
    newState: {
      ...balanceState,
      angularVelocity: newVelocity,
    },
    energyImparted: energy,
  };
};

export const updateEscapement = (
  data: EscapementConstraintData,
  balance: BalancePart,
  wheel: GearPart,
  balanceState: PartState,
  wheelState: PartState,
  previousBalanceState: PartState,
  currentTime: number
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

      newWheelState = advanceEscapementWheel(newWheelState, wheel.teeth);

      const impulse = impartImpulse(newBalanceState);
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
