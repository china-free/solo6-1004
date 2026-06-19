import { useRef, useEffect, useState, useCallback } from 'react';
import { renderPart } from './PartRenderer';
import { useDragDrop } from '@/hooks/useDragDrop';
import { usePhysicsLoop } from '@/hooks/usePhysicsLoop';
import { useAudio } from '@/hooks/useAudio';
import { usePartsStore } from '@/store/partsStore';
import { useUIStore } from '@/store/uiStore';
import { usePhysicsStore } from '@/store/physicsStore';
import { PhysicsEngine } from '@/physics/engine';
import { generateEtchingTexture, createRubyGradient } from '@/utils/drawing';
import { snapToGrid, generateId } from '@/utils/math';
import type { Part, PartType } from '@/types';

interface DragPreview {
  type: PartType;
  x: number;
  y: number;
  preset?: Record<string, number | string | boolean>;
}

interface DropTemplate {
  type: PartType;
  name: string;
  description: string;
  preset?: Record<string, number | string | boolean>;
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const physicsEngineRef = useRef<PhysicsEngine | null>(null);
  const etchingTextureRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dragPreviewRef = useRef<DragPreview | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const { parts, addPart, clearAllParts } = usePartsStore();
  const { selectedPartId, showGrid, gridSize, snapToGrid: snapEnabled, connectionSourceId } = useUIStore();
  const { physicsState } = usePhysicsStore();

  const {
    handlePartMouseDown,
    handleCanvasMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleContextMenu,
    isPartDragging,
    dragTargetPartId,
  } = useDragDrop(canvasRef);

  const { playClick } = useAudio();

  usePhysicsLoop(physicsEngineRef.current, false);

