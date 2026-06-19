import type {
  Part,
  PartState,
  PhysicsConfig,
  PhysicsState,
  Constraint,
  BarrelPart,
  BalancePart,
} from '../types';
import { rk4Integrate, clamp } from '../utils/math';
import type {
  RigidBody,
  SolverConstraint,
  TickEvent,
  TorqueFunction,
} from './types';
import type { SolverContext } from './solvers/types';
import { ConstraintSolverRegistry } from './solvers/registry';
import { gearMeshSolver } from './solvers/gearMeshSolver';
import { coaxialSolver } from './solvers/coaxialSolver';
import { springSolver } from './solvers/springSolver';
import { escapementSolver } from './solvers/escapementSolver';

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  gravity: 9.81,
  airResistance: 0.0001,
  defaultFriction: 0.001,
  subSteps: 4,
};

export class PhysicsEngine {
  private bodies: Map<string, RigidBody> = new Map();
  private solverConstraints: SolverConstraint[] = [];
  private config: PhysicsConfig;
  private tickEvents: TickEvent[] = [];
  private onTickCallback?: (event: TickEvent) => void;
  private previousStates: Map<string, PartState> = new Map();
  private elapsedSimTime: number = 0;
  private solverRegistry: ConstraintSolverRegistry;

  constructor(config: Partial<PhysicsConfig> = {}) {
    this.config = { ...DEFAULT_PHYSICS_CONFIG, ...config };
    this.solverRegistry = new ConstraintSolverRegistry();
    this.solverRegistry.register(gearMeshSolver);
    this.solverRegistry.register(coaxialSolver);
    this.solverRegistry.register(springSolver);
    this.solverRegistry.register(escapementSolver);
  }

  setOnTick(callback: (event: TickEvent) => void): void {
    this.onTickCallback = callback;
  }

  addPart(part: Part): void {
    if (this.bodies.has(part.id)) {
      return;
    }
    const state: PartState = {
      angle: part.rotation,
      angularVelocity: 0,
      angularAcceleration: 0,
      appliedTorque: 0,
      lastTickAngle: 0,
    };
    this.bodies.set(part.id, { id: part.id, part, state });
    this.previousStates.set(part.id, { ...state });
  }

  removePart(partId: string): void {
    this.bodies.delete(partId);
    this.previousStates.delete(partId);
    this.solverConstraints = this.solverConstraints.filter(
      (c) => c.partA !== partId && c.partB !== partId
    );
  }

  addConstraint(constraint: Constraint): void {
    const solverConstraint = this.buildSolverConstraint(constraint);
    if (solverConstraint) {
      this.solverConstraints.push(solverConstraint);
    }
  }

  removeConstraint(constraintId: string): void {
    this.solverConstraints = this.solverConstraints.filter(
      (c) => c.id !== constraintId
    );
  }

  private buildSolverConstraint(constraint: Constraint): SolverConstraint | null {
    const partA = this.bodies.get(constraint.partA)?.part;
    const partB = this.bodies.get(constraint.partB)?.part;
    const data = this.solverRegistry.buildData(constraint, partA, partB);
    if (data === null) return null;
    return { ...constraint, data };
  }

  getPartState(partId: string): PartState | undefined {
    return this.bodies.get(partId)?.state;
  }

  setPartState(partId: string, state: Partial<PartState>): void {
    const body = this.bodies.get(partId);
    if (body) {
      body.state = { ...body.state, ...state };
    }
  }

  setPartAngle(partId: string, angle: number): void {
    const body = this.bodies.get(partId);
    if (body) {
      body.state.angle = angle;
    }
  }

  applyTorque(partId: string, torque: number): void {
    const body = this.bodies.get(partId);
    if (body) {
      body.state.appliedTorque += torque;
    }
  }

  getTickEvents(): TickEvent[] {
    return [...this.tickEvents];
  }

  clearTickEvents(): void {
    this.tickEvents = [];
  }

  getPhysicsState(): PhysicsState {
    const partsState: Record<string, PartState> = {};
    this.bodies.forEach((body, id) => {
      partsState[id] = { ...body.state };
    });

    return {
      running: true,
      timeScale: 1,
      elapsedSimTime: 0,
      elapsedRealTime: 0,
      partsState,
      constraints: this.solverConstraints.map(({ id, type, partA, partB, params, active }) => ({
        id,
        type,
        partA,
        partB,
        params,
        active,
      })),
      tickCount: this.tickEvents.length,
      lastTickTime: 0,
    };
  }

