import { ACHIEVEMENTS } from '@/constants';
import type { SaveData } from '@/types';
import { ArrowLeft, Lock, Flag, Medal, Sparkles, Gem, Star, Trophy, TrendingUp, Rocket, Shield, Footprints, type LucideIcon } from 'lucide-react';

interface Props {
  save: SaveData;
  onBack: () => void;
}

export default function AchievementsScreen({ save, onBack }: Props) {
  const achievements = ACHIEVEMENTS.map(def => {
    const progress = save.achievements[def.id];
    return {
      ...def,
      unlocked: progress?.unlocked ?? false,
      unlockedAt: progress?.unlockedAt,
      progress: progress?.progress ?? 0,
      current: save.stats[def.metric],
    };
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const overallPct = (unlockedCount / totalCount) * 100;

  return (
    <div className="min-h-screen bg-forestdark-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-pinkneon-900/20 to-transparent" />

      <div className="relative z-10 min-h-screen flex flex-col px-6 py-8 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="font-display font-black text-xl text-white tracking-wide">CONQUISTAS</h1>
        </div>

        {/* Progress summary */}
        <div className="glass-pink rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-display font-bold text-2xl">{unlockedCount}<span className="text-white/40 text-base">/{totalCount}</span></span>
            <span className="text-cyanneon-300 font-medium text-sm">{Math.round(overallPct)}% completo</span>
          </div>
          <div className="h-3 bg-forestdark-900/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pinkneon-500 to-cyanneon-400 rounded-full transition-all duration-500"
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>

        {/* Achievement list */}
        <div className="space-y-3 flex-1">
          {achievements.map(ach => {
            const iconMap: Record<string, LucideIcon> = { Flag, Medal, Sparkles, Gem, Star, Trophy, TrendingUp, Rocket, Shield, Footprints };
    const Icon = iconMap[ach.icon] ?? Lock;
            const pct = Math.round(ach.progress * 100);

            return (
              <div
                key={ach.id}
                className={`rounded-2xl p-4 transition-all ${
                  ach.unlocked
                    ? 'glass-pink border-pinkneon-500/30 box-glow-pink'
                    : 'glass border-white/5'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    ach.unlocked
                      ? 'bg-gradient-to-br from-pinkneon-500/30 to-cyanneon-400/30 border border-pinkneon-400/40'
                      : 'bg-forestdark-800/60 border border-white/5'
                  }`}>
                    {ach.unlocked ? (
                      <Icon className="w-6 h-6 text-pinkneon-400" />
                    ) : (
                      <Lock className="w-5 h-5 text-white/30" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className={`font-display font-bold text-sm ${ach.unlocked ? 'text-white' : 'text-white/50'}`}>
                        {ach.name}
                      </h3>
                      {ach.unlocked && (
                        <span className="text-xs text-pinkneon-400 font-semibold shrink-0">DESBLOQUEADA</span>
                      )}
                    </div>
                    <p className={`text-xs mb-2 ${ach.unlocked ? 'text-white/60' : 'text-white/40'}`}>
                      {ach.description}
                    </p>
                    {!ach.unlocked && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-white/40">{ach.current} / {ach.target}</span>
                          <span className="text-xs text-cyanneon-300/60">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-forestdark-900/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-pinkneon-500 to-cyanneon-400 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
