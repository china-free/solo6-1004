import type { Part, Constraint } from '../../types';
import type { ConstraintSolver, SolverContext } from './types';
import type { CoaxialConstraintData } from '../types';
import {
  createCoaxialConstraint,
  computeCoaxialTorques,
  createCoaxialTorqueFunction,
} from '../constraints';

export const coaxialSolver: ConstraintSolver<CoaxialConstraintData> = {
  constraintType: 'coaxial',

  validateAndBuildData(
    partA: Part | undefined,
    partB: Part | undefined,
    constraint: Constraint
  ): CoaxialConstraintData | null {
    if (!partA || !partB) return null;
    return createCoaxialConstraint(constraint.partA, constraint.partB);
  },

  applyTorques(
    data: CoaxialConstraintData,
    _active: boolean,
    ctx: SolverContext
  ): void {
    const bodyA = ctx.bodies.get(data.partA);
    const bodyB = ctx.bodies.get(data.partB);
    if (!bodyA || !bodyB) return;

    const { torqueA, torqueB } = computeCoaxialTorques(data, bodyA.state, bodyB.state);
    bodyA.state.appliedTorque += torqueA;
    bodyB.state.appliedTorque += torqueB;
  },

  buildTorqueFunction(
    bodyId: string,
    data: CoaxialConstraintData,
    _active: boolean,
    ctx: SolverContext
  ) {
    if (data.partA === bodyId) {
      return createCoaxialTorqueFunction(
        data,
        () => ctx.bodies.get(data.partA)!.state,
        () => ctx.bodies.get(data.partB)!.state,
        'A'
      );
    } else if (data.partB === bodyId) {
      return createCoaxialTorqueFunction(
        data,
        () => ctx.bodies.get(data.partA)!.state,
        () => ctx.bodies.get(data.partB)!.state,
        'B'
      );
    }
    return null;
  },
};
