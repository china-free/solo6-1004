import { useEffect, useCallback, useRef } from 'react';
import { audioEngine } from '../audio/audioEngine';
import { useUIStore } from '../store/uiStore';

export function useAudio() {
  const initializedRef = useRef<boolean>(false);

  const audioEnabled = useUIStore((s) => s.audioEnabled);
  const volume = useUIStore((s) => s.volume);
  const setVolume = useUIStore((s) => s.setVolume);
  const toggleAudio = useUIStore((s) => s.toggleAudio);

  const init = useCallback(async () => {
    if (initializedRef.current) return;
    try {
      await audioEngine.init();
      initializedRef.current = true;
    } catch (e) {
      console.warn('Audio engine initialization failed:', e);
    }
  }, []);

  const playClick = useCallback(() => {
    if (!initializedRef.current) {
      init().then(() => audioEngine.playClick());
      return;
    }
    audioEngine.playClick();
  }, [init]);

  const playTick = useCallback(() => {
    if (!initializedRef.current) return;
    audioEngine.playTick();
  }, []);

  const playError = useCallback(() => {
    if (!initializedRef.current) {
      init().then(() => audioEngine.playError());
      return;
    }
    audioEngine.playError();
  }, [init]);

  useEffect(() => {
    audioEngine.setEnabled(audioEnabled);
  }, [audioEnabled]);

  useEffect(() => {
    audioEngine.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!initializedRef.current) {
        init();
      }
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [init]);

  return {
    init,
    playClick,
    playTick,
    playError,
    audioEnabled,
    volume,
    setVolume,
    toggleAudio,
    isInitialized: initializedRef.current,
  };
}
