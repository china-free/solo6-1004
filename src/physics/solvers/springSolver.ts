import type { SpringPart, Part, Constraint } from '../../types';
import type { ConstraintSolver, SolverContext } from './types';
import type { SpringConstraintData } from '../types';
import {
  createSpringConstraint,
  computeSpringTorque,
  createSpringTorqueFunction,
} from '../springs';

export const springSolver: ConstraintSolver<SpringConstraintData> = {
  constraintType: 'spring_torque',

  validateAndBuildData(
    partA: Part | undefined,
    _partB: Part | undefined,
    _constraint: Constraint
  ): SpringConstraintData | null {
    if (!partA || partA.type !== 'spring') return null;
    return createSpringConstraint(partA as SpringPart);
  },

  applyTorques(
    data: SpringConstraintData,
    _active: boolean,
    ctx: SolverContext
  ): void {
    const innerBody = ctx.bodies.get(data.innerPart);
    const outerBody = ctx.bodies.get(data.outerPart);
    if (!innerBody || !outerBody) return;

    const { innerTorque, outerTorque } = computeSpringTorque(data, innerBody.state, outerBody.state);
    innerBody.state.appliedTorque += innerTorque;
    outerBody.state.appliedTorque += outerTorque;
  },

  buildTorqueFunction(
    bodyId: string,
    data: SpringConstraintData,
    _active: boolean,
    ctx: SolverContext
  ) {
    if (data.innerPart === bodyId) {
      return createSpringTorqueFunction(
        data,
        () => ctx.bodies.get(data.innerPart)!.state,
        () => ctx.bodies.get(data.outerPart)!.state
      );
    }
    return null;
  },
};
