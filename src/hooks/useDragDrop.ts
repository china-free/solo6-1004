import { useRef, useCallback, useEffect } from 'react';
import { usePartsStore } from '../store/partsStore';
import { useUIStore } from '../store/uiStore';
import type { Part, Constraint } from '../types';
import { snapToGrid, generateId, dist, angleBetween, shortestAngleDelta } from '../utils/math';

interface DragState {
  isDragging: boolean;
  partId: string | null;
  mode: 'move' | 'rotate' | 'connect' | null;
  startX: number;
  startY: number;
  startPartX: number;
  startPartY: number;
  startRotation: number;
  lastX: number;
  lastY: number;
}

const initialDragState: DragState = {
  isDragging: false,
  partId: null,
  mode: null,
  startX: 0,
  startY: 0,
  startPartX: 0,
  startPartY: 0,
  startRotation: 0,
  lastX: 0,
  lastY: 0,
};

interface UseDragDropReturn {
  handlePartMouseDown: (e: React.MouseEvent | React.TouchEvent, partId: string) => void;
  handleCanvasMouseDown: (e: React.MouseEvent | React.TouchEvent) => void;
  handleMouseMove: (e: React.MouseEvent | React.TouchEvent) => void;
  handleMouseUp: (e: React.MouseEvent | React.TouchEvent) => void;
  handleContextMenu: (e: React.MouseEvent) => void;
  isPartDragging: (partId: string) => boolean;
  currentDragMode: 'move' | 'rotate' | 'connect' | null;
  dragTargetPartId: string | null;
}