  step(dt: number): void {
    const subDt = dt / this.config.subSteps;

    for (let s = 0; s < this.config.subSteps; s++) {
      this.elapsedSimTime += subDt;
      this.savePreviousStates();

      this.applyBarrelTorques();

      this.solveConstraintsForTorques();

      this.integrateBodies(subDt);

      this.postIntegrateConstraints(subDt);

      this.applyDamping(subDt);

      this.resetAppliedTorques();
    }
  }

  private savePreviousStates(): void {
    this.bodies.forEach((body, id) => {
      this.previousStates.set(id, { ...body.state });
    });
  }

  private applyBarrelTorques(): void {
    this.bodies.forEach((body) => {
      if (body.part.type === 'barrel') {
        const barrel = body.part as BarrelPart;
        const torque = barrel.maxTorque * (barrel.energy > 0 ? 1 : 0);
        body.state.appliedTorque += torque;
      }
    });
  }

  getTotalBarrelTorque(): number {
    let total = 0;
    this.bodies.forEach((body) => {
      if (body.part.type === 'barrel') {
        const barrel = body.part as BarrelPart;
        total += barrel.maxTorque * (barrel.energy > 0 ? 1 : 0);
      }
    });
    return total;
  }

  private buildSolverContext(): SolverContext {
    return {
      bodies: this.bodies,
      previousStates: this.previousStates,
      elapsedSimTime: this.elapsedSimTime,
      getTotalBarrelTorque: () => this.getTotalBarrelTorque(),
      onTick: this.onTickCallback,
      collectTickEvent: (event: TickEvent) => {
        this.tickEvents.push(event);
        if (this.onTickCallback) {
          this.onTickCallback(event);
        }
      },
    };
  }

  private solveConstraintsForTorques(): void {
    const ctx = this.buildSolverContext();
    this.solverRegistry.applyAll(this.solverConstraints, ctx);
  }

  private integrateBodies(dt: number): void {
    this.bodies.forEach((body) => {
      if (body.part.locked || (body.part.type === 'shaft' && (body.part as any).isFixed)) {
        body.state.angularVelocity = 0;
        body.state.angularAcceleration = 0;
        return;
      }

      const torqueFunc = this.buildTorqueFunction(body);
      const inertia = Math.max(body.part.inertia, 0.000001);

      const [newAngle, newVelocity] = rk4Integrate(
        body.state.angle,
        body.state.angularVelocity,
        torqueFunc,
        inertia,
        dt
      );

      const oldVelocity = body.state.angularVelocity;
      body.state.angle = newAngle;
      body.state.angularVelocity = newVelocity;
      body.state.angularAcceleration = (newVelocity - oldVelocity) / dt;
    });
  }

  private buildTorqueFunction(body: RigidBody): TorqueFunction {
    const baseTorque = body.state.appliedTorque;
    const ctx = this.buildSolverContext();
    const constraintFuncs = this.solverRegistry.buildAllTorqueFunctions(
      body.id,
      this.solverConstraints,
      ctx
    );

    return (theta: number, omega: number): number => {
      let total = baseTorque;
      for (const func of constraintFuncs) {
        total += func(theta, omega);
      }
      return total;
    };
  }

  private postIntegrateConstraints(dt: number): void {
    const ctx = this.buildSolverContext();
    this.solverRegistry.postIntegrateAll(this.solverConstraints, dt, ctx);
  }

  private applyDamping(dt: number): void {
    this.bodies.forEach((body) => {
      if (body.part.type === 'shaft') {
        const friction = (body.part as any).friction ?? this.config.defaultFriction;
        body.state.angularVelocity *= Math.max(0, 1 - friction * dt);
      } else {
        const drag = this.config.airResistance;
        const velocity = body.state.angularVelocity;
        const dampingTorque = -drag * velocity * Math.abs(velocity);
        const inertia = Math.max(body.part.inertia, 0.000001);
        body.state.angularVelocity += (dampingTorque / inertia) * dt;
      }

      if (body.part.type === 'balance') {
        const balance = body.part as BalancePart;
        body.state.angularVelocity = clamp(
          body.state.angularVelocity,
          -balance.amplitudeLimit * 10,
          balance.amplitudeLimit * 10
        );
      }
    });
  }

  private resetAppliedTorques(): void {
    this.bodies.forEach((body) => {
      body.state.appliedTorque = 0;
    });
  }

  getConfig(): PhysicsConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<PhysicsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  reset(): void {
    this.bodies.clear();
    this.previousStates.clear();
    this.solverConstraints = [];
    this.tickEvents = [];
    this.elapsedSimTime = 0;
  }
}
