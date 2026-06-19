import { useEffect, useRef, useCallback } from 'react';
import { PhysicsEngine } from '../physics/engine';
import { audioEngine } from '../audio/audioEngine';
import { usePhysicsStore } from '../store/physicsStore';
import { usePartsStore } from '../store/partsStore';
import { useLevelStore } from '../store/levelStore';
import type { Part, BalancePart } from '../types';
import { movingAverage, standardDeviation } from '../utils/math';

const TARGET_FREQUENCY = 4;
const SECONDS_PER_DAY = 86400;
const OSCILLOSCOPE_BUFFER_SIZE = 500;

export function usePhysicsLoop(
  physicsEngine: PhysicsEngine | null,
  autoStart: boolean = false
) {
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const tickTimestampsRef = useRef<number[]>([]);
  const stableCycleCountRef = useRef<number>(0);
  const lastAmplitudesRef = useRef<number[]>([]);
  const isRunningRef = useRef<boolean>(false);

  const running = usePhysicsStore((s) => s.physicsState.running);
  const timeScale = usePhysicsStore((s) => s.physicsState.timeScale);
  const updateOscilloscope = usePhysicsStore((s) => s.updateOscilloscope);
  const oscilloscopeData = usePhysicsStore((s) => s.oscilloscopeData);
  const setRunning = usePhysicsStore((s) => s.setRunning);

  const parts = usePartsStore((s) => s.parts);
  const currentLevelId = useLevelStore((s) => s.currentLevelId);
  const levels = useLevelStore((s) => s.levels);
  const completeLevel = useLevelStore((s) => s.completeLevel);

  const currentLevel = levels.find((l) => l.id === currentLevelId);

  const findBalancePart = useCallback((): BalancePart | null => {
    const balance = Object.values(parts).find((p: Part) => p.type === 'balance');
    return balance ? (balance as BalancePart) : null;
  }, [parts]);

  const computeFrequency = useCallback((timestamps: number[]): number => {
    if (timestamps.length < 4) return 0;
    const recent = timestamps.slice(-8);
    let totalPeriod = 0;
    for (let i = 1; i < recent.length; i++) {
      totalPeriod += recent[i] - recent[i - 1];
    }
    const avgPeriod = totalPeriod / (recent.length - 1);
    return avgPeriod > 0 ? 1 / (avgPeriod * 2) : 0;
  }, []);

  const computeDailyRate = useCallback((frequency: number): number => {
    return (frequency - TARGET_FREQUENCY) * SECONDS_PER_DAY;
  }, []);

  const checkLevelComplete = useCallback(
    (frequency: number, dailyRate: number, amplitudeStability: number, currentAmplitude: number) => {
      if (!currentLevel) return;

      const absDailyRate = Math.abs(dailyRate);
      if (absDailyRate <= currentLevel.targetDailyRate &&
          currentAmplitude >= currentLevel.targetAmplitude * 0.8 &&
          currentAmplitude <= currentLevel.targetAmplitude * 1.2 &&
          amplitudeStability < 0.15) {
        stableCycleCountRef.current++;
      } else {
        stableCycleCountRef.current = 0;
      }

      if (stableCycleCountRef.current >= currentLevel.minStableCycles) {
        completeLevel(currentLevel.id, absDailyRate);
        stableCycleCountRef.current = 0;
      }
    },
    [currentLevel, completeLevel]
  );

  const loop = useCallback(
    (timestamp: number) => {
      if (!isRunningRef.current || !physicsEngine) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      const realDt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;
      const dt = realDt * timeScale;

      physicsEngine.step(dt);

      const tickEvents = physicsEngine.getTickEvents();
      if (tickEvents.length > 0) {
        tickEvents.forEach(() => {
          audioEngine.playTick();
          tickTimestampsRef.current.push(timestamp / 1000);
          if (tickTimestampsRef.current.length > 50) {
            tickTimestampsRef.current.shift();
          }
        });
        physicsEngine.clearTickEvents();
      }

      const balancePart = findBalancePart();
      const balanceState = balancePart ? physicsEngine.getPartState(balancePart.id) : null;

      const currentFrequency = computeFrequency(tickTimestampsRef.current);
      const dailyRate = computeDailyRate(currentFrequency);

      const history = oscilloscopeData.dailyRateHistory;
      const newDailyRateHistory = [...history, dailyRate].slice(-100);

      let currentAmplitude = 0;
      let currentVelocity = 0;

      if (balanceState) {
        currentAmplitude = Math.abs(balanceState.angle);
        currentVelocity = balanceState.angularVelocity;
        lastAmplitudesRef.current.push(currentAmplitude);
        if (lastAmplitudesRef.current.length > 100) {
          lastAmplitudesRef.current.shift();
        }
      }

      const amplitudeStability = lastAmplitudesRef.current.length > 10
        ? standardDeviation(lastAmplitudesRef.current) / (movingAverage(lastAmplitudesRef.current, 20) || 1)
        : 0;

      const barrelPart = Object.values(parts).find((p: Part) => p.type === 'barrel');
      const energyReserve = barrelPart ? (barrelPart as any).energy ?? 0 : 0;

      const newTimeData = [...oscilloscopeData.timeData, timestamp / 1000].slice(-OSCILLOSCOPE_BUFFER_SIZE);
      const newAmplitudeData = [...oscilloscopeData.amplitudeData, currentAmplitude].slice(-OSCILLOSCOPE_BUFFER_SIZE);
      const newVelocityData = [...oscilloscopeData.velocityData, currentVelocity].slice(-OSCILLOSCOPE_BUFFER_SIZE);

      updateOscilloscope({
        timeData: newTimeData,
        amplitudeData: newAmplitudeData,
        velocityData: newVelocityData,
        currentFrequency,
        targetFrequency: TARGET_FREQUENCY,
        dailyRate,
        dailyRateHistory: newDailyRateHistory,
        amplitudeStability,
        energyReserve,
      });

      checkLevelComplete(currentFrequency, dailyRate, amplitudeStability, currentAmplitude);

      rafRef.current = requestAnimationFrame(loop);
    },
    [
      physicsEngine,
      timeScale,
      oscilloscopeData,
      findBalancePart,
      computeFrequency,
      computeDailyRate,
      updateOscilloscope,
      checkLevelComplete,
      parts,
    ]
  );

  const start = useCallback(() => {
    if (!physicsEngine) return;
    isRunningRef.current = true;
    setRunning(true);
    lastTimeRef.current = 0;
  }, [physicsEngine, setRunning]);

  const stop = useCallback(() => {
    isRunningRef.current = false;
    setRunning(false);
  }, [setRunning]);

  const reset = useCallback(() => {
    stop();
    tickTimestampsRef.current = [];
    stableCycleCountRef.current = 0;
    lastAmplitudesRef.current = [];
    lastTimeRef.current = 0;
    if (physicsEngine) {
      physicsEngine.reset();
    }
  }, [stop, physicsEngine]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [loop]);

  useEffect(() => {
    if (autoStart && physicsEngine) {
      start();
    }
  }, [autoStart, physicsEngine, start]);

  useEffect(() => {
    if (running) {
      start();
    } else {
      stop();
    }
  }, [running, start, stop]);

  return {
    start,
    stop,
    reset,
    isRunning: running,
  };
}
