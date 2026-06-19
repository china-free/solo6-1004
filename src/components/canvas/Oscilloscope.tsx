import { useEffect, useRef } from 'react';
import { usePhysicsStore } from '@/store/physicsStore';

const WIDTH = 360;
const HEIGHT = 240;

export default function Oscilloscope() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { oscilloscopeData } = usePhysicsStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0A1A0A';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.strokeStyle = '#0F2F0F';
    ctx.lineWidth = 1;
    const gridX = 60;
    const gridY = 40;
    for (let x = 0; x <= WIDTH; x += gridX) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= HEIGHT; y += gridY) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y);
      ctx.stroke();
    }

    const { amplitudeData, dailyRate, dailyRateHistory, amplitudeStability, energyReserve } = oscilloscopeData;

    ctx.fillStyle = '#39FF14';
    ctx.font = 'bold 16px CourierPrime, monospace';
    ctx.shadowColor = '#39FF14';
    ctx.shadowBlur = 10;
    ctx.fillText(`${dailyRate >= 0 ? '+' : ''}${dailyRate.toFixed(1)} 秒/天`, 10, 24);
    ctx.shadowBlur = 0;

    const waveAreaTop = 35;
    const waveAreaHeight = 100;
    const waveAreaBottom = waveAreaTop + waveAreaHeight;

    if (amplitudeData.length > 1) {
      ctx.strokeStyle = '#39FF14';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#39FF14';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      const step = WIDTH / Math.max(amplitudeData.length - 1, 1);
      for (let i = 0; i < amplitudeData.length; i++) {
        const x = i * step;
        const norm = (amplitudeData[i] + Math.PI) / (2 * Math.PI);
        const y = waveAreaTop + (1 - norm) * waveAreaHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    const historyAreaTop = waveAreaBottom + 10;
    const historyAreaHeight = 50;
    const historyAreaBottom = historyAreaTop + historyAreaHeight;

    ctx.strokeStyle = 'rgba(57, 255, 20, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, historyAreaTop + historyAreaHeight / 2);
    ctx.lineTo(WIDTH, historyAreaTop + historyAreaHeight / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    if (dailyRateHistory.length > 1) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      const step = WIDTH / Math.max(dailyRateHistory.length - 1, 1);
      const maxRate = 30;
      for (let i = 0; i < dailyRateHistory.length; i++) {
        const x = i * step;
        const norm = (dailyRateHistory[i] + maxRate) / (2 * maxRate);
        const y = historyAreaTop + (1 - Math.max(0, Math.min(1, norm))) * historyAreaHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    const barAreaTop = historyAreaBottom + 8;
    const barHeight = 12;
    const barWidth = WIDTH - 20;
    const barX = 10;

    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(barX, barAreaTop, barWidth, barHeight);
    ctx.strokeStyle = '#39FF14';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barAreaTop, barWidth, barHeight);

    const energyFill = Math.max(0, Math.min(1, energyReserve)) * barWidth;
    const energyGrad = ctx.createLinearGradient(barX, barAreaTop, barX + energyFill, barAreaTop);
    energyGrad.addColorStop(0, '#FF4444');
    energyGrad.addColorStop(0.3, '#FFAA00');
    energyGrad.addColorStop(0.7, '#88FF44');
    energyGrad.addColorStop(1, '#39FF14');
    ctx.fillStyle = energyGrad;
    ctx.fillRect(barX + 1, barAreaTop + 1, energyFill - 2, barHeight - 2);

    ctx.fillStyle = '#39FF14';
    ctx.font = '10px CourierPrime, monospace';
    ctx.fillText(`能量 ${(energyReserve * 100).toFixed(0)}%`, barX + 4, barAreaTop + 9);

    const stabilityX = WIDTH - 80;
    ctx.fillStyle = '#39FF14';
    ctx.font = '10px CourierPrime, monospace';
    ctx.fillText('稳定性', stabilityX, barAreaTop + 9);

    const stabBarX = stabilityX + 42;
    const stabBarWidth = 30;
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(stabBarX, barAreaTop + 2, stabBarWidth, barHeight - 4);
    ctx.strokeStyle = '#39FF14';
    ctx.lineWidth = 1;
    ctx.strokeRect(stabBarX, barAreaTop + 2, stabBarWidth, barHeight - 4);

    const stabFill = Math.max(0, Math.min(1, amplitudeStability)) * stabBarWidth;
    ctx.fillStyle = amplitudeStability > 0.8 ? '#39FF14' : amplitudeStability > 0.5 ? '#FFAA00' : '#FF4444';
    ctx.fillRect(stabBarX + 1, barAreaTop + 3, stabFill - 2, barHeight - 6);
  }, [oscilloscopeData]);

  return (
    <div className="osc-panel" style={{ width: WIDTH, height: HEIGHT }}>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{ display: 'block' }}
      />
    </div>
  );
}
