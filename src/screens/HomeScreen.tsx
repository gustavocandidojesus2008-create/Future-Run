import RobotAvatar from '@/components/RobotAvatar';
import { COVER_IMAGE, xpForLevel } from '@/constants';
import type { SaveData, ScreenName } from '@/types';
import { Bot, Play, Trophy, Medal, User, ChevronRight, Zap } from 'lucide-react';

interface Props {
  save: SaveData;
  onNavigate: (screen: ScreenName) => void;
}

export default function HomeScreen({ save, onNavigate }: Props) {
  const profile = save.profile;
  const nextLevelXP = xpForLevel(save.level + 1);
  const prevLevelXP = xpForLevel(save.level);
  const levelProgress = save.stats.totalXP - prevLevelXP;
  const levelTotal = nextLevelXP - prevLevelXP;
  const progressPct = Math.min((levelProgress / levelTotal) * 100, 100);

  const unlockedCount = Object.values(save.achievements).filter(a => a.unlocked).length;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Cover background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${COVER_IMAGE})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-forestdark-900/60 via-forestdark-900/80 to-forestdark-900" />
      <div className="absolute inset-0 bg-grid opacity-30" />

      <div className="relative z-10 min-h-screen flex flex-col px-6 py-8 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-pinkneon-500/20 border border-pinkneon-500/40 flex items-center justify-center box-glow-pink">
              <Bot className="w-6 h-6 text-pinkneon-400" />
            </div>
            <div>
              <h1 className="font-display font-black text-xl text-white tracking-wider">FUTURE RUN</h1>
              <p className="text-xs text-cyanneon-300/80 font-medium">Corrida Futurista</p>
            </div>
          </div>
          {profile && (
            <button
              onClick={() => onNavigate('profile')}
              className="w-12 h-12 rounded-xl glass-pink flex items-center justify-center hover:scale-105 transition-transform"
            >
              <RobotAvatar id={profile.avatar} size={36} />
            </button>
          )}
        </div>

        {/* Profile card or welcome */}
        {profile ? (
          <div className="glass-pink rounded-2xl p-5 mb-6 animate-slide-up">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-forestdark-700/60 border border-pinkneon-500/30 flex items-center justify-center">
                <RobotAvatar id={profile.avatar} size={56} animated />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-display font-bold text-lg truncate">{profile.name}</p>
                <p className="text-cyanneon-300 text-sm font-medium truncate">"{profile.nickname}"</p>
                <p className="text-pinkneon-300/70 text-xs mt-1">Explorador Nível {save.level}</p>
              </div>
            </div>
            {/* Level progress */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-white/60 font-medium">XP Total: {save.stats.totalXP.toLocaleString()}</span>
                <span className="text-xs text-cyanneon-300 font-semibold">{levelProgress} / {levelTotal} XP</span>
              </div>
              <div className="h-2.5 bg-forestdark-900/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pinkneon-500 to-cyanneon-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-pink rounded-2xl p-6 mb-6 text-center animate-slide-up">
            <RobotAvatar id="robo-pink" size={72} animated className="mx-auto mb-3" />
            <h2 className="font-display font-bold text-xl text-white mb-2">Bem-vindo, Explorador!</h2>
            <p className="text-white/60 text-sm mb-4">Crie seu perfil para começar sua aventura na floresta mágica</p>
            <button
              onClick={() => onNavigate('profile')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pinkneon-500 to-pinkneon-600 text-white font-display font-bold tracking-wide hover:scale-[1.02] transition-transform box-glow-pink"
            >
              CRIAR PERFIL
            </button>
          </div>
        )}

        {/* Play button - big */}
        <button
          onClick={() => onNavigate('play')}
          disabled={!profile}
          className="relative group mb-6 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-pinkneon-500 to-cyanneon-400 rounded-2xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity" />
          <div className="relative bg-gradient-to-r from-pinkneon-500 to-cyanneon-500 rounded-2xl py-6 px-8 flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform">
            <Play className="w-8 h-8 text-white fill-white" />
            <span className="font-display font-black text-2xl text-white tracking-widest">JOGAR</span>
          </div>
        </button>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard icon={Trophy} label="Recorde" value={save.stats.bestXP.toLocaleString()} color="pink" />
          <StatCard icon={Zap} label="Corridas" value={String(save.stats.totalRuns)} color="cyan" />
          <StatCard icon={Medal} label="Conquistas" value={`${unlockedCount}/${save.achievements ? Object.keys(save.achievements).length : 0}`} color="pink" />
        </div>

        {/* Navigation buttons */}
        <div className="space-y-3 mt-auto">
          <NavButton icon={User} label="Perfil do Explorador" onClick={() => onNavigate('profile')} />
          <NavButton icon={Medal} label="Conquistas" onClick={() => onNavigate('achievements')} />
          <NavButton icon={Trophy} label="Ranking" onClick={() => onNavigate('ranking')} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Bot; label: string; value: string; color: 'pink' | 'cyan' }) {
  return (
    <div className={`glass rounded-xl p-3 text-center ${color === 'pink' ? 'border-pinkneon-500/20' : 'border-cyanneon-400/20'}`}>
      <Icon className={`w-5 h-5 mx-auto mb-1 ${color === 'pink' ? 'text-pinkneon-400' : 'text-cyanneon-400'}`} />
      <p className="font-display font-bold text-white text-lg">{value}</p>
      <p className="text-white/50 text-xs">{label}</p>
    </div>
  );
}

function NavButton({ icon: Icon, label, onClick }: { icon: typeof Bot; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full glass rounded-xl py-4 px-5 flex items-center justify-between hover:bg-white/5 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-cyanneon-400" />
        <span className="text-white font-medium">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-pinkneon-400 group-hover:translate-x-1 transition-all" />
    </button>
  );
}
