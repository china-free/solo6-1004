import { create } from 'zustand';
import { PhysicsState, OscilloscopeData } from '../types';

interface PhysicsStoreState {
  physicsState: PhysicsState;
  oscilloscopeData: OscilloscopeData;
  setRunning: (running: boolean) => void;
  setTimeScale: (scale: number) => void;
  resetPhysics: () => void;
  updateOscilloscope: (data: Partial<OscilloscopeData>) => void;
}

const defaultPhysicsState: PhysicsState = {
  running: false,
  timeScale: 1,
  elapsedSimTime: 0,
  elapsedRealTime: 0,
  partsState: {},
  constraints: [],
  tickCount: 0,
  lastTickTime: 0,
};

const defaultOscilloscopeData: OscilloscopeData = {
  timeData: [],
  amplitudeData: [],
  velocityData: [],
  currentFrequency: 0,
  targetFrequency: 0,
  dailyRate: 0,
  dailyRateHistory: [],
  amplitudeStability: 0,
  energyReserve: 0,
};

export const usePhysicsStore = create<PhysicsStoreState>((set) => ({
  physicsState: defaultPhysicsState,
  oscilloscopeData: defaultOscilloscopeData,
  setRunning: (running) =>
    set((state) => ({
      physicsState: { ...state.physicsState, running },
    })),
  setTimeScale: (timeScale) =>
    set((state) => ({
      physicsState: { ...state.physicsState, timeScale },
    })),
  resetPhysics: () =>
    set({
      physicsState: defaultPhysicsState,
      oscilloscopeData: defaultOscilloscopeData,
    }),
  updateOscilloscope: (data) =>
    set((state) => ({
      oscilloscopeData: { ...state.oscilloscopeData, ...data },
    })),
}));
