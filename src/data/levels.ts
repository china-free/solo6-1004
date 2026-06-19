import type { LevelConfig, PartType, Part } from '../types';
import { generateId } from '../utils/math';

const createPresetBarrel = (x: number, y: number): Part => ({
  id: generateId(),
  type: 'barrel',
  x,
  y,
  rotation: 0,
  mass: 0.02,
  inertia: 0.0005,
  name: '发条盒',
  locked: true,
  energy: 1.0,
  maxTorque: 0.005,
  radius: 25,
  arborDiameter: 4,
});

export const levels: LevelConfig[] = [
  {
    id: 'level-1',
    name: '学徒入门',
    description: '搭建你的第一个简单机芯，掌握基础零件的连接方式，使摆轮稳定振荡。',
    maxParts: 5,
    targetDailyRate: 10,
    targetAmplitude: 1.0,
    minStableCycles: 30,
    availableParts: ['gear', 'spring', 'balance', 'barrel'] as PartType[],
    presetParts: [createPresetBarrel(400, 300)],
    hint: '先放置摆轮和游丝，然后用齿轮连接发条盒提供动力。',
  },
  {
    id: 'level-2',
    name: '精准计时',
    description: '使用全部可用零件，构建更复杂的齿轮传动系统，实现更高的走时精度。',
    maxParts: 8,
    targetDailyRate: 5,
    targetAmplitude: 1.0,
    minStableCycles: 30,
    availableParts: ['gear', 'spring', 'balance', 'escapement', 'barrel', 'shaft', 'hand'] as PartType[],
    hint: '擒纵机构是精准计时的关键，正确调整擒纵叉与摆轮的配合。',
  },
  {
    id: 'level-3',
    name: '机芯大师',
    description: '挑战复杂齿轮系的设计，在有限空间内布局多层传动，追求极致精度。',
    maxParts: 12,
    targetDailyRate: 2,
    targetAmplitude: 1.0,
    minStableCycles: 30,
    availableParts: ['gear', 'spring', 'balance', 'escapement', 'barrel', 'shaft', 'hand'] as PartType[],
    hint: '使用多个齿轮组成减速轮系，注意齿轮模数和齿数的匹配。',
  },
  {
    id: 'level-4',
    name: '陀飞轮挑战',
    description: '终极挑战！在陀飞轮级别的精度要求下，实现近乎完美的日差表现。',
    maxParts: 15,
    targetDailyRate: 1,
    targetAmplitude: 1.0,
    minStableCycles: 30,
    availableParts: ['gear', 'spring', 'balance', 'escapement', 'barrel', 'shaft', 'hand'] as PartType[],
    hint: '平衡摆轮的转动惯量和游丝的刚度是关键参数，反复微调。',
  },
];

export const getLevelById = (id: string): LevelConfig | undefined => {
  return levels.find((level) => level.id === id);
};

export const getFirstLevel = (): LevelConfig => {
  return levels[0];
};
