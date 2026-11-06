import { useState, useMemo } from 'react';
import type { SaveData } from '@/types';
import { AVATARS } from '@/constants';
import RobotAvatar from '@/components/RobotAvatar';
import { ArrowLeft, Trophy, Medal, Clock, Zap, Crown } from 'lucide-react';

interface Props {
  save: SaveData;
  onBack: () => void;
}

interface RankEntry {
  rank: number;
  name: string;
  nickname: string;
  avatar: import('@/types').AvatarId;
  xp: number;
  level: number;
  duration: number;
  date: number;
  isPlayer: boolean;
}

// Bot players for the leaderboard
const BOT_PLAYERS = [
  { name: 'Nova Spark', nickname: 'nova', avatar: 'robo-cyan' as const, baseXP: 8500 },
  { name: 'Pixel Dash', nickname: 'pixel', avatar: 'robo-gold' as const, baseXP: 6200 },
  { name: 'Cyber Bolt', nickname: 'bolt', avatar: 'robo-violet' as const, baseXP: 4800 },
  { name: 'Quantum Leap', nickname: 'quantum', avatar: 'robo-lime' as const, baseXP: 3200 },
  { name: 'Echo Runner', nickname: 'echo', avatar: 'robo-pink' as const, baseXP: 1800 },
  { name: 'Neon Glide', nickname: 'neon', avatar: 'robo-cyan' as const, baseXP: 950 },
  { name: 'Vortex Runner', nickname: 'vortex', avatar: 'robo-gold' as const, baseXP: 500 },
  { name: 'Luna Flash', nickname: 'luna', avatar: 'robo-violet' as const, baseXP: 300 },
];

