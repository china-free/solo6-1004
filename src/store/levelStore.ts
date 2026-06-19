import { create } from 'zustand';
import { LevelConfig, LevelProgress } from '../types';

interface LevelStoreState {
  currentLevelId: string;
  levelProgress: Record<string, LevelProgress>;
  levels: LevelConfig[];
  setCurrentLevel: (id: string) => void;
  completeLevel: (id: string, dailyRate: number) => void;
  isLevelUnlocked: (id: string) => boolean;
}

export const useLevelStore = create<LevelStoreState>((set, get) => ({
  currentLevelId: '',
  levelProgress: {},
  levels: [],
  setCurrentLevel: (currentLevelId) => set({ currentLevelId }),
  completeLevel: (id, dailyRate) =>
    set((state) => {
      const existing = state.levelProgress[id];
      const newProgress: LevelProgress = {
        levelId: id,
        completed: true,
        bestDailyRate: existing ? Math.min(existing.bestDailyRate, dailyRate) : dailyRate,
        unlocked: true,
      };
      const levels = state.levels;
      const currentIndex = levels.findIndex((l) => l.id === id);
      const newLevelProgress = { ...state.levelProgress, [id]: newProgress };
      if (currentIndex >= 0 && currentIndex < levels.length - 1) {
        const nextLevel = levels[currentIndex + 1];
        if (!newLevelProgress[nextLevel.id]) {
          newLevelProgress[nextLevel.id] = {
            levelId: nextLevel.id,
            completed: false,
            bestDailyRate: 0,
            unlocked: true,
          };
        }
      }
      return { levelProgress: newLevelProgress };
    }),
  isLevelUnlocked: (id) => {
    const state = get();
    const progress = state.levelProgress[id];
    if (progress) return progress.unlocked;
    const levels = state.levels;
    if (levels.length === 0) return true;
    return levels[0]?.id === id;
  },
}));
