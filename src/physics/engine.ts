import type {
  Part,
  PartState,
  PhysicsConfig,
  PhysicsState,
  Constraint,
  GearPart,
  SpringPart,
  EscapementPart,
  BalancePart,
  BarrelPart,
} from '../types';
import { rk4Integrate, clamp } from '../utils/math';
import type {
  RigidBody,
  SolverConstraint,
  TickEvent,
  GearMeshConstraintData,
  CoaxialConstraintData,
  SpringConstraintData,
  EscapementConstraintData,
  TorqueFunction,
} from './types';
import {
  createGearMeshConstraint,
  createCoaxialConstraint,
  computeGearMeshTorques,
  computeCoaxialTorques,
  createGearMeshTorqueFunction,
  createCoaxialTorqueFunction,
} from './constraints';
import {
  createSpringConstraint,
  computeSpringTorque,
  createSpringTorqueFunction,
} from './springs';
import {
  createEscapementConstraint,
  updateEscapement,
  computeEscapementLockingTorque,
} from './escapement';

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

  constructor(config: Partial<PhysicsConfig> = {}) {
    this.config = { ...DEFAULT_PHYSICS_CONFIG, ...config };
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
    const partA = this.bodies.get(constraint.partA);
    const partB = this.bodies.get(constraint.partB);

    switch (constraint.type) {
      case 'gear_mesh': {
        if (!partA || !partB || partA.part.type !== 'gear' || partB.part.type !== 'gear') {
          return null;
        }
        return {
          ...constraint,
          data: createGearMeshConstraint(partA.part as GearPart, partB.part as GearPart),
        };
      }
      case 'coaxial': {
        if (!partA || !partB) return null;
        return {
          ...constraint,
          data: createCoaxialConstraint(constraint.partA, constraint.partB),
        };
      }
      case 'spring_torque': {
        if (!partA || partA.part.type !== 'spring') return null;
        return {
          ...constraint,
          data: createSpringConstraint(partA.part as SpringPart),
        };
      }
      case 'escapement_lock': {
        if (!partA || partA.part.type !== 'escapement') return null;
        return {
          ...constraint,
          data: createEscapementConstraint(partA.part as EscapementPart),
        };
      }
      default:
        return null;
    }
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
      this.savePreviousStates();

      this.applyBarrelTorques();

      this.solveConstraintsForTorques();

      this.integrateBodies(subDt);

      this.processEscapements(subDt);

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

  private solveConstraintsForTorques(): void {
    this.solverConstraints.forEach((constraint) => {
      if (!constraint.active) return;

      switch (constraint.type) {
        case 'gear_mesh': {
          const data = constraint.data as GearMeshConstraintData;
          const bodyA = this.bodies.get(data.gearA);
          const bodyB = this.bodies.get(data.gearB);
          if (!bodyA || !bodyB) break;

          const { torqueA, torqueB } = computeGearMeshTorques(data, bodyA.state, bodyB.state);
          bodyA.state.appliedTorque += torqueA;
          bodyB.state.appliedTorque += torqueB;
          break;
        }
        case 'coaxial': {
          const data = constraint.data as CoaxialConstraintData;
          const bodyA = this.bodies.get(data.partA);
          const bodyB = this.bodies.get(data.partB);
          if (!bodyA || !bodyB) break;

          const { torqueA, torqueB } = computeCoaxialTorques(data, bodyA.state, bodyB.state);
          bodyA.state.appliedTorque += torqueA;
          bodyB.state.appliedTorque += torqueB;
          break;
        }
        case 'spring_torque': {
          const data = constraint.data as SpringConstraintData;
          const innerBody = this.bodies.get(data.innerPart);
          const outerBody = this.bodies.get(data.outerPart);
          if (!innerBody || !outerBody) break;

          const { innerTorque, outerTorque } = computeSpringTorque(data, innerBody.state, outerBody.state);
          innerBody.state.appliedTorque += innerTorque;
          outerBody.state.appliedTorque += outerTorque;
          break;
        }
        case 'escapement_lock': {
          const data = constraint.data as EscapementConstraintData;
          const balanceBody = this.bodies.get(data.balanceId);
          if (!balanceBody) break;

          const lockingTorque = computeEscapementLockingTorque(data, balanceBody.state);
          balanceBody.state.appliedTorque += lockingTorque;
          break;
        }
      }
    });
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
    const selfState = body.state;

    const constraintTorqueFuncs: TorqueFunction[] = [];

    this.solverConstraints.forEach((constraint) => {
      if (!constraint.active) return;

      switch (constraint.type) {
        case 'gear_mesh': {
          const data = constraint.data as GearMeshConstraintData;
          if (data.gearA === body.id) {
            constraintTorqueFuncs.push(
              createGearMeshTorqueFunction(
                data,
                () => this.bodies.get(data.gearA)!.state,
                () => this.bodies.get(data.gearB)!.state,
                'A'
              )
            );
          } else if (data.gearB === body.id) {
            constraintTorqueFuncs.push(
              createGearMeshTorqueFunction(
                data,
                () => this.bodies.get(data.gearA)!.state,
                () => this.bodies.get(data.gearB)!.state,
                'B'
              )
            );
          }
          break;
        }
        case 'coaxial': {
          const data = constraint.data as CoaxialConstraintData;
          if (data.partA === body.id) {
            constraintTorqueFuncs.push(
              createCoaxialTorqueFunction(
                data,
                () => this.bodies.get(data.partA)!.state,
                () => this.bodies.get(data.partB)!.state,
                'A'
              )
            );
          } else if (data.partB === body.id) {
            constraintTorqueFuncs.push(
              createCoaxialTorqueFunction(
                data,
                () => this.bodies.get(data.partA)!.state,
                () => this.bodies.get(data.partB)!.state,
                'B'
              )
            );
          }
          break;
        }
        case 'spring_torque': {
          const data = constraint.data as SpringConstraintData;
          if (data.innerPart === body.id) {
            constraintTorqueFuncs.push(
              createSpringTorqueFunction(
                data,
                () => this.bodies.get(data.innerPart)!.state,
                () => this.bodies.get(data.outerPart)!.state
              )
            );
          }
          break;
        }
      }
    });

    return (theta: number, omega: number): number => {
      let total = baseTorque;
      for (const func of constraintTorqueFuncs) {
        total += func(theta, omega);
      }
      return total;
    };
  }

  private processEscapements(simTime: number): void {
    this.solverConstraints.forEach((constraint) => {
      if (constraint.type !== 'escapement_lock' || !constraint.active) return;

      const data = constraint.data as EscapementConstraintData;
      const escapementBody = this.bodies.get(data.escapementId);
      const balanceBody = this.bodies.get(data.balanceId);
      const wheelBody = this.bodies.get(data.wheelId);

      if (!escapementBody || !balanceBody || !wheelBody) return;
      if (balanceBody.part.type !== 'balance' || wheelBody.part.type !== 'gear') return;

      const previousBalanceState = this.previousStates.get(data.balanceId);
      if (!previousBalanceState) return;

      const result = updateEscapement(
        data,
        balanceBody.part as BalancePart,
        wheelBody.part as GearPart,
        balanceBody.state,
        wheelBody.state,
        previousBalanceState,
        simTime
      );

      constraint.data = result.data;
      balanceBody.state = result.balanceState;
      wheelBody.state = result.wheelState;

      if (result.tickEvent) {
        this.tickEvents.push(result.tickEvent);
        if (this.onTickCallback) {
          this.onTickCallback(result.tickEvent);
        }
      }
    });
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
  }
}
