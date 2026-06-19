import { Play, Pause, RotateCcw } from 'lucide-react';
import BrassButton from './BrassButton';
import { cn } from '@/lib/utils';
import { usePhysicsStore } from '@/store/physicsStore';
import { usePartsStore } from '@/store/partsStore';
import { useLevelStore } from '@/store/levelStore';

export default function StatusBar() {
  const { physicsState, setRunning, resetPhysics } = usePhysicsStore();
  const { parts } = usePartsStore();
  const { currentLevelId, levels } = useLevelStore();
  const { dailyRate } = usePhysicsStore((state) => state.oscilloscopeData);

  const currentLevel = levels.find((l) => l.id === currentLevelId);
  const partsCount = Object.keys(parts).length;
  const maxParts = currentLevel?.maxParts ?? 99;
  const targetDailyRate = currentLevel?.targetDailyRate ?? 0;
  const isDailyRateOk = Math.abs(dailyRate - targetDailyRate) <= 5;

  return (
    <div className="brass-panel flex items-center gap-4 px-4 py-2 h-14">
      <div className="flex gap-2">
        <BrassButton variant="icon" onClick={() => setRunning(!physicsState.running)} active={physicsState.running}>
          {physicsState.running ? <Pause size={18} /> : <Play size={18} />}
        </BrassButton>
        <BrassButton variant="icon" onClick={resetPhysics}>
          <RotateCcw size={18} />
        </BrassButton>
      </div>

      <div className="w-px h-8 bg-[var(--brass-shadow)]" />

      <div className="flex flex-col">
        <span className="text-[10px] text-[var(--etch-dark)] opacity-60 font-display">关卡</span>
        <span className="text-sm font-semibold engraved">{currentLevel?.name ?? '未选择'}</span>
      </div>

      <div className="w-px h-8 bg-[var(--brass-shadow)]" />

      <div className="flex flex-col">
        <span className="text-[10px] text-[var(--etch-dark)] opacity-60 font-display">零件</span>
        <span className={cn(
          'text-sm font-semibold engraved font-mono-clock',
          partsCount > maxParts && 'text-[var(--ruby)]'
        )}>
          {partsCount} / {maxParts}
        </span>
      </div>

      <div className="w-px h-8 bg-[var(--brass-shadow)]" />

      <div className="flex flex-col">
        <span className="text-[10px] text-[var(--etch-dark)] opacity-60 font-display">日差</span>
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-sm font-semibold font-mono-clock',
            isDailyRateOk ? 'text-[var(--osc-green)] glow-pulse' : 'text-[var(--ruby)] danger-glow',
            'px-2 py-0.5 rounded'
          )}>
            {dailyRate >= 0 ? '+' : ''}{dailyRate.toFixed(1)} 秒/天
          </span>
          {isDailyRateOk ? (
            <span className="text-xs text-[var(--osc-green)]">达标</span>
          ) : (
            <span className="text-xs text-[var(--ruby)]">不达标</span>
          )}
        </div>
      </div>

      <div className="flex-1" />

      <div className="rivet" />
    </div>
  );
}
