import type { GearPart, Part, Constraint } from '../../types';
import type { ConstraintSolver, SolverContext } from './types';
import type { GearMeshConstraintData } from '../types';
import {
  createGearMeshConstraint,
  computeGearMeshTorques,
  createGearMeshTorqueFunction,
} from '../constraints';

export const gearMeshSolver: ConstraintSolver<GearMeshConstraintData> = {
  constraintType: 'gear_mesh',

  validateAndBuildData(
    partA: Part | undefined,
    partB: Part | undefined,
    _constraint: Constraint
  ): GearMeshConstraintData | null {
    if (!partA || !partB) return null;
    if (partA.type !== 'gear' || partB.type !== 'gear') return null;
    return createGearMeshConstraint(partA as GearPart, partB as GearPart);
  },

  applyTorques(
    data: GearMeshConstraintData,
    _active: boolean,
    ctx: SolverContext
  ): void {
    const bodyA = ctx.bodies.get(data.gearA);
    const bodyB = ctx.bodies.get(data.gearB);
    if (!bodyA || !bodyB) return;

    const { torqueA, torqueB } = computeGearMeshTorques(data, bodyA.state, bodyB.state);
    bodyA.state.appliedTorque += torqueA;
    bodyB.state.appliedTorque += torqueB;
  },

  buildTorqueFunction(
    bodyId: string,
    data: GearMeshConstraintData,
    _active: boolean,
    ctx: SolverContext
  ) {
    if (data.gearA === bodyId) {
      return createGearMeshTorqueFunction(
        data,
        () => ctx.bodies.get(data.gearA)!.state,
        () => ctx.bodies.get(data.gearB)!.state,
        'A'
      );
    } else if (data.gearB === bodyId) {
      return createGearMeshTorqueFunction(
        data,
        () => ctx.bodies.get(data.gearA)!.state,
        () => ctx.bodies.get(data.gearB)!.state,
        'B'
      );
    }
    return null;
  },
};
