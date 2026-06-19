import { useNavigate } from 'react-router-dom';
import { Check, Lock } from 'lucide-react';
import BrassButton from '@/components/ui/BrassButton';
import { useLevelStore } from '@/store/levelStore';
import { useAudio } from '@/hooks/useAudio';
import { levels } from '@/data/levels';
import { useEffect } from 'react';

export default function LevelSelectPage() {
  const navigate = useNavigate();
  const { playClick } = useAudio();
  const { levelProgress, isLevelUnlocked, setCurrentLevel, levels: storeLevels } = useLevelStore();

  useEffect(() => {
    if (storeLevels.length === 0) {
      useLevelStore.setState({ levels });
    }
  }, [storeLevels.length]);

  const handleLevelClick = (levelId: string) => {
    if (!isLevelUnlocked(levelId)) return;
    playClick();
    setCurrentLevel(levelId);
    navigate(`/game/${levelId}`);
  };

  const dialPositions = [
    { angle: -Math.PI / 2, x: 0, y: -140 },
    { angle: 0, x: 140, y: 0 },
    { angle: Math.PI / 2, x: 0, y: 140 },
    { angle: Math.PI, x: -140, y: 0 },
  ];

  const renderDial = (levelId: string, index: number) => {
    const level = levels[index];
    if (!level) return null;
    const progress = levelProgress[levelId];
    const unlocked = isLevelUnlocked(levelId);
    const completed = progress?.completed ?? false;
    const pos = dialPositions[index];

    return (
      <div
        key={levelId}
        className="absolute"
        style={{
          left: `calc(50% + ${pos.x}px)`,
          top: `calc(50% + ${pos.y}px)`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <button
          onClick={() => handleLevelClick(levelId)}
          disabled={!unlocked}
          className={`relative w-[180px] h-[180px] rounded-full transition-all duration-300 ${
            unlocked ? 'hover:scale-105 cursor-pointer' : 'cursor-not-allowed opacity-60'
          }`}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: unlocked
                ? `conic-gradient(from ${(pos.angle + Math.PI / 2) * (180 / Math.PI)}deg, #8B6914 0deg, #DAA520 60deg, #FFD700 120deg, #DAA520 240deg, #5C4A1F 300deg, #8B6914 360deg)`
                : 'linear-gradient(145deg, #3d3d3d, #2a2a2a, #1c1c1c)',
              boxShadow: unlocked
                ? '0 4px 20px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,215,0,0.3), inset 0 -2px 4px rgba(0,0,0,0.4)'
                : '0 4px 20px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.1), inset 0 -2px 4px rgba(0,0,0,0.4)',
            }}
          />
          <div
            className="absolute inset-3 rounded-full flex flex-col items-center justify-center"
            style={{
              background: unlocked
                ? 'radial-gradient(ellipse at 30% 20%, rgba(255,215,0,0.15) 0%, transparent 50%), linear-gradient(145deg, #1a1408, #261e10, #1a1408)'
                : 'linear-gradient(145deg, #1c1c1c, #2a2a2a)',
              border: unlocked ? '2px solid #5C4A1F' : '2px solid #3d3d3d',
            }}
          >
            <div className="flex items-center justify-center w-8 h-8 mb-2">
              {!unlocked ? (
                <Lock size={24} className="text-[var(--etch-light)]" />
              ) : completed ? (
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'radial-gradient(circle at 35% 30%, var(--ruby-light), var(--ruby) 50%, var(--ruby-dark))', boxShadow: '0 0 10px rgba(220,20,60,0.5)' }}>
                  <Check size={16} className="text-white" />
                </div>
              ) : (
                <div className="rivet-ruby w-6 h-6 rounded-full" />
              )}
            </div>
            <span
              className={`font-display text-sm font-bold text-center px-2 ${
                unlocked ? 'brass-text' : 'text-[var(--etch-light)] opacity-50'
              }`}
            >
              {level.name}
            </span>
            <div className="mt-2 flex flex-col items-center gap-0.5">
              <span className={`text-[10px] font-mono-clock ${unlocked ? 'text-[var(--brass)]' : 'text-[var(--etch-light)] opacity-40'}`}>
                零件上限: {level.maxParts}
              </span>
              <span className={`text-[10px] font-mono-clock ${unlocked ? 'text-[var(--brass)]' : 'text-[var(--etch-light)] opacity-40'}`}>
                目标日差: ±{level.targetDailyRate}s
              </span>
              {completed && progress && (
                <span className="text-[10px] font-mono-clock text-[var(--osc-green)]">
                  最佳: {progress.bestDailyRate.toFixed(1)}s
                </span>
              )}
            </div>
          </div>
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              boxShadow: unlocked
                ? 'inset 0 0 30px rgba(184, 134, 11, 0.15)'
                : 'inset 0 0 30px rgba(0, 0, 0, 0.3)',
            }}
          />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-8" style={{ background: 'radial-gradient(ellipse at center, #261e10 0%, #1a1408 50%, #0d0a05 100%)' }}>
      <div className="relative">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <h1 className="font-display text-4xl font-bold brass-text tracking-widest">
            HOROLOGIUM
          </h1>
          <p className="font-display text-sm text-[var(--brass)] opacity-70 mt-1 tracking-[0.3em]">
            钟表匠学徒
          </p>
        </div>

        <div className="relative w-[520px] h-[520px]">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, #8B6914 0deg, #5C4A1F 45deg, #DAA520 90deg, #8B6914 135deg, #5C4A1F 180deg, #8B6914 225deg, #FFD700 270deg, #8B6914 315deg, #5C4A1F 360deg)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.8), inset 0 4px 8px rgba(255,215,0,0.2), inset 0 -4px 8px rgba(0,0,0,0.5)',
            }}
          />
          <div
            className="absolute inset-4 rounded-full"
            style={{
              background: 'radial-gradient(ellipse at 30% 20%, rgba(47,79,79,0.2) 0%, transparent 50%), linear-gradient(135deg, #1c1c1c 0%, #2a2a2a 50%, #1c1c1c 100%)',
              boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.7), 0 0 0 2px #5C4A1F',
            }}
          />

          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
            const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
            const r = 235;
            const x = 260 + Math.cos(angle) * r;
            const y = 260 + Math.sin(angle) * r;
            const isMain = i % 3 === 0;
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  left: x,
                  top: y,
                  transform: `translate(-50%, -50%) rotate(${angle + Math.PI / 2}rad)`,
                  width: isMain ? '3px' : '2px',
                  height: isMain ? '20px' : '12px',
                  background: 'linear-gradient(180deg, #DAA520, #8B6914)',
                  borderRadius: '1px',
                }}
              />
            );
          })}

          {[0, 3, 6, 9].map((i) => {
            const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
            const r = 200;
            const x = 260 + Math.cos(angle) * r;
            const y = 260 + Math.sin(angle) * r;
            return (
              <span
                key={i}
                className="absolute font-display text-xl font-bold brass-text"
                style={{
                  left: x,
                  top: y,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {i === 0 ? 'XII' : i === 3 ? 'III' : i === 6 ? 'VI' : 'IX'}
              </span>
            );
          })}

          {levels.map((level, idx) => renderDial(level.id, idx))}

          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full"
            style={{
              background: 'radial-gradient(circle at 35% 30%, var(--brass-highlight), var(--brass) 40%, var(--brass-shadow) 100%)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.4)',
            }}
          >
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
              style={{
                background: 'radial-gradient(circle at 35% 30%, var(--ruby-light), var(--ruby) 50%, var(--ruby-dark))',
                boxShadow: '0 0 8px rgba(220,20,60,0.5)',
              }}
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="font-display text-xs text-[var(--brass)] opacity-60 text-center max-w-md">
            选择关卡开始你的钟表匠之旅。每个关卡需要你构建一个稳定的机械钟机芯，达到目标日差精度。
          </p>
          <div className="flex gap-4">
            <BrassButton onClick={() => handleLevelClick(levels[0].id)} disabled={!isLevelUnlocked(levels[0].id)}>
              开始游戏
            </BrassButton>
          </div>
        </div>
      </div>
    </div>
  );
}
