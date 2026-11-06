import { useEffect, useRef, useState, useCallback } from 'react';
import GameCanvas, { type GameCanvasHandle } from '@/components/GameCanvas';
import RobotAvatar from '@/components/RobotAvatar';
import type { AvatarId, RunResult, RunRecord } from '@/types';
import { xpForLevel } from '@/constants';
import { ArrowLeft, Pause, Play, RotateCcw, Home, Zap, Clock, Trophy, Footprints, ChevronUp } from 'lucide-react';

interface Props {
  avatar: AvatarId;
  onExit: () => void;
  onRecordRun: (run: RunRecord) => void;
}

type GameState = 'ready' | 'playing' | 'paused' | 'gameover';

export default function PlayScreen({ avatar, onExit, onRecordRun }: Props) {
  const canvasRef = useRef<GameCanvasHandle>(null);
  const [state, setState] = useState<GameState>('ready');
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [result, setResult] = useState<RunResult | null>(null);
  const [levelUpFlash, setLevelUpFlash] = useState(false);
  const scoreRef = useRef({ xp: 0, level: 1 });

  const handleScoreUpdate = useCallback((newXp: number, newLevel: number) => {
    scoreRef.current = { xp: newXp, level: newLevel };
    setXp(newXp);
    setLevel(newLevel);
  }, []);

  const handleLevelUp = useCallback((newLevel: number) => {
    setLevelUpFlash(true);
    setTimeout(() => setLevelUpFlash(false), 1500);
  }, []);

  const handleGameOver = useCallback((res: RunResult) => {
    setResult(res);
    setState('gameover');
    const run: RunRecord = {
      id: `run-${Date.now()}`,
      xp: res.xp,
      level: res.level,
      duration: res.duration,
      orbsCollected: res.orbsCollected,
      jumps: res.jumps,
      date: Date.now(),
    };
    onRecordRun(run);
  }, [onRecordRun]);

  const startGame = useCallback(() => {
    setState('playing');
    setXp(0);
    setLevel(1);
    setResult(null);
    scoreRef.current = { xp: 0, level: 1 };
    canvasRef.current?.start();
  }, []);

  const pauseGame = useCallback(() => {
    canvasRef.current?.pause();
    setState('paused');
  }, []);

  const resumeGame = useCallback(() => {
    canvasRef.current?.resume();
    setState('playing');
  }, []);

  const restartGame = useCallback(() => {
    canvasRef.current?.stop();
    setState('playing');
    setXp(0);
    setLevel(1);
    setResult(null);
    scoreRef.current = { xp: 0, level: 1 };
    setTimeout(() => canvasRef.current?.start(), 50);
  }, []);

  const exitGame = useCallback(() => {
    canvasRef.current?.stop();
    onExit();
  }, [onExit]);

  // Keyboard controls
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (state !== 'playing') return;
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        canvasRef.current?.jump();
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        canvasRef.current?.duck(true);
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        pauseGame();
      }
    }
    function handleKeyUp(e: KeyboardEvent) {
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        canvasRef.current?.duck(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [state, pauseGame]);

  // Touch controls
  const touchAreaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state !== 'playing') return;
    const el = touchAreaRef.current;
    if (!el) return;

    let touchStartY = 0;
    let isDucking = false;

    function handleTouchStart(e: TouchEvent) {
      e.preventDefault();
      const touch = e.touches[0];
      touchStartY = touch.clientY;
      const rect = el!.getBoundingClientRect();
      const relativeY = touch.clientY - rect.top;
      // Upper 70% = jump, lower 30% = duck
      if (relativeY < rect.height * 0.7) {
        canvasRef.current?.jump();
      } else {
        isDucking = true;
        canvasRef.current?.duck(true);
      }
    }
    function handleTouchMove(e: TouchEvent) {
      e.preventDefault();
      if (!isDucking) return;
      const touch = e.touches[0];
      const dy = touch.clientY - touchStartY;
      if (dy < -30) {
        isDucking = false;
        canvasRef.current?.duck(false);
        canvasRef.current?.jump();
      }
    }
    function handleTouchEnd(e: TouchEvent) {
      e.preventDefault();
      if (isDucking) {
        isDucking = false;
        canvasRef.current?.duck(false);
      }
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [state]);

  const nextLevelXP = xpForLevel(level + 1);
  const prevLevelXP = xpForLevel(level);
  const levelProgress = xp - prevLevelXP;
  const levelTotal = nextLevelXP - prevLevelXP;
  const progressPct = Math.min((levelProgress / levelTotal) * 100, 100);

  return (
    <div className="min-h-screen bg-forestdark-900 relative overflow-hidden flex flex-col">
      {/* Touch area */}
      <div ref={touchAreaRef} className="absolute inset-0 z-0">
        <GameCanvas
          ref={canvasRef}
          avatar={avatar}
          onScoreUpdate={handleScoreUpdate}
          onGameOver={handleGameOver}
          onLevelUp={handleLevelUp}
        />
      </div>

      {/* HUD */}
      {state === 'playing' && (
        <>
          <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-4 pointer-events-none">
            <div className="flex items-start justify-between">
              {/* XP and Level */}
              <div className="glass rounded-xl px-4 py-2 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-pinkneon-500/20 border border-pinkneon-500/40 flex items-center justify-center">
                  <span className="font-display font-bold text-pinkneon-400 text-sm">{level}</span>
                </div>
                <div>
                  <p className="font-display font-bold text-white text-lg leading-none">{xp.toLocaleString()}</p>
                  <p className="text-cyanneon-300/70 text-xs">XP</p>
                </div>
              </div>

              {/* Pause button */}
              <button
                onClick={pauseGame}
                className="w-11 h-11 rounded-xl glass flex items-center justify-center pointer-events-auto hover:bg-white/10 transition-colors"
              >
                <Pause className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Level progress bar */}
            <div className="mt-2 max-w-[200px]">
              <div className="h-1.5 bg-forestdark-900/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pinkneon-500 to-cyanneon-400 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Level up flash */}
          {levelUpFlash && (
            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
              <div className="animate-pop-in">
                <div className="bg-gradient-to-r from-pinkneon-500 to-cyanneon-400 rounded-2xl px-8 py-4 box-glow-pink">
                  <p className="font-display font-black text-2xl text-white tracking-widest text-glow-pink">NÍVEL {level}!</p>
                </div>
              </div>
            </div>
          )}

          {/* Mobile hint */}
          <div className="absolute bottom-4 left-0 right-0 z-20 text-center pointer-events-none">
            <p className="text-white/30 text-xs">Toque na tela para pular • Deslize para baixo para agachar</p>
          </div>
        </>
      )}

      {/* Ready overlay */}
      {state === 'ready' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-forestdark-900/80 backdrop-blur-sm">
          <div className="w-28 h-28 rounded-3xl glass-pink flex items-center justify-center mb-6 box-glow-pink animate-float">
            <RobotAvatar id={avatar} size={90} animated />
          </div>
          <h2 className="font-display font-black text-3xl text-white tracking-widest mb-2 text-glow-pink">PRONT?</h2>
          <p className="text-white/60 text-sm mb-8 max-w-xs text-center">Use ESPAÇO ou toque na tela para pular. Deslize para baixo para agachar.</p>
          <div className="flex gap-3">
            <button
              onClick={exitGame}
              className="px-5 py-3 rounded-xl glass text-white font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </button>
            <button
              onClick={startGame}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-pinkneon-500 to-cyanneon-500 text-white font-display font-bold tracking-wide hover:scale-105 transition-transform box-glow-pink flex items-center gap-2"
            >
              <Play className="w-5 h-5 fill-white" />
              COMEÇAR
            </button>
          </div>
        </div>
      )}

      {/* Paused overlay */}
      {state === 'paused' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-forestdark-900/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-pink rounded-3xl p-8 max-w-sm w-full mx-6 animate-slide-up">
            <h2 className="font-display font-black text-2xl text-white tracking-wide text-center mb-6">PAUSADO</h2>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="text-center">
                <Zap className="w-5 h-5 text-cyanneon-400 mx-auto mb-1" />
                <p className="font-display font-bold text-white">{xp.toLocaleString()}</p>
                <p className="text-white/40 text-xs">XP</p>
              </div>
              <div className="text-center">
                <ChevronUp className="w-5 h-5 text-pinkneon-400 mx-auto mb-1" />
                <p className="font-display font-bold text-white">{level}</p>
                <p className="text-white/40 text-xs">Nível</p>
              </div>
            </div>
            <div className="space-y-3">
              <button
                onClick={resumeGame}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pinkneon-500 to-cyanneon-500 text-white font-display font-bold tracking-wide hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-white" />
                CONTINUAR
              </button>
              <button
                onClick={restartGame}
                className="w-full py-3 rounded-xl glass text-white font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Reiniciar
              </button>
              <button
                onClick={exitGame}
                className="w-full py-3 rounded-xl glass text-white font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game over overlay */}
      {state === 'gameover' && result && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-forestdark-900/85 backdrop-blur-sm animate-fade-in px-6">
          <div className="glass-pink rounded-3xl p-6 max-w-sm w-full animate-slide-up">
            <div className="text-center mb-6">
              <Trophy className="w-12 h-12 text-pinkneon-400 mx-auto mb-2" />
              <h2 className="font-display font-black text-2xl text-white tracking-wide">FIM DA CORRIDA</h2>
            </div>

            {/* Big score */}
            <div className="text-center mb-6">
              <p className="font-display font-black text-5xl text-transparent bg-clip-text bg-gradient-to-r from-pinkneon-400 to-cyanneon-400">
                {result.xp.toLocaleString()}
              </p>
              <p className="text-cyanneon-300 font-medium text-sm">XP Total</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <ResultStat icon={ChevronUp} label="Nível" value={String(result.level)} />
              <ResultStat icon={Clock} label="Tempo" value={`${result.duration}s`} />
              <ResultStat icon={Zap} label="Orbes" value={String(result.orbsCollected)} />
              <ResultStat icon={Footprints} label="Pulos" value={String(result.jumps)} />
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={restartGame}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-pinkneon-500 to-cyanneon-500 text-white font-display font-bold tracking-wide hover:scale-[1.02] transition-transform box-glow-pink flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                JOGAR NOVAMENTE
              </button>
              <button
                onClick={exitGame}
                className="w-full py-3 rounded-xl glass text-white font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Voltar ao Início
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultStat({ icon: Icon, label, value }: { icon: typeof Zap; label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-3 text-center">
      <Icon className="w-4 h-4 text-cyanneon-400 mx-auto mb-1" />
      <p className="font-display font-bold text-white text-lg">{value}</p>
      <p className="text-white/40 text-xs">{label}</p>
    </div>
  );
}
