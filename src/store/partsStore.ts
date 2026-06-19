import { create } from 'zustand';
import { Part } from '../types';

interface PartsState {
  parts: Record<string, Part>;
  addPart: (part: Part) => void;
  removePart: (id: string) => void;
  updatePart: (id: string, updates: Partial<Part>) => void;
  clearAllParts: () => void;
  duplicatePart: (id: string) => void;
}

const generateId = (): string => {
  return `part_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

export const usePartsStore = create<PartsState>((set) => ({
  parts: {},
  addPart: (part) =>
    set((state) => ({
      parts: { ...state.parts, [part.id]: part },
    })),
  removePart: (id) =>
    set((state) => {
      const newParts = { ...state.parts };
      delete newParts[id];
      return { parts: newParts };
    }),
  updatePart: (id, updates) =>
    set((state) => ({
      parts: {
        ...state.parts,
        [id]: { ...state.parts[id], ...updates } as Part,
      },
    })),
  clearAllParts: () => set({ parts: {} }),
  duplicatePart: (id) =>
    set((state) => {
      const original = state.parts[id];
      if (!original) return state;
      const newId = generateId();
      const duplicated = { ...original, id: newId, name: `${original.name} (副本)` };
      return {
        parts: { ...state.parts, [newId]: duplicated },
      };
    }),
}));
