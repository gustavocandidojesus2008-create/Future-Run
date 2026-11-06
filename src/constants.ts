import type { AvatarId } from './types';

export const AVATARS: { id: AvatarId; name: string; color: string; glow: string }[] = [
  { id: 'robo-pink', name: 'Robô Rosa', color: '#ff2d9c', glow: 'rgba(255,45,156,0.6)' },
  { id: 'robo-cyan', name: 'Robô Ciano', color: '#00c8ff', glow: 'rgba(0,200,255,0.6)' },
  { id: 'robo-gold', name: 'Robô Dourado', color: '#ffd700', glow: 'rgba(255,215,0,0.6)' },
  { id: 'robo-violet', name: 'Robô Violeta', color: '#b366ff', glow: 'rgba(179,102,255,0.6)' },
  { id: 'robo-lime', name: 'Robô Lima', color: '#aaff00', glow: 'rgba(170,255,0,0.6)' },
];

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  target: number;
  metric: 'totalRuns' | 'totalOrbs' | 'bestXP' | 'bestLevel' | 'longestRun' | 'totalJumps' | 'maxSpeedReached';
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-run', name: 'Primeira Exploração', description: 'Complete sua primeira corrida', icon: 'Flag', target: 1, metric: 'totalRuns' },
  { id: 'ten-runs', name: 'Explorador Dedicado', description: 'Complete 10 corridas', icon: 'Medal', target: 10, metric: 'totalRuns' },
  { id: 'orbs-100', name: 'Coletor de XP', description: 'Colete 100 orbes de XP no total', icon: 'Sparkles', target: 100, metric: 'totalOrbs' },
  { id: 'orbs-500', name: 'Colecionador Mestre', description: 'Colete 500 orbes de XP no total', icon: 'Gem', target: 500, metric: 'totalOrbs' },
  { id: 'score-1000', name: 'Mil XP', description: 'Faça 1000 XP em uma corrida', icon: 'Star', target: 1000, metric: 'bestXP' },
  { id: 'score-5000', name: 'Lenda da Floresta', description: 'Faça 5000 XP em uma corrida', icon: 'Trophy', target: 5000, metric: 'bestXP' },
  { id: 'level-5', name: 'Nível 5', description: 'Alcance o nível 5', icon: 'TrendingUp', target: 5, metric: 'bestLevel' },
  { id: 'level-10', name: 'Nível 10', description: 'Alcance o nível 10', icon: 'Rocket', target: 10, metric: 'bestLevel' },
  { id: 'survivor', name: 'Sobrevivente', description: 'Sobreviva 60 segundos em uma corrida', icon: 'Shield', target: 60, metric: 'longestRun' },
  { id: 'jumps-200', name: 'Mestre dos Pulos', description: 'Pule 200 vezes no total', icon: 'Footprints', target: 200, metric: 'totalJumps' },
];

export const COVER_IMAGE = 'https://images.pexels.com/photos/33292126/pexels-photo-33292126.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

export const STORAGE_KEY = 'future-run-save';

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.4));
}

export function levelFromXP(totalXP: number): number {
  let level = 1;
  while (totalXP >= xpForLevel(level + 1)) {
    level++;
  }
  return level;
}
