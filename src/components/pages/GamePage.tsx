import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import GameCanvas from '@/components/canvas/GameCanvas';
import Oscilloscope from '@/components/canvas/Oscilloscope';
import StatusBar from '@/components/ui/StatusBar';
import PartsLibrary from '@/components/ui/PartsLibrary';
import ParamTuner from '@/components/ui/ParamTuner';
import BrassButton from '@/components/ui/BrassButton';
import { useLevelStore } from '@/store/levelStore';
import { usePartsStore } from '@/store/partsStore';
import { usePhysicsStore } from '@/store/physicsStore';
import { getLevelById, levels } from '@/data/levels';
import { useAudio } from '@/hooks/useAudio';

export default function GamePage() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const { playClick } = useAudio();
  const [paramTunerCollapsed, setParamTunerCollapsed] = useState(false);

  const { setCurrentLevel, levels: storeLevels } = useLevelStore();
  const { clearAllParts, addPart } = usePartsStore();
  const { resetPhysics } = usePhysicsStore();

  useEffect(() => {
    if (storeLevels.length === 0) {
      useLevelStore.setState({ levels });
    }
  }, [storeLevels.length]);

  useEffect(() => {
    if (!levelId) return;
    setCurrentLevel(levelId);
    const level = getLevelById(levelId);
    clearAllParts();
    resetPhysics();
    if (level?.presetParts) {
      level.presetParts.forEach((part) => {
        addPart({ ...part });
      });
    }
  }, [levelId, setCurrentLevel, clearAllParts, resetPhysics, addPart]);

  const handleBack = () => {
    playClick();
    navigate('/');
  };

  const level = levelId ? getLevelById(levelId) : null;

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, #261e10 0%, #1a1408 50%, #0d0a05 100%)',
      }}
    >
      <div className="flex items-center gap-2 p-2 pb-0">
        <BrassButton variant="icon" onClick={handleBack}>
          <Home size={18} />
        </BrassButton>
        <div className="flex-1">
          <StatusBar />
        </div>
      </div>

      <div className="flex-1 flex gap-2 p-2 pt-2 min-h-0">
        <div className="flex flex-col gap-2 w-[380px]">
          <div className="flex justify-center">
            <Oscilloscope />
          </div>
          {level && (
            <div className="etch-panel p-3">
              <div className="brass-panel px-3 py-2 mb-2">
                <h3 className="font-display text-sm engraved text-center font-bold">关卡提示</h3>
              </div>
              <p className="text-xs text-[var(--brass-light)] opacity-80 leading-relaxed engraved-dark">
                {level.hint}
              </p>
              <div className="mt-3 pt-2 border-t border-[var(--brass-shadow)]">
                <p className="text-[10px] text-[var(--brass)] opacity-60 font-display">
                  {level.description}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 brass-panel p-1 min-h-0">
            <GameCanvas />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex-1 min-h-0">
            <PartsLibrary />
          </div>
          <div className="flex gap-1 items-stretch" style={{ height: paramTunerCollapsed ? 'auto' : '320px' }}>
            <button
              onClick={() => {
                playClick();
                setParamTunerCollapsed(!paramTunerCollapsed);
              }}
              className="brass-button px-1 py-1 flex items-center justify-center"
              style={{ writingMode: 'vertical-rl' }}
            >
              {paramTunerCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
            {!paramTunerCollapsed && (
              <ParamTuner />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
