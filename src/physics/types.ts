import type { Part, PartState, Constraint, PhysicsConfig } from '../types';

export interface RigidBody {
  id: string;
  part: Part;
  state: PartState;
}

export interface GearMeshConstraintData {
  gearA: string;
  gearB: string;
  teethA: number;
  teethB: number;
  kp: number;
  kd: number;
}

export interface CoaxialConstraintData {
  partA: string;
  partB: string;
  kp: number;
  kd: number;
}

export interface SpringConstraintData {
  springId: string;
  innerPart: string;
  outerPart: string;
  stiffness: number;
  damping: number;
}

export interface EscapementState {
  palletLocked: boolean;
  lockedSide: 'entry' | 'exit' | null;
  lastReleaseAngle: number;
  tickPending: boolean;
  tockPending: boolean;
}

export interface EscapementConstraintData {
  escapementId: string;
  wheelId: string;
  balanceId: string;
  palletAngle: number;
  lockDepth: number;
  impulseAngle: number;
  state: EscapementState;
}

export type ConstraintData =
  | GearMeshConstraintData
  | CoaxialConstraintData
  | SpringConstraintData
  | EscapementConstraintData;

export interface SolverConstraint extends Constraint {
  data: ConstraintData;
}

export interface TickEvent {
  type: 'tick' | 'tock';
  time: number;
  balanceId: string;
  angle: number;
  energyImparted: number;
}

export interface PhysicsEngineInternals {
  bodies: Map<string, RigidBody>;
  solverConstraints: SolverConstraint[];
  config: PhysicsConfig;
  tickEvents: TickEvent[];
  onTick?: (event: TickEvent) => void;
}

export interface Derivative {
  dTheta: number;
  dOmega: number;
}

export type TorqueFunction = (theta: number, omega: number) => number;
