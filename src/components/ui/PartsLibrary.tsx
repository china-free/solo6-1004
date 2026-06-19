import type { PartType } from '@/types';
import { cn } from '@/lib/utils';

interface PartTemplate {
  type: PartType;
  name: string;
  description: string;
  preset?: Record<string, number | string | boolean>;
}

const partTemplates: PartTemplate[] = [
  { type: 'gear', name: '齿轮 20T', description: '20齿 标准模数', preset: { teeth: 20, module: 1.5 } },
  { type: 'gear', name: '齿轮 40T', description: '40齿 标准模数', preset: { teeth: 40, module: 1.5 } },
  { type: 'gear', name: '齿轮 60T', description: '60齿 标准模数', preset: { teeth: 60, module: 1.5 } },
  { type: 'gear', name: '齿轮 80T', description: '80齿 大传动比', preset: { teeth: 80, module: 1.5 } },
  { type: 'gear', name: '擒纵轮', description: '15齿 擒纵机构专用', preset: { teeth: 15, module: 1.2, isEscapementWheel: true } },
  { type: 'spring', name: '游丝', description: '摆轮振荡驱动', preset: { stiffness: 0.01, coils: 12, damping: 0.001 } },
  { type: 'balance', name: '摆轮', description: '振荡器 核心组件', preset: { inertia: 0.05, amplitudeLimit: 1.57, radius: 25 } },
  { type: 'escapement', name: '擒纵叉', description: '控制能量释放', preset: { palletAngle: 0.52, lockDepth: 0.05, impulseAngle: 0.17 } },
  { type: 'barrel', name: '发条盒', description: '储能 动力来源', preset: { energy: 100, maxTorque: 0.5, radius: 30 } },
  { type: 'shaft', name: '传动轴', description: '旋转轴 支承零件', preset: { radius: 4, friction: 0.001, isFixed: false } },
  { type: 'hand', name: '时针', description: '时钟显示', preset: { handType: 'hour', length: 40, gearRatio: 1 / 12 } },
  { type: 'hand', name: '分针', description: '分钟显示', preset: { handType: 'minute', length: 55, gearRatio: 1 } },
  { type: 'hand', name: '秒针', description: '秒钟显示', preset: { handType: 'second', length: 60, gearRatio: 60 } },
];

function PartIcon({ type }: { type: PartType }) {
  return (
    <canvas
      ref={(el) => {
        if (!el) return;
        const ctx = el.getContext('2d');
        if (!ctx) return;
        const size = 36;
        const cx = size / 2;
        const cy = size / 2;
        ctx.clearRect(0, 0, size, size);
        const grad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, size / 2);
        grad.addColorStop(0, '#f5d580');
        grad.addColorStop(0.5, '#c49335');
        grad.addColorStop(1, '#5a4510');
        ctx.fillStyle = grad;
        ctx.strokeStyle = '#5a4510';
        ctx.lineWidth = 1;

        switch (type) {
          case 'gear': {
            const teeth = 16;
            const r = size / 2 - 4;
            const outerR = r + 2;
            const rootR = r - 2;
            ctx.beginPath();
            for (let i = 0; i < teeth; i++) {
              const a = (i / teeth) * Math.PI * 2;
              const half = Math.PI / teeth;
              ctx.lineTo(cx + Math.cos(a - half) * rootR, cy + Math.sin(a - half) * rootR);
              ctx.lineTo(cx + Math.cos(a - half * 0.4) * outerR, cy + Math.sin(a - half * 0.4) * outerR);
              ctx.lineTo(cx + Math.cos(a + half * 0.4) * outerR, cy + Math.sin(a + half * 0.4) * outerR);
              ctx.lineTo(cx + Math.cos(a + half) * rootR, cy + Math.sin(a + half) * rootR);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#2a1f08';
            ctx.fill();
            break;
          }
          case 'spring': {
            ctx.strokeStyle = '#4682B4';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let i = 0; i <= 180; i++) {
              const t = i / 180;
              const a = t * 6 * Math.PI;
              const r = 3 + (size / 2 - 5) * t;
              const px = cx + Math.cos(a) * r;
              const py = cy + Math.sin(a) * r;
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.stroke();
            break;
          }
          case 'balance': {
            const r = size / 2 - 4;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.75, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(90, 69, 16, 0.7)';
            ctx.stroke();
            for (let i = 0; i < 4; i++) {
              const a = (i / 4) * Math.PI * 2;
              ctx.beginPath();
              ctx.moveTo(cx + Math.cos(a) * 3, cy + Math.sin(a) * 3);
              ctx.lineTo(cx + Math.cos(a) * r * 0.75, cy + Math.sin(a) * r * 0.75);
              ctx.strokeStyle = 'rgba(90, 69, 16, 0.8)';
              ctx.lineWidth = 2;
              ctx.stroke();
            }
            break;
          }
          case 'escapement': {
            ctx.fillRect(cx - 4, cy - 10, 8, 20);
            ctx.strokeRect(cx - 4, cy - 10, 8, 20);
            ctx.fillRect(cx - 12, cy - 14, 24, 6);
            ctx.strokeRect(cx - 12, cy - 14, 24, 6);
            ctx.beginPath();
            ctx.arc(cx - 14, cy - 11, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#DC143C';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + 14, cy - 11, 3, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
          case 'barrel': {
            const r = size / 2 - 3;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(90, 69, 16, 0.6)';
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#2a1f08';
            ctx.fill();
            break;
          }
          case 'shaft': {
            const r = size / 2 - 6;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(90, 69, 16, 0.4)';
            ctx.fill();
            break;
          }
          case 'hand': {
            ctx.fillStyle = '#2a2010';
            ctx.beginPath();
            ctx.moveTo(cx, cy - 13);
            ctx.lineTo(cx - 2, cy + 3);
            ctx.lineTo(cx, cy + 5);
            ctx.lineTo(cx + 2, cy + 3);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx, cy, 3, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
          case 'plate': {
            ctx.fillRect(cx - 14, cy - 10, 28, 20);
            ctx.strokeRect(cx - 14, cy - 10, 28, 20);
            break;
          }
        }
      }}
      width={36}
      height={36}
      style={{ display: 'block' }}
    />
  );
}

export default function PartsLibrary() {
  const handleDragStart = (e: React.DragEvent, template: PartTemplate) => {
    e.dataTransfer.setData('application/part-template', JSON.stringify(template));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="etch-panel flex flex-col h-full w-[200px] scrollbar-brass overflow-y-auto">
      <div className="brass-panel px-3 py-2">
        <h2 className="font-display text-sm engraved text-center font-bold">零件库</h2>
      </div>
      <div className="flex flex-col gap-1 p-2">
        {partTemplates.map((template, idx) => (
          <div
            key={idx}
            draggable
            onDragStart={(e) => handleDragStart(e, template)}
            className={cn(
              'flex items-center gap-2 p-2 rounded cursor-grab',
              'bg-[var(--etch-light)] border border-[var(--brass-shadow)]',
              'hover:bg-[var(--etch-medium)] hover:border-[var(--brass-light)]',
              'active:cursor-grabbing transition-all'
            )}
          >
            <PartIcon type={template.type} />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-[var(--brass-light)] engraved truncate">
                {template.name}
              </span>
              <span className="text-[9px] text-[var(--brass)] opacity-70 truncate">
                {template.description}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
