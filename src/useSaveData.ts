import { useState, useEffect, useCallback } from 'react';
import type { SaveData, RunRecord, GameStats } from './types';
import { ACHIEVEMENTS, STORAGE_KEY } from './constants';

function createInitialSave(): SaveData {
  const achievements: SaveData['achievements'] = {};
  for (const a of ACHIEVEMENTS) {
    achievements[a.id] = { id: a.id, unlocked: false, unlockedAt: null, progress: 0 };
  }
  return {
    profile: null,
    runs: [],
    achievements,
    stats: {
      totalXP: 0,
      totalRuns: 0,
      totalOrbs: 0,
      totalJumps: 0,
      bestXP: 0,
      bestLevel: 1,
      longestRun: 0,
      maxSpeedReached: 0,
    },
    level: 1,
    currentXP: 0,
  };
}

function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialSave();
    const parsed = JSON.parse(raw) as SaveData;
    const base = createInitialSave();
    return {
      ...base,
      ...parsed,
      achievements: { ...base.achievements, ...parsed.achievements },
      stats: { ...base.stats, ...parsed.stats },
    };
  } catch {
    return createInitialSave();
  }
}

function persistSave(data: SaveData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable
  }
}

export function useSaveData() {
  const [save, setSave] = useState<SaveData>(() => loadSave());

  useEffect(() => {
    persistSave(save);
  }, [save]);

  const setProfile = useCallback((profile: SaveData['profile']) => {
    setSave(prev => ({ ...prev, profile }));
  }, []);

  const recordRun = useCallback((run: RunRecord) => {
    setSave(prev => {
      const stats: GameStats = {
        totalXP: prev.stats.totalXP + run.xp,
        totalRuns: prev.stats.totalRuns + 1,
        totalOrbs: prev.stats.totalOrbs + run.orbsCollected,
        totalJumps: prev.stats.totalJumps + run.jumps,
        bestXP: Math.max(prev.stats.bestXP, run.xp),
        bestLevel: Math.max(prev.stats.bestLevel, run.level),
        longestRun: Math.max(prev.stats.longestRun, run.duration),
        maxSpeedReached: prev.stats.maxSpeedReached,
      };

      const newLevel = prev.level + 1 > prev.level ? prev.level : prev.level;
      const achievements = { ...prev.achievements };

      for (const def of ACHIEVEMENTS) {
        const current = achievements[def.id];
        if (current.unlocked) continue;
        const value = stats[def.metric];
        const progress = Math.min(value / def.target, 1);
        if (value >= def.target) {
          achievements[def.id] = { ...current, unlocked: true, unlockedAt: Date.now(), progress: 1 };
        } else {
          achievements[def.id] = { ...current, progress };
        }
      }

      void newLevel;

      return {
        ...prev,
        runs: [...prev.runs, run].slice(-50),
        stats,
        achievements,
      };
    });
  }, []);

  const resetProgress = useCallback(() => {
    setSave(prev => ({
      ...createInitialSave(),
      profile: prev.profile,
    }));
  }, []);

  return { save, setProfile, recordRun, resetProgress };
}
