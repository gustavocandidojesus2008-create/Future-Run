import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { FutureRunGame } from '@/gameEngine';
import type { AvatarId, RunResult } from '@/types';

export interface GameCanvasHandle {
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  jump: () => void;
  duck: (active: boolean) => void;
}

interface Props {
  avatar: AvatarId;
  onScoreUpdate: (xp: number, level: number) => void;
  onGameOver: (result: RunResult) => void;
  onLevelUp: (level: number) => void;
}

const GameCanvas = forwardRef<GameCanvasHandle, Props>(
  ({ avatar, onScoreUpdate, onGameOver, onLevelUp }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const gameRef = useRef<FutureRunGame | null>(null);
    const callbacksRef = useRef({ onScoreUpdate, onGameOver, onLevelUp, avatar });

    callbacksRef.current = { onScoreUpdate, onGameOver, onLevelUp, avatar };

    useImperativeHandle(ref, () => ({
      start: () => gameRef.current?.start(),
      pause: () => gameRef.current?.pause(),
      resume: () => gameRef.current?.resume(),
      stop: () => gameRef.current?.stop(),
      jump: () => gameRef.current?.jump(),
      duck: (active: boolean) => gameRef.current?.duck(active),
    }));

    useEffect(() => {
      if (!canvasRef.current) return;
      const game = new FutureRunGame(canvasRef.current, {
        avatar: callbacksRef.current.avatar,
        onScoreUpdate: (xp, level) => callbacksRef.current.onScoreUpdate(xp, level),
        onGameOver: (result) => callbacksRef.current.onGameOver(result),
        onLevelUp: (level) => callbacksRef.current.onLevelUp(level),
      });
      gameRef.current = game;

      const handleResize = () => game.resize();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        game.destroy();
        gameRef.current = null;
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        className="w-full h-full block touch-none"
        style={{ imageRendering: 'auto' }}
      />
    );
  }
);

GameCanvas.displayName = 'GameCanvas';
export default GameCanvas;