export function useDragDrop(
  canvasRef: React.RefObject<HTMLCanvasElement | null>
): UseDragDropReturn {
  const dragStateRef = useRef<DragState>({ ...initialDragState });
  const connectTargetRef = useRef<string | null>(null);

  const parts = usePartsStore((s) => s.parts);
  const updatePart = usePartsStore((s) => s.updatePart);
  const addPart = usePartsStore((s) => s.addPart);

  const dragMode = useUIStore((s) => s.dragMode);
  const snapToGridEnabled = useUIStore((s) => s.snapToGrid);
  const gridSize = useUIStore((s) => s.gridSize);
  const setDragMode = useUIStore((s) => s.setDragMode);
  const selectPart = useUIStore((s) => s.selectPart);
  const connectionSourceId = useUIStore((s) => s.connectionSourceId);
  const setConnectionSource = useUIStore((s) => s.setConnectionSource);

  const getCanvasCoords = useCallback(
    (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ('touches' in e) {
        const touch = e.touches.length > 0 ? e.touches[0] : (e as any).changedTouches?.[0];
        clientX = touch?.clientX ?? 0;
        clientY = touch?.clientY ?? 0;
      } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
      }

      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    },
    [canvasRef]
  );

  const findPartAtPoint = useCallback(
    (x: number, y: number, excludeId?: string): Part | null => {
      const allParts = Object.values(parts);
      for (let i = allParts.length - 1; i >= 0; i--) {
        const part = allParts[i];
        if (excludeId && part.id === excludeId) continue;
        const hitRadius = (part as any).radius ?? 30;
        const distance = dist(x, y, part.x, part.y);
        if (distance <= hitRadius) {
          return part;
        }
      }
      return null;
    },
    [parts]
  );

  const createConstraint = useCallback(
    (partAId: string, partBId: string): Constraint | null => {
      const partA = parts[partAId];
      const partB = parts[partBId];
      if (!partA || !partB) return null;

      let type: Constraint['type'] | null = null;
      let params: Record<string, number> = {};

      if (partA.type === 'gear' && partB.type === 'gear') {
        type = 'gear_mesh';
        params = {
          teethA: (partA as any).teeth,
          teethB: (partB as any).teeth,
        };
      } else if (partA.type === 'spring' || partB.type === 'spring') {
        type = 'spring_torque';
        params = {};
      } else if (
        (partA.type === 'escapement' && (partB.type === 'gear' || partB.type === 'balance')) ||
        (partB.type === 'escapement' && (partA.type === 'gear' || partA.type === 'balance'))
      ) {
        type = 'escapement_lock';
        params = {};
      } else {
        type = 'coaxial';
        params = {};
      }

      if (!type) return null;

      return {
        id: generateId(),
        type,
        partA: partAId,
        partB: partBId,
        params,
        active: true,
      };
    },
    [parts]
  );

  const handlePartMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent, partId: string) => {
      e.stopPropagation();

      const part = parts[partId];
      if (!part || part.locked) return;

      const coords = getCanvasCoords(e);
      selectPart(partId);

      let mode: DragState['mode'] = 'move';

      const isRightClick = 'button' in e && (e as React.MouseEvent).button === 2;
      const isAltDrag = 'altKey' in e && (e as React.MouseEvent).altKey;

      if (isRightClick || isAltDrag) {
        mode = 'rotate';
      } else if (dragMode === 'connect' || connectionSourceId) {
        mode = 'connect';
      }

      dragStateRef.current = {
        isDragging: true,
        partId,
        mode,
        startX: coords.x,
        startY: coords.y,
        startPartX: part.x,
        startPartY: part.y,
        startRotation: part.rotation,
        lastX: coords.x,
        lastY: coords.y,
      };

      if (mode === 'connect' && !connectionSourceId) {
        setConnectionSource(partId);
      }

      setDragMode(mode ?? 'none');
    },
    [parts, getCanvasCoords, selectPart, dragMode, connectionSourceId, setConnectionSource, setDragMode]
  );

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const coords = getCanvasCoords(e);
      selectPart(null);
      setConnectionSource(null);
      connectTargetRef.current = null;

      if (dragMode !== 'connect') {
        setDragMode('none');
      }
    },
    [getCanvasCoords, selectPart, setConnectionSource, dragMode, setDragMode]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const { isDragging, partId, mode, startX, startY, startPartX, startPartY, startRotation } =
        dragStateRef.current;

      if (!isDragging || !partId) return;

      const coords = getCanvasCoords(e);
      const part = parts[partId];
      if (!part) return;

      if (mode === 'move') {
        let newX = startPartX + (coords.x - startX);
        let newY = startPartY + (coords.y - startY);

        if (snapToGridEnabled) {
          newX = snapToGrid(newX, gridSize);
          newY = snapToGrid(newY, gridSize);
        }

        updatePart(partId, { x: newX, y: newY });
      } else if (mode === 'rotate') {
        const startAngle = angleBetween(startPartX, startPartY, startX, startY);
        const currentAngle = angleBetween(startPartX, startPartY, coords.x, coords.y);
        let newRotation = startRotation + shortestAngleDelta(startAngle, currentAngle);

        if (snapToGridEnabled) {
          const snapAngle = (Math.PI / 12);
          newRotation = Math.round(newRotation / snapAngle) * snapAngle;
        }

        updatePart(partId, { rotation: newRotation });
      } else if (mode === 'connect') {
        const hoveredPart = findPartAtPoint(coords.x, coords.y, partId);
        connectTargetRef.current = hoveredPart?.id ?? null;
      }

      dragStateRef.current.lastX = coords.x;
      dragStateRef.current.lastY = coords.y;
    },
    [getCanvasCoords, parts, snapToGridEnabled, gridSize, updatePart, findPartAtPoint]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const { isDragging, partId, mode } = dragStateRef.current;

      if (isDragging && mode === 'connect' && partId) {
        const coords = getCanvasCoords(e);
        const targetPart = findPartAtPoint(coords.x, coords.y, partId);

        if (targetPart && connectionSourceId) {
          const constraint = createConstraint(connectionSourceId, targetPart.id);
          if (constraint) {
            console.log('Created constraint:', constraint);
          }
        } else if (targetPart && !connectionSourceId) {
          const constraint = createConstraint(partId, targetPart.id);
          if (constraint) {
            console.log('Created constraint:', constraint);
          }
        }

        setConnectionSource(null);
        connectTargetRef.current = null;
      }

      dragStateRef.current = { ...initialDragState };
      if (dragMode !== 'connect') {
        setDragMode('none');
      }
    },
    [getCanvasCoords, findPartAtPoint, connectionSourceId, createConstraint, setConnectionSource, dragMode, setDragMode]
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const isPartDragging = useCallback(
    (partId: string): boolean => {
      return dragStateRef.current.isDragging && dragStateRef.current.partId === partId;
    },
    []
  );

  const currentDragMode = dragStateRef.current.mode;
  const dragTargetPartId = connectTargetRef.current;

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragStateRef.current.isDragging) {
        dragStateRef.current = { ...initialDragState };
        setConnectionSource(null);
        connectTargetRef.current = null;
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [setConnectionSource]);

  return {
    handlePartMouseDown,
    handleCanvasMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleContextMenu,
    isPartDragging,
    currentDragMode,
    dragTargetPartId,
  };
}