  const initPhysicsEngine = useCallback(() => {
    if (!physicsEngineRef.current) {
      physicsEngineRef.current = new PhysicsEngine();
    }
    Object.values(parts).forEach((part) => {
      physicsEngineRef.current?.addPart(part);
    });
  }, [parts]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    etchingTextureRef.current = generateEtchingTexture(
      Math.ceil(rect.width),
      Math.ceil(rect.height)
    );
  }, []);

  const createPartFromTemplate = useCallback(
    (template: DropTemplate, x: number, y: number): Part => {
      const basePart = {
        id: generateId(),
        type: template.type,
        x: snapEnabled ? snapToGrid(x, gridSize) : x,
        y: snapEnabled ? snapToGrid(y, gridSize) : y,
        rotation: 0,
        mass: 0.01,
        inertia: 0.001,
        name: template.name,
        locked: false,
      };

      const preset = template.preset || {};

      switch (template.type) {
        case 'gear':
          return {
            ...basePart,
            type: 'gear',
            teeth: (preset.teeth as number) || 20,
            module: (preset.module as number) || 1.5,
            pitchRadius: ((preset.teeth as number) || 20) * ((preset.module as number) || 1.5) / 2,
            connectedTo: [],
            isEscapementWheel: (preset.isEscapementWheel as boolean) || false,
          };
        case 'spring':
          return {
            ...basePart,
            type: 'spring',
            stiffness: (preset.stiffness as number) || 0.01,
            coils: (preset.coils as number) || 12,
            damping: (preset.damping as number) || 0.001,
            innerAnchor: '',
            outerAnchor: '',
          };
        case 'balance':
          return {
            ...basePart,
            type: 'balance',
            amplitudeLimit: (preset.amplitudeLimit as number) || 1.57,
            radius: (preset.radius as number) || 25,
            hasDiscPin: true,
          };
        case 'escapement':
          return {
            ...basePart,
            type: 'escapement',
            palletAngle: (preset.palletAngle as number) || 0.52,
            lockDepth: (preset.lockDepth as number) || 0.05,
            impulseAngle: (preset.impulseAngle as number) || 0.17,
            connectedWheel: '',
            connectedBalance: '',
            forkLength: 35,
          };
        case 'barrel':
          return {
            ...basePart,
            type: 'barrel',
            energy: (preset.energy as number) || 100,
            maxTorque: (preset.maxTorque as number) || 0.5,
            radius: (preset.radius as number) || 30,
            arborDiameter: 4,
          };
        case 'shaft':
          return {
            ...basePart,
            type: 'shaft',
            radius: (preset.radius as number) || 4,
            friction: (preset.friction as number) || 0.001,
            isFixed: (preset.isFixed as boolean) || false,
          };
        case 'hand':
          return {
            ...basePart,
            type: 'hand',
            handType: (preset.handType as 'hour' | 'minute' | 'second') || 'minute',
            connectedGear: '',
            gearRatio: (preset.gearRatio as number) || 1,
            length: (preset.length as number) || 50,
          };
        case 'plate':
          return {
            ...basePart,
            type: 'plate',
            width: 200,
            height: 150,
          };
        default:
          return basePart as Part;
      }
    },
    [gridSize, snapEnabled]
  );

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (etchingTextureRef.current) {
      ctx.drawImage(etchingTextureRef.current, 0, 0, width, height);
    }
    ctx.save();
    ctx.strokeStyle = 'rgba(90, 60, 15, 0.08)';
    ctx.lineWidth = 0.5;
    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.max(width, height);
    for (let r = 20; r < maxR; r += 20) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }, []);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!showGrid) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(184, 134, 11, 0.15)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(184, 134, 11, 0.3)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += gridSize * 5) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize * 5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  }, [showGrid, gridSize]);

  const drawSelectionHighlight = useCallback((ctx: CanvasRenderingContext2D, part: Part) => {
    const radius = (part as any).radius ?? Math.max(((part as any).width || 0), ((part as any).height || 0)) / 2 ?? 30;
    const glowRadius = radius + 8;
    ctx.save();
    ctx.shadowColor = '#DC143C';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#DC143C';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(part.x, part.y, glowRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#FF6B6B';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(part.x, part.y, glowRadius + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }, []);

  const drawConnectionPoints = useCallback((ctx: CanvasRenderingContext2D, part: Part) => {
    ctx.save();
    const rubyGrad = createRubyGradient(ctx, part.x, part.y, 6);
    ctx.fillStyle = rubyGrad;
    ctx.strokeStyle = '#700818';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(part.x, part.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }, []);

  const drawConnectionGuide = useCallback((ctx: CanvasRenderingContext2D, sourcePart: Part, targetId: string | null) => {
    if (!targetId) return;
    const targetPart = parts[targetId];
    if (!targetPart) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(220, 20, 60, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(sourcePart.x, sourcePart.y);
    ctx.lineTo(targetPart.x, targetPart.y);
    ctx.stroke();
    ctx.setLineDash([]);
    const mx = (sourcePart.x + targetPart.x) / 2;
    const my = (sourcePart.y + targetPart.y) / 2;
    const rubyGrad = createRubyGradient(ctx, mx, my, 10);
    ctx.fillStyle = rubyGrad;
    ctx.beginPath();
    ctx.arc(mx, my, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, [parts]);

  const drawSnapGuides = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    if (!snapEnabled) return;
    const sx = snapToGrid(x, gridSize);
    const sy = snapToGrid(y, gridSize);
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(width, sy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
    ctx.beginPath();
    ctx.arc(sx, sy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, [snapEnabled, gridSize]);

  const drawDragPreview = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const preview = dragPreviewRef.current;
    if (!preview) return;
    const fakePart = createPartFromTemplate(
      { type: preview.type, name: '', description: '', preset: preview.preset },
      preview.x,
      preview.y
    );
    ctx.save();
    ctx.globalAlpha = 0.6;
    renderPart(ctx, fakePart);
    ctx.restore();
    drawSnapGuides(ctx, preview.x, preview.y, width, height);
  }, [createPartFromTemplate, drawSnapGuides]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);
    drawBackground(ctx, width, height);
    drawGrid(ctx, width, height);

    const partsArray = Object.values(parts);
    partsArray.forEach((part) => {
      if (physicsEngineRef.current && !part.locked) {
        const state = physicsEngineRef.current.getPartState(part.id);
        if (state) {
          const renderPartCopy = { ...part, rotation: state.angle };
          renderPart(ctx, renderPartCopy);
        } else {
          renderPart(ctx, part);
        }
      } else {
        renderPart(ctx, part);
      }
      if (selectedPartId === part.id) {
        drawSelectionHighlight(ctx, part);
      }
      drawConnectionPoints(ctx, part);
    });

    if (connectionSourceId && parts[connectionSourceId]) {
      drawConnectionGuide(ctx, parts[connectionSourceId], dragTargetPartId);
    }

    drawDragPreview(ctx, width, height);

    animationFrameRef.current = requestAnimationFrame(render);
  }, [
    parts,
    selectedPartId,
    connectionSourceId,
    dragTargetPartId,
    drawBackground,
    drawGrid,
    drawSelectionHighlight,
    drawConnectionPoints,
    drawConnectionGuide,
    drawDragPreview,
  ]);

  useEffect(() => {
    resizeCanvas();
    initPhysicsEngine();
    window.addEventListener('resize', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [resizeCanvas, initPhysicsEngine]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  useEffect(() => {
    if (!physicsEngineRef.current) return;
    const engine = physicsEngineRef.current;
    engine.reset();
    Object.values(parts).forEach((part) => {
      engine.addPart(part);
    });
  }, [parts, clearAllParts]);

  const getCanvasCoords = useCallback((e: React.DragEvent | React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      const touch = e.touches.length > 0 ? e.touches[0] : (e as any).changedTouches?.[0];
      clientX = touch?.clientX ?? 0;
      clientY = touch?.clientY ?? 0;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent | React.DragEvent).clientX;
      clientY = (e as React.MouseEvent | React.DragEvent).clientY;
    } else {
      return { x: 0, y: 0 };
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
    const coords = getCanvasCoords(e);
    try {
      const template = JSON.parse(e.dataTransfer.getData('application/part-template'));
      dragPreviewRef.current = {
        type: template.type,
        x: coords.x,
        y: coords.y,
        preset: template.preset,
      };
    } catch {
      dragPreviewRef.current = null;
    }
  }, [getCanvasCoords]);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
    dragPreviewRef.current = null;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const coords = getCanvasCoords(e);
    try {
      const templateData = e.dataTransfer.getData('application/part-template');
      if (templateData) {
        const template: DropTemplate = JSON.parse(templateData);
        const newPart = createPartFromTemplate(template, coords.x, coords.y);
        addPart(newPart);
        playClick();
      }
    } catch (err) {
      console.error('Failed to parse drop data:', err);
    }
    dragPreviewRef.current = null;
  }, [getCanvasCoords, createPartFromTemplate, addPart, playClick]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!selectedPartId) return;
    const part = parts[selectedPartId];
    if (!part || part.locked) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.05 : -0.05;
    const { updatePart } = usePartsStore.getState();
    updatePart(selectedPartId, { rotation: part.rotation + delta });
  }, [selectedPartId, parts]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${isDragOver ? 'ring-2 ring-[var(--brass-highlight)]' : ''}`}
      style={{ backgroundColor: '#1a1408' }}
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full cursor-crosshair"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={(e) => {
          handleMouseMove(e);
          const allParts = Object.values(parts);
          for (let i = allParts.length - 1; i >= 0; i--) {
            const part = allParts[i];
            const hitRadius = (part as any).radius ?? 30;
            const coords = getCanvasCoords(e);
            const dx = coords.x - part.x;
            const dy = coords.y - part.y;
            if (dx * dx + dy * dy <= hitRadius * hitRadius) {
              if (e.buttons === 1) {
                handlePartMouseDown(e, part.id);
              }
              break;
            }
          }
        }}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onWheel={handleWheel}
      />
      {isDragOver && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="brass-panel px-6 py-3 font-display text-sm engraved">
            释放以放置零件
          </div>
        </div>
      )}
    </div>
  );
}
