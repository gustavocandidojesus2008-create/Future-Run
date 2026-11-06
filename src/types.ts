export type AvatarId = 'robo-pink' | 'robo-cyan' | 'robo-gold' | 'robo-violet' | 'robo-lime';

export interface PlayerProfile {
  name: string;
  nickname: string;
  avatar: AvatarId;
  createdAt: number;
}

export interface RunRecord {
  id: string;
  xp: number;
  level: number;
  duration: number;
  orbsCollected: number;
  jumps: number;
  date: number;
}

export interface AchievementProgress {
  id: string;
  unlocked: boolean;
  unlockedAt: number | null;
  progress: number;
}

export interface GameStats {
  totalXP: number;
  totalRuns: number;
  totalOrbs: number;
  totalJumps: number;
  bestXP: number;
  bestLevel: number;
  longestRun: number;
  maxSpeedReached: number;
}

export interface SaveData {
  profile: PlayerProfile | null;
  runs: RunRecord[];
  achievements: Record<string, AchievementProgress>;
  stats: GameStats;
  level: number;
  currentXP: number;
}

export type ScreenName = 'home' | 'profile' | 'play' | 'achievements' | 'ranking';

export interface GameCallbacks {
  onScoreUpdate: (xp: number, level: number) => void;
  onGameOver: (result: RunResult) => void;
  onLevelUp: (level: number) => void;
  onAchievementProgress: (id: string, progress: number) => void;
}

export interface RunResult {
  xp: number;
  level: number;
  duration: number;
  orbsCollected: number;
  jumps: number;
  maxSpeed: number;
}
