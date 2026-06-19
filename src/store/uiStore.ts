import { create } from 'zustand';
import { UIState, DragMode } from '../types';

interface UIStoreState extends UIState {
  selectPart: (id: string | null) => void;
  setDragMode: (mode: DragMode) => void;
  setConnectionSource: (id: string | null) => void;
  toggleAudio: () => void;
  setVolume: (vol: number) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
}

const defaultUIState: UIState = {
  selectedPartId: null,
  hoveredPartId: null,
  dragMode: 'none',
  connectionSourceId: null,
  showGrid: true,
  snapToGrid: true,
  gridSize: 10,
  showDebugInfo: false,
  audioEnabled: false,
  volume: 0.5,
};

export const useUIStore = create<UIStoreState>((set) => ({
  ...defaultUIState,
  selectPart: (selectedPartId) => set({ selectedPartId }),
  setDragMode: (dragMode) => set({ dragMode }),
  setConnectionSource: (connectionSourceId) => set({ connectionSourceId }),
  toggleAudio: () =>
    set((state) => ({ audioEnabled: !state.audioEnabled })),
  setVolume: (volume) => set({ volume }),
  toggleGrid: () =>
    set((state) => ({ showGrid: !state.showGrid })),
  toggleSnap: () =>
    set((state) => ({ snapToGrid: !state.snapToGrid })),
}));
