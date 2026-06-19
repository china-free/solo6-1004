import type { BalancePart, EscapementPart, GearPart, Part, Constraint } from '../../types';
import type { ConstraintSolver, SolverContext } from './types';
import type { EscapementConstraintData } from '../types';
import {
  createEscapementConstraint,
  computeEscapementLockingTorque,
  updateEscapement,
} from '../escapement';

export const escapementSolver: ConstraintSolver<EscapementConstraintData> = {
  constraintType: 'escapement_lock',

  validateAndBuildData(
    partA: Part | undefined,
    _partB: Part | undefined,
    _constraint: Constraint
  ): EscapementConstraintData | null {
    if (!partA || partA.type !== 'escapement') return null;
    return createEscapementConstraint(partA as EscapementPart);
  },

  applyTorques(
    data: EscapementConstraintData,
    _active: boolean,
    ctx: SolverContext
  ): void {
    const balanceBody = ctx.bodies.get(data.balanceId);
    if (!balanceBody) return;

    const lockingTorque = computeEscapementLockingTorque(data, balanceBody.state);
    balanceBody.state.appliedTorque += lockingTorque;
  },

  buildTorqueFunction() {
    return null;
  },

  postIntegrate(
    data: EscapementConstraintData,
    _active: boolean,
    dt: number,
    ctx: SolverContext
  ): EscapementConstraintData {
    const escapementBody = ctx.bodies.get(data.escapementId);
    const balanceBody = ctx.bodies.get(data.balanceId);
    const wheelBody = ctx.bodies.get(data.wheelId);

    if (!escapementBody || !balanceBody || !wheelBody) return data;
    if (balanceBody.part.type !== 'balance' || wheelBody.part.type !== 'gear') return data;

    const previousBalanceState = ctx.previousStates.get(data.balanceId);
    if (!previousBalanceState) return data;

    const barrelDrivingTorque = ctx.getTotalBarrelTorque();

    const result = updateEscapement(
      data,
      balanceBody.part as BalancePart,
      wheelBody.part as GearPart,
      balanceBody.state,
      wheelBody.state,
      previousBalanceState,
      ctx.elapsedSimTime,
      dt,
      barrelDrivingTorque
    );

    balanceBody.state = result.balanceState;
    wheelBody.state = result.wheelState;

    if (result.tickEvent) {
      ctx.collectTickEvent(result.tickEvent);
      if (ctx.onTick) {
        ctx.onTick(result.tickEvent);
      }
    }

    return result.data;
  },
};
