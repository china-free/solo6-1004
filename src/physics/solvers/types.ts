import type { Part, PartState, Constraint } from '../../types';
import type { RigidBody, TickEvent, TorqueFunction } from '../types';

export interface SolverContext {
  bodies: Map<string, RigidBody>;
  previousStates: Map<string, PartState>;
  elapsedSimTime: number;
  getTotalBarrelTorque: () => number;
  onTick?: (event: TickEvent) => void;
  collectTickEvent: (event: TickEvent) => void;
}

export interface ConstraintSolver<TData = unknown> {
  readonly constraintType: string;

  validateAndBuildData(
    partA: Part | undefined,
    partB: Part | undefined,
    constraint: Constraint
  ): TData | null;

  applyTorques(
    data: TData,
    active: boolean,
    ctx: SolverContext
  ): void;

  buildTorqueFunction(
    bodyId: string,
    data: TData,
    active: boolean,
    ctx: SolverContext
  ): TorqueFunction | null;

  postIntegrate?(
    data: TData,
    active: boolean,
    dt: number,
    ctx: SolverContext
  ): TData | void;
}
