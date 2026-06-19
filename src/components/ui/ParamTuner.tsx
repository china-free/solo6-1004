import type { Part } from '@/types';
import { useUIStore } from '@/store/uiStore';
import { usePartsStore } from '@/store/partsStore';

interface ParamConfig {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

const gearParams: ParamConfig[] = [
  { key: 'teeth', label: '齿数', min: 6, max: 200, step: 1 },
  { key: 'module', label: '模数', min: 0.5, max: 5, step: 0.1, unit: 'mm' },
  { key: 'inertia', label: '转动惯量', min: 0.001, max: 1, step: 0.001, unit: 'kg·m²' },
];

const springParams: ParamConfig[] = [
  { key: 'stiffness', label: '刚度', min: 0.001, max: 0.1, step: 0.001, unit: 'N·m/rad' },
  { key: 'coils', label: '圈数', min: 3, max: 30, step: 1 },
  { key: 'damping', label: '阻尼', min: 0.0001, max: 0.01, step: 0.0001 },
];

const balanceParams: ParamConfig[] = [
  { key: 'inertia', label: '转动惯量', min: 0.001, max: 0.5, step: 0.001, unit: 'kg·m²' },
  { key: 'amplitudeLimit', label: '摆幅极限', min: 0.5, max: 3.14, step: 0.01, unit: 'rad' },
];

const escapementParams: ParamConfig[] = [
  { key: 'palletAngle', label: '叉瓦角度', min: 0.1, max: 1.57, step: 0.01, unit: 'rad' },
  { key: 'lockDepth', label: '锁面深度', min: 0.01, max: 0.2, step: 0.01, unit: 'mm' },
  { key: 'impulseAngle', label: '冲面角度', min: 0.05, max: 0.5, step: 0.01, unit: 'rad' },
];

const barrelParams: ParamConfig[] = [
  { key: 'energy', label: '初始能量', min: 0, max: 200, step: 1, unit: 'J' },
  { key: 'maxTorque', label: '最大力矩', min: 0.01, max: 2, step: 0.01, unit: 'N·m' },
];

function getParamsForType(type: Part['type']): ParamConfig[] {
  switch (type) {
    case 'gear':
      return gearParams;
    case 'spring':
      return springParams;
    case 'balance':
      return balanceParams;
    case 'escapement':
      return escapementParams;
    case 'barrel':
      return barrelParams;
    default:
      return [];
  }
}

interface ParamSliderProps {
  config: ParamConfig;
  value: number;
  onChange: (value: number) => void;
}

function ParamSlider({ config, value, onChange }: ParamSliderProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-semibold text-[var(--brass-light)] engraved">
          {config.label}
        </span>
        <span className="text-[11px] font-mono-clock text-[var(--brass-highlight)]">
          {value.toFixed(config.step < 0.01 ? 4 : config.step < 1 ? 2 : 0)}
          {config.unit && <span className="opacity-70 ml-1">{config.unit}</span>}
        </span>
      </div>
      <input
        type="range"
        min={config.min}
        max={config.max}
        step={config.step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="slider-brass w-full"
      />
    </div>
  );
}

export default function ParamTuner() {
  const { selectedPartId } = useUIStore();
  const { parts, updatePart } = usePartsStore();

  const selectedPart = selectedPartId ? parts[selectedPartId] : null;

  if (!selectedPart) {
    return (
      <div className="etch-panel flex flex-col h-full w-[260px]">
        <div className="brass-panel px-3 py-2">
          <h2 className="font-display text-sm engraved text-center font-bold">参数调校</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-[var(--brass)] opacity-60 text-center font-display">
            选择零件以调校参数
          </p>
        </div>
      </div>
    );
  }

  const params = getParamsForType(selectedPart.type);

  const handleChange = (key: string, value: number) => {
    updatePart(selectedPart.id, { [key]: value } as Partial<Part>);
  };

  return (
    <div className="etch-panel flex flex-col h-full w-[260px] scrollbar-brass overflow-y-auto">
      <div className="brass-panel px-3 py-2">
        <h2 className="font-display text-sm engraved text-center font-bold">参数调校</h2>
      </div>
      <div className="p-3">
        <div className="mb-3 pb-2 border-b border-[var(--brass-shadow)]">
          <p className="text-xs font-semibold text-[var(--brass-highlight)] engraved">
            {selectedPart.name}
          </p>
          <p className="text-[10px] text-[var(--brass)] opacity-70">
            ID: {selectedPart.id.slice(-8)}
          </p>
        </div>
        {params.length === 0 ? (
          <p className="text-xs text-[var(--brass)] opacity-60 text-center py-4 font-display">
            此零件无可调参数
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {params.map((config) => {
              const value = (selectedPart as unknown as Record<string, number>)[config.key] ?? 0;
              return (
                <ParamSlider
                  key={config.key}
                  config={config}
                  value={value}
                  onChange={(v) => handleChange(config.key, v)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