export default function RankingScreen({ save, onBack }: Props) {
  const [sortBy, setSortBy] = useState<'xp' | 'duration'>('xp');

  const ranking = useMemo(() => {
    const playerBestRun = save.runs.length > 0
      ? save.runs.reduce((best, r) => (r.xp > best.xp ? r : best), save.runs[0])
      : null;

    const entries: RankEntry[] = [];

    // Bot entries with slight randomization based on date seed
    const daySeed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    for (let i = 0; i < BOT_PLAYERS.length; i++) {
      const bot = BOT_PLAYERS[i];
      const seedOffset = ((daySeed * (i + 1)) % 200) - 100;
      const xp = bot.baseXP + seedOffset;
      entries.push({
        rank: 0,
        name: bot.name,
        nickname: bot.nickname,
        avatar: bot.avatar,
        xp,
        level: Math.floor(Math.sqrt(xp / 100)) + 1,
        duration: Math.floor(xp / 50) + 10,
        date: Date.now() - (i + 1) * 86400000,
        isPlayer: false,
      });
    }

    // Player entry
    if (save.profile && playerBestRun) {
      entries.push({
        rank: 0,
        name: save.profile.name,
        nickname: save.profile.nickname,
        avatar: save.profile.avatar,
        xp: playerBestRun.xp,
        level: playerBestRun.level,
        duration: playerBestRun.duration,
        date: playerBestRun.date,
        isPlayer: true,
      });
    }

    // Sort
    entries.sort((a, b) => {
      if (sortBy === 'xp') return b.xp - a.xp;
      return b.duration - a.duration;
    });

    entries.forEach((e, i) => { e.rank = i + 1; });

    return entries;
  }, [save, sortBy]);

  const playerRank = ranking.find(e => e.isPlayer)?.rank ?? null;

  return (
    <div className="min-h-screen bg-forestdark-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-cyanneon-900/20 to-transparent" />

      <div className="relative z-10 min-h-screen flex flex-col px-6 py-8 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="font-display font-black text-xl text-white tracking-wide">RANKING</h1>
        </div>

        {/* Sort tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSortBy('xp')}
            className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${
              sortBy === 'xp'
                ? 'bg-pinkneon-500/20 border border-pinkneon-400/40 text-pinkneon-300'
                : 'glass text-white/50 border border-white/5'
            }`}
          >
            Maior XP
          </button>
          <button
            onClick={() => setSortBy('duration')}
            className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${
              sortBy === 'duration'
                ? 'bg-cyanneon-500/20 border border-cyanneon-400/40 text-cyanneon-300'
                : 'glass text-white/50 border border-white/5'
            }`}
          >
            Mais Tempo
          </button>
        </div>

        {/* Player's rank highlight */}
        {playerRank !== null && (
          <div className="glass-pink rounded-xl p-3 mb-4 flex items-center gap-3 box-glow-pink">
            <div className="w-10 h-10 rounded-lg bg-pinkneon-500/20 border border-pinkneon-400/40 flex items-center justify-center">
              <span className="font-display font-bold text-pinkneon-400">#{playerRank}</span>
            </div>
            <div>
              <p className="text-white font-medium text-sm">Sua posição no ranking</p>
              <p className="text-cyanneon-300/70 text-xs">Continue jogando para subir!</p>
            </div>
          </div>
        )}

        {/* Podium - top 3 */}
        {ranking.length >= 3 && (
          <div className="flex items-end justify-center gap-2 mb-6">
            {/* 2nd place */}
            <PodiumCard entry={ranking[1]} height={100} medalColor="silver" />
            {/* 1st place */}
            <PodiumCard entry={ranking[0]} height={130} medalColor="gold" />
            {/* 3rd place */}
            <PodiumCard entry={ranking[2]} height={80} medalColor="bronze" />
          </div>
        )}

        {/* Full ranking list */}
        <div className="space-y-2 flex-1">
          {ranking.map(entry => (
            <div
              key={`${entry.name}-${entry.rank}`}
              className={`rounded-xl p-3 flex items-center gap-3 transition-all ${
                entry.isPlayer
                  ? 'glass-pink border-pinkneon-500/30'
                  : entry.rank <= 3
                    ? 'glass border-white/10'
                    : 'glass border-white/5'
              }`}
            >
              {/* Rank number */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                entry.rank === 1 ? 'bg-yellow-500/20 border border-yellow-500/40' :
                entry.rank === 2 ? 'bg-gray-400/20 border border-gray-400/40' :
                entry.rank === 3 ? 'bg-orange-700/20 border border-orange-700/40' :
                'bg-forestdark-800/60'
              }`}>
                <span className={`font-display font-bold text-sm ${
                  entry.rank === 1 ? 'text-yellow-400' :
                  entry.rank === 2 ? 'text-gray-300' :
                  entry.rank === 3 ? 'text-orange-500' :
                  'text-white/50'
                }`}>
                  {entry.rank}
                </span>
              </div>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-lg bg-forestdark-700/60 border border-white/10 flex items-center justify-center shrink-0">
                <RobotAvatar id={entry.avatar} size={32} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium text-sm truncate">{entry.name}</p>
                  {entry.isPlayer && <span className="text-xs text-pinkneon-400 font-bold shrink-0">VOCÊ</span>}
                </div>
                <p className="text-white/40 text-xs truncate">"{entry.nickname}"</p>
              </div>

              {/* Score */}
              <div className="text-right shrink-0">
                <p className="font-display font-bold text-white text-sm">
                  {sortBy === 'xp' ? `${entry.xp.toLocaleString()} XP` : `${entry.duration}s`}
                </p>
                <p className="text-white/40 text-xs">Nv {entry.level}</p>
              </div>
            </div>
          ))}
        </div>

        {!save.profile && (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">Crie um perfil e jogue para entrar no ranking!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PodiumCard({ entry, height, medalColor }: { entry: RankEntry; height: number; medalColor: 'gold' | 'silver' | 'bronze' }) {
  const colors = {
    gold: { bg: 'from-yellow-500/20 to-yellow-700/10', border: 'border-yellow-500/40', icon: 'text-yellow-400' },
    silver: { bg: 'from-gray-400/20 to-gray-600/10', border: 'border-gray-400/40', icon: 'text-gray-300' },
    bronze: { bg: 'from-orange-700/20 to-orange-900/10', border: 'border-orange-700/40', icon: 'text-orange-500' },
  };
  const c = colors[medalColor];

  return (
    <div className="flex flex-col items-center" style={{ width: '32%' }}>
      <div className="mb-2">
        {medalColor === 'gold' ? <Crown className={`w-6 h-6 ${c.icon}`} /> : <Medal className={`w-5 h-5 ${c.icon}`} />}
      </div>
      <div className="w-12 h-12 rounded-xl bg-forestdark-700/60 border border-white/10 flex items-center justify-center mb-2">
        <RobotAvatar id={entry.avatar} size={36} />
      </div>
      <p className="text-white font-medium text-xs text-center truncate w-full mb-1">{entry.name}</p>
      <p className="text-cyanneon-300 font-display font-bold text-sm mb-2">{entry.xp.toLocaleString()} XP</p>
      <div
        className={`w-full rounded-t-xl bg-gradient-to-b ${c.bg} border-t ${c.border} flex items-start justify-center pt-2`}
        style={{ height }}
      >
        <span className={`font-display font-black text-2xl ${c.icon}`}>{entry.rank}</span>
      </div>
    </div>
  );
}
