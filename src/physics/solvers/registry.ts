import type { Part, Constraint } from '../../types';
import type { ConstraintSolver, SolverContext } from './types';
import type { SolverConstraint, TorqueFunction, ConstraintData } from '../types';

export class ConstraintSolverRegistry {
  private solvers: Map<string, ConstraintSolver> = new Map();

  register(solver: ConstraintSolver): void {
    this.solvers.set(solver.constraintType, solver);
  }

  get(type: string): ConstraintSolver | undefined {
    return this.solvers.get(type);
  }

  buildData(
    constraint: Constraint,
    partA: Part | undefined,
    partB: Part | undefined
  ): ConstraintData | null {
    const solver = this.solvers.get(constraint.type);
    if (!solver) return null;
    return solver.validateAndBuildData(partA, partB, constraint) as ConstraintData | null;
  }

  applyAll(
    solverConstraints: SolverConstraint[],
    ctx: SolverContext
  ): void {
    solverConstraints.forEach((constraint) => {
      if (!constraint.active) return;
      const solver = this.solvers.get(constraint.type);
      if (!solver) return;
      solver.applyTorques(constraint.data, constraint.active, ctx);
    });
  }

  buildAllTorqueFunctions(
    bodyId: string,
    solverConstraints: SolverConstraint[],
    ctx: SolverContext
  ): TorqueFunction[] {
    const funcs: TorqueFunction[] = [];
    solverConstraints.forEach((constraint) => {
      if (!constraint.active) return;
      const solver = this.solvers.get(constraint.type);
      if (!solver) return;
      const func = solver.buildTorqueFunction(bodyId, constraint.data, constraint.active, ctx);
      if (func) funcs.push(func);
    });
    return funcs;
  }

  postIntegrateAll(
    solverConstraints: SolverConstraint[],
    dt: number,
    ctx: SolverContext
  ): void {
    solverConstraints.forEach((constraint) => {
      if (!constraint.active) return;
      const solver = this.solvers.get(constraint.type);
      if (!solver || !solver.postIntegrate) return;
      const newData = solver.postIntegrate(constraint.data, constraint.active, dt, ctx);
      if (newData !== undefined) {
        constraint.data = newData as any;
      }
    });
  }
}
