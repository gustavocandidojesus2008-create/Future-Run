import { useState } from 'react';
import RobotAvatar from '@/components/RobotAvatar';
import { AVATARS } from '@/constants';
import type { AvatarId, PlayerProfile } from '@/types';
import { ArrowLeft, Check, Trash2, AlertTriangle } from 'lucide-react';

interface Props {
  currentProfile: PlayerProfile | null;
  onSave: (profile: PlayerProfile) => void;
  onBack: () => void;
  onResetProgress: () => void;
}

export default function ProfileScreen({ currentProfile, onSave, onBack, onResetProgress }: Props) {
  const [name, setName] = useState(currentProfile?.name ?? '');
  const [nickname, setNickname] = useState(currentProfile?.nickname ?? '');
  const [avatar, setAvatar] = useState<AvatarId>(currentProfile?.avatar ?? 'robo-pink');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [error, setError] = useState('');

  function handleSave() {
    if (!name.trim()) {
      setError('Digite seu nome');
      return;
    }
    if (!nickname.trim()) {
      setError('Escolha um apelido');
      return;
    }
    onSave({
      name: name.trim(),
      nickname: nickname.trim(),
      avatar,
      createdAt: currentProfile?.createdAt ?? Date.now(),
    });
    onBack();
  }

  function handleReset() {
    onResetProgress();
    setShowResetConfirm(false);
    onBack();
  }

  return (
    <div className="min-h-screen bg-forestdark-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-pinkneon-900/30 to-transparent" />

      <div className="relative z-10 min-h-screen flex flex-col px-6 py-8 max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl glass flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="font-display font-black text-xl text-white tracking-wide">
            {currentProfile ? 'EDITAR PERFIL' : 'CRIAR PERFIL'}
          </h1>
        </div>

        {/* Avatar preview */}
        <div className="flex flex-col items-center mb-8 animate-pop-in">
          <div className="w-32 h-32 rounded-3xl glass-pink flex items-center justify-center mb-3 box-glow-pink">
            <RobotAvatar id={avatar} size={100} animated />
          </div>
          <p className="text-cyanneon-300 font-medium text-sm">{AVATARS.find(a => a.id === avatar)?.name}</p>
        </div>

        {/* Avatar selection */}
        <div className="mb-6">
          <label className="text-white/60 text-sm font-medium mb-3 block">Escolha seu robô</label>
          <div className="grid grid-cols-5 gap-2">
            {AVATARS.map(a => (
              <button
                key={a.id}
                onClick={() => setAvatar(a.id)}
                className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                  avatar === a.id
                    ? 'bg-pinkneon-500/20 border-2 border-pinkneon-400 box-glow-pink scale-105'
                    : 'glass border border-white/10 hover:border-white/30'
                }`}
              >
                <RobotAvatar id={a.id} size={36} />
              </button>
            ))}
          </div>
        </div>

        {/* Name input */}
        <div className="mb-4">
          <label className="text-white/60 text-sm font-medium mb-2 block">Nome</label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            maxLength={20}
            placeholder="Seu nome"
            className="w-full bg-forestdark-800/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-pinkneon-400 focus:outline-none transition-colors font-medium"
          />
        </div>

        {/* Nickname input */}
        <div className="mb-6">
          <label className="text-white/60 text-sm font-medium mb-2 block">Apelido</label>
          <input
            type="text"
            value={nickname}
            onChange={e => { setNickname(e.target.value); setError(''); }}
            maxLength={15}
            placeholder="Como te chamam na floresta?"
            className="w-full bg-forestdark-800/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-cyanneon-400 focus:outline-none transition-colors font-medium"
          />
        </div>

        {error && (
          <p className="text-pinkneon-400 text-sm mb-4 text-center font-medium">{error}</p>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-pinkneon-500 to-cyanneon-500 text-white font-display font-bold tracking-wide hover:scale-[1.02] transition-transform box-glow-pink mb-4 flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          SALVAR PERFIL
        </button>

        {/* Reset progress */}
        {currentProfile && (
          <div className="mt-auto pt-4">
            {showResetConfirm ? (
              <div className="glass-pink rounded-xl p-4 animate-pop-in">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-pinkneon-400" />
                  <p className="text-white font-medium text-sm">Apagar todo o progresso?</p>
                </div>
                <p className="text-white/50 text-xs mb-3">Isso vai apagar todas as corridas, conquistas e estatísticas. Seu perfil será mantido.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-2.5 rounded-lg glass text-white font-medium text-sm hover:bg-white/10 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2.5 rounded-lg bg-pinkneon-600 text-white font-bold text-sm hover:bg-pinkneon-700 transition-colors"
                  >
                    Apagar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-3 rounded-xl glass text-pinkneon-300 font-medium text-sm flex items-center justify-center gap-2 hover:bg-pinkneon-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Resetar Progresso
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
